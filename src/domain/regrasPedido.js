/**
 * Regras de negócio puras (sem acesso a banco) da CRIAÇÃO DE PEDIDO.
 * Fonte única da verdade: usada pelo cálculo de frete, pela validação de
 * endereço/cartão/pagamento (prévia no checkout) e pela finalização da compra.
 *
 * Referências do DRS_LES_2_2026:
 *   RF0034 (frete) · RN0023 (endereço) · RN0024/RN0025 (cartão)
 *   RN0033 · RN0034 · RN0035 · RN0036 (regras de pagamento)
 *
 * Todos os cálculos monetários são feitos em CENTAVOS (inteiros) para evitar
 * erros de ponto flutuante.
 */

export class ErroNegocio extends Error {
  constructor(mensagem, detalhes = [], status = 422) {
    super(mensagem);
    this.name = 'ErroNegocio';
    this.detalhes = detalhes;
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Utilitários monetários
// ---------------------------------------------------------------------------
export const aCentavos = (valor) => Math.round(Number(valor) * 100);
export const deCentavos = (centavos) => Math.round(centavos) / 100;

export function formatarMoeda(centavos) {
  const reais = (Math.round(centavos) / 100).toFixed(2).replace('.', ',');
  return `R$ ${reais}`;
}

/** Aceita número ou texto ("57,25", "R$ 1.057,25", "57.25"). Retorna NaN se inválido. */
export function parseValorMonetario(entrada) {
  if (typeof entrada === 'number') return entrada;
  if (entrada === null || entrada === undefined) return NaN;
  let texto = String(entrada).replace(/R\$/gi, '').replace(/\s/g, '');
  if (texto === '') return NaN;
  if (texto.includes(',')) {
    texto = texto.replace(/\./g, '').replace(',', '.');
  }
  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : NaN;
}

// ---------------------------------------------------------------------------
// RF0034 — Cálculo de frete
// O DRS não define a fórmula; critério adotado (explicado na apresentação):
//   frete = tarifa-base da REGIÃO do estado do endereço
//         + R$ 3,00 por kg do peso total dos itens (peso unitário × quantidade)
// ---------------------------------------------------------------------------
export const VALOR_POR_KG_CENTAVOS = 300;

const REGIOES = {
  SUDESTE: { ufs: ['SP', 'RJ', 'MG', 'ES'], baseCentavos: 1000 },
  SUL: { ufs: ['PR', 'SC', 'RS'], baseCentavos: 1400 },
  'CENTRO-OESTE': { ufs: ['DF', 'GO', 'MT', 'MS'], baseCentavos: 1600 },
  NORDESTE: { ufs: ['BA', 'SE', 'AL', 'PE', 'PB', 'RN', 'CE', 'PI', 'MA'], baseCentavos: 2000 },
  NORTE: { ufs: ['AC', 'AM', 'AP', 'PA', 'RO', 'RR', 'TO'], baseCentavos: 2500 }
};

export const UFS = Object.values(REGIOES).flatMap((r) => r.ufs);

/**
 * @param {{pesoKg:number, quantidade:number}[]} itens
 * @param {string} uf
 */
export function calcularFrete(itens, uf) {
  const sigla = String(uf || '').trim().toUpperCase();
  const entrada = Object.entries(REGIOES).find(([, regiao]) => regiao.ufs.includes(sigla));
  if (!entrada) {
    throw new ErroNegocio('Não foi possível calcular o frete: estado (UF) do endereço inválido.', [
      `UF "${uf ?? ''}" não reconhecida.`
    ]);
  }
  const [nomeRegiao, regiao] = entrada;
  const pesoTotalKg =
    Math.round(itens.reduce((soma, i) => soma + Number(i.pesoKg || 0) * Number(i.quantidade || 0), 0) * 1000) / 1000;
  const variavelCentavos = Math.round(pesoTotalKg * VALOR_POR_KG_CENTAVOS);
  const centavos = regiao.baseCentavos + variavelCentavos;

  return {
    centavos,
    valor: deCentavos(centavos),
    regiao: nomeRegiao,
    uf: sigla,
    pesoTotalKg,
    baseCentavos: regiao.baseCentavos,
    criterio:
      `Região ${nomeRegiao} (${sigla}): tarifa-base ${formatarMoeda(regiao.baseCentavos)} + ` +
      `${formatarMoeda(VALOR_POR_KG_CENTAVOS)} por kg × ${pesoTotalKg.toFixed(3).replace('.', ',')} kg ` +
      `= ${formatarMoeda(centavos)}`
  };
}

// ---------------------------------------------------------------------------
// RN0023 — Composição obrigatória do endereço
// ---------------------------------------------------------------------------
const CAMPOS_ENDERECO = [
  ['frase_identificadora', 'Frase identificadora'],
  ['tipo_residencia', 'Tipo de residência'],
  ['tipo_logradouro', 'Tipo de logradouro'],
  ['logradouro', 'Logradouro'],
  ['numero', 'Número'],
  ['bairro', 'Bairro'],
  ['cep', 'CEP'],
  ['cidade', 'Cidade'],
  ['estado', 'Estado'],
  ['pais', 'País']
]; // "observações" é opcional

export function validarEndereco(endereco) {
  const erros = [];
  const e = endereco || {};
  CAMPOS_ENDERECO.forEach(([campo, rotulo]) => {
    if (e[campo] === undefined || e[campo] === null || String(e[campo]).trim() === '') {
      erros.push(`RN0023: o campo "${rotulo}" é obrigatório.`);
    }
  });
  if (e.cep && String(e.cep).replace(/\D/g, '').length !== 8) {
    erros.push('RN0023: o CEP deve conter 8 dígitos.');
  }
  if (e.estado && !UFS.includes(String(e.estado).trim().toUpperCase())) {
    erros.push('RN0023: informe a sigla (UF) de um estado brasileiro válido.');
  }
  return erros;
}

// ---------------------------------------------------------------------------
// RN0024 / RN0025 — Composição do cartão e bandeiras homologadas
// ---------------------------------------------------------------------------
export const BANDEIRAS_HOMOLOGADAS = ['VISA', 'MASTERCARD', 'ELO', 'AMERICAN EXPRESS'];

export function validarCartao(cartao) {
  const erros = [];
  const c = cartao || {};
  const digitos = String(c.numero ?? '').replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(digitos)) {
    erros.push('RN0024: o número do cartão deve conter de 13 a 19 dígitos.');
  }
  if (!c.nome_impresso || String(c.nome_impresso).trim() === '') {
    erros.push('RN0024: o nome impresso no cartão é obrigatório.');
  }
  if (!c.bandeira || String(c.bandeira).trim() === '') {
    erros.push('RN0024: a bandeira do cartão é obrigatória.');
  } else if (!BANDEIRAS_HOMOLOGADAS.includes(String(c.bandeira).trim().toUpperCase())) {
    erros.push(
      `RN0025: bandeira "${c.bandeira}" não homologada. Aceitas: ${BANDEIRAS_HOMOLOGADAS.join(', ')}.`
    );
  }
  if (!/^\d{3,4}$/.test(String(c.cvv ?? ''))) {
    erros.push('RN0024: o código de segurança (CVV) deve conter 3 ou 4 dígitos.');
  }
  return erros;
}

// ---------------------------------------------------------------------------
// RN0033 · RN0034 · RN0035 · RN0036 — Regras de pagamento
// ---------------------------------------------------------------------------
export const VALOR_MINIMO_CARTAO_CENTAVOS = 1000;

/**
 * @param {object}   p
 * @param {number}   p.totalCentavos  subtotal dos itens + frete
 * @param {{codigo:string,tipo:'PROMOCIONAL'|'TROCA',valorCentavos:number}[]} p.cupons
 * @param {{valorCentavos:number}[]} p.cartoes
 */
export function validarPagamento({ totalCentavos, cupons = [], cartoes = [] }) {
  const erros = [];

  // RN0033 — apenas um cupom promocional por compra
  const promocionais = cupons.filter((c) => c.tipo === 'PROMOCIONAL');
  if (promocionais.length > 1) {
    erros.push('RN0033: apenas um cupom promocional pode ser utilizado por compra.');
  }

  const somaCupons = cupons.reduce((soma, c) => soma + c.valorCentavos, 0);
  const valoresCartao = cartoes.map((c) => c.valorCentavos);
  const valoresValidos = valoresCartao.filter((v) => Number.isFinite(v) && v > 0);

  if (valoresValidos.length !== valoresCartao.length) {
    erros.push('Informe um valor maior que zero para cada cartão de crédito (ou remova o cartão).');
  }
  const somaCartoes = valoresValidos.reduce((soma, v) => soma + v, 0);

  let trocoCentavos = 0;

  if (somaCupons >= totalCentavos) {
    // RN0036 — não é permitido usar cupons desnecessários
    cupons.forEach((c) => {
      if (somaCupons - c.valorCentavos >= totalCentavos) {
        erros.push(
          `RN0036: o cupom ${c.codigo} (${formatarMoeda(c.valorCentavos)}) é desnecessário — ` +
            'os demais cupons já cobrem o valor da compra.'
        );
      }
    });
    if (cartoes.length > 0) {
      erros.push('Os cupons já cobrem o valor total da compra; remova os cartões de crédito do pagamento.');
    }
    // RN0036 — a diferença vira cupom de troca
    trocoCentavos = somaCupons - totalCentavos;
  } else {
    const restante = totalCentavos - somaCupons;

    if (cartoes.length === 0) {
      erros.push(`Informe o pagamento do valor ${somaCupons > 0 ? 'restante ' : ''}de ${formatarMoeda(restante)} com cartão de crédito.`);
    } else if (valoresValidos.length === valoresCartao.length && somaCartoes !== restante) {
      erros.push(
        `A soma dos cartões (${formatarMoeda(somaCartoes)}) deve ser igual ao valor ${somaCupons > 0 ? 'restante' : 'da compra'} (${formatarMoeda(restante)}).`
      );
    }

    // RN0034 — mínimo de R$ 10,00 por cartão.
    // RN0035 — exceção: combinando cupons + cartão, o único cartão pode pagar
    // o restante mesmo que seja inferior a R$ 10,00.
    const excecaoRN0035 = somaCupons > 0 && cartoes.length === 1;
    if (!excecaoRN0035) {
      valoresValidos.forEach((valor, indice) => {
        if (valor < VALOR_MINIMO_CARTAO_CENTAVOS) {
          erros.push(
            `RN0034: o cartão ${indice + 1} está com ${formatarMoeda(valor)}; o valor mínimo por cartão é R$ 10,00.`
          );
        }
      });
    }
  }

  return {
    valido: erros.length === 0,
    erros,
    totalCentavos,
    somaCuponsCentavos: somaCupons,
    somaCartoesCentavos: somaCartoes,
    restanteCentavos: Math.max(0, totalCentavos - somaCupons),
    trocoCentavos
  };
}
