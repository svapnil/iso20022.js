import { Party, IBANAccount, BICAgent } from '../../lib/types';
export declare abstract class ISO20022PaymentInitiation {
    abstract serialize(): string;
    party(party: Party): {
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
    internationalAccount(account: IBANAccount): {
        Id: {
            IBAN: string;
        };
    };
    bicAgent(agent: BICAgent): {
        FinInstnId: {
            BIC: string;
        };
    };
    toString(): string;
}
