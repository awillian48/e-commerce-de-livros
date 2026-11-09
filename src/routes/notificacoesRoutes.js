import express from 'express';
import { listarNotificacoes } from '../data/vendaRepository.js';

const router = express.Router();

// RNF0046: Lista de notificações de troca para o cliente
router.get('/', async (req, res) => {
  try {
    const { clienteId } = req.query;
    const notificacoes = await listarNotificacoes(clienteId);
    res.json(notificacoes);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar notificações', mensagem: err.message });
  }
});

export default router;
