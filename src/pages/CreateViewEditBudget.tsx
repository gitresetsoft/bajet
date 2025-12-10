// src/pages/CreateViewEditBudget.tsx (Refactored - ~200 lines)

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { export2pdf as exportPdf } from '@/functions/export2pdf';
import { createBudget, updateBudget } from '@/lib/budgetsApi';
import { ExportOptions, Mode, ViewMode, CommitmentGroup, CommitmentItem } from '@/interface/Budget';
import { 
  isValidBudgetName, 
  isValidMemberName, 
  isValidCommitmentName,
  isValidAmount,
  isValidMonth,
  isValidYear,
  sanitizeString,
  sanitizeAmount
} from '@/lib/validation';
import { logError } from '@/lib/errorHandler';

// Custom Hooks
import { useBudgetData } from '@/hooks/use-budgetdata';
import { useBudgetCalculations } from '@/hooks/use-budgetcalculations';
import { ensurePaidStatusInitialized } from '@/hooks/use-budgetoperations';

// Components
import { BudgetHeader } from '@/components/budget/BudgetHeader';
import { BasicInformationCard } from '@/components/budget/BasicInformation';
import { CommitmentsCard } from '@/components/budget/CommitmentsCard';
import { SummaryCard } from '@/components/budget/SummaryCard';
import { LedgerView } from '@/components/budget/LedgerView';

// Helpers
import { 
  getPageTitle, 
  getValidatedCommitmentGroups,
  extractMemberEmails 
} from '@/lib/budgetHelper';

// Light helper types for PDF Export only, not for app state
type PartialExportOptions = {
  summaryType?: string;
  paid_amounts?: Record<string, number>;
  unpaid_amounts?: Record<string, number>;
};

// Types for BudgetInsert/Record (minimal, for strict typing)
type CommitmentItemFromRecord = {
  id: string;
  name: string;
  remark?: string;
  amounts: Record<string, number>;
  paidStatus: Record<string, boolean>;
};

type CommitmentGroupFromRecord = {
  id: string;
  name: string;
  items: CommitmentItemFromRecord[];
  isExpanded?: boolean;
};

