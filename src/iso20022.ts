import {Party, SWIFTCreditPaymentInstruction} from './lib/types.js';
import {SWIFTCreditPaymentInitiation} from './pain/001/SWIFTCreditPaymentInitiation';

export interface ISO20022Config {
    initiatingParty: Party;
}

export class ISO20022 {
    private initiatingParty: Party;

    constructor(config: ISO20022Config) {
        this.initiatingParty = config.initiatingParty;
    }

    createSWIFTCreditPaymentInitiation(paymentInstructions: SWIFTCreditPaymentInstruction[]) {
        return new SWIFTCreditPaymentInitiation({
            initiatingParty: this.initiatingParty,
            paymentInstructions: paymentInstructions
        });
    }
}