import { Party, SWIFTCreditPaymentInstruction, SEPACreditPaymentInstruction, RTPCreditPaymentInstruction } from './lib/types.js';
import { SWIFTCreditPaymentInitiation } from './pain/001/swift-credit-payment-initiation';
import { SEPACreditPaymentInitiation } from './pain/001/sepa-credit-payment-initiation';
import { RTPCreditPaymentInitiation } from './pain/001/rtp-credit-payment-initiation';

type AtLeastOne<T> = [T, ...T[]];

/**
 * Configuration interface for the ISO20022 class.
 * @interface ISO20022Config
 * @example
 * const config: ISO20022Config = {
 *     initiatingParty: {
 *         name: 'Example Corp',
 *         id: 'EXAMPLECORP',
 *         account: {
 *             accountNumber: '123456789',
 *         },
 *         agent: {
 *             bic: 'CHASUS33',
 *             bankAddress: {
 *                 country: 'US',
 *             },
 *         },
 *     },
 * };
 */
export interface ISO20022Config {
  /**
   * The party initiating the ISO20022 messages.
   * This party is typically the sender of the messages or the entity responsible for the transaction.
   * @type {Party}
   */
  initiatingParty: Party;
}

/**
 * Represents an ISO20022 core message creator.
 * This class provides methods to create various basic ISO20022 compliant messages.
 *
 * @example
 * const iso20022 = new ISO20022({
 *     initiatingParty: {
 *         name: 'Example Corp',
 *         id: 'EXAMPLECORP',
 *         account: {
 *             accountNumber: '123456789',
 *         },
 *         agent: {
 *             bic: 'CHASUS33',
 *             bankAddress: {
 *                 country: 'US',
 *             },
 *         },
 *     },
 * });
 */
class ISO20022 {
  private initiatingParty: Party;

  /**
   * Creates an instance of ISO20022.
   * @param {ISO20022Config} config - The configuration object for ISO20022.
   */
  constructor(config: ISO20022Config) {
    this.initiatingParty = config.initiatingParty;
  }

  /**
   * Creates a SWIFT Credit Payment Initiation message.
   * @param {SWIFTCreditPaymentInstruction[]} paymentInstructions - An array of payment instructions.
   * @example
   * const payment = iso20022.createSWIFTCreditPaymentInitiation([
   *   {
   *     type: 'swift',
   *     direction: 'credit',
   *     amount: 1000,
   *     currency: 'USD',
   *     creditor: {
   *       name: 'Hans Schneider',
   *       account: {
   *         iban: 'DE1234567890123456',
   *       },
   *       agent: {
   *         bic: 'DEUTDEFF',
   *         bankAddress: {
   *           country: 'DE',
   *         },
   *       },
   *       address: {
   *         streetName: 'Hauptstraße',
   *         buildingNumber: '42',
   *         postalCode: '10115',
   *         townName: 'Berlin',
   *         country: 'DE',
   *       },
   *     },
   *     remittanceInformation: 'Invoice payment #123',
   *   },
   * ]);
   * @returns {SWIFTCreditPaymentInitiation} A new SWIFT Credit Payment Initiation object.
   */
  createSWIFTCreditPaymentInitiation(
    paymentInstructions: AtLeastOne<SWIFTCreditPaymentInstruction>,
  ) {
    return new SWIFTCreditPaymentInitiation({
      initiatingParty: this.initiatingParty,
      paymentInstructions: paymentInstructions,
    });
  }

  /**
   * Creates a SEPA Credit Payment Initiation message.
   * @param {SEPACreditPaymentInstruction[]} paymentInstructions - An array of payment instructions.
   * @example
   * const payment = iso20022.createSEPACreditPaymentInitiation([
   *   {
   *     type: 'sepa',
   *     direction: 'credit',
   *     amount: 1000, // €10.00 Euros
   *     currency: 'EUR',
   *     creditor: {
   *       name: 'Hans Schneider',
   *       account: {
   *         iban: 'DE1234567890123456',
   *       },
   *     },
   *     remittanceInformation: 'Invoice payment #123',
   *   },
   * ]);
   * @returns {SEPACreditPaymentInitiation} A new SEPA Credit Payment Initiation object.
   */
  createSEPACreditPaymentInitiation(
    paymentInstructions: AtLeastOne<SEPACreditPaymentInstruction>,
  ) {
    return new SEPACreditPaymentInitiation({
      initiatingParty: this.initiatingParty,
      paymentInstructions: paymentInstructions,
    });
  }

  /**
   * Creates a RTP Credit Payment Initiation message.
   * @param {RTPCreditPaymentInstruction[]} paymentInstructions - An array of payment instructions.
   * @example
   * const payment = iso20022.createRTPCreditPaymentInitiation([
   *   {
   *     type: 'rtp',
   *     direction: 'credit',
   *     amount: 100000, // $1000.00
   *     currency: 'USD',
   *     creditor: {
   *       name: 'All-American Dogs Co.',
   *       account: {
   *         accountNumber: '123456789012',
   *       },
   *       agent: {
   *         abaRoutingNumber: '37714568112',
   *       },
   *     },
   *     remittanceInformation: '1000 Hot Dogs Feb26',
   *   },
   * ]);
   * @returns {RTPCreditPaymentInitiation} A new RTP Credit Payment Initiation object.
   */
  createRTPCreditPaymentInitiation(
    paymentInstructions: AtLeastOne<RTPCreditPaymentInstruction>,
  ) {
    return new RTPCreditPaymentInitiation({
      initiatingParty: this.initiatingParty,
      paymentInstructions: paymentInstructions,
    });
  }
}

export default ISO20022;
