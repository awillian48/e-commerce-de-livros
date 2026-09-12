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
      'DISPONÍVEL': '<span style="background: #dcfce7; color: #15803d; padding: 4px 8px; border-radius: 4px; font-weight: bold;">DISPONÍVEL</span>',
      'BAIXO_ESTOQUE': '<span style="background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-weight: bold;">⚠️ BAIXO ESTOQUE</span>',
      'ESGOTADO': '<span style="background: #fee2e2; color: #b91c1c; padding: 4px 8px; border-radius: 4px; font-weight: bold;">ESGOTADO</span>'
    }[item.status];

    tr.innerHTML = `
      <td style="padding: 12px 10px;">
        <strong>${item.titulo}</strong><br>
        <small style="color: var(--text-muted);">${item.autor}</small>
      </td>
      <td style="padding: 12px 10px; font-family: monospace;">${item.isbn}</td>
      <td style="padding: 12px 10px; font-weight: bold;">R$ ${Number(item.preco).toFixed(2).replace('.', ',')}</td>
      <td style="padding: 12px 10px; text-align: center; font-size: 1.1rem; font-weight: bold; color: var(--palette-navy-dark);">${item.quantidade} un.</td>
      <td style="padding: 12px 10px; text-align: center; color: var(--text-muted);">${item.estoqueMinimo} un.</td>
      <td style="padding: 12px 10px;">${statusBadge}</td>
      <td style="padding: 12px 10px; text-align: center;">
        <button onclick="ajustarEstoque('${item.id}', 1)" style="background: var(--palette-teal-dark); color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-weight: bold;">+1</button>
        <button onclick="ajustarEstoque('${item.id}', -1)" style="background: var(--palette-terracotta); color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-weight: bold; margin-left: 2px;">-1</button>
        <button onclick="darEntradaLote('${item.id}')" style="background: var(--palette-navy-dark); color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem; margin-left: 6px;">+ Lote</button>
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