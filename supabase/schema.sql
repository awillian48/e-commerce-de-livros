-- ============================================================================
-- LIVRARIA ALEXANDRIA — SCHEMA RELACIONAL NO SUPABASE (POSTGRESQL)
-- Disciplina: Laboratório de Engenharia de Software (LES 2026)
-- Autores: Anderson Barros & João Pedro Scandiuzzi
-- Repositório: awillian48/e-commerce-de-livros
-- ============================================================================

-- 1. EXTENSÃO UUID PARA GERAÇÃO AUTOMÁTICA DE IDENTIFICADORES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. CRIAÇÃO DAS TABELAS
-- ============================================================================

-- Tabela Principal de Clientes (RF0021, RF0022, RF0023, RN0026, RN0027, RNF0035)
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(20) UNIQUE NOT NULL, -- Código único RNF0035 (ex: CLI-001)
    nome VARCHAR(150) NOT NULL, -- RN0026
    cpf VARCHAR(14) UNIQUE NOT NULL, -- RN0026 (Imutável após cadastro - RF0022)
    email VARCHAR(150) UNIQUE NOT NULL, -- RN0026
    senha_hash TEXT NOT NULL, -- RNF0031 e RNF0033 (Hash SHA-256)
    data_nascimento DATE NOT NULL, -- RN0026
    genero VARCHAR(30) NOT NULL, -- RN0026
    ranking INTEGER NOT NULL DEFAULT 1 CHECK (ranking >= 1 AND ranking <= 5), -- RN0027
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO')), -- RF0023
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Telefones do Cliente (Composição RN0026: Tipo, DDD e Número)
CREATE TABLE IF NOT EXISTS public.telefones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('CELULAR', 'RESIDENCIAL', 'COMERCIAL')), -- RN0026
    ddd VARCHAR(3) NOT NULL, -- RN0026
    numero VARCHAR(15) NOT NULL, -- RN0026
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Endereços (1:N — RF0026, RN0021, RN0022, RN0023)
CREATE TABLE IF NOT EXISTS public.enderecos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    frase_identificadora VARCHAR(120) NOT NULL, -- RF0026 (Frase curta ex: "Minha Casa")
    tipo_residencia VARCHAR(50) NOT NULL, -- RN0023 (Casa, Apartamento, Sobrado, etc.)
    tipo_logradouro VARCHAR(50) NOT NULL, -- RN0023 (Rua, Avenida, etc.)
    logradouro VARCHAR(150) NOT NULL, -- RN0023
    numero VARCHAR(20) NOT NULL, -- RN0023
    bairro VARCHAR(100) NOT NULL, -- RN0023
    cep VARCHAR(10) NOT NULL, -- RN0023
    cidade VARCHAR(100) NOT NULL, -- RN0023
    estado VARCHAR(2) NOT NULL, -- RN0023
    pais VARCHAR(50) NOT NULL DEFAULT 'Brasil', -- RN0023
    observacoes TEXT, -- RN0023 (Opcional)
    finalidade VARCHAR(20) NOT NULL DEFAULT 'ENTREGA' CHECK (finalidade IN ('ENTREGA', 'COBRANCA', 'AMBOS')), -- RN0021 e RN0022
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Cartões de Crédito (1:N — RF0027, RN0024, RN0025)
CREATE TABLE IF NOT EXISTS public.cartoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    numero VARCHAR(30) NOT NULL, -- RN0024
    nome_impresso VARCHAR(150) NOT NULL, -- RN0024
    bandeira VARCHAR(30) NOT NULL CHECK (bandeira IN ('VISA', 'MASTERCARD', 'ELO', 'AMERICAN EXPRESS')), -- RN0025
    cvv VARCHAR(4) NOT NULL, -- RN0024
    preferencial BOOLEAN NOT NULL DEFAULT FALSE, -- RF0027 (Cartão preferencial para compras)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Pedidos / Transações (RF0025)
