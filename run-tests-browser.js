/**
 * Script de Execução Direta no Navegador (sem passar pela interface do Cypress)
 * Disciplina: LES 2026 - Laboratório de Engenharia de Software
 * Alunos: Anderson Barros & João Pedro Scandiuzzi
 * 
 * Abre diretamente o navegador padrão do sistema (Google Chrome / Edge / etc)
 * na página de Gestão de Clientes já disparando os testes e a demonstração visual!
 */

import { exec } from 'child_process';
import http from 'http';

const URL_TESTES = 'http://localhost:3000/admin/clientes.html?autoRun=1';

function verificarServidor(tentativas = 10) {
  return new Promise((resolve, reject) => {
    const checar = (restantes) => {
      http.get('http://localhost:3000/api/clientes', (res) => {
        if (res.statusCode === 200) {
          resolve(true);
        } else {
          tentarNovamente(restantes);
        }
      }).on('error', () => {
        tentarNovamente(restantes);
      });
    };

    const tentarNovamente = (restantes) => {
      if (restantes <= 0) {
        return reject(new Error('Servidor não respondeu na porta 3000. Inicie com "npm run dev".'));
      }
      setTimeout(() => checar(restantes - 1), 500);
    };

    checar(tentativas);
  });
}

async function abrirNavegadorDireto() {
  console.log('\n===============================================================');
  console.log('🚀 Livraria Alexandria — Execução de Testes Direto no Navegador');
  console.log('   Disciplina: LES 2026 | Prof. Rodrigo Rocha Silva');
  console.log('   Anderson Barros & João Pedro Scandiuzzi');
  console.log('===============================================================\n');

  try {
    process.stdout.write('🔍 Verificando servidor local em http://localhost:3000... ');
    await verificarServidor();
    console.log('✅ Online!\n');

    console.log(`🌐 Abrindo navegador diretamente em: ${URL_TESTES}`);
    console.log('✨ A demonstração dos 10 passos do CRUD de Cliente será iniciada automaticamente na tela!\n');

    let comando;
    switch (process.platform) {
      case 'darwin':
        comando = `open "${URL_TESTES}"`;
        break;
      case 'win32':
        comando = `start "" "${URL_TESTES}"`;
        break;
      default:
        comando = `xdg-open "${URL_TESTES}"`;
        break;
    }

    exec(comando, (err) => {
      if (err) {
        console.error('⚠️  Não foi possível abrir o navegador automaticamente:', err.message);
        console.log(`👉 Por favor, abra manualmente seu navegador e acesse: ${URL_TESTES}`);
      } else {
        console.log('🎉 Navegador aberto com sucesso! Acompanhe a execução diretamente na tela.');
      }
    });

  } catch (err) {
    console.error(`\n❌ ${err.message}`);
    process.exit(1);
  }
}

abrirNavegadorDireto();
