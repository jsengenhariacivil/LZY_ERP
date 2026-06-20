import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Obras from './pages/Obras';

import Financeiro from './pages/Financeiro';
import Inventario from './pages/Inventario';
import RH from './pages/RH';

import Configuracoes from './pages/Configuracoes';
import Login from './pages/Login';
import { useStore } from './store/useStore';

function App() {
  const { isDarkMode, seedImageTransactions, currentUser, initSupabase, isInitialized } = useStore();

  React.useEffect(() => {
    initSupabase();
    seedImageTransactions();
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode, initSupabase]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }
  return (
    <BrowserRouter>
      {currentUser ? (
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="obras" element={<Obras />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="inventario" element={<Inventario />} />
            <Route path="rh" element={<RH />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>
        </Routes>
      ) : (
        <Login />
      )}
    </BrowserRouter>
  );
}

export default App;
