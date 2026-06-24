import { createClient } from '@supabase/supabase-js';
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const url = env.split('\n').find(l => l.startsWith('VITE_SUPABASE_URL=')).split('=')[1].trim();
const key = env.split('\n').find(l => l.startsWith('VITE_SUPABASE_ANON_KEY=')).split('=')[1].trim();

const supabase = createClient(url, key);

async function run() {
  const dbObra = { 
    name: 'Teste Obra API', 
    status: 'Planejamento', 
    budget: 100000, 
    start_date: '2026-06-24', 
    end_date: '2026-12-24', 
    progress: 0,
    size: 150,
    material_type: 'Alvenaria',
    construction_system: 'Padrão'
  };

  console.log("Inserting:", dbObra);
  const res = await supabase.from('obras').insert(dbObra).select().single();
  console.log("Result:", res);
}

run();
