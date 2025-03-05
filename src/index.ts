/**
 * @module iso20022.js · The Open Source Bank Transfer library, build for fiatwebservices.com
 * @author svapnil <iso20022js@woodside.sh>
 * @copyright 2025 Woodside Labs
 * @license MIT
 * @description
 * This library allows you to create payment messages in ISO20022.
 *
 * Either use an iso20022 object, which represents your acccount,
 * or create directly from the PaymentInitiation class.
 *
 * Current Supported Payment Types:
 * - SWIFTCreditPaymentInstruction
 * - SEPACreditPaymentInstruction
 * - RTPCreditPaymentInstruction
 * @example
 * ```typescript
 * import { ISO20022 } from 'iso20022.js';
 * const checking = new ISO20022({
 *     initiatingParty: ...
 * })
 * const rtp = checking.createRTPCreditPaymentInitiation([{
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
 * // Using fiatwebservices.com
 * client.paymentTransfers.create(rtp);
 * ```
 * @see {@link https://iso20022js.com} for more information.
 */

export { default as ISO20022 } from './iso20022';

export type {
  Party,
  Account,
  Agent,
  SWIFTCreditPaymentInstruction,
  SEPACreditPaymentInstruction,
  RTPCreditPaymentInstruction,
  ACHCreditPaymentInstruction,
  StructuredAddress,
  IBANAccount,
  BaseAccount,
  BICAgent,
  ABAAgent,
} from './lib/types';



// pain.001
export type { SWIFTCreditPaymentInitiationConfig } from './pain/001/swift-credit-payment-initiation';
export { SWIFTCreditPaymentInitiation } from './pain/001/swift-credit-payment-initiation';
export type { SEPACreditPaymentInitiationConfig } from './pain/001/sepa-credit-payment-initiation';
export { SEPACreditPaymentInitiation } from './pain/001/sepa-credit-payment-initiation';
export type { RTPCreditPaymentInitiationConfig } from './pain/001/rtp-credit-payment-initiation';
export { RTPCreditPaymentInitiation } from './pain/001/rtp-credit-payment-initiation';
export type { ACHCreditPaymentInitiationConfig } from './pain/001/ach-credit-payment-initiation';
export { ACHCreditPaymentInitiation } from './pain/001/ach-credit-payment-initiation';

// pain.002
export type {
  OriginalGroupInformation,
  StatusType,
  PaymentStatus as Status,
  BaseStatusInformation as BaseStatus,
  GroupStatusInformation as GroupStatus,
  PaymentStatusInformation as PaymentStatus,
  TransactionStatusInformation as TransactionStatus,
  StatusInformation,
} from './pain/002/types';
export { PaymentStatusCode as StatusCode } from './pain/002/types';
export { PaymentStatusReport } from './pain/002/payment-status-report';

// camt.053
export type {
  Statement,
  Balance,
  Entry,
  Transaction,
  BalanceType,
} from './camt/types';
export { BalanceTypeCode, BalanceTypeCodeDescriptionMap } from './camt/types';
export { CashManagementEndOfDayReport } from './camt/053/cash-management-end-of-day-report';

// errors
export {
  Iso20022JsError,
  InvalidXmlError,
  InvalidXmlNamespaceError,
} from './errors';
