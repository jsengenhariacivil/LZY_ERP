import { useState } from 'react';
import {
  HardHat, ArrowUpRight, ArrowDownRight,
  Wallet, TrendingDown, TrendingUp, Building2, ChevronDown, ChevronUp, AlertCircle, CircleDollarSign
} from 'lucide-react';
import { useStore } from '../store/useStore';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function Dashboard() {
  const { obras, transactions, employees } = useStore();
  const [showDespesas, setShowDespesas] = useState(false);

  // ── Obras Ativas ──────────────────────────────────────────────────────────
  const obrasAtivasArr = obras.filter(o => o.status === 'Em Andamento' || o.status === 'Planejamento');
  const obrasAtivas = obrasAtivasArr.length;

  const totalOrcamento = obrasAtivasArr.reduce((acc, o) => acc + o.budget, 0);
  const totalExecutado = obrasAtivasArr.reduce((acc, o) => acc + (o.budget * (o.progress / 100)), 0);

  const totalRecebidoObras = transactions
    .filter(t => t.type === 'receita' && t.status === 'Recebido' && t.obraId)
    .reduce((acc, t) => acc + t.amount, 0);

  const totalCustosPagosObras = transactions
    .filter(t => t.type === 'despesa' && t.status === 'Pago' && t.obraId)
    .reduce((acc, t) => acc + t.amount, 0);

  const lucroAtualObras = totalRecebidoObras - totalCustosPagosObras;
  const saldoAReceber = totalOrcamento - totalRecebidoObras;
  const comparativoMedicao = totalExecutado - totalRecebidoObras;

  // ── Caixa Global (inclui tudo) ───────────────────────────────────────────
  const totalReceitas = transactions
    .filter(t => t.type === 'receita' && t.status === 'Recebido')
    .reduce((acc, t) => acc + t.amount, 0);

  const despesasTransacoes = transactions
    .filter(t => t.type === 'despesa' && t.status === 'Pago')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalFolha = employees.reduce((acc, e) => {
    return acc + (e.timePunches ?? []).reduce((s, p) => s + p.valuePaid, 0);
  }, 0);

  const totalDespesas = despesasTransacoes + totalFolha;
  const totalCaixa = totalReceitas - totalDespesas;

  // A Pagar = TODAS as despesas pendentes (obras + geral)
  const totalAPagar = transactions
    .filter(t => t.type === 'despesa' && t.status === 'Pendente')
    .reduce((acc, t) => acc + t.amount, 0);

  // ── Mão de Obra ──────────────────────────────────────────────────────────
  // removido as variaveis não utilizadas

  // ── Despesas por obra ────────────────────────────────────────────────────
  const despesasPorObra = obras.map(obra => {
    const pago = transactions
      .filter(t => t.obraId === obra.id && t.type === 'despesa' && t.status === 'Pago')
      .reduce((s, t) => s + t.amount, 0);
    const pendente = transactions
      .filter(t => t.obraId === obra.id && t.type === 'despesa' && t.status === 'Pendente')
      .reduce((s, t) => s + t.amount, 0);
    return { id: obra.id, name: obra.name, pago, pendente };
  }).filter(o => o.pago > 0 || o.pendente > 0);

  const despesasSemObra = {
    pago: transactions.filter(t => !t.obraId && t.type === 'despesa' && t.status === 'Pago').reduce((s, t) => s + t.amount, 0),
    pendente: transactions.filter(t => !t.obraId && t.type === 'despesa' && t.status === 'Pendente').reduce((s, t) => s + t.amount, 0),
  };

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Painel Gerencial</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Visão consolidada financeira e de evolução das obras.</p>
      </div>

      {/* KPI Cards — Linha 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Obras Ativas', value: obrasAtivas.toString(), sub: 'Projetos em andamento', icon: <HardHat size={20} className="text-blue-500" />, bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Saldo em Caixa (Real)', value: fmt(totalCaixa), sub: 'Receitas totais - Custos', icon: <Wallet size={20} className="text-emerald-500" />, bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Falta Receber (Global)', value: fmt(Math.max(0, saldoAReceber)), sub: 'Dos contratos ativos', icon: <TrendingUp size={20} className="text-amber-500" />, bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'A Pagar (Despesas)', value: fmt(totalAPagar), sub: 'Contas pendentes', icon: <TrendingDown size={20} className="text-red-500" />, bg: 'bg-red-50 dark:bg-red-900/20' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</h3>
              </div>
              <div className={`p-2 ${stat.bg} rounded-lg shrink-0`}>{stat.icon}</div>
            </div>
            <p className="text-xs text-gray-400 mt-auto">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Cartão Comparativo e Margem (Visão ERP) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl p-5 shadow-md text-white flex flex-col justify-center">
          <p className="text-indigo-100 text-sm font-medium mb-1">Valor Total de Obras (Orçamentos)</p>
          <h2 className="text-3xl font-bold mb-4">{fmt(totalOrcamento)}</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-indigo-200">Total Executado (Avanço Físico)</span>
              <span className="font-semibold">{fmt(totalExecutado)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-indigo-200">Total Recebido (Financeiro)</span>
              <span className="font-semibold">{fmt(totalRecebidoObras)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <AlertCircle size={20} className="text-amber-500" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Comparativo de Medição</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Diferença entre o que foi <strong>fisicamente executado</strong> e o que foi <strong>pago pelo cliente</strong> nas quinzenas.
          </p>
          {comparativoMedicao > 0 ? (
            <div>
              <p className="text-red-500 font-bold text-2xl">{fmt(comparativoMedicao)}</p>
              <p className="text-xs text-red-400 mt-1">Defasagem: Cliente pagou menos do que o executado.</p>
            </div>
          ) : (
            <div>
              <p className="text-emerald-500 font-bold text-2xl">{fmt(Math.abs(comparativoMedicao))}</p>
              <p className="text-xs text-emerald-400 mt-1">Adiantamento: Cliente pagou mais do que o executado.</p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <CircleDollarSign size={20} className="text-emerald-500" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Lucro Parcial (Obras)</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Total Recebido de clientes menos Custos Reais já pagos nestas obras.
          </p>
          <div>
            <p className={`font-bold text-2xl ${lucroAtualObras >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {fmt(lucroAtualObras)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Margem baseada no caixa realizado.</p>
          </div>
        </div>
      </div>

      {/* Linha principal: Obras e Transações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Status das Obras Detalhado */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6 flex flex-col max-h-[600px]">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Acompanhamento Físico x Financeiro</h3>
            <Building2 size={18} className="text-gray-400" />
          </div>
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {obras.map(obra => {
              const recebido = transactions
                .filter(t => t.obraId === obra.id && t.type === 'receita' && t.status === 'Recebido')
                .reduce((acc, t) => acc + t.amount, 0);
              const executado = obra.budget * (obra.progress / 100);
              const faltaReceber = Math.max(0, obra.budget - recebido);
              const defasagem = executado - recebido; // Positivo = cliente deve pela medição

              const pendente = transactions
                .filter(t => t.obraId === obra.id && t.type === 'despesa' && t.status === 'Pendente')
                .reduce((acc, t) => acc + t.amount, 0);

              return (
                <div key={obra.id} className="p-4 border border-gray-100 dark:border-zinc-800/70 rounded-lg bg-gray-50/50 dark:bg-zinc-800/20">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{obra.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total: {fmt(obra.budget)}</p>
                    </div>
                    <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded ${
                      obra.status === 'Em Andamento' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      obra.status === 'Atrasada' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      obra.status === 'Concluída' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {obra.status}
                    </span>
                  </div>

                  {/* Barras de progresso Físico vs Financeiro */}
                  <div className="space-y-3 mt-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Físico (Executado) - {obra.progress}%</span>
                        <span className="font-medium text-gray-900 dark:text-gray-200">{fmt(executado)}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-1.5">
                        <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${obra.progress}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Financeiro (Recebido) - {obra.budget > 0 ? Math.round((recebido / obra.budget) * 100) : 0}%</span>
                        <span className="font-medium text-gray-900 dark:text-gray-200">{fmt(recebido)}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-1.5">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${obra.budget > 0 ? (recebido / obra.budget) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Sumários da Obra */}
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-zinc-700/50 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                    <div className="flex-1 min-w-[100px]">
                      <span className="block text-gray-500 dark:text-gray-400 mb-0.5">Saldo da Obra</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{fmt(faltaReceber)}</span>
                    </div>
                    <div className="flex-1 min-w-[100px]">
                      <span className="block text-gray-500 dark:text-gray-400 mb-0.5">Defasagem (Medição)</span>
                      <span className={`font-semibold ${defasagem > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {defasagem > 0 ? `-${fmt(defasagem)}` : `+${fmt(Math.abs(defasagem))}`}
                      </span>
                    </div>
                    {pendente > 0 && (
                      <div className="flex-1 min-w-[100px]">
                        <span className="block text-gray-500 dark:text-gray-400 mb-0.5">Desp. Pendentes</span>
                        <span className="font-semibold text-red-500">{fmt(pendente)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {obras.length === 0 && <p className="text-gray-500 text-center py-8">Nenhuma obra cadastrada.</p>}
          </div>
        </div>

        {/* Últimas Transações */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6 flex flex-col max-h-[600px]">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Últimas Movimentações</h3>
            <span className="text-xs text-gray-400">Financeiro global</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            {recentTransactions.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors border border-gray-100 dark:border-zinc-800/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-full shrink-0 ${item.type === 'receita' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                    {item.type === 'receita'
                      ? <ArrowUpRight className="text-emerald-600 dark:text-emerald-400" size={16} />
                      : <ArrowDownRight className="text-red-600 dark:text-red-400" size={16} />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{item.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.category}
                      {item.obraId && ` • ${obras.find(o => o.id === item.obraId)?.name ?? ''}`}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className={`font-semibold text-sm ${item.type === 'receita' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {item.type === 'receita' ? '+' : '-'}{fmt(item.amount)}
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">{item.status}</p>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <p className="text-gray-500 text-center py-8">Nenhuma transação registrada.</p>
            )}
          </div>
        </div>

      </div>

      {/* Despesas por Obra — consolidado */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowDespesas(!showDespesas)}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <TrendingDown size={18} className="text-red-500" />
            <span className="font-semibold text-gray-900 dark:text-white">Detalhamento de Custos e Despesas</span>
            <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
              A Pagar Total: {fmt(totalAPagar)}
            </span>
          </div>
          {showDespesas ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </button>

        {showDespesas && (
          <div className="border-t border-gray-100 dark:border-zinc-800">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-zinc-800/50 text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">Obra / Centro de Custo</th>
                    <th className="px-5 py-3 text-right font-medium">Custo Pago</th>
                    <th className="px-5 py-3 text-right font-medium">Custo Pendente (A Pagar)</th>
                    <th className="px-5 py-3 text-right font-medium">Custo Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {despesasPorObra.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/20">
                      <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-200">{o.name}</td>
                      <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400">{fmt(o.pago)}</td>
                      <td className="px-5 py-3 text-right text-red-500 font-medium">{o.pendente > 0 ? fmt(o.pendente) : '—'}</td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-white">{fmt(o.pago + o.pendente)}</td>
                    </tr>
                  ))}
                  {(despesasSemObra.pago > 0 || despesasSemObra.pendente > 0) && (
                    <tr className="hover:bg-gray-50 dark:hover:bg-zinc-800/20">
                      <td className="px-5 py-3 text-gray-500 italic">Despesas gerais (Sede/Administrativo)</td>
                      <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400">{fmt(despesasSemObra.pago)}</td>
                      <td className="px-5 py-3 text-right text-red-500 font-medium">{despesasSemObra.pendente > 0 ? fmt(despesasSemObra.pendente) : '—'}</td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-white">{fmt(despesasSemObra.pago + despesasSemObra.pendente)}</td>
                    </tr>
                  )}
                  {despesasPorObra.length === 0 && despesasSemObra.pago === 0 && despesasSemObra.pendente === 0 && (
                    <tr><td colSpan={4} className="px-5 py-6 text-center text-gray-400">Nenhum custo registrado.</td></tr>
                  )}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-zinc-800/50 font-semibold text-gray-900 dark:text-white border-t border-gray-200 dark:border-zinc-700">
                  <tr>
                    <td className="px-5 py-3">Total Geral</td>
                    <td className="px-5 py-3 text-right">{fmt([...despesasPorObra, despesasSemObra].reduce((s, o) => s + o.pago, 0))}</td>
                    <td className="px-5 py-3 text-right text-red-500">{fmt(totalAPagar)}</td>
                    <td className="px-5 py-3 text-right">{fmt([...despesasPorObra, despesasSemObra].reduce((s, o) => s + o.pago + o.pendente, 0))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
