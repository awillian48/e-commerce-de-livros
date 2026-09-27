import express from 'express';
import { listarCupons, validarCupom } from '../data/vendaRepository.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { clienteId } = req.query;
    const cupons = await listarCupons(clienteId);
    res.json(cupons);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar cupons', mensagem: err.message });
  }
});

router.get('/validar/:codigo', async (req, res) => {
  try {
    const resultado = await validarCupom(req.params.codigo);
    if (!resultado.valido) return res.status(400).json(resultado);
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao validar cupom', mensagem: err.message });
  }
});

export default router;
