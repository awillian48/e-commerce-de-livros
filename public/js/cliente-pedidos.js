/**
 * Livraria Alexandria - Acompanhamento de Pedidos & Trocas (Cliente)
 * Requisitos DRS: RF0038, RF0039, RF0040, RF0041, RF0044, RN0041, RN0042, RN0043, RNF0046
 */

let pedidosCache = [];
let itemEmTrocaContexto = null;

document.addEventListener('DOMContentLoaded', () => {
  carregarDadosCliente();
});

async function carregarDadosCliente() {
  const clienteCodigo = localStorage.getItem('alexandria:cliente_codigo') || 'CLI-001';
  await Promise.all([
    carregarPedidos(clienteCodigo),
    carregarCuponsTroca(clienteCodigo),
    carregarNotificacoes(clienteCodigo)
  ]);
}

async function carregarPedidos(clienteCodigo) {
  const container = document.getElementById('container-historico-pedidos');
  if (!container) return;

  container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 30px;">Carregando histórico de pedidos...</p>';

  try {
    const res = await fetch(`/api/pedidos?clienteId=${encodeURIComponent(clienteCodigo)}`);
    if (!res.ok) throw new Error('Falha ao carregar pedidos');
    const pedidos = await res.json();
    pedidosCache = pedidos;
    renderizarHistoricoPedidos(pedidos);
  } catch (err) {
    console.error('Erro ao buscar pedidos:', err);
    container.innerHTML = `<p style="text-align: center; color: #ef4444; padding: 30px;">Erro ao carregar pedidos: ${err.message}</p>`;
  }
}

async function carregarCuponsTroca(clienteCodigo) {
  const container = document.getElementById('lista-cupons-troca');
  if (!container) return;

  try {
    const res = await fetch(`/api/cupons?clienteId=${encodeURIComponent(clienteCodigo)}`);
    if (!res.ok) throw new Error('Falha ao consultar cupons');
    const cupons = await res.json();

    const cuponsTroca = (cupons || []).filter(c => c.tipo === 'TROCA' && !c.utilizado);

    if (cuponsTroca.length === 0) {
      container.innerHTML = '<span style="color: #64748b; font-size: 0.85rem;">Você não possui cupons de troca ativos no momento.</span>';
      return;
    }

    container.innerHTML = cuponsTroca.map(c => `
      <div style="background: #f0fdf4; border: 1px dashed #22c55e; border-radius: 6px; padding: 8px 14px; display: inline-flex; align-items: center; gap: 10px;">
        <span style="font-weight: 700; color: #15803d; font-family: monospace; font-size: 0.95rem;">${c.codigo}</span>
        <span style="background: #22c55e; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 0.8rem;">
          ${Number(c.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      </div>
    `).join('');
  } catch (err) {
    console.warn('Erro ao carregar cupons:', err);
    container.innerHTML = '<span style="color: #64748b; font-size: 0.85rem;">Sem cupons de troca ativos.</span>';
  }
}

async function carregarNotificacoes(clienteCodigo) {
  const container = document.getElementById('container-notificacoes-cliente');
  const conteudo = document.getElementById('lista-notificacoes-conteudo');
  if (!container || !conteudo) return;

  try {
    const res = await fetch(`/api/notificacoes?clienteId=${encodeURIComponent(clienteCodigo)}`);
    if (!res.ok) return;
    const notificacoes = await res.json();

    if (Array.isArray(notificacoes) && notificacoes.length > 0) {
      conteudo.innerHTML = notificacoes.map(n => `
        <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #d1fae5;">
          <strong>${n.titulo || 'Notificação'}:</strong> ${n.mensagem}
          <div style="font-size: 0.75rem; color: #047857; margin-top: 2px;">Recebido em: ${new Date(n.created_at).toLocaleString('pt-BR')}</div>
        </div>
      `).join('');
      container.style.display = 'block';
    } else {
      container.style.display = 'none';
    }
  } catch (err) {
    console.warn('Erro ao carregar notificações:', err);
  }
}

