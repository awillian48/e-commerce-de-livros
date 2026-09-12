import express from 'express';
import {
  listarTodosClientes,
  filtrarClientes,
  buscarClientePorId,
  cadastrarCliente,
  alterarCliente,
  alternarStatusCliente,
  alterarApenasSenha,
  alterarEnderecosIsolados,
  excluirCliente,
  consultarTransacoesCliente
} from '../data/clienteRepository.js';

const router = express.Router();

/**
 * RF0024: Consulta de clientes
 * Suporta filtros isolados ou combinados: ?nome=&cpf=&email=&status=&ranking=&genero=
 */
router.get('/', (req, res) => {
  try {
    const { nome, cpf, email, status, ranking, genero } = req.query;
    if (nome || cpf || email || status || ranking || genero) {
      const filtrados = filtrarClientes({ nome, cpf, email, status, ranking, genero });
      return res.json(filtrados);
    }
    const clientes = listarTodosClientes();
    return res.json(clientes);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno ao consultar clientes', mensagem: err.message });
  }
});

/**
 * Consulta de um cliente específico por ID ou Código
 */
router.get('/:id', (req, res) => {
  try {
    const cliente = buscarClientePorId(req.params.id);
    if (!cliente) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }
    return res.json(cliente);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro ao buscar cliente', mensagem: err.message });
  }
});

/**
 * RF0021: Cadastrar cliente
 * Valida todos os campos obrigatórios (RN0026), senha forte (RNF0031, RNF0032),
 * endereços (RN0021, RN0022, RN0023, RF0026) e cartões (RN0024, RN0025, RF0027).
 */
router.post('/', (req, res) => {
  try {
    const novoCliente = cadastrarCliente(req.body);
    return res.status(201).json({
      sucesso: true,
      mensagem: 'Cliente cadastrado com sucesso (RF0021)!',
      cliente: novoCliente
    });
  } catch (err) {
    return res.status(err.statusCode || 400).json({
      sucesso: false,
      erro: err.message,
      detalhes: err.detalhes || []
    });
  }
});

/**
 * RF0022: Alterar dados cadastrais do cliente
 */
router.put('/:id', (req, res) => {
  try {
    const clienteAtualizado = alterarCliente(req.params.id, req.body);
    return res.json({
      sucesso: true,
      mensagem: 'Dados cadastrais atualizados com sucesso (RF0022)!',
      cliente: clienteAtualizado
    });
  } catch (err) {
    return res.status(err.statusCode || 400).json({
      sucesso: false,
      erro: err.message,
      detalhes: err.detalhes || []
    });
  }
});

/**
 * RF0023: Inativar / Reativar cadastro de cliente
 */
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const cliente = alternarStatusCliente(req.params.id, status);
    return res.json({
      sucesso: true,
      mensagem: `Status do cliente alterado para ${cliente.status} com sucesso (RF0023)!`,
      cliente
    });
  } catch (err) {
    return res.status(err.statusCode || 400).json({
      sucesso: false,
      erro: err.message
    });
  }
});

/**
 * RF0028: Alteração exclusiva de senha
 */
router.patch('/:id/senha', (req, res) => {
  try {
    const resultado = alterarApenasSenha(req.params.id, req.body);
    return res.json({
      sucesso: true,
      ...resultado
    });
  } catch (err) {
    return res.status(err.statusCode || 400).json({
      sucesso: false,
      erro: err.message,
      detalhes: err.detalhes || []
    });
  }
});

/**
 * RNF0034: Alteração isolada de endereços
 */
router.put('/:id/enderecos', (req, res) => {
  try {
    const enderecos = alterarEnderecosIsolados(req.params.id, req.body);
    return res.json({
      sucesso: true,
      mensagem: 'Endereços atualizados de forma isolada com sucesso (RNF0034)!',
      enderecos
    });
  } catch (err) {
    return res.status(err.statusCode || 400).json({
      sucesso: false,
      erro: err.message
    });
  }
});

/**
 * DISTINÇÃO ENTRE INATIVAÇÃO E EXCLUSÃO:
 * Bloqueia exclusão física se houver histórico de transações vinculadas.
 */
router.delete('/:id', (req, res) => {
  try {
    const resultado = excluirCliente(req.params.id);
    return res.json({
      sucesso: true,
      ...resultado
    });
  } catch (err) {
    return res.status(err.statusCode || 400).json({
      sucesso: false,
      bloqueado: err.tipo === 'BLOQUEIO_EXCLUSAO_HISTORICO',
      erro: err.message
    });
  }
});

/**
 * RF0025: Consulta de histórico de transações do cliente
 */
router.get('/:id/transacoes', (req, res) => {
  try {
    const transacoes = consultarTransacoesCliente(req.params.id);
    return res.json({
      sucesso: true,
      transacoes
    });
  } catch (err) {
    return res.status(err.statusCode || 404).json({
      sucesso: false,
      erro: err.message
    });
  }
});

export default router;
