// Estado global da sessão de checkout
const CUPONS_DISPONIVEIS_CLIENTE = [
  { codigo: 'PROMO10', tipo: 'PROMOCIONAL', valor: 10.00, descricao: '10% OFF - Boas-Vindas' },
  { codigo: 'TR-2026-88', tipo: 'TROCA', valor: 20.00, descricao: 'Crédito de Troca #TR-2026-88' },
  { codigo: 'TR-2026-99', tipo: 'TROCA', valor: 15.50, descricao: 'Crédito de Troca #TR-2026-99' }
];

let cuponsAplicados = [];
const subtotalPedido = 45.90;
let valorFrete = 0.00;

// Base de Cartões do Cliente no Checkout (1:N)
let cartoesCliente = [
  { id: 'c1', numero: '4321', numeroMascarado: '•••• •••• •••• 4321', bandeira: 'VISA', nome: 'CLIENTE ALEXANDRIA', preferencial: true },
  { id: 'c2', numero: '8765', numeroMascarado: '•••• •••• •••• 8765', bandeira: 'MASTERCARD', nome: 'CLIENTE ALEXANDRIA', preferencial: false }
];

// Formatador monetário nativo do navegador
const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

document.addEventListener('DOMContentLoaded', () => {
  carregarCartoesSalvos();
  renderizarSelectsCartoes();
  renderizarCuponsDisponiveis();
  configurarEventosCheckout();
  configurarMascaraNovoCartao();
  atualizarResumoFinanceiro();
});

// ============================================================================
// GERENCIAMENTO E CADASTRO DE CARTÕES NO CHECKOUT
// ============================================================================

function carregarCartoesSalvos() {
  try {
    const salvos = localStorage.getItem('alexandria_cartoes_checkout');
    if (salvos) {
      const parsed = JSON.parse(salvos);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cartoesCliente = parsed;
      }
    }
  } catch (err) {
    console.warn('Não foi possível restaurar cartões do localStorage:', err);
  }
}

function renderizarSelectsCartoes(selecionarNovoId = null) {
  const select1 = document.getElementById('select-cartao-1');
  const select2 = document.getElementById('select-cartao-2');

  if (!select1 || !select2) return;

  const valorAtual1 = selecionarNovoId || select1.value;
  const valorAtual2 = select2.value;

  select1.innerHTML = '';
  select2.innerHTML = '';

  // 1. Popula Select do Cartão 1
  cartoesCliente.forEach(card => {
    const opt = document.createElement('option');
    opt.value = card.id;
    opt.textContent = `${card.bandeira} final ${card.numero}${card.preferencial ? ' (Preferencial)' : ''}`;
    select1.appendChild(opt);
  });
  const optNovo1 = document.createElement('option');
  optNovo1.value = '__NOVO__';
  optNovo1.textContent = '+ Adicionar novo cartão...';
  select1.appendChild(optNovo1);

  // 2. Popula Select do Cartão 2 (Opcional para dividir o valor)
  const optVazio2 = document.createElement('option');
  optVazio2.value = '';
  optVazio2.textContent = 'Nenhum (pagar valor total no Cartão 1)';
  select2.appendChild(optVazio2);

  cartoesCliente.forEach(card => {
    const opt = document.createElement('option');
    opt.value = card.id;
    opt.textContent = `${card.bandeira} final ${card.numero}`;
    select2.appendChild(opt);
  });
  const optNovo2 = document.createElement('option');
  optNovo2.value = '__NOVO__';
  optNovo2.textContent = '+ Adicionar novo cartão...';
  select2.appendChild(optNovo2);

  // Define seleção no Cartão 1
  if (valorAtual1 && select1.querySelector(`option[value="${valorAtual1}"]`)) {
    select1.value = valorAtual1;
  } else if (cartoesCliente.length > 0) {
    const pref = cartoesCliente.find(c => c.preferencial) || cartoesCliente[0];
    select1.value = pref.id;
  }

  // Define seleção no Cartão 2
  if (valorAtual2 && select2.querySelector(`option[value="${valorAtual2}"]`)) {
    select2.value = valorAtual2;
  } else {
    select2.value = '';
  }

  balancearValoresCartoes(1);
}

