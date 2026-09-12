// Estado global da sessão de checkout
const CUPONS_DISPONIVEIS_CLIENTE = [
  { codigo: 'PROMO10', tipo: 'PROMOCIONAL', valor: 10.00, descricao: '10% OFF - Boas-Vindas' },
  { codigo: 'TR-2026-88', tipo: 'TROCA', valor: 20.00, descricao: 'Crédito de Troca #TR-2026-88' },
  { codigo: 'TR-2026-99', tipo: 'TROCA', valor: 15.50, descricao: 'Crédito de Troca #TR-2026-99' }
];

let cuponsAplicados = [];
const subtotalPedido = 45.90;
let valorFrete = 0.00;

// Formatador monetário nativo do navegador
const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

document.addEventListener('DOMContentLoaded', () => {
  renderizarCuponsDisponiveis();
  configurarEventosCheckout();
  atualizarResumoFinanceiro();
});

function configurarEventosCheckout() {
  const btnAplicarManual = document.getElementById('btn-aplicar-cupom');
  if (btnAplicarManual) btnAplicarManual.addEventListener('click', aplicarCupomManual);

  const selectEndereco = document.getElementById('select-endereco-entrega');
  if (selectEndereco) selectEndereco.addEventListener('change', calcularFreteEndereco);

  const inputCartao1 = document.getElementById('input-valor-cartao1');
  const inputCartao2 = document.getElementById('input-valor-cartao2');

  if (inputCartao1) {
    inputCartao1.addEventListener('input', (e) => aplicarMascaraMoeda(e.target));
    inputCartao1.addEventListener('blur', () => balancearValoresCartoes(1));
  }

  if (inputCartao2) {
    inputCartao2.addEventListener('input', (e) => aplicarMascaraMoeda(e.target));
    inputCartao2.addEventListener('blur', () => balancearValoresCartoes(2));
  }
}

// Simulação de cálculo de frete por CEP/Endereço selecionado
function calcularFreteEndereco(e) {
  const endereco = e.target.value;
  
  if (endereco.includes('Paulista')) {
    valorFrete = 12.50;
  } else if (endereco.includes('Letras')) {
    valorFrete = 15.00;
  } else {
    valorFrete = 0.00;
  }

  const elValorFrete = document.getElementById('resumo-frete');
  if (elValorFrete) elValorFrete.textContent = currencyFormatter.format(valorFrete);

  atualizarResumoFinanceiro();
}

// Máscara monetária em tempo de digitação
function aplicarMascaraMoeda(input) {
  let valorLimpo = input.value.replace(/\D/g, '');
  if (!valorLimpo) valorLimpo = '0';

  const valorNumerico = parseFloat(valorLimpo) / 100;
  input.value = currencyFormatter.format(valorNumerico);
}

// Converte string BRL ("R$ 25,90") para número primitivo (25.90)
function parseMoedaParaNumero(textoMoeda) {
  if (!textoMoeda) return 0;
  const limpo = textoMoeda.replace(/[^\d,-]/g, '').replace(',', '.');
  return parseFloat(limpo) || 0;
}

// Garante auto-balanceamento entre Cartão 1 e Cartão 2 para igualar ao Total a Pagar
function balancearValoresCartoes(origemAlteracao) {
  const elTotalAPagar = document.getElementById('resumo-total-pagar');
  const inputCartao1 = document.getElementById('input-valor-cartao1');
  const inputCartao2 = document.getElementById('input-valor-cartao2');

  if (!elTotalAPagar || !inputCartao1 || !inputCartao2) return;

  const totalAPagar = parseMoedaParaNumero(elTotalAPagar.textContent);

  if (origemAlteracao === 1) {
    let valorC1 = parseMoedaParaNumero(inputCartao1.value);
    if (valorC1 > totalAPagar) valorC1 = totalAPagar;

    const valorC2 = Math.max(0, totalAPagar - valorC1);
    inputCartao1.value = currencyFormatter.format(valorC1);
    inputCartao2.value = currencyFormatter.format(valorC2);
  } else if (origemAlteracao === 2) {
    let valorC2 = parseMoedaParaNumero(inputCartao2.value);
    if (valorC2 > totalAPagar) valorC2 = totalAPagar;

    const valorC1 = Math.max(0, totalAPagar - valorC2);
    inputCartao2.value = currencyFormatter.format(valorC2);
    inputCartao1.value = currencyFormatter.format(valorC1);
  }
}

