import type { Account, Agent, BICAgent, ExternalCategoryPurpose, IBANAccount, Party, SEPACreditPaymentInstruction } from "../../lib/types";
import { PaymentInitiation } from './payment-initiation';
import { sanitize } from "../../utils/format";
import Dinero, { type Currency } from 'dinero.js';
import { v4 as uuidv4 } from 'uuid';
import { XMLParser } from 'fast-xml-parser';
import { InvalidXmlError, InvalidXmlNamespaceError } from "../../errors";
import { parseAccount, parseAgent, parseAmountToMinorUnits } from "../../parseUtils";
import type { Alpha2Country } from "../../lib/countries";

type AtLeastOne<T> = [T, ...T[]];

/**
 * Represents a group of payment instructions for a single debtor (PmtInf block).
 *
 * @property {Party} initiatingParty - The party (debtor) for this specific payment information block.
 * @property {AtLeastOne<SEPACreditPaymentInstruction>} payments - An array containing at least one payment instruction for this debtor.
 * @property {ExternalCategoryPurpose} [categoryPurpose] - Optional category purpose code for this payment information block.
 */
export interface SEPAMultiCreditPaymentInstructionGroup {
  /** The party (debtor) for this specific payment information block. */
  initiatingParty: Party;
  /** An array containing at least one payment instruction for this debtor. */
  payments: AtLeastOne<SEPACreditPaymentInstruction>;
  /** Optional category purpose code for this payment information block. */
  categoryPurpose?: ExternalCategoryPurpose;
}

/**
 * Configuration for SEPA Multi Credit Payment Initiation.
 *
 * @property {Party} initiatingParty - The top-level party initiating the message (used in GrpHdr).
 * @property {AtLeastOne<SEPAMultiCreditPaymentInstructionGroup>} paymentInstructions - An array containing at least one payment instruction group.
 * @property {string} [messageId] - Optional unique identifier for the message. If not provided, a UUID will be generated.
 * @property {Date} [creationDate] - Optional creation date for the message. If not provided, current date will be used.
 */
export interface SEPAMultiCreditPaymentInitiationConfig {
  /** The top-level party initiating the message (used in GrpHdr). */
  initiatingParty: Party;
  /** An array containing at least one payment instruction group. */
  paymentInstructions: AtLeastOne<SEPAMultiCreditPaymentInstructionGroup>;
  /** Optional unique identifier for the message. If not provided, a UUID will be generated. */
  messageId?: string;
  /** Optional creation date for the message. If not provided, current date will be used. */
  creationDate?: Date;
}

/**
 * Represents a SEPA Multi Credit Payment Initiation.
 * This class handles the creation and serialization of SEPA credit transfer messages
 * with multiple payment information blocks (multiple debtors) according to the ISO20022 standard.
 * @class
 * @extends PaymentInitiation
 * @param {SEPAMultiCreditPaymentInitiationConfig} config - The configuration for the SEPA Multi Credit Payment Initiation message.
 * @example
 * ```typescript
 * // Creating a SEPA multi-payment message
 * const payment = new SEPAMultiCreditPaymentInitiation({
 *   initiatingParty: { name: 'Company Ltd', id: '12345' },
 *   paymentInstructions: [
 *     {
 *       initiatingParty: debtor1,
 *       payments: [payment1, payment2]
 *     },
 *     {
 *       initiatingParty: debtor2,
 *       payments: [payment3]
 *     }
 *   ]
 * });
 * ```
 */
export class SEPAMultiCreditPaymentInitiation extends PaymentInitiation {
  public initiatingParty: Party;
  public messageId: string;
  public creationDate: Date;
  public paymentInstructions: AtLeastOne<SEPAMultiCreditPaymentInstructionGroup>;
  public paymentInformationIdBase: string;
  private formattedPaymentSum: string;
  private totalTransactionCount: number;

