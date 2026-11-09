/**
 * Local Data Store & Fallback Engine
 * Fornece persistência local de altíssima velocidade e resiliência para:
 * - Livros e Estoque (RF0031, RF0032, RN0031, RF0053, RF0054, RN0028)
 * - Pedidos e Ciclo de Vida de Status (RF0037, RN0037, RN0038, RF0038, RN0039, RF0039, RN0040)
 * - Cupons Promocionais e de Troca (RN0033, RN0036, RF0044)
 * - Solicitações de Troca (RF0040, RF0041, RF0042, RF0043, RN0041, RN0042, RN0043)
 * - Notificações de Troca do Cliente (RNF0046)
 * - Bloqueio Temporário do Carrinho (RN0044, RNF0042, RNF0045)
 */

import fs from 'fs';
import path from 'path';

const STORE_FILE = path.resolve('src/data/localStore.json');

// 12 Livros Oficiais do Catálogo
const LIVROS_INICIAIS = [
  {
    id: 'b1010001-0000-0000-0000-000000000001',
    codigo: 'LIV-001',
    titulo: 'Dom Casmurro (Edição Luxo)',
    autor: 'Machado de Assis',
    categoria: 'Literatura Brasileira',
    categoria_id: 'cat-1',
    isbn: '9788535910841',
    ano: 2021,
    edicao: '3ª Edição',
    editora: 'Antofágica',
    numero_paginas: 400,
    sinopse: 'Um dos maiores clássicos da literatura brasileira narrado por Bentinho sobre a dúvida de Capitu.',
    preco_custo: 34.00,
    preco_venda: 45.90,
    peso_kg: 0.65,
    status: 'ATIVO',
    capa_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'b1010001-0000-0000-0000-000000000002',
    codigo: 'LIV-002',
    titulo: 'O Cortiço',
    autor: 'Aluísio Azevedo',
    categoria: 'Literatura Brasileira',
    categoria_id: 'cat-1',
    isbn: '9788508040377',
    ano: 2020,
    edicao: '2ª Edição',
    editora: 'Ática',
    numero_paginas: 304,
    sinopse: 'Marco do naturalismo brasileiro retratando a vida em uma habitação coletiva no Rio.',
    preco_custo: 26.00,
    preco_venda: 38.00,
    peso_kg: 0.45,
    status: 'ATIVO',
    capa_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'b1010001-0000-0000-0000-000000000003',
    codigo: 'LIV-003',
    titulo: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    autor: 'Robert C. Martin',
    categoria: 'Engenharia de Software',
    categoria_id: 'cat-2',
    isbn: '9780132350884',
    ano: 2009,
    edicao: '1ª Edição',
    editora: 'Alta Books',
    numero_paginas: 464,
    sinopse: 'Guia definitivo de boas práticas, refatoração e código limpo para desenvolvedores.',
    preco_custo: 62.00,
    preco_venda: 89.90,
    peso_kg: 0.80,
    status: 'ATIVO',
    capa_url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'b1010001-0000-0000-0000-000000000004',
    codigo: 'LIV-004',
    titulo: 'A Hora da Estrela (Capa Dura)',
    autor: 'Clarice Lispector',
    categoria: 'Literatura Brasileira',
    categoria_id: 'cat-1',
    isbn: '9788535928129',
    ano: 2020,
    edicao: 'Edição Especial',
    editora: 'Rocco',
    numero_paginas: 96,
    sinopse: 'A comovente história da alagoana Macabéa narrada pelo escritor Rodrigo S.M.',
    preco_custo: 29.00,
    preco_venda: 42.50,
    peso_kg: 0.35,
    status: 'ATIVO',
    capa_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'b1010001-0000-0000-0000-000000000005',
    codigo: 'LIV-005',
    titulo: 'Grande Sertão: Veredas (Edição Especial)',
    autor: 'João Guimarães Rosa',
    categoria: 'Obras Raras',
    categoria_id: 'cat-4',
    isbn: '9788535932133',
    ano: 2019,
    edicao: 'Capa Dura',
    editora: 'Companhia das Letras',
    numero_paginas: 600,
    sinopse: 'A monumental narrativa de Riobaldo sobre o sertão, o amor e o pacto.',
    preco_custo: 190.00,
    preco_venda: 310.00,
    peso_kg: 1.10,
    status: 'ATIVO',
    capa_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'b1010001-0000-0000-0000-000000000006',
    codigo: 'LIV-006',
    titulo: 'Crítica da Razão Pura',
    autor: 'Immanuel Kant',
    categoria: 'Filosofia',
    categoria_id: 'cat-3',
    isbn: '9788532651112',
    ano: 2018,
    edicao: '4ª Edição',
    editora: 'Vozes',
    numero_paginas: 680,
    sinopse: 'Uma das obras filosóficas mais influentes da história sobre os limites do conhecimento humano.',
    preco_custo: 75.00,
    preco_venda: 110.00,
    peso_kg: 0.95,
    status: 'ATIVO',
    capa_url: 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'b1010001-0000-0000-0000-000000000007',
    codigo: 'LIV-007',
    titulo: 'Clean Architecture: A Craftsman Guide to Software Structure',
    autor: 'Robert C. Martin',
    categoria: 'Engenharia de Software',
    categoria_id: 'cat-2',
    isbn: '9780134494166',
    ano: 2017,
    edicao: '1ª Edição',
    editora: 'Alta Books',
    numero_paginas: 432,
    sinopse: 'Padrões essenciais de arquitetura desacoplada, separação de preocupações e testes.',
    preco_custo: 95.00,
    preco_venda: 149.00,
    peso_kg: 0.75,
    status: 'ATIVO',
    capa_url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'b1010001-0000-0000-0000-000000000008',
    codigo: 'LIV-008',
    titulo: 'Refactoring: Improving the Design of Existing Code',
    autor: 'Martin Fowler',
    categoria: 'Engenharia de Software',
    categoria_id: 'cat-2',
    isbn: '9780134757599',
    ano: 2018,
    edicao: '2ª Edição',
    editora: 'Addison-Wesley',
    numero_paginas: 448,
    sinopse: 'Catálogo indispensável de técnicas comprovadas para transformar código legado.',
    preco_custo: 115.00,
    preco_venda: 175.50,
    peso_kg: 0.85,
    status: 'ATIVO',
    capa_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'b1010001-0000-0000-0000-000000000009',
    codigo: 'LIV-009',
    titulo: 'Memórias Póstumas de Brás Cubas',
    autor: 'Machado de Assis',
    categoria: 'Literatura Brasileira',
    categoria_id: 'cat-1',
    isbn: '9788535914849',
    ano: 2019,
    edicao: 'Edição Especial',
    editora: 'Antofágica',
    numero_paginas: 368,
    sinopse: 'Obra prima do realismo com o defunto autor narrando suas desilusões com fina ironia.',
    preco_custo: 50.00,
    preco_venda: 78.90,
    peso_kg: 0.55,
    status: 'ATIVO',
    capa_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'b1010001-0000-0000-0000-000000000010',
    codigo: 'LIV-010',
    titulo: 'Primeira Edição Fac-similar: Os Lusíadas (1572)',
    autor: 'Luís de Camões',
    categoria: 'Obras Raras',
    categoria_id: 'cat-4',
    isbn: '9789722718900',
    ano: 2015,
    edicao: 'Fac-similar',
    editora: 'Imprensa Nacional',
    numero_paginas: 520,
    sinopse: 'Reprodução integral e histórica em encadernação de luxo da célebre edição de 1572.',
    preco_custo: 280.00,
    preco_venda: 450.00,
    peso_kg: 1.40,
    status: 'ATIVO',
    capa_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'b1010001-0000-0000-0000-000000000011',
    codigo: 'LIV-011',
    titulo: 'Genealogia da Moral',
    autor: 'Friedrich Nietzsche',
    categoria: 'Filosofia',
    categoria_id: 'cat-3',
    isbn: '9788572323864',
    ano: 2019,
    edicao: '3ª Edição',
    editora: 'Companhia das Letras',
    numero_paginas: 176,
    sinopse: 'Três dissertações provocativas sobre a origem dos conceitos morais de bem e mal.',
    preco_custo: 55.00,
    preco_venda: 85.00,
    peso_kg: 0.35,
    status: 'ATIVO',
    capa_url: 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'b1010001-0000-0000-0000-000000000012',
    codigo: 'LIV-012',
    titulo: 'O Alienista & Contos Fluminenses',
    autor: 'Machado de Assis',
    categoria: 'Literatura Brasileira',
    categoria_id: 'cat-1',
    isbn: '9788572329989',
    ano: 2021,
    edicao: '1ª Edição',
    editora: 'Penguin Clássicos',
    numero_paginas: 240,
    sinopse: 'A clássica sátira de Simão Bacamarte e a Casa Verde em Itaguaí.',
    preco_custo: 35.00,
    preco_venda: 54.00,
    peso_kg: 0.40,
    status: 'ATIVO',
    capa_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'
  }
];

