/**
 * Livraria Alexandria — Módulo de Análise Gráfica de Vendas (BI)
 * Requisitos DRS: RF0055, RNF0043, RNF0011, RNF0045, RNF0046
 */

let chartInstancia = null;
let ultimosDadosAnalise = null;

document.addEventListener('DOMContentLoaded', () => {
  configurarEventosAnalise();
  consultarHistoricoVendas();
});

function configurarEventosAnalise() {
  const btnConsultar = document.getElementById('btn-aplicar-filtro');
  if (btnConsultar) {
    btnConsultar.addEventListener('click', consultarHistoricoVendas);
  }

  const inputInicio = document.getElementById('filtro-data-inicio');
  const inputFim = document.getElementById('filtro-data-fim');
  if (inputInicio) inputInicio.addEventListener('change', consultarHistoricoVendas);
  if (inputFim) inputFim.addEventListener('change', consultarHistoricoVendas);

  const selectPerfil = document.getElementById('select-perfil-acesso');
  if (selectPerfil) {
    selectPerfil.addEventListener('change', () => {
      consultarHistoricoVendas();
    });
  }

  // Atualização em tempo real ao marcar/desmarcar checkboxes de categoria
  const checkboxes = document.querySelectorAll('.check-categoria');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', consultarHistoricoVendas);
  });

  const btnExportar = document.getElementById('btn-exportar-csv');
  if (btnExportar) {
    btnExportar.addEventListener('click', exportarCsv);
  }
}

function marcarTodasCategorias(marcar) {
  const checkboxes = document.querySelectorAll('.check-categoria');
  checkboxes.forEach(cb => { cb.checked = marcar; });
  consultarHistoricoVendas();
}

function restaurarPerfilAdmin() {
  const selectPerfil = document.getElementById('select-perfil-acesso');
  if (selectPerfil) selectPerfil.value = 'ADMIN';
  const painel = document.getElementById('painel-acesso-negado');
  if (painel) painel.style.display = 'none';
  const conteudo = document.getElementById('conteudo-analitico-admin');
  if (conteudo) conteudo.style.display = 'block';
  consultarHistoricoVendas();
}

async function consultarHistoricoVendas() {
  const t0Local = performance.now();
  const inputInicio = document.getElementById('filtro-data-inicio');
  const inputFim = document.getElementById('filtro-data-fim');
  const selectPerfil = document.getElementById('select-perfil-acesso');

  const dataInicio = inputInicio ? inputInicio.value : '2026-01-01';
  const dataFim = inputFim ? inputFim.value : '2026-12-31';
  const perfil = selectPerfil ? selectPerfil.value : 'ADMIN';

  // Coleta as categorias marcadas
  const checkboxes = document.querySelectorAll('.check-categoria:checked');
  const categoriasSelecionadas = Array.from(checkboxes).map(cb => cb.value);

  // Cenário 7: Se perfil for CLIENTE ou não-admin, demonstrar bloqueio de acesso
  const painelNegado = document.getElementById('painel-acesso-negado');
  const conteudoAdmin = document.getElementById('conteudo-analitico-admin');

  try {
    const params = new URLSearchParams();
    params.set('dataInicio', dataInicio);
    params.set('dataFim', dataFim);
    params.set('perfil', perfil);
    if (categoriasSelecionadas.length > 0) {
      params.set('categorias', categoriasSelecionadas.join(','));
    }

    const res = await fetch(`/api/analise/historico-categorias?${params.toString()}`, {
      headers: {
        'X-User-Role': perfil
      }
    });

    const tempoLocalMs = Math.round(performance.now() - t0Local);

    if (res.status === 403) {
      // Acesso negado para não-administradores (RF0055, Critério 3.b)
      if (painelNegado) painelNegado.style.display = 'block';
      if (conteudoAdmin) conteudoAdmin.style.display = 'none';
      atualizarBadgeTempoResposta(tempoLocalMs);
      return;
    }

    if (!res.ok) {
      throw new Error(`Erro HTTP ${res.status}`);
    }

    const dados = await res.json();
    ultimosDadosAnalise = dados;

    if (painelNegado) painelNegado.style.display = 'none';
    if (conteudoAdmin) conteudoAdmin.style.display = 'block';

    // RNF0011: Atualiza badge de tempo de resposta (< 1s)
    const tempoFinal = dados.tempoRespostaMs || tempoLocalMs;
    atualizarBadgeTempoResposta(tempoFinal);

    // Atualiza KPIs
    atualizarKpis(dados);

    // RNF0043: Renderiza o gráfico de linhas
    renderizarGraficoLinhas(dados);

    // Renderiza a tabela comparativa numérica
    renderizarTabelaComparativa(dados);

  } catch (err) {
    console.error('Erro ao consultar histórico de vendas:', err);
  }
}

