import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import supabase, { isSupabaseConfigured } from './supabaseClient.js';

// Caminho do arquivo JSON de persistência local / fallback
const DATA_FILE = path.resolve('src/data/clientes.json');

// Bandeiras de cartão homologadas no sistema (RN0025)
export const BANDEIRAS_HOMOLOGADAS = ['VISA', 'MASTERCARD', 'ELO', 'AMERICAN EXPRESS'];

/**
 * Utilitário para gerar hash seguro de senha (RNF0033)
 */
export function gerarHashSenha(senha) {
  return crypto.createHash('sha256').update(senha).digest('hex');
}

/**
 * Validação de Senha Forte (RNF0031)
 * Regra: Mínimo 8 caracteres, pelo menos uma letra maiúscula,
 * uma minúscula e um caractere especial.
 */
export function validarSenhaForte(senha) {
  if (!senha || typeof senha !== 'string') return false;
  const temTamanhoMinimo = senha.length >= 8;
  const temMaiuscula = /[A-Z]/.test(senha);
  const temMinuscula = /[a-z]/.test(senha);
  const temEspecial = /[^A-Za-z0-9]/.test(senha);
  return temTamanhoMinimo && temMaiuscula && temMinuscula && temEspecial;
}

/**
 * Lê todos os clientes do arquivo JSON local (fallback)
 */
export function listarTodosClientesLocal() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, '[]', 'utf8');
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Erro ao ler clientes.json:', err);
    return [];
  }
}

/**
 * Salva a lista de clientes no arquivo JSON local
 */
export function salvarTodosClientesLocal(clientes) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(clientes, null, 2), 'utf8');
  } catch (err) {
    console.error('Erro ao salvar clientes.json:', err);
  }
}

/**
 * Converte registro relacional do Supabase para o modelo de domínio
 */
function mapearClienteSupabase(c) {
  const tel = Array.isArray(c.telefones) && c.telefones.length > 0 ? c.telefones[0] : null;
  return {
    id: c.codigo || c.id,
    uuid: c.id,
    codigo: c.codigo,
    nome: c.nome,
    cpf: c.cpf,
    email: c.email,
    senhaHash: c.senha_hash,
    telefone: tel ? {
      tipo: tel.tipo,
      ddd: tel.ddd,
      numero: tel.numero
    } : { tipo: 'CELULAR', ddd: '11', numero: '99999-9999' },
    dataNascimento: c.data_nascimento,
    genero: c.genero,
    ranking: c.ranking,
    status: c.status,
    enderecos: (c.enderecos || []).map(e => ({
      id: e.id,
      fraseIdentificadora: e.frase_identificadora,
      tipoResidencia: e.tipo_residencia,
      tipoLogradouro: e.tipo_logradouro,
      logradouro: e.logradouro,
      numero: e.numero,
      bairro: e.bairro,
      cep: e.cep,
      cidade: e.cidade,
      estado: e.estado,
      pais: e.pais,
      observacoes: e.observacoes || '',
      finalidade: e.finalidade
    })),
    cartoes: (c.cartoes || []).map(card => ({
      id: card.id,
      numero: card.numero,
      nomeImpresso: card.nome_impresso,
      bandeira: card.bandeira,
      cvv: card.cvv,
      preferencial: Boolean(card.preferencial)
    })),
    transacoes: (c.pedidos || []).map(p => ({
      id: p.id,
      data: p.data,
      valor: Number(p.valor_total),
      status: p.status,
      itens: (p.itens_pedido || []).map(item => item.titulo_livro)
    }))
  };
}

/**
 * Consulta de todos os clientes (com suporte a Supabase e fallback local)
 */
export async function listarTodosClientes() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select(`
          id,
          codigo,
          nome,
          cpf,
          email,
          senha_hash,
          data_nascimento,
          genero,
          ranking,
          status,
          telefones ( tipo, ddd, numero ),
          enderecos ( id, frase_identificadora, tipo_residencia, tipo_logradouro, logradouro, numero, bairro, cep, cidade, estado, pais, observacoes, finalidade ),
          cartoes ( id, numero, nome_impresso, bandeira, cvv, preferencial ),
          pedidos ( id, data, valor_total, status, itens_pedido ( titulo_livro, autor, quantidade, preco_unitario ) )
        `)
        .order('codigo', { ascending: true });

      if (error) {
        console.warn('⚠️ Supabase retornou erro na consulta. Utilizando fallback local:', error.message);
        return listarTodosClientesLocal();
      }

      if (data && data.length > 0) {
        return data.map(mapearClienteSupabase);
      }
    } catch (err) {
      console.warn('⚠️ Falha de comunicação com Supabase. Utilizando fallback local:', err.message);
      return listarTodosClientesLocal();
    }
  }

  return listarTodosClientesLocal();
}

