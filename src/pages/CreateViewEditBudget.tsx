import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, ArrowLeft, Plus, X, Eye, Edit, Save, ChevronDown, ChevronRight, Trash2, Table, List } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface CommitmentItem {
  id: string;
  name: string;
  remark?: string;
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
  totalCommitments: Record<string, number>;
  balance: Record<string, number>;
  createdAt: string;
}

type Mode = 'create' | 'view' | 'edit';
type ViewMode = 'structured' | 'ledger';

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
  const [viewMode, setViewMode] = useState<ViewMode>('structured');
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
    const paidAmounts: Record<string, number> = {};
    const unpaidAmounts: Record<string, number> = {};

    // Initialize totals for each member
    members.forEach(member => {
      totalCommitments[member] = 0;
      balance[member] = 0;
      paidAmounts[member] = 0;
      unpaidAmounts[member] = 0;
    });

    // Calculate total commitments and paid/unpaid amounts
    commitments.forEach(group => {
      group.items.forEach(item => {
        members.forEach(member => {
          const amount = item.amounts[member] || 0;
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

    // Calculate balance
    members.forEach(member => {
      balance[member] = (salaries[member] || 0) - totalCommitments[member];
    });

    return { totalCommitments, balance, paidAmounts, unpaidAmounts };
  };

  const { totalCommitments, balance, paidAmounts, unpaidAmounts } = calculateTotals();

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
      const newMemberName = '';
      setMembers([...members, newMemberName]);
      
      // Initialize paid status for existing commitment items for the new member
      setCommitments(prev => prev.map(group => ({
        ...group,
        items: group.items.map(item => ({
          ...item,
          paidStatus: { ...item.paidStatus, [newMemberName]: false }
        }))
      })));
    }
  };

  const removeMember = (index: number) => {
    if (members.length > 1) {
      const newMembers = members.filter((_, i) => i !== index);
      setMembers(newMembers);
      
      // Update commitments to remove the member's amounts and paid status
      setCommitments(prev => prev.map(group => ({
        ...group,
        items: group.items.map(item => {
          const newAmounts = { ...item.amounts };
          const newPaidStatus = { ...item.paidStatus };
          delete newAmounts[members[index]];
          delete newPaidStatus[members[index]];
          return { ...item, amounts: newAmounts, paidStatus: newPaidStatus };
        })
      })));
    }
  };

  const updateMember = (index: number, value: string) => {
    const updatedMembers = [...members];
    const oldName = updatedMembers[index];
    updatedMembers[index] = value;
    setMembers(updatedMembers);
    
    // Update commitments to rename the member's amounts and paid status
    if (oldName && oldName !== value) {
      setCommitments(prev => prev.map(group => ({
        ...group,
        items: group.items.map(item => {
          const newAmounts = { ...item.amounts };
          const newPaidStatus = { ...item.paidStatus };
          if (newAmounts[oldName] !== undefined) {
            newAmounts[value] = newAmounts[oldName];
            delete newAmounts[oldName];
          }
          if (newPaidStatus[oldName] !== undefined) {
            newPaidStatus[value] = newPaidStatus[oldName];
            delete newPaidStatus[oldName];
          }
          return { ...item, amounts: newAmounts, paidStatus: newPaidStatus };
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
    // Initialize paid status for all current members
    const initialPaidStatus: Record<string, boolean> = {};
    members.forEach(member => {
      initialPaidStatus[member] = false;
    });
    
    const newItem: CommitmentItem = {
      id: `item_${Date.now()}`,
      name: '',
      amounts: {},
      paidStatus: initialPaidStatus
    };
    
    setCommitments(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, items: [...group.items, newItem] }
        : group
    ));
  };

  const updateCommitmentItem = (groupId: string, itemId: string, name: string, remark?: string) => {
    setCommitments(prev => prev.map(group => 
      group.id === groupId 
        ? {
            ...group,
            items: group.items.map(item => 
              item.id === itemId ? { ...item, name, remark } : item
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
                ? { 
                    ...item, 
                    amounts: { ...item.amounts, [member]: amount },
                    paidStatus: { ...item.paidStatus, [member]: item.paidStatus[member] || false }
                  }
                : item
            )
          }
        : group
    ));
  };

  const updateCommitmentPaidStatus = (groupId: string, itemId: string, member: string, isPaid: boolean) => {
    setCommitments(prev => prev.map(group => 
      group.id === groupId 
        ? {
            ...group,
            items: group.items.map(item => 
              item.id === itemId 
                ? { 
                    ...item, 
                    paidStatus: { 
                      ...item.paidStatus, 
                      [member]: isPaid 
                    } 
                  }
                : item
            )
          }
        : group
    ));
  };

  // Helper function to ensure paid status is initialized for all members
  const ensurePaidStatusInitialized = (item: CommitmentItem) => {
    const updatedPaidStatus = { ...item.paidStatus };
    members.forEach(member => {
      if (updatedPaidStatus[member] === undefined) {
        updatedPaidStatus[member] = false;
      }
    });
    return updatedPaidStatus;
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

    // TODO: Add the group/item name for reference
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
             <img src="/icon.png" alt="Budget Icon" className="h-8 w-8" />
               <h1 className="text-2xl font-bold text-foreground">{getPageTitle()}</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        
        {/* Toggle Mode */}
        {mode === 'view' && (
          <div className="max-w-4xl mx-auto flex justify-end items-center space-x-2 pb-4">
            <span className="hidden md:inline text-sm text-muted-foreground">View Mode:</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'structured' ? 'ledger' : 'structured')}
              className="flex items-center space-x-2"
            >
              {viewMode === 'structured' ? (
                <>
                  <List className="h-4 w-4" />
                  <span className="hidden md:inline">Structured</span>
                </>
              ) : (
                <>
                  <Table className="h-4 w-4" />
                  <span className="hidden md:inline">Ledger View</span>
                </>
              )}
            </Button>
          </div>
        )}
        
        {mode === 'view' && viewMode === 'ledger' ? (
          <div className="max-w-4xl mx-auto">
             {/* Ledger View */}
             <div className="bg-white border border-border rounded-lg overflow-hidden">
               {/* Ledger Header */}
              <div className="bg-muted px-4 py-3 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground flex justify-between items-center">
                <span>{budgetName}</span>
                <span>{selectedMonth} {selectedYear}</span>
              </h2>

              </div>
               
              {/* Ledger Table */}
              <div className="overflow-x-auto">
                 <table className="w-full text-sm md:text-base">
                   {/* Table Header */}
                   <thead className="bg-muted/50">
                     <tr>
                        <th className="text-left px-2 md:px-4 py-2 font-medium text-foreground border-r border-border">
                           Commitments
                         </th>
                       {members.map((member) => (
                         <th key={member} className="text-right px-2 md:px-4 py-2 font-medium text-foreground border-r border-border last:border-r-0">
                           {member}
                         </th>
                       ))}
                     </tr>
                   </thead>
                   
                   {/* Table Body */}
                   <tbody>
                     {commitments.map((group) => (
                       <React.Fragment key={group.id}>
                         {/* Group Header */}
                         <tr className="bg-muted/30">
                           <td className="px-2 md:px-4 py-2 font-semibold text-foreground border-r border-border">
                             {group.name}
                           </td>
                           {members.map((member) => (
                             <td key={member} className="px-2 md:px-4 py-2 border-r border-border last:border-r-0"></td>
                           ))}
                         </tr>
                         
                         {/* Group Items */}
                         {group.items.map((item) => (
                           <tr key={item.id} className="border-b border-border hover:bg-muted/20">
                             <td className="px-3 md:px-6 py-2 text-foreground border-r border-border">
                               {item.name}
                             </td>
                             {members.map((member) => (
                               <td key={member} className="px-2 md:px-4 py-2 text-right border-r border-border last:border-r-0">
                                 {item.amounts[member] && item.amounts[member] > 0 ? (
                                   <span className={`${ensurePaidStatusInitialized(item)[member] ? 'font-bold text-green-600' : ''}`}>
                                     RM {item.amounts[member].toFixed(2)}
                                   </span>
                                 ) : ''}
                               </td>
                             ))}
                           </tr>
                         ))}
                       </React.Fragment>
                     ))}
                     
                     {/* Summary Section */}
                     <tr className="bg-muted/50 border-t-2 border-border">
                                                <td className="px-2 md:px-4 py-3 font-semibold text-foreground border-r border-border">
                           Salary
                         </td>
                       {members.map((member) => (
                         <td key={member} className="px-2 md:px-4 py-3 text-right font-semibold text-foreground border-r border-border last:border-r-0">
                           RM {(salaries[member] || 0).toFixed(2)}
                         </td>
                       ))}
                     </tr>
                     
                     <tr className="border-b border-border">
                                                <td className="px-2 md:px-4 py-2 font-semibold text-foreground border-r border-border">
                           Total Commitments
                         </td>
                       {members.map((member) => (
                         <td key={member} className="px-2 md:px-4 py-2 text-right font-semibold text-destructive border-r border-border last:border-r-0">
                           RM {totalCommitments[member]?.toFixed(2) || '0.00'}
                         </td>
                       ))}
                     </tr>
                     
                     <tr className="bg-muted/30 border-t-2 border-border">
                                                <td className="px-2 md:px-4 py-3 font-bold text-foreground border-r border-border">
                           Balance
                         </td>
                       {members.map((member) => (
                         <td key={member} className={`px-2 md:px-4 py-3 text-right font-bold border-r border-border last:border-r-0 ${
                           balance[member] >= 0 ? 'text-success' : 'text-destructive'
                         }`}>
                           RM {balance[member]?.toFixed(2) || '0.00'}
                         </td>
                       ))}
                     </tr>
                   </tbody>
                 </table>
               </div>
             </div>
             
             {/* Action Buttons for Ledger View */}
             <div className="flex space-x-4 mt-6">
               <Button type="button" variant="outline" asChild className="flex-1">
                 <Link to="/dashboard">Back to Dashboard</Link>
               </Button>
               <Button type="button" asChild className="flex-1">
                 <Link to={`/budget/${budgetId}/edit`}>
                   <Edit className="h-4 w-4 mr-2" />
                   Edit Budget
                 </Link>
               </Button>
             </div>
           </div>
         ) : (
           <div className="max-w-4xl mx-auto space-y-6">
          {/* Basic Information Card --------------------------------------------------------- */}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                           value={`${group.name} (${group.items.length})`}
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
                         {group.items.map((item, index) => (
                            <div key={item.id} className="space-y-2 shadow-md rounded-md p-2">
                              {/* Item Name Row */}

                              <div className="grid grid-cols-2 md:grid-cols-[35%_55%_10%] gap-4">
                                <div>
                                  <Label>Item {index+1}:</Label>
                                  <Input
                                    placeholder="Commitments.."
                                    value={item.name}
                                    onChange={(e) => updateCommitmentItem(group.id, item.id, e.target.value, item.remark)}
                                    disabled={mode === 'view'}
                                    className="flex-1"
                                  />
                                </div>
                                
                                <div>
                                  <Label>Remark:</Label>
                                  <Input
                                    placeholder="Enter remark here..."
                                    value={item.remark}
                                    onChange={(e) => updateCommitmentItem(group.id, item.id, item.name, e.target.value)}
                                    disabled={mode === 'view'}
                                    className="flex-1"
                                  />
                                </div>

                                {mode !== 'view' && (
                                  <Button
                                    className="md:mt-6"
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => removeCommitmentItem(group.id, item.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                                
                                </div>
                              
                                {/* Member Amounts Row */}
                                <div className="grid grid-cols-2 md:grid-cols-2 gap-4 pl-4">
                                  {members.map((member) => (
                                    <div key={member} className="flex items-center space-x-2">
                                      <Label className="w-16 text-sm font-medium">{member ? member : 'Member 2'}:</Label>
                                      <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={item.amounts[member] || ''}
                                        onChange={(e) => updateCommitmentAmount(group.id, item.id, member, parseFloat(e.target.value) || 0)}
                                        disabled={mode === 'view'}
                                        className="flex-1 max-w-[120px]"
                                        step="0.01"
                                        min="0"
                                      />
                                      {/* Paid/Unpaid Toggle */}
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          id={`paid-${item.id}-${member}`}
                                          checked={ensurePaidStatusInitialized(item)[member] || false}
                                          onChange={(e) => updateCommitmentPaidStatus(group.id, item.id, member, e.target.checked)}
                                          disabled={mode === 'view'}
                                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                                        />
                                        <Label 
                                          htmlFor={`paid-${item.id}-${member}`} 
                                          className={`text-xs font-medium cursor-pointer w-10 ${
                                            ensurePaidStatusInitialized(item)[member] ? 'text-green-600' : 'text-red-600'
                                          }`}
                                        >
                                          {ensurePaidStatusInitialized(item)[member] ? 'PAID' : 'UNPAID'}
                                        </Label>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                            </div>
                         ))}
                       </div>
                     )}
                   </div>
                 ))}
 
                {mode !== 'view' && (
                   <Button type="button" variant="outline" size="sm" onClick={addCommitmentGroup}>
                     <Plus className="h-4 w-4 mr-2" />
                     Add Commitments
                   </Button>
                )}

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
              <div className="space-y-4 grid grid-cols-2 md:grid-cols-1">
                {/* Salary Row */}
                <div className="flex items-center space-x-4">
                  <Label className="w-32 font-medium">Salary:</Label>
                  {members.map((member) => (
                    <div key={member} className="md:min-w-[250px] flex items-center space-x-2">
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

                {/* Paid/Unpaid Summary Row */}
                <div className="flex items-center space-x-4">
                  <Label className="w-32 font-medium">Paid / Unpaid:</Label>
                  {members.map((member) => (
                    <div key={member} className="md:min-w-[250px] flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">{member}:</span>
                      <span className="md:w-30 text-right pl-2">
                        <span className="text-green-600 font-medium">
                          RM {(paidAmounts[member] || 0).toFixed(2)}
                        </span>
                        <span className="text-muted-foreground mx-1">/</span>
                        <span className="text-red-600 font-medium">
                          RM {(unpaidAmounts[member] || 0).toFixed(2)}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total Commitments Row */}
                <div className="flex items-center space-x-4">
                  <Label className="w-32 font-medium">Total Commitments:</Label>
                  {members.map((member) => (
                    <div key={member} className="md:min-w-[250px] flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">{member}:</span>
                      <span className="w-50 text-right font-medium text-destructive pl-2">
                        RM {totalCommitments[member]?.toFixed(2) || '0.00'} 
                      </span>
                    </div>
                  ))}
                </div>

                {/* Balance Row */}
                <div className="flex items-center space-x-4 pt-2 border-t border-border">
                  <Label className="w-32 font-medium">Balance:</Label>
                  {members.map((member) => (
                    <div key={member} className="md:min-w-[250px] flex items-center space-x-2">
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
       )}
     </main>
   </div>
 );
}
