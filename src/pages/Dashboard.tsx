import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Plus, Eye, Edit, Trash2, LogOut, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Budget {
  id: string;
  name: string;
  month: string;
  year: number;
  members: string[];
  totalCommitments: number;
  totalSalary: number;
  balance: number;
  createdAt: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);

  useEffect(() => {
    // Load user's budgets from localStorage
    const savedBudgets = localStorage.getItem(`budgets_${user?.id}`);
    if (savedBudgets) {
      setBudgets(JSON.parse(savedBudgets));
    }
  }, [user?.id]);

  const handleDeleteBudget = (budgetId: string) => {
    const updatedBudgets = budgets.filter(budget => budget.id !== budgetId);
    setBudgets(updatedBudgets);
    localStorage.setItem(`budgets_${user?.id}`, JSON.stringify(updatedBudgets));
    toast({
      title: "Budget deleted",
      description: "Budget has been successfully removed.",
    });
  };

  const handleLogout = () => {
    logout();
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
              <Calculator className="h-8 w-8 text-primary" />
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

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {budgets.map((budget) => (
                <Card key={budget.id} className="border-border hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{budget.name}</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {budget.month} {budget.year}
                      </span>
                    </CardTitle>
                    <CardDescription>
                      {budget.members.join(' & ')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Salary:</span>
                        <span className="font-medium text-success">
                          ${budget.totalSalary.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Commitments:</span>
                        <span className="font-medium text-destructive">
                          ${budget.totalCommitments.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-medium pt-2 border-t border-border">
                        <span>Balance:</span>
                        <span className={budget.balance >= 0 ? 'text-success' : 'text-destructive'}>
                          ${budget.balance.toLocaleString()}
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
          </div>
        )}
      </main>
    </div>
  );
}