// Gerenciamento de Cupons e Descontos
function renderizarCuponsDisponiveis() {
  const containerDisponiveis = document.getElementById('container-cupons-disponiveis');
  if (!containerDisponiveis) return;

  containerDisponiveis.innerHTML = '';

  CUPONS_DISPONIVEIS_CLIENTE.forEach(cupom => {
    const jaAplicado = cuponsAplicados.some(c => c.codigo === cupom.codigo);
    const card = document.createElement('div');
    
    card.style.cssText = `display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border: 1px solid ${jaAplicado ? 'var(--palette-teal-dark)' : '#cbd5e1'}; background: ${jaAplicado ? '#f0fdf4' : '#ffffff'}; border-radius: 6px; margin-bottom: 6px; font-size: 0.85rem;`;
    card.innerHTML = `
      <div>
        <strong style="color: var(--palette-navy-dark);">${cupom.codigo}</strong>
        <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: bold; margin-left: 6px;">[${cupom.tipo}]</span>
        <span style="display: block; font-size: 0.75rem; color: var(--text-muted);">${cupom.descricao}</span>
      </div>
      <button type="button" onclick="toggleCupomDisponivel('${cupom.codigo}')" style="background: ${jaAplicado ? 'var(--palette-terracotta)' : 'var(--palette-teal-dark)'}; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.75rem;">
        ${jaAplicado ? 'Remover' : 'Usar este cupom'}
      </button>
    `;
    containerDisponiveis.appendChild(card);
  });
}

function toggleCupomDisponivel(codigo) {
  const jaAplicado = cuponsAplicados.some(c => c.codigo === codigo);
  if (jaAplicado) {
    removerCupom(codigo);
  } else {
    const cupom = CUPONS_DISPONIVEIS_CLIENTE.find(c => c.codigo === codigo);
    if (cupom) validarEAplicarCupom(cupom);
  }
}

function aplicarCupomManual() {
  const inputCupom = document.getElementById('input-codigo-cupom');
  if (!inputCupom) return;

  const codigo = inputCupom.value.trim().toUpperCase();
  if (!codigo) return alert('Digite o código do cupom.');

  let cupom = CUPONS_DISPONIVEIS_CLIENTE.find(c => c.codigo === codigo);
  if (!cupom && codigo === 'LIVRO10') {
    cupom = { codigo: 'LIVRO10', tipo: 'PROMOCIONAL', valor: 10.00, descricao: 'Cupom Promocional - R$ 10,00' };
  }

  if (!cupom) return alert('Cupom inválido ou não encontrado.');

  validarEAplicarCupom(cupom);
  inputCupom.value = '';
}

function validarEAplicarCupom(cupom) {
  if (cuponsAplicados.some(c => c.codigo === cupom.codigo)) {
    return alert('Este cupom já está aplicado.');
  }

  const possuiPromo = cuponsAplicados.some(c => c.tipo === 'PROMOCIONAL');
  const possuiTroca = cuponsAplicados.some(c => c.tipo === 'TROCA');

  if (cupom.tipo === 'PROMOCIONAL' && (possuiTroca || possuiPromo)) {
    return alert('⚠️ Não é possível combinar cupons promocionais com cupons de troca ou usar mais de 1 cupom promocional.');
  }

  if (cupom.tipo === 'TROCA' && possuiPromo) {
    return alert('⚠️ Não é possível utilizar cupons de troca com um cupom promocional ativo. Remova o promocional primeiro.');
  }

  cuponsAplicados.push(cupom);
  renderizarCuponsDisponiveis();
  renderizarCuponsAplicados();
  atualizarResumoFinanceiro();
}

function removerCupom(codigo) {
  cuponsAplicados = cuponsAplicados.filter(c => c.codigo !== codigo);
  renderizarCuponsDisponiveis();
  renderizarCuponsAplicados();
  atualizarResumoFinanceiro();
}

function renderizarCuponsAplicados() {
  const containerAplicados = document.getElementById('lista-cupons-aplicados');
  if (!containerAplicados) return;

  containerAplicados.innerHTML = '';
  if (cuponsAplicados.length === 0) {
    containerAplicados.innerHTML = '<small style="color: var(--text-muted); font-style: italic;">Nenhum cupom aplicado.</small>';
    return;
  }

  cuponsAplicados.forEach(cupom => {
    const div = document.createElement('div');
    div.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: #dcfce7; color: #166534; padding: 6px 10px; border-radius: 4px; margin-bottom: 4px; font-size: 0.8rem;';
    div.innerHTML = `
      <span>🏷️ <strong>${cupom.codigo}</strong> [${cupom.tipo}] (- ${currencyFormatter.format(cupom.valor)})</span>
      <button type="button" onclick="removerCupom('${cupom.codigo}')" style="background: none; border: none; color: #b91c1c; font-weight: bold; cursor: pointer;">✕</button>
    `;
    containerAplicados.appendChild(div);
  });
}

function atualizarResumoFinanceiro() {
  const totalDescontoCupons = cuponsAplicados.reduce((acc, c) => acc + c.valor, 0);
  const totalBruto = subtotalPedido + valorFrete;
  const totalAPagar = Math.max(0, totalBruto - totalDescontoCupons);

  const elDescontoCupons = document.getElementById('resumo-desconto-cupons');
  const elTotalPagar = document.getElementById('resumo-total-pagar');

  if (elDescontoCupons) elDescontoCupons.textContent = `- ${currencyFormatter.format(totalDescontoCupons)}`;
  if (elTotalPagar) elTotalPagar.textContent = currencyFormatter.format(totalAPagar);

  balancearValoresCartoes(1);
}