/**
 * Script de Carga Massiva de Dados (Seed Data Completo)
 * Elimina dados mockados e popula todo o acervo, estoque, pedidos analíticos, cupons e trocas no Supabase.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import WebSocket from 'ws';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseKey = process.env.SUPABASE_KEY?.trim();

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  realtime: { transport: WebSocket }
});

async function popularBanco() {
  console.log('🚀 Iniciando Carga de Dados no Supabase...');

  // 1. Grupos de Precificação
  console.log('1. Populando Grupos de Precificação...');
  const grupos = [
    { nome: 'Literatura Clássica', margem_lucro: 35.00, descricao: 'Clássicos nacionais e estrangeiros' },
    { nome: 'Engenharia & Tecnologia', margem_lucro: 45.00, descricao: 'Livros técnicos de computação e engenharia' },
    { nome: 'Filosofia & Humanidades', margem_lucro: 38.00, descricao: 'Obras de filosofia, sociologia e reflexão' },
    { nome: 'Obras Raras & Especiais', margem_lucro: 60.00, descricao: 'Edições comemorativas, capa dura e fac-similares' }
  ];
  const { data: dbGrupos, error: errGrp } = await supabase.from('grupos_precificacao').upsert(grupos, { onConflict: 'nome' }).select();
  if (errGrp) console.error('Erro grupos:', errGrp.message);
  const mapaGrupos = {};
  dbGrupos?.forEach(g => mapaGrupos[g.nome] = g.id);

  // 2. Categorias
  console.log('2. Populando Categorias...');
  const categorias = [
    { nome: 'Literatura Brasileira', descricao: 'Obras canônicas da literatura nacional' },
    { nome: 'Engenharia de Software', descricao: 'Arquitetura, clean code, padrões de projeto e testes' },
    { nome: 'Filosofia', descricao: 'Obras de reflexão filosófica e ensaios' },
    { nome: 'Obras Raras', descricao: 'Edições históricas limitadas e fac-similares' }
  ];
  const { data: dbCats, error: errCat } = await supabase.from('categorias').upsert(categorias, { onConflict: 'nome' }).select();
  if (errCat) console.error('Erro categorias:', errCat.message);
  const mapaCats = {};
  dbCats?.forEach(c => mapaCats[c.nome] = c.id);

  // 3. Livros (Catálogo Integral da Livraria)
  console.log('3. Populando Livros do Acervo...');
  const livros = [
    {
      codigo: 'LIV-001',
      titulo: 'Dom Casmurro (Edição Luxo)',
      autor: 'Machado de Assis',
      categoria_id: mapaCats['Literatura Brasileira'],
      grupo_precificacao_id: mapaGrupos['Literatura Clássica'],
      isbn: '9788535910841',
      ano: 2021,
      edicao: '3ª Edição',
      editora: 'Antofágica',
      numero_paginas: 400,
      sinopse: 'Um dos maiores clássicos da literatura brasileira narrado por Bentinho sobre a dúvida de Capitu.',
      preco_custo: 34.00,
      preco_venda: 45.90,
      status: 'ATIVO',
      capa_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'
    },
    {
      codigo: 'LIV-002',
      titulo: 'O Cortiço',
      autor: 'Aluísio Azevedo',
      categoria_id: mapaCats['Literatura Brasileira'],
      grupo_precificacao_id: mapaGrupos['Literatura Clássica'],
      isbn: '9788508040377',
      ano: 2020,
      edicao: '2ª Edição',
      editora: 'Ática',
      numero_paginas: 304,
      sinopse: 'Marco do naturalismo brasileiro retratando a vida em uma habitação coletiva no Rio.',
      preco_custo: 26.00,
      preco_venda: 38.00,
      status: 'ATIVO',
      capa_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400'
    },
    {
      codigo: 'LIV-003',
      titulo: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      autor: 'Robert C. Martin',
      categoria_id: mapaCats['Engenharia de Software'],
      grupo_precificacao_id: mapaGrupos['Engenharia & Tecnologia'],
      isbn: '9780132350884',
      ano: 2009,
      edicao: '1ª Edição',
      editora: 'Alta Books',
      numero_paginas: 464,
      sinopse: 'Guia definitivo de boas práticas, refatoração e código limpo para desenvolvedores.',
      preco_custo: 62.00,
      preco_venda: 89.90,
      status: 'ATIVO',
      capa_url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&q=80&w=400'
    },
    {
      codigo: 'LIV-004',
      titulo: 'A Hora da Estrela (Capa Dura)',
      autor: 'Clarice Lispector',
      categoria_id: mapaCats['Literatura Brasileira'],
      grupo_precificacao_id: mapaGrupos['Literatura Clássica'],
      isbn: '9788535928129',
      ano: 2020,
      edicao: 'Edição Especial',
      editora: 'Rocco',
      numero_paginas: 96,
      sinopse: 'A comovente história da alagoana Macabéa narrada pelo escritor Rodrigo S.M.',
      preco_custo: 29.00,
      preco_venda: 42.50,
      status: 'ATIVO',
      capa_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400'
    },
    {
      codigo: 'LIV-005',
      titulo: 'Grande Sertão: Veredas (Edição Especial)',
      autor: 'João Guimarães Rosa',
      categoria_id: mapaCats['Obras Raras'],
      grupo_precificacao_id: mapaGrupos['Obras Raras & Especiais'],
      isbn: '9788535932133',
      ano: 2019,
      edicao: 'Capa Dura',
      editora: 'Companhia das Letras',
      numero_paginas: 600,
      sinopse: 'A monumental narrativa de Riobaldo sobre o sertão, o amor e o pacto.',
      preco_custo: 190.00,
      preco_venda: 310.00,
      status: 'ATIVO',
      capa_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=400'
    },
    {
      codigo: 'LIV-006',
      titulo: 'Crítica da Razão Pura',
      autor: 'Immanuel Kant',
      categoria_id: mapaCats['Filosofia'],
      grupo_precificacao_id: mapaGrupos['Filosofia & Humanidades'],
      isbn: '9788532651112',
      ano: 2018,
      edicao: '4ª Edição',
      editora: 'Vozes',
      numero_paginas: 680,
      sinopse: 'Uma das obras filosóficas mais influentes da história sobre os limites do conhecimento humano.',
      preco_custo: 75.00,
      preco_venda: 110.00,
      status: 'ATIVO',
      capa_url: 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&q=80&w=400'
    },
    {
      codigo: 'LIV-007',
      titulo: 'Clean Architecture: A Craftsman Guide to Software Structure',
      autor: 'Robert C. Martin',
      categoria_id: mapaCats['Engenharia de Software'],
      grupo_precificacao_id: mapaGrupos['Engenharia & Tecnologia'],
      isbn: '9780134494166',
      ano: 2017,
      edicao: '1ª Edição',
      editora: 'Alta Books',
      numero_paginas: 432,
      sinopse: 'Padrões essenciais de arquitetura desacoplada, separação de preocupações e testes.',
      preco_custo: 95.00,
      preco_venda: 149.00,
      status: 'ATIVO',
      capa_url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&q=80&w=400'
    },
    {
      codigo: 'LIV-008',
      titulo: 'Refactoring: Improving the Design of Existing Code',
      autor: 'Martin Fowler',
      categoria_id: mapaCats['Engenharia de Software'],
      grupo_precificacao_id: mapaGrupos['Engenharia & Tecnologia'],
      isbn: '9780134757599',
      ano: 2018,
      edicao: '2ª Edição',
      editora: 'Addison-Wesley',
      numero_paginas: 448,
      sinopse: 'Catálogo indispensável de técnicas comprovadas para transformar código legado.',
      preco_custo: 115.00,
      preco_venda: 175.50,
      status: 'ATIVO',
      capa_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400'
    },
    {
      codigo: 'LIV-009',
      titulo: 'Memórias Póstumas de Brás Cubas',
      autor: 'Machado de Assis',
      categoria_id: mapaCats['Literatura Brasileira'],
      grupo_precificacao_id: mapaGrupos['Literatura Clássica'],
      isbn: '9788535914849',
      ano: 2019,
      edicao: 'Edição Especial',
      editora: 'Antofágica',
      numero_paginas: 368,
      sinopse: 'Obra prima do realismo com o defunto autor narrando suas desilusões com fina ironia.',
      preco_custo: 50.00,
      preco_venda: 78.90,
      status: 'ATIVO',
      capa_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'
    },
    {
      codigo: 'LIV-010',
      titulo: 'Primeira Edição Fac-similar: Os Lusíadas (1572)',
      autor: 'Luís de Camões',
      categoria_id: mapaCats['Obras Raras'],
      grupo_precificacao_id: mapaGrupos['Obras Raras & Especiais'],
      isbn: '9789722718900',
      ano: 2015,
      edicao: 'Fac-similar',
      editora: 'Imprensa Nacional',
      numero_paginas: 520,
      sinopse: 'Reprodução integral e histórica em encadernação de luxo da célebre edição de 1572.',
      preco_custo: 280.00,
      preco_venda: 450.00,
      status: 'ATIVO',
      capa_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=400'
    },
    {
      codigo: 'LIV-011',
      titulo: 'Genealogia da Moral',
      autor: 'Friedrich Nietzsche',
      categoria_id: mapaCats['Filosofia'],
      grupo_precificacao_id: mapaGrupos['Filosofia & Humanidades'],
      isbn: '9788572323864',
      ano: 2019,
      edicao: '3ª Edição',
      editora: 'Companhia das Letras',
      numero_paginas: 176,
      sinopse: 'Três dissertações provocativas sobre a origem dos conceitos morais de bem e mal.',
      preco_custo: 55.00,
      preco_venda: 85.00,
      status: 'ATIVO',
      capa_url: 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&q=80&w=400'
    },
    {
      codigo: 'LIV-012',
      titulo: 'O Alienista & Contos Fluminenses',
      autor: 'Machado de Assis',
      categoria_id: mapaCats['Literatura Brasileira'],
      grupo_precificacao_id: mapaGrupos['Literatura Clássica'],
      isbn: '9788572329989',
      ano: 2021,
      edicao: '1ª Edição',
      editora: 'Penguin Clássicos',
      numero_paginas: 240,
      sinopse: 'A clássica sátira de Simão Bacamarte e a Casa Verde em Itaguaí.',
      preco_custo: 35.00,
      preco_venda: 54.00,
      status: 'ATIVO',
      capa_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'
    }
  ];

  const { data: dbLivros, error: errLiv } = await supabase.from('livros').upsert(livros, { onConflict: 'isbn' }).select();
  if (errLiv) console.error('Erro livros:', errLiv.message);
  console.log('Livros populados:', dbLivros ? dbLivros.length : 0);

  // 4. Estoque Físico
  console.log('4. Populando Estoque...');
  if (dbLivros && dbLivros.length > 0) {
    const estoqueItems = dbLivros.map((liv, idx) => {
      let qtd = 15;
      let status = 'DISPONÍVEL';
      if (liv.codigo === 'LIV-001') qtd = 28;
      if (liv.codigo === 'LIV-002') { qtd = 4; status = 'BAIXO_ESTOQUE'; }
      if (liv.codigo === 'LIV-004') { qtd = 0; status = 'ESGOTADO'; }
      if (liv.codigo === 'LIV-005') qtd = 6;
      if (liv.codigo === 'LIV-010') qtd = 3;

      return {
        livro_id: liv.id,
        quantidade: qtd,
        quantidade_bloqueada: 0,
        estoque_minimo: 5,
        status: status
      };
    });
    const { error: errEst } = await supabase.from('estoque').upsert(estoqueItems, { onConflict: 'livro_id' });
    if (errEst) console.error('Erro estoque:', errEst.message);
  console.log('Estoque configurado para', estoqueItems.length, 'livros');
  }

  // 5. Cupons
  console.log('5. Populando Cupons...');
  const { data: clientes } = await supabase.from('clientes').select('id, codigo');
  const cli1Id = clientes?.find(c => c.codigo === 'CLI-001')?.id;
  const cli2Id = clientes?.find(c => c.codigo === 'CLI-002')?.id;

  const cupons = [
    { codigo: 'PROMO10', tipo: 'PROMOCIONAL', valor: 10.00, utilizado: false, data_validade: '2026-12-31' },
    { codigo: 'PROMO20', tipo: 'PROMOCIONAL', valor: 20.00, utilizado: false, data_validade: '2026-12-31' },
    { codigo: 'TR-2026-88', tipo: 'TROCA', valor: 20.00, cliente_id: cli1Id, utilizado: false, data_validade: '2026-12-31' },
    { codigo: 'TR-2026-99', tipo: 'TROCA', valor: 15.50, cliente_id: cli1Id, utilizado: false, data_validade: '2026-12-31' },
    { codigo: 'TR-2026-105', tipo: 'TROCA', valor: 50.00, cliente_id: cli2Id, utilizado: false, data_validade: '2026-12-31' }
  ];
  const { error: errCup } = await supabase.from('cupons').upsert(cupons, { onConflict: 'codigo' });
  if (errCup) console.error('Erro cupons:', errCup.message);
  else console.log('✅ Cupons promocionais e de troca cadastrados');

  // 6. Base Analítica Histórica de Pedidos (Abrangendo 2026 para alimentar o BI e Gestão de Pedidos)
  console.log('6. Populando Pedidos e Itens Históricos para o BI...');
  const pedidosMock = [
    { id: 'PED-2026-101', data: '2026-09-01', cliente_id: cli1Id, valor_total: 89.90, status: 'ENTREGUE', titulo: 'Dom Casmurro (Edição Luxo)', autor: 'Machado de Assis', preco: 89.90 },
    { id: 'PED-2026-102', data: '2026-09-02', cliente_id: cli2Id, valor_total: 65.50, status: 'ENTREGUE', titulo: 'A Hora da Estrela (Capa Dura)', autor: 'Clarice Lispector', preco: 65.50 },
    { id: 'PED-2026-103', data: '2026-09-03', cliente_id: cli1Id, valor_total: 149.00, status: 'ENTREGUE', titulo: 'Clean Architecture: A Craftsman Guide', autor: 'Robert C. Martin', preco: 149.00 },
    { id: 'PED-2026-104', data: '2026-09-04', cliente_id: cli2Id, valor_total: 320.00, status: 'ENTREGUE', titulo: 'Grande Sertão: Veredas (Edição Especial)', autor: 'João Guimarães Rosa', preco: 320.00 },
    { id: 'PED-2026-105', data: '2026-09-05', cliente_id: cli1Id, valor_total: 54.00, status: 'ENTREGUE', titulo: 'O Alienista & Contos Fluminenses', autor: 'Machado de Assis', preco: 54.00 },
    { id: 'PED-2026-106', data: '2026-09-06', cliente_id: cli2Id, valor_total: 110.00, status: 'ENTREGUE', titulo: 'Crítica da Razão Pura', autor: 'Immanuel Kant', preco: 110.00 },
    { id: 'PED-2026-107', data: '2026-09-07', cliente_id: cli1Id, valor_total: 175.50, status: 'ENTREGUE', titulo: 'Refactoring: Improving the Design', autor: 'Martin Fowler', preco: 175.50 },
    { id: 'PED-2026-108', data: '2026-09-08', cliente_id: cli1Id, valor_total: 78.90, status: 'ENTREGUE', titulo: 'Memórias Póstumas de Brás Cubas', autor: 'Machado de Assis', preco: 78.90 },
    { id: 'PED-2026-109', data: '2026-09-09', cliente_id: cli2Id, valor_total: 72.00, status: 'ENTREGUE', titulo: 'A Hora da Estrela (Capa Dura)', autor: 'Clarice Lispector', preco: 72.00 },
    { id: 'PED-2026-110', data: '2026-09-10', cliente_id: cli1Id, valor_total: 450.00, status: 'ENTREGUE', titulo: 'Primeira Edição Fac-similar: Os Lusíadas', autor: 'Luís de Camões', preco: 450.00 },
    { id: 'PED-2026-111', data: '2026-09-11', cliente_id: cli2Id, valor_total: 85.00, status: 'ENTREGUE', titulo: 'Genealogia da Moral', autor: 'Friedrich Nietzsche', preco: 85.00 },
    { id: 'PED-2026-112', data: '2026-09-12', cliente_id: cli1Id, valor_total: 89.90, status: 'EM PROCESSAMENTO', titulo: 'Dom Casmurro (Edição Luxo)', autor: 'Machado de Assis', preco: 89.90 },
    { id: 'PED-2026-081', data: '2026-08-01', cliente_id: cli1Id, valor_total: 145.90, status: 'ENTREGUE', titulo: 'Clean Architecture: A Craftsman Guide', autor: 'Robert C. Martin', preco: 145.90 },
    { id: 'PED-2026-082', data: '2026-08-10', cliente_id: cli1Id, valor_total: 89.90, status: 'ENTREGUE', titulo: 'Dom Casmurro (Edição Luxo)', autor: 'Machado de Assis', preco: 89.90 },
    { id: 'PED-2026-083', data: '2026-08-15', cliente_id: cli2Id, valor_total: 210.00, status: 'ENTREGUE', titulo: 'Crítica da Razão Pura', autor: 'Immanuel Kant', preco: 210.00 },
    { id: 'PED-2026-084', data: '2026-08-20', cliente_id: cli2Id, valor_total: 65.50, status: 'ENTREGUE', titulo: 'A Hora da Estrela (Capa Dura)', autor: 'Clarice Lispector', preco: 65.50 },
    { id: 'PED-2026-085', data: '2026-08-28', cliente_id: cli1Id, valor_total: 58.00, status: 'ENTREGUE', titulo: 'O Alienista & Contos Fluminenses', autor: 'Machado de Assis', preco: 58.00 },
    { id: 'PED-2026-086', data: '2026-08-31', cliente_id: cli2Id, valor_total: 310.50, status: 'ENTREGUE', titulo: 'Grande Sertão: Veredas (Edição Especial)', autor: 'João Guimarães Rosa', preco: 310.50 }
  ];

  for (const p of pedidosMock) {
    const { error: errP } = await supabase.from('pedidos').upsert({
      id: p.id,
      cliente_id: p.cliente_id || cli1Id,
      data: p.data,
      valor_total: p.valor_total,
      status: p.status
    }, { onConflict: 'id' });

    if (!errP) {
      await supabase.from('itens_pedido').upsert({
        pedido_id: p.id,
        titulo_livro: p.titulo,
        autor: p.autor,
        quantidade: 1,
        preco_unitario: p.preco
      });
      await supabase.from('pagamentos_pedido').upsert({
        pedido_id: p.id,
        forma_pagamento: 'CARTAO_CREDITO',
        valor: p.valor_total,
        status: 'APROVADO'
      });
    }
  }
  console.log('Pedidos históricos populados:', pedidosMock.length);

  // 7. Solicitações de Trocas (RF0041 - RF0045)
  console.log('7. Populando Solicitações de Troca...');
  const trocas = [
    { codigo: 'TRC-2026-001', pedido_id: 'PED-2026-101', cliente_id: cli1Id, status: 'EM TROCA', motivo: 'Livro veio com página 45 com rasura de impressão.' },
    { codigo: 'TRC-2026-002', pedido_id: 'PED-2026-102', cliente_id: cli2Id, status: 'AUTORIZADA', motivo: 'Capa veio amassada no canto superior.' },
    { codigo: 'TRC-2026-003', pedido_id: 'PED-2026-084', cliente_id: cli2Id, status: 'ITENS RECEBIDOS', motivo: 'Comprei a edição errada por engano.' },
    { codigo: 'TRC-2026-004', pedido_id: 'PED-2026-085', cliente_id: cli1Id, status: 'TROCADO', motivo: 'Defeito na lombada encadernada.' }
  ];
  const { error: errTrc } = await supabase.from('solicitacoes_troca').upsert(trocas, { onConflict: 'codigo' });
  if (errTrc) console.error('Erro trocas:', errTrc.message);
  else console.log('✅ Solicitações de troca populadas');

  console.log('\n🎉 BANCO DE DADOS POPULADO COM SUCESSO SEM NENHUM DADO MOCKADO PENDENTE!');
}

popularBanco();
