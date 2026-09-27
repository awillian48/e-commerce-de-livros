import supabase from './supabaseClient.js';

/**
 * RF0033 / RF0038: Listagem de Pedidos com itens e pagamentos
 */
export async function listarPedidos(filtros = {}) {
  try {
    let query = supabase
      .from('pedidos')
      .select('*, clientes(id, codigo, nome, cpf, email), itens_pedido(*), pagamentos_pedido(*)');

    if (filtros.clienteId) {
      query = query.eq('cliente_id', filtros.clienteId);
    }
    if (filtros.status) {
      query = query.eq('status', filtros.status);
    }

    const { data, error } = await query.order('data', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Erro ao listar pedidos:', err.message);
    return [];
  }
}

export async function buscarPedidoPorId(id) {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, clientes(id, codigo, nome, cpf, email), itens_pedido(*), pagamentos_pedido(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Erro ao buscar pedido:', err.message);
    return null;
  }
}

/**
 * RN0038, RN0039, RN0040, RN0041, RN0042: Atualização de Status de Pedido
 */
export async function atualizarStatusPedido(id, novoStatus) {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .update({ status: novoStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();

    if (error) throw error;
    return data?.[0];
  } catch (err) {
    console.error('Erro ao atualizar status do pedido:', err.message);
    throw err;
  }
}

/**
 * RF0037, RN0033, RN0035, RN0036: Gestão de Cupons
 */
export async function listarCupons(clienteId = null) {
  try {
    let query = supabase.from('cupons').select('*').eq('utilizado', false);
    if (clienteId) {
      // Retorna cupons gerais (promocionais) OU cupons de troca específicos do cliente
      query = query.or("cliente_id.is.null,cliente_id.eq." + clienteId)
    }
    const { data, error } = await query.order('valor', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Erro ao listar cupons:', err.message);
    return [];
  }
}

export async function validarCupom(codigo) {
  try {
    const { data, error } = await supabase
      .from('cupons')
      .select('*')
      .eq('codigo', codigo.trim().toUpperCase())
      .single();

    if (error || !data) return { valido: false, mensagem: 'Cupom inexistente.' };
    if (data.utilizado) return { valido: false, mensagem: 'Este cupom já foi utilizado.' };
    if (data.data_validade && new Date(data.data_validade) < new Date()) {
      return { valido: false, mensagem: 'Cupom com validade expirada.' };
    }
    return { valido: true, cupom: data };
  } catch (err) {
    return { valido: false, mensagem: err.message };
  }
}

/**
 * RF0041 - RF0045, RN0041 - RN0046: Gestão de Trocas
 */
export async function listarTrocas() {
  try {
    const { data, error } = await supabase
      .from('solicitacoes_troca')
      .select('*, clientes(codigo, nome), pedidos(id, data, valor_total, status), itens_troca(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Erro ao listar trocas:', err.message);
    return [];
  }
}

export async function atualizarStatusTroca(trocaId, novoStatus) {
  try {
    const { data, error } = await supabase
      .from('solicitacoes_troca')
      .update({ status: novoStatus, updated_at: new Date().toISOString() })
      .eq('id', trocaId)
      .select();

    if (error) throw error;
    return data?.[0];
  } catch (err) {
    console.error('Erro ao atualizar troca:', err.message);
    throw err;
  }
}

/**
 * RF0055, RF0056, RN0071 - RN0074: Dados Analíticos para o Gráfico do BI
 */
export async function obterDadosAnaliseBI() {
  try {
    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select('id, data, valor_total, status, itens_pedido(titulo_livro, quantidade, preco_unitario, livro_id, livros(categorias(nome)))')
      .in('status', ['ENTREGUE', 'EM TRANSPORTE', 'APROVADA', 'EM_TRANSPORTE', 'PAGAMENTO REALIZADO']);

    if (error) throw error;
    return pedidos || [];
  } catch (err) {
    console.error('Erro ao obter dados de análise BI:', err.message);
    return [];
  }
}
