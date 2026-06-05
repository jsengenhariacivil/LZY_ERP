import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── HELPER ──────────────────────────────────────────────────────────────────
const generateId = () => Math.random().toString(36).substring(2, 9);



// ─── ETAPAS PADRÃO ───────────────────────────────────────────────────────────
export type SubStage = {
  id: string;
  name: string;
  progress: number;
  weight?: number;
};

export type Stage = {
  id: string;
  name: string;
  weight: number;   // % financeiro da etapa sobre o total da obra
  progress: number; // % de execução física desta etapa (0-100)
  startDate: string;
  endDate: string;
  value?: number;   // Valor em Reais (opcional para as originais, obrigatório para aditivos)
  subStages?: SubStage[];
};

const sub = (name: string, absW: number, parentW: number) => ({ id: generateId(), name, progress: 0, weight: Number(((absW / parentW) * 100).toFixed(2)) });

const DEFAULT_STAGES: Omit<Stage, 'id' | 'startDate' | 'endDate'>[] = [
  { name: "Projetos e Licen\u00e7as", weight: 4.0, progress: 0, subStages: [
    sub("Levantamento Topogr\u00e1fico", 0.5, 4.0),
    sub("Sondagem do Solo (SPT)", 0.5, 4.0),
    sub("Projeto Arquitet\u00f4nico Executivo", 1.0, 4.0),
    sub("Projeto Estrutural (Madeira e Concreto)", 1.0, 4.0),
    sub("Projetos de Instala\u00e7\u00f5es (Hidro/El\u00e9trica/G\u00e1s)", 0.5, 4.0),
    sub("Alvar\u00e1 de Constru\u00e7\u00e3o e Taxas", 0.5, 4.0),
  ]},
  { name: "Servi\u00e7os Preliminares", weight: 3.0, progress: 0, subStages: [
    sub("Limpeza e Desmatamento do Terreno", 0.5, 3.0),
    sub("Montagem de Canteiro e Dep\u00f3sito", 0.5, 3.0),
    sub("Instala\u00e7\u00e3o Provis\u00f3ria de \u00c1gua e Energia", 0.5, 3.0),
    sub("Fechamento com Tapumes", 0.5, 3.0),
    sub("Loca\u00e7\u00e3o da Obra com Gabarito", 1.0, 3.0),
  ]},
  { name: "Funda\u00e7\u00e3o e Estruturas Enterradas", weight: 14.0, progress: 0, subStages: [
    sub("Escava\u00e7\u00e3o de Sapatas e Vigas Baldrame", 2.0, 14.0),
    sub("Arma\u00e7\u00e3o e Formas para Funda\u00e7\u00e3o", 2.0, 14.0),
    sub("Concretagem de Sapatas e Baldrames", 2.0, 14.0),
    sub("Impermeabiliza\u00e7\u00e3o de Baldrames", 1.0, 14.0),
    sub("Escava\u00e7\u00e3o e Estrutura da Caixa D'\u00e1gua Enterrada", 2.0, 14.0),
    sub("Impermeabiliza\u00e7\u00e3o da Caixa D'\u00e1gua", 1.0, 14.0),
    sub("Escava\u00e7\u00e3o e Estrutura Bruta da Piscina", 2.0, 14.0),
    sub("Constru\u00e7\u00e3o da Casa de M\u00e1quinas", 2.0, 14.0),
  ]},
  { name: "Estrutura de Madeira", weight: 18.0, progress: 0, subStages: [
    sub("Recebimento e Confer\u00eancia da Madeira", 2.0, 18.0),
    sub("Tratamento de Preserva\u00e7\u00e3o da Madeira", 3.0, 18.0),
    sub("Montagem de Pilares de Madeira", 5.0, 18.0),
    sub("Montagem de Vigas de Madeira", 5.0, 18.0),
    sub("Instala\u00e7\u00e3o de Conectores e Ferragens", 3.0, 18.0),
  ]},
  { name: "Fechamentos e Alvenaria Mista", weight: 15.0, progress: 0, subStages: [
    sub("Alvenaria de Veda\u00e7\u00e3o (Cozinha/Banheiros)", 3.0, 15.0),
    sub("Instala\u00e7\u00e3o de Estrutura de Fixa\u00e7\u00e3o das T\u00e1buas", 3.0, 15.0),
    sub("Montagem de T\u00e1buas de Madeira Externas", 4.0, 15.0),
    sub("Montagem de T\u00e1buas de Madeira Internas", 3.0, 15.0),
    sub("Isolamento T\u00e9rmico/Ac\u00fastico entre Paredes", 2.0, 15.0),
  ]},
  { name: "Cobertura e Pergolados", weight: 10.0, progress: 0, subStages: [
    sub("Estrutura do Telhado (Madeira)", 3.0, 10.0),
    sub("Instala\u00e7\u00e3o de Telhas", 3.0, 10.0),
    sub("Instala\u00e7\u00e3o de Calhas e Rufos", 1.0, 10.0),
    sub("Execu\u00e7\u00e3o de Pergolados de Madeira", 2.0, 10.0),
    sub("Impermeabiliza\u00e7\u00e3o de \u00c1reas de Cobertura Plana", 1.0, 10.0),
  ]},
  { name: "Instala\u00e7\u00f5es Hidr\u00e1ulicas e G\u00e1s", weight: 11.0, progress: 0, subStages: [
    sub("Tubula\u00e7\u00e3o de \u00c1gua Fria e Quente", 3.0, 11.0),
    sub("Instala\u00e7\u00e3o do Sistema de Pressuriza\u00e7\u00e3o", 2.0, 11.0),
    sub("Instala\u00e7\u00e3o do Aquecedor a G\u00e1s", 1.5, 11.0),
    sub("Rede de Esgoto Interna", 1.5, 11.0),
    sub("Instala\u00e7\u00e3o de Biodigestor", 1.5, 11.0),
    sub("Constru\u00e7\u00e3o de Sumidouro e Valas", 1.5, 11.0),
  ]},
  { name: "El\u00e9trica e Gerador", weight: 9.0, progress: 0, subStages: [
    sub("Passagem de Eletrodutos e Caixas", 3.0, 9.0),
    sub("Passagem de Fia\u00e7\u00e3o e Cabos", 2.0, 9.0),
    sub("Montagem do Quadro de Distribui\u00e7\u00e3o", 1.5, 9.0),
    sub("Instala\u00e7\u00e3o e Conex\u00e3o do Gerador", 2.5, 9.0),
  ]},
  { name: "\u00c1reas de Lazer e Externas", weight: 10.0, progress: 0, subStages: [
    sub("Revestimento Interno da Piscina", 2.5, 10.0),
    sub("Instala\u00e7\u00e3o de Bombas e Filtros", 1.5, 10.0),
    sub("Execu\u00e7\u00e3o de Deck de Madeira", 3.0, 10.0),
    sub("Constru\u00e7\u00e3o da Garagem", 2.0, 10.0),
    sub("Cal\u00e7adas e Acessos Externos", 1.0, 10.0),
  ]},
  { name: "Acabamentos e Entrega", weight: 6.0, progress: 0, subStages: [
    sub("Revestimentos Cer\u00e2micos (Paredes Molhadas)", 2.0, 6.0),
    sub("Pintura e Verniz Final em Madeiras", 2.0, 6.0),
    sub("Instala\u00e7\u00e3o de Lou\u00e7as e Metais", 1.0, 6.0),
    sub("Limpeza Fina e Entrega das Chaves", 1.0, 6.0),
  ]},
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
    
    const newSubStages = s.subStages ? s.subStages.map(sub => ({ ...sub, id: generateId() })) : undefined;
    
    return { id: generateId(), ...s, subStages: newSubStages, startDate: stageStart, endDate: stageEnd };
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
  cpf?: string;
  role: string;
  status: 'Ativo' | 'Férias' | 'Desligado';
  contact: string;
  dailyRate: number;           // valor diário ou por hora
  paymentType: 'diaria' | 'quinzenal' | 'mensal' | 'hora';
  timePunches: TimePunch[];    // cartão ponto
};

