/**
 * Vitrine Dinâmica do Acervo da Livraria Alexandria
 * Requisitos: RF0031, RF0032, RN0031
 */

const CATALOGO_PADRAO_ACERVO = [
  {
    id: 'b1010001-0000-0000-0000-000000000001',
    codigo: 'LIV-001',
    titulo: 'Dom Casmurro (Edição Luxo)',
    autor: 'Machado de Assis',
    categoria: 'Literatura Brasileira',
    isbn: '9788535910841',
    preco_venda: 45.90,
    peso_kg: 0.65,
    status: 'ATIVO',
    capa_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400',
    estoque: { quantidade: 28, status: 'DISPONÍVEL' }
  },
  {
    id: 'b1010001-0000-0000-0000-000000000002',
    codigo: 'LIV-002',
    titulo: 'O Cortiço',
    autor: 'Aluísio Azevedo',
    categoria: 'Literatura Brasileira',
    isbn: '9788508040377',
    preco_venda: 38.00,
    peso_kg: 0.45,
    status: 'ATIVO',
    capa_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400',
    estoque: { quantidade: 4, status: 'BAIXO_ESTOQUE' }
  },
  {
    id: 'b1010001-0000-0000-0000-000000000003',
    codigo: 'LIV-003',
    titulo: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    autor: 'Robert C. Martin',
    categoria: 'Engenharia de Software',
    isbn: '9780132350884',
    preco_venda: 89.90,
    peso_kg: 0.80,
    status: 'ATIVO',
    capa_url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&q=80&w=400',
    estoque: { quantidade: 15, status: 'DISPONÍVEL' }
  },
  {
    id: 'b1010001-0000-0000-0000-000000000004',
    codigo: 'LIV-004',
    titulo: 'A Hora da Estrela (Capa Dura)',
    autor: 'Clarice Lispector',
    categoria: 'Literatura Brasileira',
    isbn: '9788535928129',
    preco_venda: 42.50,
    peso_kg: 0.35,
    status: 'ATIVO',
    capa_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400',
    estoque: { quantidade: 0, status: 'ESGOTADO' }
  },
  {
    id: 'b1010001-0000-0000-0000-000000000005',
    codigo: 'LIV-005',
    titulo: 'Grande Sertão: Veredas (Edição Especial)',
    autor: 'João Guimarães Rosa',
    categoria: 'Obras Raras',
    isbn: '9788535932133',
    preco_venda: 310.00,
    peso_kg: 1.10,
    status: 'ATIVO',
    capa_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=400',
    estoque: { quantidade: 6, status: 'DISPONÍVEL' }
  },
  {
    id: 'b1010001-0000-0000-0000-000000000006',
    codigo: 'LIV-006',
    titulo: 'Crítica da Razão Pura',
    autor: 'Immanuel Kant',
    categoria: 'Filosofia',
    isbn: '9788532651112',
    preco_venda: 110.00,
    peso_kg: 0.90,
    status: 'ATIVO',
    capa_url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=400',
    estoque: { quantidade: 15, status: 'DISPONÍVEL' }
  },
  {
    id: 'b1010001-0000-0000-0000-000000000007',
    codigo: 'LIV-007',
    titulo: 'Clean Architecture: A Craftsman\'s Guide to Software Structure',
    autor: 'Robert C. Martin',
    categoria: 'Engenharia de Software',
    isbn: '9780134494166',
    preco_venda: 149.00,
    peso_kg: 0.75,
    status: 'ATIVO',
    capa_url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&q=80&w=400',
    estoque: { quantidade: 15, status: 'DISPONÍVEL' }
  },
  {
    id: 'b1010001-0000-0000-0000-000000000008',
    codigo: 'LIV-008',
    titulo: 'Refactoring: Improving the Design of Existing Code',
    autor: 'Martin Fowler',
    categoria: 'Engenharia de Software',
    isbn: '9780134757599',
    preco_venda: 175.50,
    peso_kg: 0.85,
    status: 'ATIVO',
    capa_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400',
    estoque: { quantidade: 15, status: 'DISPONÍVEL' }
  },
  {
    id: 'b1010001-0000-0000-0000-000000000009',
    codigo: 'LIV-009',
    titulo: 'Memórias Póstumas de Brás Cubas',
    autor: 'Machado de Assis',
    categoria: 'Literatura Brasileira',
    isbn: '9788535914849',
    preco_venda: 78.90,
    peso_kg: 0.55,
    status: 'ATIVO',
    capa_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400',
    estoque: { quantidade: 15, status: 'DISPONÍVEL' }
  },
  {
    id: 'b1010001-0000-0000-0000-000000000010',
    codigo: 'LIV-010',
    titulo: 'Primeira Edição Fac-similar: Os Lusíadas (1572)',
    autor: 'Luís de Camões',
    categoria: 'Obras Raras',
    isbn: '9789722718900',
    preco_venda: 450.00,
    peso_kg: 1.40,
    status: 'ATIVO',
    capa_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=400',
    estoque: { quantidade: 3, status: 'BAIXO_ESTOQUE' }
  },
  {
    id: 'b1010001-0000-0000-0000-000000000011',
    codigo: 'LIV-011',
    titulo: 'Genealogia da Moral',
    autor: 'Friedrich Nietzsche',
    categoria: 'Filosofia',
    isbn: '9788572323864',
    preco_venda: 85.00,
    peso_kg: 0.35,
    status: 'ATIVO',
    capa_url: 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&q=80&w=400',
    estoque: { quantidade: 15, status: 'DISPONÍVEL' }
  },
  {
    id: 'b1010001-0000-0000-0000-000000000012',
    codigo: 'LIV-012',
    titulo: 'O Alienista & Contos Fluminenses',
    autor: 'Machado de Assis',
    categoria: 'Literatura Brasileira',
    isbn: '9788572329989',
    preco_venda: 54.00,
    peso_kg: 0.40,
    status: 'ATIVO',
    capa_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400',
    estoque: { quantidade: 15, status: 'DISPONÍVEL' }
  }
];

