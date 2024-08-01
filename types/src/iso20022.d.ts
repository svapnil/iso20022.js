import { Party, SWIFTCreditPaymentInstruction } from './lib/types.js';
import { SWIFTCreditPaymentInitiation } from './pain/001/SWIFTCreditPaymentInitiation';
export interface ISO20022Config {
    initiatingParty: Party;
}
declare class ISO20022 {
    private initiatingParty;
    constructor(config: ISO20022Config);
    createSWIFTCreditPaymentInitiation(paymentInstructions: SWIFTCreditPaymentInstruction[]): SWIFTCreditPaymentInitiation;
}
export default ISO20022;
