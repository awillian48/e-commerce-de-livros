import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseKey = process.env.SUPABASE_KEY?.trim();

let supabaseInstance = null;

if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http')) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      }
    });
    console.log('✅ Conexão com Supabase inicializada com sucesso!');
  } catch (err) {
    console.error('❌ Falha ao inicializar cliente Supabase:', err.message);
  }
} else {
  console.log('ℹ️  Supabase URL/Key não configurados no .env. Operando em modo de persistência local (JSON fallback).');
}

export function isSupabaseConfigured() {
  return supabaseInstance !== null;
}

export function getSupabase() {
  return supabaseInstance;
}

export default supabaseInstance;
