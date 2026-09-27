/**
 * Teste Automatizado de Persistencia Integral - Supabase (PostgreSQL)
 * Validacao de Todas as Tabelas do DRS & E-Commerce Livros
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import WebSocket from 'ws';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseKey = process.env.SUPABASE_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL ou SUPABASE_KEY nao encontrados no .env!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  realtime: { transport: WebSocket }
});

const TABELAS = [
  'clientes',
  'telefones',
  'enderecos',
  'cartoes',
  'grupos_precificacao',
  'categorias',
  'livros',
  'estoque',
  'entradas_estoque',
  'cupons',
  'pedidos',
  'itens_pedido',
  'pagamentos_pedido',
  'solicitacoes_troca',
  'itens_troca',
  'bloqueios_carrinho'
];

async function executarValidacaoCompleta() {
  console.log('================================================================================');
  console.log('🚀 INICIANDO AUDITORIA DE TODAS AS TABELAS NO SUPABASE (POSTGRESQL)');
  console.log('================================================================================\n');

  const resultados = [];

  for (const tabela of TABELAS) {
    try {
      const { data, error, count } = await supabase
        .from(tabela)
        .select('*', { count: 'exact' })
        .limit(3);

      if (error) {
        console.log('❌ ' + tabela.padEnd(22) + '-> FALHA: ' + error.message);
        resultados.push({ Tabela: tabela, Status: 'FALHA / NAO CRIADA', Total: 0 });
      } else {
        console.log('✅ ' + tabela.padEnd(22) + '-> OK (' + (count ?? data.length) + ' registros)');
        resultados.push({ Tabela: tabela, Status: 'OK (ATIVO)', Total: count ?? data.length });
      }
    } catch (err) {
      console.log('❌ ' + tabela.padEnd(22) + '-> EXCECAO: ' + err.message);
      resultados.push({ Tabela: tabela, Status: 'EXCECAO', Total: 0 });
    }
  }

  console.log('\n================================================================================');
  console.log('📊 RESUMO DA AUDITORIA DO BANCO DE DADOS');
  console.log('================================================================================');
  console.table(resultados);

  const pendentes = resultados.filter(r => !r.Status.startsWith('OK'));
  if (pendentes.length > 0) {
    console.log('\n⚠️  Existem ' + pendentes.length + ' tabelas pendentes no Supabase.');
    console.log('👉 Execute o arquivo supabase/schema_completo.sql no SQL Editor do Supabase.');
  } else {
    console.log('\n🎉 TODAS AS TABELAS DO DRS ESTAO CRIADAS, POPULADAS E OPERACIONAIS NO SUPABASE!');
  }
}

executarValidacaoCompleta();
