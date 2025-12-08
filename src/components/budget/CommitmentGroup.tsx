// src/components/budget/CommitmentGroup.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { CommitmentGroup as CommitmentGroupType } from '@/interface/Budget';
import { CommitmentItem } from '@/components/budget/CommitmentItem';

interface CommitmentGroupProps {
  group: CommitmentGroupType;
  members: string[];
  onUpdateGroup: (groupId: string, name: string) => void;
  onRemoveGroup: (groupId: string) => void;
  onToggleExpansion: (groupId: string) => void;
  onAddItem: (groupId: string) => void;
  onUpdateItem: (groupId: string, itemId: string, name: string, remark?: string) => void;
  onUpdateAmount: (groupId: string, itemId: string, member: string, amount: number) => void;
  onUpdatePaidStatus: (groupId: string, itemId: string, member: string, isPaid: boolean) => void;
  onRemoveItem: (groupId: string, itemId: string) => void;
  disabled?: boolean;
}

export function CommitmentGroup({
  group,
  members,
  onUpdateGroup,
  onRemoveGroup,
  onToggleExpansion,
  onAddItem,
  onUpdateItem,
  onUpdateAmount,
  onUpdatePaidStatus,
  onRemoveItem,
  disabled = false,
}: CommitmentGroupProps) {
  return (
    <div className="border border-border rounded-lg p-4">
      {/* Group Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onToggleExpansion(group.id)}
            disabled={disabled}
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
            onChange={(e) => onUpdateGroup(group.id, e.target.value)}
            disabled={disabled}
            className="w-48"
          />
          <span className="text-sm text-muted-foreground">
            ({group.items.length})
          </span>
        </div>
        {!disabled && (
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAddItem(group.id)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onRemoveGroup(group.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Group Items */}
      {group.isExpanded && (
        <div className="space-y-3 ml-6">
          {group.items.map((item, index) => (
            <CommitmentItem
              key={item.id}
              item={item}
              index={index}
              members={members}
              groupId={group.id}
              onUpdateItem={onUpdateItem}
              onUpdateAmount={onUpdateAmount}
              onUpdatePaidStatus={onUpdatePaidStatus}
              onRemoveItem={onRemoveItem}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}