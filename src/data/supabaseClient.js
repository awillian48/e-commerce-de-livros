import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import WebSocket from 'ws';

dotenv.config();

const DEFAULT_SUPABASE_URL = "https://fjorfwbighsbdvunijtd.supabase.co";
const DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqb3Jmd2JpZ2hzYmR2dW5panRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1NDU3OTYsImV4cCI6MjEwNjEyMTc5Nn0.peMjDrhBogK8GiFDVrJpKXIKh5G5rn9cKJq90w2Ftik";

const supabaseUrl = (process.env.SUPABASE_URL?.trim()) || DEFAULT_SUPABASE_URL;
const supabaseKey = (process.env.SUPABASE_KEY?.trim()) || DEFAULT_SUPABASE_KEY;

let supabaseInstance = null;
let supabaseOnline = false;

if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http')) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      },
      realtime: {
        transport: WebSocket
      }
    });

    // Probe assíncrono de conectividade para ativar/desativar circuit-breaker (RNF0011 < 1s)
    fetch(`${supabaseUrl}/rest/v1/`, {
      headers: { apikey: supabaseKey },
      signal: AbortSignal.timeout(1500)
    })
      .then((res) => {
        supabaseOnline = res.ok;
        if (supabaseOnline) {
          console.log('✅ Conexão com Supabase validada e online!');
        } else {
          console.warn(`⚠️ Supabase respondeu HTTP ${res.status}. Operando com motor localStore de alta velocidade.`);
        }
      })
      .catch(() => {
        supabaseOnline = false;
        console.warn('⚠️ Host Supabase inacessível/pausado. Operando 100% via localStore resiliente (< 5ms).');
      });
  } catch (err) {
    console.error('❌ Falha ao inicializar cliente Supabase:', err.message);
  }
} else {
  console.log('⚠️ Supabase URL/Key não configurados. Operando em modo de persistência local (JSON fallback).');
}

export function isSupabaseConfigured() {
  return supabaseInstance !== null && supabaseOnline;
}

export function getSupabase() {
  return supabaseOnline ? supabaseInstance : null;
}

export default supabaseInstance;
