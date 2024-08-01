import { create } from 'xmlbuilder2';
import { v4 as uuidv4 } from 'uuid';
import Dinero, { Currency } from 'dinero.js'
import { Address } from '../../lib/types.js';

// New types for SWIFT wire transfers
export interface SWIFTWireCreditTransfer {
    id?: string;
    amount: number;
    currency: string;
    debtor: Party;
    debtorAccount: Account;
    creditor: Party;
    creditorAccount: Account;
    intermediaryBank?: FinancialInstitution;
    remittanceInformation?: string;
}

export interface Party {
    name: string;
    address: Address;
    countryCode: string;
}

export interface Account {
    iban: string;
    currency: string;
}

export interface FinancialInstitution {
    bic: string;
    name: string;
    address?: Address;
}

export interface SWIFTConfig {
    initiatingPartyName: string;
    initiatingPartyId: string;
    debtorAgent: FinancialInstitution;
}

export class SWIFTWireCreditTransfer {
    private messageId: string = uuidv4().replace(/-/g, '').substring(0, 35);
    private creationDate = new Date();
    private transactions: SWIFTWireCreditTransfer[];
    private config: SWIFTConfig;

    constructor(transactions: SWIFTWireCreditTransfer[], config: SWIFTConfig) {
        this.transactions = transactions;
        this.config = config;
        this.validate();
    }

    private validate() {
        if (this.messageId.length > 35) {
            throw new Error('messageId must not exceed 35 characters');
        }
        // Add more validation as needed
    }

    private party(party: Party) {
        return {
            Nm: party.name,
            PstlAdr: {
                StrtNm: party.address.streetName,
                BldgNb: party.address.buildingNumber,
                PstCd: party.address.postCode,
                TwnNm: party.address.townName,
                Ctry: party.address.country
            },
            CtryOfRes: party.countryCode
        };
    }

    private account(account: Account) {
        return {
            Id: {
                IBAN: account.iban
            },
            Ccy: account.currency
        };
    }

    private financialInstitution(fi: FinancialInstitution) {
        const result: any = {
            FinInstnId: {
                BIC: fi.bic,
                Nm: fi.name
            }
        };
        if (fi.address) {
            result.FinInstnId.PstlAdr = {
                StrtNm: fi.address.streetName,
                BldgNb: fi.address.buildingNumber,
                PstCd: fi.address.postCode,
                TwnNm: fi.address.townName,
                Ctry: fi.address.country
            };
        }
        return result;
    }

    private paymentInformation(wireTransfer: SWIFTWireCreditTransfer) {
        const paymentId = wireTransfer.id || uuidv4();
        const amount = Dinero({
            amount: wireTransfer.amount,
            currency: wireTransfer.currency
        }).toUnit();

        return {
            PmtInfId: paymentId,
            PmtMtd: 'TRF',
            BtchBookg: 'false',
            PmtTpInf: {
                InstrPrty: 'NORM',
                SvcLvl: {
                    Cd: 'URGP'
                },
            },
            ReqdExctnDt: this.creationDate.toISOString().split('T')[0],
            Dbtr: this.party(wireTransfer.debtor),
            DbtrAcct: this.account(wireTransfer.debtorAccount),
            DbtrAgt: this.financialInstitution(this.config.debtorAgent),
            ChrgBr: 'SHAR',
            CdtTrfTxInf: {
                PmtId: {
                    InstrId: paymentId,
                    EndToEndId: paymentId
                },
                Amt: {
                    InstdAmt: {
                        '#': amount,
                        '@Ccy': wireTransfer.currency
                    }
                },
                IntrmyAgt1: wireTransfer.intermediaryBank ? this.financialInstitution(wireTransfer.intermediaryBank) : undefined,
                CdtrAgt: this.financialInstitution({
                    bic: wireTransfer.creditorAccount.iban.slice(4, 12),
                    name: `${wireTransfer.creditor.name}'s Bank`
                }),
                Cdtr: this.party(wireTransfer.creditor),
                CdtrAcct: this.account(wireTransfer.creditorAccount),
                RmtInf: wireTransfer.remittanceInformation ? {
                    Ustrd: wireTransfer.remittanceInformation
                } : undefined
            }
        };
    }

    public serialize(): string {
        const payments = this.transactions.map(payment => this.paymentInformation(payment));

        const xmlObj = {
            Document: {
                '@xmlns': 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03',
                CstmrCdtTrfInitn: {
                    GrpHdr: {
                        MsgId: this.messageId,
                        CreDtTm: this.creationDate.toISOString(),
                        NbOfTxs: this.transactions.length.toString(),
                        InitgPty: {
                            Nm: this.config.initiatingPartyName,
                            Id: {
                                OrgId: {
                                    Othr: {
                                        Id: this.config.initiatingPartyId
                                    }
                                }
                            }
                        }
                    },
                    PmtInf: payments
                }
            }
        };

        const doc = create(xmlObj);
        return doc.end({ prettyPrint: true });
    }
}