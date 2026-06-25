import React, { useState } from 'react';
import { useStore, type Transaction } from '../store/useStore';
import { Plus, Search, ArrowUpRight, ArrowDownRight, Edit2, Trash2 } from 'lucide-react';

const RECEITAS_PADRAO = [
  'Medição de Obra', 'Sinal / Adiantamento', 'Venda de Imóvel', 'Aporte de Sócios', 'Rendimento'
];
const DESPESAS_PADRAO = [
  'Mão de Obra (Própria)', 'Mão de Obra (Empreiteiros)', 'Materiais Básicos', 'Materiais de Acabamento', 
  'Locação de Equipamentos', 'EPIs e Ferramentas', 'Combustível / Transporte', 'Taxas (Alvará, ART, CREA)', 
  'Alimentação', 'Impostos', 'Pró-labore', 'Retirada'
];

export default function Financeiro() {
  const { transactions, obras, inventory, addTransaction, deleteTransaction, updateTransaction, addInventoryItem, addInventoryMovement } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState<'Todas' | 'PJ' | 'Pessoal'>('Todas');

  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const [addToInventory, setAddToInventory] = useState(false);
  const [invItemName, setInvItemName] = useState('');
  const [invQuantity, setInvQuantity] = useState(0);

  const [formData, setFormData] = useState<Omit<Transaction, 'id'>>({
    description: '',
    amount: 0,
    type: 'despesa',
    category: 'Materiais',
    date: new Date().toISOString().split('T')[0],
    entity: 'PJ',
    status: 'Pendente',
    obraId: '',
  });

  const filteredTransactions = transactions
    .filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(t => entityFilter === 'Todas' ? true : t.entity === entityFilter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const receitasRecebidas = filteredTransactions
    .filter(t => t.type === 'receita' && t.status === 'Recebido')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const despesasPagasTransacoes = filteredTransactions
    .filter(t => t.type === 'despesa' && t.status === 'Pago')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const { employees } = useStore();
  const totalFolha = employees.reduce((acc, e) => {
    return acc + (e.timePunches ?? []).reduce((s, p) => s + p.valuePaid, 0);
  }, 0);

  const despesasPagas = despesasPagasTransacoes + totalFolha;

  const receitasPendentes = filteredTransactions
    .filter(t => t.type === 'receita' && t.status === 'Pendente')
    .reduce((acc, curr) => acc + curr.amount, 0);



  const totalDespesas = filteredTransactions
    .filter(t => t.type === 'despesa')
    .reduce((acc, curr) => acc + curr.amount, 0);


  
  const saldo = receitasRecebidas - despesasPagas;

  const handleOpenModal = (transaction?: Transaction) => {
    setAddToInventory(false);
    setInvItemName('');
    setInvQuantity(0);

    if (transaction) {
      const padroes = transaction.type === 'receita' ? RECEITAS_PADRAO : DESPESAS_PADRAO;
      setIsCustomCategory(!padroes.includes(transaction.category));
      setFormData({
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        date: transaction.date,
        entity: transaction.entity,
        status: transaction.status,
        obraId: transaction.obraId || '',
      });
      setEditingId(transaction.id);
    } else {
      setIsCustomCategory(false);
      setFormData({
        description: '',
        amount: 0,
        type: 'despesa',
        category: 'Materiais Básicos',
        date: new Date().toISOString().split('T')[0],
        entity: entityFilter !== 'Todas' ? entityFilter : 'PJ',
        status: 'Pendente',
        obraId: '',
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateTransaction(editingId, formData);
    } else {
      addTransaction(formData);
      
      const catLower = formData.category.toLowerCase();
      const isMaterialOrEquip = catLower.includes('material') || catLower.includes('equipamento') || catLower.includes('ferramenta');
      
      if (formData.type === 'despesa' && isMaterialOrEquip && addToInventory && invItemName && invQuantity > 0) {
        const existingItem = inventory.find(i => i.name.toLowerCase() === invItemName.toLowerCase());
        
        if (!existingItem) {
          addInventoryItem({
            name: invItemName,
            category: formData.category,
            quantity: invQuantity,
            minQuantity: 0,
            unit: 'Unidades',
          });
        } else {
          addInventoryMovement(existingItem.id, {
            date: formData.date,
            type: 'entrada',
            quantity: invQuantity,
            note: `Compra Ref: ${formData.description}`,
          });
        }
      }
    }
    setIsModalOpen(false);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Controle Financeiro</h1>
          <p className="text-gray-500 mt-1">Gerencie receitas, despesas e fluxo de caixa.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value as any)}
            className="px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white"
          >
            <option value="Todas">Visão Geral (Todas)</option>
            <option value="PJ">Apenas Empresa (PJ)</option>
            <option value="Pessoal">Apenas Pessoal</option>
          </select>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Novo Lançamento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Recebido</p>
          <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-500 mt-2">{formatCurrency(receitasRecebidas)}</h3>
          <p className="text-xs text-gray-400 mt-1">Pendente: {formatCurrency(receitasPendentes)}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Pago (Despesas)</p>
          <h3 className="text-2xl font-bold text-red-600 dark:text-red-500 mt-2">{formatCurrency(despesasPagas)}</h3>
          <p className="text-xs text-gray-400 mt-1">Total lançado: {formatCurrency(totalDespesas)}</p>
        </div>
        <div className="bg-zinc-900 dark:bg-zinc-100 p-6 rounded-xl border border-zinc-900 dark:border-zinc-100 shadow-sm text-white dark:text-zinc-900">
          <p className="text-sm font-medium opacity-80">Saldo em Caixa</p>
          <h3 className="text-2xl font-bold mt-2">{formatCurrency(saldo)}</h3>
          <p className="text-xs opacity-60 mt-1">Recebido - Pago</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-y-auto max-h-[120px] custom-scrollbar">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Falta Receber por Obra</p>
          <div className="space-y-2">
            {obras.map(obra => {
              const received = transactions
                .filter(t => t.obraId === obra.id && t.type === 'receita' && t.status === 'Recebido')
                .reduce((acc, curr) => acc + curr.amount, 0);
              const left = Math.max(0, obra.budget - received);
              return (
                <div key={obra.id} className="flex justify-between text-sm border-b border-gray-50 dark:border-zinc-800/50 pb-1 last:border-0">
                  <span className="truncate pr-2 text-gray-700 dark:text-gray-300" title={obra.name}>{obra.name}</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400 shrink-0">{formatCurrency(left)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="Buscar lançamento..."
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
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Categoria / Obra</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">PJ / Pessoal</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white flex items-center gap-3">
                    <div className={`p-1.5 rounded-md ${t.type === 'receita' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                      {t.type === 'receita' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    </div>
                    {t.description}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span>{t.category}</span>
                      {t.obraId && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          Obra: {obras.find(o => o.id === t.obraId)?.name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      t.status === 'Pago' || t.status === 'Recebido' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50' 
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-300">
                      {t.entity}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-semibold ${t.type === 'receita' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {t.type === 'receita' ? '+' : '-'}{formatCurrency(t.amount)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenModal(t)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => deleteTransaction(t.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Nenhum lançamento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-zinc-800">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingId ? 'Editar Lançamento' : 'Novo Lançamento'}
              </h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
                <input 
                  required
                  type="text" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, type: 'receita', status: 'Pendente'})}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${formData.type === 'receita' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50' : 'bg-gray-50 text-gray-600 dark:bg-zinc-800 dark:text-gray-400 border border-transparent'}`}
                    >
                      Receita
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, type: 'despesa', status: 'Pendente'})}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${formData.type === 'despesa' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400 border border-red-200 dark:border-red-800/50' : 'bg-gray-50 text-gray-600 dark:bg-zinc-800 dark:text-gray-400 border border-transparent'}`}
                    >
                      Despesa
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor (R$)</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                  <select 
                    required
                    value={isCustomCategory ? 'Outra' : formData.category}
                    onChange={(e) => {
                      if (e.target.value === 'Outra') {
                        setIsCustomCategory(true);
                        setFormData({...formData, category: ''});
                      } else {
                        setIsCustomCategory(false);
                        setFormData({...formData, category: e.target.value});
                      }
                    }}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white"
                  >
                    <option value="" disabled>Selecione uma categoria...</option>
                    {formData.type === 'receita' ? (
                      RECEITAS_PADRAO.map(c => <option key={c} value={c}>{c}</option>)
                    ) : (
                      DESPESAS_PADRAO.map(c => <option key={c} value={c}>{c}</option>)
                    )}
                    <option value="Outra">Outra (digitar...)</option>
                  </select>
                  
                  {isCustomCategory && (
                    <div className="mt-2">
                      <input 
                        required
                        type="text" 
                        placeholder="Digite a categoria..."
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      />
                    </div>
                  )}

                  {formData.type === 'despesa' && (formData.category === 'Pró-labore' || formData.category === 'Retirada') && formData.entity === 'PJ' && !editingId && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Ao salvar, uma receita correspondente será criada no painel "Pessoal".</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
                  <input 
                    required
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Obra Relacionada (Opcional)</label>
                  <select 
                    value={formData.obraId || ''}
                    onChange={(e) => setFormData({...formData, obraId: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white"
                  >
                    <option value="">Nenhuma</option>
                    {obras.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Entidade</label>
                  <select 
                    value={formData.entity}
                    onChange={(e) => setFormData({...formData, entity: e.target.value as any})}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white"
                  >
                    <option value="PJ">PJ (Empresa)</option>
                    <option value="Pessoal">Pessoal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white"
                  >
                    {formData.type === 'receita' ? (
                      <>
                        <option value="Pendente">Pendente</option>
                        <option value="Recebido">Recebido</option>
                      </>
                    ) : (
                      <>
                        <option value="Pendente">Pendente</option>
                        <option value="Pago">Pago</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Integração com Estoque */}
              {formData.type === 'despesa' && (formData.category.toLowerCase().includes('material') || formData.category.toLowerCase().includes('equipamento') || formData.category.toLowerCase().includes('ferramenta')) && !editingId && (
                <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 p-4 rounded-lg space-y-3 mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={addToInventory}
                      onChange={(e) => setAddToInventory(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Adicionar compra ao Estoque/Inventário?</span>
                  </label>
                  
                  {addToInventory && (
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nome do Item</label>
                        <input 
                          required={addToInventory}
                          type="text" 
                          list="inv-items-list"
                          placeholder="Ex: Cimento CP II"
                          value={invItemName}
                          onChange={(e) => setInvItemName(e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                        />
                        <datalist id="inv-items-list">
                          {inventory.map(i => <option key={i.id} value={i.name} />)}
                        </datalist>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Quantidade</label>
                        <input 
                          required={addToInventory}
                          type="number" 
                          step="0.01"
                          min="0.01"
                          value={invQuantity || ''}
                          onChange={(e) => setInvQuantity(Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
              
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
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
