import express from 'express';
import { listarTrocas, atualizarStatusTroca } from '../data/vendaRepository.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const trocas = await listarTrocas();
    res.json(trocas);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar trocas', mensagem: err.message });
  }
});

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
