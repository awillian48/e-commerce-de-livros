import express from 'express';
import { listarPedidos, buscarPedidoPorId, atualizarStatusPedido } from '../data/vendaRepository.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const pedidos = await listarPedidos(req.query);
    res.json(pedidos);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar pedidos', mensagem: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pedido = await buscarPedidoPorId(req.params.id);
    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });
    res.json(pedido);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar pedido', mensagem: err.message });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ erro: 'Novo status é obrigatório' });
    const atualizado = await atualizarStatusPedido(req.params.id, status);
    res.json({ sucesso: true, pedido: atualizado });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao alterar status do pedido', mensagem: err.message });
  }
});

export default router;
