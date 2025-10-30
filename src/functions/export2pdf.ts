import { CommitmentGroup, CommitmentItem } from "@/interface/Budget";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable"; 

// Type guard for CommitmentItem
function isCommitmentItem(obj: CommitmentItem): obj is CommitmentItem {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.id === "string" &&
    typeof obj.name === "string" &&
    obj.amounts && typeof obj.amounts === "object" &&
    obj.paidStatus && typeof obj.paidStatus === "object"
  );
}

// Type guard for CommitmentGroup
function isCommitmentGroup(obj: CommitmentGroup): obj is CommitmentGroup {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.id === "string" &&
    typeof obj.name === "string" &&
    Array.isArray(obj.items) &&
    obj.items.every(isCommitmentItem)
  );
}

/**
 * Export budget data as a PDF in ledger view format.
 * 
 * @param {object} params - Budget data. Should correspond to what is passed in CreateViewEditBudget.tsx
 *    {
 *      title: string,
 *      month: string,
 *      year: number,
 *      members: string[],
 *      commitments: CommitmentGroup[],
 *      salaries: Record<string, number>,
 *      totalCommitments: Record<string, number>,
 *      balance: Record<string, number>,
 *      summaryType?: string
 *    }
 */
export function export2pdf(params: {
  title: string,
  month: string,
  year: number,
  members: string[],
  commitments: CommitmentGroup[],
  salaries: Record<string, number>,
  totalCommitments: Record<string, number>,
  balance: Record<string, number>,
  summaryType?: string,
}) {
  const {
    title,
    month,
    year,
    members,
    commitments,
    salaries,
    totalCommitments,
    balance,
  } = params;

  // Validate commitments array
  if (!Array.isArray(commitments) || !commitments.every(isCommitmentGroup)) {
    throw new Error("Invalid commitments data: not following CommitmentGroup[] interface from Budget.ts");
  }

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "A4"
  });

  // Header
  doc.setFontSize(18);
  doc.text(title || "Budget", 40, 40);
  doc.setFontSize(12);
  doc.text(`Month: ${month}   Year: ${year}`, 40, 60);

  // Table Setup (Ledger)
  const tableHead = [
    [
      { content: "Commitments", styles: { halign: "left", fontStyle: "bold" } },
      ...members.map(m => ({ content: m, styles: { halign: "right", fontStyle: "bold" } }))
    ]
  ];

  const tableBody: unknown[] = [];

  // Already validated as CommitmentGroup[]
  commitments.forEach((group: CommitmentGroup) => {
    // Group header row spanning all columns
    tableBody.push([
      {
        content: group.name || "",
        colSpan: members.length + 1,
        styles: { fillColor: [230, 230, 230], fontStyle: "bold", textColor: "#222" }
      }
    ]);
    // Item rows
    group.items.forEach((item: CommitmentItem) => {
      tableBody.push([
        item.name ?? "",
        ...members.map((member) =>
          (item.amounts?.[member] && item.amounts[member] > 0) 
            ? `RM ${(item.amounts[member]).toFixed(2)}${item.paidStatus && item.paidStatus[member] ? " ✅" : ""}`
            : ""
        ),
      ]);
    });
  });

  // Summary section
  tableBody.push([
    { content: "Salary", styles: { fontStyle: "bold" } },
    ...members.map(member => `RM ${(salaries[member] || 0).toFixed(2)}`)
  ]);
  tableBody.push([
    { content: "Total Commitments", styles: { fontStyle: "bold" } },
    ...members.map(member => `RM ${totalCommitments[member]?.toFixed(2) || "0.00"}`)
  ]);
  tableBody.push([
    { content: "Balance", styles: { fontStyle: "bold" } },
    ...members.map(member => ({
      content: `RM ${balance[member]?.toFixed(2) || "0.00"}`,
      styles: { textColor: (balance[member] >= 0 ? [0,120,0] : [220,0,0]), fontStyle: "bold" }
    }))
  ]);

  // Generate Table
  autoTable(doc, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    head: tableHead as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: tableBody as any,
    startY: 80,
    styles: { fontSize: 11, cellPadding: 6 },
    theme: "grid",
    headStyles: { fillColor: [220, 230, 241] },
    tableLineColor: [180, 180, 180],
  });

  // Save
  const filename = `${title ? title.replace(/\s+/g, "_") : "budget"}_ledger_${month}_${year}.pdf`;
  doc.save(filename);
}