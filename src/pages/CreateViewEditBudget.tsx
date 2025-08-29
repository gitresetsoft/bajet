import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, ArrowLeft, Plus, X, Eye, Edit, Save, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface CommitmentItem {
  id: string;
  name: string;
  amounts: Record<string, number>;
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
  totalCommitments: Record<string, number>;
  balance: Record<string, number>;
  createdAt: string;
}

type Mode = 'create' | 'view' | 'edit';

export default function CreateViewEditBudget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { budgetId, mode: urlMode } = useParams<{ budgetId?: string; mode?: string }>();
  
  // Determine the mode based on URL
  const mode: Mode = urlMode === 'edit' ? 'edit' : budgetId ? 'view' : 'create';
  
  const [budgetName, setBudgetName] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [members, setMembers] = useState([user?.name || '']);
  const [commitments, setCommitments] = useState<CommitmentGroup[]>([]);
  const [salaries, setSalaries] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

  // Calculate totals
  const calculateTotals = () => {
    const totalCommitments: Record<string, number> = {};
    const balance: Record<string, number> = {};

    // Initialize totals for each member
    members.forEach(member => {
      totalCommitments[member] = 0;
      balance[member] = 0;
    });

    // Calculate total commitments
    commitments.forEach(group => {
      group.items.forEach(item => {
        members.forEach(member => {
          totalCommitments[member] += item.amounts[member] || 0;
        });
      });
    });

    // Calculate balance
    members.forEach(member => {
      balance[member] = (salaries[member] || 0) - totalCommitments[member];
    });

    return { totalCommitments, balance };
  };

  const { totalCommitments, balance } = calculateTotals();

  // Load budget data for view/edit modes
  useEffect(() => {
    if (mode === 'view' || mode === 'edit') {
      setIsLoading(true);
      try {
        const savedBudgets = JSON.parse(localStorage.getItem(`budgets_${user?.id}`) || '[]');
        const budget = savedBudgets.find((b: Budget) => b.id === budgetId);
        
        if (budget) {
          setBudgetName(budget.name);
          setSelectedMonth(budget.month);
          setSelectedYear(budget.year);
          setMembers(budget.members);
          setCommitments(budget.commitments || []);
          setSalaries(budget.salaries || {});
        } else {
          toast({
            title: "Budget not found",
            description: "The requested budget could not be found.",
            variant: "destructive",
          });
          navigate('/dashboard');
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load budget data.",
          variant: "destructive",
        });
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    }
  }, [budgetId, mode, user?.id, navigate, toast]);

  const addMember = () => {
    if (members.length < 2) {
      setMembers([...members, '']);
    }
  };

  const removeMember = (index: number) => {
    if (members.length > 1) {
      const newMembers = members.filter((_, i) => i !== index);
      setMembers(newMembers);
      
      // Update commitments to remove the member's amounts
      setCommitments(prev => prev.map(group => ({
        ...group,
        items: group.items.map(item => {
          const newAmounts = { ...item.amounts };
          delete newAmounts[members[index]];
          return { ...item, amounts: newAmounts };
        })
      })));
    }
  };

  const updateMember = (index: number, value: string) => {
    const updatedMembers = [...members];
    const oldName = updatedMembers[index];
    updatedMembers[index] = value;
    setMembers(updatedMembers);
    
    // Update commitments to rename the member's amounts
    if (oldName && oldName !== value) {
      setCommitments(prev => prev.map(group => ({
        ...group,
        items: group.items.map(item => {
          const newAmounts = { ...item.amounts };
          if (newAmounts[oldName] !== undefined) {
            newAmounts[value] = newAmounts[oldName];
            delete newAmounts[oldName];
          }
          return { ...item, amounts: newAmounts };
        })
      })));
      
      // Update salaries
      setSalaries(prev => {
        const newSalaries = { ...prev };
        if (newSalaries[oldName] !== undefined) {
          newSalaries[value] = newSalaries[oldName];
          delete newSalaries[oldName];
        }
        return newSalaries;
      });
    }
  };

  const addCommitmentGroup = () => {
    const newGroup: CommitmentGroup = {
      id: `group_${Date.now()}`,
      name: '',
      items: [],
      isExpanded: true
    };
    setCommitments([...commitments, newGroup]);
  };

  const updateCommitmentGroup = (groupId: string, name: string) => {
    setCommitments(prev => prev.map(group => 
      group.id === groupId ? { ...group, name } : group
    ));
  };

  const removeCommitmentGroup = (groupId: string) => {
    setCommitments(prev => prev.filter(group => group.id !== groupId));
  };

  const toggleGroupExpansion = (groupId: string) => {
    setCommitments(prev => prev.map(group => 
      group.id === groupId ? { ...group, isExpanded: !group.isExpanded } : group
    ));
  };

  const addCommitmentItem = (groupId: string) => {
    const newItem: CommitmentItem = {
      id: `item_${Date.now()}`,
      name: '',
      amounts: {}
    };
    
    setCommitments(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, items: [...group.items, newItem] }
        : group
    ));
  };

  const updateCommitmentItem = (groupId: string, itemId: string, name: string) => {
    setCommitments(prev => prev.map(group => 
      group.id === groupId 
        ? {
            ...group,
            items: group.items.map(item => 
              item.id === itemId ? { ...item, name } : item
            )
          }
        : group
    ));
  };

  const updateCommitmentAmount = (groupId: string, itemId: string, member: string, amount: number) => {
    setCommitments(prev => prev.map(group => 
      group.id === groupId 
        ? {
            ...group,
            items: group.items.map(item => 
              item.id === itemId 
                ? { ...item, amounts: { ...item.amounts, [member]: amount } }
                : item
            )
          }
        : group
    ));
  };

  const removeCommitmentItem = (groupId: string, itemId: string) => {
    setCommitments(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, items: group.items.filter(item => item.id !== itemId) }
        : group
    ));
  };

  const updateSalary = (member: string, salary: number) => {
    setSalaries(prev => ({ ...prev, [member]: salary }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!budgetName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a budget name.",
        variant: "destructive",
      });
      return;
    }

    if (members.some(member => !member.trim())) {
      toast({
        title: "Validation Error",
        description: "Please fill in all member names.",
        variant: "destructive",
      });
      return;
    }

    // Validate commitments
    const hasEmptyGroups = commitments.some(group => !group.name.trim());
    const hasEmptyItems = commitments.some(group => 
      group.items.some(item => !item.name.trim())
    );

    if (hasEmptyGroups || hasEmptyItems) {
      toast({
        title: "Validation Error",
        description: "Please fill in all commitment group and item names.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const existingBudgets = JSON.parse(localStorage.getItem(`budgets_${user?.id}`) || '[]');
      
      if (mode === 'create') {
        // Create new budget
        const newBudget: Budget = {
          id: `budget_${Date.now()}`,
          name: budgetName.trim(),
          month: selectedMonth,
          year: selectedYear,
          members: members.filter(member => member.trim()),
          commitments: commitments.filter(group => group.name.trim()),
          salaries,
          totalCommitments,
          balance,
          createdAt: new Date().toISOString(),
        };
        
        const updatedBudgets = [...existingBudgets, newBudget];
        localStorage.setItem(`budgets_${user?.id}`, JSON.stringify(updatedBudgets));

        toast({
          title: "Budget created!",
          description: "Your new budget has been successfully created.",
        });
      } else if (mode === 'edit') {
        // Update existing budget
        const budgetIndex = existingBudgets.findIndex((b: Budget) => b.id === budgetId);
        if (budgetIndex !== -1) {
          const updatedBudget: Budget = {
            ...existingBudgets[budgetIndex],
            name: budgetName.trim(),
            month: selectedMonth,
            year: selectedYear,
            members: members.filter(member => member.trim()),
            commitments: commitments.filter(group => group.name.trim()),
            salaries,
            totalCommitments,
            balance,
          };
          
          existingBudgets[budgetIndex] = updatedBudget;
          localStorage.setItem(`budgets_${user?.id}`, JSON.stringify(existingBudgets));

          toast({
            title: "Budget updated!",
            description: "Your budget has been successfully updated.",
          });
        }
      }

      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Error",
        description: mode === 'create' ? "Failed to create budget. Please try again." : "Failed to update budget. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPageTitle = () => {
    switch (mode) {
      case 'create':
        return 'Create New Budget';
      case 'view':
        return 'View Budget';
      case 'edit':
        return 'Edit Budget';
      default:
        return 'Budget';
    }
  };

  const getCardTitle = () => {
    switch (mode) {
      case 'create':
        return 'Budget Details';
      case 'view':
        return 'Budget Information';
      case 'edit':
        return 'Edit Budget Details';
      default:
        return 'Budget';
    }
  };

  const getCardDescription = () => {
    switch (mode) {
      case 'create':
        return 'Set up your new budget by providing the basic information below.';
      case 'view':
        return 'View the details of your budget.';
      case 'edit':
        return 'Modify your budget information below.';
      default:
        return '';
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
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <Calculator className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">{getPageTitle()}</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content ---------------------------------------------------------*/}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Basic Information Card */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Set up the basic details of your budget.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Top Row: Title, Month, Year */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budgetName">Budget Name</Label>
                    <Input
                      id="budgetName"
                      placeholder="e.g., Family Budget, Personal Expenses"
                      value={budgetName}
                      onChange={(e) => setBudgetName(e.target.value)}
                      required
                      disabled={mode === 'view'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Month</Label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={mode === 'view'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month) => (
                          <SelectItem key={month} value={month}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))} disabled={mode === 'view'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Second Row: Members */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Budget Members</Label>
                    {mode !== 'view' && members.length < 2 && (
                      <Button type="button" variant="outline" size="sm" onClick={addMember}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Member
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {members.map((member, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          placeholder={`Member ${index + 1} name`}
                          value={member}
                          onChange={(e) => updateMember(index, e.target.value)}
                          required
                          disabled={mode === 'view'}
                        />
                        {mode !== 'view' && members.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeMember(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You can add up to 2 members for this budget.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Commitments Card --------------------------------------------------------- */}
          <Card className="border-border">
             <CardHeader>
               <div className="flex items-center justify-between">
                 <div>
                   <CardTitle>Commitments</CardTitle>
                   <CardDescription>
                     Add your monthly commitments and expenses for each member.
                   </CardDescription>
                 </div>
                 {mode !== 'view' && (
                   <Button type="button" variant="outline" size="sm" onClick={addCommitmentGroup}>
                     <Plus className="h-4 w-4 mr-2" />
                     Add Group
                   </Button>
                 )}
               </div>
             </CardHeader>
             <CardContent>
               <div className="space-y-6">
                 {commitments.map((group) => (
                   <div key={group.id} className="border border-border rounded-lg p-4">
                     {/* Group Header */}
                     <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center space-x-2">
                         <Button
                           type="button"
                           variant="ghost"
                           size="sm"
                           onClick={() => toggleGroupExpansion(group.id)}
                           disabled={mode === 'view'}
                         >
                           {group.isExpanded ? (
                             <ChevronDown className="h-4 w-4" />
                           ) : (
                             <ChevronRight className="h-4 w-4" />
                           )}
                         </Button>
                         <Input
                           placeholder="Group name (e.g., Rumah, Loan)"
                           value={group.name}
                           onChange={(e) => updateCommitmentGroup(group.id, e.target.value)}
                           disabled={mode === 'view'}
                           className="w-48"
                         />
                       </div>
                       {mode !== 'view' && (
                         <div className="flex items-center space-x-2">
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => addCommitmentItem(group.id)}
                           >
                             <Plus className="h-4 w-4 mr-1" />
                             Add Item
                           </Button>
                           <Button
                             type="button"
                             variant="outline"
                             size="icon"
                             onClick={() => removeCommitmentGroup(group.id)}
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         </div>
                       )}
                     </div>

                     {/* Group Items - Horizontal Layout per Member */}
                     {group.isExpanded && (
                       <div className="space-y-3 ml-6">
                         {group.items.map((item) => (
                           <div key={item.id} className="space-y-2">
                             {/* Item Name Row */}
                             <div className="flex items-center space-x-2">
                               <Input
                                 placeholder="Item name"
                                 value={item.name}
                                 onChange={(e) => updateCommitmentItem(group.id, item.id, e.target.value)}
                                 disabled={mode === 'view'}
                                 className="flex-1"
                               />
                             
                              {/* Member Amounts Row */}
                              {members.map((member) => (
                                 <div key={member} className="flex items-center space-x-2">
                                   <Label className="w-16 text-sm font-medium">{member ? member : 'Member 2'}:</Label>
                                   <Input
                                     type="number"
                                     placeholder="0.00"
                                     value={item.amounts[member] || ''}
                                     onChange={(e) => updateCommitmentAmount(group.id, item.id, member, parseFloat(e.target.value) || 0)}
                                     disabled={mode === 'view'}
                                     className="flex-1"
                                     step="0.01"
                                     min="0"
                                   />
                                 </div>
                               ))}
                               
                               {mode !== 'view' && (
                                 <Button
                                   type="button"
                                   variant="outline"
                                   size="icon"
                                   onClick={() => removeCommitmentItem(group.id, item.id)}
                                 >
                                   <X className="h-4 w-4" />
                                 </Button>
                               )}
                               
                             </div>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 ))}

                 {commitments.length === 0 && (
                   <div className="text-center py-8 text-muted-foreground">
                     No commitments added yet. {mode !== 'view' && 'Click "Add Group" to get started.'}
                   </div>
                 )}
               </div>
             </CardContent>
           </Card>

          {/* Summary Card --------------------------------------------------------- */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>
                Overview of your budget totals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Salary Row */}
                <div className="flex items-center space-x-4">
                  <Label className="w-32 font-medium">Salary:</Label>
                  {members.map((member) => (
                    <div key={member} className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">{member}:</span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={salaries[member] || ''}
                        onChange={(e) => updateSalary(member, parseFloat(e.target.value) || 0)}
                        disabled={mode === 'view'}
                        className="w-24"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  ))}
                </div>

                {/* Total Commitments Row */}
                <div className="flex items-center space-x-4">
                  <Label className="w-32 font-medium">Total Commitments:</Label>
                  {members.map((member) => (
                    <div key={member} className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">{member}:</span>
                      <span className="w-24 text-right font-medium text-destructive">
                        RM {totalCommitments[member]?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Balance Row */}
                <div className="flex items-center space-x-4 pt-2 border-t border-border">
                  <Label className="w-32 font-medium">Balance:</Label>
                  {members.map((member) => (
                    <div key={member} className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">{member}:</span>
                      <span className={`w-24 text-right font-bold ${balance[member] >= 0 ? 'text-success' : 'text-destructive'}`}>
                        RM {balance[member]?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-4">
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
      </main>
    </div>
  );
}
