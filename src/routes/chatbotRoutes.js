import fs from 'fs';
import path from 'path';
import express from 'express';
import { listarLivros } from '../data/livroRepository.js';
import { listarPedidos } from '../data/vendaRepository.js';
import {
  obterEstadoCompletoIA,
  obterRecomendacoesPersonalizadas,
  processarMensagemChatbot,
  registrarFeedbackChatbot,
  atualizarPreferenciasCliente,
  treinarModeloIA,
  testarEConfigurarGeminiKey
} from '../services/recomendacaoIAService.js';

const router = express.Router();

// 1. Estado completo do modelo IA, justificativas, pesos treinados e feedbacks (RNF0044)
router.get('/estado', async (req, res) => {
  try {
    const [livros, pedidos] = await Promise.all([listarLivros(), listarPedidos()]);
    const estado = obterEstadoCompletoIA(livros, pedidos);
    res.json(estado);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao obter estado do modelo IA', mensagem: err.message });
  }
});

// 2. Recomendações personalizadas para um cliente específico (Cenários 2 e 3)
router.get('/recomendacoes/:clienteId?', async (req, res) => {
  try {
    const clienteId = req.params.clienteId || req.query.clienteId || 'CLI-001';
    const limite = Number(req.query.limite || 4);
    const [livros, pedidos] = await Promise.all([listarLivros(), listarPedidos()]);
    const resultado = obterRecomendacoesPersonalizadas(clienteId, livros, pedidos, limite);
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao calcular recomendações personalizadas', mensagem: err.message });
  }
});

// 3. Envio de mensagem livre ao Chatbot com IA Generativa + Modelo Fine-Tuned (Cenários 1 a 6)
router.post('/mensagem', async (req, res) => {
  try {
    const { mensagem, clienteId = 'CLI-001' } = req.body || {};
    if (!mensagem || !String(mensagem).trim()) {
      return res.status(400).json({ erro: 'A mensagem é obrigatória.' });
    }
    const [livros, pedidos] = await Promise.all([listarLivros(), listarPedidos()]);
    const resposta = await processarMensagemChatbot({
      mensagem,
      clienteId,
      livrosRaw: livros,
      pedidosRaw: pedidos
    });
    res.json(resposta);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao processar mensagem no chatbot', mensagem: err.message });
  }
});

// 4. Registro de Feedback do Cliente (Útil / Não útil) + Ajuste Fino RLHF Imediato (Cenário 7)
router.post('/feedback', async (req, res) => {
  try {
    const [livros, pedidos] = await Promise.all([listarLivros(), listarPedidos()]);
    const resultado = registrarFeedbackChatbot(req.body || {}, livros, pedidos);
    res.status(201).json(resultado);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao registrar feedback da resposta', mensagem: err.message });
  }
});

// 5. Atualização das Preferências do Cliente + Recalibração de Pesos (Critério 3.e)
router.put('/preferencias/:clienteId', async (req, res) => {
  try {
    const clienteId = req.params.clienteId || 'CLI-001';
    const [livros, pedidos] = await Promise.all([listarLivros(), listarPedidos()]);
    const atualizado = atualizarPreferenciasCliente(clienteId, req.body || {}, livros, pedidos);
    res.json({ sucesso: true, preferencias: atualizado });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar preferências do cliente', mensagem: err.message });
  }
});

// 6. Disparo de Treinamento / Ajuste Fino com Dados de Vendas + Feedback (Cenário 8)
router.post('/treinar', async (req, res) => {
  try {
    const gatilho = req.body?.gatilho || 'Ajuste Fino Acionado Manualmente (Vendas + Feedback RLHF)';
    const [livros, pedidos] = await Promise.all([listarLivros(), listarPedidos()]);
    const modelo = treinarModeloIA(livros, pedidos, gatilho);
    res.json({
      sucesso: true,
      mensagem: `Modelo retreinado com sucesso para a versão ${modelo.versaoAjusteFino}.`,
      modelo
    });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao executar treinamento do modelo IA', mensagem: err.message });
  }
});

// 7. Configuração / Validação da Chave da API do Google Gemini Live
router.post('/configurar-gemini', async (req, res) => {
  try {
    const { chave } = req.body || {};
    const resultado = await testarEConfigurarGeminiKey(chave);
    if (!resultado.sucesso) {
      return res.status(400).json(resultado);
    }
    // Grava também no .env para persistir entre reinicializações
    try {
      const envPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf-8');
        if (envContent.includes('GEMINI_API_KEY=')) {
          envContent = envContent.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY=${chave.trim()}`);
        } else {
          envContent += `\nGEMINI_API_KEY=${chave.trim()}\n`;
        }
        fs.writeFileSync(envPath, envContent, 'utf-8');
      }
    } catch (e) {
      console.warn('[CONFIG GEMINI] Aviso ao gravar .env:', e.message);
    }
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao configurar chave do Gemini', mensagem: err.message });
  }
});

export default router;
