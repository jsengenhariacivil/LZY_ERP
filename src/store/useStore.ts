import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── HELPER ──────────────────────────────────────────────────────────────────
const generateId = () => Math.random().toString(36).substring(2, 9);



// ─── ETAPAS PADRÃO ───────────────────────────────────────────────────────────
export type Stage = {
  id: string;
  name: string;
  weight: number;   // % financeiro da etapa sobre o total da obra
  progress: number; // % de execução física desta etapa (0-100)
  startDate: string;
  endDate: string;
  value?: number;   // Valor em Reais (opcional para as originais, obrigatório para aditivos)
};

const DEFAULT_STAGES: Omit<Stage, 'id' | 'startDate' | 'endDate'>[] = [
  { name: 'Projetos e Licenças',          weight: 5,  progress: 0 },
  { name: 'Serviços Preliminares',        weight: 5,  progress: 0 },
  { name: 'Fundação',                     weight: 10, progress: 0 },
  { name: 'Estrutura',                    weight: 20, progress: 0 },
  { name: 'Alvenaria e Fechamentos',      weight: 10, progress: 0 },
  { name: 'Cobertura',                    weight: 5,  progress: 0 },
  { name: 'Instalações Hidráulicas',      weight: 10, progress: 0 },
  { name: 'Instalações Elétricas',        weight: 10, progress: 0 },
  { name: 'Revestimentos e Acabamentos',  weight: 20, progress: 0 },
  { name: 'Pintura e Entrega',            weight: 5,  progress: 0 },
];

function generateStages(startDate: string, endDate: string): Stage[] {
  const start = new Date(startDate).getTime();
  const end   = new Date(endDate).getTime();
  const totalMs = end - start;
  let accumulated = 0;
  return DEFAULT_STAGES.map((s) => {
    const stageStartMs = start + totalMs * (accumulated / 100);
    accumulated += s.weight;
    const stageEndMs = start + totalMs * (accumulated / 100);
    const stageStart = new Date(stageStartMs).toISOString().split('T')[0];
    const stageEnd   = new Date(stageEndMs).toISOString().split('T')[0];
    return { id: generateId(), ...s, startDate: stageStart, endDate: stageEnd };
  });
}

/** Calcula progresso global a partir das etapas (média ponderada) */
export function calcProgress(stages: Stage[]): number {
  if (!stages || stages.length === 0) return 0;
  const totalWeight = stages.reduce((a, s) => a + s.weight, 0);
  const weighted = stages.reduce((a, s) => a + s.progress * (s.weight / totalWeight), 0);
  return Math.round(weighted);
}

// ─── TYPES ───────────────────────────────────────────────────────────────────
export type Obra = {
  id: string;
  name: string;
  status: 'Planejamento' | 'Em Andamento' | 'Concluída' | 'Atrasada';
  progress: number;
  budget: number;
  startDate: string;
  endDate: string;
  stages: Stage[];
};

export type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: 'receita' | 'despesa';
  category: string;
  date: string;
  entity: 'PJ' | 'Pessoal';
  status: 'Pendente' | 'Pago' | 'Recebido';
  obraId?: string;
};

export type InventoryMovement = {
  id: string;
  date: string;
  type: 'entrada' | 'saida';
  quantity: number;
  obraId?: string; // se for saída para uma obra
  note: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  category: string;
  movements?: InventoryMovement[];
};

export type TimePunch = {
  id: string;
  date: string;          // YYYY-MM-DD
  entry: string;         // HH:MM
  exit: string;          // HH:MM
  hoursWorked: number;   // calculado
  valuePaid: number;     // valor pago nesse dia
  note?: string;
};

export type Employee = {
  id: string;
  name: string;
  role: string;
  status: 'Ativo' | 'Férias' | 'Desligado';
  contact: string;
  dailyRate: number;           // valor diário ou por hora
  paymentType: 'diaria' | 'quinzenal' | 'mensal' | 'hora';
  timePunches: TimePunch[];    // cartão ponto
};

// ─── STATE INTERFACE ──────────────────────────────────────────────────────────
interface AppState {
  obras: Obra[];
  transactions: Transaction[];
  inventory: InventoryItem[];
  employees: Employee[];
  isDarkMode: boolean;

  addObra: (obra: Omit<Obra, 'id' | 'progress' | 'stages'>) => void;
  updateObra: (id: string, obra: Partial<Obra>) => void;
  deleteObra: (id: string) => void;
  updateStage: (obraId: string, stageId: string, data: Partial<Stage>) => void;
  addExtraService: (obraId: string, service: { name: string; value: number; startDate: string; endDate: string }) => void;

  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  addInventoryMovement: (itemId: string, movement: Omit<InventoryMovement, 'id'>) => void;

