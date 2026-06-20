import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// ─── HELPER ──────────────────────────────────────────────────────────────────

// ─── TYPES ───────────────────────────────────────────────────────────────────
export type SubStage = {
  id: string;
  name: string;
  progress: number;
  weight?: number;
};

export type Stage = {
  id: string;
  name: string;
  weight: number;
  progress: number;
  startDate: string;
  endDate: string;
  value?: number;
  subStages?: SubStage[];
};

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
  obraId?: string;
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
  date: string;
  entry: string;
  exit: string;
  hoursWorked: number;
  valuePaid: number;
  note?: string;
};

export type Employee = {
  id: string;
  name: string;
  cpf?: string;
  role: string;
  status: 'Ativo' | 'Férias' | 'Desligado';
  contact: string;
  dailyRate: number;
  paymentType: 'diaria' | 'quinzenal' | 'mensal' | 'hora';
  timePunches: TimePunch[];
};

export type User = {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: 'admin' | 'user';
};

interface AppState {
  isInitialized: boolean;
  currentUser: User | null;
  users: User[];
  obras: Obra[];
  transactions: Transaction[];
  inventory: InventoryItem[];
  employees: Employee[];
  isDarkMode: boolean;

  initSupabase: () => Promise<void>;
  login: (username: string, password?: string) => boolean;
  logout: () => void;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  addObra: (obra: Omit<Obra, 'id' | 'progress' | 'stages'>) => Promise<void>;
  updateObra: (id: string, obra: Partial<Obra>) => Promise<void>;
  deleteObra: (id: string) => Promise<void>;
  updateStage: (obraId: string, stageId: string, data: Partial<Stage>) => Promise<void>;
  addExtraService: (obraId: string, service: { name: string; value: number; startDate: string; endDate: string }) => Promise<void>;
  addSubStage: (obraId: string, stageId: string, name: string, weight?: number) => Promise<void>;
  updateSubStage: (obraId: string, stageId: string, subStageId: string, data: Partial<SubStage>) => Promise<void>;
  deleteSubStage: (obraId: string, stageId: string, subStageId: string) => Promise<void>;

  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  addInventoryMovement: (itemId: string, movement: Omit<InventoryMovement, 'id'>) => Promise<void>;

  addEmployee: (employee: Omit<Employee, 'id' | 'timePunches'>) => Promise<void>;
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  addTimePunch: (employeeId: string, punch: Omit<TimePunch, 'id'>) => Promise<void>;
  updateTimePunch: (employeeId: string, punchId: string, data: Partial<TimePunch>) => Promise<void>;
  deleteTimePunch: (employeeId: string, punchId: string) => Promise<void>;

  toggleDarkMode: () => void;
  seedImageTransactions: () => void;
  autoFillWeek: (startDate: string, endDate: string) => Promise<void>;
  addAdvance: (employeeId: string, amount: number, date: string, note: string) => Promise<void>;
}

export function calcProgress(stages: Stage[]): number {
  if (!stages || stages.length === 0) return 0;
  const totalWeight = stages.reduce((a, s) => a + s.weight, 0);
  const weighted = stages.reduce((a, s) => a + s.progress * (s.weight / totalWeight), 0);
  return Math.round(weighted);
}

