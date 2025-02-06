import {
    Party,
    IBANAccount,
    BICAgent,
    Account,
    BaseAccount,
    Agent,
    ABAAgent,
  } from '../../lib/types';
  
  /**
   * Abstract base class for ISO20022 payment initiation (PAIN) messages.
   * @abstract
   */
  export abstract class PaymentInitiation {
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
      const result: any = {
        Nm: party.name,
      };
  
      // Only include address information if it exists
      if (party.address) {
        result.PstlAdr = {
          StrtNm: party.address.streetName,
          BldgNb: party.address.buildingNumber,
          PstCd: party.address.postalCode,
          TwnNm: party.address.townName,
          CtrySubDvsn: party.address.countrySubDivision,
          Ctry: party.address.country,
        };
      }
  
      return result;
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
            Id: (account as BaseAccount).accountNumber,
          },
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
          IBAN: account.iban,
        },
      };
    }
  
    /**
     * Formats an agent according to ISO20022 standards.
     * This method handles both BIC and ABA agents.
     *
     * @param {Agent} agent - The agent to be formatted. Can be either a BICAgent or an ABAAgent.
     * @returns {Object} An object representing the formatted agent information.
     *                   For BIC agents, it returns an object with a BIC identifier.
     *                   For ABA agents, it returns an object with clearing system member identification.
     *
     * @example
     * // For a BIC agent
     * agent({ bic: 'BOFAUS3NXXX' })
     * // Returns: { FinInstnId: { BIC: 'BOFAUS3NXXX' } }
     *
     * @example
     * // For an ABA agent
     * agent({ routingNumber: '026009593' })
     * // Returns: { FinInstnId: { ClrSysMmbId: { MmbId: '026009593' } } }
     */
    agent(agent: Agent) {
      if ((agent as BICAgent).bic !== undefined) {
        return {
          FinInstnId: {
            BIC: (agent as BICAgent).bic,
          },
        };
      } else {
        return {
          FinInstnId: {
            ClrSysMmbId: {
              MmbId: (agent as ABAAgent).routingNumber,
            },
          },
        };
      }
    }
  
    /**
     * Returns the string representation of the payment initiation.
     * @returns {string} The serialized payment initiation.
     */
    toString() {
      return this.serialize();
    }
  }

  
