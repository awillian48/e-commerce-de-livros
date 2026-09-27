import express from 'express';
import { listarLivros, buscarLivroPorId, obterEstoqueCompleto, atualizarEstoque } from '../data/livroRepository.js';

const router = express.Router();

// Listagem de livros (Vitrine e Consulta)
router.get('/', async (req, res) => {
  try {
    const livros = await listarLivros(req.query);
    res.json(livros);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao consultar livros', mensagem: err.message });
  }
});

// Estoque completo
router.get('/estoque/todos', async (req, res) => {
  try {
    const estoque = await obterEstoqueCompleto();
    res.json(estoque);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao consultar estoque', mensagem: err.message });
  }
});

// Consulta por ID ou ISBN
router.get('/:id', async (req, res) => {
  try {
    const livro = await buscarLivroPorId(req.params.id);
    if (!livro) return res.status(404).json({ erro: 'Livro não encontrado' });
    res.json(livro);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar livro', mensagem: err.message });
  }
});

// Atualização de estoque
router.put('/estoque/:livroId', async (req, res) => {
  try {
    const { quantidade, status } = req.body;
    const atualizado = await atualizarEstoque(req.params.livroId, quantidade, status);
    res.json({ sucesso: true, dados: atualizado });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar estoque', mensagem: err.message });
  }
});

export default router;
