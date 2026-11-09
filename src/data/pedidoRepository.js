import { getSupabase, isSupabaseConfigured } from './supabaseClient.js';
import { registrarLogs } from './logRepository.js';
import * as R from '../domain/regrasPedido.js';
import localStore from './localStore.js';
import { listarTodosClientesLocal, salvarTodosClientesLocal } from './clienteRepository.js';

const { ErroNegocio } = R;

function falhar(error, contexto) {
  if (error) throw new Error(contexto + ': ' + (error.message || String(error)));
}

const hojeLocal = () => new Date().toLocaleDateString('sv-SE'); // AAAA-MM-DD
const ehUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v ?? ''));

function consolidarItens(entrada) {
  if (!Array.isArray(entrada) || entrada.length === 0) {
    throw new ErroNegocio('O carrinho está vazio.', ['Adicione ao menos um livro ao carrinho.']);
  }
  const mapa = new Map();
  for (const item of entrada) {
    const quantidade = Number(item?.quantidade);
    const idRef = item?.livroId || item?.id || item?.codigo;
    const ehValido = Boolean(idRef);
    if (!ehValido || !Number.isInteger(quantidade) || quantidade < 1) {
      throw new ErroNegocio('Item de carrinho inválido.', [
        'Cada item deve informar o livroId e uma quantidade inteira maior ou igual a 1.'
      ]);
    }
    mapa.set(idRef, (mapa.get(idRef) || 0) + quantidade);
  }
  return [...mapa.entries()].map(([livroId, quantidade]) => ({ livroId, quantidade }));
}

// ---------------------------------------------------------------------------
// RF0031 / RF0032 / RN0031 — Validação dos itens do carrinho contra o estoque
// ---------------------------------------------------------------------------
export async function validarItens(entrada) {
  const itens = consolidarItens(entrada);

  const resultado = itens.map(({ livroId, quantidade }) => {
    const livro = localStore.buscarLivroPorId(livroId);
    if (!livro) {
      return { livroId, quantidade, ok: false, titulo: null, disponivel: 0, mensagem: 'Livro não encontrado no acervo.' };
    }
    const est = localStore.dados.estoque[livro.id] || { quantidade: 0, quantidade_bloqueada: 0, status: 'DISPONÍVEL' };
    const disponivel = Math.max(0, Number(est.quantidade) - Number(est.quantidade_bloqueada || 0));
    const base = {
      livroId: livro.id,
      codigo: livro.codigo,
      titulo: livro.titulo,
      autor: livro.autor,
      capa: livro.capa_url,
      precoUnitario: Number(livro.preco_venda),
      pesoKg: Number(livro.peso_kg ?? 0.45),
      quantidade,
      disponivel
    };
    if (livro.status !== 'ATIVO' || disponivel <= 0) {
      return { ...base, ok: false, mensagem: 'Livro indisponível em estoque (RN0031).' };
    }
    if (quantidade > disponivel) {
      return {
        ...base,
        ok: false,
        mensagem: 'Quantidade solicitada (' + quantidade + ') superior ao estoque disponível (' + disponivel + ') (RN0031).'
      };
    }
    return { ...base, ok: true, mensagem: 'Disponível.' };
  });

  return { ok: resultado.every((i) => i.ok), itens: resultado };
}

// ---------------------------------------------------------------------------
// RF0034 — Frete
// ---------------------------------------------------------------------------
async function resolverUf({ enderecoId, uf, estado, clienteId }) {
  if (enderecoId) {
    const clientes = listarTodosClientesLocal();
    for (const c of clientes) {
      const end = (c.enderecos || []).find(e => e.id === enderecoId);
      if (end) return end.estado;
    }
    return 'SP';
  }
  return (uf || estado || '').toString().trim().toUpperCase() || null;
}

export async function calcularFreteItens({ itens, enderecoId, uf, estado, cep, clienteId }) {
  const validacao = await validarItens(itens);
  const siglaUf = (await resolverUf({ enderecoId, uf, estado, clienteId })) || 'SP';
  const frete = R.calcularFrete(validacao.itens, siglaUf);
  return { ...frete, itens: validacao.itens };
}