function obterEstoquePadrao() {
  return {
    'b1010001-0000-0000-0000-000000000001': { quantidade: 28, quantidade_bloqueada: 0, status: 'DISPONÍVEL' },
    'b1010001-0000-0000-0000-000000000002': { quantidade: 4, quantidade_bloqueada: 0, status: 'BAIXO_ESTOQUE' },
    'b1010001-0000-0000-0000-000000000003': { quantidade: 15, quantidade_bloqueada: 0, status: 'DISPONÍVEL' },
    'b1010001-0000-0000-0000-000000000004': { quantidade: 0, quantidade_bloqueada: 0, status: 'ESGOTADO' },
    'b1010001-0000-0000-0000-000000000005': { quantidade: 6, quantidade_bloqueada: 0, status: 'DISPONÍVEL' },
    'b1010001-0000-0000-0000-000000000006': { quantidade: 15, quantidade_bloqueada: 0, status: 'DISPONÍVEL' },
    'b1010001-0000-0000-0000-000000000007': { quantidade: 15, quantidade_bloqueada: 0, status: 'DISPONÍVEL' },
    'b1010001-0000-0000-0000-000000000008': { quantidade: 15, quantidade_bloqueada: 0, status: 'DISPONÍVEL' },
    'b1010001-0000-0000-0000-000000000009': { quantidade: 15, quantidade_bloqueada: 0, status: 'DISPONÍVEL' },
    'b1010001-0000-0000-0000-000000000010': { quantidade: 3, quantidade_bloqueada: 0, status: 'BAIXO_ESTOQUE' },
    'b1010001-0000-0000-0000-000000000011': { quantidade: 15, quantidade_bloqueada: 0, status: 'DISPONÍVEL' },
    'b1010001-0000-0000-0000-000000000012': { quantidade: 15, quantidade_bloqueada: 0, status: 'DISPONÍVEL' }
  };
}

function obterCuponsPadrao() {
  return [
    { id: 'cup-1', codigo: 'PROMO10', tipo: 'PROMOCIONAL', valor: 10.00, utilizado: false, data_validade: '2026-12-31', cliente_id: null },
    { id: 'cup-2', codigo: 'PROMO20', tipo: 'PROMOCIONAL', valor: 20.00, utilizado: false, data_validade: '2026-12-31', cliente_id: null },
    { id: 'cup-3', codigo: 'TR-2026-88', tipo: 'TROCA', valor: 20.00, utilizado: false, data_validade: '2026-12-31', cliente_id: 'CLI-001' },
    { id: 'cup-4', codigo: 'TR-2026-99', tipo: 'TROCA', valor: 15.50, utilizado: false, data_validade: '2026-12-31', cliente_id: 'CLI-001' },
    { id: 'cup-5', codigo: 'TR-TROCA20', tipo: 'TROCA', valor: 20.00, utilizado: false, data_validade: '2026-12-31', cliente_id: null },
    { id: 'cup-6', codigo: 'TR-TROCA50', tipo: 'TROCA', valor: 50.00, utilizado: false, data_validade: '2026-12-31', cliente_id: null }
  ];
}

