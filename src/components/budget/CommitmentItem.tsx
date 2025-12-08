import React from "react";

interface CommitmentItemProps {
  item: {
    id: string;
    name: string;
    remark?: string;
    amounts: Record<string, number>;
    paid?: Record<string, boolean>;
  };
  index: number;
  members: string[];
  groupId: string;
  onUpdateItem: (groupId: string, itemId: string, name: string, remark?: string) => void;
  onUpdateAmount: (groupId: string, itemId: string, member: string, amount: number) => void;
  onUpdatePaidStatus: (groupId: string, itemId: string, member: string, isPaid: boolean) => void;
  onRemoveItem: (groupId: string, itemId: string) => void;
  disabled?: boolean;
}

export const CommitmentItem: React.FC<CommitmentItemProps> = ({
  item,
  index,
  members,
  groupId,
  onUpdateItem,
  onUpdateAmount,
  onUpdatePaidStatus,
  onRemoveItem,
  disabled = false,
}) => {
  return (
    <tr className="border-b border-border hover:bg-muted/20">
      <td className="px-3 md:px-6 py-2 text-foreground border-r border-border align-top">
        <div>
          {item.name}
          {item.remark && typeof item.remark === "string" && item.remark.trim() !== "" && (
            <>
              <br />
              <span className="text-xs text-muted-foreground whitespace-pre-line">
                {item.remark}
              </span>
            </>
          )}
        </div>
      </td>
      {members.map((member) => (
        <td
          key={member}
          className="px-2 md:px-4 py-2 text-right border-r border-border last:border-r-0 align-top"
        >
          {item.amounts[member] && item.amounts[member] > 0 ? (
            <span
              className={`${
                item.paid && item.paid[member] ? "font-bold text-green-600" : ""
              }`}
            >
              RM {item.amounts[member].toFixed(2)}
            </span>
          ) : (
            ""
          )}
        </td>
      ))}
    </tr>
  );
};