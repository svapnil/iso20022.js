import { v4 as uuidv4 } from 'uuid';
import { create } from 'xmlbuilder2';
import Dinero, { Currency } from 'dinero.js';
import {
  Account,
  BaseAccount,
  BICAgent,
  IBANAccount,
  Party,
  SWIFTCreditPaymentInstruction,
} from '../../lib/types.js';
import { XMLParser } from 'fast-xml-parser';
import { InvalidXmlError, InvalidXmlNamespaceError } from "../../errors";
import { parseAccount, parseAgent, parseAmountToMinorUnits } from "../../parseUtils";
import { Alpha2CountryCode } from "../../lib/countries";
import { PaymentInitiation } from './iso20022-payment-initiation';
import { sanitize } from '../../utils/format';

type AtLeastOne<T> = [T, ...T[]];

/**
 * Configuration interface for SWIFTCreditPaymentInitiation.
 * @interface SWIFTCreditPaymentInitiationConfig
 */
export interface SWIFTCreditPaymentInitiationConfig {
  /** The party initiating the payment. */
  initiatingParty: Party;
  /** An array of payment instructions. */
  paymentInstructions: AtLeastOne<SWIFTCreditPaymentInstruction>;
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
  public initiatingParty: Party;
  public messageId: string;
  public creationDate: Date;
  public paymentInstructions: SWIFTCreditPaymentInstruction[];
  private paymentInformationId: string;

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
    this.paymentInformationId = sanitize(uuidv4(), 35);
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
  creditTransfer(paymentInstruction: SWIFTCreditPaymentInstruction): Record<string, any> {
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
      CdtrAcct: paymentInstruction.creditor.account ? this.account(paymentInstruction.creditor.account as Account) : undefined,
      RmtInf: paymentInstruction.remittanceInformation
        ? {
          Ustrd: paymentInstruction.remittanceInformation,
        }
        : undefined,
    };
  }

  /**
   * Serializes the payment initiation to an XML string.
   * @returns {string} The XML representation of the payment initiation.
   */
  public static fromXML(rawXml: string): SWIFTCreditPaymentInitiation {
    const parser = new XMLParser({ ignoreAttributes: false });
    const xml = parser.parse(rawXml);

    if (!xml.Document) {
      throw new InvalidXmlError("Invalid XML format");
    }

    const namespace = (xml.Document['@_xmlns'] || xml.Document['@_Xmlns']) as string;
    if (!namespace.startsWith('urn:iso:std:iso:20022:tech:xsd:pain.001.001')) {
      throw new InvalidXmlNamespaceError('Invalid PAIN.001 namespace');
    }

    const messageId = xml.Document.CstmrCdtTrfInitn.GrpHdr.MsgId as string;
    const creationDate = new Date(xml.Document.CstmrCdtTrfInitn.GrpHdr.CreDtTm as string);

    // Parse and validate accounts
    // Create base initiating party
    const baseInitiatingParty: Party = {
      name: xml.Document.CstmrCdtTrfInitn.GrpHdr.InitgPty.Nm,
      id: xml.Document.CstmrCdtTrfInitn.GrpHdr.InitgPty.Id?.OrgId?.Othr?.Id,
      account: parseAccount(xml.Document.CstmrCdtTrfInitn.PmtInf.DbtrAcct),
      agent: {
        bic: xml.Document.CstmrCdtTrfInitn.PmtInf.DbtrAgt?.FinInstnId?.BIC
      }
    };

    const rawInstructions = Array.isArray(xml.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf) 
      ? xml.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf 
      : [xml.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf];

    const paymentInstructions = rawInstructions.map((inst: any) => {
      const currency = inst.Amt.InstdAmt['@_Ccy'] as Currency;
      const amount = parseAmountToMinorUnits(Number(inst.Amt.InstdAmt['#text']), currency);
      
      // Create base creditor party
      const baseCreditor: Party = {
        name: inst.Cdtr.Nm as string,
        agent: {
          bic: inst.CdtrAgt?.FinInstnId?.BIC
        },
        account: (inst.CdtrAcct?.Id?.IBAN || inst.CdtrAcct?.Id?.Othr?.Id) ? parseAccount(inst.CdtrAcct) : undefined,
        address: {
          country: inst.Cdtr.PstlAdr.Ctry as Alpha2CountryCode
        }
      };

      // Return instruction with validated data
      return {
        type: 'swift' as const,
        direction: 'credit' as const,
        ...(inst.PmtId.InstrId && { id: inst.PmtId.InstrId.toString() }),
        ...(inst.PmtId.EndToEndId && { endToEndId: inst.PmtId.EndToEndId.toString() }),
        amount,
        currency,
        creditor: baseCreditor
      };
    });

    return new SWIFTCreditPaymentInitiation({
      messageId,
      creationDate,
      initiatingParty: baseInitiatingParty,
      paymentInstructions: paymentInstructions as AtLeastOne<SWIFTCreditPaymentInstruction>
    });
  }

  public serialize(): string {
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
            PmtInfId: this.paymentInformationId,
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
