import {
  PaymentStatus,
  GroupStatusInformation,
  PaymentStatusInformation,
  TransactionStatusInformation,
  PaymentStatusCode,
} from './types';

// NOTE: Consider not even using this switch statement.
const parseStatus = (status: unknown): PaymentStatus => {
  // GrpSts / PmtInfSts / TxSts are external code sets; the schema only fixes
  // their length at 1–4 characters, so any well-formed code is accepted.
  if (typeof status !== 'string' || status.length < 1 || status.length > 4) {
    throw new Error(`Invalid status: ${String(status)}`);
  }
  return status;
};

/**
 * StsRsnInf is maxOccurs="unbounded" at group, payment and transaction level.
 * The code is taken from the first block that carries a reason (Cd or Prtry);
 * additional information is folded across every block.
 */
const parseStatusReason = (rawStsRsnInf: any): { code?: string; additionalInformation?: string } => {
  const infos: any[] = Array.isArray(rawStsRsnInf) ? rawStsRsnInf : rawStsRsnInf ? [rawStsRsnInf] : [];
  const withReason = infos.find((i) => i?.Rsn !== undefined);
  const code = withReason?.Rsn?.Cd ?? withReason?.Rsn?.Prtry;
  const lines = infos.flatMap((i) => {
    const a = i?.AddtlInf;
    return a === undefined ? [] : Array.isArray(a) ? a : [a];
  });
  return {
    code: code !== undefined ? String(code) : undefined,
    additionalInformation: lines.length ? lines.join('\n') : undefined,
  };
};

export const parseGroupStatusInformation = (
  originalGroupInfAndStatus: any,
): GroupStatusInformation | null => {
  if (!originalGroupInfAndStatus.hasOwnProperty('GrpSts')) {
    return null;
  }
  return {
    type: 'group',
    originalMessageId: originalGroupInfAndStatus.OrgnlMsgId,
    status: parseStatus(originalGroupInfAndStatus.GrpSts),
    reason: parseStatusReason(originalGroupInfAndStatus.StsRsnInf),
  };
};

export const parsePaymentStatusInformations = (
  originalPaymentInfAndStatuses: any,
): PaymentStatusInformation[] => {
  return originalPaymentInfAndStatuses
    .map((payment: any) => {
      if (!payment.hasOwnProperty('PmtInfSts')) {
        return null;
      }
      return {
        type: 'payment' as const,
        originalPaymentId: payment.OrgnlPmtInfId,
        status: parseStatus(payment.PmtInfSts),
        reason: parseStatusReason(payment.StsRsnInf),
      };
    })
    .filter((status: any) => status !== null);
};

export const parseTransactionStatusInformations = (
  allTxnsInfoAndStatuses: any[],
): TransactionStatusInformation[] => {
  const transactionStatuses = allTxnsInfoAndStatuses.map((transaction: any) => {
    return {
      type: 'transaction' as const,
      originalEndToEndId: transaction.OrgnlEndToEndId,
      status: parseStatus(transaction.TxSts),
      reason: parseStatusReason(transaction.StsRsnInf),
    };
  });

  return transactionStatuses;
};
