/**
 * Livraria Alexandria - Gestão de Trocas (Admin)
 * Integração direta com o Banco de Dados no Supabase via API REST
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
        acaoBotao = <button type="button" onclick="alterarStatusTroca('', 'AUTORIZADA')" style="background: #0284c7; padding: 5px 10px; border-radius: 4px; color: white; border: none; cursor: pointer; font-size: 0.78rem;">Autorizar Troca</button>;
      } else if (st === 'AUTORIZADA') {
        statusBg = '#e0f2fe';
        statusColor = '#0369a1';
        acaoBotao = <button type="button" onclick="alterarStatusTroca('', 'ITENS RECEBIDOS')" style="background: #059669; padding: 5px 10px; border-radius: 4px; color: white; border: none; cursor: pointer; font-size: 0.78rem;">Confirmar Recebimento</button>;
      } else if (st === 'ITENS RECEBIDOS') {
        statusBg = '#f1f5f9';
        statusColor = '#334155';
        acaoBotao = <button type="button" onclick="alterarStatusTroca('', 'TROCADO')" style="background: #16a34a; padding: 5px 10px; border-radius: 4px; color: white; border: none; cursor: pointer; font-size: 0.78rem;">Concluir & Gerar Cupom</button>;
      } else if (st === 'TROCADO') {
        statusBg = '#ecfdf5';
        statusColor = '#047857';
        acaoBotao = <span style="color: #059669; font-weight: 600; font-size: 0.8rem;">✓ Cupom Emitido</span>;
      }

      tr.innerHTML = 
        <td style="font-weight: bold; color: var(--palette-navy-dark);">
          <span style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 3px 8px; border-radius: 4px; font-family: monospace; font-size: 0.85rem;">
            
          </span>
        </td>
        <td>
          <a href="/admin/pedidos.html" style="color: #0284c7; font-weight: 600; text-decoration: none;">
            #
          </a>
        </td>
        <td><strong style="color: var(--palette-navy-dark);"></strong></td>
        <td style="color: #475569; font-size: 0.85rem; max-width: 250px;"></td>
        <td>
          <span class="pill-status" style="background: ; color: ; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 0.75rem;">
            ● 
          </span>
        </td>
        <td style="text-align: right; padding-right: 18px;">
          
        </td>
      ;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error('Erro ao listar trocas:', err);
    tbody.innerHTML = <tr><td colspan="6" style="text-align: center; color: #ef4444; padding: 24px;">Erro ao conectar com o banco: </td></tr>;
  }
}

async function alterarStatusTroca(trocaId, novoStatus) {
  try {
    const res = await fetch(/api/trocas//status, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novoStatus })
    });
    if (!res.ok) throw new Error('Falha ao atualizar status no servidor');
    carregarTrocasDoBanco();
  } catch (err) {
    alert('Erro ao atualizar status da troca: ' + err.message);
  }
}

window.alterarStatusTroca = alterarStatusTroca;
