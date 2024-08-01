import { Party, IBANAccount, BICAgent } from '../../lib/types';

export abstract class ISO20022PaymentInitiation {
    abstract serialize(): string;

    party(party: Party) {
        return {
            Nm: party.name,
            PstlAdr: {
                StrtNm: party.address?.streetName,
                BldgNb: party.address?.buildingNumber,
                PstCd: party.address?.postalCode,
                TwnNm: party.address?.townName,
                CtrySubDiv: party.address?.countrySubDivision,
                Ctry: party.address?.country
            },
        };
    }

    internationalAccount(account: IBANAccount) {
        return {
            Id: {
                IBAN: account.iban
            },
        };
    }

    bicAgent(agent: BICAgent) {
        return {
            FinInstnId: {
                BIC: agent.bic,
            }
        };
    }



    toString() {
        return this.serialize();
    }
}