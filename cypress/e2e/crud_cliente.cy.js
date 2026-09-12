/**
 * ============================================================================
 * SUÍTE DE TESTES AUTOMATIZADOS DE INTERFACE (E2E) — CYPRESS
 * Disciplina: Laboratório de Engenharia de Software (LES 2026)
 * Alunos: Anderson Barros & João Pedro Scandiuzzi
 * 
 * Demonstração e comprovação automatizada do CRUD de Cliente
 * Rastreabilidade completa de Requisitos Funcionais (RF), Regras de Negócio (RN)
 * e Requisitos Não Funcionais (RNF) conforme o documento DRS_LES_2_2026.
 * 
 * NOTA: O ritmo de execução está desacelerado (keystrokeDelay + pausas visuais)
 * para permitir acompanhamento e leitura clara pelo professor durante a apresentação.
 * ============================================================================
 */

// 1. Desacelera a digitação (100ms entre cada caractere) para visualização humana
Cypress.Keyboard.defaults({
  keystrokeDelay: 100
});

// 2. Adiciona uma pausa suave automática (500ms) após cliques e seleções na tela
const PAUSA_ACAO_MS = 500;
['click', 'select', 'check'].forEach((command) => {
  Cypress.Commands.overwrite(command, (originalFn, element, ...args) => {
    return originalFn(element, ...args).then((subject) => {
      return new Cypress.Promise((resolve) => {
        setTimeout(() => resolve(subject), PAUSA_ACAO_MS);
      });
    });
  });
});

