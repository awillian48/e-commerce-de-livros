const STOCK_STORAGE_KEY = '@alexandria:estoque';

document.addEventListener('DOMContentLoaded', () => {
  inicializarEstoque();

  const formModal = document.getElementById('form-novo-livro');
  if (formModal) {
    formModal.addEventListener('submit', salvarNovoLivro);
  }
});

async function inicializarEstoque() {
  try {
    const res = await fetch('/api/livros/estoque/todos');
    if (res.ok) {
      const dados = await res.json();
      if (Array.isArray(dados) && dados.length > 0) {
        const mapeados = dados.map(item => ({
          id: item.livro_id || item.id,
          isbn: item.livros?.isbn || 'N/A',
          titulo: item.livros?.titulo || 'Livro',
          autor: item.livros?.autor || 'Autor Desconhecido',
          preco: item.livros?.preco_venda || 0,
          quantidade: item.quantidade ?? 0,
          estoqueMinimo: item.estoque_minimo ?? 5,
          status: item.status || (item.quantidade === 0 ? 'ESGOTADO' : item.quantidade <= 5 ? 'BAIXO_ESTOQUE' : 'DISPONÍVEL')
        }));
        salvarEstoqueStorage(mapeados);
        renderizarTabelaEstoque();
        return;
      }
    }
  } catch (err) {
    console.warn('API de estoque indisponível, usando armazenamento local:', err);
  }
  renderizarTabelaEstoque();
}

function obterEstoque() {
  return JSON.parse(localStorage.getItem(STOCK_STORAGE_KEY)) || [];
}

function salvarEstoqueStorage(lista) {
  localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(lista));
}

function renderizarTabelaEstoque() {
  const tbody = document.getElementById('tabela-estoque-body');
  if (!tbody) return;

  const estoque = obterEstoque();
  tbody.innerHTML = '';

  if (estoque.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #64748b; padding: 24px;">Nenhum item em estoque cadastrado.</td></tr>';
    atualizarCardsKPI(estoque);
    return;
  }

  estoque.forEach(item => {
    const tr = document.createElement('tr');
    tr.id = linha-livro-;

    let statusClass = 'status-disponivel';
    let statusLabel = 'DISPONÍVEL';
    let statusBg = '#ecfdf5';
    let statusColor = '#047857';

    if (item.quantidade === 0) {
      statusClass = 'status-esgotado';
      statusLabel = 'ESGOTADO';
      statusBg = '#fef2f2';
      statusColor = '#b91c1c';
    } else if (item.quantidade <= item.estoqueMinimo) {
      statusClass = 'status-baixo';
      statusLabel = 'BAIXO ESTOQUE';
      statusBg = '#fffbeb';
      statusColor = '#b45309';
    }

    tr.innerHTML = 
      <td style="font-family: monospace; color: #475569; font-size: 0.85rem;"></td>
      <td style="font-weight: 600; color: var(--palette-navy-dark);"></td>
      <td style="color: #475569;"></td>
      <td style="color: var(--palette-navy-dark); font-weight: 600;">R$ </td>
      <td style="font-weight: 700; color: #1e293b;"> un</td>
      <td>
        <span class="pill-status " style="background: ; color: ; border: 1px solid rgba(0,0,0,0.05); padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 0.75rem;">
          ● 
        </span>
      </td>
      <td style="text-align: right;">
        <button type="button" class="btn-tbl btn-tbl-primary" onclick="ajustarQuantidadeEstoque('', 5)" style="background: #0284c7; padding: 4px 8px; font-size: 0.75rem; border: none; border-radius: 4px; color: white; cursor: pointer;">
          +5 Entrada
        </button>
        <button type="button" class="btn-tbl btn-tbl-danger" onclick="ajustarQuantidadeEstoque('', -1)" style="background: #e11d48; padding: 4px 8px; font-size: 0.75rem; border: none; border-radius: 4px; color: white; cursor: pointer; margin-left: 4px;">
          -1 Baixa
        </button>
      </td>
    ;
    tbody.appendChild(tr);
  });

  atualizarCardsKPI(estoque);
}

function atualizarCardsKPI(estoque) {
  const elTotalItens = document.getElementById('kpi-total-itens');
  const elBaixoEstoque = document.getElementById('kpi-baixo-estoque');
  const elEsgotados = document.getElementById('kpi-esgotados');

  if (elTotalItens) {
    const total = estoque.reduce((acc, curr) => acc + Number(curr.quantidade), 0);
    elTotalItens.textContent = ${total} un;
  }

  if (elBaixoEstoque) {
    const countBaixo = estoque.filter(item => item.quantidade > 0 && item.quantidade <= item.estoqueMinimo).length;
    elBaixoEstoque.textContent = ${countBaixo} títulos;
  }

  if (elEsgotados) {
    const countEsgotados = estoque.filter(item => item.quantidade === 0).length;
    elEsgotados.textContent = ${countEsgotados} títulos;
  }
}

async function ajustarQuantidadeEstoque(id, delta) {
  const estoque = obterEstoque();
  const item = estoque.find(i => String(i.id) === String(id));
  if (!item) return;

  const novaQtd = Math.max(0, item.quantidade + delta);
  item.quantidade = novaQtd;
  salvarEstoqueStorage(estoque);
  renderizarTabelaEstoque();

  // Tenta persistir no Supabase via API
  try {
    await fetch(/api/livros/estoque/, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantidade: novaQtd })
    });
  } catch (err) {
    console.warn('Erro ao sincronizar estoque no backend:', err);
  }
}

function salvarNovoLivro(e) {
  e.preventDefault();
  const titulo = document.getElementById('modal-titulo')?.value;
  const autor = document.getElementById('modal-autor')?.value;
  const isbn = document.getElementById('modal-isbn')?.value;
  const preco = parseFloat(document.getElementById('modal-preco')?.value || '0');
  const quantidade = parseInt(document.getElementById('modal-qtd')?.value || '0', 10);
  const estoqueMinimo = parseInt(document.getElementById('modal-min')?.value || '5', 10);

  if (!titulo || !isbn) {
    alert('Preencha os campos obrigatórios!');
    return;
  }

  const estoque = obterEstoque();
  const novoItem = {
    id: 'livro_' + Date.now(),
    isbn,
    titulo,
    autor,
    preco,
    quantidade,
    estoqueMinimo,
    status: quantidade === 0 ? 'ESGOTADO' : quantidade <= estoqueMinimo ? 'BAIXO_ESTOQUE' : 'DISPONÍVEL'
  };

  estoque.unshift(novoItem);
  salvarEstoqueStorage(estoque);
  renderizarTabelaEstoque();

  document.getElementById('modal-novo-livro')?.classList.remove('modal-aberto');
  document.getElementById('form-novo-livro')?.reset();
}

window.ajustarQuantidadeEstoque = ajustarQuantidadeEstoque;
