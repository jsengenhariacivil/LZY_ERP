export type CsvRow = {
  Etapa: string;
  Subetapa: string;
  Peso: number;
  DataInicio: string;
  DataFim: string;
};

export function downloadCsvTemplate() {
  const headers = ['Etapa', 'Subetapa', 'Peso %', 'Data Início (YYYY-MM-DD)', 'Data Fim (YYYY-MM-DD)'];
  const rows = [
    ['Serviços Preliminares', '', '5', '2026-06-20', '2026-06-25'],
    ['Serviços Preliminares', 'Limpeza', '40', '', ''],
    ['Serviços Preliminares', 'Instalações Provisórias', '60', '', ''],
    ['Fundação', '', '10', '2026-06-26', '2026-07-10'],
    ['Fundação', 'Escavação', '50', '', ''],
    ['Fundação', 'Concretagem', '50', '', ''],
  ];

  const csvContent = [
    headers.join(';'),
    ...rows.map(r => r.join(';'))
  ].join('\n');

  // Adicionando BOM (\uFEFF) para garantir que o Excel reconheça acentos (UTF-8)
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'modelo_cronograma.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function parseCsvContent(csvText: string): CsvRow[] {
  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length <= 1) return [];

  // Pula o cabeçalho
  const dataLines = lines.slice(1);
  const parsed: CsvRow[] = [];

  for (const line of dataLines) {
    // Para ser flexível, verificamos se tem ponto e vírgula, se não tiver, assumimos vírgula
    const separator = line.includes(';') ? ';' : ',';
    const cols = line.split(separator).map(c => c.trim());
    if (cols.length >= 3) {
      parsed.push({
        Etapa: cols[0] || '',
        Subetapa: cols[1] || '',
        Peso: parseFloat(cols[2].replace(',', '.')) || 0, // Aceita vírgula no peso decimal
        DataInicio: cols[3] || '',
        DataFim: cols[4] || ''
      });
    }
  }

  return parsed;
}
