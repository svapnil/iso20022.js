import { Party } from '../../lib/types';

export interface OriginalGroupInformation {
  originalMessageId: string;
}

export type StatusType = 'group' | 'payment' | 'transaction';
export type Status =
  | 'rejected' // Payment initiation or individual transaction included in the payment initiation has been rejected.
  | 'partiallyAccepted' // A number of transactions have been accepted, whereas another number of transactions have not yet achieved accepted status. This is only relevant for bulk payments.
  | 'pending' // Payment initiation or individual transaction included in the payment initiation is pending. Further checks and status update will be performed.
  | 'accepted' // Preceding check of technical validation was successful. Customer profile check was also successful.
  | 'acceptedSettlementInProgress' // All preceding checks such as technical validation and customer profile were successful. The payment initiation was successfully signed. The payment initiation has been accepted for execution, but before settlement on the debtor’s account.
  | 'acceptedCreditSettlementCompleted' // This status is only applicable for instant payments. Settlement on the creditor's account has been completed.
  | 'acceptedSettlementCompleted' // Settlement on the debtor’s account has been completed.
  | 'acceptedTechnicalValidation'; // Authentication and syntactical and semantical validation (Technical validation) are successful.

export interface BaseStatus {
  type: StatusType;
  status: Status;
  reason?: {
    code?: string;
    additionalInformation?: string;
  };
}

export interface GroupStatus extends BaseStatus {
  type: 'group';
  originalMessageId: string;
}

export interface PaymentStatus extends BaseStatus {
  type: 'payment';
  originalPaymentId: string;
}

export interface TransactionStatus extends BaseStatus {
  type: 'transaction';
  originalEndToEndId: string;
}

export type StatusInformation = GroupStatus | PaymentStatus | TransactionStatus;
