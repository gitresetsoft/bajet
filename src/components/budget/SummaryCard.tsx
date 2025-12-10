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
  // Helper to map rows for "tabular" summary
  const rowData = [
    {
      label: "Member / Salary",
      render: (member: string) => (
        <div className="flex flex-col items-center pb-1 max-w-[50px]">
          <span className="text-xs pt-1 pl-3 text-muted-foreground text-left">
            {member.split('@')[0]}
          </span>
          <span
            className="w-16 h-6 px-2 text-xs text-left"
          >
            {typeof salaries[member] === "number" ? salaries[member].toFixed(2) : ''}
          </span>
        </div>
      ),
    },
    {
      label: "Paid / Unpaid",
      render: (member: string) => (
        <span className="text-xs text-left block">
          <span className="text-green-600 font-medium">
            RM {(paidAmounts[member] || 0).toFixed(2)}
          </span>
          <span className="text-muted-foreground mx-0.5">/</span><br/>
          <span className="text-red-600 font-medium">
            RM {(unpaidAmounts[member] || 0).toFixed(2)}
          </span>
        </span>
      ),
    },
    {
      label: "Total Commitments",
      render: (member: string) => (
        <span className="max-w-[70px] text-left font-medium text-destructive text-xs pl-1 block">
          RM {totalCommitments[member]?.toFixed(2) || '0.00'}
        </span>
      ),
    },
    {
      label: "Balance",
      render: (member: string) => (
        <span
          className={`w-20 text-left font-bold text-xs block ${
            balance[member] >= 0 ? 'text-success' : 'text-destructive'
          }`}
        >
          RM {balance[member]?.toFixed(2) || '0.00'}
        </span>
      ),
    },
  ];

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold mb-0">Summary</CardTitle>
            <CardDescription className="text-xs">Overview of your budget totals.</CardDescription>
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
        {/* Desktop: Keep 2-column summary as before. Mobile: Tabular with headers as first row, one row per summary field */}
        <div className="hidden md:grid space-y-2 grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-1">
          {/* Salary Row */}
          <div className="flex flex-col md:flex-row md:items-center md:space-x-2 md:mb-0 mb-1">
            <Label className="block md:w-32 min-w-[90px] font-medium text-xs mb-1 md:mb-0">Salary:</Label>
            <div className="flex flex-col md:flex-row gap-0 md:gap-2">
              {members.map((member) => (
                <div key={member} className="flex items-center space-x-1 md:min-w-[125px] mb-1 md:mb-0">
                  <span className="text-xs text-muted-foreground">{member.split('@')[0]}:</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={salaries[member] || ''}
                    onChange={(e) =>
                      onUpdateSalary(member, parseFloat(e.target.value) || 0)
                    }
                    disabled={disabled}
                    className="w-16 h-7 px-2 py-1 text-xs"
                    step="0.01"
                    min="0"
                  />
                </div>
              ))}
            </div>
          </div>
          {/* Paid/Unpaid Summary Row */}
          <div className="flex flex-col md:flex-row md:items-center md:space-x-2">
            <Label className="block md:w-32 min-w-[90px] font-medium text-xs mb-1 md:mb-0">
              Paid / Unpaid:
            </Label>
            <div className="flex flex-col md:flex-row gap-0 md:gap-2">
              {members.map((member) => (
                <div key={member} className="flex items-center space-x-1 md:min-w-[130px] mb-1 md:mb-0">
                  <span className="text-xs text-muted-foreground">{member.split('@')[0]}:</span>
                  <span className="text-xs md:w-28 text-right pl-1">
                    <span className="text-green-600 font-medium">
                      RM {(paidAmounts[member] || 0).toFixed(2)}
                    </span>
                    <span className="text-muted-foreground mx-0.5">/</span>
                    <span className="text-red-600 font-medium">
                      RM {(unpaidAmounts[member] || 0).toFixed(2)}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* Total Commitments Row */}
          <div className="flex flex-col md:flex-row md:items-center md:space-x-2">
            <Label className="block md:w-32 min-w-[90px] font-medium text-xs mb-1 md:mb-0">
              Total Commitments:
            </Label>
            <div className="flex flex-col md:flex-row gap-0 md:gap-2">
              {members.map((member) => (
                <div key={member} className="flex items-center space-x-1 md:min-w-[130px] mb-1 md:mb-0">
                  <span className="text-xs text-muted-foreground">{member.split('@')[0]}:</span>
                  <span className="w-20 text-right font-medium text-destructive text-xs pl-1">
                    RM {totalCommitments[member]?.toFixed(2) || '0.00'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* Balance Row */}
          <div className="flex flex-col md:flex-row md:items-center md:space-x-2 pt-1 border-t border-border">
            <Label className="block md:w-32 min-w-[90px] font-medium text-xs mb-1 md:mb-0">
              Balance:
            </Label>
            <div className="flex flex-col md:flex-row gap-0 md:gap-2">
              {members.map((member) => (
                <div key={member} className="flex items-center space-x-1 md:min-w-[130px] mb-1 md:mb-0">
                  <span className="text-xs text-muted-foreground">{member.split('@')[0]}:</span>
                  <span
                    className={`w-20 text-right font-bold text-xs ${
                      balance[member] >= 0 ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    RM {balance[member]?.toFixed(2) || '0.00'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* MOBILE: summary table */}
        <div className="md:hidden w-full overflow-x-auto mt-2">
          <table className="min-w-[360px] w-full text-xs border-collapse">
            <thead>
              <tr>
                {/* <th className="py-1 px-2 text-muted-foreground font-medium text-left bg-muted">Member</th> */}
                {rowData.map(row => (
                  <th
                    key={row.label}
                    className={`py-1 px-2 text-muted-foreground font-medium text-left bg-muted`}
                  >
                    {row.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
                <tr key={member} className="border-b last:border-0">
                  {/* <td className="py-1 px-2 text-foreground font-semibold align-middle min-w-[90px]">
                    {member.split('@')[0]}
                  </td> */}
                  {rowData.map((row, i) => (
                    <td key={row.label} className="py-0 px-2 align-middle">
                      {row.render(member)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}