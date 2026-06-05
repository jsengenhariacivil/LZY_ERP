import React, { useState } from 'react';
import { useStore, type Employee, type TimePunch } from '../store/useStore';
import {
  Plus, Search, UserCheck, UserMinus, UserCog,
  Edit2, Trash2, Clock, ChevronDown, ChevronUp, X, Calendar, Printer, CalendarRange, UserX
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

  const [isAutoFillModalOpen, setIsAutoFillModalOpen] = useState(false);
  const [autoFillStart, setAutoFillStart] = useState('');
  const [autoFillEnd, setAutoFillEnd] = useState('');

  const emptyForm = {
    name: '', cpf: '', role: CARGOS_CONSTRUCAO[0], status: 'Ativo' as Employee['status'],
    contact: '', dailyRate: 0, paymentType: 'diaria' as Employee['paymentType'],
  };
  const [formData, setFormData] = useState(emptyForm);

  const emptyPunch = {
    date: new Date().toISOString().split('T')[0],
    entry: '07:00', exit: '17:00', hoursWorked: 10, valuePaid: 0, note: '',
  };
  const [punchForm, setPunchForm] = useState(emptyPunch);

  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({ date: new Date().toISOString().split('T')[0], amount: 0, note: 'Adiantamento' });

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.role.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (emp?: Employee) => {
    if (emp) {
      setFormData({ name: emp.name, cpf: emp.cpf || '', role: emp.role, status: emp.status, contact: emp.contact, dailyRate: emp.dailyRate ?? 0, paymentType: emp.paymentType ?? 'diaria' });
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

  const openAdvanceModal = (empId: string) => {
    setPunchEmployeeId(empId);
    setAdvanceForm({ date: new Date().toISOString().split('T')[0], amount: 0, note: 'Adiantamento' });
    setIsAdvanceModalOpen(true);
  };

  const handleAdvanceSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (punchEmployeeId && advanceForm.amount > 0) {
      useStore.getState().addAdvance(punchEmployeeId, advanceForm.amount, advanceForm.date, advanceForm.note);
      setIsAdvanceModalOpen(false);
      setPunchEmployeeId(null);
    }
  };

  const handleAutoFill = (e: React.FormEvent) => {
    e.preventDefault();
    if (autoFillStart && autoFillEnd) {
      useStore.getState().autoFillWeek(autoFillStart, autoFillEnd);
      setIsAutoFillModalOpen(false);
    }
  };

  const handlePrintAdvanceReceipt = (emp: Employee, punch: TimePunch) => {
    const punches = [punch];
    const totalPago = punch.valuePaid;
    const totalBruto = punch.valuePaid > 0 ? punch.valuePaid : 0;
    const totalDescontos = punch.valuePaid < 0 ? Math.abs(punch.valuePaid) : 0;
    const dataInicial = new Date(punch.date + 'T00:00:00').toLocaleDateString('pt-BR');
    const dataFinal = dataInicial;
    const htmlContent = `
      <html>
        <head>
          <title>Recibo de Pagamento - ${emp.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 0; margin: 0; color: #111827; background: #fff; }
            .print-container { max-width: 800px; margin: 0 auto; padding-bottom: 100px; position: relative; min-height: 100vh; box-sizing: border-box; }
            .header { background-color: #4a4a4a; padding: 20px 40px; border-bottom: 6px solid #f58250; display: flex; align-items: center; justify-content: space-between; }
            .header img { max-height: 50px; }
            .header-title { color: #fff; font-size: 24px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
            .content { padding: 40px; }
            .title { font-size: 22px; font-weight: 700; margin-bottom: 25px; text-align: center; color: #111; }
            .emp-info { margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 15px; background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; }
            .legal-text { font-size: 14px; line-height: 1.6; text-align: justify; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            th { font-weight: 600; background-color: #f9fafb; color: #4b5563; text-transform: uppercase; font-size: 12px; }
            td { color: #111; }
            .totals { display: flex; justify-content: flex-end; gap: 40px; margin-bottom: 40px; }
            .signature { margin-top: 60px; display: flex; justify-content: space-between; }
            .sig-box { display: flex; flex-direction: column; align-items: center; width: 45%; }
            .sig-line { border-top: 1px solid #111; padding-top: 10px; width: 100%; text-align: center; font-weight: bold; }
            .sig-sub { font-size: 14px; color: #4b5563; margin-top: 5px; }
            .footer { position: fixed; bottom: 0; left: 0; width: 100%; background-color: #4a4a4a; border-top: 6px solid #f58250; padding: 15px 40px; display: flex; justify-content: space-between; color: #fff; font-size: 14px; box-sizing: border-box; font-weight: 600; }
            @media print { * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } body { padding: 0; } .print-container { min-height: auto; padding-bottom: 0; } .footer { position: fixed; bottom: 0; } @page { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${window.location.origin}/logo.png" alt="LZY" onerror="this.style.display='none'" />
            <div class="header-title">LZY Construções e Reforma</div>
          </div>
          <div class="print-container">
            <div class="content">
              <div class="title">RECIBO DE PAGAMENTO DE SERVIÇOS</div>
              
              <div class="emp-info">
                <div><strong>Favorecido(a):</strong> ${emp.name}</div>
                <div><strong>CPF:</strong> ${emp.cpf || 'Não informado'}</div>
                <div><strong>Cargo / Função:</strong> ${emp.role}</div>
                <div><strong>Data de Emissão:</strong> ${new Date().toLocaleDateString('pt-BR')}</div>
              </div>

              <div class="legal-text">
                Recebi(emos) da empresa <strong>LZY Construções e Reforma</strong>, a importância líquida de <strong>${fmt(totalPago)}</strong>, 
                correspondente ao pagamento integral pelas atividades executadas e serviços prestados no período de 
                <strong>${dataInicial} a ${dataFinal}</strong>.<br><br>
                Firmo(amos) o presente recibo, dando plena e geral quitação pelos serviços prestados neste período.
              </div>

              <h3 style="font-size: 14px; margin-bottom: 10px; color: #4b5563; text-transform: uppercase;">Extrato de Atividades</h3>
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
                </tbody>
              </table>

              <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                <div style="display: flex; gap: 40px; font-size: 15px;">
                  <div style="color: #6b7280;">Total Bruto:</div>
                  <div style="font-weight: 600;">${fmt(totalBruto)}</div>
                </div>
                <div style="display: flex; gap: 40px; font-size: 15px;">
                  <div style="color: #6b7280;">Descontos:</div>
                  <div style="font-weight: 600; color: #ef4444;">- ${fmt(totalDescontos)}</div>
                </div>
                <div style="width: 250px; border-top: 2px solid #e5e7eb; margin: 10px 0;"></div>
                <div style="display: flex; gap: 40px; font-size: 18px;">
                  <div style="color: #111; font-weight: bold;">TOTAL LÍQUIDO:</div>
                  <div style="font-weight: bold; color: #f58250;">${fmt(totalPago)}</div>
                </div>
              </div>

              <div class="signature">
                <div class="sig-box">
                  <div class="sig-line">LZY Construções e Reforma</div>
                  <div class="sig-sub">Contratante</div>
                </div>
                <div class="sig-box">
                  <div class="sig-line">${emp.name}</div>
                  <div class="sig-sub">CPF: ${emp.cpf || '__________________'}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="footer">
            <div>📞 (73) 99928-5302</div>
            <div>✉️ ernestoluziney@gmail.com</div>
          </div>
          <script>
            window.onload = () => { setTimeout(() => window.print(), 300); }
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  const handlePrintReceipt = (emp: Employee) => {
    const punches = emp.timePunches || [];
    // const totalHoras = punches.reduce((s, p) => s + p.hoursWorked, 0);
    const totalPago = punches.reduce((s, p) => s + p.valuePaid, 0);
    const totalBruto = punches.reduce((s, p) => p.valuePaid > 0 ? s + p.valuePaid : s, 0);
    const totalDescontos = punches.reduce((s, p) => p.valuePaid < 0 ? s + Math.abs(p.valuePaid) : s, 0);

    const dataInicial = punches.length > 0 ? new Date(punches[0].date + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A';
    const dataFinal = punches.length > 0 ? new Date(punches[punches.length - 1].date + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A';

    const htmlContent = `
      <html>
        <head>
          <title>Recibo de Pagamento - ${emp.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 0; margin: 0; color: #111827; background: #fff; }
            .print-container { max-width: 800px; margin: 0 auto; padding-bottom: 100px; position: relative; min-height: 100vh; box-sizing: border-box; }
            .header { background-color: #4a4a4a; padding: 20px 40px; border-bottom: 6px solid #f58250; display: flex; align-items: center; justify-content: space-between; }
            .header img { max-height: 50px; }
            .header-title { color: #fff; font-size: 24px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
            .content { padding: 40px; }
            .title { font-size: 22px; font-weight: 700; margin-bottom: 25px; text-align: center; color: #111; }
            .emp-info { margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 15px; background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; }
            .legal-text { font-size: 14px; line-height: 1.6; text-align: justify; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            th { font-weight: 600; background-color: #f9fafb; color: #4b5563; text-transform: uppercase; font-size: 12px; }
            td { color: #111; }
            .totals { display: flex; justify-content: flex-end; gap: 40px; margin-bottom: 40px; }
            .signature { margin-top: 60px; display: flex; justify-content: space-between; }
            .sig-box { display: flex; flex-direction: column; align-items: center; width: 45%; }
            .sig-line { border-top: 1px solid #111; padding-top: 10px; width: 100%; text-align: center; font-weight: bold; }
            .sig-sub { font-size: 14px; color: #4b5563; margin-top: 5px; }
            .footer { position: fixed; bottom: 0; left: 0; width: 100%; background-color: #4a4a4a; border-top: 6px solid #f58250; padding: 15px 40px; display: flex; justify-content: space-between; color: #fff; font-size: 14px; box-sizing: border-box; font-weight: 600; }
            @media print { * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } body { padding: 0; } .print-container { min-height: auto; padding-bottom: 0; } .footer { position: fixed; bottom: 0; } @page { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${window.location.origin}/logo.png" alt="LZY" onerror="this.style.display='none'" />
            <div class="header-title">LZY Construções e Reforma</div>
          </div>
          <div class="print-container">
            <div class="content">
              <div class="title">RECIBO DE PAGAMENTO DE SERVIÇOS</div>
              
              <div class="emp-info">
                <div><strong>Favorecido(a):</strong> ${emp.name}</div>
                <div><strong>CPF:</strong> ${emp.cpf || 'Não informado'}</div>
                <div><strong>Cargo / Função:</strong> ${emp.role}</div>
                <div><strong>Data de Emissão:</strong> ${new Date().toLocaleDateString('pt-BR')}</div>
              </div>

              <div class="legal-text">
                Recebi(emos) da empresa <strong>LZY Construções e Reforma</strong>, a importância líquida de <strong>${fmt(totalPago)}</strong>, 
                correspondente ao pagamento integral pelas atividades executadas e serviços prestados no período de 
                <strong>${dataInicial} a ${dataFinal}</strong>.<br><br>
                Firmo(amos) o presente recibo, dando plena e geral quitação pelos serviços prestados neste período.
              </div>

              <h3 style="font-size: 14px; margin-bottom: 10px; color: #4b5563; text-transform: uppercase;">Extrato de Atividades</h3>
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
                </tbody>
              </table>

              <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                <div style="display: flex; gap: 40px; font-size: 15px;">
                  <div style="color: #6b7280;">Total Bruto:</div>
                  <div style="font-weight: 600;">${fmt(totalBruto)}</div>
                </div>
                <div style="display: flex; gap: 40px; font-size: 15px;">
                  <div style="color: #6b7280;">Descontos:</div>
                  <div style="font-weight: 600; color: #ef4444;">- ${fmt(totalDescontos)}</div>
                </div>
                <div style="width: 250px; border-top: 2px solid #e5e7eb; margin: 10px 0;"></div>
                <div style="display: flex; gap: 40px; font-size: 18px;">
                  <div style="color: #111; font-weight: bold;">TOTAL LÍQUIDO:</div>
                  <div style="font-weight: bold; color: #f58250;">${fmt(totalPago)}</div>
                </div>
              </div>

              <div class="signature">
                <div class="sig-box">
                  <div class="sig-line">LZY Construções e Reforma</div>
                  <div class="sig-sub">Contratante</div>
                </div>
                <div class="sig-box">
                  <div class="sig-line">${emp.name}</div>
                  <div class="sig-sub">CPF: ${emp.cpf || '__________________'}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="footer">
            <div>📞 (73) 99928-5302</div>
            <div>✉️ ernestoluziney@gmail.com</div>
          </div>
          <script>
            window.onload = () => { setTimeout(() => window.print(), 300); }
          </script>
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
        <div className="flex items-center gap-2">
          <button onClick={() => setIsAutoFillModalOpen(true)} className="bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
            <CalendarRange size={18} /> Preencher Diárias
          </button>
          <button onClick={() => openEdit()} className="bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
            <Plus size={20} /> Novo
          </button>
        </div>
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
          // const totalHoras = punches.reduce((s, p) => s + p.hoursWorked, 0);
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
                      <Calendar size={15} /> Cartão Ponto — {punches.length} registro(s) · {(punches.reduce((s, p) => s + p.hoursWorked, 0)).toFixed(1)}h · {fmt(totalPago)}
                    </h4>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handlePrintReceipt(emp)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-gray-300 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                        <Printer size={13} /> Extrato PDF
                      </button>
                      <button onClick={() => openAdvanceModal(emp.id)}
                        className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-400 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                        <UserMinus size={13} /> Adiantamento
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
                                {p.valuePaid < 0 && (
                                  <button onClick={() => handlePrintAdvanceReceipt(emp, p)} title="Imprimir Recibo de Vale"
                                    className="p-1 text-gray-400 hover:text-amber-600 rounded transition-colors">
                                    <Printer size={14} />
                                  </button>
                                )}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPF</label>
                  <input type="text" value={formData.cpf || ''} onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white" />
                </div>
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
              <div className="flex items-center justify-between">
                <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                  Horas calculadas: <span className="font-semibold text-gray-900 dark:text-white">
                    {calcHours(punchForm.entry, punchForm.exit).toFixed(1)}h
                  </span>
                </div>
                <button type="button" onClick={() => setPunchForm({ ...punchForm, entry: '00:00', exit: '00:00', hoursWorked: 0, valuePaid: 0, note: 'Falta' })}
                  className="text-xs bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                  <UserX size={14} /> Marcar como Falta
                </button>
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

      {/* Modal Autopreenchimento */}
      {isAutoFillModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md border border-gray-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center bg-emerald-50/50 dark:bg-emerald-900/10">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CalendarRange size={18} className="text-emerald-600" /> Autopreencher Diárias
              </h2>
              <button onClick={() => setIsAutoFillModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAutoFill} className="p-6 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-zinc-800 p-3 rounded-lg">
                Esta ação irá lançar automaticamente <strong>8 horas trabalhadas (08:00 às 17:00)</strong> para todos os dias úteis no intervalo selecionado, apenas para colaboradores com status <strong>"Ativo"</strong>, utilizando a taxa diária de cada um.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Inicial</label>
                  <input required type="date" value={autoFillStart}
                    onChange={e => setAutoFillStart(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Final</label>
                  <input required type="date" value={autoFillEnd}
                    onChange={e => setAutoFillEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" />
                </div>
              </div>
              
              <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={() => setIsAutoFillModalOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors">
                  Preencher Agora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Adiantamento */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md border border-gray-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center bg-amber-50/50 dark:bg-amber-900/10">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UserMinus size={18} className="text-amber-600" /> Adiantamento / Desconto
              </h2>
              <button onClick={() => setIsAdvanceModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAdvanceSave} className="p-6 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-zinc-800 p-3 rounded-lg">
                O valor inserido aqui será **descontado** do total a pagar do funcionário. Uma **despesa automática** será criada no painel Financeiro.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
                  <input required type="date" value={advanceForm.date}
                    onChange={e => setAdvanceForm({ ...advanceForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor (R$)</label>
                  <input required type="number" step="0.01" min="0.01" value={advanceForm.amount}
                    onChange={e => setAdvanceForm({ ...advanceForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observação / Motivo</label>
                <input required type="text" value={advanceForm.note}
                  onChange={e => setAdvanceForm({ ...advanceForm, note: e.target.value })}
                  placeholder="Ex: Vale Material, Adiantamento de Salário"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white" />
              </div>
              
              <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={() => setIsAdvanceModalOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors">
                  Salvar Desconto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
