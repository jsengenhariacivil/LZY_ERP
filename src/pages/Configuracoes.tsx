import { useStore } from '../store/useStore';
import { Moon, Sun } from 'lucide-react';

export default function Configuracoes() {
  const { isDarkMode, toggleDarkMode } = useStore();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Configurações</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Gerencie as configurações do sistema.
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
            className={`relative inline-flex h-10 w-20 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 ${
              isDarkMode ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-700'
            }`}
          >
            <span className="sr-only">Ativar modo escuro</span>
            <span
              className={`inline-flex h-8 w-8 transform items-center justify-center rounded-full bg-white transition-transform ${
                isDarkMode ? 'translate-x-11' : 'translate-x-1'
              }`}
            >
              {isDarkMode ? (
                <Moon className="h-4 w-4 text-blue-600" />
              ) : (
                <Sun className="h-4 w-4 text-yellow-500" />
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
