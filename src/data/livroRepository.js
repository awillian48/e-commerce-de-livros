import supabase from './supabaseClient.js';

/**
 * RF0015: Consulta de livros com categoria e estoque
 */
export async function listarLivros(filtros = {}) {
  try {
    let query = supabase
      .from('livros')
      .select('*, categorias(nome), grupos_precificacao(nome, margem_lucro), estoque(quantidade, quantidade_bloqueada, status)');

    if (filtros.status) {
      query = query.eq('status', filtros.status);
    }
    if (filtros.categoriaId) {
      query = query.eq('categoria_id', filtros.categoriaId);
    }

    const { data, error } = await query.order('titulo', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Erro ao listar livros do Supabase:', err.message);
    return [];
  }
}

/**
 * Consulta de livro específico por ID ou ISBN
 */
export async function buscarLivroPorId(idOuIsbn) {
  try {
    const isUuid = idOuIsbn.length === 36 && idOuIsbn.includes('-');
    const coluna = isUuid ? 'id' : 'isbn';

    const { data, error } = await supabase
      .from('livros')
      .select('*, categorias(nome), grupos_precificacao(nome, margem_lucro), estoque(quantidade, quantidade_bloqueada, status)')
      .eq(coluna, idOuIsbn)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Erro ao buscar livro:', err.message);
    return null;
  }
}

/**
 * RF0051 / RF0053: Consulta e Atualização de Estoque
 */
export async function obterEstoqueCompleto() {
  try {
    const { data, error } = await supabase
      .from('estoque')
      .select('*, livros(id, codigo, titulo, autor, isbn, preco_venda, status, categorias(nome))')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Erro ao obter estoque do Supabase:', err.message);
    return [];
  }
}

export async function atualizarEstoque(livroId, quantidade, status) {
  try {
    const updateData = { updated_at: new Date().toISOString() };
    if (quantidade !== undefined) updateData.quantidade = quantidade;
    if (status) updateData.status = status;

    const { data, error } = await supabase
      .from('estoque')
      .update(updateData)
      .eq('livro_id', livroId)
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Erro ao atualizar estoque:', err.message);
    throw err;
  }
}
