import {
  Status,
  GroupStatus,
  PaymentStatus,
  TransactionStatus,
} from './types';
import { parseAdditionalInformation } from '../../parseUtils';
const parseStatus = (status: string): Status => {
  switch (status) {
    case 'RJCT':
      return 'rejected';
    case 'PART':
      return 'partiallyAccepted';
    case 'PNDG':
      return 'pending';
    case 'ACCP':
      return 'accepted';
    case 'ACSP':
      return 'acceptedSettlementInProgress';
    case 'ACSC':
      return 'acceptedSettlementCompleted';
    case 'ACCP':
      return 'acceptedCreditSettlementCompleted';
    case 'ACTC':
      return 'acceptedTechnicalValidation';
    default:
      throw new Error(`Unknown status: ${status}`);
  }
};

export const parseGroupStatus = (
  originalGroupInfAndStatus: any,
): GroupStatus | null => {
  if (!originalGroupInfAndStatus.hasOwnProperty('GrpSts')) {
    return null;
  }
  return {
    type: 'group',
    originalMessageId: originalGroupInfAndStatus.OrgnlMsgId,
    status: parseStatus(originalGroupInfAndStatus.GrpSts),
    reason: {
      code: originalGroupInfAndStatus.StsRsnInf?.Rsn?.Cd,
      additionalInformation: parseAdditionalInformation(
        originalGroupInfAndStatus.StsRsnInf?.AddtlInf,
      ),
    },
  };
};

export const parsePaymentStatuses = (
  originalPaymentInfAndStatuses: any,
): PaymentStatus[] => {
  return originalPaymentInfAndStatuses
    .map((payment: any) => {
      if (!payment.hasOwnProperty('PmtInfSts')) {
        return null;
      }
      return {
        type: 'payment' as const,
        originalPaymentId: payment.OrgnlPmtInfId,
        status: parseStatus(payment.PmtInfSts),
        reason: {
          code: payment.StsRsnInf?.Rsn?.Cd,
          additionalInformation: parseAdditionalInformation(
            payment.StsRsnInf?.AddtlInf,
          ),
        },
      };
    })
    .filter((status: any) => status !== null);
};

export const parseTransactionStatuses = (
  allTxnsInfoAndStatuses: any[],
): TransactionStatus[] => {
  const transactionStatuses = allTxnsInfoAndStatuses.map((transaction: any) => {
    return {
      type: 'transaction' as const,
      originalEndToEndId: transaction.OrgnlEndToEndId,
      status: parseStatus(transaction.TxSts),
      reason: {
        code: transaction.StsRsnInf?.Rsn?.Cd,
        additionalInformation: parseAdditionalInformation(
          transaction.StsRsnInf?.Rsn?.AddtlInf,
        ),
      },
    };
  });

  return transactionStatuses;
};
