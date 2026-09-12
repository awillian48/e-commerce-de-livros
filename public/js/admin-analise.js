// Base de dados simulada de vendas com datas específicas para filtragem
const vendasMock = [
  { id: '1001', data: '2026-08-01', valor: 145.90, categoria: 'Literatura Brasileira' },
  { id: '1002', data: '2026-08-10', valor: 89.90, categoria: 'Engenharia de Software' },
  { id: '1003', data: '2026-08-15', valor: 210.00, categoria: 'Filosofia' },
  { id: '1004', data: '2026-08-28', valor: 58.00, categoria: 'Literatura Brasileira' },
  { id: '1005', data: '2026-08-31', valor: 310.50, categoria: 'Obras Raras' },
  { id: '1006', data: '2026-08-31', valor: 45.90, categoria: 'Literatura Brasileira' }
];

let meuGraficoVendas = null;

document.addEventListener('DOMContentLoaded', () => {
  inicializarDatasPadrao();
  configurarEventosFiltro();
  aplicarFiltroEAtualizarDashboard();
});

// Define o intervalo padrão do mês atual
function inicializarDatasPadrao() {
  const hoje = new Date();
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  document.getElementById('filtro-data-inicio').value = primeiroDiaMes.toISOString().split('T')[0];
  document.getElementById('filtro-data-fim').value = hoje.toISOString().split('T')[0];
}

function configurarEventosFiltro() {
  document.getElementById('btn-aplicar-filtro').addEventListener('click', aplicarFiltroEAtualizarDashboard);
  document.getElementById('select-preset-periodo').addEventListener('change', aplicarPresetData);
}

// Lógica para preenchimento automático via seletores rápidos
function aplicarPresetData(e) {
  const preset = e.target.value;
  const hoje = new Date();
  const inputInicio = document.getElementById('filtro-data-inicio');
  const inputFim = document.getElementById('filtro-data-fim');

  let dataInicio = new Date();

  if (preset === 'HOJE') {
    dataInicio = hoje;
  } else if (preset === '7_DIAS') {
    dataInicio.setDate(hoje.getDate() - 7);
  } else if (preset === 'MES_ATUAL') {
    dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  } else if (preset === 'CUSTOM') {
    return; // Mantém as datas digitadas pelo operador
  }

  inputInicio.value = dataInicio.toISOString().split('T')[0];
  inputFim.value = hoje.toISOString().split('T')[0];
  aplicarFiltroEAtualizarDashboard();
}

function aplicarFiltroEAtualizarDashboard() {
  const strInicio = document.getElementById('filtro-data-inicio').value;
  const strFim = document.getElementById('filtro-data-fim').value;

  if (!strInicio || !strFim) {
    alert('Por favor, selecione ambas as datas para filtrar.');
    return;
  }

  // Filtragem estrita baseada no intervalo [strInicio, strFim]
  const vendasFiltradas = vendasMock.filter(venda => {
    return venda.data >= strInicio && venda.data <= strFim;
  });

  recalcularKpis(vendasFiltradas);
  renderizarGrafico(vendasFiltradas);
}

function recalcularKpis(vendas) {
  const totalFaturamento = vendas.reduce((acc, v) => acc + v.valor, 0);
  const totalPedidos = vendas.length;
  const ticketMedio = totalPedidos > 0 ? totalFaturamento / totalPedidos : 0;

  document.getElementById('kpi-faturamento').textContent = `R$ ${totalFaturamento.toFixed(2).replace('.', ',')}`;
  document.getElementById('kpi-pedidos').textContent = totalPedidos;
  document.getElementById('kpi-ticket-medio').textContent = `R$ ${ticketMedio.toFixed(2).replace('.', ',')}`;
}

function renderizarGrafico(vendas) {
  const ctx = document.getElementById('grafico-faturamento-canvas').getContext('2d');

  // Agrupa os valores por data específica dentro do período
  const faturamentoPorData = {};
  vendas.forEach(venda => {
    faturamentoPorData[venda.data] = (faturamentoPorData[venda.data] || 0) + venda.valor;
  });

  const labels = Object.keys(faturamentoPorData).sort();
  const dataValues = labels.map(data => faturamentoPorData[data]);

  if (meuGraficoVendas) {
    meuGraficoVendas.destroy(); // Destrói instância anterior
  }

  meuGraficoVendas = new Chart(ctx, {
    type: 'line', // <-- Alterado de 'bar' para 'line'
    data: {
      labels: labels.length > 0 ? labels : ['Sem dados no período'],
      datasets: [{
        label: 'Faturamento Diário (R$)',
        data: dataValues.length > 0 ? dataValues : [0],
        borderColor: '#2a9d8f', // Cor da linha principal
        backgroundColor: 'rgba(42, 157, 143, 0.2)', // Cor de preenchimento suave abaixo da linha
        borderWidth: 2,
        tension: 0.3, // Curvatura para suavizar a linha (Bezier curve)
        fill: true, // Habilita o preenchimento sob a linha
        pointBackgroundColor: '#1b2a47', // Cor dos pontos de dados
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true }
      },
      scales: {
        y: {
          beginAtZero: true // Garante que o eixo Y comece do zero para não distorcer a percepção visual
        }
      }
    }
  });
}