/**
 * Gera o próximo código único de cliente (RNF0035)
 * Exemplo: CLI-001, CLI-002, CLI-003...
 */
function gerarProximoCodigo(clientes) {
  let maxId = 0;
  for (const c of clientes) {
    const num = parseInt(c.codigo?.replace('CLI-', '') || c.id?.replace('CLI-', '') || '0', 10);
    if (!isNaN(num) && num > maxId) maxId = num;
  }
  const proximo = maxId + 1;
  return `CLI-${String(proximo).padStart(3, '0')}`;
}

/**
 * RF0024 - Consulta de clientes com filtros combinados ou isolados
 */
export async function filtrarClientes({ nome, cpf, email, status, ranking, genero }) {
  const clientes = await listarTodosClientes();
  return clientes.filter(c => {
    let match = true;
    if (nome && !c.nome.toLowerCase().includes(nome.toLowerCase())) match = false;
    if (cpf && !c.cpf.replace(/\D/g, '').includes(cpf.replace(/\D/g, ''))) match = false;
    if (email && !c.email.toLowerCase().includes(email.toLowerCase())) match = false;
    if (status && c.status.toUpperCase() !== status.toUpperCase()) match = false;
    if (ranking && Number(c.ranking) !== Number(ranking)) match = false;
    if (genero && c.genero.toLowerCase() !== genero.toLowerCase()) match = false;
    return match;
  });
}

/**
 * Busca um cliente por ID ou Código
 */
export async function buscarClientePorId(id) {
  const clientes = await listarTodosClientes();
  return clientes.find(c => c.id === id || c.codigo === id || c.uuid === id);
}

/**
 * RF0021 - Cadastrar cliente com todas as RNs aplicadas
 */