function abrirModalNovoCartao() {
  const modal = document.getElementById('modal-novo-cartao-checkout');
  const form = document.getElementById('form-novo-cartao-checkout');
  const erro = document.getElementById('erro-novo-cartao');

  if (form) form.reset();
  if (erro) {
    erro.textContent = '';
    erro.style.display = 'none';
  }

  if (modal) {
    modal.style.display = 'flex';
    setTimeout(() => {
      const numInput = document.getElementById('novo-cartao-numero');
      if (numInput) numInput.focus();
    }, 60);
  }
}

function fecharModalNovoCartao() {
  const modal = document.getElementById('modal-novo-cartao-checkout');
  if (modal) modal.style.display = 'none';
}

function configurarMascaraNovoCartao() {
  const numInput = document.getElementById('novo-cartao-numero');
  const valInput = document.getElementById('novo-cartao-validade');
  const cvvInput = document.getElementById('novo-cartao-cvv');
  const selBandeira = document.getElementById('novo-cartao-bandeira');

  if (numInput) {
    numInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 16);
      e.target.value = v.replace(/(\d{4})(?=\d)/g, '$1 ');

      // Detecção inteligente de bandeira
      if (selBandeira && v.length >= 1) {
        if (v.startsWith('4')) selBandeira.value = 'VISA';
        else if (v.startsWith('5')) selBandeira.value = 'MASTERCARD';
        else if (v.startsWith('34') || v.startsWith('37')) selBandeira.value = 'AMERICAN EXPRESS';
        else if (v.startsWith('6')) selBandeira.value = 'ELO';
      }
    });
  }

  if (valInput) {
    valInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 4);
      if (v.length >= 3) {
        e.target.value = `${v.slice(0, 2)}/${v.slice(2)}`;
      } else {
        e.target.value = v;
      }
    });
  }

  if (cvvInput) {
    cvvInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
    });
  }
}

function salvarNovoCartaoCheckout(e) {
  e.preventDefault();
  const erro = document.getElementById('erro-novo-cartao');
  const numInput = document.getElementById('novo-cartao-numero');
  const nomeInput = document.getElementById('novo-cartao-nome');
  const bandeiraSelect = document.getElementById('novo-cartao-bandeira');
  const valInput = document.getElementById('novo-cartao-validade');
  const prefCheckbox = document.getElementById('novo-cartao-preferencial');

  const numeroLimpo = numInput.value.replace(/\D/g, '');
  if (numeroLimpo.length < 13 || numeroLimpo.length > 19) {
    if (erro) {
      erro.textContent = 'Por favor, insira um número de cartão de crédito válido (entre 13 e 16 dígitos).';
      erro.style.display = 'block';
    }
    return;
  }

  const partesValidade = valInput.value.split('/');
  if (partesValidade.length !== 2) {
    if (erro) {
      erro.textContent = 'Data de validade inválida. Utilize o formato MM/AA.';
      erro.style.display = 'block';
    }
    return;
  }
  const mes = parseInt(partesValidade[0], 10);
  if (isNaN(mes) || mes < 1 || mes > 12) {
    if (erro) {
      erro.textContent = 'Mês de validade inválido (digite um mês entre 01 e 12).';
      erro.style.display = 'block';
    }
    return;
  }

  const ultimosDigitos = numeroLimpo.slice(-4);
  const isPreferencial = prefCheckbox ? prefCheckbox.checked : false;

  if (isPreferencial) {
    cartoesCliente.forEach(c => c.preferencial = false);
  }

  const novoCard = {
    id: 'card_' + Date.now(),
    numero: ultimosDigitos,
    numeroMascarado: `•••• •••• •••• ${ultimosDigitos}`,
    bandeira: bandeiraSelect.value,
    nome: nomeInput.value.trim().toUpperCase(),
    preferencial: isPreferencial
  };

  // Se preferencial, adiciona no topo; senão, adiciona na lista
  if (isPreferencial) {
    cartoesCliente.unshift(novoCard);
  } else {
    cartoesCliente.push(novoCard);
  }

  try {
    localStorage.setItem('alexandria_cartoes_checkout', JSON.stringify(cartoesCliente));
  } catch (err) {
    console.warn('Não foi possível persistir no localStorage:', err);
  }

  fecharModalNovoCartao();
  renderizarSelectsCartoes(novoCard.id);

  const feedback = document.getElementById('badge-cartao-feedback');
  if (feedback) {
    feedback.textContent = `Cartão ${novoCard.bandeira} final ${ultimosDigitos} adicionado com sucesso!`;
    feedback.style.display = 'inline-block';
    setTimeout(() => {
      feedback.style.display = 'none';
    }, 4500);
  }
}