  addEmployee: (employee: Omit<Employee, 'id' | 'timePunches'>) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  addTimePunch: (employeeId: string, punch: Omit<TimePunch, 'id'>) => void;
  updateTimePunch: (employeeId: string, punchId: string, data: Partial<TimePunch>) => void;
  deleteTimePunch: (employeeId: string, punchId: string) => void;

  toggleDarkMode: () => void;
  seedImageTransactions: () => void;
}

// ─── SEED: Obra Outeiro com etapas reais ─────────────────────────────────────
const outeirosStages: Stage[] = [
  { id: 's1',  name: 'Projetos e Licenças',          weight: 5,  progress: 100, startDate: '2025-04-01', endDate: '2025-04-15' },
  { id: 's2',  name: 'Serviços Preliminares',        weight: 5,  progress: 100, startDate: '2025-04-15', endDate: '2025-04-30' },
  { id: 's3',  name: 'Fundação',                     weight: 10, progress: 100, startDate: '2025-04-30', endDate: '2025-06-30' },
  { id: 's4',  name: 'Estrutura',                    weight: 20, progress: 100, startDate: '2025-06-30', endDate: '2025-10-15' },
  { id: 's5',  name: 'Alvenaria e Fechamentos',      weight: 10, progress: 80,  startDate: '2025-10-15', endDate: '2025-12-15' },
  { id: 's6',  name: 'Cobertura',                    weight: 5,  progress: 60,  startDate: '2025-12-15', endDate: '2026-01-15' },
  { id: 's7',  name: 'Instalações Hidráulicas',      weight: 10, progress: 20,  startDate: '2026-01-15', endDate: '2026-03-15' },
  { id: 's8',  name: 'Instalações Elétricas',        weight: 10, progress: 10,  startDate: '2026-03-15', endDate: '2026-05-15' },
  { id: 's9',  name: 'Revestimentos e Acabamentos',  weight: 20, progress: 0,   startDate: '2026-05-15', endDate: '2026-09-15' },
  { id: 's10', name: 'Pintura e Entrega',             weight: 5,  progress: 0,   startDate: '2026-09-15', endDate: '2026-10-30' },
];

