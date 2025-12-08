import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText } from 'lucide-react';

export interface BasicInformationCardProps {
  budgetName: string;
  selectedMonth: string;
  selectedYear: number;
  members: string[];
  onBudgetNameChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onYearChange: (value: number) => void;
  onAddMember: () => void;
  onRemoveMember: (index: number) => void;
  onUpdateMember: (index: number, value: string) => void;
  onExportPdf: () => void;
  disabled?: boolean;
}

export function BasicInformationCard({
  budgetName,
  selectedMonth,
  selectedYear,
  members,
  onBudgetNameChange,
  onMonthChange,
  onYearChange,
  onAddMember,
  onRemoveMember,
  onUpdateMember,
  onExportPdf,
  disabled = false,
}: BasicInformationCardProps) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Set up the basic details of your budget.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onExportPdf}
            className="flex items-center space-x-2"
          >
            <FileText className="h-4 w-4 mr-1" />
            Export PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Top Row: Title, Month, Year */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budgetName">Budget Name</Label>
              <Input
                id="budgetName"
                placeholder="e.g., Family Budget, Personal Expenses"
                value={budgetName}
                onChange={(e) => onBudgetNameChange(e.target.value)}
                required
                disabled={disabled}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <Select value={selectedMonth} onValueChange={onMonthChange} disabled={disabled}>
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
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => onYearChange(parseInt(value))}
                  disabled={disabled}
                >
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

          {/* Members List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Budget Members</Label>
              {!disabled && members.length < 2 && (
                <Button type="button" variant="outline" size="sm" onClick={onAddMember}>
                  <span className="mr-2">+</span>
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
                    onChange={(e) => onUpdateMember(index, e.target.value)}
                    required
                    disabled={disabled}
                  />
                  {!disabled && members.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => onRemoveMember(index)}
                    >
                      <span>&times;</span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}