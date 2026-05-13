import React, { useState } from 'react';
import { useStore, type Employee } from '../store/useStore';
import {
  Plus, Search, UserCheck, UserMinus, UserCog,
  Edit2, Trash2, Clock, ChevronDown, ChevronUp, X, Calendar, Printer
} from 'lucide-react';

const CARGOS_CONSTRUCAO = [
  'Mestre de Obras', 'Encarregado de Obras', 'Pedreiro', 'Servente de Pedreiro',
  'Armador / Ferreiro', 'Carpinteiro de Formas', 'Carpinteiro de Acabamento',
  'Betoneiro', 'Eletricista', 'Encanador / Hidráulico', 'Gesseiro',
  'Azulejista / Revestidor', 'Pintor', 'Marmorista / Ladrilheiro',
  'Impermeabilizador', 'Soldador', 'Operador de Máquinas', 'Topógrafo',
  'Técnico em Edificações', 'Engenheiro Civil', 'Arquiteto', 'Almoxarife',
  'Vigia / Segurança', 'Auxiliar de Serviços Gerais',
];

const PAYMENT_LABELS: Record<string, string> = {
  diaria: 'Diária (R$/dia)',
  hora: 'Por Hora (R$/h)',
  quinzenal: 'Quinzenal (R$)',
  mensal: 'Mensal (R$)',
};