function renderizarHistoricoPedidos(pedidos) {
  const container = document.getElementById('container-historico-pedidos');
  if (!container) return;

  if (!Array.isArray(pedidos) || pedidos.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px;">
        <p style="color: #64748b; font-size: 1rem; margin-bottom: 16px;">Você ainda não possui pedidos realizados.</p>
        <a href="/index.html" class="btn-buy" style="text-decoration: none; display: inline-block; padding: 10px 22px;">Conhecer o Acervo</a>
      </div>
    `;
    return;
  }

  container.innerHTML = '';

  pedidos.forEach(pedido => {
    const st = (pedido.status || '').toUpperCase();
    const isEntregue = st === 'ENTREGUE';
    const isEmTroca = st === 'EM TROCA';
    const isTrocaAutorizada = st === 'TROCA AUTORIZADA';
    const isTrocado = st === 'TROCADO';
    const isReprovada = st === 'REPROVADA';
    const isAprovada = st === 'APROVADA';
    const isEmTransporte = st === 'EM TRANSPORTE';

    let badgeBg = '#e0f2fe';
    let badgeColor = '#0369a1';
    let badgeBorder = '#bae6fd';

    if (isEntregue) {
      badgeBg = '#dcfce7'; badgeColor = '#166534'; badgeBorder = '#86efac';
    } else if (isEmTroca || isTrocaAutorizada) {
      badgeBg = '#fef3c7'; badgeColor = '#b45309'; badgeBorder = '#fde68a';
    } else if (isTrocado) {
      badgeBg = '#f1f5f9'; badgeColor = '#334155'; badgeBorder = '#cbd5e1';
    } else if (isReprovada) {
      badgeBg = '#fee2e2'; badgeColor = '#991b1b'; badgeBorder = '#fca5a5';
    } else if (isAprovada) {
      badgeBg = '#ecfdf5'; badgeColor = '#047857'; badgeBorder = '#a7f3d0';
    } else if (isEmTransporte) {
      badgeBg = '#fffbeb'; badgeColor = '#b45309'; badgeBorder = '#fde68a';
    }

    const cardPedido = document.createElement('div');
    cardPedido.className = 'card-pedido-cliente';
    cardPedido.dataset.pedidoId = pedido.id;
    cardPedido.dataset.status = pedido.status;
    cardPedido.style.border = '1px solid #e2e8f0';
    cardPedido.style.borderRadius = '8px';
    cardPedido.style.padding = '18px';
    cardPedido.style.marginBottom = '20px';
    cardPedido.style.background = '#ffffff';

    const itens = pedido.itens_pedido || [];
    const itensHTML = itens.map(item => {
      const precoUnit = Number(item.preco_unitario || item.precoUnitario || 0);
      const totalItem = precoUnit * (item.quantidade || 1);

      let acaoItemHtml = '';
      if (isEntregue) {
        acaoItemHtml = `
          <button type="button" 
                  class="btn-solicitar-troca btn-tbl btn-tbl-outline" 
                  onclick="abrirModalTroca('${pedido.id}', '${item.livro_id || item.livroId}', '${item.titulo_livro || item.titulo}')"
                  style="border-color: #d97706; color: #b45309; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 0.78rem; cursor: pointer;">
            Solicitar Troca (RF0040)
          </button>
        `;
      } else if (isEmTroca) {
        acaoItemHtml = '<span style="color: #d97706; font-size: 0.8rem; font-weight: 600;">Em Processo de Troca</span>';
      } else if (isTrocaAutorizada) {
        acaoItemHtml = '<span style="color: #0284c7; font-size: 0.8rem; font-weight: 600;">Troca Autorizada (Logística Reversa)</span>';
      } else if (isTrocado) {
        acaoItemHtml = '<span style="color: #166534; font-size: 0.8rem; font-weight: 600;">✓ Item Trocado</span>';
      } else {
        // Pedido não entregue (APROVADA, EM TRANSPORTE, EM PROCESSAMENTO, REPROVADA)
        // Botão para demonstrar tentativa bloqueada (Cenário 8)
        acaoItemHtml = `
          <button type="button" 
                  class="btn-solicitar-troca-bloqueada btn-tbl" 
                  onclick="tentarTrocaNaoEntregue('${pedido.id}', '${pedido.status}')"
                  style="background: #f1f5f9; color: #94a3b8; border: 1px solid #cbd5e1; padding: 4px 10px; border-radius: 4px; font-size: 0.78rem; cursor: not-allowed;">
            Troca Bloqueada (${pedido.status})
          </button>
        `;
      }

      return `
        <tr style="border-top: 1px solid #f1f5f9;">
          <td style="padding: 10px 0;">
            <strong style="color: #1e293b;">${item.titulo_livro || item.titulo}</strong>
            ${item.autor ? `<br><small style="color: #64748b;">${item.autor}</small>` : ''}
          </td>
          <td style="padding: 10px; text-align: center; color: #334155; font-weight: 600;">${item.quantidade}</td>
          <td style="padding: 10px; text-align: right; font-weight: 700; color: #1e293b;">
            ${totalItem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </td>
          <td style="padding: 10px; text-align: right;">
            ${acaoItemHtml}
          </td>
        </tr>
      `;
    }).join('');

    cardPedido.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
        <div>
          <span style="font-weight: 800; color: #0f172a; font-family: monospace; font-size: 1rem;">Pedido #${pedido.id}</span>
          <span style="color: #64748b; font-size: 0.85rem; margin-left: 10px;">Realizado em: ${pedido.data}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span class="badge-status-pedido" style="background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; padding: 4px 12px; border-radius: 4px; font-weight: 700; font-size: 0.85rem;">
            ● ${pedido.status}
          </span>
          ${isEntregue ? `
            <button type="button" 
                    class="btn-trocar-compra-inteira"
                    onclick="abrirModalTroca('${pedido.id}', 'TODOS', 'Todos os itens do Pedido')"
                    style="background: #ea580c; color: white; border: none; padding: 4px 12px; border-radius: 4px; font-weight: 600; font-size: 0.78rem; cursor: pointer;">
              Trocar Compra Inteira (RF0040)
            </button>
          ` : ''}
        </div>
      </div>

      <div style="margin-bottom: 10px; font-size: 0.85rem; color: #475569;">
        Total: <strong style="color: #0f172a; font-size: 0.95rem;">${Number(pedido.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
        ${pedido.valor_frete ? ` | Frete: ${Number(pedido.valor_frete).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : ''}
        ${Number(pedido.valor_desconto) > 0 ? ` | Desconto: ${Number(pedido.valor_desconto).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : ''}
      </div>

      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
        <thead>
          <tr style="color: #64748b; font-size: 0.8rem; text-transform: uppercase;">
            <th style="padding: 6px 0;">Item</th>
            <th style="padding: 6px; text-align: center;">Qtd</th>
            <th style="padding: 6px; text-align: right;">Total</th>
            <th style="padding: 6px; text-align: right;">Ações de Pós-Venda</th>
          </tr>
        </thead>
        <tbody>
          ${itensHTML}
        </tbody>
      </table>
    `;

    container.appendChild(cardPedido);
  });
}

// Tentativa de solicitar troca em pedido NÃO entregue (RN0041, RN0043, Cenário 8)
function tentarTrocaNaoEntregue(idPedido, statusAtual) {
  const msg = `RN0041: Apenas pedidos com status ENTREGUE podem ter troca solicitada. O status atual deste pedido é "${statusAtual}".`;
  alert(msg);
  console.warn(msg);
}

function abrirModalTroca(idPedido, idItem, tituloLivro) {
  itemEmTrocaContexto = { idPedido, idItem, tituloLivro };

  const elNome = document.getElementById('troca-nome-livro');
  const elNum = document.getElementById('troca-num-pedido');
  const modal = document.getElementById('modal-solicitar-troca');

  if (elNome) elNome.textContent = tituloLivro;
  if (elNum) elNum.textContent = '#' + idPedido;

  // Se clicou em "Trocar compra inteira", marca o rádio TOTAL
  const radioTotal = document.getElementById('escopo-total');
  const radioItem = document.getElementById('escopo-item');
  if (idItem === 'TODOS') {
    if (radioTotal) radioTotal.checked = true;
  } else {
    if (radioItem) radioItem.checked = true;
  }

  if (modal) modal.style.display = 'flex';
}

function fecharModalTroca() {
  const modal = document.getElementById('modal-solicitar-troca');
  if (modal) modal.style.display = 'none';
  itemEmTrocaContexto = null;
}

// Submissão do formulário de troca
const formTroca = document.getElementById('form-solicitar-troca');
if (formTroca) {
  formTroca.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!itemEmTrocaContexto) return;

    const motivo = document.getElementById('select-motivo-troca').value;
    const descricao = document.getElementById('textarea-descricao-troca').value.trim();
    const escopoEl = document.querySelector('input[name="escopoTroca"]:checked');
    const escopo = escopoEl ? escopoEl.value : 'ITEM';

    if (!motivo) {
      alert('Por favor, informe o motivo da troca.');
      return;
    }

    try {
      const clienteCodigo = localStorage.getItem('alexandria:cliente_codigo') || 'CLI-001';
      const payload = {
        pedidoId: itemEmTrocaContexto.idPedido,
        clienteId: clienteCodigo,
        motivo,
        descricao,
        tipo: escopo
      };

      const res = await fetch('/api/trocas/solicitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.mensagem || data.erro || 'Falha ao solicitar troca');
      }

      alert(`Solicitação de troca enviada com sucesso para o Pedido #${itemEmTrocaContexto.idPedido}!
Status do pedido alterado para "EM TROCA" (RF0040, RN0041).`);
      fecharModalTroca();
      await carregarDadosCliente();
    } catch (err) {
      alert('Erro ao solicitar troca: ' + err.message);
    }
  });
}

window.tentarTrocaNaoEntregue = tentarTrocaNaoEntregue;
window.abrirModalTroca = abrirModalTroca;
window.fecharModalTroca = fecharModalTroca;
