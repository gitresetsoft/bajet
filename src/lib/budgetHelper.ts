// src/lib/budget/budgetHelpers.ts

import { CommitmentGroup, CommitmentItem } from '@/interface/Budget';

/**
 * Type guard to validate CommitmentItem structure
 */
export const isValidCommitmentItem = (item: CommitmentItem): item is CommitmentItem => {
  return (
    item &&
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.amounts === 'object' &&
    item.amounts !== null &&
    typeof item.paidStatus === 'object' &&
    item.paidStatus !== null
  );
};

/**
 * Type guard to validate CommitmentGroup structure
 */
export const isValidCommitmentGroup = (group: CommitmentGroup): group is CommitmentGroup => {
  return (
    group &&
    typeof group.id === 'string' &&
    typeof group.name === 'string' &&
    Array.isArray(group.items) &&
    group.items.every(isValidCommitmentItem)
  );
};

/**
 * Filter and return only valid commitment groups
 */
export function getValidatedCommitmentGroups(commitments: CommitmentGroup[]): CommitmentGroup[] {
  return (commitments || []).filter(isValidCommitmentGroup);
}

/**
 * Ensure paid status is initialized for all members
 */
export const ensurePaidStatusInitialized = (
  item: CommitmentItem,
  members: string[]
): Record<string, boolean> => {
  const updatedPaidStatus = { ...item.paidStatus };
  members.forEach(member => {
    if (updatedPaidStatus[member] === undefined) {
      updatedPaidStatus[member] = false;
    }
  });
  return updatedPaidStatus;
};

/**
 * Generate a unique ID for commitment groups or items
 */
export const generateId = (prefix: 'group' | 'item'): string => {
  return `${prefix}_${Date.now()}`;
};

/**
 * Get page title based on mode
 */
export const getPageTitle = (mode: 'create' | 'view' | 'edit'): string => {
  const titles = {
    create: 'Create New Budget',
    view: 'View Budget',
    edit: 'Edit Budget',
  };
  return titles[mode];
};

/**
 * Get card title based on mode
 */
export const getCardTitle = (mode: 'create' | 'view' | 'edit'): string => {
  const titles = {
    create: 'Budget Details',
    view: 'Budget Information',
    edit: 'Edit Budget Details',
  };
  return titles[mode];
};

/**
 * Get card description based on mode
 */
export const getCardDescription = (mode: 'create' | 'view' | 'edit'): string => {
  const descriptions = {
    create: 'Set up your new budget by providing the basic information below.',
    view: 'View the details of your budget.',
    edit: 'Modify your budget information below.',
  };
  return descriptions[mode];
};

/**
 * Extract member emails from member list
 */
export const extractMemberEmails = (members: string[]): string[] => {
  return members
    .map(m => m.trim().toLowerCase())
    .filter(m => /.+@.+\..+/.test(m));
};