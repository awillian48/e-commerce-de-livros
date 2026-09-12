const detalhesLivros = {
  '9788535910841': {
    titulo: 'Dom Casmurro',
    autor: 'Machado de Assis',
    isbn: '9788535910841',
    preco: 'R$ 45,90',
    categoria: 'Literatura Brasileira',
    paginas: 256,
    editora: 'Companhia das Letras',
    capa: 'https://covers.openlibrary.org/b/id/8313436-L.jpg',
    sinopse: 'Bento Santiago narra a sua história e a sua obsessiva dúvida sobre a fidelidade de Capitu. Um clássico imortal do realismo brasileiro.'
  },
  '9780132350884': {
    titulo: 'Clean Code',
    autor: 'Robert C. Martin',
    isbn: '9780132350884',
    preco: 'R$ 89,90',
    categoria: 'Engenharia de Software',
    paginas: 464,
    editora: 'Prentice Hall',
    capa: 'https://covers.openlibrary.org/b/id/9255566-L.jpg',
    sinopse: 'Princípios, padrões e práticas para escrever código limpo, legível, testável e de fácil manutenção.'
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const containerAcervo = document.querySelector('.book-grid') || document.body;

  containerAcervo.addEventListener('click', (e) => {
    const card = e.target.closest('.book-card');
    if (!card) return;

    if (e.target.classList.contains('btn-buy-direct')) return;

    e.preventDefault();
    const isbn = card.dataset.isbn;
    abrirModalDetalhes(isbn, card);
  });
});

function abrirModalDetalhes(isbn, cardElemento) {
  const modal = document.getElementById('modal-detalhes-livro');
  if (!modal) return;

  // Extração direta de elementos visuais do DOM do card
  const tituloDom = cardElemento.querySelector('.book-title')?.textContent?.trim();
  const autorDom = cardElemento.querySelector('.book-author')?.textContent?.trim();
  const precoDom = cardElemento.querySelector('.book-price')?.textContent?.trim();
  const capaDom = cardElemento.querySelector('img')?.src;

  // Fallback em cascata: dataset -> texto do DOM -> valor genérico
  const dados = (isbn && detalhesLivros[isbn]) ? detalhesLivros[isbn] : {
    titulo: cardElemento.dataset.title || tituloDom || 'Obra do Acervo',
    autor: cardElemento.dataset.author || autorDom || 'Autor do Acervo',
    isbn: isbn || '978-85-0000-000-0',
    preco: precoDom || 'R$ 0,00',
    categoria: 'Literatura',
    paginas: 240,
    editora: 'Livraria Alexandria',
    capa: capaDom || '',
    sinopse: `Uma obra selecionada de ${autorDom || 'grande autor'}, disponível no acervo da Livraria Alexandria. Edição física com acabamento de alta qualidade.`
  };

  document.getElementById('detalhe-capa').src = dados.capa;
  document.getElementById('detalhe-titulo').textContent = dados.titulo;
  document.getElementById('detalhe-autor').textContent = `Por ${dados.autor}`;
  document.getElementById('detalhe-categoria').textContent = dados.categoria;
  document.getElementById('detalhe-isbn').textContent = dados.isbn;
  document.getElementById('detalhe-paginas').textContent = `${dados.paginas} págs.`;
  document.getElementById('detalhe-editora').textContent = dados.editora;
  document.getElementById('detalhe-preco').textContent = dados.preco;
  document.getElementById('detalhe-sinopse').textContent = dados.sinopse;

  modal.style.display = 'flex';
}

function fecharModalDetalhes() {
  const modal = document.getElementById('modal-detalhes-livro');
  if (modal) modal.style.display = 'none';
}