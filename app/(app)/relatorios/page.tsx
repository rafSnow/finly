"use client";

import { useReports } from "@/hooks/useReports";
import { exportToCSV, exportToPDF } from "@/lib/utils/export";
import { formatCurrency } from "@/lib/utils/format";
import { Skeleton } from "@/components/ui/Skeleton";
import { Download, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", 
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

export default function RelatoriosPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const { reports, loading, error } = useReports(year);

  const chartData = reports.map((r) => ({
    name: MONTH_NAMES[r.month],
    Receita: r.income,
    Despesa: r.expense,
    Saldo: r.balance,
  }));

  const totalIncome = reports.reduce((acc, curr) => acc + curr.income, 0);
  const totalExpense = reports.reduce((acc, curr) => acc + curr.expense, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-6 pb-24">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-[#F1F0FF]">Relatórios Consolidados</h2>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center rounded-xl bg-white/5 p-1">
            <button
              onClick={() => setYear((y) => y - 1)}
              className="rounded-lg p-1 text-[#A09DC0] transition-colors hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="w-16 text-center font-medium text-[#F1F0FF]">{year}</span>
            <button
              onClick={() => setYear((y) => y + 1)}
              className="rounded-lg p-1 text-[#A09DC0] transition-colors hover:bg-white/10 hover:text-white"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => exportToCSV(reports, year)}
              disabled={loading || reports.length === 0}
              className="flex items-center gap-2 rounded-xl bg-[#217346]/20 px-3 py-2 text-sm font-medium text-[#4ade80] transition-colors hover:bg-[#217346]/40 disabled:opacity-50"
            >
              <Download size={16} />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={() => exportToPDF(reports, year)}
              disabled={loading || reports.length === 0}
              className="flex items-center gap-2 rounded-xl bg-[#e3242b]/20 px-3 py-2 text-sm font-medium text-[#f87171] transition-colors hover:bg-[#e3242b]/40 disabled:opacity-50"
            >
              <FileText size={16} />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {loading ? (
        <div className="space-y-4">
          <Skeleton variant="card" height="h-24" />
          <Skeleton variant="card" height="h-64" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/[0.07] bg-[#111118] p-4">
              <p className="text-sm font-medium text-[#A09DC0]">Receita Anual</p>
              <p className="mt-1 text-2xl font-bold text-[#10B981]">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-[#111118] p-4">
              <p className="text-sm font-medium text-[#A09DC0]">Despesa Anual</p>
              <p className="mt-1 text-2xl font-bold text-[#EF4444]">{formatCurrency(totalExpense)}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-[#111118] p-4">
              <p className="text-sm font-medium text-[#A09DC0]">Balanço Anual</p>
              <p className={`mt-1 text-2xl font-bold ${balance >= 0 ? 'text-[#8B5CF6]' : 'text-red-500'}`}>
                {formatCurrency(balance)}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="rounded-2xl border border-white/[0.07] bg-[#111118] p-4 sm:p-6">
            <h3 className="mb-6 font-semibold text-[#F1F0FF]">Evolução Financeira</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#6B6890" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#6B6890" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `R$ ${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#111118", borderColor: "#ffffff10", borderRadius: "8px" }}
                    itemStyle={{ fontSize: "14px", fontWeight: 500 }}
                    formatter={(value: any) => formatCurrency(Number(value) || 0)}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                  <Line 
                    type="monotone" 
                    dataKey="Receita" 
                    stroke="#10B981" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 2 }} 
                    activeDot={{ r: 6 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Despesa" 
                    stroke="#EF4444" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 2 }} 
                    activeDot={{ r: 6 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Saldo" 
                    stroke="#8B5CF6" 
                    strokeWidth={3} 
                    strokeDasharray="5 5"
                    dot={{ r: 4, strokeWidth: 2 }} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111118]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#A09DC0]">
                <thead className="border-b border-white/[0.07] bg-white/[0.02] text-xs uppercase text-[#6B6890]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Mês</th>
                    <th className="px-4 py-3 font-semibold text-right">Receita</th>
                    <th className="px-4 py-3 font-semibold text-right">Despesa</th>
                    <th className="px-4 py-3 font-semibold text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.07]">
                  {reports.map((r, i) => (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-medium text-[#F1F0FF]">{MONTH_NAMES[r.month]}</td>
                      <td className="px-4 py-3 text-right font-medium text-[#10B981]">
                        {formatCurrency(r.income)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-[#EF4444]">
                        {formatCurrency(r.expense)}
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${r.balance >= 0 ? 'text-[#8B5CF6]' : 'text-red-500'}`}>
                        {formatCurrency(r.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
