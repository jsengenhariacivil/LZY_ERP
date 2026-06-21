export type TemplateStage = {
  name: string;
  weight: number; // Porcentagem do peso total da obra
  subStages: {
    name: string;
    weight: number; // Porcentagem de peso dentro da Etapa
  }[];
};

export const cronogramaTemplates: Record<string, TemplateStage[]> = {
  'Alvenaria': [
    {
      name: 'Serviços Preliminares',
      weight: 5,
      subStages: [
        { name: 'Limpeza do terreno', weight: 30 },
        { name: 'Locação da obra', weight: 40 },
        { name: 'Instalações provisórias', weight: 30 }
      ]
    },
    {
      name: 'Infraestrutura (Fundação)',
      weight: 10,
      subStages: [
        { name: 'Escavação', weight: 20 },
        { name: 'Baldrame e Blocos', weight: 60 },
        { name: 'Impermeabilização', weight: 20 }
      ]
    },
    {
      name: 'Superestrutura',
      weight: 20,
      subStages: [
        { name: 'Pilares', weight: 40 },
        { name: 'Vigas', weight: 30 },
        { name: 'Laje', weight: 30 }
      ]
    },
    {
      name: 'Alvenaria e Vedação',
      weight: 15,
      subStages: [
        { name: 'Elevação de Paredes', weight: 80 },
        { name: 'Chapisco', weight: 20 }
      ]
    },
    {
      name: 'Cobertura',
      weight: 10,
      subStages: [
        { name: 'Estrutura do Telhado', weight: 50 },
        { name: 'Telhamento', weight: 40 },
        { name: 'Calhas e Rufos', weight: 10 }
      ]
    },
    {
      name: 'Instalações',
      weight: 15,
      subStages: [
        { name: 'Elétrica', weight: 40 },
        { name: 'Hidráulica', weight: 40 },
        { name: 'Esgoto e Gás', weight: 20 }
      ]
    },
    {
      name: 'Acabamentos',
      weight: 20,
      subStages: [
        { name: 'Reboco / Gesso', weight: 30 },
        { name: 'Pisos e Revestimentos', weight: 40 },
        { name: 'Esquadrias e Vidros', weight: 15 },
        { name: 'Pintura', weight: 15 }
      ]
    },
    {
      name: 'Serviços Finais',
      weight: 5,
      subStages: [
        { name: 'Louças e Metais', weight: 50 },
        { name: 'Limpeza Fina', weight: 30 },
        { name: 'Entrega', weight: 20 }
      ]
    }
  ],

  'Light Steel Frame': [
    {
      name: 'Serviços Preliminares',
      weight: 5,
      subStages: [
        { name: 'Limpeza e Locação', weight: 50 },
        { name: 'Instalações Provisórias', weight: 50 }
      ]
    },
    {
      name: 'Fundação (Radier)',
      weight: 10,
      subStages: [
        { name: 'Preparo da Base', weight: 30 },
        { name: 'Armação e Tubulações', weight: 40 },
        { name: 'Concretagem', weight: 30 }
      ]
    },
    {
      name: 'Montagem da Estrutura',
      weight: 25,
      subStages: [
        { name: 'Paredes (Painéis)', weight: 50 },
        { name: 'Entrepiso / Laje', weight: 25 },
        { name: 'Estrutura de Cobertura', weight: 25 }
      ]
    },
    {
      name: 'Fechamento Externo',
      weight: 15,
      subStages: [
        { name: 'Placas OSB', weight: 40 },
        { name: 'Membrana Hidrófuga', weight: 20 },
        { name: 'Revestimento Siding / Placa Cimentícia', weight: 40 }
      ]
    },
    {
      name: 'Cobertura',
      weight: 5,
      subStages: [
        { name: 'Telhas', weight: 70 },
        { name: 'Calhas e Rufos', weight: 30 }
      ]
    },
    {
      name: 'Instalações e Isolamento',
      weight: 15,
      subStages: [
        { name: 'Elétrica e Hidráulica (Passagem)', weight: 60 },
        { name: 'Isolamento Termoacústico', weight: 40 }
      ]
    },
    {
      name: 'Fechamento Interno e Acabamento',
      weight: 20,
      subStages: [
        { name: 'Placas de Drywall', weight: 40 },
        { name: 'Tratamento de Juntas', weight: 20 },
        { name: 'Pintura', weight: 20 },
        { name: 'Pisos e Esquadrias', weight: 20 }
      ]
    },
    {
      name: 'Serviços Finais',
      weight: 5,
      subStages: [
        { name: 'Louças e Metais', weight: 50 },
        { name: 'Limpeza', weight: 50 }
      ]
    }
  ],

  'Madeira': [
    {
      name: 'Serviços Preliminares',
      weight: 5,
      subStages: [
        { name: 'Limpeza e Locação', weight: 100 }
      ]
    },
    {
      name: 'Fundação',
      weight: 10,
      subStages: [
        { name: 'Sapatas / Estacas', weight: 100 }
      ]
    },
    {
      name: 'Estrutura de Madeira',
      weight: 40,
      subStages: [
        { name: 'Pilares e Vigas', weight: 50 },
        { name: 'Paredes', weight: 30 },
        { name: 'Estrutura do Telhado', weight: 20 }
      ]
    },
    {
      name: 'Instalações',
      weight: 15,
      subStages: [
        { name: 'Elétrica e Hidráulica', weight: 100 }
      ]
    },
    {
      name: 'Cobertura',
      weight: 10,
      subStages: [
        { name: 'Telhamento', weight: 100 }
      ]
    },
    {
      name: 'Acabamentos e Proteção',
      weight: 15,
      subStages: [
        { name: 'Tratamento da Madeira (Verniz/Stain)', weight: 40 },
        { name: 'Pisos', weight: 30 },
        { name: 'Esquadrias', weight: 30 }
      ]
    },
    {
      name: 'Serviços Finais',
      weight: 5,
      subStages: [
        { name: 'Limpeza e Entrega', weight: 100 }
      ]
    }
  ],

  'Pré-moldado': [
    {
      name: 'Serviços Preliminares',
      weight: 5,
      subStages: [{ name: 'Limpeza e Locação', weight: 100 }]
    },
    {
      name: 'Fundação (Cálices)',
      weight: 15,
      subStages: [{ name: 'Escavação e Concretagem', weight: 100 }]
    },
    {
      name: 'Montagem de Estrutura Pré-Moldada',
      weight: 40,
      subStages: [
        { name: 'Pilares', weight: 30 },
        { name: 'Vigas', weight: 30 },
        { name: 'Lajes Alveolares', weight: 40 }
      ]
    },
    {
      name: 'Fechamento e Cobertura',
      weight: 15,
      subStages: [
        { name: 'Painéis de Fechamento', weight: 50 },
        { name: 'Cobertura Metálica/Telhas', weight: 50 }
      ]
    },
    {
      name: 'Instalações e Acabamentos',
      weight: 20,
      subStages: [
        { name: 'Instalações Gerais', weight: 50 },
        { name: 'Piso Industrial / Acabamentos', weight: 50 }
      ]
    },
    {
      name: 'Serviços Finais',
      weight: 5,
      subStages: [{ name: 'Limpeza e Entrega', weight: 100 }]
    }
  ]
};
