import { MonthlyReport } from "../firestore/reports";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "./format";

const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", 
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

export function exportToCSV(data: MonthlyReport[], year: number) {
  const headers = ["Mes", "Receita", "Despesa", "Saldo"];
  const rows = data.map((d) => [
    MONTH_NAMES[d.month],
    d.income.toFixed(2),
    d.expense.toFixed(2),
    d.balance.toFixed(2)
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    headers.join(",") + "\n" +
    rows.map(e => e.join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `relatorio_consolidado_${year}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(data: MonthlyReport[], year: number) {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(18);
  doc.text(`Relatório Consolidado - ${year}`, 14, 22);

  // Tabela
  const tableColumn = ["Mês", "Receita", "Despesa", "Saldo"];
  const tableRows = data.map(d => [
    MONTH_NAMES[d.month],
    formatCurrency(d.income),
    formatCurrency(d.expense),
    formatCurrency(d.balance),
  ]);

  autoTable(doc, {
    startY: 30,
    head: [tableColumn],
    body: tableRows,
    theme: "striped",
    headStyles: { fillColor: [124, 58, 237] }, // Cor roxa do app
  });

  doc.save(`relatorio_consolidado_${year}.pdf`);
}
