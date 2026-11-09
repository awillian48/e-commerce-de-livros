import supabase, { isSupabaseConfigured } from './supabaseClient.js';
import localStore from './localStore.js';

/**
 * RF0015: Consulta de livros com categoria e estoque
 */
export async function listarLivros(filtros = {}) {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase
        .from('livros')
        .select('*, categorias(nome), grupos_precificacao(nome, margem_lucro), estoque(quantidade, quantidade_bloqueada, status)');

      if (filtros.status) query = query.eq('status', filtros.status);
      if (filtros.categoriaId) query = query.eq('categoria_id', filtros.categoriaId);

      const { data, error } = await Promise.race([
        query.order('titulo', { ascending: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout Supabase')), 800))
      ]);
      if (error) throw error;
      if (data && data.length > 0) return data;
    } catch (err) {
      console.warn('⚠️ Supabase indisponível para listarLivros, usando localStore:', err.message);
    }
  }
  return localStore.obterLivros(filtros);
}

/**
 * Consulta de livro específico por ID, código ou ISBN
 */
export async function buscarLivroPorId(idOuIsbn) {
  if (isSupabaseConfigured()) {
    try {
      const isUuid = idOuIsbn.length === 36 && idOuIsbn.includes('-');
      const coluna = isUuid ? 'id' : 'isbn';

      const { data, error } = await Promise.race([
        supabase
          .from('livros')
          .select('*, categorias(nome), grupos_precificacao(nome, margem_lucro), estoque(quantidade, quantidade_bloqueada, status)')
          .eq(coluna, idOuIsbn)
          .single(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout Supabase')), 800))
      ]);
      if (!error && data) return data;
    } catch (err) {
      // Fallback
    }
  }
  return localStore.buscarLivroPorId(idOuIsbn);
}

/**
 * RF0051 / RF0053: Consulta e Atualização de Estoque
 */
export async function obterEstoqueCompleto() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await Promise.race([
        supabase
          .from('estoque')
          .select('*, livros(id, codigo, titulo, autor, isbn, preco_venda, status, categorias(nome))')
          .order('updated_at', { ascending: false }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout Supabase')), 800))
      ]);
      if (!error && data && data.length > 0) return data;
    } catch (err) {
      // Fallback
    }
  }
  return localStore.obterEstoqueCompleto();
}

export async function atualizarEstoque(livroId, quantidade, status) {
  if (isSupabaseConfigured()) {
    try {
      const updateData = { updated_at: new Date().toISOString() };
      if (quantidade !== undefined) updateData.quantidade = quantidade;
      if (status) updateData.status = status;

      await supabase
        .from('estoque')
        .update(updateData)
        .eq('livro_id', livroId);
    } catch (err) {
      // continua local
    }
  }
  return localStore.atualizarEstoque(livroId, quantidade, status);
}
