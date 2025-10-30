export interface CommitmentItem {
  id: string;
  name: string;
  remark?: string;
  amounts: Record<string, number>;
  paidStatus: Record<string, boolean>;
}

export interface CommitmentGroup {
  id: string;
  name: string;
  items: CommitmentItem[];
  isExpanded?: boolean;
}

export interface Budget {
  id: string;
  name: string;
  month: string;
  year: number;
  members: string[];
  commitments: CommitmentGroup[];
  salaries: Record<string, number>;
  totalCommitments: Record<string, number>;
  balance: Record<string, number>;
  createdAt: string;
}

export type Mode = 'create' | 'view' | 'edit';
export type ViewMode = 'structured' | 'ledger';