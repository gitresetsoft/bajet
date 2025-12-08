import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronRight, Plus, X } from "lucide-react";

import type { CommitmentGroup, CommitmentItem } from "@/interface/Budget";

/**
 * Uses index-based identification as required by CreateViewEditBudget.tsx (see usage at line 285-299).
 * All operations use group/item indices, NOT ids.
 */
interface CommitmentsCardProps {
  commitments: CommitmentGroup[];
  members: string[];
  onAddGroup: () => void;
  onUpdateGroup: (groupIdx: number, name: string) => void;
  onRemoveGroup: (groupIdx: number) => void;
  onToggleExpansion: (groupIdx: number) => void;
  onAddItem: (groupIdx: number) => void;
  onUpdateItem: (groupIdx: number, itemIdx: number, name: string) => void;
  onUpdateAmount: (
    groupIdx: number,
    itemIdx: number,
    member: string,
    amount: number
  ) => void;
  onUpdatePaidStatus: (
    groupIdx: number,
    itemIdx: number,
    member: string,
    paid: boolean
  ) => void;
  onRemoveItem: (groupIdx: number, itemIdx: number) => void;
  disabled?: boolean;
}

/** Ensures paidStatus is always defined for each member for each item (safe for undefined/legacy data) */
function ensurePaidStatusInitialized(
  item: CommitmentItem,
  members: string[]
) {
  const obj: Record<string, boolean> = {};
  members.forEach((m) => {
    obj[m] = !!(item.paidStatus && item.paidStatus[m]);
  });
  return obj;
}

const CommitmentsCard: React.FC<CommitmentsCardProps> = ({
  commitments,
  members,
  onAddGroup,
  onUpdateGroup,
  onRemoveGroup,
  onToggleExpansion,
  onAddItem,
  onUpdateItem,
  onUpdateAmount,
  onUpdatePaidStatus,
  onRemoveItem,
  disabled = false,
}) => {
  return (
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
          {commitments.map((group, groupIdx) => (
            <div
              key={group.name + "-" + groupIdx}
              className="border border-border rounded-lg p-4"
            >
              {/* Group Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleExpansion(groupIdx)}
                    disabled={disabled}
                  >
                    {(group.isExpanded ?? true) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  <Input
                    value={group.name}
                    onChange={e => onUpdateGroup(groupIdx, e.target.value)}
                    placeholder="Commitment Group Name"
                    className="w-[200px]"
                    disabled={disabled}
                  />
                </div>
                {!disabled && (
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => onRemoveGroup(groupIdx)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              {/* Group Items */}
              {(group.isExpanded ?? true) && (
                <div className="space-y-4">
                  {group.items.map((item, itemIdx) => (
                    <div
                      key={item.name + "-" + itemIdx}
                      className="border border-muted rounded-md p-4 mb-2 bg-white"
                    >
                      <div className="flex flex-col md:flex-row md:items-end md:space-x-4 space-y-2 md:space-y-0">
                        <div>
                          <Label>Item Name:</Label>
                          <Input
                            placeholder="e.g., Car Loan"
                            value={item.name}
                            onChange={e =>
                              onUpdateItem(groupIdx, itemIdx, e.target.value)
                            }
                            disabled={disabled}
                            className="flex-1"
                          />
                        </div>
                        {/* You may extend to support a remark field by updating operations/types */}
                        {!disabled && (
                          <Button
                            className="md:mt-6"
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => onRemoveItem(groupIdx, itemIdx)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {/* Member Amounts Row */}
                      <div className="grid grid-cols-2 md:grid-cols-2 gap-4 pl-4">
                        {members.map(member => (
                          <div key={member} className="flex items-center space-x-2">
                            <Label className="max-w-24 text-sm font-medium">
                              {member ? member.split("@")[0] : "Member"}:
                            </Label>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={item.amounts[member] ?? ""}
                              onChange={e =>
                                onUpdateAmount(
                                  groupIdx,
                                  itemIdx,
                                  member,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              disabled={disabled}
                              className="flex-1 max-w-[120px]"
                              step="0.01"
                              min="0"
                            />
                            {/* Paid/Unpaid Toggle */}
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`paid-${groupIdx}-${itemIdx}-${member}`}
                                checked={!!ensurePaidStatusInitialized(item, members)[member]}
                                onChange={e =>
                                  onUpdatePaidStatus(
                                    groupIdx,
                                    itemIdx,
                                    member,
                                    e.target.checked
                                  )
                                }
                                disabled={disabled}
                                className="h-4 w-4"
                              />
                              <Label
                                htmlFor={`paid-${groupIdx}-${itemIdx}-${member}`}
                                className="text-xs"
                              >
                                Paid
                              </Label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {!disabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => onAddItem(groupIdx)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Commitment
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
          {!disabled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onAddGroup}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Commitment Group
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export { CommitmentsCard };