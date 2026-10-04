/**
 * Lógica da Página de Carrinho de Compras
 * Atende: RF0031, RF0032, RN0031 (bloqueio de indisponíveis ou qtd > estoque) e RF0033
 */
document.addEventListener('DOMContentLoaded', () => {
  renderizarCarrinho();
  validarEstoqueComBackend();

  const btnLimpar = document.getElementById('btn-limpar-carrinho');
  if (btnLimpar) {
    btnLimpar.addEventListener('click', () => {
      if (confirm('Deseja realmente esvaziar seu carrinho?')) {
        window.Carrinho.limpar();
        renderizarCarrinho();
      }
    });
  }
});

function renderizarCarrinho() {
  const tbody = document.getElementById('tabela-carrinho-body');
  const vazioEl = document.getElementById('carrinho-vazio');
  const conteudoEl = document.getElementById('carrinho-conteudo');
  const totalEl = document.getElementById('total-carrinho');

  if (!tbody || !window.Carrinho) return;

  const itens = window.Carrinho.obterItens();

  if (itens.length === 0) {
    if (vazioEl) vazioEl.style.display = 'block';
    if (conteudoEl) conteudoEl.style.display = 'none';
    if (totalEl) totalEl.textContent = 'R$ 0,00';
    return;
  }

  if (vazioEl) vazioEl.style.display = 'none';
  if (conteudoEl) conteudoEl.style.display = 'block';

  tbody.innerHTML = '';

  itens.forEach((item, idx) => {
    const subtotal = ((item.precoCentavos || Math.round(item.preco * 100)) * item.quantidade) / 100;
    const subtotalFormatado = subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const precoUnitFormatado = Number(item.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid #e2e8f0';
    tr.dataset.livroId = item.livroId;

    tr.innerHTML = `
      <td style="padding: 14px 12px; display: flex; align-items: center; gap: 14px;">
        <img src="${item.capa}" alt="${item.titulo}" style="width: 48px; height: 68px; object-fit: cover; border-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.1);">
        <div>
          <strong style="color: #1e293b; display: block; font-family: var(--font-heading); font-size: 0.95rem;">${item.titulo}</strong>
          <span style="font-size: 0.8rem; color: #64748b; font-style: italic;">${item.autor}</span>
          <div style="font-size: 0.75rem; color: #0284c7; margin-top: 2px;">Estoque disponível: ${item.estoque} un.</div>
        </div>
      </td>
      <td style="padding: 14px 12px; text-align: center;">
        <input type="number" 
               class="form-input input-qtd-carrinho" 
               data-livro-id="${item.livroId}" 
               data-index="${idx}"
               value="${item.quantidade}" 
               min="1" 
               max="${item.estoque}" 
               style="width: 60px; text-align: center; font-weight: 600; padding: 6px;">
      </td>
      <td style="padding: 14px 12px; text-align: right; color: #475569; font-size: 0.9rem;">
        ${precoUnitFormatado}
      </td>
      <td style="padding: 14px 12px; text-align: right; font-weight: 700; color: #0f172a; font-size: 0.95rem;" class="subtotal-item">
        ${subtotalFormatado}
      </td>
      <td style="padding: 14px 12px; text-align: center;">
        <button type="button" 
                class="btn-sm btn-remover-item" 
                data-livro-id="${item.livroId}" 
                style="background: #dc2626; color: white; padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer;">
          Remover
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  if (totalEl) {
    totalEl.textContent = window.Carrinho.subtotalFormatado();
  }

  conectarEventosTabela();
}

function conectarEventosTabela() {
  const inputsQtd = document.querySelectorAll('.input-qtd-carrinho');
  inputsQtd.forEach(input => {
    input.addEventListener('change', (e) => {
      const livroId = e.target.dataset.livroId;
      const novaQtd = parseInt(e.target.value, 10);

      const res = window.Carrinho.alterarQuantidade(livroId, novaQtd);
      if (!res.sucesso) {
        exibirAlertaCarrinho(res.mensagem, 'erro');
        e.target.value = res.quantidadeAtual || 1;
      } else {
        ocultarAlertaCarrinho();
        renderizarCarrinho();
      }
    });
  });

  const btnsRemover = document.querySelectorAll('.btn-remover-item');
  btnsRemover.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const livroId = e.target.dataset.livroId;
      window.Carrinho.remover(livroId);
      renderizarCarrinho();
    });
  });
}

async function validarEstoqueComBackend() {
  if (!window.Carrinho) return;
  const itens = window.Carrinho.obterItens();
  if (itens.length === 0) return;

  try {
    const res = await fetch('/api/checkout/itens/validar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itens: itens.map(it => ({ livroId: it.livroId, quantidade: it.quantidade }))
      })
    });

    const resultado = await res.json();
    if (!res.ok || !resultado.valido) {
      exibirAlertaCarrinho(resultado.mensagem || 'Atenção: Houve alteração no estoque de alguns itens selecionados.', 'aviso');
      // Atualiza estoques locais
      if (Array.isArray(resultado.itens)) {
        resultado.itens.forEach(itServidor => {
          const idx = itens.findIndex(it => it.livroId === itServidor.livroId);
          if (idx !== -1) {
            itens[idx].estoque = itServidor.estoque;
            if (itens[idx].quantidade > itServidor.estoque) {
              itens[idx].quantidade = itServidor.estoque;
            }
          }
        });
        window.Carrinho.salvarItens(itens.filter(it => it.quantidade > 0));
        renderizarCarrinho();
      }
    }
  } catch (err) {
    console.warn('Validação de estoque assíncrona não pôde ser completada:', err);
  }
}

function exibirAlertaCarrinho(msg, tipo = 'erro') {
  const el = document.getElementById('alerta-carrinho');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  if (tipo === 'erro') {
    el.style.background = '#fef2f2';
    el.style.border = '1px solid #f87171';
    el.style.color = '#991b1b';
  } else {
    el.style.background = '#fffbeb';
    el.style.border = '1px solid #fcd34d';
    el.style.color = '#92400e';
  }
}

function ocultarAlertaCarrinho() {
  const el = document.getElementById('alerta-carrinho');
  if (el) el.style.display = 'none';
}
