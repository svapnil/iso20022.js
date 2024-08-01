import { create } from 'xmlbuilder2';
import { v4 as uuidv4 } from 'uuid';
import Dinero, { Currency } from 'dinero.js'
import { StructuredAddress, Party, Agent, BICAgent, IBANAccount, SWIFTCreditPaymentInstruction } from '../../lib/types.js';
import { ISO20022PaymentInitiation } from './ISO20022PaymentInitiation';
import { sanitize } from '../../utils/format';

export interface SWIFTCreditPaymentInitiationConfig {
    initiatingParty: Party;
    paymentInstructions: SWIFTCreditPaymentInstruction[];
    messageId?: string;
    creationDate?: Date;
}

export class SWIFTCreditPaymentInitiation extends ISO20022PaymentInitiation {
    private initiatingParty: Party;
    private messageId;
    private creationDate;
    private paymentInstructions: SWIFTCreditPaymentInstruction[];
    // private config: SWIFTCreditPaymentInitiationConfig;

    constructor(config: SWIFTCreditPaymentInitiationConfig) {
        super();
        this.initiatingParty = config.initiatingParty;
        this.paymentInstructions = config.paymentInstructions;
        this.messageId = config.messageId || uuidv4().replace(/-/g, '').substring(0, 35);
        this.creationDate = config.creationDate || new Date();
        this.validate();
    }

    private validate() {
        if (this.messageId.length > 35) {
            throw new Error('messageId must not exceed 35 characters');
        }
        // Add more validation as needed
    }

    paymentInformation(paymentInstruction: SWIFTCreditPaymentInstruction) {
        const paymentInfId = sanitize(paymentInstruction.id || uuidv4(), 35);
        const amount = Dinero({
            amount: paymentInstruction.amount,
            currency: paymentInstruction.currency
        }).toUnit();

        return {
            PmtInfId: paymentInfId,
            PmtMtd: 'TRF',
            BtchBookg: 'false',
            PmtTpInf: {
                InstrPrty: 'NORM',
                SvcLvl: {
                    Cd: 'URGP'
                },
            },
            ReqdExctnDt: this.creationDate.toISOString().split('T')[0],
            Dbtr: this.party(this.initiatingParty),
            DbtrAcct: this.internationalAccount(this.initiatingParty.account as IBANAccount),
            DbtrAgt: this.bicAgent(this.initiatingParty.agent as BICAgent),
            ChrgBr: 'SHAR',
            CdtTrfTxInf: {
                PmtId: {
                    InstrId: paymentInfId,
                    EndToEndId: paymentInfId
                },
                Amt: {
                    InstdAmt: {
                        '#': amount,
                        '@Ccy': paymentInstruction.currency
                    }
                },
                // IntrmyAgt1: paymentInstruction.intermediaryBank ? this.financialInstitution(paymentInstruction.intermediaryBank) : undefined,
                CdtrAgt: this.bicAgent(paymentInstruction.creditor.agent as BICAgent),
                Cdtr: this.party(paymentInstruction.creditor as Party),
                CdtrAcct: this.internationalAccount(paymentInstruction.creditor.account as IBANAccount),
                RmtInf: paymentInstruction.remittanceInformation ? {
                    Ustrd: paymentInstruction.remittanceInformation
                } : undefined
            }
        };
    }

    public serialize(): string {
        const paymentsInstructions = this.paymentInstructions.map(p => this.paymentInformation(p));

        const xmlObj = {
            Document: {
                '@xmlns': 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03',
                CstmrCdtTrfInitn: {
                    GrpHdr: {
                        MsgId: this.messageId,
                        CreDtTm: this.creationDate.toISOString(),
                        NbOfTxs: this.paymentInstructions.length.toString(),
                        InitgPty: {
                            Nm: this.initiatingParty.name,
                            Id: {
                                OrgId: {
                                    Othr: {
                                        Id: this.initiatingParty.id
                                    }
                                }
                            }
                        }
                    },
                    PmtInf: paymentsInstructions
                }
            }
        };

        const doc = create(xmlObj);
        return doc.end({ prettyPrint: true });
    }
}