function obterPedidosPadrao() {
  return [
    // --- JANEIRO / 2026 ---
    {
      id: 'PED-2026-011',
      cliente_id: 'CLI-001',
      data: '2026-01-15',
      valor_subtotal: 91.80,
      valor_frete: 10.00,
      valor_desconto: 0.00,
      valor_total: 101.80,
      status: 'ENTREGUE',
      clientes: { id: 'CLI-001', codigo: 'CLI-001', nome: 'Machado de Assis', cpf: '123.456.789-00', email: 'machado@alexandria.com.br' },
      itens_pedido: [
        { id: 'it-011-1', pedido_id: 'PED-2026-011', livro_id: 'b1010001-0000-0000-0000-000000000001', titulo_livro: 'Dom Casmurro (Edição Luxo)', autor: 'Machado de Assis', categoria: 'Literatura Brasileira', quantidade: 2, preco_unitario: 45.90, status_item: 'ENTREGUE' }
      ],
      pagamentos_pedido: [{ id: 'pag-011-1', forma_pagamento: 'CARTAO_CREDITO', valor: 101.80, status: 'APROVADO' }]
    },
    {
      id: 'PED-2026-012',
      cliente_id: 'CLI-002',
      data: '2026-01-28',
      valor_subtotal: 450.00,
      valor_frete: 15.00,
      valor_desconto: 0.00,
      valor_total: 465.00,
      status: 'ENTREGUE',
      clientes: { id: 'CLI-002', codigo: 'CLI-002', nome: 'Clarice Lispector', cpf: '987.654.321-99', email: 'clarice@alexandria.com.br' },
      itens_pedido: [
        { id: 'it-012-1', pedido_id: 'PED-2026-012', livro_id: 'b1010001-0000-0000-0000-000000000010', titulo_livro: 'Primeira Edição Fac-similar: Os Lusíadas (1572)', autor: 'Luís de Camões', categoria: 'Obras Raras', quantidade: 1, preco_unitario: 450.00, status_item: 'ENTREGUE' }
      ],
      pagamentos_pedido: [{ id: 'pag-012-1', forma_pagamento: 'CARTAO_CREDITO', valor: 465.00, status: 'APROVADO' }]
    },
    {
      id: 'PED-2026-013',
      cliente_id: 'CLI-001',
      data: '2026-01-30',
      valor_subtotal: 85.00,
      valor_frete: 10.00,
      valor_desconto: 0.00,
      valor_total: 95.00,
      status: 'REPROVADA', // NÃO DEVE ENTRAR NO BI
      clientes: { id: 'CLI-001', codigo: 'CLI-001', nome: 'Machado de Assis', cpf: '123.456.789-00', email: 'machado@alexandria.com.br' },
      itens_pedido: [
        { id: 'it-013-1', pedido_id: 'PED-2026-013', livro_id: 'b1010001-0000-0000-0000-000000000011', titulo_livro: 'Genealogia da Moral', autor: 'Friedrich Nietzsche', categoria: 'Filosofia', quantidade: 1, preco_unitario: 85.00, status_item: 'REPROVADA' }
      ],
      pagamentos_pedido: [{ id: 'pag-013-1', forma_pagamento: 'CARTAO_CREDITO', valor: 95.00, status: 'REPROVADO' }]
    },

    // --- FEVEREIRO / 2026 ---
    {
      id: 'PED-2026-021',
      cliente_id: 'CLI-001',
      data: '2026-02-10',
      valor_subtotal: 54.00,
      valor_frete: 10.00,
      valor_desconto: 0.00,
      valor_total: 64.00,
      status: 'ENTREGUE',
      clientes: { id: 'CLI-001', codigo: 'CLI-001', nome: 'Machado de Assis', cpf: '123.456.789-00', email: 'machado@alexandria.com.br' },
      itens_pedido: [
        { id: 'it-021-1', pedido_id: 'PED-2026-021', livro_id: 'b1010001-0000-0000-0000-000000000012', titulo_livro: 'O Alienista & Contos Fluminenses', autor: 'Machado de Assis', categoria: 'Literatura Brasileira', quantidade: 1, preco_unitario: 54.00, status_item: 'ENTREGUE' }
      ],
      pagamentos_pedido: [{ id: 'pag-021-1', forma_pagamento: 'CARTAO_CREDITO', valor: 64.00, status: 'APROVADO' }]
    },
    {
      id: 'PED-2026-022',
      cliente_id: 'CLI-002',
      data: '2026-02-18',
      valor_subtotal: 110.00,
      valor_frete: 12.00,
      valor_desconto: 0.00,
      valor_total: 122.00,
      status: 'ENTREGUE',
      clientes: { id: 'CLI-002', codigo: 'CLI-002', nome: 'Clarice Lispector', cpf: '987.654.321-99', email: 'clarice@alexandria.com.br' },
      itens_pedido: [
        { id: 'it-022-1', pedido_id: 'PED-2026-022', livro_id: 'b1010001-0000-0000-0000-000000000006', titulo_livro: 'Crítica da Razão Pura', autor: 'Immanuel Kant', categoria: 'Filosofia', quantidade: 1, preco_unitario: 110.00, status_item: 'ENTREGUE' }
      ],
      pagamentos_pedido: [{ id: 'pag-022-1', forma_pagamento: 'PIX', valor: 122.00, status: 'APROVADO' }]
    },
    {
      id: 'PED-2026-023',
      cliente_id: 'CLI-001',
      data: '2026-02-25',
      valor_subtotal: 89.90,
      valor_frete: 10.00,
      valor_desconto: 0.00,
      valor_total: 99.90,
      status: 'APROVADA', // NÃO DEVE ENTRAR NO BI
      clientes: { id: 'CLI-001', codigo: 'CLI-001', nome: 'Machado de Assis', cpf: '123.456.789-00', email: 'machado@alexandria.com.br' },
      itens_pedido: [
        { id: 'it-023-1', pedido_id: 'PED-2026-023', livro_id: 'b1010001-0000-0000-0000-000000000003', titulo_livro: 'Clean Code', autor: 'Robert C. Martin', categoria: 'Engenharia de Software', quantidade: 1, preco_unitario: 89.90, status_item: 'APROVADA' }
      ],
      pagamentos_pedido: [{ id: 'pag-023-1', forma_pagamento: 'CARTAO_CREDITO', valor: 99.90, status: 'APROVADO' }]
    },

    // --- MARÇO / 2026 ---
    {
      id: 'PED-2026-031',
      cliente_id: 'CLI-001',
      data: '2026-03-05',
      valor_subtotal: 149.00,
      valor_frete: 10.00,
      valor_desconto: 0.00,
      valor_total: 159.00,
      status: 'ENTREGUE',
      clientes: { id: 'CLI-001', codigo: 'CLI-001', nome: 'Machado de Assis', cpf: '123.456.789-00', email: 'machado@alexandria.com.br' },
      itens_pedido: [
        { id: 'it-031-1', pedido_id: 'PED-2026-031', livro_id: 'b1010001-0000-0000-0000-000000000007', titulo_livro: 'Clean Architecture', autor: 'Robert C. Martin', categoria: 'Engenharia de Software', quantidade: 1, preco_unitario: 149.00, status_item: 'ENTREGUE' }
      ],
      pagamentos_pedido: [{ id: 'pag-031-1', forma_pagamento: 'CARTAO_CREDITO', valor: 159.00, status: 'APROVADO' }]
    },
    {
      id: 'PED-2026-032',
      cliente_id: 'CLI-002',
      data: '2026-03-22',
      valor_subtotal: 175.50,
      valor_frete: 10.00,
      valor_desconto: 0.00,
      valor_total: 185.50,
      status: 'ENTREGUE',
      clientes: { id: 'CLI-002', codigo: 'CLI-002', nome: 'Clarice Lispector', cpf: '987.654.321-99', email: 'clarice@alexandria.com.br' },
      itens_pedido: [
        { id: 'it-032-1', pedido_id: 'PED-2026-032', livro_id: 'b1010001-0000-0000-0000-000000000008', titulo_livro: 'Refactoring: Improving Code', autor: 'Martin Fowler', categoria: 'Engenharia de Software', quantidade: 1, preco_unitario: 175.50, status_item: 'ENTREGUE' }
      ],
      pagamentos_pedido: [{ id: 'pag-032-1', forma_pagamento: 'CARTAO_CREDITO', valor: 185.50, status: 'APROVADO' }]
    },
    {
      id: 'PED-2026-033',
      cliente_id: 'CLI-001',
      data: '2026-03-25',
      valor_subtotal: 78.90,
      valor_frete: 10.00,
      valor_desconto: 0.00,
      valor_total: 88.90,
      status: 'ENTREGUE',
      clientes: { id: 'CLI-001', codigo: 'CLI-001', nome: 'Machado de Assis', cpf: '123.456.789-00', email: 'machado@alexandria.com.br' },
      itens_pedido: [
        { id: 'it-033-1', pedido_id: 'PED-2026-033', livro_id: 'b1010001-0000-0000-0000-000000000009', titulo_livro: 'Memórias Póstumas de Brás Cubas', autor: 'Machado de Assis', categoria: 'Literatura Brasileira', quantidade: 1, preco_unitario: 78.90, status_item: 'ENTREGUE' }
      ],
      pagamentos_pedido: [{ id: 'pag-033-1', forma_pagamento: 'CARTAO_CREDITO', valor: 88.90, status: 'APROVADO' }]
    },

    // --- AGOSTO / 2026 ---
    {
      id: 'PED-2026-081',
      cliente_id: 'CLI-001',
      data: '2026-08-05',
      valor_subtotal: 149.00,
      valor_frete: 10.00,
      valor_desconto: 0.00,
      valor_total: 159.00,
      status: 'ENTREGUE',
      clientes: { id: 'CLI-001', codigo: 'CLI-001', nome: 'Machado de Assis', cpf: '123.456.789-00', email: 'machado@alexandria.com.br' },
      itens_pedido: [
        { id: 'it-081-1', pedido_id: 'PED-2026-081', livro_id: 'b1010001-0000-0000-0000-000000000007', titulo_livro: 'Clean Architecture', autor: 'Robert C. Martin', categoria: 'Engenharia de Software', quantidade: 1, preco_unitario: 149.00, status_item: 'ENTREGUE' }
      ],
      pagamentos_pedido: [{ id: 'pag-081-1', forma_pagamento: 'CARTAO_CREDITO', valor: 159.00, status: 'APROVADO' }]
    },
    {
      id: 'PED-2026-082',
      cliente_id: 'CLI-002',
      data: '2026-08-15',
      valor_subtotal: 220.00,
      valor_frete: 15.00,
      valor_desconto: 0.00,
      valor_total: 235.00,
      status: 'ENTREGUE',
      clientes: { id: 'CLI-002', codigo: 'CLI-002', nome: 'Clarice Lispector', cpf: '987.654.321-99', email: 'clarice@alexandria.com.br' },
      itens_pedido: [
        { id: 'it-082-1', pedido_id: 'PED-2026-082', livro_id: 'b1010001-0000-0000-0000-000000000006', titulo_livro: 'Crítica da Razão Pura', autor: 'Immanuel Kant', categoria: 'Filosofia', quantidade: 2, preco_unitario: 110.00, status_item: 'ENTREGUE' }
      ],
      pagamentos_pedido: [{ id: 'pag-082-1', forma_pagamento: 'PIX', valor: 235.00, status: 'APROVADO' }]
    },
    {
      id: 'PED-2026-083',
      cliente_id: 'CLI-001',
      data: '2026-08-20',
      valor_subtotal: 42.50,
      valor_frete: 10.00,
      valor_desconto: 0.00,
      valor_total: 52.50,
      status: 'ENTREGUE',
      clientes: { id: 'CLI-001', codigo: 'CLI-001', nome: 'Machado de Assis', cpf: '123.456.789-00', email: 'machado@alexandria.com.br' },
      itens_pedido: [
        { id: 'it-083-1', pedido_id: 'PED-2026-083', livro_id: 'b1010001-0000-0000-0000-000000000004', titulo_livro: 'A Hora da Estrela', autor: 'Clarice Lispector', categoria: 'Literatura Brasileira', quantidade: 1, preco_unitario: 42.50, status_item: 'ENTREGUE' }
      ],
      pagamentos_pedido: [{ id: 'pag-083-1', forma_pagamento: 'CARTAO_CREDITO', valor: 52.50, status: 'APROVADO' }]
    },
    {
      id: 'PED-2026-084',
      cliente_id: 'CLI-002',
      data: '2026-08-28',
      valor_subtotal: 310.00,
      valor_frete: 20.00,
      valor_desconto: 0.00,
      valor_total: 330.00,
      status: 'ENTREGUE',
      clientes: { id: 'CLI-002', codigo: 'CLI-002', nome: 'Clarice Lispector', cpf: '987.654.321-99', email: 'clarice@alexandria.com.br' },
      itens_pedido: [
        { id: 'it-084-1', pedido_id: 'PED-2026-084', livro_id: 'b1010001-0000-0000-0000-000000000005', titulo_livro: 'Grande Sertão: Veredas', autor: 'João Guimarães Rosa', categoria: 'Obras Raras', quantidade: 1, preco_unitario: 310.00, status_item: 'ENTREGUE' }
      ],
      pagamentos_pedido: [{ id: 'pag-084-1', forma_pagamento: 'CARTAO_CREDITO', valor: 330.00, status: 'APROVADO' }]
    },

    // --- SETEMBRO / 2026 ---
    {
      id: 'PED-2026-091',
      cliente_id: 'CLI-001',
      data: '2026-09-01',
      valor_subtotal: 91.80,
      valor_frete: 10.00,
      valor_desconto: 0.00,
      valor_total: 101.80,
      status: 'ENTREGUE',
      clientes: { id: 'CLI-001', codigo: 'CLI-001', nome: 'Machado de Assis', cpf: '123.456.789-00', email: 'machado@alexandria.com.br' },
      itens_pedido: [
        { id: 'it-091-1', pedido_id: 'PED-2026-091', livro_id: 'b1010001-0000-0000-0000-000000000001', titulo_livro: 'Dom Casmurro (Edição Luxo)', autor: 'Machado de Assis', categoria: 'Literatura Brasileira', quantidade: 2, preco_unitario: 45.90, status_item: 'ENTREGUE' }
      ],
      pagamentos_pedido: [{ id: 'pag-091-1', forma_pagamento: 'CARTAO_CREDITO', valor: 101.80, status: 'APROVADO' }]
    },
    {
      id: 'PED-2026-092',
      cliente_id: 'CLI-002',
      data: '2026-09-04',
      valor_subtotal: 310.00,
      valor_frete: 15.00,
      valor_desconto: 0.00,
      valor_total: 325.00,
      status: 'ENTREGUE',
      clientes: { id: 'CLI-002', codigo: 'CLI-002', nome: 'Clarice Lispector', cpf: '987.654.321-99', email: 'clarice@alexandria.com.br' },
      itens_pedido: [
        { id: 'it-092-1', pedido_id: 'PED-2026-092', livro_id: 'b1010001-0000-0000-0000-000000000005', titulo_livro: 'Grande Sertão: Veredas', autor: 'João Guimarães Rosa', categoria: 'Obras Raras', quantidade: 1, preco_unitario: 310.00, status_item: 'ENTREGUE' }
      ],
      pagamentos_pedido: [{ id: 'pag-092-1', forma_pagamento: 'CARTAO_CREDITO', valor: 325.00, status: 'APROVADO' }]
    },
    {
      id: 'PED-2026-093',
      cliente_id: 'CLI-001',
      data: '2026-09-07',
      valor_subtotal: 265.40,
      valor_frete: 12.00,
      valor_desconto: 0.00,
      valor_total: 277.40,
      status: 'ENTREGUE',
      clientes: { id: 'CLI-001', codigo: 'CLI-001', nome: 'Machado de Assis', cpf: '123.456.789-00', email: 'machado@alexandria.com.br' },
      itens_pedido: [
        { id: 'it-093-1', pedido_id: 'PED-2026-093', livro_id: 'b1010001-0000-0000-0000-000000000003', titulo_livro: 'Clean Code', autor: 'Robert C. Martin', categoria: 'Engenharia de Software', quantidade: 1, preco_unitario: 89.90, status_item: 'ENTREGUE' },
        { id: 'it-093-2', pedido_id: 'PED-2026-093', livro_id: 'b1010001-0000-0000-0000-000000000008', titulo_livro: 'Refactoring: Improving Code', autor: 'Martin Fowler', categoria: 'Engenharia de Software', quantidade: 1, preco_unitario: 175.50, status_item: 'ENTREGUE' }
      ],
      pagamentos_pedido: [{ id: 'pag-093-1', forma_pagamento: 'CARTAO_CREDITO', valor: 277.40, status: 'APROVADO' }]
    },
    {
      id: 'PED-2026-094',
      cliente_id: 'CLI-001',
      data: '2026-09-12',
      valor_subtotal: 89.90,
      valor_frete: 10.00,
      valor_desconto: 0.00,
      valor_total: 99.90,
      status: 'EM TRANSPORTE', // CENÁRIO 6: SERÁ MUDADO PARA 'ENTREGUE' NO TESTE
      clientes: { id: 'CLI-001', codigo: 'CLI-001', nome: 'Machado de Assis', cpf: '123.456.789-00', email: 'machado@alexandria.com.br' },
      itens_pedido: [
        { id: 'it-094-1', pedido_id: 'PED-2026-094', livro_id: 'b1010001-0000-0000-0000-000000000001', titulo_livro: 'Dom Casmurro (Edição Luxo)', autor: 'Machado de Assis', categoria: 'Literatura Brasileira', quantidade: 2, preco_unitario: 44.95, status_item: 'EM TRANSPORTE' }
      ],
      pagamentos_pedido: [{ id: 'pag-094-1', forma_pagamento: 'CARTAO_CREDITO', valor: 99.90, status: 'APROVADO' }]
    },
    {
      id: 'PED-2026-095',
      cliente_id: 'CLI-002',
      data: '2026-09-18',
      valor_subtotal: 85.00,
      valor_frete: 10.00,
      valor_desconto: 0.00,
      valor_total: 95.00,
      status: 'APROVADA', // NÃO DEVE ENTRAR NO BI
      clientes: { id: 'CLI-002', codigo: 'CLI-002', nome: 'Clarice Lispector', cpf: '987.654.321-99', email: 'clarice@alexandria.com.br' },
      itens_pedido: [
        { id: 'it-095-1', pedido_id: 'PED-2026-095', livro_id: 'b1010001-0000-0000-0000-000000000011', titulo_livro: 'Genealogia da Moral', autor: 'Friedrich Nietzsche', categoria: 'Filosofia', quantidade: 1, preco_unitario: 85.00, status_item: 'APROVADA' }
      ],
      pagamentos_pedido: [{ id: 'pag-095-1', forma_pagamento: 'CARTAO_CREDITO', valor: 95.00, status: 'APROVADO' }]
    },

    // --- OUTUBRO / 2026 ---
    {
      id: 'PED-2026-101',
      cliente_id: 'CLI-001',
      data: '2026-10-05',
      valor_subtotal: 45.90,
      valor_frete: 10.00,
      valor_desconto: 0.00,
      valor_total: 55.90,
      status: 'ENTREGUE',
      clientes: { id: 'CLI-001', codigo: 'CLI-001', nome: 'Machado de Assis', cpf: '123.456.789-00', email: 'machado@alexandria.com.br' },
      itens_pedido: [
        { id: 'it-101-1', pedido_id: 'PED-2026-101', livro_id: 'b1010001-0000-0000-0000-000000000001', titulo_livro: 'Dom Casmurro (Edição Luxo)', autor: 'Machado de Assis', categoria: 'Literatura Brasileira', quantidade: 1, preco_unitario: 45.90, status_item: 'ENTREGUE' }
      ],
      pagamentos_pedido: [{ id: 'pag-101-1', forma_pagamento: 'CARTAO_CREDITO', valor: 55.90, status: 'APROVADO' }]
    },
    {
      id: 'PED-2026-102',
      cliente_id: 'CLI-002',
      data: '2026-10-14',
      valor_subtotal: 85.00,
      valor_frete: 10.00,
      valor_desconto: 0.00,
      valor_total: 95.00,
      status: 'ENTREGUE',
      clientes: { id: 'CLI-002', codigo: 'CLI-002', nome: 'Clarice Lispector', cpf: '987.654.321-99', email: 'clarice@alexandria.com.br' },
      itens_pedido: [
        { id: 'it-102-1', pedido_id: 'PED-2026-102', livro_id: 'b1010001-0000-0000-0000-000000000011', titulo_livro: 'Genealogia da Moral', autor: 'Friedrich Nietzsche', categoria: 'Filosofia', quantidade: 1, preco_unitario: 85.00, status_item: 'ENTREGUE' }
      ],
      pagamentos_pedido: [{ id: 'pag-102-1', forma_pagamento: 'CARTAO_CREDITO', valor: 95.00, status: 'APROVADO' }]
    },
    {
      id: 'PED-2026-103',
      cliente_id: 'CLI-001',
      data: '2026-10-20',
      valor_subtotal: 89.90,
      valor_frete: 10.00,
      valor_desconto: 0.00,
      valor_total: 99.90,
      status: 'ENTREGUE',
      clientes: { id: 'CLI-001', codigo: 'CLI-001', nome: 'Machado de Assis', cpf: '123.456.789-00', email: 'machado@alexandria.com.br' },
      itens_pedido: [
        { id: 'it-103-1', pedido_id: 'PED-2026-103', livro_id: 'b1010001-0000-0000-0000-000000000003', titulo_livro: 'Clean Code', autor: 'Robert C. Martin', categoria: 'Engenharia de Software', quantidade: 1, preco_unitario: 89.90, status_item: 'ENTREGUE' }
      ],
      pagamentos_pedido: [{ id: 'pag-103-1', forma_pagamento: 'CARTAO_CREDITO', valor: 99.90, status: 'APROVADO' }]
    }
  ];
}