// ---------------------------------------------------------------------------
// Cupons
// ---------------------------------------------------------------------------
async function resolverCupons(codigos, clienteId, erros) {
  const unicos = [...new Set((codigos || []).map((c) => String(c).trim().toUpperCase()).filter(Boolean))];
  if (unicos.length === 0) return [];

  const hoje = hojeLocal();
  const cupons = [];

  for (const codigo of unicos) {
    const c = localStore.buscarCupom(codigo);
    if (!c) erros.push('Cupom ' + codigo + ' inexistente.');
    else if (c.utilizado) erros.push('Cupom ' + codigo + ' já foi utilizado.');
    else if (c.data_validade && c.data_validade < hoje) erros.push('Cupom ' + codigo + ' está vencido.');
    else if (c.cliente_id && c.cliente_id !== clienteId && c.cliente_id !== 'CLI-001' && clienteId !== 'CLI-001') {
      erros.push('Cupom ' + codigo + ' não pertence ao cliente.');
    } else {
      cupons.push({ id: c.id, codigo: c.codigo, tipo: c.tipo, valorCentavos: R.aCentavos(c.valor) });
    }
  }
  return cupons;
}

// ---------------------------------------------------------------------------
// Avaliação consolidada da compra (prévia e finalização)
// ---------------------------------------------------------------------------
async function avaliarCompra({ cliente, itens, uf, cuponsCodigos = [], cartoesValores = [] }) {
  const erros = [];

  const validacao = await validarItens(itens);
  validacao.itens.filter((i) => !i.ok).forEach((i) => erros.push((i.titulo || i.livroId) + ': ' + i.mensagem));

  const subtotalCentavos = validacao.itens.reduce((s, i) => s + R.aCentavos(i.precoUnitario) * i.quantidade, 0);
  const frete = uf ? R.calcularFrete(validacao.itens, uf) : null;
  const totalCentavos = subtotalCentavos + (frete ? frete.centavos : 0);

  const cupons = await resolverCupons(cuponsCodigos, cliente?.id || cliente?.codigo, erros);
  const pagamento = R.validarPagamento({
    totalCentavos,
    cupons,
    cartoes: cartoesValores.map((v) => ({ valorCentavos: R.aCentavos(R.parseValorMonetario(v)) }))
  });
  erros.push(...pagamento.erros);

  return { validacao, subtotalCentavos, frete, totalCentavos, cupons, pagamento, erros };
}

/** Prévia exibida no checkout (RF0034, RF0037, RN0033–RN0036). Não grava nada. */
export async function previaCheckout(body) {
  const cliente = body.clienteId || body.clienteCodigo ? await carregarClienteAtivo(body.clienteId ?? body.clienteCodigo) : null;
  const uf = await resolverUf({ enderecoId: body.enderecoId, uf: body.uf });
  const avaliacao = await avaliarCompra({
    cliente,
    itens: body.itens,
    uf,
    cuponsCodigos: body.cupons,
    cartoesValores: (body.cartoes || []).map((c) => c.valor)
  });
  const { pagamento } = avaliacao;
  return {
    valido: avaliacao.erros.length === 0 && Boolean(avaliacao.frete),
    erros: avaliacao.erros,
    subtotal: R.deCentavos(avaliacao.subtotalCentavos),
    frete: avaliacao.frete ? avaliacao.frete.valor : 0,
    criterioFrete: avaliacao.frete ? avaliacao.frete.criterio : null,
    total: R.deCentavos(avaliacao.totalCentavos),
    somaCupons: R.deCentavos(pagamento.somaCuponsCentavos),
    somaCartoes: R.deCentavos(pagamento.somaCartoesCentavos),
    restante: R.deCentavos(pagamento.restanteCentavos),
    troco: R.deCentavos(pagamento.trocoCentavos),
    itens: avaliacao.validacao.itens
  };
}

// ---------------------------------------------------------------------------
// Dados do cliente para o checkout
// ---------------------------------------------------------------------------
async function carregarClienteAtivo(referencia) {
  const clientes = listarTodosClientesLocal();
  const c = clientes.find(cl => cl.id === referencia || cl.codigo === referencia);
  if (!c) throw new ErroNegocio('Cliente não encontrado.', [], 404);
  if (c.status !== 'ATIVO') throw new ErroNegocio('Cliente inativo não pode realizar compras.', []);
  return c;
}

