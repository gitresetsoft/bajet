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
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold mb-0">Basic Information</CardTitle>
            <CardDescription className="text-xs">
              Set up the basic details of your budget.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onExportPdf}
            className="flex items-center px-2 py-0.5 h-7 min-h-0 text-xs space-x-1"
          >
            <FileText className="h-4 w-4 mr-1" />
            Export PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Responsive: mobile uses vertical stacking, desktop = grid of rows */}
        <div className="
          space-y-2
          grid grid-cols-1 md:grid-cols-2
          gap-x-2 gap-y-1
        ">
          {/* Top Row: Title (Name), Month, Year */}
          <div className="flex flex-col md:flex-row md:items-center md:space-x-2 md:mb-0 mb-1">
            <Label htmlFor="budgetName" className="block md:w-32 min-w-[90px] font-medium text-xs mb-1 md:mb-0">
              Budget Name
            </Label>
            <Input
              id="budgetName"
              placeholder="e.g., Family Budget, Personal Expenses"
              value={budgetName}
              onChange={(e) => onBudgetNameChange(e.target.value)}
              required
              disabled={disabled}
              className="w-full md:w-56 h-7 px-2 py-1 text-xs"
            />
          </div>
          {/* Month and Year */}
          <div className="flex md:items-center md:space-x-2 flex-col md:flex-row space-y-1 md:space-y-0">
            <div className="flex items-center space-x-2 w-full">
              <Label className="block font-medium text-xs min-w-[48px]">Month</Label>
              <Select
                value={selectedMonth}
                onValueChange={onMonthChange}
                disabled={disabled}
              >
                <SelectTrigger className="w-full md:w-32 h-7 px-2 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month} className="text-xs">
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 w-full">
              <Label className="block font-medium text-xs min-w-[32px]">Year</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => onYearChange(parseInt(value))}
                disabled={disabled}
              >
                <SelectTrigger className="w-full md:w-24 h-7 px-2 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()} className="text-xs">
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Members List */}
          <div className="md:col-span-2 flex flex-col space-y-1 pt-2">
            <div className="flex items-center justify-between mb-1">
              <Label className="block font-medium text-xs">Budget Members</Label>
              {!disabled && members.length < 2 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onAddMember}
                  className="px-2 py-1 h-7 text-xs"
                >
                  <span className="mr-1">+</span>
                  Add Member
                </Button>
              )}
            </div>
            <div className="flex flex-col space-y-1">
              {members.map((member, index) => (
                <div key={index} className="flex items-center space-x-1">
                  <Input
                    placeholder={`Member ${index + 1} name`}
                    value={member}
                    onChange={(e) => onUpdateMember(index, e.target.value)}
                    required
                    disabled={disabled}
                    className="h-7 px-2 py-1 text-xs w-full md:w-56"
                  />
                  {!disabled && members.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => onRemoveMember(index)}
                      className="h-7 w-7 text-xs"
                      title="Remove member"
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