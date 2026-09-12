document.addEventListener('DOMContentLoaded', () => {
  const formBusca = document.querySelector('.header-search');
  const inputBusca = formBusca ? formBusca.querySelector('input') : null;
  const selectTipo = formBusca ? formBusca.querySelector('select') : null;

  if (!formBusca || !inputBusca || !selectTipo) return;

  let timerDebounce = null;

  // Intercepta a submissão do formulário
  formBusca.addEventListener('submit', (e) => {
    e.preventDefault();
    executarBusca(inputBusca.value, selectTipo.value);
  });

  // Digitação em tempo real com Debounce (300ms)
  inputBusca.addEventListener('input', () => {
    clearTimeout(timerDebounce);
    timerDebounce = setTimeout(() => {
      executarBusca(inputBusca.value, selectTipo.value);
    }, 300);
  });
});

function executarBusca(termo, tipo) {
  const termoSanitizado = termo.trim().toLowerCase();
  const cards = document.querySelectorAll('.book-card');
  let encontrouResultado = false;

  cards.forEach(card => {
    const titulo = (card.dataset.title || card.querySelector('.book-title')?.textContent || '').toLowerCase();
    const autor = (card.dataset.author || card.querySelector('.book-author')?.textContent || '').toLowerCase();
    const isbn = (card.dataset.isbn || '').toLowerCase();

    let corresponde = false;

    if (termoSanitizado === '') {
      corresponde = true;
    } else if (tipo === 'ISBN') {
      corresponde = isbn.includes(termoSanitizado);
    } else {
      // Busca padrão: Título ou Autor
      corresponde = titulo.includes(termoSanitizado) || autor.includes(termoSanitizado);
    }

    if (corresponde) {
      card.style.display = 'flex';
      encontrouResultado = true;
    } else {
      card.style.display = 'none';
    }
  });

  tratarMensagemVazia(encontrouResultado);
}

function tratarMensagemVazia(encontrou) {
  let msgContainer = document.getElementById('mensagem-busca-vazia');
  const main = document.querySelector('main.container');

  if (!encontrou) {
    if (!msgContainer && main) {
      msgContainer = document.createElement('div');
      msgContainer.id = 'mensagem-busca-vazia';
      msgContainer.style.cssText = 'text-align: center; padding: 40px; background: white; border: 1px solid var(--border-color); border-radius: 8px; margin: 20px 0; font-family: var(--font-ui); color: var(--text-muted); width: 100%;';
      msgContainer.innerHTML = '<h4>📖 Nenhum livro encontrado no acervo</h4><p>Tente buscar por outros termos, autores ou altere a opção de filtro.</p>';
      main.appendChild(msgContainer);
    }
  } else if (msgContainer) {
    msgContainer.remove();
  }
}