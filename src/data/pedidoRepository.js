import { getSupabase } from './supabaseClient.js';
import { registrarLogs } from './logRepository.js';
import * as R from '../domain/regrasPedido.js';

const { ErroNegocio } = R;

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------
function db() {
  const cliente = getSupabase();
  if (!cliente) {
    throw new ErroNegocio('Banco de dados não configurado (SUPABASE_URL / SUPABASE_KEY).', [], 500);
  }
  return cliente;
}

function falhar(error, contexto) {
  if (error) throw new Error(`${contexto}: ${error.message}`);
}

const hojeLocal = () => new Date().toLocaleDateString('sv-SE'); // AAAA-MM-DD (horário local)
const ehUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v ?? ''));

function consolidarItens(entrada) {
  if (!Array.isArray(entrada) || entrada.length === 0) {
    throw new ErroNegocio('O carrinho está vazio.', ['Adicione ao menos um livro ao carrinho.']);
  }
  const mapa = new Map();
  for (const item of entrada) {
    const quantidade = Number(item?.quantidade);
    const idRef = item?.livroId || item?.id || item?.codigo;
    const ehValido = ehUuid(idRef) || (typeof idRef === 'string' && /^LIV-\d+$/i.test(idRef.trim()));
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
  const ids = itens.map((i) => i.livroId);

  const uuids = ids.filter(ehUuid);
  const codigos = ids.filter(id => !ehUuid(id));

  let queryLivros = db().from('livros').select('id,codigo,titulo,autor,preco_venda,peso_kg,status,capa_url');
  if (uuids.length > 0 && codigos.length > 0) {
    queryLivros = queryLivros.or(`id.in.(${uuids.join(',')}),codigo.in.(${codigos.join(',')})`);
  } else if (uuids.length > 0) {
    queryLivros = queryLivros.in('id', uuids);
  } else {
    queryLivros = queryLivros.in('codigo', codigos);
  }

  const rLivros = await queryLivros;
  falhar(rLivros.error, 'livros');

  const todosLivroUuids = (rLivros.data || []).map(l => l.id);
  const rEstoque = await db().from('estoque').select('livro_id,quantidade,quantidade_bloqueada').in('livro_id', todosLivroUuids);
  falhar(rEstoque.error, 'estoque');
  falhar(rLivros.error, 'livros');
  falhar(rEstoque.error, 'estoque');

  const livros = new Map();
  (rLivros.data || []).forEach(l => {
    livros.set(l.id, l);
    if (l.codigo) livros.set(l.codigo, l);
  });
  const estoques = new Map(rEstoque.data.map((e) => [e.livro_id, e]));

  const resultado = itens.map(({ livroId, quantidade }) => {
    const livro = livros.get(livroId);
    if (!livro) {
      return { livroId, quantidade, ok: false, titulo: null, disponivel: 0, mensagem: 'Livro não encontrado.' };
    }
    const est = estoques.get(livro.id);
    const disponivel = est ? Math.max(0, Number(est.quantidade) - Number(est.quantidade_bloqueada || 0)) : 0;
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
      return { ...base, ok: false, mensagem: 'Livro indisponível em estoque.' };
    }
    if (quantidade > disponivel) {
      return {
        ...base,
        ok: false,
        mensagem: `Quantidade solicitada (${quantidade}) superior ao estoque disponível (${disponivel}).`
      };
    }
    return { ...base, ok: true, mensagem: 'Disponível.' };
  });

  return { ok: resultado.every((i) => i.ok), itens: resultado };
}

// ---------------------------------------------------------------------------
// RF0034 — Frete
// ---------------------------------------------------------------------------
async function resolverUf({ enderecoId, uf, estado }) {
  if (enderecoId) {
    if (!ehUuid(enderecoId)) throw new ErroNegocio('Endereço inválido.', ['Identificador de endereço inválido.']);
    const { data, error } = await db().from('enderecos').select('estado').eq('id', enderecoId).maybeSingle();
    falhar(error, 'endereço');
    if (!data) throw new ErroNegocio('Endereço de entrega não encontrado.', []);
    return data.estado;
  }
  return (uf || estado || "").toString().trim().toUpperCase() || null;
}

