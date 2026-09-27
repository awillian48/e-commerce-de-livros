-- ============================================================================
-- LIVRARIA ALEXANDRIA - SCHEMA COMPLETO RELACIONAL (POSTGRESQL / SUPABASE)
-- Rastreabilidade Total: DRS_LES_2_2026 & CDU03 - Gestão de Vendas
-- Disciplina: Laboratório de Engenharia de Software (LES 2026)
-- Autores: Anderson Barros & João Pedro Scandiuzzi
-- Repositório: awillian48/e-commerce-de-livros
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TABELAS DE CLIENTES & CADASTRO BÁSICO (RF0021 - RF0028)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    data_nascimento DATE NOT NULL,
    genero VARCHAR(30) NOT NULL,
    ranking INTEGER NOT NULL DEFAULT 1 CHECK (ranking >= 1 AND ranking <= 5),
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.telefones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('CELULAR', 'RESIDENCIAL', 'COMERCIAL')),
    ddd VARCHAR(3) NOT NULL,
    numero VARCHAR(15) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.enderecos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    frase_identificadora VARCHAR(120) NOT NULL,
    tipo_residencia VARCHAR(50) NOT NULL,
    tipo_logradouro VARCHAR(50) NOT NULL,
    logradouro VARCHAR(150) NOT NULL,
    numero VARCHAR(20) NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    cep VARCHAR(10) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    pais VARCHAR(50) NOT NULL DEFAULT 'Brasil',
    observacoes TEXT,
    finalidade VARCHAR(20) NOT NULL DEFAULT 'ENTREGA' CHECK (finalidade IN ('ENTREGA', 'COBRANCA', 'AMBOS')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cartoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    numero VARCHAR(30) NOT NULL,
    nome_impresso VARCHAR(150) NOT NULL,
    bandeira VARCHAR(30) NOT NULL CHECK (bandeira IN ('VISA', 'MASTERCARD', 'ELO', 'AMERICAN EXPRESS')),
    cvv VARCHAR(4) NOT NULL,
    preferencial BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. DOMÍNIOS DE LIVROS & PRECIFICAÇÃO (RF0011-RF0016, RF0052, RN0014, RNF0013)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.grupos_precificacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) UNIQUE NOT NULL,
    margem_lucro NUMERIC(5, 2) NOT NULL CHECK (margem_lucro >= 0),
    descricao TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) UNIQUE NOT NULL,
    descricao TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.livros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(30) UNIQUE NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    autor VARCHAR(200) NOT NULL,
    categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
    ano INTEGER,
    edicao VARCHAR(50),
    editora VARCHAR(150),
    isbn VARCHAR(20) UNIQUE NOT NULL,
    numero_paginas INTEGER,
    sinopse TEXT,
    altura_cm NUMERIC(6, 2) DEFAULT 23.00,
    largura_cm NUMERIC(6, 2) DEFAULT 16.00,
    peso_kg NUMERIC(6, 3) DEFAULT 0.450,
    grupo_precificacao_id UUID REFERENCES public.grupos_precificacao(id) ON DELETE SET NULL,
    preco_custo NUMERIC(10, 2) NOT NULL CHECK (preco_custo >= 0),
    preco_venda NUMERIC(10, 2) NOT NULL CHECK (preco_venda >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO')),
    motivo_inativacao TEXT,
    categoria_inativacao VARCHAR(50),
    capa_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. CONTROLE DE ESTOQUE (RF0051 - RF0054, RN0050, RN0051, RN0061, RN0062)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.estoque (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    livro_id UUID UNIQUE NOT NULL REFERENCES public.livros(id) ON DELETE CASCADE,
    quantidade INTEGER NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
    quantidade_bloqueada INTEGER NOT NULL DEFAULT 0 CHECK (quantidade_bloqueada >= 0),
    estoque_minimo INTEGER NOT NULL DEFAULT 5 CHECK (estoque_minimo >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'DISPONÍVEL' CHECK (status IN ('DISPONÍVEL', 'BAIXO_ESTOQUE', 'ESGOTADO')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.entradas_estoque (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    livro_id UUID NOT NULL REFERENCES public.livros(id) ON DELETE RESTRICT,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    valor_custo NUMERIC(10, 2) NOT NULL CHECK (valor_custo > 0),
    fornecedor VARCHAR(150) NOT NULL,
    data_entrada DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. GESTÃO DE VENDAS, PEDIDOS, CUPONS & PAGAMENTOS (RF0031 - RF0040)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('PROMOCIONAL', 'TROCA')),
    valor NUMERIC(10, 2) NOT NULL CHECK (valor > 0),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    utilizado BOOLEAN NOT NULL DEFAULT FALSE,
    data_validade DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pedidos (
    id VARCHAR(30) PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
    endereco_entrega_id UUID REFERENCES public.enderecos(id) ON DELETE RESTRICT,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    valor_subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (valor_subtotal >= 0),
    valor_frete NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (valor_frete >= 0),
    valor_desconto NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (valor_desconto >= 0),
    valor_total NUMERIC(10, 2) NOT NULL CHECK (valor_total >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'EM PROCESSAMENTO' 
        CHECK (status IN ('EM PROCESSAMENTO', 'APROVADA', 'REPROVADA', 'EM TRANSPORTE', 'ENTREGUE', 'EM TROCA', 'TROCADO', 'CANCELADO')),
    codigo_rastreio VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adicionar colunas novas caso a tabela pedidos já exista
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS endereco_entrega_id UUID REFERENCES public.enderecos(id) ON DELETE RESTRICT;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS valor_subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS valor_frete NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS valor_desconto NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS codigo_rastreio VARCHAR(50);
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.itens_pedido (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id VARCHAR(30) NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
    livro_id UUID REFERENCES public.livros(id) ON DELETE SET NULL,
    titulo_livro VARCHAR(200) NOT NULL,
    autor VARCHAR(150),
    quantidade INTEGER NOT NULL DEFAULT 1 CHECK (quantidade > 0),
    preco_unitario NUMERIC(10, 2) NOT NULL CHECK (preco_unitario >= 0),
    status_item VARCHAR(30) NOT NULL DEFAULT 'ENTREGUE' CHECK (status_item IN ('ENTREGUE', 'EM_TRANSPORTE', 'EM_TROCA', 'TROCADO'))
);

ALTER TABLE public.itens_pedido ADD COLUMN IF NOT EXISTS livro_id UUID REFERENCES public.livros(id) ON DELETE SET NULL;
ALTER TABLE public.itens_pedido ADD COLUMN IF NOT EXISTS status_item VARCHAR(30) NOT NULL DEFAULT 'ENTREGUE';

CREATE TABLE IF NOT EXISTS public.pagamentos_pedido (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id VARCHAR(30) NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
    forma_pagamento VARCHAR(30) NOT NULL CHECK (forma_pagamento IN ('CARTAO_CREDITO', 'CUPOM_TROCA', 'CUPOM_PROMOCIONAL')),
    cartao_id UUID REFERENCES public.cartoes(id) ON DELETE SET NULL,
    cupom_id UUID REFERENCES public.cupons(id) ON DELETE SET NULL,
    valor NUMERIC(10, 2) NOT NULL CHECK (valor > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'APROVADO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. GESTÃO DE TROCAS & DEVOLUÇÕES (RF0041 - RF0045, RN0041 - RN0046)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.solicitacoes_troca (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(30) UNIQUE NOT NULL,
    pedido_id VARCHAR(30) NOT NULL REFERENCES public.pedidos(id) ON DELETE RESTRICT,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
    status VARCHAR(40) NOT NULL DEFAULT 'EM TROCA' 
        CHECK (status IN ('EM TROCA', 'AUTORIZADA', 'ITENS RECEBIDOS', 'TROCADO', 'RECUSADA')),
    trocar_todos BOOLEAN NOT NULL DEFAULT FALSE,
    motivo TEXT NOT NULL,
    cupom_gerado_id UUID REFERENCES public.cupons(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.itens_troca (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solicitacao_troca_id UUID NOT NULL REFERENCES public.solicitacoes_troca(id) ON DELETE CASCADE,
    item_pedido_id UUID REFERENCES public.itens_pedido(id) ON DELETE SET NULL,
    livro_id UUID REFERENCES public.livros(id) ON DELETE SET NULL,
    quantidade INTEGER NOT NULL DEFAULT 1 CHECK (quantidade > 0),
    retornar_ao_estoque BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 6. BLOQUEIOS TEMPORÁRIOS DE CARRINHO (RN0044, RN0045, RNF0042)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.bloqueios_carrinho (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100) NOT NULL,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    livro_id UUID NOT NULL REFERENCES public.livros(id) ON DELETE CASCADE,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    expira_em TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 7. ÍNDICES DE PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_livros_codigo ON public.livros(codigo);
CREATE INDEX IF NOT EXISTS idx_livros_isbn ON public.livros(isbn);
CREATE INDEX IF NOT EXISTS idx_livros_categoria ON public.livros(categoria_id);
CREATE INDEX IF NOT EXISTS idx_livros_status ON public.livros(status);
CREATE INDEX IF NOT EXISTS idx_estoque_livro ON public.estoque(livro_id);
CREATE INDEX IF NOT EXISTS idx_entradas_estoque_livro ON public.entradas_estoque(livro_id);
CREATE INDEX IF NOT EXISTS idx_cupons_codigo ON public.cupons(codigo);
CREATE INDEX IF NOT EXISTS idx_cupons_cliente ON public.cupons(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_pedido ON public.pagamentos_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_trocas_pedido ON public.solicitacoes_troca(pedido_id);
CREATE INDEX IF NOT EXISTS idx_trocas_cliente ON public.solicitacoes_troca(cliente_id);
CREATE INDEX IF NOT EXISTS idx_trocas_status ON public.solicitacoes_troca(status);
CREATE INDEX IF NOT EXISTS idx_bloqueios_session ON public.bloqueios_carrinho(session_id);
CREATE INDEX IF NOT EXISTS idx_bloqueios_expira ON public.bloqueios_carrinho(expira_em);

-- ============================================================================
-- 8. POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.grupos_precificacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entradas_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_troca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_troca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloqueios_carrinho ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso público grupos_precificacao" ON public.grupos_precificacao;
CREATE POLICY "Acesso público grupos_precificacao" ON public.grupos_precificacao FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso público categorias" ON public.categorias;
CREATE POLICY "Acesso público categorias" ON public.categorias FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso público livros" ON public.livros;
CREATE POLICY "Acesso público livros" ON public.livros FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso público estoque" ON public.estoque;
CREATE POLICY "Acesso público estoque" ON public.estoque FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso público entradas_estoque" ON public.entradas_estoque;
CREATE POLICY "Acesso público entradas_estoque" ON public.entradas_estoque FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso público cupons" ON public.cupons;
CREATE POLICY "Acesso público cupons" ON public.cupons FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso público pagamentos_pedido" ON public.pagamentos_pedido;
CREATE POLICY "Acesso público pagamentos_pedido" ON public.pagamentos_pedido FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso público solicitacoes_troca" ON public.solicitacoes_troca;
CREATE POLICY "Acesso público solicitacoes_troca" ON public.solicitacoes_troca FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso público itens_troca" ON public.itens_troca;
CREATE POLICY "Acesso público itens_troca" ON public.itens_troca FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso público bloqueios_carrinho" ON public.bloqueios_carrinho;
CREATE POLICY "Acesso público bloqueios_carrinho" ON public.bloqueios_carrinho FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 9. CARGA DE DADOS INICIAIS (SEED DATA COMPLETO)
-- ============================================================================

DO $$
DECLARE
    -- IDs de Domínios
    v_grp_classicos UUID := '11111111-aaaa-bbbb-cccc-111111111111'::UUID;
    v_grp_tecnicos  UUID := '22222222-aaaa-bbbb-cccc-222222222222'::UUID;
    v_grp_raros     UUID := '33333333-aaaa-bbbb-cccc-333333333333'::UUID;

    v_cat_lit_br    UUID := '44444444-aaaa-bbbb-cccc-444444444444'::UUID;
    v_cat_eng_soft  UUID := '55555555-aaaa-bbbb-cccc-555555555555'::UUID;
    v_cat_filosofia UUID := '66666666-aaaa-bbbb-cccc-666666666666'::UUID;
    v_cat_obras_rar UUID := '77777777-aaaa-bbbb-cccc-777777777777'::UUID;

    -- IDs de Livros
    v_liv1 UUID := 'a0000001-0000-0000-0000-000000000001'::UUID;
    v_liv2 UUID := 'a0000002-0000-0000-0000-000000000002'::UUID;
    v_liv3 UUID := 'a0000003-0000-0000-0000-000000000003'::UUID;
    v_liv4 UUID := 'a0000004-0000-0000-0000-000000000004'::UUID;
    v_liv5 UUID := 'a0000005-0000-0000-0000-000000000005'::UUID;
    v_liv6 UUID := 'a0000006-0000-0000-0000-000000000006'::UUID;

    -- Clientes existentes
    v_cli1 UUID := 'a1b2c3d4-e5f6-7890-abcd-111111111111'::UUID; -- Machado
    v_cli2 UUID := 'b2c3d4e5-f6a7-8901-bcde-222222222222'::UUID; -- Clarice

    -- Cupons
    v_cupom_promo UUID := 'c0000001-0000-0000-0000-000000000001'::UUID;
    v_cupom_tr88  UUID := 'c0000002-0000-0000-0000-000000000002'::UUID;
    v_cupom_tr99  UUID := 'c0000003-0000-0000-0000-000000000003'::UUID;

    -- Troca
    v_troca1 UUID := 'd0000001-0000-0000-0000-000000000001'::UUID;
BEGIN
    -- 1. Grupos de Precificação (RF0052, RN0014)
    INSERT INTO public.grupos_precificacao (id, nome, margem_lucro, descricao)
    VALUES 
        (v_grp_classicos, 'Literatura Clássica', 35.00, 'Margem padrão para clássicos e ficção'),
        (v_grp_tecnicos,  'Engenharia & Tecnologia', 45.00, 'Margem de livros técnicos e profissionais'),
        (v_grp_raros,     'Obras Raras & Especiais', 60.00, 'Edições históricas, bilíngues e fac-similares')
    ON CONFLICT (nome) DO UPDATE SET margem_lucro = EXCLUDED.margem_lucro;

    -- 2. Categorias (RF0055, RN0071)
    INSERT INTO public.categorias (id, nome, descricao)
    VALUES
        (v_cat_lit_br,    'Literatura Brasileira', 'Obras canônicas da literatura nacional'),
        (v_cat_eng_soft,  'Engenharia de Software', 'Arquitetura, clean code, padrões de projeto e testes'),
        (v_cat_filosofia, 'Filosofia', 'Obras de reflexão filosófica e ensaios'),
        (v_cat_obras_rar, 'Obras Raras', 'Edições históricas limitadas e fac-similares')
    ON CONFLICT (nome) DO UPDATE SET descricao = EXCLUDED.descricao;

    -- 3. Catálogo de Livros (RF0011-RF0016, RNF0021)
    INSERT INTO public.livros (id, codigo, titulo, autor, categoria_id, ano, edicao, editora, isbn, numero_paginas, preco_custo, preco_venda, grupo_precificacao_id, status)
    VALUES
        (v_liv1, 'LIV-001', 'Dom Casmurro (Edição Luxo)', 'Machado de Assis', v_cat_lit_br, 2021, '3ª Edição', 'Antofágica', '9788535910841', 400, 34.00, 45.90, v_grp_classicos, 'ATIVO'),
        (v_liv2, 'LIV-002', 'O Cortiço', 'Aluísio Azevedo', v_cat_lit_br, 2020, '2ª Edição', 'Ática', '9788508040377', 304, 26.00, 38.00, v_grp_classicos, 'ATIVO'),
        (v_liv3, 'LIV-003', 'Clean Code: A Handbook of Agile Software Craftsmanship', 'Robert C. Martin', v_cat_eng_soft, 2009, '1ª Edição', 'Alta Books', '9780132350884', 464, 62.00, 89.90, v_grp_tecnicos, 'ATIVO'),
        (v_liv4, 'LIV-004', 'A Hora da Estrela (Capa Dura)', 'Clarice Lispector', v_cat_lit_br, 2020, 'Especial', 'Rocco', '9788535928129', 96, 29.00, 42.50, v_grp_classicos, 'ATIVO'),
        (v_liv5, 'LIV-005', 'Grande Sertão: Veredas (Edição Comemorativa)', 'João Guimarães Rosa', v_cat_obras_rar, 2019, 'Capa Dura', 'Companhia das Letras', '9788535932133', 600, 190.00, 310.00, v_grp_raros, 'ATIVO'),
        (v_liv6, 'LIV-006', 'Crítica da Razão Pura', 'Immanuel Kant', v_cat_filosofia, 2018, '4ª Edição', 'Vozes', '9788532651112', 680, 75.00, 110.00, v_grp_classicos, 'ATIVO')
    ON CONFLICT (isbn) DO UPDATE SET preco_venda = EXCLUDED.preco_venda;

    -- 4. Estoque Físico Inicial (RF0051, RN0031)
    INSERT INTO public.estoque (livro_id, quantidade, quantidade_bloqueada, estoque_minimo, status)
    VALUES
        (v_liv1, 28, 0, 10, 'DISPONÍVEL'),
        (v_liv2, 4, 0, 5, 'BAIXO_ESTOQUE'),
        (v_liv3, 15, 0, 8, 'DISPONÍVEL'),
        (v_liv4, 0, 0, 5, 'ESGOTADO'),
        (v_liv5, 6, 0, 2, 'DISPONÍVEL'),
        (v_liv6, 12, 0, 4, 'DISPONÍVEL')
    ON CONFLICT (livro_id) DO UPDATE SET quantidade = EXCLUDED.quantidade;

    -- 5. Entradas de Estoque (RF0051, RN0050, RN0061, RNF0064)
    INSERT INTO public.entradas_estoque (livro_id, quantidade, valor_custo, fornecedor, data_entrada)
    VALUES
        (v_liv1, 30, 34.00, 'Distribuidora Literária Express', '2026-08-01'),
        (v_liv2, 10, 26.00, 'Editora Ática Distribuição', '2026-08-10'),
        (v_liv3, 20, 62.00, 'Alta Books Supply', '2026-08-15'),
        (v_liv5, 8, 190.00, 'Companhia das Letras SP', '2026-08-20')
    ON CONFLICT DO NOTHING;

    -- 6. Cupons Cadastrados (RF0037, RN0033, RN0036)
    INSERT INTO public.cupons (id, codigo, tipo, valor, cliente_id, utilizado, data_validade)
    VALUES
        (v_cupom_promo, 'PROMO10', 'PROMOCIONAL', 10.00, NULL, FALSE, '2026-12-31'),
        (v_cupom_tr88,  'TR-2026-88', 'TROCA', 20.00, v_cli1, FALSE, '2026-12-31'),
        (v_cupom_tr99,  'TR-2026-99', 'TROCA', 15.50, v_cli1, FALSE, '2026-12-31')
    ON CONFLICT (codigo) DO UPDATE SET valor = EXCLUDED.valor;

    -- 7. Histórico de Pagamentos de Pedidos (RN0034, RN0035)
    INSERT INTO public.pagamentos_pedido (pedido_id, forma_pagamento, valor, status)
    VALUES
        ('PED-2026-001', 'CARTAO_CREDITO', 89.90, 'APROVADO'),
        ('PED-2026-003', 'CARTAO_CREDITO', 65.50, 'APROVADO')
    ON CONFLICT DO NOTHING;

    -- 8. Solicitação de Troca de Exemplo (RF0041, RF0043, RN0041)
    INSERT INTO public.solicitacoes_troca (id, codigo, pedido_id, cliente_id, status, trocar_todos, motivo)
    VALUES (v_troca1, 'TRC-2026-001', 'PED-2026-001', v_cli1, 'EM TROCA', FALSE, 'Livro veio com página 45 com rasura de impressão.')
    ON CONFLICT (codigo) DO UPDATE SET status = EXCLUDED.status;

    INSERT INTO public.itens_troca (solicitacao_troca_id, livro_id, quantidade, retornar_ao_estoque)
    VALUES (v_troca1, v_liv1, 1, FALSE)
    ON CONFLICT DO NOTHING;

END $$;