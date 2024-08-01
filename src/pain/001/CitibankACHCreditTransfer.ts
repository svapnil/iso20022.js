import { create } from 'xmlbuilder2';
import { v4 } from 'uuid';
import { Decimal } from 'decimal.js';
import { CreditACHPayment, Party, Account } from '../../lib/types.js';
import Dinero, { Currency } from 'dinero.js'


export interface CitibankConfig {
    originatingPartyName: string
    originatingPartyAccount: Account
}

export class CitibankACHCreditTransfer {
    private messageId: string = v4().replace(/-/g, '').substring(0, 35);
    private creationDate = new Date();
    private transactions: CreditACHPayment[];
    private currency: Currency;
    private config: CitibankConfig;

    constructor(transactions: CreditACHPayment[], config: CitibankConfig) {
        this.transactions = transactions
        this.currency = transactions[0].currency
        this.config = config

        this.validate()
    }

    validate() {
        if (this.messageId.length > 35) {
            throw new Error('messageId must not exceed 35 characters');
        }

        // Add currency validation
        const currencies = new Set(this.transactions.map(t => t.currency));
        if (currencies.size > 1) {
            throw new Error('All transactions must have the same currency');
        }
    }



    party(party: Party) {
        return {
            Nm: party.name,
            PstlAdr: {
                StrtNm: party.address.line1
            }
        }
    }

    account(account: Account) {
        return {
            Id: {
                Othr: {
                    Id: account.accountNumber
                }
            }
        }
    }

    agent(routingNumber: string) {
        return {
            FinInstnId: {
                ClrSysMmbId: {
                    MmbId: routingNumber
                }
            }
        }
    }

    paymentInformation(creditPayment: CreditACHPayment) {
        const paymentId = creditPayment.id || v4();
        const date = new Date
        const amount = Dinero({
            amount: creditPayment.amount,
            currency: creditPayment.currency
        }).toUnit();
        return {
            PmtInfId: paymentId,
            PmtMtd: 'TRF',
            PmtTpInf: {
                SvcLvl: {
                    Cd: "NURG"
                },
            },
            ReqdExctnDt: date.toISOString().split('T')[0],
            Dbtr: this.party(creditPayment.creditor),
            DbtrAcct: this.account(this.config.originatingPartyAccount),
            DbtrAgt: this.agent(this.config.originatingPartyAccount.routingNumber),
            CdtTrfTxInf: {
                PmtId: {
                    EndToEndId: paymentId
                },
                Amt: {
                    InstdAmt: {
                        "#": amount,
                        "@Ccy": creditPayment.currency
                    },
                },
                CdtrAgt: this.agent(creditPayment.creditorAccount.routingNumber),
                Cdtr: this.party(creditPayment.creditor),
                CdtrAcct: this.account(creditPayment.creditorAccount),
            }
        }
    }

    serialize(): string {
        const payments = this.transactions.map(payment => (
            this.paymentInformation(payment)
        ));

        const xmlObj = {
            Document: {
                '@xmlns': 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03',
                CstmrCdtTrfInitn: {
                    GrpHdr: {
                        MsgId: this.messageId,
                        CreDtTm: this.creationDate.toISOString(),
                        NbOfTxs: this.transactions.length.toString(),
                        CtrlSum: {
                            "#": this.transactions.reduce(
                                (sum, transaction) => sum.add(
                                    Dinero({ amount: transaction.amount, currency: transaction.currency })), 
                                    Dinero({ amount: 0, currency: this.currency })
                                ).toUnit()
                        },
                        InitgPty: {
                            Nm: this.config.originatingPartyName
                        }
                    },
                    PmtInf: payments
                }
            }
        };

        const doc = create(xmlObj);
        return doc.end();
    }
}