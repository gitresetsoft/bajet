// src/components/budget/LedgerView.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CommitmentGroup } from '@/interface/Budget';
import { ensurePaidStatusInitialized } from '@/lib/budgetHelper';

interface LedgerViewProps {
  budgetId?: string;
  budgetName: string;
  selectedMonth: string;
  selectedYear: number;
  members: string[];
  commitments: CommitmentGroup[];
  salaries: Record<string, number>;
  totalCommitments: Record<string, number>;
  balance: Record<string, number>;
}

export function LedgerView({
  budgetId,
  budgetName,
  selectedMonth,
  selectedYear,
  members,
  commitments,
  salaries,
  totalCommitments,
  balance,
}: LedgerViewProps) {
  // Reusable summary row data for mobile
  const summaryRows = [
    {
      label: 'Salary',
      className: '',
      getValue: (member: string) => `RM ${(salaries[member] || 0).toFixed(2)}`
    },
    {
      label: 'Total Commitments',
      className: 'text-destructive',
      getValue: (member: string) =>
        `RM ${totalCommitments[member]?.toFixed(2) || '0.00'}`
    },
    {
      label: 'Balance',
      className: (member: string) =>
        (balance[member] >= 0 ? 'text-success' : 'text-destructive font-bold'),
      getValue: (member: string) =>
        `RM ${balance[member]?.toFixed(2) || '0.00'}`
    }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Ledger Table - DESKTOP */}
      <div className="hidden md:block bg-white border border-border rounded-lg overflow-hidden">
        {/* Ledger Header */}
        <div className="bg-muted px-2 py-2 border-b border-border flex justify-between items-center">
          <h2 className="text-base font-semibold text-foreground flex items-center">
            <span>{budgetName}</span>
            <span className="ml-2">{selectedMonth} {selectedYear}</span>
          </h2>
        </div>
        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-2 py-1 font-medium text-foreground border-r border-border">
                  Commitments
                </th>
                {members.map((member) => (
                  <th key={member} className="text-right px-2 py-1 font-medium text-foreground border-r border-border last:border-r-0">
                    {member.split('@')[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {commitments.map((group) => (
                <React.Fragment key={group.id}>
                  {/* Group Header */}
                  <tr className="bg-muted/30">
                    <td className="px-2 py-1 font-semibold text-foreground border-r border-border">
                      {group.name}
                    </td>
                    {members.map((member) => (
                      <td key={member} className="px-2 py-1 border-r border-border last:border-r-0"></td>
                    ))}
                  </tr>
                  {/* Group Items */}
                  {group.items.map((item) => (
                    <tr key={item.id} className="border-b border-border hover:bg-muted/10">
                      <td className="px-2 py-1 text-foreground border-r border-border align-top">
                        <span className="block">{item.name}</span>
                        {item.remark && typeof item.remark === 'string' && item.remark.trim() !== '' && (
                          <span className="text-xs text-muted-foreground whitespace-pre-line">{item.remark}</span>
                        )}
                      </td>
                      {members.map((member) => (
                        <td key={member} className="px-2 py-1 text-right border-r border-border last:border-r-0">
                          {item.amounts[member] && item.amounts[member] > 0 ? (
                            <span className={`${ensurePaidStatusInitialized(item, members)[member] ? 'font-bold text-green-600' : ''}`}>
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
                <td className="px-2 py-1 font-semibold text-foreground border-r border-border">
                  Salary
                </td>
                {members.map((member) => (
                  <td key={member} className="px-2 py-1 text-right font-semibold text-foreground border-r border-border last:border-r-0">
                    RM {(salaries[member] || 0).toFixed(2)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-2 py-1 font-semibold text-foreground border-r border-border">
                  Total Commitments
                </td>
                {members.map((member) => (
                  <td key={member} className="px-2 py-1 text-right font-semibold text-destructive border-r border-border last:border-r-0">
                    RM {totalCommitments[member]?.toFixed(2) || '0.00'}
                  </td>
                ))}
              </tr>
              <tr className="bg-muted/30 border-t-2 border-border">
                <td className="px-2 py-1 font-bold text-foreground border-r border-border">
                  Balance
                </td>
                {members.map((member) => (
                  <td key={member}
                    className={`px-2 py-1 text-right font-bold border-r border-border last:border-r-0 ${
                      balance[member] >= 0 ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    RM {balance[member]?.toFixed(2) || '0.00'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Ledger Table - MOBILE */}
      <div className="md:hidden rounded-lg border border-border bg-white mx-6">
        {/* Header */}
        <div className="bg-muted px-2 py-2 border-b border-border flex justify-between items-center">
          <h2 className="text-base font-semibold text-foreground">
            {budgetName}
          </h2>
          <span className="text-xs text-foreground">{selectedMonth} {selectedYear}</span>
        </div>
        <div className="w-full overflow-x-auto">
          {/* Grouped Commitments - Mobile Table */}
          <table className="min-w-[340px] w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left px-2 py-1 font-medium text-foreground bg-muted/50">Commitment</th>
                <th className="text-left px-2 py-1 font-medium text-foreground bg-muted/50">Member</th>
                <th className="text-right px-2 py-1 font-medium text-foreground bg-muted/50">Amount</th>
              </tr>
            </thead>
            <tbody>
              {commitments.map((group) => (
                <React.Fragment key={group.id}>
                  {/* Group Header - treated as a normal row with colSpan */}
                  <tr className="bg-muted/20">
                    <td className="px-2 py-1 font-semibold text-foreground" colSpan={3}>
                      {group.name}
                    </td>
                  </tr>
                  {group.items.map((item) =>
                    members.map((member) =>
                      item.amounts[member] && item.amounts[member] > 0 ? (
                        <tr key={`${item.id}-${member}`} className="border-b border-border">
                          <td className="px-2 py-1 align-top">
                            <span>{item.name}</span>
                            {item.remark && typeof item.remark === 'string' && item.remark.trim() !== '' && (
                              <span className="block text-xs text-muted-foreground whitespace-pre-line">{item.remark}</span>
                            )}
                          </td>
                          <td className="px-2 py-1 text-xs text-muted-foreground align-top">{member.split('@')[0]}</td>
                          <td className="px-2 py-1 text-right align-top">
                            <span className={`${ensurePaidStatusInitialized(item, members)[member] ? 'font-bold text-green-600' : ''}`}>
                              RM {item.amounts[member].toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ) : null
                    )
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {/* Summary Table (one row per member, but with all summary fields as columns) */}
          <div className="mt-2 w-full overflow-x-auto">
            <table className="min-w-[320px] w-full text-xs border-collapse border border-border rounded">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-2 py-1 text-left font-medium text-foreground bg-muted/50">Member</th>
                  {summaryRows.map(row => (
                    <th key={row.label} className="px-2 py-1 text-left font-medium text-foreground bg-muted/50">{row.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <tr key={member} className="border-b last:border-0">
                    <td className="px-2 py-1 text-xs text-muted-foreground">{member.split('@')[0]}</td>
                    {summaryRows.map((row, i) => (
                      <td
                        key={row.label}
                        className={`px-2 py-1 text-xs 
                                   ${typeof row.className === 'function' ? row.className(member) : row.className}
                                   ${i === summaryRows.length - 1 && balance[member] < 0 ? 'font-bold' : ''}`
                        }
                      >
                        {row.getValue(member)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex space-x-2 mt-4 mx-8 md:mx-0">
        <Button type="button" variant="outline" asChild className="flex-1 text-xs py-1">
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
        <Button type="button" asChild className="flex-1 text-xs py-1">
          <Link to={`/budget/${budgetId}/edit`}>
            <Edit className="h-4 w-4 mr-1" />
            Edit Budget
          </Link>
        </Button>
      </div>
    </div>
  );
}