export async function calcularFreteItens({ itens, enderecoId, uf, estado, cep }) {
  const validacao = await validarItens(itens);
  const siglaUf = await resolverUf({ enderecoId, uf, estado });
  if (!siglaUf) throw new ErroNegocio('Informe o endereço de entrega para calcular o frete.', []);
  const frete = R.calcularFrete(validacao.itens, siglaUf);
  return { ...frete, itens: validacao.itens };
}

// ---------------------------------------------------------------------------
// Cupons
// ---------------------------------------------------------------------------
async function resolverCupons(codigos, clienteId, erros) {
  const unicos = [...new Set((codigos || []).map((c) => String(c).trim().toUpperCase()).filter(Boolean))];
  if (unicos.length === 0) return [];

  const { data, error } = await db().from('cupons').select('*').in('codigo', unicos);
  falhar(error, 'cupons');

  const hoje = hojeLocal();
  const porCodigo = new Map((data || []).map((c) => [c.codigo, c]));
  const cupons = [];
  for (const codigo of unicos) {
    const c = porCodigo.get(codigo);
    if (!c) erros.push(`Cupom ${codigo} inexistente.`);
    else if (c.utilizado) erros.push(`Cupom ${codigo} já foi utilizado.`);
    else if (c.data_validade && c.data_validade < hoje) erros.push(`Cupom ${codigo} está vencido.`);
    else if (c.cliente_id && c.cliente_id !== clienteId) erros.push(`Cupom ${codigo} não pertence ao cliente.`);
    else cupons.push({ id: c.id, codigo: c.codigo, tipo: c.tipo, valorCentavos: R.aCentavos(c.valor) });
  }
  return cupons;
}

