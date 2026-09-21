import { Expense, ShareholderConfig, SettlementCalculation } from '../types';

/**
 * Reusable settlement calculation service.
 * Supports configurable shareholder percentages (default 50/50).
 * Calculates net balance and strictly identifies who owes whom and how much.
 */
export function calculateShareholderSettlement(
  expenses: Expense[],
  shareholders: ShareholderConfig[]
): SettlementCalculation {
  // Only consider active shareholders
  const activeShareholders = shareholders.filter(s => s.status !== 'INACTIVE');

  // Sum actual expenses paid personally by each shareholder
  const paidMap: Record<string, number> = {};
  for (const s of activeShareholders) {
    paidMap[s.userId] = 0;
  }

  let totalExpenses = 0;
  for (const expense of expenses) {
    const amount = Number(expense.amount) || 0;
    if (paidMap[expense.paidByUserId] !== undefined) {
      paidMap[expense.paidByUserId] += amount;
      totalExpenses += amount;
    }
  }

  // Calculate total ownership percentage for normalization
  const totalPercentage = activeShareholders.reduce((sum, s) => sum + (s.ownershipPercentage || 0), 0) || 100;

  const shareholderResults = activeShareholders.map(s => {
    const actualPaid = paidMap[s.userId] || 0;
    // Fair share is proportional to ownership percentage
    const ratio = (s.ownershipPercentage || 0) / totalPercentage;
    const fairShare = Math.round(totalExpenses * ratio * 100) / 100;
    const balance = Math.round((actualPaid - fairShare) * 100) / 100;

    return {
      userId: s.userId,
      name: s.name,
      percentage: s.ownershipPercentage,
      actualPaid,
      fairShare,
      balance,
    };
  });

  // Calculate net who owes whom (for 2 shareholders scenario)
  if (shareholderResults.length === 2) {
    const s1 = shareholderResults[0];
    const s2 = shareholderResults[1];

    if (s1.balance > 0.009) {
      // s1 paid more than fair share, s2 paid less
      const oweAmount = Math.round(s1.balance * 100) / 100;
      return {
        totalExpenses,
        shareholders: shareholderResults,
        hasSettlement: true,
        debtorId: s2.userId,
        debtorName: s2.name,
        creditorId: s1.userId,
        creditorName: s1.name,
        settlementAmount: oweAmount,
        statusText: `${s2.name} owes ${s1.name}`,
      };
    } else if (s2.balance > 0.009) {
      // s2 paid more than fair share, s1 paid less
      const oweAmount = Math.round(s2.balance * 100) / 100;
      return {
        totalExpenses,
        shareholders: shareholderResults,
        hasSettlement: true,
        debtorId: s1.userId,
        debtorName: s1.name,
        creditorId: s2.userId,
        creditorName: s2.name,
        settlementAmount: oweAmount,
        statusText: `${s1.name} owes ${s2.name}`,
      };
    } else {
      return {
        totalExpenses,
        shareholders: shareholderResults,
        hasSettlement: false,
        debtorId: null,
        debtorName: null,
        creditorId: null,
        creditorName: null,
        settlementAmount: 0,
        statusText: 'All balances settled equally (50/50 balanced)',
      };
    }
  }

  // Generalized multi-shareholder fallback
  let maxCreditor = shareholderResults.find(s => s.balance > 0.01) || null;
  let maxDebtor = shareholderResults.find(s => s.balance < -0.01) || null;

  return {
    totalExpenses,
    shareholders: shareholderResults,
    hasSettlement: !!(maxCreditor && maxDebtor),
    debtorId: maxDebtor ? maxDebtor.userId : null,
    debtorName: maxDebtor ? maxDebtor.name : null,
    creditorId: maxCreditor ? maxCreditor.userId : null,
    creditorName: maxCreditor ? maxCreditor.name : null,
    settlementAmount: maxCreditor ? maxCreditor.balance : 0,
    statusText: maxCreditor && maxDebtor ? `${maxDebtor.name} owes ${maxCreditor.name}` : 'Settled equally',
  };
}