// ─── STORE ────────────────────────────────────────────────────────────────────
export const useStore = create<AppState>()(
  persist(
    (set) => ({
      obras: [
        {
          id: '1',
          name: 'Obra Outeiro',
          status: 'Em Andamento',
          progress: calcProgress(outeirosStages),
          budget: 500000,
          startDate: '2025-04-01',
          endDate: '2026-10-30',
          stages: outeirosStages,
        },
      ],
      transactions: [
        // ── Recebimentos reais da Obra Outeiro ───────────────────────────
        { id: 'seed-1',  description: 'LZY - PAGAMENTO MÃO DE OBRA INICIAL',          amount: 93000,  type: 'receita', category: 'Recebimento de Obra', date: '2025-04-22', entity: 'PJ', status: 'Recebido', obraId: '1' },
        { id: 'seed-2',  description: 'LZY - SALDO DE ABRIL',                          amount: 7000,   type: 'receita', category: 'Recebimento de Obra', date: '2025-06-13', entity: 'PJ', status: 'Recebido', obraId: '1' },
        { id: 'seed-3',  description: 'LZY - PARCIAL MÃO DE OBRA JUNHO',               amount: 6000,   type: 'receita', category: 'Recebimento de Obra', date: '2025-06-13', entity: 'PJ', status: 'Recebido', obraId: '1' },
        { id: 'seed-4',  description: 'LZY - PARCIAL MÃO DE OBRA JUNHO',               amount: 12000,  type: 'receita', category: 'Recebimento de Obra', date: '2025-06-23', entity: 'PJ', status: 'Recebido', obraId: '1' },
        { id: 'seed-5',  description: 'LZY - CONSTRUTORA',                             amount: 11900,  type: 'receita', category: 'Recebimento de Obra', date: '2025-08-13', entity: 'PJ', status: 'Recebido', obraId: '1' },
        { id: 'seed-6',  description: 'LZY - CONSTRUTORA',                             amount: 8000,   type: 'receita', category: 'Recebimento de Obra', date: '2025-08-19', entity: 'PJ', status: 'Recebido', obraId: '1' },
        { id: 'seed-7',  description: 'LZY - CONSTRUTORA',                             amount: 9800,   type: 'receita', category: 'Recebimento de Obra', date: '2025-08-21', entity: 'PJ', status: 'Recebido', obraId: '1' },
        { id: 'seed-8',  description: 'LZY - CONSTRUTORA',                             amount: 18000,  type: 'receita', category: 'Recebimento de Obra', date: '2025-08-29', entity: 'PJ', status: 'Recebido', obraId: '1' },
        { id: 'seed-9',  description: 'LZY - CONSTRUTORA',                             amount: 14595,  type: 'receita', category: 'Recebimento de Obra', date: '2025-09-12', entity: 'PJ', status: 'Recebido', obraId: '1' },
        { id: 'seed-10', description: 'LZY - CONSTRUTORA',                             amount: 17000,  type: 'receita', category: 'Recebimento de Obra', date: '2025-09-26', entity: 'PJ', status: 'Recebido', obraId: '1' },
        { id: 'seed-11', description: 'LZY - CONSTRUTORA',                             amount: 17000,  type: 'receita', category: 'Recebimento de Obra', date: '2025-10-10', entity: 'PJ', status: 'Recebido', obraId: '1' },
        { id: 'seed-12', description: 'LZY - CONSTRUTORA',                             amount: 17000,  type: 'receita', category: 'Recebimento de Obra', date: '2025-11-10', entity: 'PJ', status: 'Recebido', obraId: '1' },
        { id: 'seed-13', description: 'LZY - CONSTRUTORA - REEMBOLSO GASOLINA OUTROS', amount: 630.65, type: 'receita', category: 'Reembolso',           date: '2025-11-10', entity: 'PJ', status: 'Recebido', obraId: '1' },
        { id: 'seed-14', description: 'LZY - CONSTRUTORA - PARCIAL MÃO DE OBRA',       amount: 7000,   type: 'receita', category: 'Recebimento de Obra', date: '2025-11-28', entity: 'PJ', status: 'Recebido', obraId: '1' },
        { id: 'seed-15', description: 'LZY - CONSTRUTORA - MÃO DE OBRA',               amount: 17000,  type: 'receita', category: 'Recebimento de Obra', date: '2025-12-05', entity: 'PJ', status: 'Recebido', obraId: '1' },
        { id: 'seed-16', description: 'LZY - CONSTRUTORA - REEMBOLSO GASOLINA OUTROS', amount: 235.20, type: 'receita', category: 'Reembolso',           date: '2025-12-05', entity: 'PJ', status: 'Recebido', obraId: '1' },
        { id: 'seed-17', description: 'LZY - CONSTRUTORA - MÃO DE OBRA',               amount: 17000,  type: 'receita', category: 'Recebimento de Obra', date: '2025-12-18', entity: 'PJ', status: 'Recebido', obraId: '1' },
        { id: 'seed-18', description: 'LZY - CONSTRUTORA - REEMBOLSO GASOLINA OUTROS', amount: 106.20, type: 'receita', category: 'Reembolso',           date: '2025-12-18', entity: 'PJ', status: 'Recebido', obraId: '1' },
        { id: 'seed-19', description: 'LZY - CONSTRUTORA - MÃO DE OBRA',               amount: 9800,   type: 'receita', category: 'Recebimento de Obra', date: '2026-02-18', entity: 'PJ', status: 'Recebido', obraId: '1' },
        { id: 'seed-20', description: 'LZY - CONSTRUTORA - MÃO DE OBRA',               amount: 17000,  type: 'receita', category: 'Recebimento de Obra', date: '2026-03-06', entity: 'PJ', status: 'Recebido', obraId: '1' },
        { id: 'seed-21', description: 'LZY - CONSTRUTORA - MÃO DE OBRA',               amount: 17000,  type: 'receita', category: 'Recebimento de Obra', date: '2026-03-20', entity: 'PJ', status: 'Recebido', obraId: '1' },
        { id: 'seed-22', description: 'LZY - CONSTRUTORA - MÃO DE OBRA',               amount: 17000,  type: 'receita', category: 'Recebimento de Obra', date: '2026-04-08', entity: 'PJ', status: 'Recebido', obraId: '1' },
        { id: 'seed-23', description: 'LZY - MÃO DE OBRA REF. ABRIL (2 QUINZENA)',     amount: 40000,  type: 'receita', category: 'Recebimento de Obra', date: '2026-05-07', entity: 'PJ', status: 'Recebido', obraId: '1' },
      ],
      inventory: [],
      employees: [],
      isDarkMode: false,

      // ── Obras ────────────────────────────────────────────────────────────
      addObra: (obra) => set((state) => {
        const stages = generateStages(obra.startDate, obra.endDate);
        const newObra: Obra = { ...obra, id: generateId(), stages, progress: 0 };
        return { obras: [...state.obras, newObra] };
      }),
      updateObra: (id, updated) => set((state) => ({
        obras: state.obras.map((o) => o.id === id ? { ...o, ...updated } : o)
      })),
      deleteObra: (id) => set((state) => ({ obras: state.obras.filter(o => o.id !== id) })),

      updateStage: (obraId, stageId, data) => set((state) => ({
        obras: state.obras.map(o => {
          if (o.id !== obraId) return o;
          const stages = o.stages.map(s => s.id === stageId ? { ...s, ...data } : s);
          return { ...o, stages, progress: calcProgress(stages) };
        })
      })),

      addExtraService: (obraId, service) => set((state) => ({
        obras: state.obras.map(o => {
          if (o.id !== obraId) return o;
          
          // O peso será proporcional ao valor do serviço vs o orçamento atual.
          // Se o orçamento é 100k (peso 100) e o serviço é 20k -> peso = 20.
          const weight = o.budget > 0 ? (service.value / o.budget) * 100 : 10;
          
          const newStage: Stage = {
            id: generateId(),
            name: service.name,
            weight: weight,
            progress: 0,
            startDate: service.startDate,
            endDate: service.endDate,
            value: service.value
          };
          
          const newStages = [...o.stages, newStage];
          
          return {
            ...o,
            budget: o.budget + service.value,
            stages: newStages,
            progress: calcProgress(newStages)
          };
        })
      })),

      // ── Transactions ─────────────────────────────────────────────────────
      addTransaction: (transaction) => set((state) => {
        const newTrans = { ...transaction, id: generateId() };
        let newTransactions = [...state.transactions, newTrans];
        if (newTrans.type === 'despesa' && newTrans.entity === 'PJ' && ['Pró-labore', 'Retirada'].includes(newTrans.category)) {
          newTransactions.push({
            id: generateId(),
            description: `Recebimento: ${newTrans.description}`,
            amount: newTrans.amount,
            type: 'receita',
            category: 'Salário/Lucro',
            date: newTrans.date,
            entity: 'Pessoal',
            status: newTrans.status === 'Pago' ? 'Recebido' : 'Pendente'
          });
        }
        return { transactions: newTransactions };
      }),
      updateTransaction: (id, updated) => set((state) => ({
        transactions: state.transactions.map((t) => t.id === id ? { ...t, ...updated } : t)
      })),
      deleteTransaction: (id) => set((state) => ({ transactions: state.transactions.filter(t => t.id !== id) })),

      // ── Inventory ────────────────────────────────────────────────────────
      addInventoryItem: (item) => set((state) => ({ inventory: [...state.inventory, { ...item, id: generateId(), movements: [] }] })),
      updateInventoryItem: (id, updated) => set((state) => ({
        inventory: state.inventory.map((i) => i.id === id ? { ...i, ...updated } : i)
      })),
      deleteInventoryItem: (id) => set((state) => ({ inventory: state.inventory.filter(i => i.id !== id) })),
      addInventoryMovement: (itemId, movement) => set((state) => ({
        inventory: state.inventory.map((item) => {
          if (item.id !== itemId) return item;
          const newMovement = { ...movement, id: generateId() };
          const newQuantity = movement.type === 'entrada' 
            ? item.quantity + movement.quantity 
            : item.quantity - movement.quantity;
          
          return {
            ...item,
            quantity: newQuantity,
            movements: [...(item.movements || []), newMovement]
          };
        })
      })),

      // ── Employees ────────────────────────────────────────────────────────
      addEmployee: (employee) => set((state) => ({
        employees: [...state.employees, { ...employee, id: generateId(), timePunches: [] }]
      })),
      updateEmployee: (id, updated) => set((state) => ({
        employees: state.employees.map((e) => e.id === id ? { ...e, ...updated } : e)
      })),
      deleteEmployee: (id) => set((state) => ({ employees: state.employees.filter(e => e.id !== id) })),
      addTimePunch: (employeeId, punch) => set((state) => ({
        employees: state.employees.map(e =>
          e.id === employeeId
            ? { ...e, timePunches: [...(e.timePunches ?? []), { ...punch, id: generateId() }] }
            : e
        )
      })),
      updateTimePunch: (employeeId, punchId, data) => set((state) => ({
        employees: state.employees.map(e =>
          e.id === employeeId
            ? { ...e, timePunches: (e.timePunches ?? []).map(p => p.id === punchId ? { ...p, ...data } : p) }
            : e
        )
      })),
      deleteTimePunch: (employeeId, punchId) => set((state) => ({
        employees: state.employees.map(e =>
          e.id === employeeId
            ? { ...e, timePunches: (e.timePunches ?? []).filter(p => p.id !== punchId) }
            : e
        )
      })),

      // ── Theme ────────────────────────────────────────────────────────────
      toggleDarkMode: () => set((state) => {
        const newIsDark = !state.isDarkMode;
        if (newIsDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        return { isDarkMode: newIsDark };
      }),

      // ── Seed ─────────────────────────────────────────────────────────────
      seedImageTransactions: () => set((state) => {
        const hasSeeded = state.transactions.some(t => t.id === 'img-0');
        if (hasSeeded) return state;
        const imageTransactions: Transaction[] = [
          { description: 'LZY - PAGAMENTO MÃO DE OBRA INICIAL',          amount: 93000,  date: '2025-04-22' },
          { description: 'LZY - SALDO DE ABRIL',                          amount: 7000,   date: '2025-06-13' },
          { description: 'LZY - PARCIAL MÃO DE OBRA JUNHO',               amount: 6000,   date: '2025-06-13' },
          { description: 'LZY - PARCIAL MÃO DE OBRA JUNHO',               amount: 12000,  date: '2025-06-23' },
          { description: 'LZY - CONSTRUTORA',                             amount: 11900,  date: '2025-08-13' },
          { description: 'LZY - CONSTRUTORA',                             amount: 8000,   date: '2025-08-19' },
          { description: 'LZY - CONSTRUTORA',                             amount: 9800,   date: '2025-08-21' },
          { description: 'LZY - CONSTRUTORA',                             amount: 18000,  date: '2025-08-29' },
          { description: 'LZY - CONSTRUTORA',                             amount: 14595,  date: '2025-09-12' },
          { description: 'LZY - CONSTRUTORA',                             amount: 17000,  date: '2025-09-26' },
          { description: 'LZY - CONSTRUTORA',                             amount: 17000,  date: '2025-10-10' },
          { description: 'LZY - CONSTRUTORA',                             amount: 17000,  date: '2025-11-10' },
          { description: 'LZY - CONSTRUTORA - REEMBOLSO GASOLINA OUTROS', amount: 630.65, date: '2025-11-10' },
          { description: 'LZY - CONSTRUTORA - PARCIAL MÃO DE OBRA',       amount: 7000,   date: '2025-11-28' },
          { description: 'LZY - CONSTRUTORA - MÃO DE OBRA',               amount: 17000,  date: '2025-12-05' },
          { description: 'LZY - CONSTRUTORA - REEMBOLSO GASOLINA OUTROS', amount: 235.20, date: '2025-12-05' },
          { description: 'LZY - CONSTRUTORA - MÃO DE OBRA',               amount: 17000,  date: '2025-12-18' },
          { description: 'LZY - CONSTRUTORA - REEMBOLSO GASOLINA OUTROS', amount: 106.20, date: '2025-12-18' },
          { description: 'LZY - CONSTRUTORA - MÃO DE OBRA',               amount: 9800,   date: '2026-02-18' },
          { description: 'LZY - CONSTRUTORA - MÃO DE OBRA',               amount: 17000,  date: '2026-03-06' },
          { description: 'LZY - CONSTRUTORA - MÃO DE OBRA',               amount: 17000,  date: '2026-03-20' },
          { description: 'LZY - CONSTRUTORA - MÃO DE OBRA',               amount: 17000,  date: '2026-04-08' },
          { description: 'LZY - MÃO DE OBRA REF. ABRIL (2 QUINZENA)',     amount: 40000,  date: '2026-05-07' },
        ].map((t, idx) => ({
          id: `img-${idx}`,
          ...t,
          type: 'receita' as const,
          category: 'Recebimento de Obra',
          entity: 'PJ' as const,
          status: 'Recebido' as const,
          obraId: '1',
        }));
        return { transactions: [...state.transactions, ...imageTransactions] };
      }),
    }),
    {
      name: 'lzy-erp-storage',
      version: 3,
      migrate: (persistedState: any, version: number) => {
        let state = persistedState ?? {};

        // v0/v1 → v2: obras não tinham stages
        if (version < 2) {
          const obras = (state.obras ?? []).map((o: any) => {
            if (o.stages && o.stages.length > 0) return o;
            const stages = generateStages(o.startDate, o.endDate);
            return { ...o, stages, progress: o.progress ?? 0 };
          });
          state = { ...state, obras };
        }

        // v2 → v3: employees ganharam dailyRate, paymentType e timePunches
        if (version < 3) {
          const employees = (state.employees ?? []).map((e: any) => ({
            dailyRate: 0,
            paymentType: 'diaria',
            timePunches: [],
            ...e,
          }));
          state = { ...state, employees };
        }

        return state;
      },
    }
  )
);