// ─── STATE INTERFACE ──────────────────────────────────────────────────────────
export type User = {
  id: string;
  name: string;
  username: string;
  password?: string; // Optional because we don't send it around everywhere, but used for login
  role: 'admin' | 'user';
};

interface AppState {
  currentUser: User | null;
  users: User[];
  obras: Obra[];
  transactions: Transaction[];
  inventory: InventoryItem[];
  employees: Employee[];
  isDarkMode: boolean;

  login: (username: string, password?: string) => boolean;
  logout: () => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;

  addObra: (obra: Omit<Obra, 'id' | 'progress' | 'stages'>) => void;
  updateObra: (id: string, obra: Partial<Obra>) => void;
  deleteObra: (id: string) => void;
  updateStage: (obraId: string, stageId: string, data: Partial<Stage>) => void;
  addExtraService: (obraId: string, service: { name: string; value: number; startDate: string; endDate: string }) => void;
  addSubStage: (obraId: string, stageId: string, name: string, weight?: number) => void;
  updateSubStage: (obraId: string, stageId: string, subStageId: string, data: Partial<SubStage>) => void;
  deleteSubStage: (obraId: string, stageId: string, subStageId: string) => void;

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
  autoFillWeek: (startDate: string, endDate: string) => void;
  addAdvance: (employeeId: string, amount: number, date: string, note: string) => void;
}

