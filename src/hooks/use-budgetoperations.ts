import { CommitmentGroup, CommitmentItem, Salary } from "@/interface/Budget";

// This matches the props used by BasicInformationCard, CommitmentsCard, SummaryCard in CreateViewEditBudget
export interface EnsurePaidStatusOpsArgs {
  members: string[];
  setMembers: (members: string[]) => void;
  commitments: CommitmentGroup[];
  setCommitments: (groups: CommitmentGroup[] | ((prev: CommitmentGroup[]) => CommitmentGroup[])) => void;
  salaries: Salary;
  setSalaries: (sals: Salary | ((prev: Salary) => Salary)) => void;
}

// Utility to ensure all expected member paidStatus entries exist on a CommitmentItem (non-destructive)
export function getInitializedPaidStatus(
  item: CommitmentItem,
  members: string[]
): Record<string, boolean> {
  const paidStatus: Record<string, boolean> = { ...item.paidStatus };
  members.forEach((member) => {
    if (paidStatus[member] === undefined) {
      paidStatus[member] = false;
    }
  });
  return paidStatus;
}

export function ensurePaidStatusInitialized({
  members,
  setMembers,
  commitments,
  setCommitments,
  salaries,
  setSalaries,
}: EnsurePaidStatusOpsArgs) {
  // Add a new member (with blank name) and propagate across commitments, paidStatus, and salaries
  function addMember() {
    // allow adding if members.length >= 2 and allow blank member for new input
    setMembers([...members, ""]);
    setCommitments((prev: CommitmentGroup[]) =>
      prev.map((group) => ({
        ...group,
        items: group.items.map((item) => ({
          ...item,
          amounts: { ...item.amounts, [""]: 0 },
          paidStatus: { ...item.paidStatus, [""]: false },
        })),
      }))
    );
    setSalaries((prev: Salary) => ({ ...prev, [""]: 0 }));
  }

  // Remove a member by index and cleanup everywhere
  function removeMember(index: number) {
    if (members.length > 1) {
      const memberToRemove = members[index];
      const newMembers = members.filter((_, i) => i !== index);
      setMembers(newMembers);

      setCommitments((prev: CommitmentGroup[]) =>
        prev.map((group) => ({
          ...group,
          items: group.items.map((item) => {
            const newAmounts = { ...item.amounts };
            const newPaidStatus = { ...item.paidStatus };
            delete newAmounts[memberToRemove];
            delete newPaidStatus[memberToRemove];
            return { ...item, amounts: newAmounts, paidStatus: newPaidStatus };
          }),
        }))
      );

      setSalaries((prev: Salary) => {
        const nextSalaries = { ...prev };
        delete nextSalaries[memberToRemove];
        return nextSalaries;
      });
    }
  }

  // Update a member name and propagate the change throughout state
  function updateMember(index: number, value: string) {
    const updatedMembers = [...members];
    const oldName = updatedMembers[index];
    updatedMembers[index] = value;
    setMembers(updatedMembers);

    if (oldName && oldName !== value) {
      setCommitments((prev: CommitmentGroup[]) =>
        prev.map((group) => ({
          ...group,
          items: group.items.map((item) => {
            const newAmounts = { ...item.amounts };
            const newPaidStatus = { ...item.paidStatus };
            if (newAmounts[oldName] !== undefined) {
              newAmounts[value] = newAmounts[oldName];
              delete newAmounts[oldName];
            }
            if (newPaidStatus[oldName] !== undefined) {
              newPaidStatus[value] = newPaidStatus[oldName];
              delete newPaidStatus[oldName];
            }
            return { ...item, amounts: newAmounts, paidStatus: newPaidStatus };
          }),
        }))
      );
      setSalaries((prev: Salary) => {
        const newSalaries = { ...prev };
        if (newSalaries[oldName] !== undefined) {
          newSalaries[value] = newSalaries[oldName];
          delete newSalaries[oldName];
        }
        return newSalaries;
      });
    }
  }

  // Used for rendering time to guarantee paidStatus object includes all current members, non-destructively
  function ensureItemPaidStatus(item: CommitmentItem): Record<string, boolean> {
    return getInitializedPaidStatus(item, members);
  }

  // Used to update the underlying commitments state so all Commitments/Items have their paidStatus object up-to-date
  function fixAllPaidStatus() {
    setCommitments((prev: CommitmentGroup[]) =>
      prev.map((group) => ({
        ...group,
        items: group.items.map((item) => ({
          ...item,
          paidStatus: getInitializedPaidStatus(item, members),
        })),
      }))
    );
  }

  // Also include the operations for Commitments and Salaries, for CommitmentsCard and SummaryCard
  function addCommitmentGroup() {
    setCommitments((prev: CommitmentGroup[]) => [
      ...prev,
      {
        name: "",
        expanded: true,
        items: [],
      },
    ]);
  }

  function updateCommitmentGroup(index: number, value: string) {
    setCommitments((prev: CommitmentGroup[]) =>
      prev.map((group, idx) =>
        idx === index ? { ...group, name: value } : group
      )
    );
  }

  function removeCommitmentGroup(index: number) {
    setCommitments((prev: CommitmentGroup[]) =>
      prev.filter((_, idx) => idx !== index)
    );
  }

  function toggleGroupExpansion(index: number) {
    setCommitments((prev: CommitmentGroup[]) =>
      prev.map((group, idx) =>
        idx === index
          ? { ...group, isExpanded: !group.isExpanded }
          : group
      )
    );
  }

  function addCommitmentItem(groupIdx: number) {
    setCommitments((prev: CommitmentGroup[]) =>
      prev.map((group, idx) =>
        idx === groupIdx
          ? {
              ...group,
              items: [
                ...group.items,
                {
                  name: "",
                  amounts: Object.fromEntries(members.map((m) => [m, 0])),
                  paidStatus: Object.fromEntries(members.map((m) => [m, false])),
                } as CommitmentItem,
              ],
            }
          : group
      )
    );
  }


  function updateCommitmentItem(groupIdx: number, itemIdx: number, value: string) {
    setCommitments((prev: CommitmentGroup[]) =>
      prev.map((group, gIdx) =>
        gIdx === groupIdx
          ? {
              ...group,
              items: group.items.map((item, iIdx) =>
                iIdx === itemIdx ? { ...item, name: value } : item
              ),
            }
          : group
      )
    );
  }

  function updateCommitmentAmount(
    groupIdx: number,
    itemIdx: number,
    member: string,
    amount: number
  ) {
    setCommitments((prev: CommitmentGroup[]) =>
      prev.map((group, gIdx) =>
        gIdx === groupIdx
          ? {
              ...group,
              items: group.items.map((item, iIdx) =>
                iIdx === itemIdx
                  ? {
                      ...item,
                      amounts: { ...item.amounts, [member]: amount },
                    }
                  : item
              ),
            }
          : group
      )
    );
  }

  function updateCommitmentPaidStatus(
    groupIdx: number,
    itemIdx: number,
    member: string,
    paid: boolean
  ) {
    setCommitments((prev: CommitmentGroup[]) =>
      prev.map((group, gIdx) =>
        gIdx === groupIdx
          ? {
              ...group,
              items: group.items.map((item, iIdx) =>
                iIdx === itemIdx
                  ? {
                      ...item,
                      paidStatus: { ...item.paidStatus, [member]: paid },
                    }
                  : item
              ),
            }
          : group
      )
    );
  }

  function removeCommitmentItem(groupIdx: number, itemIdx: number) {
    setCommitments((prev: CommitmentGroup[]) =>
      prev.map((group, gIdx) =>
        gIdx === groupIdx
          ? {
              ...group,
              items: group.items.filter((_, iIdx) => iIdx !== itemIdx),
            }
          : group
      )
    );
  }

  function updateSalary(member: string, value: number) {
    setSalaries((prev: Salary) => ({
      ...prev,
      [member]: value,
    }));
  }

  return {
    // member ops
    addMember,
    removeMember,
    updateMember,
    // paidStatus utilities
    ensureItemPaidStatus,
    fixAllPaidStatus,
    // commitment group/item ops (for CommitmentsCard)
    addCommitmentGroup,
    updateCommitmentGroup,
    removeCommitmentGroup,
    toggleGroupExpansion,
    addCommitmentItem,
    updateCommitmentItem,
    updateCommitmentAmount,
    updateCommitmentPaidStatus,
    removeCommitmentItem,
    // salary ops (for SummaryCard)
    updateSalary,
  };
}
