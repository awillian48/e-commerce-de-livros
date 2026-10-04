-- ============================================================================
-- MIGRAÇÃO — CRIAÇÃO DE PEDIDO (CDU03 / DRS_LES_2_2026)
-- Idempotente: pode ser executada mais de uma vez sem efeitos colaterais.
--
-- 1) enderecos.no_perfil / cartoes.no_perfil  -> RF0035 / RF0036:
--    permite usar um endereço/cartão novo na compra SEM incorporá-lo ao perfil.
-- 2) cupons.pedido_origem_id                  -> RN0036: rastreia o pedido que
--    gerou o cupom de troca (diferença).
-- 3) itens_pedido.status_item                 -> aceita 'EM PROCESSAMENTO'.
-- 4) logs_transacao                           -> RNF0012: log de operações de
--    escrita (data, hora, usuário, operação, entidade).
-- ============================================================================

-- 1) Origem do endereço/cartão (perfil x uso exclusivo na compra)
ALTER TABLE public.enderecos ADD COLUMN IF NOT EXISTS no_perfil BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.cartoes   ADD COLUMN IF NOT EXISTS no_perfil BOOLEAN NOT NULL DEFAULT TRUE;

-- 2) Rastreio do cupom de troca gerado pela compra
ALTER TABLE public.cupons ADD COLUMN IF NOT EXISTS pedido_origem_id VARCHAR(30);

-- 3) Status do item acompanha o ciclo do pedido (inclui EM PROCESSAMENTO)
ALTER TABLE public.itens_pedido DROP CONSTRAINT IF EXISTS itens_pedido_status_item_check;
ALTER TABLE public.itens_pedido
    ADD CONSTRAINT itens_pedido_status_item_check
    CHECK (status_item IN ('EM PROCESSAMENTO', 'ENTREGUE', 'EM_TRANSPORTE', 'EM_TROCA', 'TROCADO'));

-- 4) RNF0012 — Log de transação (toda escrita: data, hora e usuário responsável)
CREATE TABLE IF NOT EXISTS public.logs_transacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    usuario VARCHAR(100) NOT NULL,
    operacao VARCHAR(30) NOT NULL,
    entidade VARCHAR(50) NOT NULL,
    registro_id VARCHAR(60),
    detalhes JSONB
);

CREATE INDEX IF NOT EXISTS idx_logs_entidade ON public.logs_transacao(entidade, registro_id);
CREATE INDEX IF NOT EXISTS idx_logs_data_hora ON public.logs_transacao(data_hora DESC);

ALTER TABLE public.logs_transacao ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso público logs_transacao" ON public.logs_transacao;
CREATE POLICY "Acesso público logs_transacao" ON public.logs_transacao FOR ALL USING (true) WITH CHECK (true);

-- Atualiza o cache de schema do PostgREST (API do Supabase)
NOTIFY pgrst, 'reload schema';
