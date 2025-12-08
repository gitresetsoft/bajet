// src/hooks/budget/useBudgetData.ts

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { getBudgetById } from '@/lib/budgetsApi';
import { CommitmentGroup, Mode } from '@/interface/Budget';

interface UseBudgetDataProps {
  userId?: string;
  budgetId?: string;
  mode: Mode;
}

interface BudgetDataState {
  budgetName: string;
  setBudgetName: React.Dispatch<React.SetStateAction<string>>;
  selectedMonth: string;
  setSelectedMonth: React.Dispatch<React.SetStateAction<string>>;
  selectedYear: number;
  setSelectedYear: React.Dispatch<React.SetStateAction<number>>;
  members: string[];
  setMembers: React.Dispatch<React.SetStateAction<string[]>>;
  commitments: CommitmentGroup[];
  setCommitments: React.Dispatch<React.SetStateAction<CommitmentGroup[]>>;
  salaries: Record<string, number>;
  setSalaries: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  isLoading: boolean;
}

/**
 * Hook to manage budget data state and loading
 */
export function useBudgetData({ userId, budgetId, mode }: UseBudgetDataProps): BudgetDataState {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [budgetName, setBudgetName] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toLocaleString('default', { month: 'long' })
  );
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [members, setMembers] = useState<string[]>([]);
  const [commitments, setCommitments] = useState<CommitmentGroup[]>([]);
  const [salaries, setSalaries] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Load budget data for view/edit modes
  useEffect(() => {
    if (!userId) return;
    
    if (mode === 'view' || mode === 'edit') {
      setIsLoading(true);
      
      (async () => {
        try {
          const data = await getBudgetById(userId, budgetId as string);
          if (data) {
            setBudgetName(data.name);
            setSelectedMonth(data.month);
            setSelectedYear(data.year);
            setMembers(data.members);
            setCommitments(data.commitments || []);
            setSalaries(data.salaries || {});
          } else {
            toast({
              title: 'Budget not found',
              description: 'The requested budget could not be found.',
              variant: 'destructive',
            });
            navigate('/dashboard');
          }
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to load budget data.',
            variant: 'destructive',
          });
          navigate('/dashboard');
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [budgetId, mode, userId, navigate, toast]);

  return {
    budgetName,
    setBudgetName,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    members,
    setMembers,
    commitments,
    setCommitments,
    salaries,
    setSalaries,
    isLoading,
  };
}