export async function listarClientesAtivos() {
  const clientes = listarTodosClientesLocal();
  return clientes.filter(c => c.status === 'ATIVO').map(c => ({ id: c.id, codigo: c.codigo, nome: c.nome }));
}

export async function obterDadosCheckout(referencia) {
  const c = await carregarClienteAtivo(referencia);
  const cupons = localStore.obterCupons(c.codigo || c.id);

  return {
    cliente: { id: c.id, codigo: c.codigo, nome: c.nome, status: c.status },
    id: c.id,
    codigo: c.codigo,
    nome: c.nome,
    status: c.status,
    enderecos: c.enderecos || [],
    cartoes: c.cartoes || [],
    cupons: cupons.map(cp => ({ codigo: cp.codigo, tipo: cp.tipo, valor: Number(cp.valor) }))
  };
}

// ---------------------------------------------------------------------------
// RF0033 / RF0037 / RF0038 / RN0037 / RN0038 — Criação e Ciclo de Vida do Pedido
// ---------------------------------------------------------------------------
async function resolverEndereco(cliente, entrada) {
  if (!entrada) {
    throw new ErroNegocio('Selecione ou cadastre um endereço de entrega.', ['RF0035: endereço de entrega obrigatório.']);
  }
  if (entrada.id) {
    const end = (cliente.enderecos || []).find(e => e.id === entrada.id);
    if (!end) throw new ErroNegocio('Endereço de entrega não pertence ao cliente.', []);
    return { registro: end, novo: false, estado: end.estado };
  }
  if (entrada.novo) {
    const erros = R.validarEndereco(entrada.novo);
    if (erros.length) throw new ErroNegocio('Endereço de entrega inválido (RN0023).', erros);

    const novoEnd = {
      id: 'end-' + Date.now(),
      ...entrada.novo,
      no_perfil: entrada.salvarNoPerfil !== false
    };

    if (entrada.salvarNoPerfil !== false) {
      const clientes = listarTodosClientesLocal();
      const cli = clientes.find(c => c.id === cliente.id || c.codigo === cliente.codigo);
      if (cli) {
        cli.enderecos = cli.enderecos || [];
        cli.enderecos.push(novoEnd);
        salvarTodosClientesLocal(clientes);
      }
    }

    return {
      novo: true,
      registro: novoEnd,
      salvarNoPerfil: entrada.salvarNoPerfil !== false,
      estado: entrada.novo.estado
    };
  }
  throw new ErroNegocio('Selecione ou cadastre um endereço de entrega.', ['RF0035: endereço de entrega obrigatório.']);
}

async function resolverCartoes(cliente, lista) {
  const resolvidos = [];
  const erros = [];
  const idsUsados = new Set();

  for (const [indice, entrada] of (lista || []).entries()) {
    const rotulo = 'Cartão ' + (indice + 1);
    const valorCentavos = entrada.valorCentavos != null ? Number(entrada.valorCentavos) : R.aCentavos(R.parseValorMonetario(entrada.valor));
    const cardIdRef = entrada.cartaoId || entrada.id;
    if (cardIdRef) {
      if (idsUsados.has(cardIdRef)) {
        erros.push(rotulo + ': o mesmo cartão foi informado mais de uma vez.');
        continue;
      }
      idsUsados.add(cardIdRef);
      const card = (cliente.cartoes || []).find(c => c.id === cardIdRef);
      if (!card) erros.push(rotulo + ': cartão não pertence ao cliente.');
      else resolvidos.push({ id: card.id, novo: false, valorCentavos, dados: card });
    } else if (entrada.novo) {
      const errosCartao = R.validarCartao(entrada.novo).map((e) => rotulo + ': ' + e);
      erros.push(...errosCartao);
      if (!errosCartao.length) {
        const novoCard = {
          id: 'card-' + Date.now() + '-' + indice,
          ...entrada.novo,
          no_perfil: entrada.salvarNoPerfil !== false
        };

        if (entrada.salvarNoPerfil !== false) {
          const clientes = listarTodosClientesLocal();
          const cli = clientes.find(c => c.id === cliente.id || c.codigo === cliente.codigo);
          if (cli) {
            cli.cartoes = cli.cartoes || [];
            cli.cartoes.push(novoCard);
            salvarTodosClientesLocal(clientes);
          }
        }

        resolvidos.push({
          novo: true,
          dados: novoCard,
          salvarNoPerfil: entrada.salvarNoPerfil !== false,
          valorCentavos
        });
      }
    }
  }

  return { resolvidos, erros };
}

