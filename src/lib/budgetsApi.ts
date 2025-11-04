import { supabase } from '@/lib/supabase';

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

export interface BudgetRecord {
  id: string; // uuid from Supabase
  user_id: string;
  name: string;
  month: string;
  year: number;
  members: string[];
  member_emails?: string[]; // normalized lowercase emails for collaboration access
  commitments: CommitmentGroup[];
  salaries: Record<string, number>;
  total_commitments: Record<string, number>;
  balance: Record<string, number>;
  created_at: string;
}

export type BudgetInsert = Omit<BudgetRecord, 'id' | 'created_at' | 'user_id'> & {
  user_id?: string;
};

export async function listBudgetsByUser(userId: string, email?: string): Promise<BudgetRecord[]> {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .or(email ? `user_id.eq.${userId},member_emails.ov.{${(email || '').toLowerCase()}}` : `user_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as BudgetRecord[];
}

export async function getBudgetById(_userId: string, budgetId: string): Promise<BudgetRecord | null> {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('id', budgetId)
    .maybeSingle();
  if (error) throw error;
  return (data as BudgetRecord) || null;
}

export async function createBudget(userId: string, payload: BudgetInsert): Promise<BudgetRecord> {
  const toInsert = { ...payload, user_id: userId };
  const { data, error } = await supabase
    .from('budgets')
    .insert(toInsert)
    .select('*')
    .single();
  if (error) throw error;
  return data as BudgetRecord;
}

export async function updateBudget(_userId: string, budgetId: string, updates: Partial<BudgetInsert>): Promise<BudgetRecord> {
  const { data, error } = await supabase
    .from('budgets')
    .update({ ...updates })
    .eq('id', budgetId)
    .select('*')
    .single();
  if (error) throw error;
  return data as BudgetRecord;
}

export async function deleteBudget(_userId: string, budgetId: string): Promise<void> {
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', budgetId);
  if (error) throw error;
}


