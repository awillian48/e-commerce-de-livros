import fs from 'fs';
import path from 'path';
import { getSupabase } from './supabaseClient.js';

/**
 * RNF0012 — Log de transação.
 * Toda operação de escrita (inserção ou alteração) registra data, hora e o
 * usuário responsável. O registro é gravado:
 *   1) no banco (tabela logs_transacao) e
 *   2) em arquivo (logs/transacoes.log, uma linha JSON por operação) como
 *      trilha de auditoria local / contingência.
 */
const ARQUIVO_LOG = path.resolve('logs', 'transacoes.log');

function normalizar({ usuario, operacao, entidade, registroId, detalhes }) {
  return {
    data_hora: new Date().toISOString(),
    usuario: String(usuario || 'sistema'),
    operacao: String(operacao),
    entidade: String(entidade),
    registro_id: registroId === undefined || registroId === null ? null : String(registroId),
    detalhes: detalhes ?? null
  };
}

export async function registrarLogs(entradas) {
  const registros = (Array.isArray(entradas) ? entradas : [entradas]).map(normalizar);
  if (registros.length === 0) return;

  try {
    fs.mkdirSync(path.dirname(ARQUIVO_LOG), { recursive: true });
    fs.appendFileSync(ARQUIVO_LOG, registros.map((r) => JSON.stringify(r)).join('\n') + '\n');
  } catch (err) {
    console.warn('Falha ao gravar log em arquivo:', err.message);
  }

  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from('logs_transacao').insert(registros);
    if (error) console.warn('Falha ao gravar log no banco (execute supabase/migracao_pedido.sql):', error.message);
  }
}

export async function listarLogs({ entidade, registroId, limite = 50 } = {}) {
  const supabase = getSupabase();
  const max = Math.min(Number(limite) || 50, 500);

  if (supabase) {
    let query = supabase.from('logs_transacao').select('*').order('data_hora', { ascending: false }).limit(max);
    if (entidade) query = query.eq('entidade', entidade);
    if (registroId) query = query.eq('registro_id', registroId);
    const { data, error } = await query;
    if (!error) return data || [];
  }

  // Contingência: lê do arquivo local
  try {
    const linhas = fs.readFileSync(ARQUIVO_LOG, 'utf8').trim().split('\n').filter(Boolean);
    return linhas
      .map((l) => JSON.parse(l))
      .filter((r) => (!entidade || r.entidade === entidade) && (!registroId || r.registro_id === registroId))
      .reverse()
      .slice(0, max);
  } catch {
    return [];
  }
}
