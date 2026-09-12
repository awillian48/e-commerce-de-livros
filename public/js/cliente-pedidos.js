// Simulação da base de pedidos do cliente em sessão (espelhará o banco de dados)
const pedidosClienteMock = [
  {
    id: '7890',
    data: '10/08/2026',
    status: 'ENTREGUE',
    itens: [
      { idItem: '101', titulo: 'Dom Casmurro - Edição de Luxo', qtd: 1, valor: 45.90, statusItem: 'ENTREGUE' }
    ]
  },
  {
    id: '7891',
    data: '12/08/2026',
    status: 'EM_TRANSPORTE',
    itens: [
      { idItem: '102', titulo: 'Clean Code', qtd: 1, valor: 89.90, statusItem: 'EM_TRANSPORTE' }
    ]
  }
];

let itemEmTrocaContexto = null;

document.addEventListener('DOMContentLoaded', () => {
  renderizarHistoricoPedidos();

  const formTroca = document.getElementById('form-solicitar-troca');
  if (formTroca) {
    formTroca.addEventListener('submit', confirmarSolicitacaoTroca);
  }
});

function renderizarHistoricoPedidos() {
  const container = document.getElementById('container-historico-pedidos');
  if (!container) return;

  container.innerHTML = '';

  pedidosClienteMock.forEach(pedido => {
    const isEntregue = pedido.status === 'ENTREGUE';
    const cardPedido = document.createElement('div');
    cardPedido.style.cssText = 'border-bottom: 2px solid var(--border-color); padding-bottom: 20px; margin-bottom: 20px;';

    let itensHTML = '';
    pedido.itens.forEach(item => {
      const podeTrocar = isEntregue && item.statusItem === 'ENTREGUE';
      const emAnalise = item.statusItem === 'TROCA_SOLICITADA';

      let acaoHTML = '';
      if (podeTrocar) {
        acaoHTML = `<button onclick="abrirModalTroca('${pedido.id}', '${item.idItem}')" style="background: var(--palette-sand); color: var(--palette-navy-dark); border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.8rem;">Solicitar Troca</button>`;
      } else if (emAnalise) {
        acaoHTML = `<span style="background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 0.8rem;">⏳ Troca em Análise</span>`;
      } else if (!isEntregue) {
        acaoHTML = `<button onclick="confirmarRecebimento('${pedido.id}')" style="background: var(--palette-teal-dark); color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Confirmar Recebimento</button>`;
      }

      itensHTML += `
        <tr>
          <td style="padding: 12px 0;"><strong>${item.titulo}</strong></td>
          <td style="padding: 12px;">${item.qtd} un.</td>
          <td style="padding: 12px;">R$ ${item.valor.toFixed(2).replace('.', ',')}</td>
          <td style="padding: 12px; text-align: right;">${acaoHTML}</td>
        </tr>
      `;
    });

    cardPedido.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; font-family: var(--font-ui);">
        <div>
          <span style="font-weight: bold; color: var(--palette-navy-dark);">Pedido #${pedido.id}</span> | Realizado em ${pedido.data}
        </div>
        <div>
          Status: <span style="background: ${isEntregue ? '#dcfce7' : '#e0f2fe'}; color: ${isEntregue ? '#166534' : '#0369a1'}; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 0.85rem;">${pedido.status}</span>
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
        <thead>
          <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-title);">
            <th style="padding: 8px 0;">Item</th>
            <th style="padding: 8px;">Qtd</th>
            <th style="padding: 8px;">Valor Total</th>
            <th style="padding: 8px; text-align: right;">Ações de Pós-Venda</th>
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

function abrirModalTroca(idPedido, idItem) {
  const pedido = pedidosClienteMock.find(p => p.id === idPedido);
  if (!pedido) return;

  const item = pedido.itens.find(i => i.idItem === idItem);
  if (!item) return;

  itemEmTrocaContexto = { idPedido, idItem, item };

  document.getElementById('troca-nome-livro').textContent = item.titulo;
  document.getElementById('troca-num-pedido').textContent = `#${idPedido}`;
  document.getElementById('modal-solicitar-troca').style.display = 'flex';
}

function fecharModalTroca() {
  document.getElementById('modal-solicitar-troca').style.display = 'none';
  itemEmTrocaContexto = null;
}

function confirmarSolicitacaoTroca(e) {
  e.preventDefault();
  if (!itemEmTrocaContexto) return;

  const motivo = document.getElementById('select-motivo-troca').value;
  const descricao = document.getElementById('textarea-descricao-troca').value.trim();

  if (!motivo || !descricao) {
    alert('Por favor, informe o motivo e uma breve descrição do defeito/avaria.');
    return;
  }

  // Atualiza a máquina de estado do item simulado
  const pedido = pedidosClienteMock.find(p => p.id === itemEmTrocaContexto.idPedido);
  if (pedido) {
    const item = pedido.itens.find(i => i.idItem === itemEmTrocaContexto.idItem);
    if (item) {
      item.statusItem = 'TROCA_SOLICITADA';
    }
  }

  alert(`Solicitação de troca enviada com sucesso para o Pedido #${itemEmTrocaContexto.idPedido}!\nNossa equipe analisará o caso em até 24h.`);
  fecharModalTroca();
  renderizarHistoricoPedidos();
}

function confirmarRecebimento(idPedido) {
  const pedido = pedidosClienteMock.find(p => p.id === idPedido);
  if (pedido) {
    pedido.status = 'ENTREGUE';
    pedido.itens.forEach(i => i.statusItem = 'ENTREGUE');
    renderizarHistoricoPedidos();
  }
}