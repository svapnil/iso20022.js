import {
  Status,
  GroupStatus,
  PaymentStatus,
  TransactionStatus,
  StatusCode,
} from './types';
import { parseAdditionalInformation } from '../../parseUtils';

// NOTE: Consider not even using this switch statement.
const parseStatus = (status: string): Status => {
  switch (status) {
    case StatusCode.Rejected:
      return StatusCode.Rejected;
    case StatusCode.PartiallyAccepted:
      return StatusCode.PartiallyAccepted;
    case StatusCode.Pending:
      return StatusCode.Pending;
    case StatusCode.Accepted:
      return StatusCode.Accepted;
    case StatusCode.AcceptedSettlementInProgress:
      return StatusCode.AcceptedSettlementInProgress;
    case StatusCode.AcceptedCreditSettlementCompleted:
      return StatusCode.AcceptedCreditSettlementCompleted;
    case StatusCode.AcceptedSettlementCompleted:
      return StatusCode.AcceptedSettlementCompleted;
    case StatusCode.AcceptedTechnicalValidation:
      return StatusCode.AcceptedTechnicalValidation;
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
