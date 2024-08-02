import { Party, IBANAccount, BICAgent, Account, BaseAccount } from '../../lib/types';

/**
 * Abstract base class for ISO20022 payment initiation (PAIN) messages.
 * @abstract
 */
export abstract class ISO20022PaymentInitiation {
    /**
     * Serializes the payment initiation to a string format.
     * @abstract
     * @returns {string} The serialized payment initiation.
     */
    abstract serialize(): string;

    /**
     * Formats a party's information according to ISO20022 standards.
     * @param {Party} party - The party's information.
     * @returns {Object} Formatted XML party information.
     */
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

    /**
     * Formats an account according to ISO20022 standards.
     * This method handles both IBAN and non-IBAN accounts.
     *
     * @param {Account} account - The account to be formatted. Can be either an IBANAccount or a BaseAccount.
     * @returns {Object} An object representing the formatted account information.
     *                   For IBAN accounts, it returns an object with an IBAN identifier.
     *                   For non-IBAN accounts, it returns an object with an 'Other' identifier.
     *
     * @example
     * // For an IBAN account
     * account({ iban: 'DE89370400440532013000' })
     * // Returns: { Id: { IBAN: 'DE89370400440532013000' } }
     *
     * @example
     * // For a non-IBAN account
     * account({ accountNumber: '1234567890' })
     * // Returns: { Id: { Othr: { Id: '1234567890' } } }
     */
    account(account: Account) {
        if ((account as IBANAccount).iban) {
            return this.internationalAccount(account as IBANAccount);
        }
        return {
            Id: {
                Othr: {
                    Id: (account as BaseAccount).accountNumber
                }
            },
        };
    }

    /**
     * Formats an IBAN account according to ISO20022 standards.
     * @param {IBANAccount} account - The IBAN account information.
     * @returns {Object} Formatted XML IBAN account information.
     */
    internationalAccount(account: IBANAccount) {
        return {
            Id: {
                IBAN: account.iban
            },
        };
    }

    /**
     * Formats a BIC agent according to ISO20022 standards.
     * @param {BICAgent} agent - The BIC agent information.
     * @returns {Object} Formatted XML agent information.
     */
    bicAgent(agent: BICAgent) {
        return {
            FinInstnId: {
                BIC: agent.bic,
            }
        };
    }

    /**
     * Returns the string representation of the payment initiation.
     * @returns {string} The serialized payment initiation.
     */
    toString() {
        return this.serialize();
    }
}