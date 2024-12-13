import { Party, SEPACreditPaymentInstruction } from "../../lib/types";
import { PaymentInitiation } from "./ISO20022PaymentInitiation";
import { v4 as uuidv4 } from 'uuid';

export interface SEPACreditPaymentInitiationConfig {
    initiatingParty: Party;
    paymentInstructions: SEPACreditPaymentInstruction[];
    messageId?: string;
    creationDate?: Date;
}

export class SEPACreditPaymentInitiation extends PaymentInitiation {
    private initiatingParty: Party;
    private messageId: string;
    private creationDate: Date;
    private paymentInstructions: SEPACreditPaymentInstruction[];

    constructor(config: SEPACreditPaymentInitiationConfig) {
        super();
        this.initiatingParty = config.initiatingParty;
        this.paymentInstructions = config.paymentInstructions;
        this.messageId = config.messageId || uuidv4().replace(/-/g, '').substring(0, 35);
        this.creationDate = config.creationDate || new Date();
        this.validate();
    }

    private validate() {
        if (this.messageId.length > 35) {
            throw new Error('messageId must not exceed 35 characters');
        }
    }

    public serialize(): string {
        return "test";
    }
}

