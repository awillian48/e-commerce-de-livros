/**
 * Gerenciador unificado de Carrinho de Compras da Livraria Alexandria
 * Requisitos: RF0031, RF0032, RN0031 (bloqueio de indisponíveis e limite por estoque)
 */
(function(window) {
  const CHAVE_STORAGE = 'alexandria:carrinho';
  const CHAVE_CLIENTE = 'alexandria:cliente_codigo';

  const Carrinho = {
    CHAVE_CLIENTE,

    obterClienteAtual() {
      try {
        return localStorage.getItem(CHAVE_CLIENTE) || 'CLI-001';
      } catch (e) {
        return 'CLI-001';
      }
    },

    definirClienteAtual(codigo) {
      try {
        localStorage.setItem(CHAVE_CLIENTE, codigo || 'CLI-001');
      } catch (e) {}
    },

    obterItens() {
      try {
        const raw = localStorage.getItem(CHAVE_STORAGE);
        if (!raw) return [];
        const itens = JSON.parse(raw);
        return Array.isArray(itens) ? itens : [];
      } catch (err) {
        console.warn('Erro ao carregar carrinho:', err);
        return [];
      }
    },

    salvarItens(itens) {
      try {
        localStorage.setItem(CHAVE_STORAGE, JSON.stringify(itens));
        this.atualizarBadge();
        window.dispatchEvent(new CustomEvent('carrinho:atualizado', { detail: { itens } }));
      } catch (err) {
        console.error('Erro ao salvar carrinho no localStorage:', err);
      }
    },

    adicionar(livro, quantidadeDesejada = 1) {
      const qtd = Math.max(1, parseInt(quantidadeDesejada, 10) || 1);
      const estoqueDisponivel = Math.max(0, parseInt(livro.estoque, 10) || 0);

      // RN0031: não permitir adicionar itens indisponíveis
      if (estoqueDisponivel <= 0) {
        return {
          sucesso: false,
          mensagem: `O livro "${livro.titulo}" está indisponível no momento.`
        };
      }

      const itens = this.obterItens();
      const index = itens.findIndex(it => it.livroId === livro.id || it.livroId === livro.livroId);

      const qtdAtual = index !== -1 ? itens[index].quantidade : 0;
      const novaQtd = qtdAtual + qtd;

      // RN0031: não permitir quantidade superior à disponível em estoque
      if (novaQtd > estoqueDisponivel) {
        return {
          sucesso: false,
          mensagem: `Quantidade solicitada (${novaQtd}) é superior ao estoque disponível (${estoqueDisponivel} un.).`
        };
      }

      const precoNumerico = Number(livro.precoVenda || livro.preco || 0);
      const precoCentavos = Math.round(precoNumerico * 100);

      if (index !== -1) {
        itens[index].quantidade = novaQtd;
        itens[index].estoque = estoqueDisponivel;
      } else {
        itens.push({
          livroId: livro.id || livro.livroId || livro.codigo,
          codigo: livro.codigo || livro.id,
          titulo: livro.titulo,
          autor: livro.autor || '',
          isbn: livro.isbn || '',
          preco: precoNumerico,
          precoCentavos: precoCentavos,
          pesoKg: Number(livro.pesoKg || livro.peso_kg || 0.45),
          estoque: estoqueDisponivel,
          quantidade: qtd,
          capa: livro.capa || livro.imagemCapa || 'https://covers.openlibrary.org/b/id/8313436-L.jpg'
        });
      }

      this.salvarItens(itens);
      return {
        sucesso: true,
        mensagem: `"${livro.titulo}" adicionado ao carrinho com sucesso!`,
        itens
      };
    },

    alterarQuantidade(livroId, novaQtd) {
      const itens = this.obterItens();
      const index = itens.findIndex(it => it.livroId === livroId || it.codigo === livroId);
      if (index === -1) {
        return { sucesso: false, mensagem: 'Item não encontrado no carrinho.' };
      }

      const qtd = parseInt(novaQtd, 10);
      if (isNaN(qtd) || qtd <= 0) {
        return this.remover(livroId);
      }

      const estoque = Math.max(0, parseInt(itens[index].estoque, 10) || 0);
      if (qtd > estoque) {
        return {
          sucesso: false,
          mensagem: `Não é possível selecionar ${qtd} unidades. Estoque disponível: ${estoque}.`,
          quantidadeAtual: itens[index].quantidade
        };
      }

      itens[index].quantidade = qtd;
      this.salvarItens(itens);
      return { sucesso: true, itens };
    },

    remover(livroId) {
      let itens = this.obterItens();
      itens = itens.filter(it => it.livroId !== livroId && it.codigo !== livroId);
      this.salvarItens(itens);
      return { sucesso: true, itens };
    },

    limpar() {
      try {
        localStorage.removeItem(CHAVE_STORAGE);
        this.atualizarBadge();
        window.dispatchEvent(new CustomEvent('carrinho:atualizado', { detail: { itens: [] } }));
      } catch (err) {}
    },

    quantidadeTotal() {
      return this.obterItens().reduce((acc, it) => acc + (parseInt(it.quantidade, 10) || 0), 0);
    },

    subtotalCentavos() {
      return this.obterItens().reduce((acc, it) => {
        const preco = it.precoCentavos || Math.round(Number(it.preco || 0) * 100);
        return acc + (preco * (parseInt(it.quantidade, 10) || 0));
      }, 0);
    },

    subtotalFormatado() {
      return (this.subtotalCentavos() / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
    },

    atualizarBadge() {
      const total = this.quantidadeTotal();
      const linksCarrinho = document.querySelectorAll('a[href*="carrinho.html"]');
      linksCarrinho.forEach(el => {
        el.textContent = `Carrinho (${total})`;
      });
    }
  };

  window.Carrinho = Carrinho;

  document.addEventListener('DOMContentLoaded', () => {
    Carrinho.atualizarBadge();
  });
  window.addEventListener('storage', (e) => {
    if (e.key === CHAVE_STORAGE) Carrinho.atualizarBadge();
  });
})(window);
