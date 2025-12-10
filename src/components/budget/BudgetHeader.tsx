// src/components/budget/BudgetHeader.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, List, Table, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Mode, ViewMode } from '@/interface/Budget';

interface BudgetHeaderProps {
  mode: Mode;
  viewMode?: ViewMode;
  pageTitle: string;
  onViewModeToggle?: () => void;
  onExportLedgerPdf?: () => void;
}

export function BudgetHeader({
  mode,
  viewMode,
  pageTitle,
  onViewModeToggle,
  onExportLedgerPdf,
}: BudgetHeaderProps) {
  return (
    <>
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 pr-5">
              <img src="/icon.png" alt="Budget Icon" className="h-8 w-8" />
              <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="container mx-auto px-4 py-4">
        {/* Top bar: mobile (block/row) */}
        <div className="flex flex-col md:block">
          <div className="flex flex-row items-center space-x-2">
            <div className="bg-gradient-to-r from-blue-100 to-blue-50 rounded-md max-w-[180px] text-sm md:text-base">
              <Button variant="ghost" asChild className="text-xs">
                <Link to="/dashboard" className="text-xs">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
            {/* Show toggle on mobile only (not md and up) */}
            {mode === 'view' && viewMode && onViewModeToggle && (
              <div className="md:hidden flex-1 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onViewModeToggle}
                  className="flex items-center space-x-2 ml-2 text-xs font-normal"
                >
                  {viewMode === 'structured' ? (
                    <>
                      <List className="h-4 w-4" />
                      <span className="text-xs">Structured</span>
                    </>
                  ) : (
                    <>
                      <Table className="h-4 w-4" />
                      <span className="text-xs">Ledger View</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Desktop toggle + export (md+) */}
        {mode === 'view' && viewMode && onViewModeToggle && (
          <div className="max-w-4xl mx-auto w-full hidden md:flex flex-row items-start justify-between py-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">View Mode:</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onViewModeToggle}
                className="flex items-center space-x-2 text-base font-normal"
              >
                {viewMode === 'structured' ? (
                  <>
                    <List className="h-4 w-4" />
                    <span className="hidden md:inline text-base">Structured</span>
                  </>
                ) : (
                  <>
                    <Table className="h-4 w-4" />
                    <span className="hidden md:inline text-base">Ledger View</span>
                  </>
                )}
              </Button>
            </div>
            {/* Export PDF for Ledger View */}
            {viewMode === 'ledger' && onExportLedgerPdf && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onExportLedgerPdf}
                className="flex items-center space-x-2"
              >
                <FileText className="h-4 w-4 mr-1" />
                Export Ledger PDF
              </Button>
            )}
          </div>
        )}

        {/* For mobile, keep PDF export below the toggle and back button */}
        {mode === 'view' && viewMode === 'ledger' && onExportLedgerPdf && (
          <div className="block md:hidden mt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onExportLedgerPdf}
              className="flex items-center space-x-2"
            >
              <FileText className="h-4 w-4 mr-1" />
              Export Ledger PDF
            </Button>
          </div>
        )}
      </main>
    </>
  );
}