  /**
   * Creates an instance of SEPAMultiCreditPaymentInitiation.
   * @param {SEPAMultiCreditPaymentInitiationConfig} config - The configuration object for the SEPA multi credit transfer.
   */
  constructor(config: SEPAMultiCreditPaymentInitiationConfig) {
    super({ type: "sepa" });
    this.initiatingParty = config.initiatingParty;
    this.paymentInstructions = config.paymentInstructions;
    this.messageId = config.messageId || uuidv4().replace(/-/g, '');
    this.creationDate = config.creationDate || new Date();
    this.paymentInformationIdBase = sanitize(uuidv4(), 35);
    this.totalTransactionCount = this.countAllTransactions();
    this.formattedPaymentSum = this.sumAllPayments();
    this.validate();
  }

  /**
   * Counts the total number of transactions across all payment instruction groups.
   * @private
   * @returns {number} The total count of all transactions.
   */
  private countAllTransactions(): number {
    return this.paymentInstructions.reduce((total, group) => {
      return total + group.payments.length;
    }, 0);
  }

  /**
   * Calculates the sum of all payment instructions across all groups.
   * @private
   * @returns {string} The total sum formatted as a string with 2 decimal places.
   */
  private sumAllPayments(): string {
    let totalAmount = 0;
    let currency: Currency | null = null;

    for (const group of this.paymentInstructions) {
      for (const payment of group.payments) {
        if (currency === null) {
          currency = payment.currency;
        }
        totalAmount += payment.amount;
      }
    }

    if (currency === null) {
      throw new Error('No payments found');
    }

    return Dinero({ amount: totalAmount, currency }).toFormat('0.00');
  }


  /**
   * Validates the payment initiation data according to SEPA requirements.
   * @private
   * @throws {Error} If messageId exceeds 35 characters.
   * @throws {Error} If any group's payment instructions have different currencies.
   */
  private validate() {
    if (this.messageId.length > 35) {
      throw new Error('messageId must not exceed 35 characters');
    }

    // Validate each group has same currency within its payments
    for (const group of this.paymentInstructions) {
      this.validateGroupInstructionsHaveSameCurrency(group.payments);
    }
  }

  /**
   * Validates that all payment instructions in a group have the same currency.
   * @private
   * @param {AtLeastOne<SEPACreditPaymentInstruction>} payments - Array of payment instructions.
   * @throws {Error} If payment instructions have different currencies.
   */
  private validateGroupInstructionsHaveSameCurrency(payments: AtLeastOne<SEPACreditPaymentInstruction>) {
    if (!payments.every((i) => { return i.currency === payments[0].currency })) {
      throw new Error(
        "In order to calculate the payment instructions sum, all payment instruction currencies within a group must be the same."
      )
    }
  }