-- IMPORTANTE: ON DELETE RESTRICT impede exclusão de clientes com compras vinculadas!
CREATE TABLE IF NOT EXISTS public.pedidos (
    id VARCHAR(30) PRIMARY KEY, -- ex: PED-2026-001
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    valor_total NUMERIC(10, 2) NOT NULL CHECK (valor_total >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'ENTREGUE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Itens do Pedido (Transações RF0025)
CREATE TABLE IF NOT EXISTS public.itens_pedido (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id VARCHAR(30) NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
    titulo_livro VARCHAR(200) NOT NULL,
    autor VARCHAR(150),
    quantidade INTEGER NOT NULL DEFAULT 1 CHECK (quantidade > 0),
    preco_unitario NUMERIC(10, 2) NOT NULL CHECK (preco_unitario >= 0)
);

-- ============================================================================
-- 3. ÍNDICES DE PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_clientes_codigo ON public.clientes(codigo);
CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON public.clientes(cpf);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_status ON public.clientes(status);
CREATE INDEX IF NOT EXISTS idx_telefones_cliente ON public.telefones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_enderecos_cliente ON public.enderecos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cartoes_cliente ON public.cartoes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON public.pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_pedido ON public.itens_pedido(pedido_id);

-- ============================================================================
-- 4. POLÍTICAS DE ROW LEVEL SECURITY (RLS) PARA O SUPABASE
-- Permite operações autenticadas e anônimas de desenvolvimento/demonstração
-- ============================================================================
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telefones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enderecos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cartoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso público clientes" ON public.clientes;
CREATE POLICY "Acesso público clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso público telefones" ON public.telefones;
CREATE POLICY "Acesso público telefones" ON public.telefones FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso público enderecos" ON public.enderecos;
CREATE POLICY "Acesso público enderecos" ON public.enderecos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso público cartoes" ON public.cartoes;
CREATE POLICY "Acesso público cartoes" ON public.cartoes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso público pedidos" ON public.pedidos;
CREATE POLICY "Acesso público pedidos" ON public.pedidos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso público itens_pedido" ON public.itens_pedido;
CREATE POLICY "Acesso público itens_pedido" ON public.itens_pedido FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 5. CARGA INICIAL DE DADOS (SEED DATA)
-- ============================================================================

DO $$
DECLARE
    v_cli1 UUID := 'a1b2c3d4-e5f6-7890-abcd-111111111111'::UUID;
    v_cli2 UUID := 'b2c3d4e5-f6a7-8901-bcde-222222222222'::UUID;
    v_cli3 UUID := 'c3d4e5f6-a7b8-9012-cdef-333333333333'::UUID;
BEGIN
    -- Cliente 1: Machado de Assis (Com compras)
    INSERT INTO public.clientes (id, codigo, nome, cpf, email, senha_hash, data_nascimento, genero, ranking, status)
    VALUES (
        v_cli1,
        'CLI-001',
        'Machado de Assis',
        '123.456.789-00',
        'machado@alexandria.com.br',
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        '1839-06-21',
        'Masculino',
        5,
        'ATIVO'
    ) ON CONFLICT (codigo) DO UPDATE SET nome = EXCLUDED.nome;

    INSERT INTO public.telefones (cliente_id, tipo, ddd, numero)
    VALUES (v_cli1, 'CELULAR', '21', '98888-7777')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.enderecos (cliente_id, frase_identificadora, tipo_residencia, tipo_logradouro, logradouro, numero, bairro, cep, cidade, estado, pais, observacoes, finalidade)
    VALUES (v_cli1, 'Residência Oficial Cosme Velho', 'Casa', 'Rua', 'Cosme Velho', '100', 'Cosme Velho', '22241-090', 'Rio de Janeiro', 'RJ', 'Brasil', 'Próximo à linha do bonde', 'AMBOS')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.cartoes (cliente_id, numero, nome_impresso, bandeira, cvv, preferencial)
    VALUES (v_cli1, '4532 1111 2222 4321', 'N MACHADO ASSIS', 'VISA', '123', true)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.pedidos (id, cliente_id, data, valor_total, status)
    VALUES ('PED-2026-001', v_cli1, '2026-02-10', 89.90, 'ENTREGUE')
    ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

    INSERT INTO public.itens_pedido (pedido_id, titulo_livro, autor, quantidade, preco_unitario)
    VALUES 
        ('PED-2026-001', 'Dom Casmurro (Edição Luxo)', 'Machado de Assis', 1, 59.90),
        ('PED-2026-001', 'O Alienista & Contos', 'Machado de Assis', 1, 30.00)
    ON CONFLICT DO NOTHING;

    -- Cliente 2: Clarice Lispector (Com compras)
    INSERT INTO public.clientes (id, codigo, nome, cpf, email, senha_hash, data_nascimento, genero, ranking, status)
    VALUES (
        v_cli2,
        'CLI-002',
        'Clarice Lispector',
        '987.654.321-11',
        'clarice@alexandria.com.br',
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        '1920-12-10',
        'Feminino',
        4,
        'INATIVO'
    ) ON CONFLICT (codigo) DO UPDATE SET nome = EXCLUDED.nome;

    INSERT INTO public.telefones (cliente_id, tipo, ddd, numero)
    VALUES (v_cli2, 'CELULAR', '21', '97777-6666')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.enderecos (cliente_id, frase_identificadora, tipo_residencia, tipo_logradouro, logradouro, numero, bairro, cep, cidade, estado, pais, observacoes, finalidade)
    VALUES (v_cli2, 'Apartamento Leme', 'Apartamento', 'Rua', 'Gustavo Sampaio', '300', 'Leme', '22010-010', 'Rio de Janeiro', 'RJ', 'Brasil', 'Apto 402', 'AMBOS')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.cartoes (cliente_id, numero, nome_impresso, bandeira, cvv, preferencial)
    VALUES (v_cli2, '5067 9999 8888 1122', 'CLARICE LISPECTOR', 'ELO', '789', true)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.pedidos (id, cliente_id, data, valor_total, status)
    VALUES ('PED-2026-003', v_cli2, '2026-02-15', 65.50, 'ENTREGUE')
    ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

    INSERT INTO public.itens_pedido (pedido_id, titulo_livro, autor, quantidade, preco_unitario)
    VALUES ('PED-2026-003', 'A Hora da Estrela (Capa Dura)', 'Clarice Lispector', 1, 65.50)
    ON CONFLICT DO NOTHING;

    -- Cliente 3: Guimarães Rosa (Sem compras - apto para exclusão de teste)
    INSERT INTO public.clientes (id, codigo, nome, cpf, email, senha_hash, data_nascimento, genero, ranking, status)
    VALUES (
        v_cli3,
        'CLI-003',
        'João Guimarães Rosa',
        '555.444.333-22',
        'guimaraes@alexandria.com.br',
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        '1908-06-27',
        'Masculino',
        5,
        'ATIVO'
    ) ON CONFLICT (codigo) DO UPDATE SET nome = EXCLUDED.nome;

    INSERT INTO public.telefones (cliente_id, tipo, ddd, numero)
    VALUES (v_cli3, 'CELULAR', '31', '99999-8888')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.enderecos (cliente_id, frase_identificadora, tipo_residencia, tipo_logradouro, logradouro, numero, bairro, cep, cidade, estado, pais, observacoes, finalidade)
    VALUES (v_cli3, 'Fazenda Cordisburgo', 'Casa', 'Avenida', 'Padre João', '45', 'Centro', '35780-000', 'Cordisburgo', 'MG', 'Brasil', 'Sede histórica', 'AMBOS')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.cartoes (cliente_id, numero, nome_impresso, bandeira, cvv, preferencial)
    VALUES (v_cli3, '3782 8888 7777 6666', 'J GUIMARAES ROSA', 'AMERICAN EXPRESS', '456', true)
    ON CONFLICT DO NOTHING;

END $$;
