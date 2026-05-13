import React, { useState } from 'react';
import { useStore, type InventoryItem } from '../store/useStore';
import { Plus, Search, AlertTriangle, Edit2, Trash2, ArrowRightLeft, History } from 'lucide-react';

export default function Inventario() {
  const { inventory, obras, addInventoryItem, deleteInventoryItem, updateInventoryItem, addInventoryMovement } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveItemId, setMoveItemId] = useState<string | null>(null);
  const [moveData, setMoveData] = useState({
    type: 'saida' as 'entrada' | 'saida',
    quantity: 0,
    obraId: '',
    note: ''
  });
  
  const [historyItemId, setHistoryItemId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<InventoryItem, 'id' | 'movements'>>({
    name: '',
    quantity: 0,
    minQuantity: 0,
    unit: 'Unidades',
    category: 'Geral',
  });

  const filteredItems = inventory.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleOpenModal = (item?: InventoryItem) => {
    if (item) {
      setFormData({
        name: item.name,
        quantity: item.quantity,
        minQuantity: item.minQuantity,
        unit: item.unit,
        category: item.category,
      });
      setEditingId(item.id);
    } else {
      setFormData({
        name: '',
        quantity: 0,
        minQuantity: 0,
        unit: 'Unidades',
        category: 'Geral',
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateInventoryItem(editingId, formData);
    } else {
      addInventoryItem(formData);
    }
    setIsModalOpen(false);
  };

  const handleOpenMoveModal = (itemId: string) => {
    setMoveItemId(itemId);
    setMoveData({
      type: 'saida',
      quantity: 0,
      obraId: '',
      note: ''
    });
    setIsMoveModalOpen(true);
  };

  const handleMoveSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (moveItemId && moveData.quantity > 0) {
      addInventoryMovement(moveItemId, {
        date: new Date().toISOString().split('T')[0],
        type: moveData.type,
        quantity: moveData.quantity,
        obraId: moveData.obraId || undefined,
        note: moveData.note
      });
    }
    setIsMoveModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventário e Suprimentos</h1>
          <p className="text-gray-500 mt-1">Gerencie materiais, equipamentos e ferramentas.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Novo Item
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="Buscar itens..."
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
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Estoque Atual</th>
                <th className="px-6 py-4">Estoque Mínimo</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
              {filteredItems.map((item) => (
                <React.Fragment key={item.id}>
                  <tr className="hover:bg-gray-50 dark:hover:bg-zinc-800/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {item.name}
                  </td>
                  <td className="px-6 py-4">
                    {item.category}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {item.minQuantity} {item.unit}
                  </td>
                  <td className="px-6 py-4">
                    {item.quantity <= item.minQuantity ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50">
                        <AlertTriangle size={12} />
                        Estoque Baixo
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50">
                        Adequado
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setHistoryItemId(historyItemId === item.id ? null : item.id)} className={`p-1.5 rounded transition-colors ${historyItemId === item.id ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`} title="Histórico">
                        <History size={18} />
                      </button>
                      <button onClick={() => handleOpenMoveModal(item.id)} className="p-1.5 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded transition-colors" title="Movimentar (Entrada/Saída)">
                        <ArrowRightLeft size={18} />
                      </button>
                      <button onClick={() => handleOpenModal(item)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors" title="Editar">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => deleteInventoryItem(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors" title="Excluir">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
                {historyItemId === item.id && (
                  <tr className="bg-gray-50/50 dark:bg-zinc-900/50">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="text-sm">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Histórico de Movimentações</h4>
                        {(!item.movements || item.movements.length === 0) ? (
                          <p className="text-gray-500 dark:text-gray-400">Nenhuma movimentação registrada para este item.</p>
                        ) : (
                          <div className="space-y-2">
                            {item.movements.slice().reverse().map(mov => (
                              <div key={mov.id} className="flex justify-between items-center bg-white dark:bg-zinc-800 p-2 rounded border border-gray-100 dark:border-zinc-700">
                                <div className="flex items-center gap-3">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${mov.type === 'entrada' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                    {mov.type === 'entrada' ? 'Entrada' : 'Saída'}
                                  </span>
                                  <span className="text-gray-600 dark:text-gray-300">
                                    {mov.quantity} {item.unit}
                                  </span>
                                  {mov.obraId && (
                                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                      Obr: {obras.find(o => o.id === mov.obraId)?.name || 'Desconhecida'}
                                    </span>
                                  )}
                                  <span className="text-gray-500 dark:text-gray-400 text-xs">{mov.note}</span>
                                </div>
                                <span className="text-xs text-gray-400">
                                  {new Date(mov.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Nenhum item encontrado no inventário.
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
                {editingId ? 'Editar Item' : 'Novo Item'}
              </h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Item</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                  <input 
                    required
                    type="text" 
                    list="inv-categories"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white"
                  />
                  <datalist id="inv-categories">
                    <option value="Construção Básica" />
                    <option value="Acabamento" />
                    <option value="Elétrica" />
                    <option value="Hidráulica" />
                    <option value="Ferramentas" />
                    <option value="Equipamentos" />
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unidade de Medida</label>
                  <select 
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white"
                  >
                    <option value="Unidades">Unidades</option>
                    <option value="Sacos">Sacos</option>
                    <option value="Litros">Litros</option>
                    <option value="Galões">Galões</option>
                    <option value="Latas">Latas</option>
                    <option value="KG">Quilogramas (KG)</option>
                    <option value="Metros">Metros</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantidade Atual</label>
                  <input 
                    required
                    type="number" 
                    min="0"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estoque Mínimo (Alerta)</label>
                  <input 
                    required
                    type="number" 
                    min="0"
                    step="0.01"
                    value={formData.minQuantity}
                    onChange={(e) => setFormData({...formData, minQuantity: Number(e.target.value)})}
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
                  Salvar Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Movimentação (Dar Baixa / Entrada Manual) */}
      {isMoveModalOpen && moveItemId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-zinc-800">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Movimentar Estoque
              </h2>
            </div>
            <form onSubmit={handleMoveSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Movimento</label>
                  <select 
                    value={moveData.type}
                    onChange={(e) => setMoveData({...moveData, type: e.target.value as any})}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white"
                  >
                    <option value="saida">Saída (Baixa)</option>
                    <option value="entrada">Entrada (Ajuste)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantidade</label>
                  <input 
                    required
                    type="number" 
                    min="0.01"
                    step="0.01"
                    value={moveData.quantity || ''}
                    onChange={(e) => setMoveData({...moveData, quantity: Number(e.target.value)})}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white"
                  />
                </div>
              </div>
              
              {moveData.type === 'saida' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Obra de Destino (Opcional)</label>
                  <select 
                    value={moveData.obraId}
                    onChange={(e) => setMoveData({...moveData, obraId: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white"
                  >
                    <option value="">Nenhuma / Consumo Interno</option>
                    {obras.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observação</label>
                <input 
                  type="text" 
                  placeholder="Ex: Material usado na concretagem da laje"
                  value={moveData.note}
                  onChange={(e) => setMoveData({...moveData, note: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white"
                />
              </div>

              {moveData.type === 'saida' && moveData.quantity > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Isso irá retirar <b>{moveData.quantity}</b> unidades do seu estoque atual. O estoque pode ficar negativo caso você informe um valor maior do que o disponível.
                </p>
              )}

              <div className="mt-6 flex gap-3 justify-end">
                <button 
                  type="button"
                  onClick={() => setIsMoveModalOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium rounded-lg transition-colors"
                >
                  Confirmar Movimentação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