export async function cadastrarCliente(dados) {
  const erros = [];

  // RN0026: Dados obrigatórios do cliente
  if (!dados.nome?.trim()) erros.push('Nome é obrigatório (RN0026).');
  if (!dados.cpf?.trim()) erros.push('CPF é obrigatório (RN0026).');
  if (!dados.email?.trim()) erros.push('E-mail é obrigatório (RN0026).');
  if (!dados.dataNascimento) erros.push('Data de nascimento é obrigatória (RN0026).');
  if (!dados.genero) erros.push('Gênero é obrigatório (RN0026).');

  // RN0026: Telefone composto por tipo, DDD e número
  if (!dados.telefone || !dados.telefone.tipo || !dados.telefone.ddd || !dados.telefone.numero) {
    erros.push('Telefone deve ser composto por tipo, DDD e número (RN0026).');
  }

  // RNF0031 e RNF0032: Senha forte e confirmação de senha
  if (!dados.senha) {
    erros.push('Senha é obrigatória (RN0026).');
  } else {
    if (!validarSenhaForte(dados.senha)) {
      erros.push('A senha deve ter no mínimo 8 caracteres, contendo letras maiúsculas, minúsculas e caractere especial (RNF0031).');
    }
    if (dados.senha !== dados.confirmacaoSenha) {
      erros.push('A confirmação de senha deve ser idêntica à senha digitada (RNF0032).');
    }
  }

  // RN0021 e RN0022: Endereços de cobrança e entrega obrigatórios
  const enderecos = Array.isArray(dados.enderecos) ? dados.enderecos : [];
  if (enderecos.length === 0) {
    erros.push('É obrigatório cadastrar ao menos um endereço (RN0021 e RN0022).');
  } else {
    const temEntrega = enderecos.some(e => e.finalidade === 'ENTREGA' || e.finalidade === 'AMBOS');
    const temCobranca = enderecos.some(e => e.finalidade === 'COBRANCA' || e.finalidade === 'AMBOS');
    if (!temEntrega) erros.push('É obrigatório o registro de ao menos um endereço de entrega (RN0022).');
    if (!temCobranca) erros.push('É obrigatório o registro de ao menos um endereço de cobrança (RN0021).');

    // RN0023: Composição dos endereços
    enderecos.forEach((end, idx) => {
      if (!end.fraseIdentificadora?.trim()) erros.push(`Endereço #${idx + 1}: Frase curta/identificador é obrigatório (RF0026).`);
      if (!end.tipoResidencia?.trim()) erros.push(`Endereço #${idx + 1}: Tipo de residência é obrigatório (RN0023).`);
      if (!end.tipoLogradouro?.trim()) erros.push(`Endereço #${idx + 1}: Tipo de logradouro é obrigatório (RN0023).`);
      if (!end.logradouro?.trim()) erros.push(`Endereço #${idx + 1}: Logradouro é obrigatório (RN0023).`);
      if (!end.numero?.trim()) erros.push(`Endereço #${idx + 1}: Número é obrigatório (RN0023).`);
      if (!end.bairro?.trim()) erros.push(`Endereço #${idx + 1}: Bairro é obrigatório (RN0023).`);
      if (!end.cep?.trim()) erros.push(`Endereço #${idx + 1}: CEP é obrigatório (RN0023).`);
      if (!end.cidade?.trim()) erros.push(`Endereço #${idx + 1}: Cidade é obrigatória (RN0023).`);
      if (!end.estado?.trim()) erros.push(`Endereço #${idx + 1}: Estado é obrigatório (RN0023).`);
    });
  }

  // RN0024 e RN0025: Composição e bandeiras dos cartões de crédito
  const cartoes = Array.isArray(dados.cartoes) ? dados.cartoes : [];
  if (cartoes.length > 0) {
    cartoes.forEach((card, idx) => {
      if (!card.numero?.trim()) erros.push(`Cartão #${idx + 1}: Número do cartão é obrigatório (RN0024).`);
      if (!card.nomeImpresso?.trim()) erros.push(`Cartão #${idx + 1}: Nome impresso é obrigatório (RN0024).`);
      if (!card.bandeira || !BANDEIRAS_HOMOLOGADAS.includes(card.bandeira.toUpperCase())) {
        erros.push(`Cartão #${idx + 1}: Bandeira inválida. Permitidas: ${BANDEIRAS_HOMOLOGADAS.join(', ')} (RN0025).`);
      }
      if (!card.cvv?.trim()) erros.push(`Cartão #${idx + 1}: Código de segurança (CVV) é obrigatório (RN0024).`);
    });

    // RF0027: Cartão preferencial
    const temPreferencial = cartoes.some(c => c.preferencial === true);
    if (!temPreferencial) {
      cartoes[0].preferencial = true;
    }
  }

  // Validação de CPF duplicado
  const clientesExistentes = await listarTodosClientes();
  const cpfLimpo = dados.cpf.replace(/\D/g, '');
  const jaExisteCpf = clientesExistentes.some(c => c.cpf.replace(/\D/g, '') === cpfLimpo);
  if (jaExisteCpf) erros.push('Já existe um cliente cadastrado com este CPF.');

  if (erros.length > 0) {
    const error = new Error('Falha de validação nas regras de negócio de cliente');
    error.detalhes = erros;
    error.statusCode = 400;
    throw error;
  }

  // RNF0035: Atribuição de código único de cliente
  const novoCodigo = gerarProximoCodigo(clientesExistentes);

  const novoCliente = {
    id: novoCodigo,
    codigo: novoCodigo,
    nome: dados.nome.trim(),
    cpf: dados.cpf.trim(),
    email: dados.email.trim(),
    senhaHash: gerarHashSenha(dados.senha),
    telefone: {
      tipo: dados.telefone.tipo.toUpperCase(),
      ddd: dados.telefone.ddd.trim(),
      numero: dados.telefone.numero.trim()
    },
    dataNascimento: dados.dataNascimento,
    genero: dados.genero,
    ranking: Number(dados.ranking) || 1, // RN0027: Ranking inicial
    status: 'ATIVO',
    enderecos: enderecos.map((end, i) => ({
      id: end.id || `end-${Date.now()}-${i}`,
      fraseIdentificadora: end.fraseIdentificadora.trim(),
      tipoResidencia: end.tipoResidencia.trim(),
      tipoLogradouro: end.tipoLogradouro.trim(),
      logradouro: end.logradouro.trim(),
      numero: end.numero.trim(),
      bairro: end.bairro.trim(),
      cep: end.cep.trim(),
      cidade: end.cidade.trim(),
      estado: end.estado.trim(),
      pais: end.pais ? end.pais.trim() : 'Brasil',
      observacoes: end.observacoes ? end.observacoes.trim() : '',
      finalidade: end.finalidade || 'ENTREGA'
    })),
    cartoes: cartoes.map((card, i) => ({
      id: card.id || `card-${Date.now()}-${i}`,
      numero: card.numero.trim(),
      nomeImpresso: card.nomeImpresso.trim(),
      bandeira: card.bandeira.toUpperCase(),
      cvv: card.cvv.trim(),
      preferencial: Boolean(card.preferencial)
    })),
    transacoes: []
  };

  // Se Supabase estiver conectado, persiste nas tabelas relacionais
  if (isSupabaseConfigured()) {
    try {
      const { data: clienteCriado, error: errCli } = await supabase
        .from('clientes')
        .insert({
          codigo: novoCliente.codigo,
          nome: novoCliente.nome,
          cpf: novoCliente.cpf,
          email: novoCliente.email,
          senha_hash: novoCliente.senhaHash,
          data_nascimento: novoCliente.dataNascimento,
          genero: novoCliente.genero,
          ranking: novoCliente.ranking,
          status: novoCliente.status
        })
        .select()
        .single();

      if (errCli) throw errCli;

      const clienteUUID = clienteCriado.id;
      novoCliente.uuid = clienteUUID;

      // Inserir telefone
      await supabase.from('telefones').insert({
        cliente_id: clienteUUID,
        tipo: novoCliente.telefone.tipo,
        ddd: novoCliente.telefone.ddd,
        numero: novoCliente.telefone.numero
      });

      // Inserir endereços
      if (novoCliente.enderecos.length > 0) {
        await supabase.from('enderecos').insert(
          novoCliente.enderecos.map(e => ({
            cliente_id: clienteUUID,
            frase_identificadora: e.fraseIdentificadora,
            tipo_residencia: e.tipoResidencia,
            tipo_logradouro: e.tipoLogradouro,
            logradouro: e.logradouro,
            numero: e.numero,
            bairro: e.bairro,
            cep: e.cep,
            cidade: e.cidade,
            estado: e.estado,
            pais: e.pais,
            observacoes: e.observacoes,
            finalidade: e.finalidade
          }))
        );
      }

      // Inserir cartões
      if (novoCliente.cartoes.length > 0) {
        await supabase.from('cartoes').insert(
          novoCliente.cartoes.map(c => ({
            cliente_id: clienteUUID,
            numero: c.numero,
            nome_impresso: c.nomeImpresso,
            bandeira: c.bandeira,
            cvv: c.cvv,
            preferencial: c.preferencial
          }))
        );
      }
    } catch (errSupabase) {
      console.warn('⚠️ Erro ao persistir no Supabase, salvando em fallback local:', errSupabase.message);
    }
  }

  // Atualiza arquivo local
  const baseLocal = listarTodosClientesLocal();
  baseLocal.push(novoCliente);
  salvarTodosClientesLocal(baseLocal);

  return novoCliente;
}