// ─── STORE ────────────────────────────────────────────────────────────────────
export const useStore = create<AppState>()((set, get) => ({
  isInitialized: false,
  currentUser: null,
  users: [],
  obras: [],
  transactions: [],
  inventory: [],
  employees: [],
  isDarkMode: false,

  initSupabase: async () => {
    // Busca dados de todas as tabelas
    const [
      { data: dUsers },
      { data: dObras },
      { data: dStages },
      { data: dSubStages },
      { data: dTransactions },
      { data: dItems },
      { data: dMovements },
      { data: dEmployees },
      { data: dPunches }
    ] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('obras').select('*'),
      supabase.from('stages').select('*'),
      supabase.from('sub_stages').select('*'),
      supabase.from('transactions').select('*'),
      supabase.from('inventory_items').select('*'),
      supabase.from('inventory_movements').select('*'),
      supabase.from('employees').select('*'),
      supabase.from('time_punches').select('*')
    ]);

    // Mapeamento Usuarios
    const users: User[] = (dUsers || []).map(u => ({
      id: u.id, name: u.name, username: u.username, password: u.password, role: u.role
    }));

    // Mapeamento Obras -> Stages -> SubStages
    const obras: Obra[] = (dObras || []).map(o => {
      const stagesForObra = (dStages || []).filter(s => s.obra_id === o.id).map(s => {
        const subsForStage = (dSubStages || []).filter(sub => sub.stage_id === s.id).map(sub => ({
          id: sub.id, name: sub.name, progress: Number(sub.progress), weight: Number(sub.weight)
        }));
        return {
          id: s.id, name: s.name, weight: Number(s.weight), progress: Number(s.progress), 
          startDate: s.start_date, endDate: s.end_date, value: s.value ? Number(s.value) : undefined,
          subStages: subsForStage
        };
      });
      return {
        id: o.id, name: o.name, status: o.status, progress: Number(o.progress), budget: Number(o.budget),
        startDate: o.start_date, endDate: o.end_date, stages: stagesForObra
      };
    });

    // Mapeamento Transactions
    const transactions: Transaction[] = (dTransactions || []).map(t => ({
      id: t.id, description: t.description, amount: Number(t.amount), type: t.type, category: t.category,
      date: t.date, entity: t.entity, status: t.status, obraId: t.obra_id || undefined
    }));

    // Mapeamento Inventory
    const inventory: InventoryItem[] = (dItems || []).map(i => {
      const movs = (dMovements || []).filter(m => m.item_id === i.id).map(m => ({
        id: m.id, date: m.date, type: m.type, quantity: Number(m.quantity), obraId: m.obra_id || undefined, note: m.note || ''
      }));
      return {
        id: i.id, name: i.name, quantity: Number(i.quantity), minQuantity: Number(i.min_quantity), unit: i.unit, category: i.category,
        movements: movs
      };
    });

    // Mapeamento Employees
    const employees: Employee[] = (dEmployees || []).map(e => {
      const punches = (dPunches || []).filter(p => p.employee_id === e.id).map(p => ({
        id: p.id, date: p.date, entry: p.entry, exit: p.exit, hoursWorked: Number(p.hours_worked), valuePaid: Number(p.value_paid), note: p.note || ''
      }));
      return {
        id: e.id, name: e.name, cpf: e.cpf || '', role: e.role, status: e.status, contact: e.contact || '', 
        dailyRate: Number(e.daily_rate), paymentType: e.payment_type, timePunches: punches
      };
    });

    set({ isInitialized: true, users, obras, transactions, inventory, employees });
  },

  // USERS
  login: (username, password) => {
    const { users } = get();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) { set({ currentUser: user }); return true; }
    return false;
  },
  logout: () => set({ currentUser: null }),
  addUser: async (user) => {
    const { data } = await supabase.from('users').insert(user).select().single();
    if (data) set((state) => ({ users: [...state.users, { ...data } as User] }));
  },
  updateUser: async (id, user) => {
    await supabase.from('users').update(user).eq('id', id);
    set((state) => ({ users: state.users.map(u => u.id === id ? { ...u, ...user } : u) }));
  },
  deleteUser: async (id) => {
    await supabase.from('users').delete().eq('id', id);
    set((state) => ({ users: state.users.filter(u => u.id !== id) }));
  },

  // OBRAS
  addObra: async (obra) => {
    const dbObra = { name: obra.name, status: obra.status, budget: obra.budget, start_date: obra.startDate, end_date: obra.endDate, progress: 0 };
    const { data } = await supabase.from('obras').insert(dbObra).select().single();
    if (data) {
      const newObra: Obra = { id: data.id, name: data.name, status: data.status as any, progress: 0, budget: Number(data.budget), startDate: data.start_date, endDate: data.end_date, stages: [] };
      set((state) => ({ obras: [...state.obras, newObra] }));
    }
  },
  updateObra: async (id, updated) => {
    const toUpdate: any = {};
    if (updated.name) toUpdate.name = updated.name;
    if (updated.status) toUpdate.status = updated.status;
    if (updated.budget !== undefined) toUpdate.budget = updated.budget;
    if (updated.startDate) toUpdate.start_date = updated.startDate;
    if (updated.endDate) toUpdate.end_date = updated.endDate;
    if (updated.progress !== undefined) toUpdate.progress = updated.progress;
    
    await supabase.from('obras').update(toUpdate).eq('id', id);
    set((state) => ({ obras: state.obras.map((o) => o.id === id ? { ...o, ...updated } : o) }));
  },
  deleteObra: async (id) => {
    await supabase.from('obras').delete().eq('id', id);
    set((state) => ({ obras: state.obras.filter(o => o.id !== id) }));
  },

  // STAGES
  updateStage: async (obraId, stageId, data) => {
    const toUpdate: any = {};
    if (data.name) toUpdate.name = data.name;
    if (data.progress !== undefined) toUpdate.progress = data.progress;
    if (data.startDate) toUpdate.start_date = data.startDate;
    if (data.endDate) toUpdate.end_date = data.endDate;
    if (data.value !== undefined) toUpdate.value = data.value;

    await supabase.from('stages').update(toUpdate).eq('id', stageId);
    set((state) => ({
      obras: state.obras.map(o => {
        if (o.id !== obraId) return o;
        const stages = o.stages.map(s => s.id === stageId ? { ...s, ...data } : s);
        return { ...o, stages, progress: calcProgress(stages) };
      })
    }));
  },
  addExtraService: async (obraId, service) => {
    const obra = get().obras.find(o => o.id === obraId);
    if (!obra) return;
    const weight = obra.budget > 0 ? (service.value / obra.budget) * 100 : 10;
    const dbStage = { obra_id: obraId, name: service.name, weight, progress: 0, start_date: service.startDate, end_date: service.endDate, value: service.value };
    const { data } = await supabase.from('stages').insert(dbStage).select().single();
    if (data) {
      const newStage: Stage = { id: data.id, name: data.name, weight: Number(data.weight), progress: 0, startDate: data.start_date, endDate: data.end_date, value: Number(data.value) };
      set((state) => ({
        obras: state.obras.map(o => {
          if (o.id !== obraId) return o;
          const newStages = [...o.stages, newStage];
          return { ...o, budget: o.budget + service.value, stages: newStages, progress: calcProgress(newStages) };
        })
      }));
    }
  },
  addSubStage: async (obraId, stageId, name, weight = 0) => {
    const { data } = await supabase.from('sub_stages').insert({ stage_id: stageId, name, weight, progress: 0 }).select().single();
    if (data) {
      set((state) => ({
        obras: state.obras.map(o => {
          if (o.id !== obraId) return o;
          const stages = o.stages.map(s => {
            if (s.id !== stageId) return s;
            const newSub = { id: data.id, name: data.name, progress: 0, weight: Number(data.weight) };
            return { ...s, subStages: [...(s.subStages || []), newSub] };
          });
          return { ...o, stages };
        })
      }));
    }
  },
  updateSubStage: async (obraId, stageId, subStageId, data) => {
    await supabase.from('sub_stages').update(data).eq('id', subStageId);
    set((state) => ({
      obras: state.obras.map(o => {
        if (o.id !== obraId) return o;
        const stages = o.stages.map(s => {
          if (s.id !== stageId) return s;
          const subStages = (s.subStages || []).map(sub => sub.id === subStageId ? { ...sub, ...data } : sub);
          const totalWeight = subStages.reduce((acc, sub) => acc + (sub.weight || 0), 0);
          const newProgress = subStages.length > 0 
            ? (totalWeight > 0 
                ? Math.round(subStages.reduce((acc, sub) => acc + sub.progress * ((sub.weight || 0) / totalWeight), 0))
                : Math.round(subStages.reduce((acc, sub) => acc + sub.progress, 0) / subStages.length))
            : s.progress;
          return { ...s, subStages, progress: newProgress };
        });
        return { ...o, stages, progress: calcProgress(stages) };
      })
    }));
  },
  deleteSubStage: async (obraId, stageId, subStageId) => {
    await supabase.from('sub_stages').delete().eq('id', subStageId);
    set((state) => ({
      obras: state.obras.map(o => {
        if (o.id !== obraId) return o;
        const stages = o.stages.map(s => {
          if (s.id !== stageId) return s;
          const subStages = (s.subStages || []).filter(sub => sub.id !== subStageId);
          const totalWeight = subStages.reduce((acc, sub) => acc + (sub.weight || 0), 0);
          const newProgress = subStages.length > 0 
            ? (totalWeight > 0 
                ? Math.round(subStages.reduce((acc, sub) => acc + sub.progress * ((sub.weight || 0) / totalWeight), 0))
                : Math.round(subStages.reduce((acc, sub) => acc + sub.progress, 0) / subStages.length))
            : s.progress;
          return { ...s, subStages, progress: newProgress };
        });
        return { ...o, stages, progress: calcProgress(stages) };
      })
    }));
  },

  // TRANSACTIONS
  addTransaction: async (transaction) => {
    const dbTrans = { description: transaction.description, amount: transaction.amount, type: transaction.type, category: transaction.category, date: transaction.date, entity: transaction.entity, status: transaction.status, obra_id: transaction.obraId };
    const { data } = await supabase.from('transactions').insert(dbTrans).select().single();
    if (data) {
      const newTrans: Transaction = { ...transaction, id: data.id };
      let additions = [newTrans];
      // Auto pro-labore deduction
      if (newTrans.type === 'despesa' && newTrans.entity === 'PJ' && ['Pró-labore', 'Retirada'].includes(newTrans.category)) {
        const dbRec = { description: `Recebimento: ${newTrans.description}`, amount: newTrans.amount, type: 'receita', category: 'Salário/Lucro', date: newTrans.date, entity: 'Pessoal', status: newTrans.status === 'Pago' ? 'Recebido' : 'Pendente' };
        const { data: d2 } = await supabase.from('transactions').insert(dbRec).select().single();
        if (d2) {
          additions.push({ id: d2.id, description: d2.description, amount: Number(d2.amount), type: d2.type as 'receita', category: d2.category, date: d2.date, entity: d2.entity as 'Pessoal', status: d2.status as any });
        }
      }
      set((state) => ({ transactions: [...state.transactions, ...additions] }));
    }
  },
  updateTransaction: async (id, updated) => {
    const toUpdate: any = { ...updated };
    if (updated.obraId !== undefined) { toUpdate.obra_id = updated.obraId; delete toUpdate.obraId; }
    await supabase.from('transactions').update(toUpdate).eq('id', id);
    set((state) => ({ transactions: state.transactions.map((t) => t.id === id ? { ...t, ...updated } : t) }));
  },
  deleteTransaction: async (id) => {
    await supabase.from('transactions').delete().eq('id', id);
    set((state) => ({ transactions: state.transactions.filter(t => t.id !== id) }));
  },

  // INVENTORY
  addInventoryItem: async (item) => {
    const dbItem = { name: item.name, quantity: item.quantity, min_quantity: item.minQuantity, unit: item.unit, category: item.category };
    const { data } = await supabase.from('inventory_items').insert(dbItem).select().single();
    if (data) set((state) => ({ inventory: [...state.inventory, { id: data.id, name: data.name, quantity: Number(data.quantity), minQuantity: Number(data.min_quantity), unit: data.unit, category: data.category, movements: [] }] }));
  },
  updateInventoryItem: async (id, updated) => {
    const toUpdate: any = { ...updated };
    if (updated.minQuantity !== undefined) { toUpdate.min_quantity = updated.minQuantity; delete toUpdate.minQuantity; }
    await supabase.from('inventory_items').update(toUpdate).eq('id', id);
    set((state) => ({ inventory: state.inventory.map((i) => i.id === id ? { ...i, ...updated } : i) }));
  },
  deleteInventoryItem: async (id) => {
    await supabase.from('inventory_items').delete().eq('id', id);
    set((state) => ({ inventory: state.inventory.filter(i => i.id !== id) }));
  },
  addInventoryMovement: async (itemId, movement) => {
    const dbMov = { item_id: itemId, date: movement.date, type: movement.type, quantity: movement.quantity, obra_id: movement.obraId, note: movement.note };
    const { data } = await supabase.from('inventory_movements').insert(dbMov).select().single();
    if (data) {
      const item = get().inventory.find(i => i.id === itemId);
      if (item) {
        const newQuantity = movement.type === 'entrada' ? item.quantity + movement.quantity : item.quantity - movement.quantity;
        await supabase.from('inventory_items').update({ quantity: newQuantity }).eq('id', itemId);
        set((state) => ({
          inventory: state.inventory.map((i) => {
            if (i.id !== itemId) return i;
            const newM = { id: data.id, date: data.date, type: data.type as any, quantity: Number(data.quantity), obraId: data.obra_id || undefined, note: data.note || '' };
            return { ...i, quantity: newQuantity, movements: [...(i.movements || []), newM] };
          })
        }));
      }
    }
  },

  // EMPLOYEES
  addEmployee: async (employee) => {
    const dbEmp = { name: employee.name, cpf: employee.cpf, role: employee.role, status: employee.status, contact: employee.contact, daily_rate: employee.dailyRate, payment_type: employee.paymentType };
    const { data } = await supabase.from('employees').insert(dbEmp).select().single();
    if (data) {
      set((state) => ({ employees: [...state.employees, { id: data.id, name: data.name, cpf: data.cpf || '', role: data.role, status: data.status as any, contact: data.contact || '', dailyRate: Number(data.daily_rate), paymentType: data.payment_type as any, timePunches: [] }] }));
    }
  },
  updateEmployee: async (id, updated) => {
    const toUpdate: any = { ...updated };
    if (updated.dailyRate !== undefined) { toUpdate.daily_rate = updated.dailyRate; delete toUpdate.dailyRate; }
    if (updated.paymentType !== undefined) { toUpdate.payment_type = updated.paymentType; delete toUpdate.paymentType; }
    await supabase.from('employees').update(toUpdate).eq('id', id);
    set((state) => ({ employees: state.employees.map((e) => e.id === id ? { ...e, ...updated } : e) }));
  },
  deleteEmployee: async (id) => {
    await supabase.from('employees').delete().eq('id', id);
    set((state) => ({ employees: state.employees.filter(e => e.id !== id) }));
  },
  addTimePunch: async (employeeId, punch) => {
    const dbPunch = { employee_id: employeeId, date: punch.date, entry: punch.entry, exit: punch.exit, hours_worked: punch.hoursWorked, value_paid: punch.valuePaid, note: punch.note };
    const { data } = await supabase.from('time_punches').insert(dbPunch).select().single();
    if (data) {
      set((state) => ({
        employees: state.employees.map(e => e.id === employeeId ? { ...e, timePunches: [...(e.timePunches || []), { id: data.id, date: data.date, entry: data.entry, exit: data.exit, hoursWorked: Number(data.hours_worked), valuePaid: Number(data.value_paid), note: data.note || '' }] } : e)
      }));
    }
  },
  updateTimePunch: async (employeeId, punchId, data) => {
    const toUpdate: any = { ...data };
    if (data.hoursWorked !== undefined) { toUpdate.hours_worked = data.hoursWorked; delete toUpdate.hoursWorked; }
    if (data.valuePaid !== undefined) { toUpdate.value_paid = data.valuePaid; delete toUpdate.valuePaid; }
    await supabase.from('time_punches').update(toUpdate).eq('id', punchId);
    set((state) => ({
      employees: state.employees.map(e => e.id === employeeId ? { ...e, timePunches: (e.timePunches || []).map(p => p.id === punchId ? { ...p, ...data } : p) } : e)
    }));
  },
  deleteTimePunch: async (employeeId, punchId) => {
    await supabase.from('time_punches').delete().eq('id', punchId);
    set((state) => ({
      employees: state.employees.map(e => e.id === employeeId ? { ...e, timePunches: (e.timePunches || []).filter(p => p.id !== punchId) } : e)
    }));
  },
  addAdvance: async (employeeId, amount, date, note) => {
    const emp = get().employees.find(e => e.id === employeeId);
    if (!emp) return;

    const dbPunch = { employee_id: employeeId, date, entry: '00:00', exit: '00:00', hours_worked: 0, value_paid: -Math.abs(amount), note: note || 'Adiantamento' };
    const { data: pData } = await supabase.from('time_punches').insert(dbPunch).select().single();
    
    const dbTrans = { description: `Adiantamento - ${emp.name} (${note || 'Adiantamento'})`, amount: Math.abs(amount), type: 'despesa', category: 'Serviços', date, entity: 'PJ', status: 'Pago' };
    const { data: tData } = await supabase.from('transactions').insert(dbTrans).select().single();

    if (pData && tData) {
      set((state) => ({
        employees: state.employees.map(e => e.id === employeeId ? { ...e, timePunches: [...(e.timePunches || []), { id: pData.id, date: pData.date, entry: pData.entry, exit: pData.exit, hoursWorked: Number(pData.hours_worked), valuePaid: Number(pData.value_paid), note: pData.note || '' }] } : e),
        transactions: [...state.transactions, { id: tData.id, description: tData.description, amount: Number(tData.amount), type: tData.type as any, category: tData.category, date: tData.date, entity: tData.entity as any, status: tData.status as any }]
      }));
    }
  },

  // THEME
  toggleDarkMode: () => set((state) => {
    const newIsDark = !state.isDarkMode;
    if (newIsDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    return { isDarkMode: newIsDark };
  }),

  // EXTRAS
  seedImageTransactions: () => {},
  autoFillWeek: async (startDate, endDate) => {
    const startMs = new Date(startDate + 'T00:00:00').getTime();
    const endMs = new Date(endDate + 'T00:00:00').getTime();
    const daysToFill: string[] = [];
    for (let t = startMs; t <= endMs; t += 86400000) {
      const d = new Date(t);
      if (d.getDay() !== 0 && d.getDay() !== 6) daysToFill.push(d.toISOString().split('T')[0]);
    }

    const { employees } = get();
    for (const e of employees) {
      if (e.status !== 'Ativo') continue;
      const punches = e.timePunches || [];
      for (const date of daysToFill) {
        if (!punches.find(p => p.date === date)) {
          await get().addTimePunch(e.id, { date, entry: '08:00', exit: '17:00', hoursWorked: 8, valuePaid: e.dailyRate ?? 0, note: 'Preenchimento Automático' });
        }
      }
    }
  }

}));
