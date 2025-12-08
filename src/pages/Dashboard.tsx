import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Plus, Eye, Edit, Trash2, LogOut, Calendar, Copy } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { listBudgetsByUser, deleteBudget as deleteBudgetApi, createBudget } from '@/lib/budgetsApi';
import { useAppStore } from '@/hooks/use-appstore';

interface CommitmentItem {
  id: string;
  name: string;
  amounts: Record<string, number>;
  paidStatus: Record<string, boolean>;
}

interface CommitmentGroup {
  id: string;
  name: string;
  items: CommitmentItem[];
  isExpanded?: boolean;
}

interface Budget {
  id: string;
  name: string;
  month: string;
  year: number;
  members: string[];
  commitments: CommitmentGroup[];
  salaries: Record<string, number>;
  total_commitments: Record<string, number>;
  balance: Record<string, number>;
  created_at: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const clearUserDetails = useAppStore((state) => state.clearUserDetails);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    if (!user?.id) return;
    const email = (user as { email?: string } | null)?.email?.toLowerCase?.();
    (async () => {
      const data = await listBudgetsByUser(user.id, email);
      setBudgets(data as unknown as Budget[]);
    })();
  }, [user]);

  const calculateBudgetTotals = (
    members: string[],
    commitments: CommitmentGroup[],
    salaries: Record<string, number>
  ) => {
    const totalCommitments: Record<string, number> = {};
    const balance: Record<string, number> = {};

    members.forEach(member => {
      totalCommitments[member] = 0;
      balance[member] = 0;
    });

    commitments.forEach(group => {
      group.items.forEach(item => {
        members.forEach(member => {
          const amount = item.amounts[member] || 0;
          totalCommitments[member] += amount;
        });
      });
    });

    members.forEach(member => {
      balance[member] = (salaries[member] || 0) - totalCommitments[member];
    });

    return { totalCommitments, balance };
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!user?.id) return;
    await deleteBudgetApi(user.id, budgetId);
    const updated = budgets.filter(b => b.id !== budgetId);
    setBudgets(updated);
    toast({ title: 'Budget deleted', description: 'Budget has been successfully removed.' });
  };

  const handleCopyBudget = async (originalBudget: Budget) => {
    const latestBudget = budgets.reduce((latest, current) => {
      const latestDate = new Date(latest.year, months.indexOf(latest.month));
      const currentDate = new Date(current.year, months.indexOf(current.month));
      return currentDate > latestDate ? current : latest;
    }, originalBudget);

    const latestMonthIndex = months.indexOf(latestBudget.month);
    const latestYear = latestBudget.year;
    const newMonthIndex = (latestMonthIndex + 1) % 12;
    let newYear = latestYear;
    if (newMonthIndex === 0 && latestMonthIndex === 11) {
      newYear++;
    }
    const newMonth = months[newMonthIndex];

    const newCommitments: CommitmentGroup[] = originalBudget.commitments.map(group => ({
      ...group,
      id: `group_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      items: group.items.map(item => ({
        ...item,
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        paidStatus: originalBudget.members.reduce((acc, member) => ({ ...acc, [member]: false }), {}),
      })),
    }));

    const { totalCommitments, balance } = calculateBudgetTotals(
      originalBudget.members,
      newCommitments,
      originalBudget.salaries
    );
    if (!user?.id) return;
    const created = await createBudget(user.id, {
      name: `${originalBudget.month} ${originalBudget.year} (Copy)`,
      month: newMonth,
      year: newYear,
      members: originalBudget.members,
      member_emails: originalBudget.members.filter(m => /.+@.+\..+/.test(m)).map(m => m.toLowerCase()),
      commitments: newCommitments,
      salaries: originalBudget.salaries,
      total_commitments: totalCommitments,
      balance,
    });

    setBudgets(prev => [created as unknown as Budget, ...prev]);

    toast({
      title: 'Budget copied',
      description: `"${originalBudget.name}" copied to "${created.name}" for ${newMonth} ${newYear}.`,
    });
  };

  const handleLogout = async () => {
    await logout();
    clearUserDetails();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-2 py-2 md:px-4 md:py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="flex flex-row items-center justify-between md:justify-start space-x-2 md:space-x-4 w-full">
              <div className="flex items-center space-x-2 md:space-x-4">
                <img src="/icon.png" alt="Budget Icon" className="h-6 w-6 md:h-8 md:w-8" />
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-foreground">Budget Dashboard</h1>
                  <p className="text-xs md:text-sm text-muted-foreground">Welcome back, {user?.name}</p>
                </div>
              </div>
              {/* On mobile, place Sign Out at end, right-aligned. On desktop, handled by next div, hidden on md+ */}
              <div className="flex md:hidden">
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="text-xs md:text-base px-2 py-1 md:px-3 md:py-2 h-auto min-h-0"
                >
                  <LogOut className="h-4 w-4 mr-1 md:mr-2" />
                  <span className="hidden md:inline">Sign Out</span>
                </Button>
              </div>
            </div>
            {/* On desktop, show sign out at right. Hide on mobile */}
            <div className="hidden md:flex items-center space-x-2 md:space-x-4 mt-1 md:mt-0">
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-xs md:text-base px-2 py-1 md:px-3 md:py-2 h-auto min-h-0"
              >
                <LogOut className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden md:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 py-4 md:px-4 md:py-8">
        {budgets.length === 0 ? (
          <div className="text-center py-8 md:py-20">
            <Calendar className="h-10 w-10 md:h-16 md:w-16 text-muted-foreground mx-auto mb-2 md:mb-4" />
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1 md:mb-2">No budgets yet</h2>
            <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-6 max-w-xs md:max-w-md mx-auto">
              Create your first budget to start tracking your expenses and managing your finances effectively.
            </p>
            <Button asChild size="sm" className="text-xs md:text-base px-3 py-2 md:px-5 md:py-2">
              <Link to="/create-budget">
                <Plus className="h-4 w-4 mr-1" />
                Create Your First Budget
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-6">
            {/* Header row: title & budget count left, new budget button right (same line) */}
            <div className="flex items-center justify-between gap-1 md:gap-0 mb-1 md:mb-0">
              <div className="flex flex-col md:flex-row md:items-end md:space-x-2">
                <h2 className="text-xl md:text-2xl font-bold text-foreground">Your Budgets</h2>
                <span className="text-xs md:text-sm text-muted-foreground">
                  {budgets.length} budget{budgets.length !== 1 ? 's' : ''} total
                </span>
              </div>
              <Button variant="outline" asChild>
                <Link to="/create-budget">
                  <Plus className="h-4 w-4 mr-1" />
                  New Budget
                </Link>
              </Button>
            </div>

            <div className="space-y-3 md:space-y-6">
              {Object.entries(
                budgets.reduce((acc, budget) => {
                  (acc[budget.year] = acc[budget.year] || []).push(budget);
                  return acc;
                }, {} as Record<string, typeof budgets>)
              )
                .sort(([aYear], [bYear]) => Number(bYear) - Number(aYear))
                .map(([year, yearBudgets], index) => (
                  <Accordion
                    key={year}
                    type="single"
                    collapsible
                    defaultValue={index === 0 ? year : undefined}
                    className="rounded"
                  >
                    <AccordionItem value={year}>
                      <AccordionTrigger className="text-base md:text-lg font-semibold flex items-center justify-between px-1 py-1">
                        <span className="text-left">{year}</span>
                        <span className="text-xs md:text-sm text-muted-foreground flex-1 text-end pr-1 md:pr-2">{yearBudgets.length}</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        {/* Mobile: stack cards vertically; desktop: grid */}
                        <div
                          className="
                            flex flex-col gap-2 md:grid md:gap-6
                            md:grid-cols-2 lg:grid-cols-3 mt-2
                          "
                        >
                          {yearBudgets.map((budget) => {
                            // Totals for this budget
                            const totalSalary = Object.values(budget.salaries || {}).reduce((sum, salary) => sum + salary, 0);
                            const totalCommitments = Object.values(budget.total_commitments || {}).reduce((sum: number, commitment: number) => sum + commitment, 0);
                            const totalBalance = Object.values(budget.balance || {}).reduce((sum, balance) => sum + balance, 0);

                            return (
                              <Card
                                key={budget.id}
                                className="border-border hover:shadow-md md:hover:shadow-lg transition-shadow"
                              >
                                {/* Card 'header' row for mobile only: title + actions on same line */}
                                <div className="flex md:hidden flex-row items-center justify-between p-3 pb-1">
                                  <span className="font-semibold text-base">{budget.name}</span>
                                  <div className="flex space-x-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-xs px-1 py-1 min-h-0 h-auto"
                                      asChild
                                    >
                                      <Link to={`/budget/${budget.id}`}>
                                        <Eye className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-xs px-1 py-1 min-h-0 h-auto"
                                      asChild
                                    >
                                      <Link to={`/budget/${budget.id}/edit`}>
                                        <Edit className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleCopyBudget(budget)}
                                      className="text-primary hover:text-primary text-xs px-1 py-1 min-h-0 h-auto"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeleteBudget(budget.id)}
                                      className="text-destructive hover:text-destructive text-xs px-1 py-1 min-h-0 h-auto"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                {/* CardHeader for desktop */}
                                <div className="hidden md:block">
                                  <CardHeader className="p-0 pb-4">
                                    <div className="flex flex-col md:items-start">
                                      <span className="font-semibold text-base md:text-lg">{budget.name}</span>
                                      <span className="text-xs md:text-sm font-normal text-muted-foreground md:mt-0">
                                        {budget.month} {budget.year}
                                      </span>
                                      <CardDescription className="hidden md:block text-xs md:text-sm mt-1">
                                        {budget.members.map(m => m.split('@')[0]).join(' & ')}
                                      </CardDescription>
                                    </div>
                                  </CardHeader>
                                </div>
                                {/* Under title: budget period row (always visible), then (mobile) stats row */}
                                <div className="flex flex-col md:hidden px-3 pb-2">
                                  <span className="text-xs font-normal text-muted-foreground">{budget.month} {budget.year}</span>
                                  {/* Stats horizontal row for mobile (left-aligned), insert "-" between salary and commit, "=" between commit and balance */}
                                  <div className="flex flex-row gap-1 mt-2 items-start">
                                    <div className="flex flex-col items-start">
                                      <span className="flex items-center text-success text-xs">
                                        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" className="inline mr-0.5"><circle cx="12" cy="12" r="9" stroke="#16a34a" strokeWidth="2" fill="none"/><path d="M8 12h8M10 9v6" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"/></svg>
                                        RM {totalSalary.toLocaleString()}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground mt-0.5">Total Salary</span>
                                    </div>
                                    {/* Minus sign separator for mobile */}
                                    <div className="flex flex-col justify-center items-center pt-0">
                                      <span className="text-xs font-bold text-muted-foreground">-</span>
                                    </div>
                                    <div className="flex flex-col items-start">
                                      <span className="flex items-center text-destructive text-xs">
                                        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" className="inline mr-0.5"><rect x="5" y="5" width="14" height="14" rx="5" stroke="#ef4444" strokeWidth="2" fill="none"/><path d="M9 9L15 15M15 9L9 15" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/></svg>
                                        RM {totalCommitments.toLocaleString()}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground mt-0.5">Total Commitments</span>
                                    </div>
                                    {/* Equal sign separator for mobile */}
                                    <div className="flex flex-col justify-center items-center pt-0">
                                      <span className="text-xs font-bold text-muted-foreground">=</span>
                                    </div>
                                    <div className="flex flex-col items-start">
                                      <span className={`flex items-center text-xs ${totalBalance >= 0 ? "text-success" : "text-destructive"}`}>
                                        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" className="inline mr-0.5">
                                          <circle cx="12" cy="12" r="9" stroke={totalBalance >= 0 ? "#16a34a" : "#ef4444"} strokeWidth="2" fill="none"/>
                                          <path d="M8 13l2.5 2.5L16 10" stroke={totalBalance >= 0 ? "#16a34a" : "#ef4444"} strokeWidth="2" strokeLinecap="round"/>
                                        </svg>
                                        RM {totalBalance.toLocaleString()}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground mt-0.5">Balance</span>
                                    </div>
                                  </div>
                                </div>
                                {/* Desktop stats and actions */}
                                <CardContent className="hidden md:block pb-4 pt-0">
                                  <div className="space-y-3 mb-2">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">Total Salary:</span>
                                      <span className="font-medium text-success">
                                        RM {totalSalary.toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">Commitments:</span>
                                      <span className="font-medium text-destructive">
                                        RM {totalCommitments.toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm font-medium pt-2 border-t border-border">
                                      <span>Balance:</span>
                                      <span className={totalBalance >= 0 ? 'text-success' : 'text-destructive'}>
                                        RM {totalBalance.toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                  {/* Desktop Actions */}
                                  <div className="flex space-x-1 md:space-x-2 mt-6 justify-end">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-xs md:text-base px-1 md:px-3 py-1 md:py-2 min-h-0 h-auto"
                                      asChild
                                    >
                                      <Link to={`/budget/${budget.id}`}>
                                        <Eye className="h-4 w-4 md:mr-1" />
                                        <span className="hidden md:inline">View</span>
                                      </Link>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-xs md:text-base px-1 md:px-3 py-1 md:py-2 min-h-0 h-auto"
                                      asChild
                                    >
                                      <Link to={`/budget/${budget.id}/edit`}>
                                        <Edit className="h-4 w-4 md:mr-1" />
                                        <span className="hidden md:inline">Edit</span>
                                      </Link>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleCopyBudget(budget)}
                                      className="text-primary hover:text-primary text-xs md:text-base px-2 py-1 min-h-0 h-auto"
                                    >
                                      <Copy className="h-4 w-4" />
                                      <span className="hidden md:inline ml-1">Copy</span>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeleteBudget(budget.id)}
                                      className="text-destructive hover:text-destructive text-xs md:text-base px-2 py-1 min-h-0 h-auto"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}