/**
 * RF0022 - Alterar dados cadastrais de cliente
 */
export async function alterarCliente(id, dados) {
  const clientes = await listarTodosClientes();
  const index = clientes.findIndex(c => c.id === id || c.codigo === id || c.uuid === id);
  if (index === -1) {
    const error = new Error(`Cliente com ID ${id} não foi encontrado.`);
    error.statusCode = 404;
    throw error;
  }

  const erros = [];
  if (!dados.nome?.trim()) erros.push('Nome é obrigatório (RN0026).');
  if (!dados.email?.trim()) erros.push('E-mail é obrigatório (RN0026).');
  if (!dados.telefone || !dados.telefone.tipo || !dados.telefone.ddd || !dados.telefone.numero) {
    erros.push('Telefone deve ser composto por tipo, DDD e número (RN0026).');
  }

  if (erros.length > 0) {
    const error = new Error('Falha na validação de alteração cadastral');
    error.detalhes = erros;
    error.statusCode = 400;
    throw error;
  }

  const clienteAtual = clientes[index];
  const clienteAtualizado = {
    ...clienteAtual,
    nome: dados.nome.trim(),
    email: dados.email.trim(),
    telefone: {
      tipo: dados.telefone.tipo.toUpperCase(),
      ddd: dados.telefone.ddd.trim(),
      numero: dados.telefone.numero.trim()
    },
    dataNascimento: dados.dataNascimento || clienteAtual.dataNascimento,
    genero: dados.genero || clienteAtual.genero,
    ranking: dados.ranking !== undefined ? Number(dados.ranking) : clienteAtual.ranking,
    status: dados.status ? dados.status.toUpperCase() : clienteAtual.status
  };

  if (Array.isArray(dados.enderecos)) {
    clienteAtualizado.enderecos = dados.enderecos;
  }

  if (Array.isArray(dados.cartoes)) {
    clienteAtualizado.cartoes = dados.cartoes;
  }

  // Persistência no Supabase
  if (isSupabaseConfigured() && clienteAtual.uuid) {
    try {
      await supabase.from('clientes').update({
        nome: clienteAtualizado.nome,
        email: clienteAtualizado.email,
        data_nascimento: clienteAtualizado.dataNascimento,
        genero: clienteAtualizado.genero,
        ranking: clienteAtualizado.ranking,
        status: clienteAtualizado.status,
        updated_at: new Date().toISOString()
      }).eq('id', clienteAtual.uuid);

      // Atualizar telefone
      await supabase.from('telefones').update({
        tipo: clienteAtualizado.telefone.tipo,
        ddd: clienteAtualizado.telefone.ddd,
        numero: clienteAtualizado.telefone.numero
      }).eq('cliente_id', clienteAtual.uuid);

    } catch (errSupabase) {
      console.warn('⚠️ Erro ao atualizar no Supabase:', errSupabase.message);
    }
  }

  // Atualiza arquivo local
  const baseLocal = listarTodosClientesLocal();
  const idxLocal = baseLocal.findIndex(c => c.id === id || c.codigo === id);
  if (idxLocal !== -1) {
    baseLocal[idxLocal] = clienteAtualizado;
    salvarTodosClientesLocal(baseLocal);
  }

  return clienteAtualizado;
}

