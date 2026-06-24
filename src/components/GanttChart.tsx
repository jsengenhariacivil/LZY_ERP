
import { type Obra } from '../store/useStore';

interface GanttChartProps {
  obra: Obra;
}

export default function GanttChart({ obra }: GanttChartProps) {
  const stages = obra.stages || [];
  
  if (stages.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        Nenhuma etapa cadastrada para gerar o gráfico de Gantt.
      </div>
    );
  }

  // Encontra a menor data de início e a maior data de fim
  let minDateStr = stages[0].startDate;
  let maxDateStr = stages[0].endDate;

  stages.forEach(s => {
    if (new Date(s.startDate) < new Date(minDateStr)) minDateStr = s.startDate;
    if (new Date(s.endDate) > new Date(maxDateStr)) maxDateStr = s.endDate;
  });

  const minDate = new Date(minDateStr + 'T00:00:00');
  const maxDate = new Date(maxDateStr + 'T00:00:00');
  
  // Garantir pelo menos 30 dias de intervalo na view
  if (maxDate.getTime() - minDate.getTime() < 30 * 24 * 60 * 60 * 1000) {
    maxDate.setDate(minDate.getDate() + 30);
  }

  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Gerar array de meses/anos para o cabeçalho superior
  const months: { label: string; days: number; startDayIndex: number }[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(minDate);
    d.setDate(d.getDate() + i);
    const mLabel = d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    
    if (months.length === 0 || months[months.length - 1].label !== mLabel) {
      months.push({ label: mLabel, days: 1, startDayIndex: i });
    } else {
      months[months.length - 1].days++;
    }
  }

  return (
    <div className="p-6 overflow-x-auto custom-scrollbar">
      <div className="min-w-[800px] border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900/50">
        
        {/* Cabeçalho de Meses */}
        <div className="flex border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/80">
          <div className="w-64 shrink-0 border-r border-gray-200 dark:border-zinc-800 p-3 font-semibold text-xs text-gray-500 uppercase flex items-center">
            Etapas da Obra
          </div>
          <div className="flex-1 flex relative">
            {months.map((m, i) => (
              <div 
                key={i} 
                className="border-r border-gray-200 dark:border-zinc-800 p-2 text-xs font-semibold text-center text-gray-600 dark:text-gray-400 capitalize whitespace-nowrap"
                style={{ width: `${(m.days / totalDays) * 100}%` }}
              >
                {m.label}
              </div>
            ))}
          </div>
        </div>

        {/* Linhas das Etapas */}
        <div className="divide-y divide-gray-100 dark:divide-zinc-800/50 relative">
          {/* Grid de Fundo (opcional, só visual) */}
          <div className="absolute inset-0 flex ml-64 pointer-events-none opacity-20">
             {Array.from({ length: totalDays }).map((_, i) => (
               <div key={i} className="border-r border-gray-200 dark:border-zinc-700 h-full" style={{ width: `${100 / totalDays}%` }}></div>
             ))}
          </div>

          {stages.map((stage) => {
            const sStart = new Date(stage.startDate + 'T00:00:00');
            const sEnd = new Date(stage.endDate + 'T00:00:00');
            
            const startOffsetDays = Math.floor((sStart.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
            const durationDays = Math.ceil((sEnd.getTime() - sStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            
            const leftPercent = Math.max(0, (startOffsetDays / totalDays) * 100);
            const widthPercent = Math.min(100 - leftPercent, (durationDays / totalDays) * 100);

            // Cor baseada no progresso
            let bgColor = 'bg-blue-500';
            if (stage.progress === 100) bgColor = 'bg-emerald-500';
            else if (stage.progress > 0) bgColor = 'bg-amber-500';

            return (
              <div key={stage.id} className="flex hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors relative z-10">
                {/* Nome da Etapa */}
                <div className="w-64 shrink-0 border-r border-gray-200 dark:border-zinc-800 p-3 flex flex-col justify-center bg-white dark:bg-transparent">
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate" title={stage.name}>
                    {stage.name}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {sStart.toLocaleDateString('pt-BR')} até {sEnd.toLocaleDateString('pt-BR')}
                  </span>
                </div>
                
                {/* Barra do Gantt */}
                <div className="flex-1 relative py-3">
                  <div 
                    className={`absolute top-1/2 -translate-y-1/2 h-6 rounded-md shadow-sm ${bgColor} bg-opacity-90 dark:bg-opacity-80 group cursor-help`}
                    style={{ left: `${leftPercent}%`, width: `${widthPercent}%`, minWidth: '4px' }}
                  >
                    <div className="absolute inset-0 bg-white/20 rounded-md" style={{ width: `${stage.progress}%` }}></div>
                    
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-zinc-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap pointer-events-none transition-opacity z-50">
                      {stage.progress}% concluído
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900"></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
