import Dinero from 'dinero.js';
import { Party, SWIFTCreditPaymentInstruction } from '../../lib/types.js';
import { ISO20022PaymentInitiation } from './ISO20022PaymentInitiation';
export interface SWIFTCreditPaymentInitiationConfig {
    initiatingParty: Party;
    paymentInstructions: SWIFTCreditPaymentInstruction[];
    messageId?: string;
    creationDate?: Date;
}
export declare class SWIFTCreditPaymentInitiation extends ISO20022PaymentInitiation {
    private initiatingParty;
    private messageId;
    private creationDate;
    private paymentInstructions;
    constructor(config: SWIFTCreditPaymentInitiationConfig);
    private validate;
    paymentInformation(paymentInstruction: SWIFTCreditPaymentInstruction): {
        PmtInfId: string;
        PmtMtd: string;
        BtchBookg: string;
        PmtTpInf: {
            InstrPrty: string;
            SvcLvl: {
                Cd: string;
            };
        };
        ReqdExctnDt: string;
        Dbtr: {
            Nm: string | undefined;
            PstlAdr: {
                StrtNm: string | undefined;
                BldgNb: string | undefined;
                PstCd: string | undefined;
                TwnNm: string | undefined;
                CtrySubDiv: string | undefined;
                Ctry: string | undefined;
            };
        };
        DbtrAcct: {
            Id: {
                IBAN: string;
            };
        };
        DbtrAgt: {
            FinInstnId: {
                BIC: string;
            };
        };
        ChrgBr: string;
        CdtTrfTxInf: {
            PmtId: {
                InstrId: string;
                EndToEndId: string;
            };
            Amt: {
                InstdAmt: {
                    '#': number;
                    '@Ccy': Dinero.Currency;
                };
            };
            CdtrAgt: {
                FinInstnId: {
                    BIC: string;
                };
            };
            Cdtr: {
                Nm: string | undefined;
                PstlAdr: {
                    StrtNm: string | undefined;
                    BldgNb: string | undefined;
                    PstCd: string | undefined;
                    TwnNm: string | undefined;
                    CtrySubDiv: string | undefined;
                    Ctry: string | undefined;
                };
            };
            CdtrAcct: {
                Id: {
                    IBAN: string;
                };
            };
            RmtInf: {
                Ustrd: string;
            } | undefined;
        };
    };
    serialize(): string;
}
