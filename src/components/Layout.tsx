import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
  LayoutDashboard, 
  HardHat, 
  Wallet, 
  Package, 
  Users, 
  Settings,
  Menu,
  X,
  Building2,
  LogOut
} from 'lucide-react';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { currentUser, logout } = useStore();
  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/obras', icon: <HardHat size={20} />, label: 'Gestão de Obras' },
    { to: '/financeiro', icon: <Wallet size={20} />, label: 'Financeiro' },
    { to: '/inventario', icon: <Package size={20} />, label: 'Inventário' },
    { to: '/rh', icon: <Users size={20} />, label: 'Recursos Humanos' },
    { to: '/configuracoes', icon: <Settings size={20} />, label: 'Configurações', reqAdmin: true },
  ].filter(item => !item.reqAdmin || currentUser?.role === 'admin');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex">
      {/* Sidebar */}
      <aside 
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-zinc-900 border-r border-zinc-800 transition-all duration-300 flex flex-col fixed h-full z-20 text-white`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800">
          <div className={`flex items-center gap-3 overflow-hidden ${!sidebarOpen && 'justify-center w-full'}`}>
            <div className="shrink-0 flex items-center justify-center rounded-lg bg-zinc-800 p-1" style={{ width: '40px', height: '40px' }}>
              <img src="/logo.png" alt="LZY" className="max-w-full max-h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block'; }} />
              <Building2 size={24} className="text-orange-500" style={{ display: 'none' }} />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col leading-none justify-center">
                <span className="font-bold text-lg text-white tracking-wide">LZY</span>
                <span className="text-[11px] text-zinc-400 font-medium uppercase mt-0.5 whitespace-nowrap">Construções e Reforma</span>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-orange-500 text-white font-medium shadow-sm' 
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`
              }
              title={!sidebarOpen ? item.label : undefined}
            >
              <div className="shrink-0">{item.icon}</div>
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
                </nav>
        
        <div className="p-4 border-t border-zinc-800 space-y-2">
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 p-2 rounded-md text-zinc-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
            title={!sidebarOpen ? "Sair" : undefined}
          >
            <div className="shrink-0 flex items-center justify-center w-5 h-5"><LogOut size={20} /></div>
            {sidebarOpen && <span className="font-medium">Sair</span>}
          </button>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-2 rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="h-16 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
            Painel Gerencial
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hidden sm:block">
                {currentUser?.name}
              </span>
              <div className="h-8 w-8 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-500 flex items-center justify-center text-sm font-bold uppercase">
                {currentUser?.name?.substring(0, 2) || 'US'}
              </div>
            </div>
          </div>
        </header>
        
        <div className="flex-1 p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
