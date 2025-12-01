import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Calculator, Plus, Eye, Edit, Trash2, LogOut, Calendar, Copy } from "lucide-react"; // Added Copy icon
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { listBudgetsByUser, deleteBudget as deleteBudgetApi, createBudget } from '@/lib/budgetsApi';

interface CommitmentItem {
  id: string;
  name: string;
  amounts: Record<string, number>;
  paidStatus: Record<string, boolean>; // Added paidStatus based on CreateViewEditBudget.tsx
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

  // Helper function to calculate total commitments and balance for a budget
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
    // 1. Determine the latest existing budget date among all budgets
    // We initialize with the originalBudget's date to ensure it's considered if it's the only or latest one.
    const latestBudget = budgets.reduce((latest, current) => {
      const latestDate = new Date(latest.year, months.indexOf(latest.month));
      const currentDate = new Date(current.year, months.indexOf(current.month));
      return currentDate > latestDate ? current : latest;
    }, originalBudget); // Start comparison with the original budget itself

    const latestMonthIndex = months.indexOf(latestBudget.month);
    const latestYear = latestBudget.year;

    // 2. Calculate the next month and year based on the latest date found
    const newMonthIndex = (latestMonthIndex + 1) % 12;
    let newYear = latestYear;
    if (newMonthIndex === 0 && latestMonthIndex === 11) { // If it was December, move to next year
      newYear++;
    }
    const newMonth = months[newMonthIndex];

    // 3. Deep copy commitments and reset paidStatus
    const newCommitments: CommitmentGroup[] = originalBudget.commitments.map(group => ({
      ...group,
      id: `group_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, // New unique ID for group
      items: group.items.map(item => ({
        ...item,
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, // New unique ID for item
        paidStatus: originalBudget.members.reduce((acc, member) => ({ ...acc, [member]: false }), {}), // All default to unpaid
      })),
    }));

    // 4. Create new budget object
    // Persist via Supabase

    // Calculate derived totals for the new budget
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
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="/icon.png" alt="Budget Icon" className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Budget Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild>
                <Link to="/create-budget">
                  <Plus className="h-4 w-4 mr-2" />
                  New Budget
                </Link>
              </Button>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {budgets.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">No budgets yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first budget to start tracking your expenses and managing your finances effectively.
            </p>
            <Button asChild>
              <Link to="/create-budget">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Budget
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-foreground">Your Budgets</h2>
              <p className="text-muted-foreground">{budgets.length} budget{budgets.length !== 1 ? 's' : ''} total</p>
            </div>

            <div className="space-y-6">
              {Object.entries(
                budgets.reduce((acc, budget) => {
                  (acc[budget.year] = acc[budget.year] || []).push(budget)
                  return acc
                }, {} as Record<string, typeof budgets>)
              )
              // Sort by year descending (latest year first)
              .sort(([aYear], [bYear]) => Number(bYear) - Number(aYear))
              .map(([year, yearBudgets], index) => (
                <Accordion key={year} 
                type="single" collapsible
                defaultValue={index === 0 ? year : undefined}
                >
                  <AccordionItem value={year}>
                    <AccordionTrigger className="text-lg font-semibold flex items-center justify-between">
                      <span className="text-left">{year}</span>
                      <span className="text-muted-foreground flex-1 text-end pr-2">{yearBudgets.length}</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-4">
                        {yearBudgets.map((budget) => (
                          <Card key={budget.id} className="border-border hover:shadow-lg transition-shadow">
                            <CardHeader>
                              <CardTitle className="flex items-center justify-between">
                                <span>{budget.name}</span>
                                <span className="text-sm font-normal text-muted-foreground">
                                  {budget.month} {budget.year}
                                </span>
                              </CardTitle>
                              <CardDescription>
                                {budget.members.map(m => m.split('@')[0]).join(' & ')}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Total Salary:</span>
                                  <span className="font-medium text-success">
                                    RM {Object.values(budget.salaries || {}).reduce((sum, salary) => sum + salary, 0).toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Commitments:</span>
                                  <span className="font-medium text-destructive">
                                    RM {Object.values(budget.total_commitments || {}).reduce((sum: number, commitment: number) => sum + commitment, 0).toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm font-medium pt-2 border-t border-border">
                                  <span>Balance:</span>
                                  <span className={Object.values(budget.balance || {}).reduce((sum, balance) => sum + balance, 0) >= 0 ? 'text-success' : 'text-destructive'}>
                                    RM {Object.values(budget.balance || {}).reduce((sum, balance) => sum + balance, 0).toLocaleString()}
                                  </span>
                                </div>
                              </div>

                              <div className="flex space-x-2 mt-6">
                                <Button variant="outline" size="sm" className="flex-1" asChild>
                                  <Link to={`/budget/${budget.id}`}>
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </Link>
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1" asChild>
                                  <Link to={`/budget/${budget.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Link>
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleCopyBudget(budget)} // New Copy button
                                  className="text-primary hover:text-primary"
                                >
                                  <Copy className="h-4 w-4" />
                                  Copy
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleDeleteBudget(budget.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
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