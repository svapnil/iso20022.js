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
 * Represents the possible status values in a payment status report.
 */
export type Status =
  /** Payment initiation or individual transaction included in the payment initiation has been rejected. */
  | 'rejected'
  /** A number of transactions have been accepted, whereas another number of transactions have not yet achieved accepted status. This is only relevant for bulk payments. */
  | 'partiallyAccepted'
  /** Payment initiation or individual transaction included in the payment initiation is pending. Further checks and status update will be performed. */
  | 'pending'
  /** Preceding check of technical validation was successful. Customer profile check was also successful. */
  | 'accepted'
  /** All preceding checks such as technical validation and customer profile were successful. The payment initiation was successfully signed. The payment initiation has been accepted for execution, but before settlement on the debtor's account. */
  | 'acceptedSettlementInProgress'
  /** This status is only applicable for instant payments. Settlement on the creditor's account has been completed. */
  | 'acceptedCreditSettlementCompleted'
  /** Settlement on the debtor's account has been completed. */
  | 'acceptedSettlementCompleted'
  /** Authentication and syntactical and semantical validation (Technical validation) are successful. */
  | 'acceptedTechnicalValidation';

/**
 * Represents the base structure for status information in a payment status report.
 */
export interface BaseStatus {
  /** The type of status (group, payment, or transaction). */
  type: StatusType;
  /** The status value. */
  status: Status;
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
export interface GroupStatus extends BaseStatus {
  /** The type is always 'group' for GroupStatus. */
  type: 'group';
  /** The original message ID associated with the group. */
  originalMessageId: string;
}

/**
 * Represents the status information for a payment in a payment status report.
 */
export interface PaymentStatus extends BaseStatus {
  /** The type is always 'payment' for PaymentStatus. */
  type: 'payment';
  /** The original payment ID associated with the payment. */
  originalPaymentId: string;
}

/**
 * Represents the status information for a transaction in a payment status report.
 */
export interface TransactionStatus extends BaseStatus {
  /** The type is always 'transaction' for TransactionStatus. */
  type: 'transaction';
  /** The original end-to-end ID associated with the transaction. */
  originalEndToEndId: string;
}

/**
 * Represents the union type of all possible status information types in a payment status report.
 */
export type StatusInformation = GroupStatus | PaymentStatus | TransactionStatus;
