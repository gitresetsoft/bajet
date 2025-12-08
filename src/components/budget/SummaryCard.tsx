// src/components/budget/SummaryCard.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText } from 'lucide-react';

interface SummaryCardProps {
  members: string[];
  salaries: Record<string, number>;
  totalCommitments: Record<string, number>;
  balance: Record<string, number>;
  paidAmounts: Record<string, number>;
  unpaidAmounts: Record<string, number>;
  onUpdateSalary: (member: string, salary: number) => void;
  onExportPdf: () => void;
  disabled?: boolean;
}

export function SummaryCard({
  members,
  salaries,
  totalCommitments,
  balance,
  paidAmounts,
  unpaidAmounts,
  onUpdateSalary,
  onExportPdf,
  disabled = false,
}: SummaryCardProps) {
  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Summary</CardTitle>
            <CardDescription>
              Overview of your budget totals.
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
        <div className="space-y-4 grid grid-cols-2 md:grid-cols-1">
          {/* Salary Row */}
          <div className="flex items-center space-x-4">
            <Label className="w-32 font-medium">Salary:</Label>
            {members.map((member) => (
              <div key={member} className="md:min-w-[250px] flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">{member.split('@')[0]}:</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={salaries[member] || ''}
                  onChange={(e) => onUpdateSalary(member, parseFloat(e.target.value) || 0)}
                  disabled={disabled}
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
                <span className="text-sm text-muted-foreground">{member.split('@')[0]}:</span>
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
                <span className="text-sm text-muted-foreground">{member.split('@')[0]}:</span>
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
                <span className="text-sm text-muted-foreground">{member.split('@')[0]}:</span>
                <span className={`w-24 text-right font-bold ${balance[member] >= 0 ? 'text-success' : 'text-destructive'}`}>
                  RM {balance[member]?.toFixed(2) || '0.00'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}