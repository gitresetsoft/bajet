import { CommitmentGroup } from '@/interface/Budget';

/**
 * Calculates totals for commitments, balances, paid amounts, and unpaid amounts per member.
 * 
 * @param members - Array of member identifiers (usually emails or names)
 * @param commitments - Array of commitment groups, each with items and amounts/paidStatus
 * @param salaries - Record of member to salary amount
 * @returns Object containing totalCommitments, balance, paidAmounts, unpaidAmounts for each member
 */
export function useBudgetCalculations(
  members: string[],
  commitments: CommitmentGroup[],
  salaries: Record<string, number>
) {
  const totalCommitments: Record<string, number> = {};
  const balance: Record<string, number> = {};
  const paidAmounts: Record<string, number> = {};
  const unpaidAmounts: Record<string, number> = {};

  members.forEach(member => {
    totalCommitments[member] = 0;
    balance[member] = 0;
    paidAmounts[member] = 0;
    unpaidAmounts[member] = 0;
  });

  commitments.forEach(group => {
    group.items.forEach(item => {
      members.forEach(member => {
        const amount = item.amounts?.[member] || 0;
        totalCommitments[member] += amount;
        if (!item.paidStatus) {
          item.paidStatus = { [member]: false };
        }
        if (item.paidStatus[member]) {
          paidAmounts[member] += amount;
        } else {
          unpaidAmounts[member] += amount;
        }
      });
    });
  });

  members.forEach(member => {
    balance[member] = (salaries[member] || 0) - totalCommitments[member];
  });

  return { totalCommitments, balance, paidAmounts, unpaidAmounts };
}
