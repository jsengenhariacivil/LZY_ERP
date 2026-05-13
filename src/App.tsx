import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Obras from './pages/Obras';

import Financeiro from './pages/Financeiro';
import Inventario from './pages/Inventario';
import RH from './pages/RH';

import Configuracoes from './pages/Configuracoes';
import { useStore } from './store/useStore';

function App() {
  const { isDarkMode, seedImageTransactions } = useStore();

  React.useEffect(() => {
    seedImageTransactions();
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;
