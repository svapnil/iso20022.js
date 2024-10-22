import { create } from "xmlbuilder2";
import { Account, Agent, BICAgent, IBANAccount, Party, SEPACreditPaymentInstruction } from "../../lib/types";
import { PaymentInitiation } from "./ISO20022PaymentInitiation"
import { sanitize } from "../../utils/format";
import Dinero from 'dinero.js';
import { v4 as uuidv4 } from 'uuid';

type AtLeastOne<T> = [T, ...T[]];

export interface SEPACreditPaymentInitiationConfig {
  initiatingParty: Party;
  paymentInstructions: AtLeastOne<SEPACreditPaymentInstruction>;
  messageId?: string;
  creationDate?: Date;
}

export class SEPACreditPaymentInitiation extends PaymentInitiation {
  private initiatingParty: Party;
  private messageId: string;
  private creationDate: Date;
  private paymentInstructions: AtLeastOne<SEPACreditPaymentInstruction>;
  private paymentSum: string;

  constructor(config: SEPACreditPaymentInitiationConfig) {
    super();
    this.initiatingParty = config.initiatingParty;
    this.paymentInstructions = config.paymentInstructions.map(this.reifyPaymentInstruction) as AtLeastOne<SEPACreditPaymentInstruction>;
    this.messageId = config.messageId || uuidv4().replace(/-/g, '');
    this.creationDate = config.creationDate || new Date();
    this.validate();
    this.paymentSum = this.sumPaymentInstructions(this.paymentInstructions as AtLeastOne<SEPACreditPaymentInstruction>);
  }

  private reifyPaymentInstruction(instruction: SEPACreditPaymentInstruction): SEPACreditPaymentInstruction {
    return {
      ...instruction,
      dinero: Dinero({ amount: instruction.amount, currency: instruction.currency }),
    };
  }

  // XXX: Does not work with different currencies
  private sumPaymentInstructions(instructions: AtLeastOne<SEPACreditPaymentInstruction>): string {
    return instructions.reduce(
      (acc: Dinero.Dinero, next): Dinero.Dinero => {
        return acc.add(next.dinero as Dinero.Dinero);
      },
      Dinero({ amount: 0, currency: instructions[0].currency }),
    ).toFormat('0.00');
  }

  private validate() {
    if (this.messageId.length > 35) {
      throw new Error('messageId must not exceed 35 characters');
    }

    const creditorWithoutAddress = this.paymentInstructions.find(
      instruction => !instruction.creditor.address,
    );

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

  paymentInformation(instruction: SEPACreditPaymentInstruction) {
    const paymentInfoID = sanitize(instruction.id || uuidv4(), 35);
    instruction.dinero ??= Dinero({ amount: instruction.amount, currency: instruction.currency });

    return {
      PmtId: {
        InstrId: paymentInfoID,
        EndToEndId: paymentInfoID,
      },
      Amt: {
        InstdAmt: {
          '#': instruction.dinero.toFormat('0.00'),
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
