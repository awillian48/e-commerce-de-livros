/**
 * Livraria Alexandria - Gestão de Pedidos (Admin)
 * Integração direta com o Banco de Dados no Supabase via API REST
 */

document.addEventListener('DOMContentLoaded', () => {
  carregarPedidosDoBanco();
});

async function carregarPedidosDoBanco() {
  const tbody = document.getElementById('tabela-pedidos-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 24px;">Carregando pedidos do banco de dados...</td></tr>';

  try {
    const res = await fetch('/api/pedidos');
    if (!res.ok) throw new Error('Falha ao buscar pedidos da API');
    const pedidos = await res.json();

    if (!Array.isArray(pedidos) || pedidos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 24px;">Nenhum pedido encontrado.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    pedidos.forEach(p => {
      const tr = document.createElement('tr');
      const clienteNome = p.clientes?.nome || 'Cliente Anônimo';
      const clienteCpf = p.clientes?.cpf || 'N/A';
      const dataFormatada = p.data ? p.data.split('-').reverse().join('/') : 'N/A';
      const valorFormatado = Number(p.valor_total).toFixed(2).replace('.', ',');

      let statusBg = '#e0f2fe';
      let statusColor = '#0369a1';
      let statusBorder = '#bae6fd';
      let acaoBotao = '';

      const st = (p.status || '').toUpperCase();
      if (st === 'EM PROCESSAMENTO' || st === 'PROCESSANDO') {
        statusBg = '#e0f2fe';
        statusColor = '#0369a1';
        statusBorder = '#bae6fd';
        acaoBotao = <button type="button" class="btn-tbl btn-tbl-primary" onclick="alterarStatus('', 'APROVADA')" style="background: #0284c7; padding: 5px 10px; border-radius: 4px; color: white; border: none; cursor: pointer; font-size: 0.78rem;">Aprovar Pagamento</button>;
      } else if (st === 'APROVADA' || st === 'PAGAMENTO REALIZADO') {
        statusBg = '#ecfdf5';
        statusColor = '#047857';
        statusBorder = '#a7f3d0';
        acaoBotao = <button type="button" class="btn-tbl btn-tbl-primary" onclick="alterarStatus('', 'EM TRANSPORTE')" style="background: #c2410c; padding: 5px 10px; border-radius: 4px; color: white; border: none; cursor: pointer; font-size: 0.78rem;">Despachar (EM TRANSPORTE)</button>;
      } else if (st === 'EM TRANSPORTE' || st === 'EM_TRANSPORTE') {
        statusBg = '#fffbeb';
        statusColor = '#b45309';
        statusBorder = '#fde68a';
        acaoBotao = <button type="button" class="btn-tbl btn-tbl-primary" onclick="alterarStatus('', 'ENTREGUE')" style="background: #16a34a; padding: 5px 10px; border-radius: 4px; color: white; border: none; cursor: pointer; font-size: 0.78rem;">Confirmar Entrega</button>;
      } else if (st === 'ENTREGUE') {
        statusBg = '#f1f5f9';
        statusColor = '#334155';
        statusBorder = '#cbd5e1';
        acaoBotao = <span style="color: #64748b; font-size: 0.8rem;">Concluído</span>;
      } else if (st === 'EM TROCA') {
        statusBg = '#fef3c7';
        statusColor = '#b45309';
        statusBorder = '#fde68a';
        acaoBotao = <a href="/admin/trocas.html" style="color: #d97706; font-size: 0.8rem; font-weight: 600;">Ver em Trocas</a>;
      }

      tr.innerHTML = 
        <td style="font-weight: bold; color: var(--palette-navy-dark);">
          <span style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 3px 8px; border-radius: 4px; font-family: monospace; font-size: 0.85rem;">
            #
          </span>
        </td>
        <td>
          <strong style="color: var(--palette-navy-dark); font-size: 0.95rem;"></strong><br>
          <small style="color: #64748b;">CPF: </small>
        </td>
        <td style="color: #334155; font-size: 0.88rem;"></td>
        <td style="font-weight: bold; color: var(--palette-navy-dark); font-size: 0.95rem;">R$ </td>
        <td>
          <span class="pill-status" style="background: ; color: ; border: 1px solid ; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 0.75rem;">
            ● 
          </span>
        </td>
        <td style="text-align: right; padding-right: 18px;">
          <div class="action-toolbar">
            
          </div>
        </td>
      ;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error('Erro ao listar pedidos:', err);
    tbody.innerHTML = <tr><td colspan="6" style="text-align: center; color: #ef4444; padding: 24px;">Erro ao conectar com o banco: </td></tr>;
  }
}

async function alterarStatus(pedidoId, novoStatus) {
  try {
    const res = await fetch(/api/pedidos//status, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novoStatus })
    });
    if (!res.ok) throw new Error('Falha ao atualizar status no servidor');
    carregarPedidosDoBanco();
  } catch (err) {
    alert('Erro ao atualizar status: ' + err.message);
  }
}

window.alterarStatus = alterarStatus;