/**
 * RF0023 - Inativar / Reativar cadastro de cliente
 */
export async function alternarStatusCliente(id, novoStatus) {
  const clientes = await listarTodosClientes();
  const index = clientes.findIndex(c => c.id === id || c.codigo === id || c.uuid === id);
  if (index === -1) {
    const error = new Error(`Cliente com ID ${id} não foi encontrado.`);
    error.statusCode = 404;
    throw error;
  }

  const cliente = clientes[index];
  const statusFinal = novoStatus ? novoStatus.toUpperCase() : (cliente.status === 'ATIVO' ? 'INATIVO' : 'ATIVO');
  cliente.status = statusFinal;

  if (isSupabaseConfigured() && cliente.uuid) {
    try {
      await supabase.from('clientes').update({
        status: statusFinal,
        updated_at: new Date().toISOString()
      }).eq('id', cliente.uuid);
    } catch (errSupabase) {
      console.warn('⚠️ Erro ao alterar status no Supabase:', errSupabase.message);
    }
  }

  const baseLocal = listarTodosClientesLocal();
  const idxLocal = baseLocal.findIndex(c => c.id === id || c.codigo === id);
  if (idxLocal !== -1) {
    baseLocal[idxLocal].status = statusFinal;
    salvarTodosClientesLocal(baseLocal);
  }

  return cliente;
}

/**
 * RF0028 - Alteração apenas de senha
 */
export async function alterarApenasSenha(id, { senhaNova, confirmacaoSenhaNova }) {
  const clientes = await listarTodosClientes();
  const index = clientes.findIndex(c => c.id === id || c.codigo === id || c.uuid === id);
  if (index === -1) {
    const error = new Error(`Cliente com ID ${id} não foi encontrado.`);
    error.statusCode = 404;
    throw error;
  }

  const erros = [];
  if (!senhaNova) erros.push('A nova senha é obrigatória.');
  if (!validarSenhaForte(senhaNova)) {
    erros.push('A senha deve ter no mínimo 8 caracteres, contendo letras maiúsculas, minúsculas e caractere especial (RNF0031).');
  }
  if (senhaNova !== confirmacaoSenhaNova) {
    erros.push('A confirmação de senha deve ser idêntica à nova senha (RNF0032).');
  }

  if (erros.length > 0) {
    const error = new Error('Falha na alteração exclusiva de senha');
    error.detalhes = erros;
    error.statusCode = 400;
    throw error;
  }

  const novoHash = gerarHashSenha(senhaNova);
  const cliente = clientes[index];

  if (isSupabaseConfigured() && cliente.uuid) {
    try {
      await supabase.from('clientes').update({
        senha_hash: novoHash,
        updated_at: new Date().toISOString()
      }).eq('id', cliente.uuid);
    } catch (errSupabase) {
      console.warn('⚠️ Erro ao atualizar senha no Supabase:', errSupabase.message);
    }
  }

  const baseLocal = listarTodosClientesLocal();
  const idxLocal = baseLocal.findIndex(c => c.id === id || c.codigo === id);
  if (idxLocal !== -1) {
    baseLocal[idxLocal].senhaHash = novoHash;
    salvarTodosClientesLocal(baseLocal);
  }

  return { mensagem: 'Senha alterada com sucesso exclusivamente (RF0028).' };
}

