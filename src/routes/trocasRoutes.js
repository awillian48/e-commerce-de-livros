import express from 'express';
import { listarTrocas, atualizarStatusTroca, solicitarTroca, autorizarTroca, confirmarRecebimentoTroca } from '../data/vendaRepository.js';

const router = express.Router();

// Listagem de trocas (Admin)
router.get('/', async (req, res) => {
  try {
    const trocas = await listarTrocas();
    res.json(trocas);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar trocas', mensagem: err.message });
  }
});

// RF0040, RN0041, RN0043: Solicitação de troca (Cliente)
router.post('/solicitar', async (req, res) => {
  try {
    const { pedidoId, clienteId, itens, motivo, descricao, tipo } = req.body;
    if (!pedidoId) return res.status(400).json({ erro: 'Identificador do pedido é obrigatório' });
    if (!motivo) return res.status(400).json({ erro: 'Motivo da troca é obrigatório' });

    const novaTroca = await solicitarTroca({ pedidoId, clienteId, itens, motivo, descricao, tipo });
    res.status(201).json({ sucesso: true, troca: novaTroca });
  } catch (err) {
    res.status(400).json({ erro: 'Não foi possível solicitar troca', mensagem: err.message });
  }
});

// RF0041, RNF0046: Autorizar troca (Admin)
router.put('/:id/autorizar', async (req, res) => {
  try {
    const resultado = await autorizarTroca(req.params.id);
    res.json({ sucesso: true, ...resultado });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao autorizar troca', mensagem: err.message });
  }
});

// RF0043, RN0042, RF0044, RF0054: Confirmar recebimento de itens da troca (Admin)
router.put('/:id/confirmar-recebimento', async (req, res) => {
  try {
    const resultado = await confirmarRecebimentoTroca(req.params.id);
    res.json({ sucesso: true, ...resultado });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao confirmar recebimento da troca', mensagem: err.message });
  }
});

// Atualização genérica de status da troca
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ erro: 'Novo status é obrigatório' });
    const atualizado = await atualizarStatusTroca(req.params.id, status);
    res.json({ sucesso: true, troca: atualizado });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao alterar status da troca', mensagem: err.message });
  }
});

export default router;
