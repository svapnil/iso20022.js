import { Status, StatusType } from './PaymentStatusReport';
import {
  GroupStatus,
  PaymentStatus,
  TransactionStatus,
} from './PaymentStatusReport';

const parseStatus = (status: string): Status => {
  switch (status) {
    case 'ACCP':
      return 'accepted';
    case 'PNDG':
      return 'pending';
    case 'REJT':
      return 'rejected';
    case 'ACCPD':
      return 'acceptedPendingSettlement';
    case 'ACSP':
      return 'acceptedSettlementInProgress';
    case 'ACSC':
      return 'acceptedSettlementCompleted';
    default:
      throw new Error(`Unknown status: ${status}`);
  }
};

export const parseGroupStatus = (
  originalGroupInfAndStatus: any,
): GroupStatus | null => {
  return null;
};

export const parsePaymentStatuses = (
  originalPaymentInfAndStatus: any,
): PaymentStatus[] => {
  return [];
};

export const parseTransactionStatuses = (
  originalPaymentInfAndStatus: any,
): TransactionStatus[] => {
  const transactionInfoAndStatuses = Array.isArray(
    originalPaymentInfAndStatus.TxInfAndSts,
  )
    ? originalPaymentInfAndStatus.TxInfAndSts
    : [originalPaymentInfAndStatus.TxInfAndSts];
  const transactionStatuses = transactionInfoAndStatuses.map(
    (transaction: any) => {
      return {
        type: 'transaction' as const,
        originalEndToEndId: transaction.OrgnlEndToEndId,
        status: parseStatus(transaction.TxSts),
        reason: {
          code: transaction.StsRsnInf?.Rsn?.Cd,
          additionalInformation: transaction.StsRsnInf?.Rsn?.AddtlInf,
        },
      };
    },
  );

  debugger;

  return transactionStatuses;
};