// ---------------------------------------------------------------------------
// Avaliação consolidada da compra (usada pela prévia e pela finalização)
// ---------------------------------------------------------------------------
async function avaliarCompra({ cliente, itens, uf, cuponsCodigos = [], cartoesValores = [] }) {
  const erros = [];

  const validacao = await validarItens(itens);
  validacao.itens.filter((i) => !i.ok).forEach((i) => erros.push(`${i.titulo || i.livroId}: ${i.mensagem}`));

  const subtotalCentavos = validacao.itens.reduce((s, i) => s + R.aCentavos(i.precoUnitario) * i.quantidade, 0);
  const frete = uf ? R.calcularFrete(validacao.itens, uf) : null;
  const totalCentavos = subtotalCentavos + (frete ? frete.centavos : 0);

  const cupons = await resolverCupons(cuponsCodigos, cliente?.id, erros);
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
// Dados do cliente para o checkout (endereços, cartões e cupons do PERFIL)
// ---------------------------------------------------------------------------
async function carregarClienteAtivo(referencia) {
  const coluna = ehUuid(referencia) ? 'id' : 'codigo';
  const { data, error } = await db().from('clientes').select('id,codigo,nome,status').eq(coluna, referencia).maybeSingle();
  falhar(error, 'cliente');
  if (!data) throw new ErroNegocio('Cliente não encontrado.', [], 404);
  if (data.status !== 'ATIVO') throw new ErroNegocio('Cliente inativo não pode realizar compras.', []);
  return data;
}

export async function listarClientesAtivos() {
  const { data, error } = await db().from('clientes').select('id,codigo,nome').eq('status', 'ATIVO').order('codigo');
  falhar(error, 'clientes');
  return data || [];
}

const porCriacao = (a, b) => String(a.created_at).localeCompare(String(b.created_at));

export async function obterDadosCheckout(referencia) {
  const coluna = ehUuid(referencia) ? 'id' : 'codigo';
  const [rCliente, rPromocionais] = await Promise.all([
    db()
      .from('clientes')
      .select('id,codigo,nome,status,enderecos(*),cartoes(*),cupons(*)')
      .eq(coluna, referencia)
      .maybeSingle(),
    db().from('cupons').select('*').is('cliente_id', null).eq('utilizado', false)
  ]);
  falhar(rCliente.error, 'cliente');
  falhar(rPromocionais.error, 'cupons promocionais');
  if (!rCliente.data) throw new ErroNegocio('Cliente não encontrado.', [], 404);

  const c = rCliente.data;
  const hoje = hojeLocal();

  // Somente o que pertence ao PERFIL; remove duplicatas idênticas do seed de testes
  const vistosEnd = new Set();
  const enderecos = (c.enderecos || [])
    .filter((e) => e.no_perfil !== false)
    .sort(porCriacao)
    .filter((e) => {
      const chave = [e.frase_identificadora, e.logradouro, e.numero, e.cep].join('|');
      if (vistosEnd.has(chave)) return false;
      vistosEnd.add(chave);
      return true;
    });

  const vistosCartao = new Set();
  const cartoes = (c.cartoes || [])
    .filter((card) => card.no_perfil !== false)
    .sort(porCriacao)
    .filter((card) => {
      if (vistosCartao.has(card.numero)) return false;
      vistosCartao.add(card.numero);
      return true;
    })
    .map((card) => ({
      id: card.id,
      bandeira: card.bandeira,
      final: String(card.numero).replace(/\D/g, '').slice(-4),
      nome_impresso: card.nome_impresso,
      preferencial: Boolean(card.preferencial)
    }));

  const cupons = [...(c.cupons || []), ...(rPromocionais.data || [])]
    .filter((cp) => !cp.utilizado && (!cp.data_validade || cp.data_validade >= hoje))
    .sort((a, b) => Number(b.valor) - Number(a.valor))
    .map((cp) => ({ codigo: cp.codigo, tipo: cp.tipo, valor: Number(cp.valor) }));

  return { cliente: { id: c.id, codigo: c.codigo, nome: c.nome, status: c.status }, id: c.id, codigo: c.codigo, nome: c.nome, status: c.status, enderecos, cartoes, cupons };
}

// ---------------------------------------------------------------------------
// RF0033 / RF0038 — Criação do pedido (caminho feliz completo)
// ---------------------------------------------------------------------------
async function resolverEndereco(cliente, entrada) {
  if (!entrada) {
    throw new ErroNegocio('Selecione ou cadastre um endereço de entrega.', ['RF0035: endereço de entrega obrigatório.']);
  }
  if (entrada.id) {
    if (!ehUuid(entrada.id)) throw new ErroNegocio('Endereço inválido.', []);
    const { data, error } = await db()
      .from('enderecos')
      .select('*')
      .eq('id', entrada.id)
      .eq('cliente_id', cliente.id)
      .maybeSingle();
    falhar(error, 'endereço');
    if (!data) throw new ErroNegocio('Endereço de entrega não pertence ao cliente.', []);
    return { registro: data, novo: false };
  }
  if (entrada.novo) {
    const erros = R.validarEndereco(entrada.novo);
    if (erros.length) throw new ErroNegocio('Endereço de entrega inválido (RN0023).', erros);
    return {
      novo: true,
      salvarNoPerfil: entrada.salvarNoPerfil !== false,
      dados: entrada.novo
    };
  }
  throw new ErroNegocio('Selecione ou cadastre um endereço de entrega.', ['RF0035: endereço de entrega obrigatório.']);
}

async function resolverCartoes(cliente, lista) {
  const resolvidos = [];
  const erros = [];
  const idsUsados = new Set();

  for (const [indice, entrada] of (lista || []).entries()) {
    const rotulo = `Cartão ${indice + 1}`;
    const valorCentavos = R.aCentavos(R.parseValorMonetario(entrada.valor));
    if (entrada.cartaoId) {
      if (idsUsados.has(entrada.cartaoId)) {
        erros.push(`${rotulo}: o mesmo cartão foi informado mais de uma vez.`);
        continue;
      }
      idsUsados.add(entrada.cartaoId);
      if (!ehUuid(entrada.cartaoId)) {
        erros.push(`${rotulo}: identificador de cartão inválido.`);
        continue;
      }
      const { data, error } = await db()
        .from('cartoes')
        .select('id,numero,bandeira')
        .eq('id', entrada.cartaoId)
        .eq('cliente_id', cliente.id)
        .maybeSingle();
      falhar(error, 'cartão');
      if (!data) erros.push(`${rotulo}: cartão não pertence ao cliente.`);
      else resolvidos.push({ id: data.id, novo: false, valorCentavos });
    } else if (entrada.novo) {
      const errosCartao = R.validarCartao(entrada.novo).map((e) => `${rotulo}: ${e}`);
      erros.push(...errosCartao);
      if (!errosCartao.length) {
        resolvidos.push({
          novo: true,
          dados: entrada.novo,
          salvarNoPerfil: entrada.salvarNoPerfil !== false,
          valorCentavos
        });
      }
    } else {
      erros.push(`${rotulo}: selecione um cartão cadastrado ou informe um novo cartão.`);
    }
  }
  if (erros.length) throw new ErroNegocio('Forma de pagamento inválida (RN0024/RN0025).', erros);
  return resolvidos;
}

export async function criarPedido(body) {
  const cliente = await carregarClienteAtivo(body.clienteId ?? body.clienteCodigo);

  // Normalização de formatos flexíveis (payload plano ou aninhado)
  const enderecoEntrada = body.endereco || {
    id: body.enderecoEntregaId || body.enderecoId,
    novo: body.novoEndereco,
    salvarNoPerfil: body.salvarNovoEnderecoNoPerfil
  };

  let cuponsEntrada = Array.isArray(body.pagamento?.cupons) ? [...body.pagamento.cupons] : (Array.isArray(body.cupons) ? [...body.cupons] : []);
  let cartoesEntrada = Array.isArray(body.pagamento?.cartoes) ? [...body.pagamento.cartoes] : (Array.isArray(body.cartoes) ? [...body.cartoes] : []);

  if (Array.isArray(body.pagamentos)) {
    body.pagamentos.forEach(p => {
      if (p.tipo === 'CUPOM') {
        cuponsEntrada.push(p.cupomCodigo || p.codigo);
      } else if (p.tipo === 'CARTAO') {
        cartoesEntrada.push({
          cartaoId: p.cartaoId || p.id,
          novo: p.novoCartao,
          salvarNoPerfil: p.salvarNovoCartaoNoPerfil,
          valor: p.valor || (p.valorCentavos ? p.valorCentavos / 100 : 0)
        });
      }
    });
  }

  // 1) Entradas validadas ANTES de qualquer escrita
  const endereco = await resolverEndereco(cliente, enderecoEntrada);
  const cartoes = await resolverCartoes(cliente, cartoesEntrada);
  const uf = endereco.novo ? String(endereco.dados.estado).trim().toUpperCase() : endereco.registro.estado;

  const avaliacao = await avaliarCompra({
    cliente,
    itens: body.itens,
    uf,
    cuponsCodigos: cuponsEntrada,
    cartoesValores: cartoes.map((c) => c.valorCentavos / 100)
  });
  if (avaliacao.erros.length) {
    throw new ErroNegocio('Não foi possível finalizar a compra.', avaliacao.erros);
  }

  // 2) Escritas (com compensação em caso de falha)
  const criados = { enderecoId: null, cartoesIds: [], pedidoId: null, cuponsUsadosIds: [], cupomTrocaId: null };
  const logs = [];
  const log = (operacao, entidade, registroId, detalhes) =>
    logs.push({ usuario: cliente.codigo, operacao, entidade, registroId, detalhes });
  const client = db();

  try {
    // Endereço novo (RF0035) — incorporado ao perfil conforme escolha do cliente
    let enderecoId;
    if (endereco.novo) {
      const n = endereco.dados;
      const { data, error } = await client
        .from('enderecos')
        .insert({
          cliente_id: cliente.id,
          frase_identificadora: n.frase_identificadora.trim(),
          tipo_residencia: n.tipo_residencia.trim(),
          tipo_logradouro: n.tipo_logradouro.trim(),
          logradouro: n.logradouro.trim(),
          numero: String(n.numero).trim(),
          bairro: n.bairro.trim(),
          cep: n.cep.trim(),
          cidade: n.cidade.trim(),
          estado: uf,
          pais: n.pais.trim(),
          observacoes: n.observacoes ? String(n.observacoes).trim() : null,
          finalidade: 'ENTREGA',
          no_perfil: endereco.salvarNoPerfil
        })
        .select()
        .single();
      falhar(error, 'inserir endereço');
      enderecoId = data.id;
      criados.enderecoId = data.id;
      log('INSERT', 'enderecos', data.id, { origem: 'checkout', no_perfil: endereco.salvarNoPerfil });
    } else {
      enderecoId = endereco.registro.id;
    }

    // Cartões novos (RF0036)
    const cartoesPagamento = [];
    for (const c of cartoes) {
      if (!c.novo) {
        cartoesPagamento.push({ id: c.id, valorCentavos: c.valorCentavos });
        continue;
      }
      const digitos = String(c.dados.numero).replace(/[\s-]/g, '');
      const { data, error } = await client
        .from('cartoes')
        .insert({
          cliente_id: cliente.id,
          numero: digitos.replace(/(\d{4})(?=\d)/g, '$1 '),
          nome_impresso: c.dados.nome_impresso.trim().toUpperCase(),
          bandeira: String(c.dados.bandeira).trim().toUpperCase(),
          cvv: String(c.dados.cvv),
          preferencial: false,
          no_perfil: c.salvarNoPerfil
        })
        .select('id')
        .single();
      falhar(error, 'inserir cartão');
      criados.cartoesIds.push(data.id);
      cartoesPagamento.push({ id: data.id, valorCentavos: c.valorCentavos });
      log('INSERT', 'cartoes', data.id, { origem: 'checkout', no_perfil: c.salvarNoPerfil });
    }

    // Pedido (RF0038) — status inicial EM PROCESSAMENTO
    const pedidoId = `PED-${new Date().getFullYear()}-${String(Date.now()).slice(-8)}`;
    const descontoCentavos = Math.min(avaliacao.pagamento.somaCuponsCentavos, avaliacao.totalCentavos);
    const { data: pedido, error: errPedido } = await client
      .from('pedidos')
      .insert({
        id: pedidoId,
        cliente_id: cliente.id,
        endereco_entrega_id: enderecoId,
        data: hojeLocal(),
        valor_subtotal: R.deCentavos(avaliacao.subtotalCentavos),
        valor_frete: R.deCentavos(avaliacao.frete.centavos),
        valor_desconto: R.deCentavos(descontoCentavos),
        valor_total: R.deCentavos(avaliacao.totalCentavos),
        status: 'EM PROCESSAMENTO'
      })
      .select()
      .single();
    falhar(errPedido, 'inserir pedido');
    criados.pedidoId = pedidoId;
    log('INSERT', 'pedidos', pedidoId, {
      status: 'EM PROCESSAMENTO',
      total: R.deCentavos(avaliacao.totalCentavos),
      frete: R.deCentavos(avaliacao.frete.centavos)
    });

    const itensPedido = avaliacao.validacao.itens.map((i) => ({
      pedido_id: pedidoId,
      livro_id: i.livroId,
      titulo_livro: i.titulo,
      autor: i.autor,
      quantidade: i.quantidade,
      preco_unitario: i.precoUnitario,
      status_item: 'EM PROCESSAMENTO'
    }));
    const { error: errItens } = await client.from('itens_pedido').insert(itensPedido);
    falhar(errItens, 'inserir itens do pedido');
    log('INSERT', 'itens_pedido', pedidoId, { itens: itensPedido.length });

    // Pagamentos: cupons + cartões (validação do pagamento é fase posterior)
    const pagamentos = [
      ...avaliacao.cupons.map((c) => ({
        pedido_id: pedidoId,
        forma_pagamento: c.tipo === 'TROCA' ? 'CUPOM_TROCA' : 'CUPOM_PROMOCIONAL',
        cupom_id: c.id,
        valor: R.deCentavos(c.valorCentavos),
        status: 'PENDENTE'
      })),
      ...cartoesPagamento.map((c) => ({
        pedido_id: pedidoId,
        forma_pagamento: 'CARTAO_CREDITO',
        cartao_id: c.id,
        valor: R.deCentavos(c.valorCentavos),
        status: 'PENDENTE'
      }))
    ];
    const { error: errPag } = await client.from('pagamentos_pedido').insert(pagamentos);
    falhar(errPag, 'inserir pagamentos');
    log('INSERT', 'pagamentos_pedido', pedidoId, { formas: pagamentos.length });

    // Cupons utilizados
    if (avaliacao.cupons.length) {
      const ids = avaliacao.cupons.map((c) => c.id);
      const { error: errCup } = await client.from('cupons').update({ utilizado: true }).in('id', ids);
      falhar(errCup, 'baixar cupons');
      criados.cuponsUsadosIds = ids;
      avaliacao.cupons.forEach((c) => log('UPDATE', 'cupons', c.codigo, { utilizado: true, pedido: pedidoId }));
    }

    // RN0036 — cupom de troca para a diferença
    let cupomTroca = null;
    if (avaliacao.pagamento.trocoCentavos > 0) {
      const codigo = `TR-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;
      const { data, error } = await client
        .from('cupons')
        .insert({
          codigo,
          tipo: 'TROCA',
          valor: R.deCentavos(avaliacao.pagamento.trocoCentavos),
          cliente_id: cliente.id,
          utilizado: false,
          pedido_origem_id: pedidoId
        })
        .select()
        .single();
      falhar(error, 'gerar cupom de troca');
      criados.cupomTrocaId = data.id;
      cupomTroca = { codigo: data.codigo, valor: Number(data.valor) };
      log('INSERT', 'cupons', codigo, { tipo: 'TROCA', valor: cupomTroca.valor, pedido_origem: pedidoId });
    }

    await registrarLogs(logs);

    return {
      pedido: {
        id: pedido.id,
        status: pedido.status,
        data: pedido.data,
        valor_subtotal: Number(pedido.valor_subtotal),
        valor_frete: Number(pedido.valor_frete),
        valor_desconto: Number(pedido.valor_desconto),
        valor_total: Number(pedido.valor_total)
      },
      itens: itensPedido,
      pagamentos,
      cupomTroca,
      frete: { valor: avaliacao.frete.valor, criterio: avaliacao.frete.criterio }
    };
  } catch (err) {
    await compensar(criados);
    throw err;
  }
}

/** Desfaz escritas parciais caso a criação do pedido falhe no meio do caminho. */
async function compensar(criados) {
  const client = db();
  try {
    if (criados.cupomTrocaId) await client.from('cupons').delete().eq('id', criados.cupomTrocaId);
    if (criados.cuponsUsadosIds.length) {
      await client.from('cupons').update({ utilizado: false }).in('id', criados.cuponsUsadosIds);
    }
    if (criados.pedidoId) await client.from('pedidos').delete().eq('id', criados.pedidoId);
    if (criados.cartoesIds.length) await client.from('cartoes').delete().in('id', criados.cartoesIds);
    if (criados.enderecoId) await client.from('enderecos').delete().eq('id', criados.enderecoId);
  } catch (e) {
    console.error('Falha ao compensar criação de pedido:', e.message);
  }
}

// ---------------------------------------------------------------------------
// Carga prévia de cupons (a geração de cupons está fora do escopo desta fase)
// ---------------------------------------------------------------------------
export async function cadastrarCupom({ codigo, tipo, valor, clienteId, dataValidade }) {
  const erros = [];
  const cod = String(codigo || '').trim().toUpperCase();
  const valorNum = R.parseValorMonetario(valor);
  if (!cod) erros.push('Código do cupom é obrigatório.');
  if (!['PROMOCIONAL', 'TROCA'].includes(tipo)) erros.push('Tipo deve ser PROMOCIONAL ou TROCA.');
  if (!Number.isFinite(valorNum) || valorNum <= 0) erros.push('Valor do cupom deve ser maior que zero.');
  if (clienteId && !ehUuid(clienteId)) erros.push('clienteId inválido.');
  if (erros.length) throw new ErroNegocio('Cupom inválido.', erros);

  let data, error;
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    try {
      const res = await db()
        .from('cupons')
        .insert({
          codigo: cod,
          tipo,
          valor: valorNum,
          cliente_id: clienteId || null,
          utilizado: false,
          data_validade: dataValidade || null
        })
        .select()
        .single();
      data = res.data;
      error = res.error;
      if (!error) break;
      if (error.code === '23505') throw new ErroNegocio(`Já existe um cupom com o código ${cod}.`, [], 409);
    } catch (e) {
      if (e instanceof ErroNegocio) throw e;
      error = e;
    }
    if (tentativa < 3) {
      await new Promise(r => setTimeout(r, 200 * tentativa));
    }
  }
  if (error) {
    if (error.code === '23505') throw new ErroNegocio(`Já existe um cupom com o código ${cod}.`, [], 409);
    throw new Error(error.message || String(error));
  }
  await registrarLogs([{ usuario: 'carga-previa', operacao: 'INSERT', entidade: 'cupons', registroId: cod, detalhes: { tipo, valor: valorNum } }]);
  return data;
}
