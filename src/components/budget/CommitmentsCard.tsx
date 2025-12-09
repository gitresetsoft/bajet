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
function getPaidStatus(item: CommitmentItem, member: string): boolean {
  console.log("getPaidStatus called with:", { item, member });
  if (item.paidStatus && Object.prototype.hasOwnProperty.call(item.paidStatus, member)) {
    console.log("paidStatus value for member", member, ":", item.paidStatus[member]);
    return !!item.paidStatus[member];
  }
  console.log("paidStatus not found for member", member, ", returning false.");
  return false;
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
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold mb-0">Commitments</CardTitle>
            <CardDescription className="text-xs">
              Add your monthly commitments and expenses for each member.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {commitments.map((group, groupIdx) => (
            <div
              key={group.name + "-" + groupIdx}
              className="border border-border rounded-lg p-2 md:p-3"
            >
              {/* Group Header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 min-h-0 min-w-0 p-0"
                    onClick={() => onToggleExpansion(groupIdx)}
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
                    placeholder="Commitment Group"
                    className="w-[120px] md:w-[160px] h-7 text-xs px-2 py-1"
                    disabled={disabled}
                  />
                </div>
                {!disabled && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-5 w-5 min-h-0 min-w-0 px-0"
                    onClick={() => onRemoveGroup(groupIdx)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {/* Group Items */}
              {(group.isExpanded ?? true) && (
                <div className="space-y-2">
                  {group.items.map((item, itemIdx) => (
                    <div
                      key={item.name + "-" + itemIdx}
                      className="border border-muted rounded-md p-2 mb-1 bg-white"
                    >
                      <div className="flex flex-col md:flex-row md:items-end md:space-x-2 space-y-1 md:space-y-0">
                        <div>
                          <Label className="block text-xs font-medium mb-0">Item Name:</Label>
                          <Input
                            placeholder="e.g., Car Loan"
                            value={item.name}
                            onChange={e =>
                              onUpdateItem(groupIdx, itemIdx, e.target.value)
                            }
                            disabled={disabled}
                            className="flex-1 h-7 text-xs px-2 py-1 mt-1"
                          />
                        </div>
                        {!disabled && (
                          <Button
                            className="md:mt-3 h-5 w-5 min-h-0 min-w-0 px-0"
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
                      <div
                        className="
                          grid grid-cols-1 gap-y-1 pl-2 mt-1
                          md:grid-cols-2 md:gap-2 md:pl-4
                        "
                      >
                        {members.map(member => {
                          const paid = getPaidStatus(item, member);
                          return (
                            <div key={member} className="flex items-center space-x-1">
                              <Label className="max-w-24 text-xs font-medium pr-1">
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
                                className="flex-1 max-w-[85px] h-7 text-xs px-2 py-1"
                                step="0.01"
                                min="0"
                              />
                              {/* Paid/Unpaid Toggle */}
                              <div className="flex items-center space-x-1 ml-1">
                                <input
                                  type="checkbox"
                                  id={`paid-${groupIdx}-${itemIdx}-${member}`}
                                  checked={paid}
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
                                  className="text-[10px]"
                                >
                                  {paid ? "Paid" : "Unpaid"}
                                </Label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {!disabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-6 min-h-0 px-2 text-xs"
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
              className="w-full h-7 text-xs mt-1"
              onClick={onAddGroup}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Commitment Group
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export { CommitmentsCard };