// ─── SEED: Obra Outeiro com etapas reais ─────────────────────────────────────
const outeirosStages: Stage[] = [
  { id: 's1', name: "Projetos e Licen\u00e7as", weight: 4.0, progress: 100, startDate: '2025-04-01', endDate: '2025-04-15', subStages: [
    { id: generateId(), name: "Levantamento Topogr\u00e1fico", progress: 100, weight: Number(((0.5 / 4.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Sondagem do Solo (SPT)", progress: 100, weight: Number(((0.5 / 4.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Projeto Arquitet\u00f4nico Executivo", progress: 100, weight: Number(((1.0 / 4.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Projeto Estrutural (Madeira e Concreto)", progress: 100, weight: Number(((1.0 / 4.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Projetos de Instala\u00e7\u00f5es (Hidro/El\u00e9trica/G\u00e1s)", progress: 100, weight: Number(((0.5 / 4.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Alvar\u00e1 de Constru\u00e7\u00e3o e Taxas", progress: 100, weight: Number(((0.5 / 4.0) * 100).toFixed(2)) },
  ]},
  { id: 's2', name: "Servi\u00e7os Preliminares", weight: 3.0, progress: 100, startDate: '2025-04-15', endDate: '2025-04-30', subStages: [
    { id: generateId(), name: "Limpeza e Desmatamento do Terreno", progress: 100, weight: Number(((0.5 / 3.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Montagem de Canteiro e Dep\u00f3sito", progress: 100, weight: Number(((0.5 / 3.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Instala\u00e7\u00e3o Provis\u00f3ria de \u00c1gua e Energia", progress: 100, weight: Number(((0.5 / 3.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Fechamento com Tapumes", progress: 100, weight: Number(((0.5 / 3.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Loca\u00e7\u00e3o da Obra com Gabarito", progress: 100, weight: Number(((1.0 / 3.0) * 100).toFixed(2)) },
  ]},
  { id: 's3', name: "Funda\u00e7\u00e3o e Estruturas Enterradas", weight: 14.0, progress: 100, startDate: '2025-04-30', endDate: '2025-06-30', subStages: [
    { id: generateId(), name: "Escava\u00e7\u00e3o de Sapatas e Vigas Baldrame", progress: 100, weight: Number(((2.0 / 14.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Arma\u00e7\u00e3o e Formas para Funda\u00e7\u00e3o", progress: 100, weight: Number(((2.0 / 14.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Concretagem de Sapatas e Baldrames", progress: 100, weight: Number(((2.0 / 14.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Impermeabiliza\u00e7\u00e3o de Baldrames", progress: 100, weight: Number(((1.0 / 14.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Escava\u00e7\u00e3o e Estrutura da Caixa D'\u00e1gua Enterrada", progress: 100, weight: Number(((2.0 / 14.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Impermeabiliza\u00e7\u00e3o da Caixa D'\u00e1gua", progress: 100, weight: Number(((1.0 / 14.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Escava\u00e7\u00e3o e Estrutura Bruta da Piscina", progress: 100, weight: Number(((2.0 / 14.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Constru\u00e7\u00e3o da Casa de M\u00e1quinas", progress: 100, weight: Number(((2.0 / 14.0) * 100).toFixed(2)) },
  ]},
  { id: 's4', name: "Estrutura de Madeira", weight: 18.0, progress: 100, startDate: '2025-06-30', endDate: '2025-10-15', subStages: [
    { id: generateId(), name: "Recebimento e Confer\u00eancia da Madeira", progress: 100, weight: Number(((2.0 / 18.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Tratamento de Preserva\u00e7\u00e3o da Madeira", progress: 100, weight: Number(((3.0 / 18.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Montagem de Pilares de Madeira", progress: 100, weight: Number(((5.0 / 18.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Montagem de Vigas de Madeira", progress: 100, weight: Number(((5.0 / 18.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Instala\u00e7\u00e3o de Conectores e Ferragens", progress: 100, weight: Number(((3.0 / 18.0) * 100).toFixed(2)) },
  ]},
  { id: 's5', name: "Fechamentos e Alvenaria Mista", weight: 15.0, progress: 80, startDate: '2025-10-15', endDate: '2025-12-15', subStages: [
    { id: generateId(), name: "Alvenaria de Veda\u00e7\u00e3o (Cozinha/Banheiros)", progress: 80, weight: Number(((3.0 / 15.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Instala\u00e7\u00e3o de Estrutura de Fixa\u00e7\u00e3o das T\u00e1buas", progress: 80, weight: Number(((3.0 / 15.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Montagem de T\u00e1buas de Madeira Externas", progress: 80, weight: Number(((4.0 / 15.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Montagem de T\u00e1buas de Madeira Internas", progress: 80, weight: Number(((3.0 / 15.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Isolamento T\u00e9rmico/Ac\u00fastico entre Paredes", progress: 80, weight: Number(((2.0 / 15.0) * 100).toFixed(2)) },
  ]},
  { id: 's6', name: "Cobertura e Pergolados", weight: 10.0, progress: 60, startDate: '2025-12-15', endDate: '2026-01-15', subStages: [
    { id: generateId(), name: "Estrutura do Telhado (Madeira)", progress: 60, weight: Number(((3.0 / 10.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Instala\u00e7\u00e3o de Telhas", progress: 60, weight: Number(((3.0 / 10.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Instala\u00e7\u00e3o de Calhas e Rufos", progress: 60, weight: Number(((1.0 / 10.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Execu\u00e7\u00e3o de Pergolados de Madeira", progress: 60, weight: Number(((2.0 / 10.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Impermeabiliza\u00e7\u00e3o de \u00c1reas de Cobertura Plana", progress: 60, weight: Number(((1.0 / 10.0) * 100).toFixed(2)) },
  ]},
  { id: 's7', name: "Instala\u00e7\u00f5es Hidr\u00e1ulicas e G\u00e1s", weight: 11.0, progress: 20, startDate: '2026-01-15', endDate: '2026-03-15', subStages: [
    { id: generateId(), name: "Tubula\u00e7\u00e3o de \u00c1gua Fria e Quente", progress: 20, weight: Number(((3.0 / 11.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Instala\u00e7\u00e3o do Sistema de Pressuriza\u00e7\u00e3o", progress: 20, weight: Number(((2.0 / 11.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Instala\u00e7\u00e3o do Aquecedor a G\u00e1s", progress: 20, weight: Number(((1.5 / 11.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Rede de Esgoto Interna", progress: 20, weight: Number(((1.5 / 11.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Instala\u00e7\u00e3o de Biodigestor", progress: 20, weight: Number(((1.5 / 11.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Constru\u00e7\u00e3o de Sumidouro e Valas", progress: 20, weight: Number(((1.5 / 11.0) * 100).toFixed(2)) },
  ]},
  { id: 's8', name: "El\u00e9trica e Gerador", weight: 9.0, progress: 10, startDate: '2026-03-15', endDate: '2026-05-15', subStages: [
    { id: generateId(), name: "Passagem de Eletrodutos e Caixas", progress: 10, weight: Number(((3.0 / 9.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Passagem de Fia\u00e7\u00e3o e Cabos", progress: 10, weight: Number(((2.0 / 9.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Montagem do Quadro de Distribui\u00e7\u00e3o", progress: 10, weight: Number(((1.5 / 9.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Instala\u00e7\u00e3o e Conex\u00e3o do Gerador", progress: 10, weight: Number(((2.5 / 9.0) * 100).toFixed(2)) },
  ]},
  { id: 's9', name: "\u00c1reas de Lazer e Externas", weight: 10.0, progress: 0, startDate: '2026-05-15', endDate: '2026-09-15', subStages: [
    { id: generateId(), name: "Revestimento Interno da Piscina", progress: 0, weight: Number(((2.5 / 10.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Instala\u00e7\u00e3o de Bombas e Filtros", progress: 0, weight: Number(((1.5 / 10.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Execu\u00e7\u00e3o de Deck de Madeira", progress: 0, weight: Number(((3.0 / 10.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Constru\u00e7\u00e3o da Garagem", progress: 0, weight: Number(((2.0 / 10.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Cal\u00e7adas e Acessos Externos", progress: 0, weight: Number(((1.0 / 10.0) * 100).toFixed(2)) },
  ]},
  { id: 's10', name: "Acabamentos e Entrega", weight: 6.0, progress: 0, startDate: '2026-09-15', endDate: '2026-10-30', subStages: [
    { id: generateId(), name: "Revestimentos Cer\u00e2micos (Paredes Molhadas)", progress: 0, weight: Number(((2.0 / 6.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Pintura e Verniz Final em Madeiras", progress: 0, weight: Number(((2.0 / 6.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Instala\u00e7\u00e3o de Lou\u00e7as e Metais", progress: 0, weight: Number(((1.0 / 6.0) * 100).toFixed(2)) },
    { id: generateId(), name: "Limpeza Fina e Entrega das Chaves", progress: 0, weight: Number(((1.0 / 6.0) * 100).toFixed(2)) },
  ]},
];



// ─── STORE ────────────────────────────────────────────────────────────────────
export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [
        { id: 'u1', name: 'Administrador', username: 'adm', password: '123', role: 'admin' },
        { id: 'u2', name: 'Engenharia', username: 'engenharia', password: '123', role: 'admin' },
      ],
      obras: [
        {
          id: '1',
          name: 'Casa Outeiro',
          totalValue: 1200000,
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

      addSubStage: (obraId, stageId, name, weight = 0) => set((state) => ({
        obras: state.obras.map(o => {
          if (o.id !== obraId) return o;
          const stages = o.stages.map(s => {
            if (s.id !== stageId) return s;
            const newSub = { id: generateId(), name, progress: 0, weight };
            return { ...s, subStages: [...(s.subStages || []), newSub] };
          });
          return { ...o, stages };
        })
      })),

      updateSubStage: (obraId, stageId, subStageId, data) => set((state) => ({
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
      })),

      deleteSubStage: (obraId, stageId, subStageId) => set((state) => ({
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
      addAdvance: (employeeId, amount, date, note) => set((state) => {
        const emp = state.employees.find(e => e.id === employeeId);
        if (!emp) return state;

        const newPunch = {
          id: generateId(),
          date,
          entry: '00:00',
          exit: '00:00',
          hoursWorked: 0,
          valuePaid: -Math.abs(amount),
          note: note || 'Adiantamento'
        };

        const newTransaction = {
          id: generateId(),
          description: `Adiantamento - ${emp.name} (${note || 'Adiantamento'})`,
          amount: Math.abs(amount),
          type: 'despesa' as const,
          category: 'Serviços',
          date,
          entity: 'PJ' as const,
          status: 'Pago' as const
        };

        return {
          employees: state.employees.map(e =>
            e.id === employeeId
              ? { ...e, timePunches: [...(e.timePunches ?? []), newPunch] }
              : e
          ),
          transactions: [...state.transactions, newTransaction]
        };
      }),

      // ── Theme ────────────────────────────────────────────────────────────
      toggleDarkMode: () => set((state) => {
        const newIsDark = !state.isDarkMode;
        if (newIsDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        return { isDarkMode: newIsDark };
      }),

      // ── Auth & Users ─────────────────────────────────────────────────────────
      login: (username, password) => {
        const { users } = get();
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
          set({ currentUser: user });
          return true;
        }
        return false;
      },
      logout: () => set({ currentUser: null }),
      addUser: (user) => set((state) => ({ users: [...state.users, { ...user, id: generateId() }] })),
      updateUser: (id, user) => set((state) => ({
        users: state.users.map(u => u.id === id ? { ...u, ...user } : u)
      })),
      deleteUser: (id) => set((state) => ({
        users: state.users.filter(u => u.id !== id)
      })),

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

      autoFillWeek: (startDate, endDate) => set((state) => {
        const startMs = new Date(startDate + 'T00:00:00').getTime();
        const endMs = new Date(endDate + 'T00:00:00').getTime();
        
        const daysToFill: string[] = [];
        for (let t = startMs; t <= endMs; t += 86400000) {
          const d = new Date(t);
          if (d.getDay() !== 0 && d.getDay() !== 6) {
            daysToFill.push(d.toISOString().split('T')[0]);
          }
        }

        const newEmployees = state.employees.map(e => {
          if (e.status !== 'Ativo') return e;
          
          let newPunches = [...(e.timePunches || [])];
          for (const date of daysToFill) {
            if (!newPunches.find(p => p.date === date)) {
              newPunches.push({
                id: generateId(),
                date,
                entry: '08:00',
                exit: '17:00',
                hoursWorked: 8,
                valuePaid: e.dailyRate ?? 0,
                note: 'Preenchimento Automático'
              });
            }
          }
          return { ...e, timePunches: newPunches };
        });

        return { employees: newEmployees };
      }),
    }),
    {
      name: 'lzy-erp-storage',
      version: 4,
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
            cpf: '',
            dailyRate: 0,
            paymentType: 'diaria',
            timePunches: [],
            ...e,
          }));
          state = { ...state, employees };
        }

        // v3 → v4: inject default users if missing
        if (version < 4) {
          if (!state.users || state.users.length === 0) {
            state.users = [
              { id: 'u1', name: 'Administrador', username: 'adm', password: '123', role: 'admin' },
              { id: 'u2', name: 'Engenharia', username: 'engenharia', password: '123', role: 'admin' },
            ];
          }
        }

        return state;
      },
    }
  )
);



