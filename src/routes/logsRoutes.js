import express from 'express';
import { listarLogs } from '../data/logRepository.js';

const router = express.Router();

/** RNF0012 — consulta do log de transações (data, hora, usuário, operação). */
router.get('/', async (req, res) => {
  try {
    const { entidade, registroId, limite } = req.query;
    res.json(await listarLogs({ entidade, registroId, limite }));
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao consultar logs', mensagem: err.message });
  }
});

export default router;
