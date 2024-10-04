import { Party } from '../../lib/types';

/**
 * Represents the original group information in a payment status report.
 */
export interface OriginalGroupInformation {
  /** The original message ID associated with the group. */
  originalMessageId: string;
}

/**
 * Represents the type of status in a payment status report.
 */
export type StatusType = 'group' | 'payment' | 'transaction';

/**
 * Represents the status codes in a payment status report.
 * @see {@link https://www.iso20022.org/sites/default/files/2022-03/externalcodesets_4q2021_v2_1.xlsx}
 */
export const PaymentStatusCode = {
  Rejected: 'RJCT',
  PartiallyAccepted: 'ACCP',
  Pending: 'PNDG',
  Accepted: 'ACCP',
  AcceptedSettlementInProgress: 'ACSP',
  AcceptedCreditSettlementCompleted: 'ACSC',
  AcceptedSettlementCompleted: 'ACSC',
  AcceptedTechnicalValidation: 'ACTC',
} as const;

export type PaymentStatus =
  (typeof PaymentStatusCode)[keyof typeof PaymentStatusCode];

/**
 * Represents the base structure for status information in a payment status report.
 */
export interface BaseStatusInformation {
  /** The type of status (group, payment, or transaction). */
  type: StatusType;
  /** The status value. */
  status: PaymentStatus;
  /** Optional reason for the status. */
  reason?: {
    /** Optional reason code. */
    code?: string;
    /** Optional additional information about the reason. */
    additionalInformation?: string;
  };
}

/**
 * Represents the status information for a group in a payment status report.
 */
export interface GroupStatusInformation extends BaseStatusInformation {
  /** The type is always 'group' for GroupStatus. */
  type: 'group';
  /** The original message ID associated with the group. */
  originalMessageId: string;
}

/**
 * Represents the status information for a payment in a payment status report.
 */
export interface PaymentStatusInformation extends BaseStatusInformation {
  /** The type is always 'payment' for PaymentStatus. */
  type: 'payment';
  /** The original payment ID associated with the payment. */
  originalPaymentId: string;
}

/**
 * Represents the status information for a transaction in a payment status report.
 */
export interface TransactionStatusInformation extends BaseStatusInformation {
  /** The type is always 'transaction' for TransactionStatus. */
  type: 'transaction';
  /** The original end-to-end ID associated with the transaction. */
  originalEndToEndId: string;
}

/**
 * Represents the union type of all possible status information types in a payment status report.
 */
export type StatusInformation =
  | GroupStatusInformation
  | PaymentStatusInformation
  | TransactionStatusInformation;