function calcHours(entry: string, exit: string): number {
  if (!entry || !exit) return 0;
  const [eh, em] = entry.split(':').map(Number);
  const [xh, xm] = exit.split(':').map(Number);
  return Math.max(0, (xh * 60 + xm - (eh * 60 + em)) / 60);
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function RH() {
  const { employees, addEmployee, deleteEmployee, updateEmployee, addTimePunch, deleteTimePunch } = useStore();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openPontoId, setOpenPontoId] = useState<string | null>(null);
  const [isPunchModalOpen, setIsPunchModalOpen] = useState(false);
  const [punchEmployeeId, setPunchEmployeeId] = useState<string | null>(null);
  const [editingPunchId, setEditingPunchId] = useState<string | null>(null);

  const emptyForm = {
    name: '', role: CARGOS_CONSTRUCAO[0], status: 'Ativo' as Employee['status'],
    contact: '', dailyRate: 0, paymentType: 'diaria' as Employee['paymentType'],
  };
  const [formData, setFormData] = useState(emptyForm);

  const emptyPunch = {
    date: new Date().toISOString().split('T')[0],
    entry: '07:00', exit: '17:00', hoursWorked: 10, valuePaid: 0, note: '',
  };
  const [punchForm, setPunchForm] = useState(emptyPunch);

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.role.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (emp?: Employee) => {
    if (emp) {
      setFormData({ name: emp.name, role: emp.role, status: emp.status, contact: emp.contact, dailyRate: emp.dailyRate ?? 0, paymentType: emp.paymentType ?? 'diaria' });
      setEditingId(emp.id);
    } else {
      setFormData(emptyForm);
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) updateEmployee(editingId, formData);
    else addEmployee(formData);
    setIsModalOpen(false);
  };

  const openPunchModal = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    setPunchEmployeeId(empId);
    setEditingPunchId(null);
    setPunchForm({ ...emptyPunch, valuePaid: emp?.dailyRate ?? 0 });
    setIsPunchModalOpen(true);
  };

  const { updateTimePunch } = useStore();

  const handlePunchSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!punchEmployeeId) return;
    const hours = calcHours(punchForm.entry, punchForm.exit);
    if (editingPunchId) {
      updateTimePunch(punchEmployeeId, editingPunchId, { ...punchForm, hoursWorked: hours });
    } else {
      addTimePunch(punchEmployeeId, { ...punchForm, hoursWorked: hours });
    }
    setIsPunchModalOpen(false);
    setEditingPunchId(null);
  };

  const handlePrintReceipt = (emp: Employee) => {
    const punches = emp.timePunches || [];
    const totalHoras = punches.reduce((s, p) => s + p.hoursWorked, 0);
    const totalPago = punches.reduce((s, p) => s + p.valuePaid, 0);

    const htmlContent = `
      <html>
        <head>
          <title>Extrato de Ponto - ${emp.name}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #111827; }
            .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
            .company { font-size: 24px; font-weight: bold; color: #4338ca; }
            .title { font-size: 20px; font-weight: 600; margin-top: 10px; }
            .emp-info { margin-bottom: 30px; display: flex; justify-content: space-between; }
            .emp-info div { display: flex; flex-direction: column; gap: 5px; }
            .label { font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
            .value { font-size: 16px; font-weight: 500; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            th { font-weight: 600; color: #4b5563; background-color: #f9fafb; }
            .totals { display: flex; justify-content: flex-end; gap: 40px; font-size: 18px; }
            .total-item { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
            .total-value { font-weight: bold; font-size: 24px; color: #10b981; }
            .signature { margin-top: 80px; display: flex; justify-content: space-between; }
            .sig-line { border-top: 1px solid #9ca3af; padding-top: 10px; width: 300px; text-align: center; color: #4b5563; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company">LZY Construções e Reformas</div>
            <div class="title">Extrato de Pagamento / Cartão Ponto</div>
          </div>
          
          <div class="emp-info">
            <div>
              <span class="label">Colaborador</span>
              <span class="value">${emp.name}</span>
            </div>
            <div>
              <span class="label">Cargo/Função</span>
              <span class="value">${emp.role}</span>
            </div>
            <div>
              <span class="label">Base de Pagamento</span>
              <span class="value">${fmt(emp.dailyRate ?? 0)} (${PAYMENT_LABELS[emp.paymentType ?? 'diaria']})</span>
            </div>
            <div>
              <span class="label">Data de Emissão</span>
              <span class="value">${new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Entrada</th>
                <th>Saída</th>
                <th>Horas</th>
                <th>Observação</th>
                <th style="text-align: right;">Valor (R$)</th>
              </tr>
            </thead>
            <tbody>
              ${punches.map(p => `
                <tr>
                  <td>${new Date(p.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                  <td>${p.entry}</td>
                  <td>${p.exit}</td>
                  <td>${p.hoursWorked.toFixed(1)}h</td>
                  <td>${p.note || '—'}</td>
                  <td style="text-align: right; font-weight: 500;">${fmt(p.valuePaid)}</td>
                </tr>
              `).join('')}
              ${punches.length === 0 ? `<tr><td colspan="6" style="text-align: center; color: #6b7280;">Nenhum registro encontrado.</td></tr>` : ''}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-item">
              <span class="label">Total de Horas</span>
              <span style="font-weight: bold; font-size: 24px;">${totalHoras.toFixed(1)}h</span>
            </div>
            <div class="total-item">
              <span class="label">Total a Pagar</span>
              <span class="total-value">${fmt(totalPago)}</span>
            </div>
          </div>

          <div class="signature">
            <div class="sig-line">Assinatura do Empregador</div>
            <div class="sig-line">Assinatura do Colaborador</div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const totalFolha = employees.reduce((acc, e) => {
    const pago = (e.timePunches ?? []).reduce((s, p) => s + p.valuePaid, 0);
    return acc + pago;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recursos Humanos</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie equipe, cargos, pagamentos e cartão ponto.</p>
        </div>
        <button onClick={() => openEdit()} className="bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
          <Plus size={20} /> Novo Colaborador
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Ativos', value: employees.filter(e => e.status === 'Ativo').length, icon: <UserCheck size={22} />, color: 'emerald' },
          { label: 'Em Férias', value: employees.filter(e => e.status === 'Férias').length, icon: <UserCog size={22} />, color: 'amber' },
          { label: 'Desligados', value: employees.filter(e => e.status === 'Desligado').length, icon: <UserMinus size={22} />, color: 'red' },
          { label: 'Total Pago (Folha)', value: fmt(totalFolha), icon: <Clock size={22} />, color: 'blue', isText: true },
        ].map((k, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center gap-4">
            <div className={`p-3 bg-${k.color}-100 text-${k.color}-600 dark:bg-${k.color}-900/30 dark:text-${k.color}-400 rounded-lg shrink-0`}>
              {k.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{k.label}</p>
              <h3 className={`font-bold text-gray-900 dark:text-white ${k.isText ? 'text-lg' : 'text-2xl'}`}>{k.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input type="text" placeholder="Buscar colaborador..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white text-gray-900 dark:text-white" />
      </div>

      {/* Colaboradores + Cartão Ponto */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-8 text-center text-gray-500">
            Nenhum colaborador encontrado.
          </div>
        )}
        {filtered.map(emp => {
          const punches = (emp.timePunches ?? []).slice().sort((a, b) => b.date.localeCompare(a.date));
          const totalPago = punches.reduce((s, p) => s + p.valuePaid, 0);
          const totalHoras = punches.reduce((s, p) => s + p.hoursWorked, 0);
          const isOpen = openPontoId === emp.id;

          return (
            <div key={emp.id} className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
              {/* Linha do colaborador */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-zinc-600 dark:text-zinc-300 shrink-0 text-sm">
                  {emp.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{emp.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{emp.role}</p>
                </div>
                <div className="hidden sm:flex flex-col items-end text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{PAYMENT_LABELS[emp.paymentType ?? 'diaria']}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{fmt(emp.dailyRate ?? 0)}</span>
                </div>
                <div className="hidden md:flex flex-col items-end text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Total Pago</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{fmt(totalPago)}</span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 ${
                  emp.status === 'Ativo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50' :
                  emp.status === 'Férias' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50' :
                  'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50'
                }`}>{emp.status}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openPunchModal(emp.id)} title="Lançar Ponto"
                    className="p-1.5 text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded transition-colors">
                    <Clock size={17} />
                  </button>
                  <button onClick={() => openEdit(emp)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors">
                    <Edit2 size={17} />
                  </button>
                  <button onClick={() => deleteEmployee(emp.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors">
                    <Trash2 size={17} />
                  </button>
                  <button onClick={() => setOpenPontoId(isOpen ? null : emp.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors">
                    {isOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                  </button>
                </div>
              </div>

              {/* Cartão Ponto expandido */}
              {isOpen && (
                <div className="border-t border-gray-100 dark:border-zinc-800 px-5 pb-4 pt-3">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2 text-sm">
                      <Calendar size={15} /> Cartão Ponto — {punches.length} registro(s) · {totalHoras.toFixed(1)}h · {fmt(totalPago)}
                    </h4>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handlePrintReceipt(emp)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-gray-300 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                        <Printer size={13} /> Extrato PDF
                      </button>
                      <button onClick={() => openPunchModal(emp.id)}
                        className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                        <Plus size={13} /> Lançar Ponto
                      </button>
                    </div>
                  </div>
                  {punches.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Nenhum registro de ponto ainda.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-zinc-800">
                            <th className="pb-2 pr-4">Data</th>
                            <th className="pb-2 pr-4">Entrada</th>
                            <th className="pb-2 pr-4">Saída</th>
                            <th className="pb-2 pr-4">Horas</th>
                            <th className="pb-2 pr-4">Valor Pago</th>
                            <th className="pb-2">Obs.</th>
                            <th className="pb-2"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-zinc-800/50">
                          {punches.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/30">
                              <td className="py-2 pr-4 font-medium text-gray-800 dark:text-gray-200">
                                {new Date(p.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                              </td>
                              <td className="py-2 pr-4 text-gray-600 dark:text-gray-400">{p.entry}</td>
                              <td className="py-2 pr-4 text-gray-600 dark:text-gray-400">{p.exit}</td>
                              <td className="py-2 pr-4 text-gray-600 dark:text-gray-400">{p.hoursWorked.toFixed(1)}h</td>
                              <td className="py-2 pr-4 font-semibold text-emerald-600 dark:text-emerald-400">{fmt(p.valuePaid)}</td>
                              <td className="py-2 text-gray-400 text-xs max-w-[120px] truncate">{p.note || '—'}</td>
                              <td className="py-2 pl-2 flex items-center justify-end gap-1">
                                <button onClick={() => {
                                  setPunchForm({ date: p.date, entry: p.entry, exit: p.exit, hoursWorked: p.hoursWorked, valuePaid: p.valuePaid, note: p.note || '' });
                                  setPunchEmployeeId(emp.id);
                                  setEditingPunchId(p.id);
                                  setIsPunchModalOpen(true);
                                }}
                                  className="p-1 text-gray-400 hover:text-blue-500 rounded transition-colors">
                                  <Edit2 size={14} />
                                </button>
                                <button onClick={() => deleteTimePunch(emp.id, p.id)}
                                  className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors">
                                  <X size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Colaborador */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingId ? 'Editar Colaborador' : 'Novo Colaborador'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cargo / Função</label>
                  <select required value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white">
                    {CARGOS_CONSTRUCAO.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contato</label>
                  <input type="text" value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Pagamento</label>
                  <select value={formData.paymentType} onChange={e => setFormData({ ...formData, paymentType: e.target.value as Employee['paymentType'] })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white">
                    <option value="diaria">Diária</option>
                    <option value="hora">Por Hora</option>
                    <option value="quinzenal">Quinzenal</option>
                    <option value="mensal">Mensal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {PAYMENT_LABELS[formData.paymentType]}
                  </label>
                  <input required type="number" step="0.01" min="0" value={formData.dailyRate}
                    onChange={e => setFormData({ ...formData, dailyRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as Employee['status'] })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white">
                  <option value="Ativo">Ativo</option>
                  <option value="Férias">Férias</option>
                  <option value="Desligado">Desligado</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium rounded-lg transition-colors">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Lançar Ponto */}
      {isPunchModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md border border-gray-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock size={18} className="text-purple-500" /> Lançar Ponto
              </h2>
              <button onClick={() => setIsPunchModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePunchSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
                <input required type="date" value={punchForm.date}
                  onChange={e => setPunchForm({ ...punchForm, date: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Entrada</label>
                  <input required type="time" value={punchForm.entry}
                    onChange={e => setPunchForm({ ...punchForm, entry: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Saída</label>
                  <input required type="time" value={punchForm.exit}
                    onChange={e => setPunchForm({ ...punchForm, exit: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white" />
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                Horas calculadas: <span className="font-semibold text-gray-900 dark:text-white">
                  {calcHours(punchForm.entry, punchForm.exit).toFixed(1)}h
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Pago (R$)</label>
                <input required type="number" step="0.01" min="0" value={punchForm.valuePaid}
                  onChange={e => setPunchForm({ ...punchForm, valuePaid: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observação (opcional)</label>
                <input type="text" value={punchForm.note ?? ''}
                  onChange={e => setPunchForm({ ...punchForm, note: e.target.value })}
                  placeholder="Ex: Hora extra, falta justificada..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white" />
              </div>
              <div className="flex gap-3 justify-end pt-1">
                <button type="button" onClick={() => setIsPunchModalOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
                  Registrar Ponto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