describe('Suíte de Testes Automatizados — CRUD Completo de Cliente (LES 2026)', () => {
  beforeEach(() => {
    // 1. Automatiza e aceita automaticamente qualquer popup de permissão/confirmação (confirm)
    cy.on('window:confirm', (mensagem) => {
      Cypress.log({
        name: 'POPUP PERMISSÃO',
        displayName: 'CONFIRMAÇÃO',
        message: `Aceito automaticamente: "${mensagem}"`
      });
      return true; // Retorna true (equivalente a clicar em OK/Confirmar)
    });

    // 2. Automatiza e fecha qualquer popup de alerta nativo (alert)
    cy.on('window:alert', (mensagem) => {
      Cypress.log({
        name: 'POPUP ALERTA',
        displayName: 'ALERTA',
        message: `Fechado automaticamente: "${mensagem}"`
      });
      return true;
    });

    cy.visit('/admin/clientes.html');
    cy.wait(1200); // Pausa para visualização da tela inicial carregada
  });

  // --------------------------------------------------------------------------
  // TESTE 1: CONSULTA DE CLIENTES COM FILTROS ISOLADOS E COMBINADOS (RF0024)
  // --------------------------------------------------------------------------
  it('[RF0024] Deve consultar clientes com filtros isolados (por nome) e combinados (por status)', () => {
    // 1. Filtro isolado por nome
    cy.get('#filtro-nome').clear().type('Machado');
    cy.wait(600);
    cy.get('#btn-filtrar').click();
    cy.wait(1000);
    cy.get('#tabela-clientes-body').should('contain', 'Machado de Assis');
    cy.get('#tabela-clientes-body').should('not.contain', 'Clarice Lispector');

    // 2. Limpar filtros
    cy.get('#btn-limpar-filtros').click();
    cy.wait(800);
    cy.get('#tabela-clientes-body').should('contain', 'Machado de Assis');
    cy.get('#tabela-clientes-body').should('contain', 'Clarice Lispector');

    // 3. Filtro isolado por status INATIVO
    cy.get('#filtro-status').select('INATIVO');
    cy.wait(600);
    cy.get('#btn-filtrar').click();
    cy.wait(1000);
    cy.get('#tabela-clientes-body').should('contain', 'Clarice Lispector');
    cy.get('#tabela-clientes-body').should('not.contain', 'Machado de Assis');

    // 4. Limpar novamente
    cy.get('#btn-limpar-filtros').click();
    cy.wait(800);
  });

  // --------------------------------------------------------------------------
  // TESTE 2: CADASTRO DE NOVO CLIENTE COM SUCESSO (RF0021, RN0026, RNF0035, RF0026, RF0027)
  // --------------------------------------------------------------------------
  it('[RF0021][RN0026][RNF0035][RF0026][RF0027] Deve cadastrar um novo cliente com dados pessoais, endereço e cartão válidos', () => {
    cy.get('#btn-novo-cliente').click();
    cy.get('#modal-cliente').should('be.visible');
    cy.wait(1000); // Pausa para visualização do modal aberto

    // 1. Dados Pessoais (RN0026)
    cy.get('#field-nome').type('José de Alencar');
    cy.get('#field-cpf').type('333.444.555-66');
    cy.get('#field-email').type('alencar@alexandria.com.br');
    cy.get('#field-nascimento').type('1929-05-01');
    cy.get('#field-genero').select('Masculino');
    cy.get('#field-ranking').select('5');

    // Telefone Composto: Tipo, DDD e Número (RN0026)
    cy.get('#field-tel-tipo').select('CELULAR');
    cy.get('#field-tel-ddd').type('85');
    cy.get('#field-tel-numero').type('98888-1234');
    cy.wait(600);

    // 2. Senha Forte e Confirmação Dupla (RNF0031 e RNF0032)
    cy.get('#field-senha').type('Alencar@2026');
    cy.get('#field-senha-confirma').type('Alencar@2026');
    cy.get('#indicador-forca-senha').should('contain', 'Senha Forte');
    cy.wait(600);

    // 3. Endereço com Frase Curta e Finalidade (RF0026, RN0021, RN0022, RN0023)
    cy.get('#container-enderecos-form').within(() => {
      cy.get('input[placeholder*="Minha Casa"]').clear().type('Solar dos Românticos');
      cy.get('input[placeholder*="rua"]').clear().type('Rua da Literatura');
      cy.get('input[placeholder="Nº"]').clear().type('150');
      cy.get('input[placeholder="Bairro"]').clear().type('Meireles');
      cy.get('input[placeholder="00000-000"]').clear().type('60165-000');
      cy.get('input[placeholder="Cidade"]').clear().type('Fortaleza');
      cy.get('input[placeholder="SP"]').clear().type('CE');
    });
    cy.wait(600);

    // 4. Cartão de Crédito com Bandeira Homologada e Preferencial (RN0024, RN0025, RF0027)
    cy.get('#container-cartoes-form').within(() => {
      cy.get('input[placeholder*="0000 0000"]').clear().type('4532 9999 8888 7777');
      cy.get('input[placeholder*="como no plástico"]').clear().type('JOSE M ALENCAR');
      cy.get('select').select('VISA');
      cy.get('input[placeholder="123"]').clear().type('888');
      cy.get('input[type="radio"]').check();
    });
    cy.wait(1000); // Pausa para o professor ver o formulário preenchido

    // Salvar e verificar fechamento do modal e listagem
    cy.get('#btn-salvar-cliente').click();
    cy.get('#modal-cliente').should('not.be.visible');
    cy.get('#mensagem-alerta').should('contain', 'sucesso');
    cy.wait(1200);

    // Verifica que o novo cliente foi listado com código único (RNF0035)
    cy.get('#tabela-clientes-body').should('contain', 'José de Alencar');
    cy.get('#tabela-clientes-body').should('contain', 'CLI-003');
    cy.wait(1000);
  });

  // --------------------------------------------------------------------------
  // TESTE 3: VALIDAÇÃO DE SENHA FORTE (RNF0031)
  // --------------------------------------------------------------------------
  it('[RNF0031] Deve exibir erro e rejeitar cadastro com senha fraca (sem maiúscula ou caractere especial)', () => {
    cy.get('#btn-novo-cliente').click();
    cy.wait(600);

    cy.get('#field-nome').type('Cliente Senha Fraca');
    cy.get('#field-cpf').type('111.111.111-11');
    cy.get('#field-email').type('fraca@email.com');
    cy.get('#field-nascimento').type('1990-01-01');
    cy.get('#field-tel-ddd').type('11');
    cy.get('#field-tel-numero').type('99999-0000');

    // Digita senha fraca (apenas números)
    cy.get('#field-senha').type('123456');
    cy.get('#field-senha-confirma').type('123456');
    cy.get('#indicador-forca-senha').should('contain', 'Senha Fraca');
    cy.wait(800);

    cy.get('#btn-salvar-cliente').click();
    cy.get('#modal-erros-validacao').scrollIntoView().should('be.visible').and('contain', 'RNF0031');
    cy.wait(2500); // Pausa ampliada para o professor ler a regra de senha fraca
    cy.get('#modal-cliente').should('be.visible');
    cy.contains('button', 'Cancelar').click();
    cy.wait(1000);
  });

  // --------------------------------------------------------------------------
  // TESTE 4: CONFIRMAÇÃO DUPLA DE SENHA DIVERGENTE (RNF0032)
  // --------------------------------------------------------------------------
  it('[RNF0032] Deve rejeitar cadastro quando a confirmação de senha for diferente da senha', () => {
    cy.get('#btn-novo-cliente').click();
    cy.wait(600);

    cy.get('#field-nome').type('Cliente Senha Divergente');
    cy.get('#field-cpf').type('222.222.222-22');
    cy.get('#field-email').type('divergente@email.com');
    cy.get('#field-nascimento').type('1990-01-01');
    cy.get('#field-tel-ddd').type('11');
    cy.get('#field-tel-numero').type('99999-0000');

    // Digita senhas divergentes
    cy.get('#field-senha').type('SenhaForte@123');
    cy.get('#field-senha-confirma').type('OutraSenha@999');
    cy.wait(800);

    cy.get('#btn-salvar-cliente').click();
    cy.get('#modal-erros-validacao').scrollIntoView().should('be.visible').and('contain', 'RNF0032');
    cy.wait(2500); // Pausa ampliada para o professor ler a regra de confirmação divergente
    cy.contains('button', 'Cancelar').click();
    cy.wait(1000);
  });

  // --------------------------------------------------------------------------
  // TESTE 5: ALTERAÇÃO DE DADOS CADASTRAIS (RF0022)
  // --------------------------------------------------------------------------
  it('[RF0022] Deve alterar dados cadastrais de um cliente existente', () => {
    cy.wait(600);
    cy.get('[data-cy="linha-cliente-CLI-003"]').within(() => {
      cy.contains('button', 'Editar').click();
    });

    cy.get('#modal-cliente').should('be.visible');
    cy.wait(800);
    cy.get('#field-nome').clear().type('José de Alencar (Edição Histórica)');
    cy.wait(800);
    cy.get('#btn-salvar-cliente').click();

    cy.get('#modal-cliente').should('not.be.visible');
    cy.get('#mensagem-alerta').should('contain', 'sucesso');
    cy.get('#tabela-clientes-body').should('contain', 'José de Alencar (Edição Histórica)');
    cy.wait(1000);
  });

  // --------------------------------------------------------------------------
  // TESTE 6: ALTERAÇÃO EXCLUSIVA DE SENHA (RF0028, RNF0031, RNF0032)
  // --------------------------------------------------------------------------
  it('[RF0028] Deve alterar exclusivamente a senha do cliente sem revalidar demais dados', () => {
    cy.wait(600);
    cy.get('[data-cy="linha-cliente-CLI-003"]').within(() => {
      cy.contains('button', 'Senha').click();
    });

    cy.get('#modal-senha').should('be.visible');
    cy.wait(800);
    cy.get('#campo-nova-senha').type('NovaSenha@2026');
    cy.get('#campo-confirma-nova-senha').type('NovaSenha@2026');
    cy.wait(800);
    cy.get('#modal-senha').contains('button', 'Atualizar Senha').click();

    cy.get('#modal-senha').should('not.be.visible');
    cy.get('#mensagem-alerta').should('contain', 'RF0028');
    cy.wait(1000);
  });

  // --------------------------------------------------------------------------
  // TESTE 7: INATIVAÇÃO E REATIVAÇÃO DE CLIENTE (RF0023)
  // --------------------------------------------------------------------------
  it('[RF0023] Deve inativar o cliente (mudança de status para INATIVO) e permitir posterior reativação', () => {
    cy.wait(600);
    // 1. Inativar José de Alencar
    cy.get('[data-cy="linha-cliente-CLI-003"]').within(() => {
      cy.contains('button', 'Inativar').click();
    });
    cy.wait(1000);
    cy.get('[data-cy="badge-status-CLI-003"]').should('contain', 'INATIVO');

    // 2. Reativar José de Alencar
    cy.get('[data-cy="linha-cliente-CLI-003"]').within(() => {
      cy.contains('button', 'Reativar').click();
    });
    cy.wait(1000);
    cy.get('[data-cy="badge-status-CLI-003"]').should('contain', 'ATIVO');
    cy.wait(1000);
  });

  // --------------------------------------------------------------------------
  // TESTE 8: CONSULTA DE TRANSAÇÕES DO CLIENTE (RF0025)
  // --------------------------------------------------------------------------
  it('[RF0025] Deve exibir o histórico de transações/pedidos vinculados ao cliente', () => {
    cy.wait(800);
    cy.get('[data-cy="linha-cliente-CLI-001"]').within(() => {
      cy.contains('button', 'Transações').click();
    });

    cy.get('#modal-transacoes').should('be.visible');
    cy.wait(2500); // Pausa visual para o professor ver os pedidos detalhados na tela
    cy.get('#container-tabela-transacoes').should('contain', 'PED-2026-001');
    cy.get('#container-tabela-transacoes').should('contain', 'Dom Casmurro');
    cy.get('#container-tabela-transacoes').should('contain', 'R$ 89,90');
    cy.get('#modal-transacoes').contains('button', 'Fechar').click();
    cy.get('#modal-transacoes').should('not.be.visible');
    cy.wait(1000);
  });

  // --------------------------------------------------------------------------
  // TESTE 9: DISTINÇÃO INATIVAÇÃO VS EXCLUSÃO — BLOQUEIO POR HISTÓRICO
  // --------------------------------------------------------------------------
  it('[DISTINÇÃO] Deve BLOQUEAR a exclusão física de cliente que possui transações e instruir uso da inativação', () => {
    cy.wait(800);
    // Machado de Assis tem pedidos registrados
    cy.get('[data-cy="linha-cliente-CLI-001"]').within(() => {
      cy.contains('button', 'Excluir').click();
    });

    // Deve abrir o modal explicativo de BLOQUEIO da regra de negócio
    cy.get('#modal-bloqueio-exclusao').should('be.visible');
    cy.wait(3000); // Pausa ampliada para ler a explicação da regra fiscal e contábil
    cy.get('#texto-bloqueio-exclusao').should('contain', 'transação(ões)');
    cy.get('#modal-bloqueio-exclusao').contains('button', 'Entendido').click();
    cy.get('#modal-bloqueio-exclusao').should('not.be.visible');

    // Garante que Machado de Assis NÃO foi excluído
    cy.get('#tabela-clientes-body').should('contain', 'Machado de Assis');
    cy.wait(1200);
  });

  // --------------------------------------------------------------------------
  // TESTE 10: EXCLUSÃO PERMITIDA PARA CLIENTE SEM PEDIDOS
  // --------------------------------------------------------------------------
  it('[EXCLUSÃO PERMITIDA] Deve permitir a exclusão física de cliente que NÃO possui histórico de pedidos', () => {
    cy.wait(800);
    // José de Alencar (CLI-003) não possui compras registradas
    cy.get('[data-cy="linha-cliente-CLI-003"]').within(() => {
      cy.contains('button', 'Excluir').click();
    });

    cy.get('#mensagem-alerta').should('contain', 'excluído fisicamente com sucesso');
    cy.get('#tabela-clientes-body').should('not.contain', 'CLI-003');
    cy.wait(2000); // Pausa final para visualização da remoção
  });
});