let livrosVitrineCache = [...CATALOGO_PADRAO_ACERVO];

document.addEventListener('DOMContentLoaded', () => {
  carregarVitrineLivros();
  configurarFiltrosCategoriasNav();
});

async function carregarVitrineLivros() {
  const container = document.querySelector('.book-grid');
  if (!container) return;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch('/api/livros?status=ATIVO', { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const livros = await res.json();
      if (Array.isArray(livros) && livros.length > 0) {
        livrosVitrineCache = livros;
        renderizarGridLivros(container, livros);
        return;
      }
    }
  } catch (err) {
    console.warn('API /api/livros lenta ou indisponível, ativando catálogo local resiliente:', err.message);
  }

  // Fallback garantido: renderiza o catálogo oficial imediatamente
  renderizarGridLivros(container, CATALOGO_PADRAO_ACERVO);
}

function renderizarGridLivros(container, livros) {
  if (!container) return;
  container.innerHTML = '';

  if (!Array.isArray(livros) || livros.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #64748b;">
        <h4>Nenhuma obra encontrada para a categoria selecionada.</h4>
        <button type="button" class="btn-clean" onclick="carregarVitrineLivros()" style="margin-top: 10px; padding: 6px 14px; cursor: pointer;">Ver Todo o Acervo</button>
      </div>
    `;
    return;
  }

  livros.forEach(livro => {
    let qtdEstoque = 10;
    if (typeof livro.estoque === 'object' && livro.estoque !== null) {
      qtdEstoque = Number(livro.estoque.quantidade ?? 0);
    } else if (livro.estoque !== undefined && livro.estoque !== null) {
      qtdEstoque = parseInt(livro.estoque, 10) || 0;
    }
    const estoque = Math.max(0, qtdEstoque);

    const preco = Number(livro.preco_venda ?? livro.precoVenda ?? livro.preco ?? 45.90);
    const precoFormatado = preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const esgotado = estoque <= 0;
    const capa = livro.capa_url || livro.imagemCapa || livro.capa || 'https://covers.openlibrary.org/b/id/8313436-L.jpg';
    const categoria = livro.categoria || livro.categorias?.nome || 'Clássicos';

    const card = document.createElement('article');
    card.className = 'book-card';
    card.dataset.title = livro.titulo;
    card.dataset.author = livro.autor || '';
    card.dataset.isbn = livro.isbn || '';
    card.dataset.livroId = livro.id || livro.codigo;
    card.dataset.categoria = categoria;

    card.innerHTML = `
      <img src="${capa}" alt="${livro.titulo}" class="book-cover" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400';">
      <div class="book-info">
        <span class="badge-cat" style="font-size: 0.7rem; color: #64748b; font-weight: 700; text-transform: uppercase;">${categoria}</span>
        <h4 class="book-title" style="margin-top: 2px;">${livro.titulo}</h4>
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

function configurarFiltrosCategoriasNav() {
  const linksNav = document.querySelectorAll('.category-nav a, .action-pills a');
  linksNav.forEach(link => {
    link.addEventListener('click', (e) => {
      const texto = link.textContent.trim().toLowerCase();
      if (texto.includes('calcular frete')) return; // Mantem comportamento normal

      e.preventDefault();
      const container = document.querySelector('.book-grid');
      if (!container) return;

      if (texto.includes('mais vendidos') || texto.includes('acervo') || texto.includes('frete grátis')) {
        renderizarGridLivros(container, livrosVitrineCache);
        return;
      }

      let filtro = '';
      if (texto.includes('brasileira')) filtro = 'Literatura Brasileira';
      else if (texto.includes('raras') || texto.includes('coleções')) filtro = 'Obras Raras';
      else if (texto.includes('filosofia') || texto.includes('humanidades')) filtro = 'Filosofia';
      else if (texto.includes('tecnologia') || texto.includes('engenharia')) filtro = 'Engenharia de Software';

      if (filtro) {
        const filtrados = livrosVitrineCache.filter(l => (l.categoria || l.categorias?.nome || '') === filtro);
        renderizarGridLivros(container, filtrados);
      } else {
        renderizarGridLivros(container, livrosVitrineCache);
      }
    });
  });
}

function conectarBotoesAdicionar(container) {
  if (container._botoesConectados) return;
  container._botoesConectados = true;

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
      titulo: livroCache.titulo || card.dataset.title || card.querySelector('.book-title')?.textContent?.trim(),
      autor: livroCache.autor || card.dataset.author || card.querySelector('.book-author')?.textContent?.trim(),
      isbn: livroCache.isbn || card.dataset.isbn,
      preco: Number(livroCache.preco_venda ?? livroCache.precoVenda ?? livroCache.preco ?? 45.90),
      precoCentavos: Math.round(Number(livroCache.preco_venda ?? livroCache.precoVenda ?? livroCache.preco ?? 45.90) * 100),
      pesoKg: Number(livroCache.peso_kg ?? livroCache.pesoKg ?? 0.45),
      estoque: typeof livroCache.estoque === 'object' && livroCache.estoque !== null
        ? Number(livroCache.estoque.quantidade ?? 0)
        : (parseInt(livroCache.estoque, 10) || 0),
      capa: livroCache.capa_url || livroCache.imagemCapa || livroCache.capa || card.querySelector('.book-cover')?.src
    } : {
      id: livroId,
      livroId: livroId,
      codigo: livroId,
      titulo: card.dataset.title || card.querySelector('.book-title')?.textContent?.trim(),
      autor: card.dataset.author || card.querySelector('.book-author')?.textContent?.trim(),
      isbn: card.dataset.isbn,
      preco: extrairPreco(card.querySelector('.book-price')?.textContent),
      estoque: extrairEstoque(card.querySelector('.book-estoque')?.textContent),
      capa: card.querySelector('.book-cover')?.src
    };

    if (window.Carrinho) {
      const res = window.Carrinho.adicionar(dadosLivro, qtd);
      if (res.sucesso) {
        mostrarNotificacaoVitrine(res.mensagem, 'sucesso');
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
  if (!texto) return 45.90;
  const num = texto.replace(/[^\d,]/g, '').replace(',', '.');
  return parseFloat(num) || 45.90;
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

window.carregarVitrineLivros = carregarVitrineLivros;
window.CATALOGO_PADRAO_ACERVO = CATALOGO_PADRAO_ACERVO;
