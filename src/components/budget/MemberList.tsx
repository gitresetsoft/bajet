// src/components/budget/MemberList.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';

interface MemberListProps {
  members: string[];
  onAddMember: () => void;
  onRemoveMember: (index: number) => void;
  onUpdateMember: (index: number, value: string) => void;
  disabled?: boolean;
  maxMembers?: number;
}

export function MemberList({
  members,
  onAddMember,
  onRemoveMember,
  onUpdateMember,
  disabled = false,
  maxMembers = 2,
}: MemberListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Budget Members</Label>
        {!disabled && members.length < maxMembers && (
          <Button type="button" variant="outline" size="sm" onClick={onAddMember}>
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
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
      
      <p className="text-sm text-muted-foreground">
        You can add up to {maxMembers} members for this budget.
      </p>
    </div>
  );
}