// ============================================================================
// EVENTOS DO CHECKOUT E CÁLCULO DE VALORES
// ============================================================================

function configurarEventosCheckout() {
  const btnAplicarManual = document.getElementById('btn-aplicar-cupom');
  if (btnAplicarManual) btnAplicarManual.addEventListener('click', aplicarCupomManual);

  const selectEndereco = document.getElementById('select-endereco-entrega');
  if (selectEndereco) selectEndereco.addEventListener('change', calcularFreteEndereco);

  const selectCartao1 = document.getElementById('select-cartao-1');
  const selectCartao2 = document.getElementById('select-cartao-2');

  if (selectCartao1) {
    selectCartao1.addEventListener('change', (e) => {
      if (e.target.value === '__NOVO__') {
        abrirModalNovoCartao();
        const pref = cartoesCliente.find(c => c.preferencial) || cartoesCliente[0];
        if (pref) e.target.value = pref.id;
      }
    });
  }

  if (selectCartao2) {
    selectCartao2.addEventListener('change', (e) => {
      if (e.target.value === '__NOVO__') {
        abrirModalNovoCartao();
        e.target.value = '';
      }
      
      const elTotal = document.getElementById('resumo-total-pagar');
      const inputC1 = document.getElementById('input-valor-cartao1');
      const inputC2 = document.getElementById('input-valor-cartao2');
      if (!elTotal || !inputC1 || !inputC2) return;

      const total = parseMoedaParaNumero(elTotal.textContent);

      if (!e.target.value) {
        // Se desmarcou cartão 2, zera e transfere tudo para o cartão 1
        inputC1.value = currencyFormatter.format(total);
        inputC2.value = currencyFormatter.format(0);
      } else {
        // Divide o pagamento igualmente entre os dois cartões
        const metade = Math.round((total / 2) * 100) / 100;
        const resto = Math.max(0, total - metade);
        inputC1.value = currencyFormatter.format(metade);
        inputC2.value = currencyFormatter.format(resto);
      }
    });
  }

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
  const selectCartao2 = document.getElementById('select-cartao-2');

  if (!elTotalAPagar || !inputCartao1 || !inputCartao2) return;

  const totalAPagar = parseMoedaParaNumero(elTotalAPagar.textContent);
  const temSegundoCartao = selectCartao2 && selectCartao2.value !== '';

  if (!temSegundoCartao) {
    inputCartao1.value = currencyFormatter.format(totalAPagar);
    inputCartao2.value = currencyFormatter.format(0);
    return;
  }

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

// ============================================================================
// GERENCIAMENTO DE CUPONS E DESCONTOS
// ============================================================================

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
    return alert('Não é possível combinar cupons promocionais com cupons de troca ou usar mais de 1 cupom promocional.');
  }

  if (cupom.tipo === 'TROCA' && possuiPromo) {
    return alert('Não é possível utilizar cupons de troca com um cupom promocional ativo. Remova o promocional primeiro.');
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
      <span><strong>${cupom.codigo}</strong> [${cupom.tipo}] (- ${currencyFormatter.format(cupom.valor)})</span>
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