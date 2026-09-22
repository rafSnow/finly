"use client";

import { usePatrimonio } from "@/hooks/usePatrimonio";
import { TrendingUp, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function PatrimonioPage() {
  const { data, loading } = usePatrimonio();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-[#6B6890]">Carregando seu patrimônio...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4 pb-24">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#F1F0FF]">Patrimônio</h1>
        <p className="mt-1 text-sm text-[#A09DC0]">
          Evolução dos seus investimentos e saldo
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="rounded-2xl border border-white/5 bg-[#111118] p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A1A26] text-emerald-500">
              <TrendingUp size={20} />
            </div>
            <h3 className="font-medium text-[#F1F0FF]">Investimentos</h3>
          </div>
          <p className="mt-4 text-3xl font-bold text-[#F1F0FF]">
            {formatCurrency(data.currentInvestments)}
          </p>
          <p className="mt-1 text-sm text-[#6B6890]">Guardado para o futuro</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#111118] p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A1A26] text-[#7C3AED]">
              <Wallet size={20} />
            </div>
            <h3 className="font-medium text-[#F1F0FF]">Patrimônio Líquido Total</h3>
          </div>
          <p className="mt-4 text-3xl font-bold text-[#F1F0FF]">
            {formatCurrency(data.currentWealth)}
          </p>
          <p className="mt-1 text-sm text-[#6B6890]">Soma de todas as contas (exceto crédito)</p>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-white/5 bg-[#111118] p-6 h-[400px]">
        <h3 className="mb-6 font-medium text-[#F1F0FF]">Evolução Histórica (6 Meses)</h3>
        {data.history.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.history} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorInvestments" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
              <XAxis dataKey="month" stroke="#6B6890" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis 
                stroke="#6B6890" 
                fontSize={12} 
                tickLine={false} 
                tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1A1A26', borderColor: '#ffffff1a', borderRadius: '12px' }}
                itemStyle={{ color: '#F1F0FF' }}
                formatter={(value: any) => [formatCurrency(Number(value) || 0), '']}
                labelStyle={{ color: '#A09DC0', marginBottom: '8px' }}
              />
              <Area
                type="monotone"
                dataKey="totalAssets"
                name="Total"
                stroke="#7C3AED"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorTotal)"
              />
              <Area
                type="monotone"
                dataKey="investmentAssets"
                name="Investimentos"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorInvestments)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-[#6B6890]">Não há dados suficientes para montar o gráfico.</p>
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#F1F0FF]">Contas de Investimento</h2>
          <Link href="/contas">
            <Button variant="secondary">Gerenciar</Button>
          </Link>
        </div>
        
        <div className="grid gap-3">
          {data.accounts.filter(a => a.accountType === "investment").length > 0 ? (
            data.accounts.filter(a => a.accountType === "investment").map(acc => (
              <div key={acc.id} className="flex items-center justify-between rounded-xl bg-[#111118] p-4 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-[#F1F0FF]">{acc.name}</p>
                    <p className="text-xs text-[#6B6890]">Conta de Investimento</p>
                  </div>
                </div>
                <p className="font-bold text-emerald-400">{formatCurrency(acc.balance)}</p>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
              <p className="mb-4 text-sm text-[#A09DC0]">Nenhuma conta de investimento cadastrada.</p>
              <Link href="/contas">
                <Button className="mx-auto">Criar Conta</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
