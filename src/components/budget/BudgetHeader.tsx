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
        <div className="bg-gradient-to-r from-blue-100 to-blue-50 rounded-md max-w-[180px]">
          <Button variant="ghost" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Toggle Mode for View */}
        {mode === 'view' && viewMode && onViewModeToggle && (
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start justify-between py-4">
            <div className="flex items-center space-x-2 mb-2 md:mb-0">
              <span className="hidden md:inline text-sm text-muted-foreground">View Mode:</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onViewModeToggle}
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
      </main>
    </>
  );
}