  /**
   * Generates payment information for a single SEPA credit transfer instruction.
   * @param {SEPACreditPaymentInstruction} instruction - The payment instruction.
   * @returns {Object} The payment information object formatted according to SEPA specifications.
   */
  creditTransfer(instruction: SEPACreditPaymentInstruction) {
    const paymentInstructionId = sanitize(instruction.id || uuidv4(), 35);
    const endToEndId = sanitize(instruction.endToEndId || instruction.id || uuidv4(), 35);
    const dinero = Dinero({ amount: instruction.amount, currency: instruction.currency });

    return {
      PmtId: {
        InstrId: paymentInstructionId,
        EndToEndId: endToEndId,
      },
      Amt: {
        InstdAmt: {
          '#': dinero.toFormat('0.00'),
          '@Ccy': instruction.currency,
        },
      },
      ...(instruction.creditor.agent && { CdtrAgt: this.agent(instruction.creditor.agent as BICAgent) }),
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
   * Serializes the SEPA multi credit transfer initiation to an XML string.
   * @returns {string} The XML representation of the SEPA multi credit transfer initiation.
   */
  public serialize(): string {
    const builder = PaymentInitiation.getBuilder();
    
    // Generate one PmtInf entry per individual payment
    const paymentInfoEntries = this.paymentInstructions.flatMap((group, groupIndex) => {
      return group.payments.map((payment, paymentIndex) => {
        const dinero = Dinero({ amount: payment.amount, currency: payment.currency });
        const pmtInfId = sanitize(`${this.paymentInformationIdBase}-${groupIndex + 1}-${paymentIndex + 1}`, 35);
        const requestedExecutionDate = payment.requestedPaymentExecutionDate || new Date();

        return {
          PmtInfId: pmtInfId,
          PmtMtd: 'TRF',
          NbOfTxs: '1',
          CtrlSum: dinero.toFormat('0.00'),
          PmtTpInf: {
            SvcLvl: { Cd: 'SEPA' },
            ...(group.categoryPurpose && {
              CtgyPurp: { Cd: group.categoryPurpose }
            }),
          },
          ReqdExctnDt: requestedExecutionDate.toISOString().split('T')[0],
          Dbtr: this.party(group.initiatingParty),
          DbtrAcct: this.account(group.initiatingParty.account as Account),
          DbtrAgt: this.agent(group.initiatingParty.agent as Agent),
          ChrgBr: 'SLEV',
          CdtTrfTxInf: this.creditTransfer(payment),
        };
      });
    });

    const xml = {
      '?xml': {
        '@version': '1.0',
        '@encoding': 'UTF-8'
      },
      Document: {
        '@xmlns': 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03',
        '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        '@xsi:schemaLocation': 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03 pain.001.001.03.xsd',
        CstmrCdtTrfInitn: {
          GrpHdr: {
            MsgId: this.messageId,
            CreDtTm: this.creationDate.toISOString(),
            NbOfTxs: this.totalTransactionCount.toString(),
            CtrlSum: this.formattedPaymentSum,
            InitgPty: {
              Nm: this.initiatingParty.name,
              ...(this.initiatingParty.id && {
                Id: {
                  OrgId: {
                    Othr: {
                      Id: this.initiatingParty.id,
                    },
                  },
                },
              }),
            },
          },
          PmtInf: paymentInfoEntries,
        }
      },
    };

    return builder.build(xml);
  }

  /**
   * Parses an XML string and creates a SEPAMultiCreditPaymentInitiation instance.
   * Supports multiple PmtInf blocks in the XML document.
   * @param {string} rawXml - The XML string to parse.
   * @returns {SEPAMultiCreditPaymentInitiation} A new instance created from the XML data.
   * @throws {InvalidXmlError} If the XML format is invalid.
   * @throws {InvalidXmlNamespaceError} If the namespace is not pain.001.001.03.
   */
  public static fromXML(rawXml: string): SEPAMultiCreditPaymentInitiation {
    const parser = new XMLParser({ ignoreAttributes: false });
    const xml = parser.parse(rawXml);

    // Validate XML structure
    if (!xml.Document) {
      throw new InvalidXmlError("Invalid XML format");
    }

    // Validate namespace
    const namespace = (xml.Document['@_xmlns'] || xml.Document['@_Xmlns']) as string;
    if (!namespace.startsWith('urn:iso:std:iso:20022:tech:xsd:pain.001.001.03')) {
      throw new InvalidXmlNamespaceError('Invalid PAIN.001 namespace');
    }

    // Extract GrpHdr data
    const messageId = (xml.Document.CstmrCdtTrfInitn.GrpHdr.MsgId as string);
    const creationDate = new Date(xml.Document.CstmrCdtTrfInitn.GrpHdr.CreDtTm as string);
    
    // Extract top-level initiating party from GrpHdr
    const topLevelInitiatingParty: Party = {
      name: (xml.Document.CstmrCdtTrfInitn.GrpHdr.InitgPty.Nm as string),
      id: (xml.Document.CstmrCdtTrfInitn.GrpHdr.InitgPty.Id?.OrgId?.Othr?.Id as string),
    };

    // Normalize PmtInf to array (handle both single object and array cases)
    const rawPmtInf = Array.isArray(xml.Document.CstmrCdtTrfInitn.PmtInf) 
      ? xml.Document.CstmrCdtTrfInitn.PmtInf 
      : [xml.Document.CstmrCdtTrfInitn.PmtInf];

    // Map each PmtInf to SEPAMultiCreditPaymentInstructionGroup
    const paymentInstructions = rawPmtInf.map((pmtInf: any) => {
      // Extract debtor info as the group's initiating party
      const groupInitiatingParty: Party = {
        name: (pmtInf.Dbtr.Nm as string),
        id: pmtInf.Dbtr.Id?.OrgId?.Othr?.Id as string,
        agent: parseAgent(pmtInf.DbtrAgt),
        account: parseAccount(pmtInf.DbtrAcct),
      };

      // Extract optional category purpose
      const categoryPurpose = pmtInf.PmtTpInf?.CtgyPurp?.Cd as ExternalCategoryPurpose | undefined;

      // Extract requested execution date
      const requestedExecutionDate = pmtInf.ReqdExctnDt ? new Date(pmtInf.ReqdExctnDt as string) : undefined;

      // Normalize CdtTrfTxInf to array
      const rawInstructions = Array.isArray(pmtInf.CdtTrfTxInf) 
        ? pmtInf.CdtTrfTxInf 
        : [pmtInf.CdtTrfTxInf];

      // Parse each CdtTrfTxInf to SEPACreditPaymentInstruction
      const payments = rawInstructions.map((inst: any) => {
        const currency = (inst.Amt.InstdAmt['@_Ccy'] as Currency);
        const amount = parseAmountToMinorUnits(Number(inst.Amt.InstdAmt['#text']), currency);
        const rawPostalAddress = inst.Cdtr.PstlAdr;
        
        return {
          ...(inst.PmtId.InstrId && { id: (inst.PmtId.InstrId.toString() as string) }),
          ...(inst.PmtId.EndToEndId && { endToEndId: (inst.PmtId.EndToEndId.toString() as string) }),
          type: 'sepa' as const,
          direction: 'credit' as const,
          amount: amount,
          currency: currency,
          ...(requestedExecutionDate && { requestedPaymentExecutionDate: requestedExecutionDate }),
          creditor: {
            name: (inst.Cdtr?.Nm as string),
            agent: parseAgent(inst.CdtrAgt),
            account: parseAccount(inst.CdtrAcct),
            ...((rawPostalAddress && (rawPostalAddress.StrtNm || rawPostalAddress.BldgNb || rawPostalAddress.PstCd || rawPostalAddress.TwnNm || rawPostalAddress.Ctry)) ? {
              address: {
                ...(rawPostalAddress.StrtNm && { streetName: rawPostalAddress.StrtNm.toString() as string }),
                ...(rawPostalAddress.BldgNb && { buildingNumber: rawPostalAddress.BldgNb.toString() as string }),
                ...(rawPostalAddress.TwnNm && { townName: rawPostalAddress.TwnNm.toString() as string }),
                ...(rawPostalAddress.CtrySubDvsn && { countrySubDivision: rawPostalAddress.CtrySubDvsn.toString() as string }),
                ...(rawPostalAddress.PstCd && { postalCode: rawPostalAddress.PstCd.toString() as string }),
                ...(rawPostalAddress.Ctry && { country: rawPostalAddress.Ctry as Alpha2Country }),
              }
            } : {}),
          },
          ...(inst.RmtInf?.Ustrd && { remittanceInformation: inst.RmtInf.Ustrd.toString() as string })
        };
      }) as AtLeastOne<SEPACreditPaymentInstruction>;

      return {
        initiatingParty: groupInitiatingParty,
        payments: payments,
        ...(categoryPurpose && { categoryPurpose }),
      };
    }) as AtLeastOne<SEPAMultiCreditPaymentInstructionGroup>;

    // Return new instance
    return new SEPAMultiCreditPaymentInitiation({
      messageId: messageId,
      creationDate: creationDate,
      initiatingParty: topLevelInitiatingParty,
      paymentInstructions: paymentInstructions,
    });
  }
}