export default function CreateViewEditBudget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { budgetId, mode: urlMode } = useParams<{ budgetId?: string; mode?: string }>();

  // Determine the mode based on URL
  const mode: Mode = urlMode === 'edit' ? 'edit' : budgetId ? 'view' : 'create';
  const [viewMode, setViewMode] = useState<ViewMode>('structured');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize budget data and state
  const budgetData = useBudgetData({ userId: user?.id, budgetId, mode });
  const {
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
  } = budgetData;

  // Calculate totals
  const { totalCommitments, balance, paidAmounts, unpaidAmounts } = useBudgetCalculations(
    members,
    commitments,
    salaries
  );

  // Budget operations
  const operations = ensurePaidStatusInitialized({
    members,
    setMembers,
    commitments,
    setCommitments,
    salaries,
    setSalaries,
  });

  // PDF Export handlers
  // Accept only the lightweight option fragments for PDF UI
  const handleExportPdf = (options: PartialExportOptions = {}) => {
    const validCommitments = getValidatedCommitmentGroups(commitments);
    exportPdf({
      title: budgetName,
      month: selectedMonth,
      year: selectedYear,
      members,
      commitments: validCommitments,
      salaries,
      totalCommitments,
      balance,
      summaryType: options.summaryType || 'basic',
      userEmail: user?.email,
      userName: user?.name,
    });
  };

  const handleExportPdfSummary = (options: PartialExportOptions = {}) => {
    const validCommitments = getValidatedCommitmentGroups(commitments);
    exportPdf({
      title: budgetName,
      month: selectedMonth,
      year: selectedYear,
      members,
      commitments: validCommitments,
      salaries,
      totalCommitments,
      balance,
      summaryType: options.summaryType || 'summary',
      userEmail: user?.email,
      userName: user?.name,
      ...(options.paid_amounts ? { paid_amounts: options.paid_amounts } : {}),
      ...(options.unpaid_amounts ? { unpaid_amounts: options.unpaid_amounts } : {}),
    } as ExportOptions);
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    const sanitizedBudgetName = sanitizeString(budgetName);
    if (!isValidBudgetName(sanitizedBudgetName)) {
      toast({ title: 'Validation Error', description: 'Please enter a valid budget name (1-100 characters).', variant: 'destructive' });
      return;
    }

    if (!isValidMonth(selectedMonth) || !isValidYear(selectedYear)) {
      toast({ title: 'Validation Error', description: 'Please select valid month and year.', variant: 'destructive' });
      return;
    }

    if (members.some(member => !isValidMemberName(member))) {
      toast({ title: 'Validation Error', description: 'Please fill in all member names or emails (1-50 characters).', variant: 'destructive' });
      return;
    }

    const hasEmptyGroups = commitments.some(group => !isValidCommitmentName(group.name));
    const hasEmptyItems = commitments.some(group => group.items.some(item => !isValidCommitmentName(item.name)));
    if (hasEmptyGroups || hasEmptyItems) {
      toast({ title: 'Validation Error', description: 'Please fill in all commitment group and item names (1-100 characters).', variant: 'destructive' });
      return;
    }

    const invalidAmounts = commitments.some(group =>
      group.items.some(item => Object.values(item.amounts).some(amount => !isValidAmount(amount)))
    );
    if (invalidAmounts) {
      toast({ title: 'Validation Error', description: 'Please enter valid amounts (0 to 999,999,999.99).', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      if (!user?.id) throw new Error('No user');

      const sanitizedMembers = members.map(m => sanitizeString(m)).filter(m => m.length > 0);
      const memberEmails = extractMemberEmails(sanitizedMembers);

      // To comply with BudgetInsert/BudgetRecord, id in CommitmentGroup and CommitmentItem must be present
      // We enforce a placeholder id if it's missing (for new items) using a string based on index (client-only, actual ids are assigned by DB)
      const sanitizedCommitments: CommitmentGroupFromRecord[] = commitments
        .filter(group => isValidCommitmentName(group.name))
        .map((group, groupIndex) => ({
          id: group.id ?? `group-${groupIndex}`,
          name: sanitizeString(group.name),
          isExpanded: group.isExpanded ?? false,
          items: group.items
            .filter(item => isValidCommitmentName(item.name))
            .map((item, itemIndex) => ({
              id: item.id ?? `item-${groupIndex}-${itemIndex}`,
              name: sanitizeString(item.name),
              remark: item.remark ? sanitizeString(item.remark) : undefined,
              amounts: Object.fromEntries(
                Object.entries(item.amounts).map(([key, value]) => [sanitizeString(key), sanitizeAmount(value)])
              ),
              paidStatus: { ...item.paidStatus }
            })),
        }));

      const sanitizedSalaries = Object.fromEntries(
        Object.entries(salaries).map(([key, value]) => [sanitizeString(key), sanitizeAmount(value)])
      );

      // 'member_emails' may not exist in BudgetInsert record - only pass what is expected by BudgetInsert
      // For most models, it would just be 'members', 'commitments', 'salaries', etc.
      // Keep totalCommitments and balance field names as 'total_commitments'/'balance' if they're required by DB
      // If not required, remove them for insert/update
      const budgetPayload = {
        name: sanitizedBudgetName,
        month: selectedMonth,
        year: selectedYear,
        members: sanitizedMembers,
        // IF your DB and BudgetInsert expect 'commitments' as CommitmentGroup[] (with items having id), this is valid:
        commitments: sanitizedCommitments,
        salaries: sanitizedSalaries,
        total_commitments: totalCommitments,
        balance,
      };

      if (mode === 'create') {
        await createBudget(user.id, budgetPayload);
        toast({ title: 'Budget created!', description: 'Your new budget has been successfully created.' });
      } else if (mode === 'edit') {
        await updateBudget(user.id, budgetId as string, budgetPayload);
        toast({ title: 'Budget updated!', description: 'Your budget has been successfully updated.' });
      }
      navigate('/dashboard');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError(err, { userId: user?.id, userEmail: user?.email });
      toast({
        title: 'Error',
        description: mode === 'create' ? 'Failed to create budget. Please try again.' : 'Failed to update budget. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading budget...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BudgetHeader
        mode={mode}
        viewMode={mode === 'view' ? viewMode : undefined}
        pageTitle={getPageTitle(mode)}
        onViewModeToggle={mode === 'view' ? () => setViewMode(viewMode === 'structured' ? 'ledger' : 'structured') : undefined}
        onExportLedgerPdf={
          mode === 'view' && viewMode === 'ledger'
            ? () => handleExportPdf({ summaryType: 'ledger' })
            : undefined
        }
      />

      {mode === 'view' && viewMode === 'ledger' ? (
        <LedgerView
          budgetId={budgetId}
          budgetName={budgetName}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          members={members}
          commitments={commitments}
          salaries={salaries}
          totalCommitments={totalCommitments}
          balance={balance}
        />
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          <BasicInformationCard
            budgetName={budgetName}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            members={members}
            onBudgetNameChange={setBudgetName}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
            onAddMember={operations.addMember}
            onRemoveMember={operations.removeMember}
            onUpdateMember={operations.updateMember}
            onExportPdf={() => handleExportPdf({ summaryType: 'basic' })}
            disabled={mode === 'view'}
          />

          <CommitmentsCard
            commitments={commitments}
            members={members}
            onAddGroup={operations.addCommitmentGroup}
            onUpdateGroup={operations.updateCommitmentGroup}
            onRemoveGroup={operations.removeCommitmentGroup}
            onToggleExpansion={operations.toggleGroupExpansion}
            onAddItem={operations.addCommitmentItem}
            onUpdateItem={operations.updateCommitmentItem}
            onUpdateAmount={operations.updateCommitmentAmount}
            onUpdatePaidStatus={operations.updateCommitmentPaidStatus}
            onRemoveItem={operations.removeCommitmentItem}
            disabled={mode === 'view'}
          />

          <SummaryCard
            members={members}
            salaries={salaries}
            totalCommitments={totalCommitments}
            balance={balance}
            paidAmounts={paidAmounts}
            unpaidAmounts={unpaidAmounts}
            onUpdateSalary={operations.updateSalary}
            onExportPdf={() => handleExportPdfSummary({ summaryType: 'summary' })}
            disabled={mode === 'view'}
          />

          {/* Action Buttons */}
          <div className="flex space-x-4 pb-10 px-10">
            {mode === 'view' ? (
              <>
                <Button type="button" variant="outline" asChild className="flex-1">
                  <Link to="/dashboard">Back to Dashboard</Link>
                </Button>
                <Button type="button" asChild className="flex-1">
                  <Link to={`/budget/${budgetId}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Budget
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button type="submit" className="flex-1" disabled={isSubmitting} onClick={handleSubmit}>
                  {isSubmitting ? (mode === 'create' ? 'Creating...' : 'Saving...') : (
                    mode === 'create' ? 'Create Budget' : 'Save Changes'
                  )}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link to="/dashboard">Cancel</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}