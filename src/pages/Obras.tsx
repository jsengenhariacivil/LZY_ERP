import React, { useState } from 'react';
import { useStore, type Obra } from '../store/useStore';
import { Plus, Search, Edit2, Trash2, BarChart2 } from 'lucide-react';
import Cronograma from '../components/Cronograma';

export default function Obras() {
  const { obras, addObra, deleteObra, updateObra } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cronogramaObraId, setCronogramaObraId] = useState<string | null>(null);
  const cronogramaObra = cronogramaObraId ? obras.find(o => o.id === cronogramaObraId) ?? null : null;

  const [formData, setFormData] = useState<Omit<Obra, 'id' | 'progress' | 'stages'>>({
    name: '',
    status: 'Planejamento',
    budget: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const filteredObras = obras.filter(o => o.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleOpenModal = (obra?: Obra) => {
    if (obra) {
      setFormData({
        name: obra.name,
        status: obra.status,
        budget: obra.budget,
        startDate: obra.startDate,
        endDate: obra.endDate,
      });
      setEditingId(obra.id);
    } else {
      setFormData({
        name: '',
        status: 'Planejamento',
        budget: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateObra(editingId, formData);
    } else {
      addObra(formData);
    }
    setIsModalOpen(false);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestão de Obras</h1>
          <p className="text-gray-500 mt-1">Acompanhe e gerencie todos os projetos ativos.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nova Obra
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="Buscar obras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-shadow text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
            <thead className="bg-gray-50 dark:bg-zinc-800/50 text-gray-900 dark:text-zinc-300 font-medium border-b border-gray-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4">Nome da Obra</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Físico</th>
                <th className="px-6 py-4">Financeiro Integrado</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
              {filteredObras.map(obra => {
                const executado = obra.budget * (obra.progress / 100);
                const recebido = useStore.getState().transactions
                  .filter(t => t.obraId === obra.id && t.type === 'receita' && t.status === 'Recebido')
                  .reduce((acc, t) => acc + t.amount, 0);
                const saldo = Math.max(0, obra.budget - recebido);

                return (
                  <tr key={obra.id} className="border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {obra.name}
                    <div className="text-xs text-gray-400 mt-1">{new Date(obra.startDate).toLocaleDateString('pt-BR')} até {new Date(obra.endDate).toLocaleDateString('pt-BR')}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      obra.status === 'Planejamento' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50' :
                      obra.status === 'Em Andamento' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50' :
                      obra.status === 'Concluída' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/50' :
                      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50'
                    }`}>
                      {obra.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 dark:bg-zinc-700 rounded-full h-1.5">
                        <div 
                          className="bg-indigo-500 h-1.5 rounded-full" 
                          style={{ width: `${obra.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-semibold">{obra.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between w-48"><span className="text-gray-500">Orçamento:</span><span className="font-medium text-gray-900 dark:text-gray-200">{formatCurrency(obra.budget)}</span></div>
                      <div className="flex justify-between w-48"><span className="text-gray-500">Executado:</span><span className="font-medium text-blue-600 dark:text-blue-400">{formatCurrency(executado)}</span></div>
                      <div className="flex justify-between w-48"><span className="text-gray-500">Recebido:</span><span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(recebido)}</span></div>
                      <div className="flex justify-between w-48 border-t border-gray-200 dark:border-zinc-700 pt-1 mt-1"><span className="text-gray-500">Saldo:</span><span className="font-semibold text-gray-900 dark:text-gray-200">{formatCurrency(saldo)}</span></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right align-top">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setCronogramaObraId(obra.id)}
                        className="p-1.5 text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded transition-colors"
                        title="Painel Cronograma"
                      >
                        <BarChart2 size={18} />
                      </button>
                      <button onClick={() => handleOpenModal(obra)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => deleteObra(obra.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            {filteredObras.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Nenhuma obra encontrada.
                </td>
              </tr>
            )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova/Editar Obra */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-zinc-800">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingId ? 'Editar Obra' : 'Nova Obra'}
              </h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Obra</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as Obra['status']})}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white"
                >
                  <option value="Planejamento">Planejamento</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Concluída">Concluída</option>
                  <option value="Atrasada">Atrasada</option>
                </select>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2">
                💡 O progresso é calculado automaticamente pelas etapas no Cronograma.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Orçamento Previsto (R$)</label>
                <input 
                  required
                  type="number" 
                  value={formData.budget}
                  onChange={(e) => setFormData({...formData, budget: Number(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Início</label>
                  <input 
                    required
                    type="date" 
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Término</label>
                  <input 
                    required
                    type="date" 
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium rounded-lg transition-colors"
                >
                  Salvar Obra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cronograma */}
      {cronogramaObra && (
        <Cronograma
          obra={cronogramaObra}
          onClose={() => setCronogramaObraId(null)}
        />
      )}
    </div>
  );
}
