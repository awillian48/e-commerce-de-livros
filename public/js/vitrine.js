/**
 * Vitrine Dinâmica com Conexão ao Supabase e Carrinho
 * Requisitos: RF0031, RF0032, RN0031
 */
document.addEventListener('DOMContentLoaded', () => {
  carregarVitrineLivros();
});

let livrosVitrineCache = [];

async function carregarVitrineLivros() {
  const container = document.querySelector('.book-grid');
  if (!container) return;

  try {
    const res = await fetch('/api/livros?status=ATIVO');
    if (!res.ok) throw new Error('Falha ao consultar acervo');
    const livros = await res.json();

    if (Array.isArray(livros) && livros.length > 0) {
      livrosVitrineCache = livros;
      renderizarGridLivros(container, livros);
    }
  } catch (err) {
    console.warn('Usando catálogo estático da vitrine com controle de estoque:', err);
    conectarCardsEstaticos();
  }
}

function renderizarGridLivros(container, livros) {
  container.innerHTML = '';

  livros.forEach(livro => {
    let qtdEstoque = 10;
    if (typeof livro.estoque === "object" && livro.estoque !== null) {
      qtdEstoque = Number(livro.estoque.quantidade ?? 0);
    } else if (livro.estoque !== undefined && livro.estoque !== null) {
      qtdEstoque = parseInt(livro.estoque, 10) || 0;
    }
    const estoque = Math.max(0, qtdEstoque);

    const preco = Number(livro.preco_venda ?? livro.precoVenda ?? livro.preco ?? 45.9);
    const precoFormatado = preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const esgotado = estoque <= 0;
    const capa = livro.capa_url || livro.imagemCapa || livro.capa || "https://covers.openlibrary.org/b/id/8313436-L.jpg";

    const card = document.createElement('article');
    card.className = 'book-card';
    card.dataset.title = livro.titulo;
    card.dataset.author = livro.autor || '';
    card.dataset.isbn = livro.isbn || '';
    card.dataset.livroId = livro.id || livro.codigo;

    card.innerHTML = `
      <img src="${capa}" alt="${livro.titulo}" class="book-cover">
      <div class="book-info">
        <h4 class="book-title">${livro.titulo}</h4>
        <span class="book-author">${livro.autor || 'Autor Alexandria'}</span>
        <div class="book-price">${precoFormatado}</div>
        <div class="book-estoque" style="font-size: 0.78rem; margin: 4px 0 8px; font-weight: 600; color: ${esgotado ? '#dc2626' : '#15803d'};">
          ${esgotado ? '⚠ Esgotado / Indisponível' : `✓ Em estoque: ${estoque} un.`}
        </div>
        <div class="card-acoes-compra" style="display: flex; gap: 6px; align-items: center; margin-top: 6px;">
          <input type="number" class="form-input input-qtd-vitrine" value="1" min="1" max="${estoque}" 
                 ${esgotado ? 'disabled' : ''} 
                 style="width: 52px; padding: 6px; text-align: center; font-size: 0.85rem;"
                 aria-label="Quantidade para ${livro.titulo}">
          <button type="button" class="btn-buy btn-buy-direct btn-add-carrinho" 
                  data-livro-id="${livro.id || livro.codigo}" 
                  ${esgotado ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}
                  style="flex: 1; padding: 7px 10px; font-size: 0.8rem; white-space: nowrap;">
            ${esgotado ? 'Indisponível' : '+ Adicionar'}
          </button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  conectarBotoesAdicionar(container);
}

function conectarCardsEstaticos() {
  const container = document.querySelector('.book-grid');
  if (!container) return;
  conectarBotoesAdicionar(container);
}

function conectarBotoesAdicionar(container) {
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-add-carrinho');
    if (!btn || btn.disabled) return;

    e.preventDefault();
    e.stopPropagation();

    const card = btn.closest('.book-card');
    if (!card) return;

    const inputQtd = card.querySelector('.input-qtd-vitrine');
    const qtd = parseInt(inputQtd ? inputQtd.value : 1, 10) || 1;

    const livroId = card.dataset.livroId || card.dataset.isbn;
    const livroCache = livrosVitrineCache.find(l => (l.id === livroId || l.codigo === livroId || l.isbn === card.dataset.isbn));

    const dadosLivro = livroCache ? {
      id: livroCache.id || livroId,
      livroId: livroCache.id || livroId,
      codigo: livroCache.codigo || livroId,
      titulo: livroCache.titulo || card.dataset.title || card.querySelector(".book-title")?.textContent?.trim(),
      autor: livroCache.autor || card.dataset.author || card.querySelector(".book-author")?.textContent?.trim(),
      isbn: livroCache.isbn || card.dataset.isbn,
      preco: Number(livroCache.preco_venda ?? livroCache.precoVenda ?? livroCache.preco ?? 45.9),
      precoCentavos: Math.round(Number(livroCache.preco_venda ?? livroCache.precoVenda ?? livroCache.preco ?? 45.9) * 100),
      pesoKg: Number(livroCache.peso_kg ?? livroCache.pesoKg ?? 0.45),
      estoque: typeof livroCache.estoque === "object" && livroCache.estoque !== null
        ? Number(livroCache.estoque.quantidade ?? 0)
        : (parseInt(livroCache.estoque, 10) || 0),
      capa: livroCache.capa_url || livroCache.imagemCapa || livroCache.capa || card.querySelector(".book-cover")?.src
    } : {
      id: livroId,
      livroId: livroId,
      codigo: livroId,
      titulo: card.dataset.title || card.querySelector(".book-title")?.textContent?.trim(),
      autor: card.dataset.author || card.querySelector(".book-author")?.textContent?.trim(),
      isbn: card.dataset.isbn,
      preco: extrairPreco(card.querySelector(".book-price")?.textContent),
      estoque: extrairEstoque(card.querySelector(".book-estoque")?.textContent),
      capa: card.querySelector(".book-cover")?.src
    };

    if (window.Carrinho) {
      const res = window.Carrinho.adicionar(dadosLivro, qtd);
      if (res.sucesso) {
        mostrarNotificacaoVitrine(res.mensagem, 'sucesso');
        // Feedback visual no botão
        const textoOriginal = btn.textContent;
        btn.textContent = '✓ Adicionado!';
        btn.style.background = '#15803d';
        setTimeout(() => {
          btn.textContent = textoOriginal;
          btn.style.background = '';
        }, 1200);
      } else {
        mostrarNotificacaoVitrine(res.mensagem, 'erro');
      }
    }
  });
}

function extrairPreco(texto) {
  if (!texto) return 45.9;
  const num = texto.replace(/[^\d,]/g, '').replace(',', '.');
  return parseFloat(num) || 45.9;
}

function extrairEstoque(texto) {
  if (!texto) return 10;
  if (texto.includes('Esgotado') || texto.includes('Indisponível')) return 0;
  const match = texto.match(/\d+/);
  return match ? parseInt(match[0], 10) : 10;
}

function mostrarNotificacaoVitrine(mensagem, tipo = 'sucesso') {
  let toast = document.getElementById('vitrine-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'vitrine-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 12px 20px;
      border-radius: 8px;
      color: #fff;
      font-size: 0.9rem;
      font-weight: 600;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      z-index: 9999;
      transition: all 0.3s ease;
      display: none;
    `;
    document.body.appendChild(toast);
  }

  toast.style.background = tipo === 'sucesso' ? '#0f766e' : '#b91c1c';
  toast.textContent = mensagem;
  toast.style.display = 'block';

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.display = 'none';
  }, 2800);
}
