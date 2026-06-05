import React, { useState } from 'react';
import { useStore, type Obra, type Stage } from '../store/useStore';
import {
  X, TrendingUp, Calendar, DollarSign, CheckCircle2, AlertCircle, Clock, Plus, ChevronDown, ChevronRight, Trash2
} from 'lucide-react';

interface CronogramaProps {
  obra: Obra;
  onClose: () => void;
}

const statusColor = (progress: number) => {
  if (progress === 100) return 'bg-emerald-500';
  if (progress >= 60)  return 'bg-blue-500';
  if (progress >= 20)  return 'bg-amber-500';
  if (progress > 0)    return 'bg-orange-400';
  return 'bg-gray-200 dark:bg-zinc-700';
};

const statusIcon = (progress: number) => {
  if (progress === 100) return <CheckCircle2 size={14} className="text-emerald-500" />;
  if (progress > 0)     return <Clock size={14} className="text-amber-500" />;
  return <AlertCircle size={14} className="text-gray-400" />;
};

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const fmtDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');

export default function Cronograma({ obra, onClose }: CronogramaProps) {
  const { updateStage, addExtraService, addSubStage, updateSubStage, deleteSubStage } = useStore();
  const [editing, setEditing] = useState<string | null>(null);
  const [tempProgress, setTempProgress] = useState(0);

  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});
  const [newSubStage, setNewSubStage] = useState<Record<string, { name: string; weight: number }>>({});

  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    value: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const totalWeight = obra.stages?.reduce((a, s) => a + s.weight, 0) ?? 100;
  const progressFisico = obra.progress;
  const valorExecutado = obra.budget * (progressFisico / 100);
  const valorRestante  = obra.budget - valorExecutado;

  const handleEditStart = (stage: Stage) => {
    setEditing(stage.id);
    setTempProgress(stage.progress);
  };

  const handleEditSave = (stageId: string) => {
    updateStage(obra.id, stageId, { progress: Math.min(100, Math.max(0, tempProgress)) });
    setEditing(null);
  };

  const toggleExpand = (stageId: string) => {
    setExpandedStages(prev => ({ ...prev, [stageId]: !prev[stageId] }));
  };

  const handleAddSubStage = (stageId: string) => {
    const data = newSubStage[stageId];
    if (data && data.name.trim() && data.weight >= 0) {
      addSubStage(obra.id, stageId, data.name.trim(), data.weight);
      setNewSubStage(prev => ({ ...prev, [stageId]: { name: '', weight: 0 } }));
    }
  };

  const handleAddServiceSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (newService.name && newService.value >= 0) {
      addExtraService(obra.id, newService);
      setNewService({
        name: '',
        value: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      });
      setShowAddService(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-5xl border border-gray-200 dark:border-zinc-800 my-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="px-8 py-5 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              Cronograma Físico-Financeiro
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{obra.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* ── KPIs ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-gray-100 dark:border-zinc-800">
          {[
            {
              icon: <TrendingUp size={18} className="text-blue-500" />,
              label: 'Progresso Físico',
              value: `${progressFisico}%`,
              sub: 'execução geral',
            },
            {
              icon: <DollarSign size={18} className="text-emerald-500" />,
              label: 'Orçamento Total',
              value: fmtCurrency(obra.budget),
              sub: '100% da obra',
            },
            {
              icon: <CheckCircle2 size={18} className="text-emerald-500" />,
              label: 'Valor Executado',
              value: fmtCurrency(valorExecutado),
              sub: `${progressFisico}% realizado`,
            },
            {
              icon: <AlertCircle size={18} className="text-amber-500" />,
              label: 'Valor Restante',
              value: fmtCurrency(valorRestante),
              sub: `${100 - progressFisico}% a executar`,
            },
          ].map((kpi, i) => (
            <div key={i} className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                {kpi.icon}
                <span className="text-xs text-gray-500 dark:text-gray-400">{kpi.label}</span>
              </div>
              <p className="text-lg font-bold text-zinc-900 dark:text-white">{kpi.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Barra de progresso global ───────────────────────────────────── */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">Progresso Geral da Obra</span>
            <span className="font-bold text-zinc-900 dark:text-white">{progressFisico}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${progressFisico}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{fmtDate(obra.startDate)}</span>
            <span>{fmtDate(obra.endDate)}</span>
          </div>
        </div>

        {/* ── Tabela de Etapas ────────────────────────────────────────────── */}
        <div className="px-6 py-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Etapas de Execução</h3>
            <button 
              onClick={() => setShowAddService(!showAddService)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
            >
              <Plus size={14} />
              {showAddService ? 'Cancelar' : 'Adicionar Serviço Extra'}
            </button>
          </div>

          {showAddService && (
            <div className="mb-4 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl p-4">
              <h4 className="text-sm font-medium text-zinc-900 dark:text-white mb-3">Novo Serviço Extra (Aditivo)</h4>
              <form onSubmit={handleAddServiceSave} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nome do Serviço (ex: Piscina)</label>
                  <input 
                    required 
                    type="text" 
                    value={newService.name} 
                    onChange={e => setNewService({...newService, name: e.target.value})} 
                    className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Valor (R$)</label>
                  <input 
                    required 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    value={newService.value || ''} 
                    onChange={e => setNewService({...newService, value: Number(e.target.value)})} 
                    className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Data Início</label>
                  <input 
                    required 
                    type="date" 
                    value={newService.startDate} 
                    onChange={e => setNewService({...newService, startDate: e.target.value})} 
                    className="w-full px-2 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Data Fim</label>
                  <input 
                    required 
                    type="date" 
                    value={newService.endDate} 
                    onChange={e => setNewService({...newService, endDate: e.target.value})} 
                    className="w-full px-2 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <button 
                    type="submit"
                    className="w-full px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-3">
            {(obra.stages ?? []).map((stage, idx) => {
              const valorEtapa = stage.value ?? (obra.budget * (stage.weight / totalWeight));
              const isEditing  = editing === stage.id;
              const subStages = stage.subStages || [];
              const hasSubStages = subStages.length > 0;
              const isExpanded = expandedStages[stage.id] ?? false;

              return (
                <div key={stage.id} className="bg-gray-50 dark:bg-zinc-800/40 rounded-xl border border-gray-100 dark:border-zinc-800 overflow-hidden hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
                  <div className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* Número e Nome */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button onClick={() => toggleExpand(stage.id)} className="text-gray-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        </button>
                        <span className="shrink-0 w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 text-xs font-bold flex items-center justify-center text-zinc-700 dark:text-zinc-300">
                          {idx + 1}
                        </span>
                        {statusIcon(stage.progress)}
                        <div className="min-w-0 cursor-pointer" onClick={() => toggleExpand(stage.id)}>
                          <div className="flex items-center flex-wrap gap-2">
                            <input
                              type="text"
                              value={stage.name}
                              onChange={(e) => updateStage(obra.id, stage.id, { name: e.target.value })}
                              onClick={(e) => e.stopPropagation()}
                              className="font-medium text-zinc-900 dark:text-white truncate bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-zinc-700 focus:border-blue-500 rounded px-1 py-0.5 outline-none flex-1 min-w-[150px] transition-colors"
                            />
                            {stage.value && <span className="text-[10px] uppercase tracking-wider text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 px-2 py-0.5 rounded-full font-semibold">Aditivo / Extra</span>}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Calendar size={10} />
                            {fmtDate(stage.startDate)} → {fmtDate(stage.endDate)}
                          </p>
                        </div>
                      </div>

                      {/* Peso e Valor */}
                      <div className="flex items-center gap-4 shrink-0 text-right">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Peso Absoluto</p>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={stage.weight}
                            onChange={(e) => updateStage(obra.id, stage.id, { weight: Number(e.target.value) })}
                            className="w-16 font-semibold text-zinc-800 dark:text-zinc-200 text-sm text-right bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-zinc-700 focus:border-blue-500 rounded px-1 outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Orçado</p>
                          <p className="font-semibold text-zinc-600 dark:text-zinc-400 text-sm">{fmtCurrency(valorEtapa)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Executado</p>
                          <p className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">{fmtCurrency(valorEtapa * (stage.progress / 100))}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Progresso</p>
                          {isEditing && !hasSubStages ? (
                            <div className="flex items-center gap-1">
                              <input
                                autoFocus
                                type="number"
                                min={0} max={100}
                                value={tempProgress}
                                onChange={(e) => setTempProgress(Number(e.target.value))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleEditSave(stage.id);
                                  if (e.key === 'Escape') setEditing(null);
                                }}
                                className="w-16 px-2 py-1 text-sm text-right border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
                              />
                              <span className="text-xs text-zinc-500">%</span>
                              <button
                                onClick={() => handleEditSave(stage.id)}
                                className="px-2 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                OK
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => !hasSubStages && handleEditStart(stage)}
                              className={`font-bold text-sm ${hasSubStages ? 'text-blue-600 dark:text-blue-400 cursor-default' : 'text-blue-600 dark:text-blue-400 hover:underline cursor-pointer'}`}
                              title={hasSubStages ? 'Calculado pelas subetapas' : 'Clique para editar'}
                            >
                              {stage.progress}%
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Barra de progresso da etapa */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${statusColor(stage.progress)}`}
                          style={{ width: `${stage.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subetapas Dropdown */}
                  {isExpanded && (
                    <div className="bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 p-4">
                      <div className="space-y-3">
                        {subStages.map((sub, subIdx) => {
                          const subValor = valorEtapa * ((sub.weight || 0) / 100);
                          return (
                            <div key={sub.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700/50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-medium text-gray-400">{idx + 1}.{subIdx + 1}</span>
                                {statusIcon(sub.progress)}
                                  <input
                                    type="text"
                                    value={sub.name}
                                    onChange={(e) => updateSubStage(obra.id, stage.id, sub.id, { name: e.target.value })}
                                    className="text-sm font-medium text-gray-800 dark:text-gray-200 bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-zinc-700 focus:border-blue-500 rounded px-1 py-0.5 outline-none flex-1 min-w-[150px] transition-colors"
                                  />
                              </div>
                              <div className="flex items-center gap-4 text-right">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">Peso (%):</span>
                                  <input
                                    type="number"
                                    min="0" max="100"
                                    value={sub.weight || 0}
                                    onChange={(e) => updateSubStage(obra.id, stage.id, sub.id, { weight: Number(e.target.value) })}
                                    className="w-16 px-2 py-1 text-sm bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-right"
                                  />
                                </div>
                                  <div className="hidden sm:block min-w-[80px]">
                                    <p className="text-xs text-gray-500">Orçado</p>
                                    <p className="font-semibold text-zinc-600 dark:text-zinc-400 text-xs">{fmtCurrency(subValor)}</p>
                                  </div>
                                  <div className="hidden sm:block min-w-[80px]">
                                    <p className="text-xs text-gray-500">Executado</p>
                                    <p className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs">{fmtCurrency(subValor * (sub.progress / 100))}</p>
                                  </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">Executado:</span>
                                  <input
                                    type="number"
                                    min="0" max="100"
                                    value={sub.progress}
                                    onChange={(e) => updateSubStage(obra.id, stage.id, sub.id, { progress: Number(e.target.value) })}
                                    className="w-16 px-2 py-1 text-sm bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-right"
                                  />
                                  <span className="text-xs text-gray-500">%</span>
                                </div>
                                <button
                                  onClick={() => deleteSubStage(obra.id, stage.id, sub.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                  title="Remover Subetapa"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* Nova Subetapa */}
                        <div className="flex items-center gap-3 mt-4">
                          <input
                            type="text"
                            placeholder="Nome da nova subetapa..."
                            value={newSubStage[stage.id]?.name || ''}
                            onChange={(e) => setNewSubStage(prev => ({ ...prev, [stage.id]: { ...prev[stage.id], name: e.target.value } }))}
                            className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Peso:</span>
                            <input
                              type="number"
                              min="0" max="100"
                              placeholder="%"
                              value={newSubStage[stage.id]?.weight || ''}
                              onChange={(e) => setNewSubStage(prev => ({ ...prev, [stage.id]: { ...prev[stage.id], weight: Number(e.target.value) } }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddSubStage(stage.id);
                              }}
                              className="w-20 px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-right"
                            />
                            <span className="text-xs text-gray-500">%</span>
                          </div>
                          <button
                            onClick={() => handleAddSubStage(stage.id)}
                            disabled={!(newSubStage[stage.id]?.name?.trim() && newSubStage[stage.id]?.weight > 0)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 dark:bg-white dark:hover:bg-zinc-200 dark:disabled:bg-zinc-700 text-white dark:text-zinc-900 disabled:text-gray-500 rounded-lg transition-colors"
                          >
                            <Plus size={16} />
                            Adicionar
                          </button>
                        </div>
                        
                        {hasSubStages && (
                          <div className="mt-2 flex items-center justify-between px-2 text-xs text-gray-500">
                            <span>Soma dos pesos: {subStages.reduce((acc, sub) => acc + (sub.weight || 0), 0)}% (O ideal é fechar em 100%)</span>
                            <span className="italic">O progresso da etapa pai é automático.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Legenda ─────────────────────────────────────────────────────── */}
        <div className="px-6 pb-6">
          <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 pt-2">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Concluído (100%)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Avançado (≥60%)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Em Progresso (≥20%)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-400 inline-block" /> Iniciado (&lt;20%)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-300 dark:bg-zinc-600 inline-block" /> Não Iniciado</span>
            <span className="ml-auto italic">Clique no % para editar o progresso de cada etapa</span>
          </div>
        </div>
      </div>
    </div>
  );
}
