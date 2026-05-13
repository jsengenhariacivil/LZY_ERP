import { useState } from 'react';
import {
  HardHat, ArrowUpRight, ArrowDownRight,
  Wallet, TrendingDown, TrendingUp, Building2, Users, ChevronDown, ChevronUp
} from 'lucide-react';
import { useStore } from '../store/useStore';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function Dashboard() {
  const { obras, transactions, employees } = useStore();
  const [showDespesas, setShowDespesas] = useState(false);

  // ── KPIs financeiros ──────────────────────────────────────────────────────
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


  // Falta Receber = orçamento - recebido por obra
  const totalFaltaReceber = obras.reduce((acc, obra) => {
    const recebido = transactions
      .filter(t => t.obraId === obra.id && t.type === 'receita' && t.status === 'Recebido')
      .reduce((s, t) => s + t.amount, 0);
    return acc + Math.max(0, obra.budget - recebido);
  }, 0);

  const obrasAtivas = obras.filter(o => o.status === 'Em Andamento' || o.status === 'Planejamento').length;

  // ── Mão de Obra — baseado no cartão ponto do RH ──────────────────────────
  // Agrupa por tipo de pagamento e soma valores já pagos e a pagar
  const maoDeObraStats = employees.map(e => {
    const totalPagoRH = (e.timePunches ?? []).reduce((s, p) => s + p.valuePaid, 0);
    return { name: e.name, role: e.role, paymentType: e.paymentType ?? 'diaria', dailyRate: e.dailyRate ?? 0, totalPago: totalPagoRH };
  });
  const totalMaoPago = maoDeObraStats.reduce((s, e) => s + e.totalPago, 0);
  const totalMaoMensal = employees
    .filter(e => e.status === 'Ativo')
    .reduce((s, e) => {
      const rate = e.dailyRate ?? 0;
      if (e.paymentType === 'mensal') return s + rate;
      if (e.paymentType === 'quinzenal') return s + rate * 2;
      if (e.paymentType === 'diaria') return s + rate * 22; // ~22 dias úteis
      if (e.paymentType === 'hora') return s + rate * 8 * 22;
      return s;
    }, 0);

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

  // Despesas sem obra vinculada
  const despesasSemObra = {
    pago: transactions.filter(t => !t.obraId && t.type === 'despesa' && t.status === 'Pago').reduce((s, t) => s + t.amount, 0),
    pendente: transactions.filter(t => !t.obraId && t.type === 'despesa' && t.status === 'Pendente').reduce((s, t) => s + t.amount, 0),
  };

  // Últimas transações
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Painel Gerencial</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Bem-vindo ao ERP LZY Construções e Reformas.</p>
      </div>

      {/* KPI Cards — linha 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Obras Ativas', value: obrasAtivas.toString(), icon: <HardHat size={20} className="text-blue-500" />, bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Saldo em Caixa', value: fmt(totalCaixa), icon: <Wallet size={20} className="text-emerald-500" />, bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Falta Receber (Obras)', value: fmt(totalFaltaReceber), icon: <TrendingUp size={20} className="text-amber-500" />, bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'A Pagar (Despesas Pendentes)', value: fmt(totalAPagar), icon: <TrendingDown size={20} className="text-red-500" />, bg: 'bg-red-50 dark:bg-red-900/20' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</h3>
              </div>
              <div className={`p-2 ${stat.bg} rounded-lg shrink-0`}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Card Mão de Obra */}
      <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl p-5 shadow-md text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Users size={20} />
            </div>
            <div>
              <p className="text-sm font-medium opacity-80">Folha de Mão de Obra</p>
              <p className="text-xs opacity-60">{employees.filter(e => e.status === 'Ativo').length} colaborador(es) ativo(s)</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-70">Estimativa Mensal</p>
            <p className="text-xl font-bold">{fmt(totalMaoMensal)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['diaria', 'hora', 'quinzenal', 'mensal'] as const).map(tipo => {
            const grupo = employees.filter(e => (e.paymentType ?? 'diaria') === tipo && e.status === 'Ativo');
            if (grupo.length === 0) return null;
            const totalTipo = grupo.reduce((s, e) => s + (e.dailyRate ?? 0), 0);
            const labels: Record<string, string> = { diaria: 'Diária', hora: 'Por Hora', quinzenal: 'Quinzenal', mensal: 'Mensal' };
            return (
              <div key={tipo} className="bg-white/10 rounded-lg p-3">
                <p className="text-xs opacity-70 mb-0.5">{labels[tipo]}</p>
                <p className="font-bold text-sm">{fmt(totalTipo)}</p>
                <p className="text-xs opacity-60">{grupo.length} colab.</p>
              </div>
            );
          })}
          <div className="bg-white/20 rounded-lg p-3">
            <p className="text-xs opacity-70 mb-0.5">Total Pago (RH)</p>
            <p className="font-bold text-sm">{fmt(totalMaoPago)}</p>
            <p className="text-xs opacity-60">via cartão ponto</p>
          </div>
        </div>
      </div>

      {/* Linha principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Últimas Transações */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6 flex flex-col h-[430px]">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Últimas Transações</h3>
            <span className="text-xs text-gray-400">Mais recentes primeiro</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
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
                      {' • '}{new Date(item.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className={`font-semibold text-sm ${item.type === 'receita' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {item.type === 'receita' ? '+' : '-'}{fmt(item.amount)}
                  </p>
                  <p className="text-xs text-gray-400">{item.status}</p>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <p className="text-gray-500 text-center py-8">Nenhuma transação registrada.</p>
            )}
          </div>
        </div>

        {/* Status das Obras */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6 flex flex-col h-[430px]">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Status das Obras</h3>
            <Building2 size={18} className="text-gray-400" />
          </div>
          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            {obras.map(obra => {
              const recebido = transactions
                .filter(t => t.obraId === obra.id && t.type === 'receita' && t.status === 'Recebido')
                .reduce((acc, t) => acc + t.amount, 0);
              const faltaReceber = Math.max(0, obra.budget - recebido);
              const percentRecebido = obra.budget > 0 ? Math.round((recebido / obra.budget) * 100) : 0;
              const despPendente = transactions
                .filter(t => t.obraId === obra.id && t.type === 'despesa' && t.status === 'Pendente')
                .reduce((acc, t) => acc + t.amount, 0);

              const custoMateriais = transactions
                .filter(t => t.obraId === obra.id && t.type === 'despesa' && t.category === 'Materiais')
                .reduce((acc, t) => acc + t.amount, 0);
              const custoServicos = transactions
                .filter(t => t.obraId === obra.id && t.type === 'despesa' && (t.category === 'Serviços' || t.category === 'Mão de Obra'))
                .reduce((acc, t) => acc + t.amount, 0);
              const custoOutros = transactions
                .filter(t => t.obraId === obra.id && t.type === 'despesa' && t.category !== 'Materiais' && t.category !== 'Serviços' && t.category !== 'Mão de Obra')
                .reduce((acc, t) => acc + t.amount, 0);

              const totalCustos = custoMateriais + custoServicos + custoOutros;
              const pMat = totalCustos > 0 ? (custoMateriais / totalCustos) * 100 : 0;
              const pServ = totalCustos > 0 ? (custoServicos / totalCustos) * 100 : 0;
              const pOutros = totalCustos > 0 ? (custoOutros / totalCustos) * 100 : 0;

              return (
                <div key={obra.id} className="p-3 border border-gray-100 dark:border-zinc-800/50 rounded-lg">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-700 dark:text-gray-300 truncate pr-2">{obra.name}</span>
                    <span className={
                      obra.status === 'Em Andamento' ? 'text-emerald-500 font-semibold text-xs' :
                      obra.status === 'Atrasada' ? 'text-amber-500 font-semibold text-xs' :
                      obra.status === 'Concluída' ? 'text-purple-500 font-semibold text-xs' :
                      'text-blue-500 font-semibold text-xs'
                    }>{obra.status}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400 w-16 shrink-0">Físico:</span>
                    <div className="flex-1 bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${obra.status === 'Atrasada' ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${obra.progress}%` }} />
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-8 text-right">{obra.progress}%</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-400 w-16 shrink-0">Recebido:</span>
                    <div className="flex-1 bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-blue-400" style={{ width: `${percentRecebido}%` }} />
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-8 text-right">{percentRecebido}%</span>
                  </div>

                  <div className="flex flex-col gap-1 mb-2 pt-2 border-t border-gray-100 dark:border-zinc-800/50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-16 shrink-0">Custos:</span>
                      <div className="flex-1 flex h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800">
                        {pMat > 0 && <div className="bg-orange-400" style={{ width: `${pMat}%` }} title={`Materiais: ${fmt(custoMateriais)}`} />}
                        {pServ > 0 && <div className="bg-purple-500" style={{ width: `${pServ}%` }} title={`Serviços/M.Obra: ${fmt(custoServicos)}`} />}
                        {pOutros > 0 && <div className="bg-gray-400" style={{ width: `${pOutros}%` }} title={`Outros: ${fmt(custoOutros)}`} />}
                      </div>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 text-right truncate max-w-[80px]" title={fmt(totalCustos)}>
                        {totalCustos > 0 ? `R$ ${(totalCustos/1000).toFixed(1)}k` : 'R$ 0'}
                      </span>
                    </div>
                    {totalCustos > 0 && (
                      <div className="flex gap-3 text-[10px] text-gray-500 ml-[72px]">
                        {pMat > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span> Mat.</span>}
                        {pServ > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Serv.</span>}
                        {pOutros > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Out.</span>}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between text-xs pt-2 border-t border-gray-100 dark:border-zinc-800/50">
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">Falta: {fmt(faltaReceber)}</span>
                    {despPendente > 0 && (
                      <span className="text-red-500 font-semibold">A Pagar: {fmt(despPendente)}</span>
                    )}
                  </div>
                </div>
              );
            })}
            {obras.length === 0 && <p className="text-gray-500 text-center py-8">Nenhuma obra cadastrada.</p>}
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
            <span className="font-semibold text-gray-900 dark:text-white">Despesas por Obra</span>
            <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
              A Pagar: {fmt(totalAPagar)}
            </span>
          </div>
          {showDespesas ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </button>

        {showDespesas && (
          <div className="border-t border-gray-100 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-zinc-800/50 text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Obra</th>
                  <th className="px-5 py-3 text-right font-medium">Pago</th>
                  <th className="px-5 py-3 text-right font-medium">Pendente</th>
                  <th className="px-5 py-3 text-right font-medium">Total</th>
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
                    <td className="px-5 py-3 text-gray-500 italic">Despesas gerais (sem obra)</td>
                    <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400">{fmt(despesasSemObra.pago)}</td>
                    <td className="px-5 py-3 text-right text-red-500 font-medium">{despesasSemObra.pendente > 0 ? fmt(despesasSemObra.pendente) : '—'}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-white">{fmt(despesasSemObra.pago + despesasSemObra.pendente)}</td>
                  </tr>
                )}
                {despesasPorObra.length === 0 && despesasSemObra.pago === 0 && despesasSemObra.pendente === 0 && (
                  <tr><td colSpan={4} className="px-5 py-6 text-center text-gray-400">Nenhuma despesa registrada.</td></tr>
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
        )}
      </div>
    </div>
  );
}
