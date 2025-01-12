import { create } from "xmlbuilder2";
import { Account, Agent, BICAgent, IBANAccount, Party, SEPACreditPaymentInstruction } from "../../lib/types";
import { PaymentInitiation } from "./ISO20022PaymentInitiation"
import { sanitize } from "../../utils/format";
import Dinero from 'dinero.js';
import { v4 as uuidv4 } from 'uuid';

type AtLeastOne<T> = [T, ...T[]];

/**
 * Configuration interface for SEPA Credit Payment Initiation.
 * Defines the structure for initiating SEPA credit transfers according to pain.001.001.03 schema.
 * @interface SEPACreditPaymentInitiationConfig
 */
export interface SEPACreditPaymentInitiationConfig {
  /** The party initiating the SEPA credit transfer. */
  initiatingParty: Party;
  /** An array containing at least one payment instruction for SEPA credit transfer. */
  paymentInstructions: AtLeastOne<SEPACreditPaymentInstruction>;
  /** Optional unique identifier for the message. If not provided, a UUID will be generated. */
  messageId?: string;
  /** Optional creation date for the message. If not provided, current date will be used. */
  creationDate?: Date;
}

/**
 * Represents a SEPA Credit Transfer Initiation message (pain.001.001.03).
 * This class handles the creation and serialization of SEPA credit transfer messages
 * according to the ISO20022 standard.
 * @class
 * @extends PaymentInitiation
 */
export class SEPACreditPaymentInitiation extends PaymentInitiation {
  private initiatingParty: Party;
  private messageId: string;
  private creationDate: Date;
  private paymentInstructions: AtLeastOne<SEPACreditPaymentInstruction>;
  private paymentSum: string;

  /**
   * Creates an instance of SEPACreditPaymentInitiation.
   * @param {SEPACreditPaymentInitiationConfig} config - The configuration object for the SEPA credit transfer.
   */
  constructor(config: SEPACreditPaymentInitiationConfig) {
    super();
    this.initiatingParty = config.initiatingParty;
    this.paymentInstructions = config.paymentInstructions;
    this.messageId = config.messageId || uuidv4().replace(/-/g, '');
    this.creationDate = config.creationDate || new Date();
    this.validate();
    this.paymentSum = this.sumPaymentInstructions(this.paymentInstructions as AtLeastOne<SEPACreditPaymentInstruction>);
  }


  // NOTE: Does not work with different currencies. In the meantime we will use a guard.
  // TODO: Figure out what to do with different currencies

  /**
   * Calculates the sum of all payment instructions.
   * @private
   * @param {AtLeastOne<SEPACreditPaymentInstruction>} instructions - Array of payment instructions.
   * @returns {string} The total sum formatted as a string with 2 decimal places.
   * @throws {Error} If payment instructions have different currencies.
   */
  private sumPaymentInstructions(instructions: AtLeastOne<SEPACreditPaymentInstruction>): string {
    const instructionDineros = instructions.map(instruction => Dinero({ amount: instruction.amount, currency: instruction.currency }));
    return instructionDineros.reduce(
      (acc: Dinero.Dinero, next): Dinero.Dinero => {
        return acc.add(next as Dinero.Dinero);
      },
      Dinero({ amount: 0, currency: instructions[0].currency }),
    ).toFormat('0.00');
  }

  /**
   * Validates the payment initiation data according to SEPA requirements.
   * @private
   * @throws {Error} If messageId exceeds 35 characters.
   * @throws {Error} If payment instructions have different currencies.
   * @throws {Error} If any creditor has incomplete address information.
   */
  private validate() {
    if (this.messageId.length > 35) {
      throw new Error('messageId must not exceed 35 characters');
    }

    // TODO: Remove this when we figure out how to run sumPaymentInstructions safely
    if (!this.paymentInstructions.every((i) => {return i.currency === this.paymentInstructions[0].currency})) {
      throw new Error(
        "In order to calculation payment instructions sum, all payment instruction currencies must be the same."
      )
    }

    const creditorWithIncompleteAddress = this.paymentInstructions.find(
      instruction => {
        const address = instruction.creditor.address;
        return !address || !address.country;
      },
    );

    if (creditorWithIncompleteAddress) {
      throw new Error(
        'All creditors must have complete addresses (street name, building number, postal code, town name, and country)',
      );
    }
  }

  /**
   * Generates payment information for a single SEPA credit transfer instruction.
   * @param {SEPACreditPaymentInstruction} instruction - The payment instruction.
   * @returns {Object} The payment information object formatted according to SEPA specifications.
   */
  paymentInformation(instruction: SEPACreditPaymentInstruction) {
    const paymentInstructionId = sanitize(instruction.id || uuidv4(), 35);
    const dinero = Dinero({ amount: instruction.amount, currency: instruction.currency });

    return {
      PmtId: {
        InstrId: paymentInstructionId,
        EndToEndId: paymentInstructionId,
      },
      Amt: {
        InstdAmt: {
          '#': dinero.toFormat('0.00'),
          '@Ccy': instruction.currency,
        },
      },
      CdtrAgt: this.agent(instruction.creditor.agent as BICAgent),
      Cdtr: this.party(instruction.creditor as Party),
      CdtrAcct: {
        Id: { IBAN: (instruction.creditor.account as IBANAccount).iban },
        Ccy: instruction.currency,
      },
      RmtInf: instruction.remittanceInformation ? {
        Ustrd: instruction.remittanceInformation,
      } : undefined,
    };
  }

  /**
   * Serializes the SEPA credit transfer initiation to an XML string.
   * @returns {string} The XML representation of the SEPA credit transfer initiation.
   */
  public serialize(): string {
    const xml = {
      Document: {
        '@xmlns': 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03',
        '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        CstmrCdtTrfInitn: {
          GrpHdr: {
            MsgId: this.messageId,
            CreDtTm: this.creationDate.toISOString(),
            NbOfTxs: this.paymentInstructions.length.toString(),
            CtrlSum: this.paymentSum,
            InitgPty: {
              Nm: this.initiatingParty.name,
              Id: {
                OrgId: {
                  Othr: {
                    Id: this.initiatingParty.id,
                  },
                },
              },
            },
          },
          PmtInf: {
            PmtInfId: `TRF${Date.now()}`,
            PmtMtd: 'TRF',
            NbOfTxs: this.paymentInstructions.length.toString(),
            CtrlSum: this.paymentSum,
            PmtTpInf: {
              SvcLvl: { Cd: 'SEPA' },
              CtgyPurp: { Cd: 'TRAD' },
            },
            ReqdExctnDt: this.creationDate.toISOString().split('T').at(0),
            Dbtr: this.party(this.initiatingParty),
            DbtrAcct: this.account(this.initiatingParty.account as Account),
            DbtrAgt: this.agent(this.initiatingParty.agent as Agent),
            ChrgBr: 'SLEV',
            // payments[]
            CdtTrfTxInf: this.paymentInstructions.map(p => this.paymentInformation(p)),
          }
        }
      },
    };

    const doc = create(xml);
    return doc.end({ prettyPrint: true });
  }

}
