import { create } from 'xmlbuilder2';
import { v4 as uuidv4 } from 'uuid';
import Dinero from 'dinero.js';
import {
  Party,
  BICAgent,
  IBANAccount,
  SWIFTCreditPaymentInstruction,
  Account,
} from '../../lib/types.js';
import { PaymentInitiation } from './ISO20022PaymentInitiation';
import { sanitize } from '../../utils/format';

/**
 * Configuration interface for SWIFTCreditPaymentInitiation.
 * @interface SWIFTCreditPaymentInitiationConfig
 */
export interface SWIFTCreditPaymentInitiationConfig {
  /** The party initiating the payment. */
  initiatingParty: Party;
  /** An array of payment instructions. */
  paymentInstructions: SWIFTCreditPaymentInstruction[];
  /** Optional unique identifier for the message. If not provided, a UUID will be generated. */
  messageId?: string;
  /** Optional creation date for the message. If not provided, current date will be used. */
  creationDate?: Date;
}

/**
 * Represents a SWIFT Credit Payment v3 Initiation message (pain.001.001.03).
 * @class
 * @extends PaymentInitiation
 */
export class SWIFTCreditPaymentInitiation extends PaymentInitiation {
  private initiatingParty: Party;
  private messageId: string;
  private creationDate: Date;
  private paymentInstructions: SWIFTCreditPaymentInstruction[];

  /**
   * Creates an instance of SWIFTCreditPaymentInitiation.
   * @param {SWIFTCreditPaymentInitiationConfig} config - The configuration object.
   */
  constructor(config: SWIFTCreditPaymentInitiationConfig) {
    super();
    this.initiatingParty = config.initiatingParty;
    this.paymentInstructions = config.paymentInstructions;
    this.messageId =
      config.messageId || uuidv4().replace(/-/g, '').substring(0, 35);
    this.creationDate = config.creationDate || new Date();
    this.validate();
  }

  /**
   * Validates the payment initiation data has the information required to create a valid XML file.
   * @private
   * @throws {Error} If messageId exceeds 35 characters.
   * @throws {Error} If any creditor has incomplete address information.
   */
  private validate() {
    if (this.messageId.length > 35) {
      throw new Error('messageId must not exceed 35 characters');
    }

    // Validate that all creditors have complete addresses
    // According to spec, the country is required for all addresses
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

    // Add more validation as needed
  }


  /**
   * Generates payment information for a single payment instruction.
   * @param {SWIFTCreditPaymentInstruction} paymentInstruction - The payment instruction.
   * @returns {Object} The credit transfer object.
   */
  creditTransfer(paymentInstruction: SWIFTCreditPaymentInstruction) {
    const paymentInstructionId = sanitize(paymentInstruction.id || uuidv4(), 35);
    const amount = Dinero({
      amount: paymentInstruction.amount,
      currency: paymentInstruction.currency,
    }).toUnit();

    return {
      PmtId: {
        InstrId: paymentInstructionId,
        EndToEndId: paymentInstructionId,
      },
      Amt: {
        InstdAmt: {
          '#': amount,
          '@Ccy': paymentInstruction.currency,
        },
      },
      // TODO: Add support for intermediary bank information
      // This is necessary when the SWIFT Payment needs to be routed through multiple banks in order to reach the recipient
      // intermediaryBanks will probably need to be an array of BICAgents. There needs to be an easy way to get this information for users
      CdtrAgt: this.agent(paymentInstruction.creditor.agent as BICAgent),
      Cdtr: this.party(paymentInstruction.creditor as Party),
      CdtrAcct: this.internationalAccount(
        paymentInstruction.creditor.account as IBANAccount,
      ),
      RmtInf: paymentInstruction.remittanceInformation
        ? {
          Ustrd: paymentInstruction.remittanceInformation,
        }
        : undefined,
    }
  }

  /**
   * Serializes the payment initiation to an XML string.
   * @returns {string} The XML representation of the payment initiation.
   */
  public serialize(): string {
    const paymentInfId = sanitize(uuidv4(), 35);

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
                    Id: this.initiatingParty.id,
                  },
                },
              },
            },
          },
          PmtInf: {
            PmtInfId: paymentInfId,
            PmtMtd: 'TRF',
            BtchBookg: 'false',
            PmtTpInf: {
              InstrPrty: 'NORM',
              SvcLvl: {
                Cd: 'URGP',
              },
            },
            ReqdExctnDt: this.creationDate.toISOString().split('T')[0], // TODO: Check time zone eventually
            Dbtr: this.party(this.initiatingParty),
            DbtrAcct: this.account(this.initiatingParty.account as Account),
            DbtrAgt: this.agent(this.initiatingParty.agent as BICAgent),
            ChrgBr: 'SHAR',
            CdtTrfTxInf: this.paymentInstructions.map(p => this.creditTransfer(p)),
          },
        },
      },
    };

    const doc = create(xmlObj);
    return doc.end({ prettyPrint: true });
  }
}
