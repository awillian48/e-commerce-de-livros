import express from 'express';
import * as repo from '../data/pedidoRepository.js';
import * as R from '../domain/regrasPedido.js';

const router = express.Router();

export function responderErro(res, err) {
  if (err instanceof R.ErroNegocio) {
    return res.status(err.status).json({ erro: err.message, detalhes: err.detalhes });
  }
  console.error('Erro interno:', err);
  return res.status(500).json({ erro: 'Erro interno do servidor', mensagem: err.message });
}

const rota = (fn) => async (req, res) => {
  try {
    res.json(await fn(req));
  } catch (err) {
    responderErro(res, err);
  }
};

/** Clientes ativos (seletor "comprando como" do checkout). */
router.get('/clientes', rota(() => repo.listarClientesAtivos()));

/** Endereços, cartões e cupons do PERFIL do cliente (RF0035, RF0036, RF0037). */
router.get('/cliente/:codigo', rota((req) => repo.obterDadosCheckout(req.params.codigo)));

/** RF0031 / RF0032 / RN0031 — valida itens e quantidades contra o estoque disponível. */
router.post('/itens/validar', rota((req) => repo.validarItens(req.body?.itens)));

/** RF0034 — frete pelos itens selecionados e pelo endereço (id ou UF). */
router.post(
  '/frete',
  rota(async (req) => {
    const f = await repo.calcularFreteItens(req.body || {});
    return { valor: f.valor, criterio: f.criterio, regiao: f.regiao, uf: f.uf, pesoTotalKg: f.pesoTotalKg };
  })
);

/** RN0033–RN0036 — prévia do pagamento (totais, cupons, cartões, troco). Não grava. */
router.post('/pagamento/validar', rota((req) => repo.previaCheckout(req.body || {})));

/** RN0023 — valida a composição do endereço informado durante a compra. */
router.post('/endereco/validar', (req, res) => {
  const erros = R.validarEndereco(req.body);
  res.json({ valido: erros.length === 0, erros });
});

/** RN0024 / RN0025 — valida a composição do cartão e a bandeira homologada. */
router.post('/cartao/validar', (req, res) => {
  const erros = R.validarCartao(req.body);
  res.json({ valido: erros.length === 0, erros });
});

export default router;
