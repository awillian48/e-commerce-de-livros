import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import WebSocket from 'ws';

dotenv.config();

const DEFAULT_SUPABASE_URL = "https://fjorfwbighsbdvunijtd.supabase.co";
const DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqb3Jmd2JpZ2hzYmR2dW5panRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1NDU3OTYsImV4cCI6MjEwNjEyMTc5Nn0.peMjDrhBogK8GiFDVrJpKXIKh5G5rn9cKJq90w2Ftik";

const supabaseUrl = (process.env.SUPABASE_URL?.trim()) || DEFAULT_SUPABASE_URL;
const supabaseKey = (process.env.SUPABASE_KEY?.trim()) || DEFAULT_SUPABASE_KEY;

let supabaseInstance = null;

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
    console.log('✅ Conexão com Supabase inicializada com sucesso!');
  } catch (err) {
    console.error('❌ Falha ao inicializar cliente Supabase:', err.message);
  }
} else {
  console.log('⚠️  Supabase URL/Key não configurados no .env. Operando em modo de persistência local (JSON fallback).');
}

export function isSupabaseConfigured() {
  return supabaseInstance !== null;
}

export function getSupabase() {
  return supabaseInstance;
}

export default supabaseInstance;