function atualizarBadgeTempoResposta(ms) {
  const badge = document.getElementById('badge-tempo-resposta');
  if (!badge) return;
  const ok = ms <= 1000;
  badge.textContent = `⚡ Tempo de resposta: ${ms}ms (RNF0011: ${ok ? 'CONFORME <= 1s' : 'NÃO CONFORME'})`;
  badge.style.background = ok ? '#eff6ff' : '#fef2f2';
  badge.style.color = ok ? '#1e40af' : '#991b1b';
  badge.style.borderColor = ok ? '#bfdbfe' : '#fecaca';
}

function atualizarKpis(dados) {
  const elFaturamento = document.getElementById('kpi-faturamento-total');
  const elEntregues = document.getElementById('kpi-pedidos-entregues');
  const elIgnorados = document.getElementById('kpi-pedidos-ignorados');
  const elQtdCat = document.getElementById('kpi-qtd-categorias');
  const elMesLider = document.getElementById('kpi-mes-lider');
  const elMesLiderVal = document.getElementById('kpi-mes-lider-valor');
  const badgePeriodo = document.getElementById('badge-chart-periodo');

  if (elFaturamento) {
    elFaturamento.textContent = Number(dados.totalGeral || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  if (elEntregues) {
    elEntregues.textContent = dados.totalPedidosEntreguesContabilizados || 0;
  }

  if (elIgnorados) {
    elIgnorados.textContent = `${dados.pedidosIgnoradosNaoEntregues || 0} compras não-entregues ignoradas`;
  }

  if (elQtdCat) {
    elQtdCat.textContent = dados.series ? dados.series.length : 0;
  }

  if (badgePeriodo && dados.periodo) {
    badgePeriodo.textContent = `${dados.periodo.dataInicio} até ${dados.periodo.dataFim}`;
  }

  // Calcula o mês com maior faturamento
  let mesLider = '--/----';
  let maiorValor = 0;
  if (dados.totaisPorMes) {
    Object.entries(dados.totaisPorMes).forEach(([mes, val]) => {
      if (val > maiorValor) {
        maiorValor = val;
        mesLider = mes;
      }
    });
  }
  if (elMesLider) elMesLider.textContent = mesLider;
  if (elMesLiderVal) elMesLiderVal.textContent = maiorValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * RNF0043: Gráfico de linhas
 * Eixo horizontal (X): períodos (mês/ano)
 * Eixo vertical (Y): valor total de vendas em reais (R$)
 * RNF0045: Legenda inferior identificando cada categoria e sua cor
 * RNF0046: Tooltip com valor exato ao passar o cursor sobre os pontos
 */
function renderizarGraficoLinhas(dados) {
  const canvas = document.getElementById('grafico-linhas-historico');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  if (chartInstancia) {
    chartInstancia.destroy();
  }

  const datasets = (dados.series || []).map(serie => {
    return {
      label: serie.categoria,
      data: serie.dadosPorMes,
      borderColor: serie.cor,
      backgroundColor: 'transparent',
      borderWidth: 2.8,
      tension: 0.25,
      pointRadius: 5,
      pointHoverRadius: 8,
      pointBackgroundColor: serie.cor,
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2
    };
  });

  chartInstancia = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dados.meses || [],
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom', // RNF0045
          labels: {
            boxWidth: 14,
            padding: 18,
            font: { family: 'Inter', size: 12, weight: 600 }
          }
        },
        tooltip: {
          enabled: true, // RNF0046
          backgroundColor: '#0f172a',
          titleFont: { family: 'Inter', size: 12, weight: 700 },
          bodyFont: { family: 'Inter', size: 12 },
          padding: 12,
          callbacks: {
            label: function(context) {
              const val = context.parsed.y || 0;
              return `${context.dataset.label}: ${val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Período (mês/ano)',
            font: { weight: 700 }
          },
          grid: { color: '#f1f5f9' }
        },
        y: {
          title: {
            display: true,
            text: 'Valor Total de Vendas (R$)',
            font: { weight: 700 }
          },
          ticks: {
            callback: function(value) {
              return 'R$ ' + value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
            }
          },
          grid: { color: '#f1f5f9' },
          beginAtZero: true
        }
      }
    }
  });
}

function renderizarTabelaComparativa(dados) {
  const thead = document.getElementById('tabela-analise-head');
  const tbody = document.getElementById('tabela-analise-body');
  const tfoot = document.getElementById('tabela-analise-foot');

  if (!thead || !tbody || !tfoot) return;

  const categorias = (dados.series || []).map(s => s.categoria);
  const meses = dados.meses || [];

  // Cabeçalho
  thead.innerHTML = `
    <tr>
      <th style="width: 140px;">Mês / Ano</th>
      ${categorias.map(cat => `<th style="text-align: right;">${cat}</th>`).join('')}
      <th style="text-align: right; background: #f1f5f9; color: var(--palette-navy-dark);">Total do Mês (R$)</th>
    </tr>
  `;

  // Linhas por mês
  tbody.innerHTML = meses.map((mes, idx) => {
    let totalMes = 0;
    const colunasValores = (dados.series || []).map(s => {
      const v = s.dadosPorMes[idx] || 0;
      totalMes += v;
      return `
        <td style="text-align: right; font-family: monospace; font-size: 0.9rem;">
          ${v > 0 ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '<span style="color: #94a3b8;">-</span>'}
        </td>
      `;
    }).join('');

    return `
      <tr>
        <td style="font-weight: 700; color: #1e293b; font-family: monospace; font-size: 0.92rem;">${mes}</td>
        ${colunasValores}
        <td style="text-align: right; font-weight: 800; color: #065f46; background: #f0fdf4; font-family: monospace;">
          ${totalMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </td>
      </tr>
    `;
  }).join('');

  // Rodapé com somas por categoria
  const colunasTotais = (dados.series || []).map(s => {
    return `<td style="text-align: right; font-weight: 800; font-family: monospace;">${(s.totalCategoria || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>`;
  }).join('');

  tfoot.innerHTML = `
    <tr>
      <td>TOTAL GERAL</td>
      ${colunasTotais}
      <td style="text-align: right; font-size: 1rem; color: #065f46;">
        ${Number(dados.totalGeral || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </td>
    </tr>
  `;
}

function exportarCsv() {
  if (!ultimosDadosAnalise) return;
  const d = ultimosDadosAnalise;
  const categorias = d.series.map(s => s.categoria);
  
  let csv = 'Mes/Ano;' + categorias.join(';') + ';Total Mes\n';
  d.meses.forEach((mes, idx) => {
    let soma = 0;
    const vals = d.series.map(s => {
      const v = s.dadosPorMes[idx] || 0;
      soma += v;
      return v.toFixed(2);
    });
    csv += `${mes};` + vals.join(';') + `;${soma.toFixed(2)}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `historico_vendas_categorias_${Date.now()}.csv`;
  link.click();
}

window.marcarTodasCategorias = marcarTodasCategorias;
window.restaurarPerfilAdmin = restaurarPerfilAdmin;
window.consultarHistoricoVendas = consultarHistoricoVendas;