/**
 * RNF0034 - Alteração isolada de endereços
 */
export async function alterarEnderecosIsolados(id, listaEnderecos) {
  const clientes = await listarTodosClientes();
  const index = clientes.findIndex(c => c.id === id || c.codigo === id || c.uuid === id);
  if (index === -1) {
    const error = new Error(`Cliente com ID ${id} não foi encontrado.`);
    error.statusCode = 404;
    throw error;
  }

  const temEntrega = listaEnderecos.some(e => e.finalidade === 'ENTREGA' || e.finalidade === 'AMBOS');
  const temCobranca = listaEnderecos.some(e => e.finalidade === 'COBRANCA' || e.finalidade === 'AMBOS');
  if (!temEntrega || !temCobranca) {
    const error = new Error('É obrigatório manter ao menos um endereço de entrega e um de cobrança (RN0021 e RN0022).');
    error.statusCode = 400;
    throw error;
  }

  clientes[index].enderecos = listaEnderecos;

  const baseLocal = listarTodosClientesLocal();
  const idxLocal = baseLocal.findIndex(c => c.id === id || c.codigo === id);
  if (idxLocal !== -1) {
    baseLocal[idxLocal].enderecos = listaEnderecos;
    salvarTodosClientesLocal(baseLocal);
  }

  return clientes[index].enderecos;
}

/**
 * REGRA CRUCIAL DE AVALIAÇÃO: Distinção entre Inativação e Exclusão!
 * - Exclusão Física: PERMITIDA APENAS se o cliente NÃO possuir transações/pedidos vinculados.
 * - Se o cliente possuir pedidos: a exclusão física é BLOQUEADA e o sistema instrui a usar a INATIVAÇÃO.
 */
export async function excluirCliente(id) {
  const clientes = await listarTodosClientes();
  const index = clientes.findIndex(c => c.id === id || c.codigo === id || c.uuid === id);
  if (index === -1) {
    const error = new Error(`Cliente com ID ${id} não foi encontrado.`);
    error.statusCode = 404;
    throw error;
  }

  const cliente = clientes[index];
  const totalTransacoes = cliente.transacoes ? cliente.transacoes.length : 0;

  if (totalTransacoes > 0) {
    const error = new Error(
      `Operação Bloqueada: O cliente "${cliente.nome}" possui ${totalTransacoes} transação(ões)/pedido(s) registrado(s). ` +
      `Para preservar a integridade fiscal, contábil e o histórico de compras, clientes com histórico NÃO podem ser excluídos fisicamente. ` +
      `Utilize a operação de INATIVAÇÃO (RF0023).`
    );
    error.statusCode = 400;
    error.tipo = 'BLOQUEIO_EXCLUSAO_HISTORICO';
    throw error;
  }

  // Se não tem pedidos, permite a exclusão física
  if (isSupabaseConfigured() && cliente.uuid) {
    try {
      const { error: errDel } = await supabase.from('clientes').delete().eq('id', cliente.uuid);
      if (errDel) throw errDel;
    } catch (errSupabase) {
      console.warn('⚠️ Erro ao excluir no Supabase:', errSupabase.message);
    }
  }

  const baseLocal = listarTodosClientesLocal();
  const idxLocal = baseLocal.findIndex(c => c.id === id || c.codigo === id);
  if (idxLocal !== -1) {
    baseLocal.splice(idxLocal, 1);
    salvarTodosClientesLocal(baseLocal);
  }

  return { mensagem: `Cliente "${cliente.nome}" excluído fisicamente com sucesso.` };
}

/**
 * RF0025 - Consulta de transações do cliente
 */
export async function consultarTransacoesCliente(id) {
  const cliente = await buscarClientePorId(id);
  if (!cliente) {
    const error = new Error(`Cliente com ID ${id} não foi encontrado.`);
    error.statusCode = 404;
    throw error;
  }
  return cliente.transacoes || [];
}