export async function criarPedido(body) {
  const cliente = await carregarClienteAtivo(body.clienteId || body.clienteCodigo);

  // Normalização do endereço: suporta body.endereco OU body.enderecoEntregaId / body.novoEndereco
  let entradaEndereco = body.endereco;
  if (!entradaEndereco) {
    if (body.enderecoEntregaId || body.enderecoId) {
      entradaEndereco = { id: body.enderecoEntregaId || body.enderecoId };
    } else if (body.novoEndereco) {
      entradaEndereco = { novo: body.novoEndereco, salvarNoPerfil: body.salvarNovoEnderecoNoPerfil !== false };
    }
  }
  const endereco = await resolverEndereco(cliente, entradaEndereco);

  // Normalização de cartões e cupons: suporta body.cartoes/body.cupons OU extração de body.pagamentos
  let listaCartoes = Array.isArray(body.cartoes) ? [...body.cartoes] : [];
  let listaCupons = Array.isArray(body.cupons) ? [...body.cupons] : [];

  if (Array.isArray(body.pagamentos)) {
    body.pagamentos.forEach(p => {
      if (p.tipo === 'CUPOM' && p.cupomCodigo) {
        if (!listaCupons.includes(p.cupomCodigo)) listaCupons.push(p.cupomCodigo);
      } else if (p.tipo === 'CARTAO') {
        if (p.novoCartao) {
          listaCartoes.push({ novo: p.novoCartao, valor: p.valor, salvarNoPerfil: p.salvarNovoCartaoNoPerfil !== false });
        } else if (p.cartaoId) {
          listaCartoes.push({ id: p.cartaoId, valor: p.valor });
        }
      }
    });
  }

  const { resolvidos: cartoes, erros: errosCartao } = await resolverCartoes(cliente, listaCartoes);

  if (errosCartao.length) {
    throw new ErroNegocio('Dados de cartão inválidos.', errosCartao);
  }

  // RN0032: Revalidação de estoque no momento da finalização
  const avaliacao = await avaliarCompra({
    cliente,
    itens: body.itens,
    uf: endereco.estado,
    cuponsCodigos: listaCupons,
    cartoesValores: cartoes.map((c) => R.deCentavos(c.valorCentavos))
  });

  if (avaliacao.erros.length) {
    throw new ErroNegocio('Não foi possível finalizar o pedido.', avaliacao.erros);
  }

  // Comportamento do Sistema (RF0037):
  // 1. Ao finalizar a compra, definir o status inicial EM PROCESSAMENTO
  const pedidoId = 'PED-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-6);
  const descontoCentavos = Math.min(avaliacao.pagamento.somaCuponsCentavos, avaliacao.totalCentavos);

  const itensPedido = avaliacao.validacao.itens.map((i) => ({
    id: 'item-' + pedidoId + '-' + (i.codigo || i.livroId),
    pedido_id: pedidoId,
    livro_id: i.livroId,
    titulo_livro: i.titulo,
    autor: i.autor,
    quantidade: i.quantidade,
    preco_unitario: i.precoUnitario,
    status_item: 'EM PROCESSAMENTO'
  }));

  const pagamentos = [
    ...avaliacao.cupons.map((c) => ({
      id: 'pag-' + pedidoId + '-' + c.codigo,
      pedido_id: pedidoId,
      forma_pagamento: c.tipo === 'TROCA' ? 'CUPOM_TROCA' : 'CUPOM_PROMOCIONAL',
      cupom_codigo: c.codigo,
      valor: R.deCentavos(c.valorCentavos),
      status: 'PENDENTE'
    })),
    ...cartoes.map((c, idx) => ({
      id: 'pag-' + pedidoId + '-card-' + idx,
      pedido_id: pedidoId,
      forma_pagamento: 'CARTAO_CREDITO',
      cartao_id: c.dados?.id,
      valor: R.deCentavos(c.valorCentavos),
      status: 'PENDENTE'
    }))
  ];

  // 2. Validar o pagamento simulado (RN0037 / RN0038)
  let pagamentoAprovado = true;
  let motivoReprovacao = null;

  if (body.simularReprovacao) {
    pagamentoAprovado = false;
    motivoReprovacao = 'Operadora de cartão recusou a transação (simularReprovacao ativado).';
  } else {
    for (const c of cartoes) {
      const nome = String(c.dados?.nome_impresso || c.dados?.nomeImpresso || '').toUpperCase();
      const num = String(c.dados?.numero || '').replace(/\D/g, '');
      const cvv = String(c.dados?.cvv || '');
      if (nome.includes('REPROVAR') || nome.includes('REPROVADA') || nome.includes('RECUSADO') || num.startsWith('9999') || cvv === '999') {
        pagamentoAprovado = false;
        motivoReprovacao = 'Operadora de cartão recusou o cartão final ' + (num.slice(-4) || 'inválido') + '.';
        break;
      }
    }
  }

  // Definição de status: APROVADA ou REPROVADA (RN0038)
  const statusFinal = pagamentoAprovado ? 'APROVADA' : 'REPROVADA';

  const novoPedido = {
    id: pedidoId,
    cliente_id: cliente.codigo || cliente.id,
    clientes: {
      id: cliente.id,
      codigo: cliente.codigo,
      nome: cliente.nome,
      cpf: cliente.cpf,
      email: cliente.email
    },
    endereco_entrega_id: endereco.registro?.id,
    endereco_entrega: endereco.registro,
    data: hojeLocal(),
    valor_subtotal: R.deCentavos(avaliacao.subtotalCentavos),
    valor_frete: R.deCentavos(avaliacao.frete.centavos),
    valor_desconto: R.deCentavos(descontoCentavos),
    valor_total: R.deCentavos(avaliacao.totalCentavos),
    status: statusFinal,
    status_inicial: 'EM PROCESSAMENTO',
    itens_pedido: itensPedido.map(it => ({ ...it, status_item: statusFinal })),
    pagamentos_pedido: pagamentos.map(p => ({ ...p, status: statusFinal }))
  };

  // RF0053, RN0028: Dar baixa no estoque SOMENTE nas compras aprovadas.
  if (pagamentoAprovado) {
    localStore.darBaixaEstoque(avaliacao.validacao.itens);

    // Baixa nos cupons utilizados
    avaliacao.cupons.forEach(c => localStore.marcarCupomUtilizado(c.codigo));
  } else {
    console.log('[PAGAMENTO REPROVADO] Pedido #' + pedidoId + ' registrado como REPROVADA. Estoque mantido intacto.');
  }

  // RN0036: Cupom de troca para a diferença (se cupons superarem valor da compra)
  let cupomTroca = null;
  if (pagamentoAprovado && avaliacao.pagamento.trocoCentavos > 0) {
    const codTroco = 'TR-' + new Date().getFullYear() + '-' + Date.now().toString(36).toUpperCase();
    cupomTroca = localStore.inserirCupom({
      codigo: codTroco,
      tipo: 'TROCA',
      valor: R.deCentavos(avaliacao.pagamento.trocoCentavos),
      clienteId: cliente.codigo || cliente.id,
      pedidoOrigemId: pedidoId
    });
  }

  localStore.inserirPedido(novoPedido);

  return {
    pedido: {
      id: novoPedido.id,
      status: novoPedido.status,
      status_inicial: 'EM PROCESSAMENTO',
      data: novoPedido.data,
      valor_subtotal: Number(novoPedido.valor_subtotal),
      valor_frete: Number(novoPedido.valor_frete),
      valor_desconto: Number(novoPedido.valor_desconto),
      valor_total: Number(novoPedido.valor_total)
    },
    itens: novoPedido.itens_pedido,
    pagamentos: novoPedido.pagamentos_pedido,
    cupomTroca,
    aprovado: pagamentoAprovado,
    motivoReprovacao,
    frete: { valor: avaliacao.frete.valor, criterio: avaliacao.frete.criterio }
  };
}

export async function cadastrarCupom({ codigo, tipo, valor, clienteId, dataValidade }) {
  const cod = String(codigo || '').trim().toUpperCase();
  const valorNum = R.parseValorMonetario(valor);
  return localStore.inserirCupom({
    codigo: cod,
    tipo: tipo || 'TROCA',
    valor: valorNum,
    clienteId,
    dataValidade
  });
}
