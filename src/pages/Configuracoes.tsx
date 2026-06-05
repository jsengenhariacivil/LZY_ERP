import { useState } from 'react';
import { useStore } from '../store/useStore';
import type { User } from '../store/useStore';
import { Moon, Sun, Users, Plus, Trash2, Edit2, ShieldAlert } from 'lucide-react';

export default function Configuracoes() {
  const { isDarkMode, toggleDarkMode, currentUser, users, addUser, updateUser, deleteUser } = useStore();
  
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<User>>({ name: '', username: '', password: '', role: 'user' });

  const handleSaveUser = () => {
    if (!formData.name || !formData.username) return;
    
    if (editingUserId) {
      updateUser(editingUserId, formData);
      setEditingUserId(null);
    } else {
      addUser(formData as Omit<User, 'id'>);
      setIsAddingUser(false);
    }
    setFormData({ name: '', username: '', password: '', role: 'user' });
  };

  const handleEdit = (u: User) => {
    setFormData(u);
    setEditingUserId(u.id);
    setIsAddingUser(true);
  };

  const cancelEdit = () => {
    setFormData({ name: '', username: '', password: '', role: 'user' });
    setEditingUserId(null);
    setIsAddingUser(false);
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-8 flex flex-col items-center justify-center h-96">
        <ShieldAlert size={64} className="text-orange-500 mb-4" />
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Acesso Restrito</h2>
        <p className="text-zinc-500 dark:text-zinc-400">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Configurações</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Gerencie as configurações do sistema e acessos.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Aparência</h2>
        <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="font-medium text-zinc-900 dark:text-white">Tema do Sistema</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Alterne entre o modo claro e escuro.
            </p>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative inline-flex h-10 w-20 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 ${
              isDarkMode ? 'bg-orange-500' : 'bg-zinc-200 dark:bg-zinc-700'
            }`}
          >
            <span className="sr-only">Ativar modo escuro</span>
            <span
              className={`inline-flex h-8 w-8 transform items-center justify-center rounded-full bg-white transition-transform ${
                isDarkMode ? 'translate-x-11' : 'translate-x-1'
              }`}
            >
              {isDarkMode ? (
                <Moon className="h-4 w-4 text-orange-500" />
              ) : (
                <Sun className="h-4 w-4 text-yellow-500" />
              )}
            </span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <Users size={24} className="text-orange-500" /> Gerenciamento de Usuários
          </h2>
          {!isAddingUser && (
            <button
              onClick={() => setIsAddingUser(true)}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} /> Novo Usuário
            </button>
          )}
        </div>

        {isAddingUser && (
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700 mb-6">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-4">
              {editingUserId ? 'Editar Usuário' : 'Criar Novo Usuário'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-white"
                  placeholder="Nome do usuário"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Login (Username)</label>
                <input
                  type="text"
                  value={formData.username || ''}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-white"
                  placeholder="username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Senha</label>
                <input
                  type="text"
                  value={formData.password || ''}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-white"
                  placeholder={editingUserId ? "Deixe em branco para manter" : "Senha de acesso"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Perfil (Role)</label>
                <select
                  value={formData.role || 'user'}
                  onChange={e => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-white"
                >
                  <option value="user">Usuário Comum (Restrito)</option>
                  <option value="admin">Administrador (Total)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 text-zinc-700 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveUser}
                className="px-4 py-2 text-white bg-orange-600 hover:bg-orange-500 rounded-lg text-sm font-medium transition-colors"
              >
                Salvar Usuário
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">Nome</th>
                <th className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">Usuário (Login)</th>
                <th className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">Perfil</th>
                <th className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/20">
                  <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300">{u.name}</td>
                  <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300 font-mono text-sm">{u.username}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                      {u.role === 'admin' ? 'Admin' : 'Usuário'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(u)}
                      className="p-1.5 text-zinc-500 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-md transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    {u.id !== currentUser?.id && (
                      <button
                        onClick={() => { if (window.confirm('Tem certeza que deseja excluir este usuário?')) deleteUser(u.id); }}
                        className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