class LocalStore {
  constructor() {
    this.dados = this.carregar();
  }

  carregar() {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const conteudo = fs.readFileSync(STORE_FILE, 'utf-8');
        const parsed = JSON.parse(conteudo);
        if (parsed && parsed.livros && parsed.estoque) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar localStore.json, reinicializando:', e.message);
    }
    const inicial = {
      livros: LIVROS_INICIAIS,
      estoque: obterEstoquePadrao(),
      cupons: obterCuponsPadrao(),
      pedidos: obterPedidosPadrao(),
      trocas: [],
      notificacoes: []
    };
    this.salvar(inicial);
    return inicial;
  }

  salvar(dados = this.dados) {
    try {
      fs.writeFileSync(STORE_FILE, JSON.stringify(dados, null, 2), 'utf-8');
    } catch (e) {
      console.error('Erro ao gravar localStore.json:', e.message);
    }
  }

  resetarParaDemonstracao() {
    this.dados = {
      livros: LIVROS_INICIAIS,
      estoque: obterEstoquePadrao(),
      cupons: obterCuponsPadrao(),
      pedidos: obterPedidosPadrao(),
      trocas: [],
      notificacoes: []
    };
    this.salvar();
    return { ok: true, mensagem: 'Base local reinicializada para demonstracao com sucesso.' };
  }

  // Livros
  obterLivros(filtros = {}) {
    let lista = [...this.dados.livros];
    if (filtros.status) lista = lista.filter(l => l.status === filtros.status);
    return lista.map(liv => {
      const est = this.dados.estoque[liv.id] || { quantidade: 10, quantidade_bloqueada: 0, status: 'DISPONÍVEL' };
      return {
        ...liv,
        estoque: est,
        categorias: { nome: liv.categoria }
      };
    });
  }

  buscarLivroPorId(idOuCodigoOuIsbn) {
    const limpo = String(idOuCodigoOuIsbn || '').trim();
    const l = this.dados.livros.find(liv => liv.id === limpo || liv.codigo === limpo || liv.isbn === limpo);
    if (!l) return null;
    const est = this.dados.estoque[l.id] || { quantidade: 10, quantidade_bloqueada: 0, status: 'DISPONÍVEL' };
    return {
      ...l,
      estoque: est,
      categorias: { nome: l.categoria }
    };
  }

  // Estoque
  obterEstoqueCompleto() {
    return this.dados.livros.map(liv => {
      const est = this.dados.estoque[liv.id] || { quantidade: 0, quantidade_bloqueada: 0, status: 'ESGOTADO' };
      return {
        livro_id: liv.id,
        quantidade: est.quantidade,
        quantidade_bloqueada: est.quantidade_bloqueada,
        status: est.status,
        updated_at: new Date().toISOString(),
        livros: {
          id: liv.id,
          codigo: liv.codigo,
          titulo: liv.titulo,
          autor: liv.autor,
          isbn: liv.isbn,
          preco_venda: liv.preco_venda,
          status: liv.status,
          categorias: { nome: liv.categoria }
        }
      };
    });
  }

  atualizarEstoque(livroId, quantidade, status) {
    const l = this.buscarLivroPorId(livroId);
    if (!l) throw new Error('Livro nao encontrado no estoque');
    const atual = this.dados.estoque[l.id] || { quantidade: 0, quantidade_bloqueada: 0, status: 'DISPONÍVEL' };
    if (quantidade !== undefined) atual.quantidade = Number(quantidade);
    if (status) atual.status = status;
    this.dados.estoque[l.id] = atual;
    this.salvar();
    return atual;
  }

  darBaixaEstoque(itens) {
    for (const item of itens) {
      const l = this.buscarLivroPorId(item.livroId || item.livro_id);
      if (l) {
        const est = this.dados.estoque[l.id] || { quantidade: 10, quantidade_bloqueada: 0, status: 'DISPONÍVEL' };
        const qtdDesejada = Number(item.quantidade || 1);
        est.quantidade = Math.max(0, est.quantidade - qtdDesejada);
        if (est.quantidade <= 0) est.status = 'ESGOTADO';
        else if (est.quantidade <= 5) est.status = 'BAIXO_ESTOQUE';
        this.dados.estoque[l.id] = est;
      }
    }
    this.salvar();
  }

  devolverItensAoEstoque(itens) {
    for (const item of itens) {
      const l = this.buscarLivroPorId(item.livroId || item.livro_id);
      if (l) {
        const est = this.dados.estoque[l.id] || { quantidade: 0, quantidade_bloqueada: 0, status: 'DISPONÍVEL' };
        const qtd = Number(item.quantidade || 1);
        est.quantidade += qtd;
        if (est.quantidade > 5) est.status = 'DISPONÍVEL';
        else if (est.quantidade > 0) est.status = 'BAIXO_ESTOQUE';
        this.dados.estoque[l.id] = est;
      }
    }
    this.salvar();
  }

  // Cupons
  obterCupons(clienteId = null) {
    return this.dados.cupons.filter(c => {
      if (c.utilizado) return false;
      if (!clienteId) return true;
      return !c.cliente_id || c.cliente_id === clienteId || (clienteId === 'CLI-001' && c.cliente_id === 'b1010001-0000-0000-0000-000000000001');
    });
  }

  buscarCupom(codigo) {
    const cod = String(codigo || '').trim().toUpperCase();
    return this.dados.cupons.find(c => c.codigo.toUpperCase() === cod);
  }

  inserirCupom(cupom) {
    const novo = {
      id: cupom.id || ('cup-' + Date.now()),
      codigo: cupom.codigo.toUpperCase(),
      tipo: cupom.tipo || 'TROCA',
      valor: Number(cupom.valor),
      utilizado: false,
      data_validade: cupom.dataValidade || cupom.data_validade || '2026-12-31',
      cliente_id: cupom.clienteId || cupom.cliente_id || null,
      pedido_origem_id: cupom.pedidoOrigemId || cupom.pedido_origem_id || null
    };
    this.dados.cupons.push(novo);
    this.salvar();
    return novo;
  }

  marcarCupomUtilizado(codigo) {
    const c = this.buscarCupom(codigo);
    if (c) {
      c.utilizado = true;
      this.salvar();
    }
  }

  // Pedidos
  obterPedidos(filtros = {}) {
    let lista = [...this.dados.pedidos];
    if (filtros.clienteId) {
      lista = lista.filter(p => p.cliente_id === filtros.clienteId || p.clientes?.codigo === filtros.clienteId || p.clientes?.id === filtros.clienteId);
    }
    if (filtros.status) {
      lista = lista.filter(p => p.status === filtros.status);
    }
    return lista;
  }

  buscarPedidoPorId(id) {
    const limpo = String(id || '').trim();
    return this.dados.pedidos.find(p => p.id === limpo) || null;
  }

  inserirPedido(pedido) {
    this.dados.pedidos.unshift(pedido);
    this.salvar();
    return pedido;
  }

  atualizarStatusPedido(pedidoId, novoStatus) {
    const p = this.buscarPedidoPorId(pedidoId);
    if (!p) throw new Error('Pedido ' + pedidoId + ' nao encontrado');
    p.status = novoStatus;
    p.updated_at = new Date().toISOString();
    if (p.itens_pedido) {
      p.itens_pedido.forEach(it => {
        it.status_item = novoStatus;
      });
    }
    this.salvar();
    return p;
  }

  // Trocas
  obterTrocas() {
    return [...this.dados.trocas];
  }

  buscarTrocaPorId(id) {
    return this.dados.trocas.find(t => t.id === id) || null;
  }

  criarSolicitacaoTroca({ pedidoId, clienteId, itens, motivo, descricao, tipo = 'ITEM' }) {
    const pedido = this.buscarPedidoPorId(pedidoId);
    if (!pedido) throw new Error('Pedido ' + pedidoId + ' nao encontrado');

    // RN0041, RN0043: Somente pedidos com status ENTREGUE podem ter troca solicitada
    if (pedido.status !== 'ENTREGUE') {
      throw new Error('RN0041: Apenas pedidos com status ENTREGUE podem ter troca solicitada. O status atual deste pedido é: ' + pedido.status);
    }

    const trocaId = 'TRC-' + Date.now().toString(36).toUpperCase();
    const novaTroca = {
      id: trocaId,
      pedido_id: pedidoId,
      cliente_id: clienteId || pedido.cliente_id,
      tipo,
      motivo,
      descricao,
      status: 'EM TROCA', // RF0040 / RN0041
      created_at: new Date().toISOString(),
      clientes: pedido.clientes || { nome: 'Cliente', codigo: clienteId },
      pedidos: {
        id: pedido.id,
        data: pedido.data,
        valor_total: pedido.valor_total,
        status: 'EM TROCA'
      },
      itens_troca: itens || (pedido.itens_pedido || []).map(i => ({
        livro_id: i.livro_id,
        titulo_livro: i.titulo_livro,
        quantidade: i.quantidade,
        preco_unitario: i.preco_unitario
      }))
    };

    this.dados.trocas.unshift(novaTroca);
    // Atualiza status do pedido para EM TROCA
    this.atualizarStatusPedido(pedidoId, 'EM TROCA');
    this.salvar();
    return novaTroca;
  }

  autorizarTroca(trocaId) {
    const troca = this.buscarTrocaPorId(trocaId);
    if (!troca) throw new Error('Solicitacao de troca ' + trocaId + ' nao encontrada');

    troca.status = 'TROCA AUTORIZADA'; // RF0041
    const codigoPostagem = 'PAC-REV-' + Math.floor(100000000 + Math.random() * 900000000);
    troca.codigo_postagem = codigoPostagem;
    troca.updated_at = new Date().toISOString();

    // Atualiza status do pedido
    this.atualizarStatusPedido(troca.pedido_id, 'TROCA AUTORIZADA');

    // RNF0046: Gerar notificacao ao cliente quando a troca for autorizada
    const notificacao = {
      id: 'notif-' + Date.now(),
      cliente_id: troca.cliente_id,
      pedido_id: troca.pedido_id,
      troca_id: trocaId,
      titulo: 'Troca Autorizada!',
      mensagem: 'Sua solicitação de troca para o Pedido #' + troca.pedido_id + ' foi AUTORIZADA! Utilize o código de logística reversa dos Correios: ' + codigoPostagem + '. Validade para postagem: 10 dias úteis.',
      codigo_postagem: codigoPostagem,
      lida: false,
      created_at: new Date().toISOString()
    };
    this.dados.notificacoes.unshift(notificacao);

    this.salvar();
    return { troca, notificacao, codigoPostagem };
  }

  confirmarRecebimentoTroca(trocaId) {
    const troca = this.buscarTrocaPorId(trocaId);
    if (!troca) throw new Error('Solicitacao de troca ' + trocaId + ' nao encontrada');

    // Atualiza troca e pedido para TROCADO (RF0043, RN0042)
    troca.status = 'TROCADO';
    troca.updated_at = new Date().toISOString();
    this.atualizarStatusPedido(troca.pedido_id, 'TROCADO');

    // RF0054: Realizar a reentrada dos itens trocados no estoque
    const itens = troca.itens_troca || [];
    this.devolverItensAoEstoque(itens);

    // RF0044: Gerar cupom de troca ao confirmar o recebimento dos itens e disponibilizá-lo ao cliente
    const valorTroca = itens.reduce((soma, i) => soma + (Number(i.preco_unitario || i.precoUnitario || 0) * Number(i.quantidade || 1)), 0);
    const codigoCupom = 'TR-' + new Date().getFullYear() + '-' + Date.now().toString(36).toUpperCase();

    const cupomGerado = this.inserirCupom({
      codigo: codigoCupom,
      tipo: 'TROCA',
      valor: valorTroca > 0 ? valorTroca : 45.90,
      clienteId: troca.cliente_id,
      pedidoOrigemId: troca.pedido_id
    });

    troca.cupom_gerado = cupomGerado;
    this.salvar();

    return { troca, cupomGerado, itensReentrados: itens.length };
  }

  // Notificacoes
  obterNotificacoes(clienteId = null) {
    if (!clienteId) return [...this.dados.notificacoes];
    return this.dados.notificacoes.filter(n => n.cliente_id === clienteId || (clienteId === 'CLI-001' && (!n.cliente_id || n.cliente_id === 'CLI-001' || n.cliente_id === 'b1010001-0000-0000-0000-000000000001')));
  }
}

export const localStore = new LocalStore();
export default localStore;
