import supabase, { isSupabaseConfigured } from './supabaseClient.js';
import localStore from './localStore.js';

/**
 * RF0033 / RF0038: Listagem de Pedidos com itens e pagamentos
 */
export async function listarPedidos(filtros = {}) {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase
        .from('pedidos')
        .select('*, clientes(id, codigo, nome, cpf, email), itens_pedido(*), pagamentos_pedido(*)');

      if (filtros.clienteId) query = query.eq('cliente_id', filtros.clienteId);
      if (filtros.status) query = query.eq('status', filtros.status);

      const { data, error } = await Promise.race([
        query.order('data', { ascending: false }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout Supabase')), 300))
      ]);
      if (!error && data && data.length > 0) return data;
    } catch (err) {
      // Fallback
    }
  }
  return localStore.obterPedidos(filtros);
}

export async function buscarPedidoPorId(id) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await Promise.race([
        supabase
          .from('pedidos')
          .select('*, clientes(id, codigo, nome, cpf, email), itens_pedido(*), pagamentos_pedido(*)')
          .eq('id', id)
          .single(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout Supabase')), 800))
      ]);
      if (!error && data) return data;
    } catch (err) {
      // Fallback
    }
  }
  return localStore.buscarPedidoPorId(id);
}

/**
 * RN0038, RN0039, RN0040: Atualização de Status de Pedido
 * Ciclo:
 * EM PROCESSAMENTO -> APROVADA / REPROVADA (Sistema)
 * APROVADA -> EM TRANSPORTE (Admin - RF0038, RN0039)
 * EM TRANSPORTE -> ENTREGUE (Admin - RF0039, RN0040)
 */
export async function atualizarStatusPedido(id, novoStatus) {
  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('pedidos')
        .update({ status: novoStatus, updated_at: new Date().toISOString() })
        .eq('id', id);
    } catch (err) {
      // Continua local
    }
  }
  return localStore.atualizarStatusPedido(id, novoStatus);
}

/**
 * RF0037, RN0033, RN0035, RN0036, RF0044: Gestão de Cupons
 */
export async function listarCupons(clienteId = null) {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('cupons').select('*').eq('utilizado', false);
      if (clienteId) {
        query = query.or('cliente_id.is.null,cliente_id.eq.' + clienteId);
      }
      const { data, error } = await Promise.race([
        query.order('valor', { ascending: false }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout Supabase')), 800))
      ]);
      if (!error && data && data.length > 0) return data;
    } catch (err) {
      // Fallback
    }
  }
  return localStore.obterCupons(clienteId);
}

export async function validarCupom(codigo) {
  const cupom = localStore.buscarCupom(codigo);
  if (!cupom) return { valido: false, mensagem: 'Cupom inexistente.' };
  if (cupom.utilizado) return { valido: false, mensagem: 'Este cupom já foi utilizado.' };
  if (cupom.data_validade && new Date(cupom.data_validade) < new Date()) {
    return { valido: false, mensagem: 'Cupom com validade expirada.' };
  }
  return { valido: true, cupom };
}

/**
 * RF0040, RF0041, RF0042, RF0043, RF0044, RN0041, RN0042, RN0043, RNF0046: Gestão de Trocas
 */
export async function listarTrocas() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await Promise.race([
        supabase
          .from('solicitacoes_troca')
          .select('*, clientes(codigo, nome), pedidos(id, data, valor_total, status), itens_troca(*)')
          .order('created_at', { ascending: false }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout Supabase')), 800))
      ]);
      if (!error && data && data.length > 0) return data;
    } catch (err) {
      // Fallback
    }
  }
  return localStore.obterTrocas();
}

/**
 * RF0040, RN0041, RN0043: Cliente solicita troca de item ou da compra inteira
 * Apenas para pedidos com status ENTREGUE!
 */
export async function solicitarTroca({ pedidoId, clienteId, itens, motivo, descricao, tipo = 'ITEM' }) {
  return localStore.criarSolicitacaoTroca({ pedidoId, clienteId, itens, motivo, descricao, tipo });
}

/**
 * RF0041, RNF0046: Administrador autoriza a troca e sistema gera notificação com postagem reversa
 */
export async function autorizarTroca(trocaId) {
  return localStore.autorizarTroca(trocaId);
}

/**
 * RF0043, RN0042, RF0044, RF0054: Confirmar recebimento dos itens, reentrar no estoque e emitir cupom de troca
 */
export async function confirmarRecebimentoTroca(trocaId) {
  return localStore.confirmarRecebimentoTroca(trocaId);
}

export async function atualizarStatusTroca(trocaId, novoStatus) {
  const st = (novoStatus || '').toUpperCase();
  if (st === 'TROCA AUTORIZADA' || st === 'AUTORIZADA') {
    return (await autorizarTroca(trocaId)).troca;
  }
  if (st === 'TROCADO' || st === 'ITENS RECEBIDOS') {
    return (await confirmarRecebimentoTroca(trocaId)).troca;
  }
  const t = localStore.buscarTrocaPorId(trocaId);
  if (t) {
    t.status = novoStatus;
    localStore.salvar();
    return t;
  }
  throw new Error('Troca ' + trocaId + ' não encontrada');
}

/**
 * RNF0046: Notificações do Cliente
 */
export async function listarNotificacoes(clienteId = null) {
  return localStore.obterNotificacoes(clienteId);
}

/**
 * BI / Análise
 */
export async function obterDadosAnaliseBI() {
  const pedidos = localStore.obterPedidos();
  return pedidos.filter(p => ['ENTREGUE', 'EM TRANSPORTE', 'APROVADA', 'TROCADO'].includes(p.status));
}
