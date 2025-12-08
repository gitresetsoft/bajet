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
 *      summaryType?: string,
 *      userEmail?: string,
 *      userName?: string
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
  userEmail?: string,
  userName?: string,
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
    userEmail,
    userName,
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

  // Get final Y position after table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tableEndY = (doc as any).lastAutoTable?.finalY || doc.internal.pageSize.getHeight() - 40;

  // Format date/time in GMT+8 (Asia/Singapore timezone)
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { 
    year: "numeric", 
    month: "2-digit", 
    day: "2-digit",
    timeZone: "Asia/Singapore"
  });
  const timeStr = now.toLocaleTimeString("en-US", { 
    hour: "2-digit", 
    minute: "2-digit", 
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Singapore"
  });
  const dateTimeStr = `${dateStr} ${timeStr} GMT+8`;

  // Get user identifier (email or username)
  const userIdentifier = userEmail || userName || "Unknown User";

  // Get VITE_URL from environment
  const viteUrl = import.meta.env.VITE_URL || "";

  // Add footer lines (right-aligned)
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const fontSize = 9;
  const lineHeight = 12;
  
  doc.setFontSize(fontSize);
  doc.setTextColor(100, 100, 100);
  
  // First line: "Printed by {user} at {date, time, GMT+8}"
  const footerLine1 = `Printed by ${userIdentifier} at ${dateTimeStr}`;
  const footerLine1Width = doc.getTextWidth(footerLine1);
  doc.text(footerLine1, pageWidth - margin - footerLine1Width, tableEndY + 20);
  
  // Second line: VITE_URL
  if (viteUrl) {
    const footerLine2Width = doc.getTextWidth(viteUrl);
    doc.text(viteUrl, pageWidth - margin - footerLine2Width, tableEndY + 20 + lineHeight);
  }

  // Save
  const filename = `${title ? title.replace(/\s+/g, "_") : "budget"}_ledger_${month}_${year}.pdf`;
  doc.save(filename);
}