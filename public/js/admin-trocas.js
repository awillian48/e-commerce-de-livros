/**
 * Livraria Alexandria - Gestão de Trocas (Admin)
 * Requisitos: RF0041, RF0042, RF0043, RF0044, RF0054, RN0042, RNF0046
 */

document.addEventListener('DOMContentLoaded', () => {
  carregarTrocasDoBanco();
});

async function carregarTrocasDoBanco() {
  const tbody = document.getElementById('tabela-trocas-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 24px;">Carregando solicitações de troca...</td></tr>';

  try {
    const res = await fetch('/api/trocas');
    if (!res.ok) throw new Error('Falha ao buscar trocas da API');
    const trocas = await res.json();

    if (!Array.isArray(trocas) || trocas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 24px;">Nenhuma solicitação de troca pendente.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    trocas.forEach(t => {
      const tr = document.createElement('tr');
      tr.dataset.trocaId = t.id;
      tr.dataset.status = t.status;

      const clienteNome = t.clientes?.nome || 'Cliente';
      const pedidoId = t.pedido_id || t.pedidos?.id || 'N/A';
      const motivo = t.motivo || 'Motivo não informado';

      let statusBg = '#fef3c7';
      let statusColor = '#b45309';
      let acaoBotao = '';

      const st = (t.status || '').toUpperCase();
      if (st === 'EM TROCA') {
        statusBg = '#fef3c7';
        statusColor = '#b45309';
        acaoBotao = `<button type="button" class="btn-autorizar-troca" onclick="autorizarTrocaAdmin('${t.id}')" style="background: #0284c7; padding: 5px 12px; border-radius: 4px; color: white; border: none; cursor: pointer; font-size: 0.78rem; font-weight: 600;">Autorizar Troca (RF0041)</button>`;
      } else if (st === 'TROCA AUTORIZADA' || st === 'AUTORIZADA') {
        statusBg = '#e0f2fe';
        statusColor = '#0369a1';
        acaoBotao = `<button type="button" class="btn-confirmar-recebimento-troca" onclick="confirmarRecebimentoAdmin('${t.id}')" style="background: #059669; padding: 5px 12px; border-radius: 4px; color: white; border: none; cursor: pointer; font-size: 0.78rem; font-weight: 600;">Confirmar Recebimento (RF0043)</button>`;
      } else if (st === 'TROCADO' || st === 'ITENS RECEBIDOS') {
        statusBg = '#ecfdf5';
        statusColor = '#047857';
        acaoBotao = `<span style="color: #059669; font-weight: 700; font-size: 0.82rem;">✓ Cupom Emitido & Estoque Reentrado</span>`;
      }

      tr.innerHTML = `
        <td style="font-weight: bold; color: var(--palette-navy-dark);">
          <span style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 3px 8px; border-radius: 4px; font-family: monospace; font-size: 0.85rem;">
            ${t.id}
          </span>
        </td>
        <td>
          <a href="/admin/pedidos.html" style="color: #0284c7; font-weight: 600; text-decoration: none;">
            #${pedidoId}
          </a>
        </td>
        <td><strong style="color: var(--palette-navy-dark);">${clienteNome}</strong></td>
        <td style="color: #475569; font-size: 0.85rem; max-width: 250px;">
          ${motivo}
          ${t.codigo_postagem ? `<br><small style="color: #0284c7; font-weight: 600;">Postagem: ${t.codigo_postagem}</small>` : ''}
        </td>
        <td>
          <span class="pill-status" style="background: ${statusBg}; color: ${statusColor}; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 0.75rem;">
            ● ${t.status}
          </span>
        </td>
        <td style="text-align: right; padding-right: 18px;">
          ${acaoBotao}
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error('Erro ao listar trocas:', err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ef4444; padding: 24px;">Erro ao carregar trocas: ${err.message}</td></tr>`;
  }
}

async function autorizarTrocaAdmin(trocaId) {
  try {
    const res = await fetch(`/api/trocas/${encodeURIComponent(trocaId)}/autorizar`, {
      method: 'PUT'
    });
    if (!res.ok) throw new Error('Falha ao autorizar troca');
    const data = await res.json();
    alert(`Troca ${trocaId} AUTORIZADA com sucesso!\nCódigo de postagem reversa gerado: ${data.codigoPostagem}\nNotificação emitida para o cliente (RNF0046).`);
    await carregarTrocasDoBanco();
  } catch (err) {
    alert('Erro ao autorizar troca: ' + err.message);
  }
}

async function confirmarRecebimentoAdmin(trocaId) {
  try {
    const res = await fetch(`/api/trocas/${encodeURIComponent(trocaId)}/confirmar-recebimento`, {
      method: 'PUT'
    });
    if (!res.ok) throw new Error('Falha ao confirmar recebimento');
    const data = await res.json();
    alert(`Recebimento de itens confirmado! Status alterado para TROCADO (RF0043, RN0042).\nReentrada de itens no estoque realizada (RF0054).\nCupom de troca emitido: ${data.cupomGerado?.codigo} no valor de R$ ${Number(data.cupomGerado?.valor || 0).toFixed(2)} (RF0044).`);
    await carregarTrocasDoBanco();
  } catch (err) {
    alert('Erro ao confirmar recebimento: ' + err.message);
  }
}

window.autorizarTrocaAdmin = autorizarTrocaAdmin;
window.confirmarRecebimentoAdmin = confirmarRecebimentoAdmin;
window.carregarTrocasDoBanco = carregarTrocasDoBanco;
