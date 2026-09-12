const STOCK_STORAGE_KEY = '@alexandria:estoque';

const estoqueInicial = [
  { id: '1', isbn: '9788535910841', titulo: 'Dom Casmurro', autor: 'Machado de Assis', preco: 45.90, quantidade: 28, estoqueMinimo: 10, status: 'DISPONÍVEL' },
  { id: '2', isbn: '9788508040377', titulo: 'O Cortiço', autor: 'Aluísio Azevedo', preco: 38.00, quantidade: 4, estoqueMinimo: 5, status: 'BAIXO_ESTOQUE' },
  { id: '3', isbn: '9780132350884', titulo: 'Clean Code', autor: 'Robert C. Martin', preco: 89.90, quantidade: 15, estoqueMinimo: 8, status: 'DISPONÍVEL' },
  { id: '4', isbn: '9788535928129', titulo: 'A Hora da Estrela', autor: 'Clarice Lispector', preco: 42.50, quantidade: 0, estoqueMinimo: 5, status: 'ESGOTADO' }
];

document.addEventListener('DOMContentLoaded', () => {
  inicializarEstoque();
  renderizarTabelaEstoque();

  const formModal = document.getElementById('form-novo-livro');
  if (formModal) {
    formModal.addEventListener('submit', salvarNovoLivro);
  }
});

function inicializarEstoque() {
  if (!localStorage.getItem(STOCK_STORAGE_KEY)) {
    localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(estoqueInicial));
  }
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

  const itens = obterEstoque();
  tbody.innerHTML = '';

  itens.forEach(item => {
    if (item.quantidade <= 0) item.status = 'ESGOTADO';
    else if (item.quantidade <= item.estoqueMinimo) item.status = 'BAIXO_ESTOQUE';
    else item.status = 'DISPONÍVEL';

    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid #f1f5f9';

    const statusBadge = {
      'DISPONÍVEL': '<span class="pill-status ativo">● DISPONÍVEL</span>',
      'BAIXO_ESTOQUE': '<span class="pill-status" style="background: #fef3c7; color: #92400e; border: 1px solid #fde68a;">● BAIXO ESTOQUE</span>',
      'ESGOTADO': '<span class="pill-status inativo">● ESGOTADO</span>'
    }[item.status];

    tr.innerHTML = `
      <td style="padding: 12px 14px;">
        <strong style="color: var(--palette-navy-dark); font-size: 0.95rem;">${item.titulo}</strong><br>
        <small style="color: #64748b;">${item.autor}</small>
      </td>
      <td style="padding: 12px 14px; font-family: monospace; font-size: 0.85rem; color: #334155;">${item.isbn}</td>
      <td style="padding: 12px 14px; font-weight: bold; color: var(--palette-navy-dark);">R$ ${Number(item.preco).toFixed(2).replace('.', ',')}</td>
      <td style="padding: 12px 14px; text-align: center; font-size: 1.05rem; font-weight: bold; color: var(--palette-navy-dark);">${item.quantidade} un.</td>
      <td style="padding: 12px 14px; text-align: center; color: #64748b;">${item.estoqueMinimo} un.</td>
      <td style="padding: 12px 14px;">${statusBadge}</td>
      <td style="padding: 12px 18px; text-align: right;">
        <div class="action-toolbar">
          <button type="button" class="btn-tbl btn-tbl-outline" onclick="ajustarEstoque('${item.id}', 1)" title="Adicionar 1 unidade">+1</button>
          <button type="button" class="btn-tbl btn-tbl-outline" onclick="ajustarEstoque('${item.id}', -1)" title="Remover 1 unidade">-1</button>
          <button type="button" class="btn-tbl btn-tbl-primary" onclick="darEntradaLote('${item.id}')" title="Dar entrada em lote de estoque">+ Lote</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function abrirModalNovoLivro() {
  document.getElementById('form-novo-livro').reset();
  document.getElementById('modal-novo-livro').style.display = 'flex';
}

function fecharModalLivro() {
  document.getElementById('modal-novo-livro').style.display = 'none';
}

function salvarNovoLivro(e) {
  e.preventDefault();

  const titulo = document.getElementById('book-titulo').value.trim();
  const autor = document.getElementById('book-autor').value.trim();
  const isbn = document.getElementById('book-isbn').value.trim();
  const preco = parseFloat(document.getElementById('book-preco').value);
  const quantidade = parseInt(document.getElementById('book-quantidade').value, 10);
  const estoqueMinimo = parseInt(document.getElementById('book-estoque-minimo').value, 10);

  const itens = obterEstoque();

  const novoLivro = {
    id: String(Date.now()),
    isbn,
    titulo,
    autor,
    preco,
    quantidade,
    estoqueMinimo,
    status: quantidade <= estoqueMinimo ? 'BAIXO_ESTOQUE' : 'DISPONÍVEL'
  };

  itens.push(novoLivro);
  salvarEstoqueStorage(itens);
  fecharModalLivro();
  renderizarTabelaEstoque();
}

// Nota: a função obterEstoque() já está definida na linha 26, não precisa duplicar

function ajustarEstoque(id, delta) {
  const itens = obterEstoque();
  const item = itens.find(i => i.id === String(id));
  if (!item) return;

  item.quantidade = Math.max(0, item.quantidade + delta);
  salvarEstoqueStorage(itens);
  renderizarTabelaEstoque();
}

function darEntradaLote(id) {
  const qtdStr = prompt('Informe a quantidade de exemplares do novo lote:');
  const qtd = parseInt(qtdStr, 10);

  if (!isNaN(qtd) && qtd > 0) {
    ajustarEstoque(id, qtd);
  }
}