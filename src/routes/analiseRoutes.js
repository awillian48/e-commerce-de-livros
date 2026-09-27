import express from 'express';
import { obterDadosAnaliseBI } from '../data/vendaRepository.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const pedidos = await obterDadosAnaliseBI();
    res.json(pedidos);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao obter dados de análise BI', mensagem: err.message });
  }
});

export default router;
