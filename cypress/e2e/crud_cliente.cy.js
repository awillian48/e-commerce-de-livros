/**
 * ============================================================================
 * SUÍTE DE TESTES AUTOMATIZADOS DE INTERFACE (E2E) — CYPRESS
 * Disciplina: Laboratório de Engenharia de Software (LES 2026)
 * Alunos: Anderson Barros & João Pedro Scandiuzzi
 * 
 * Demonstração e comprovação automatizada do CRUD de Cliente
 * Rastreabilidade completa de Requisitos Funcionais (RF), Regras de Negócio (RN)
 * e Requisitos Não Funcionais (RNF) conforme o documento DRS_LES_2_2026.
 * ============================================================================
 */

describe('Suíte de Testes Automatizados — CRUD Completo de Cliente (LES 2026)', () => {
  beforeEach(() => {
    // Garante confirmação automática para caixas nativas de window.confirm
    cy.on('window:confirm', () => true);
    cy.visit('/admin/clientes.html');
  });

  // --------------------------------------------------------------------------
  // TESTE 1: CONSULTA DE CLIENTES COM FILTROS ISOLADOS E COMBINADOS (RF0024)
  // --------------------------------------------------------------------------
  it('[RF0024] Deve consultar clientes com filtros isolados (por nome) e combinados (por status)', () => {
    // 1. Filtro isolado por nome
    cy.get('#filtro-nome').clear().type('Machado');
    cy.get('#btn-filtrar').click();
    cy.get('#tabela-clientes-body').should('contain', 'Machado de Assis');
    cy.get('#tabela-clientes-body').should('not.contain', 'Clarice Lispector');

    // 2. Limpar filtros
    cy.get('#btn-limpar-filtros').click();
    cy.get('#tabela-clientes-body').should('contain', 'Machado de Assis');
    cy.get('#tabela-clientes-body').should('contain', 'Clarice Lispector');

    // 3. Filtro isolado por status INATIVO
    cy.get('#filtro-status').select('INATIVO');
    cy.get('#btn-filtrar').click();
    cy.get('#tabela-clientes-body').should('contain', 'Clarice Lispector');
    cy.get('#tabela-clientes-body').should('not.contain', 'Machado de Assis');

    // 4. Limpar novamente
    cy.get('#btn-limpar-filtros').click();
  });

  // --------------------------------------------------------------------------
  // TESTE 2: CADASTRO DE NOVO CLIENTE COM SUCESSO (RF0021, RN0026, RNF0035, RF0026, RF0027)
  // --------------------------------------------------------------------------
  it('[RF0021][RN0026][RNF0035][RF0026][RF0027] Deve cadastrar um novo cliente com dados pessoais, endereço e cartão válidos', () => {
    cy.get('#btn-novo-cliente').click();
    cy.get('#modal-cliente').should('be.visible');

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

    // 2. Senha Forte e Confirmação Dupla (RNF0031 e RNF0032)
    cy.get('#field-senha').type('Alencar@2026');
    cy.get('#field-senha-confirma').type('Alencar@2026');
    cy.get('#indicador-forca-senha').should('contain', 'Senha Forte');

    // 3. Endereço com Frase Curta e Finalidade (RF0026, RN0021, RN0022, RN0023)
    cy.get('#container-enderecos-form').within(() => {
      cy.get('input[placeholder*="Minha Casa"]').clear().type('Solar dos Românticos');
      cy.get('input[placeholder="Nome da rua/av"]').clear().type('Rua da Literatura');
      cy.get('input[placeholder="Nº"]').clear().type('150');
      cy.get('input[placeholder="Bairro"]').clear().type('Meireles');
      cy.get('input[placeholder="00000-000"]').clear().type('60165-000');
      cy.get('input[placeholder="Cidade"]').clear().type('Fortaleza');
      cy.get('input[placeholder="SP"]').clear().type('CE');
    });

    // 4. Cartão de Crédito com Bandeira Homologada e Preferencial (RN0024, RN0025, RF0027)
    cy.get('#container-cartoes-form').within(() => {
      cy.get('input[placeholder*="0000 0000"]').clear().type('4532 9999 8888 7777');
      cy.get('input[placeholder*="como no plástico"]').clear().type('JOSE M ALENCAR');
      cy.get('select').select('VISA');
      cy.get('input[placeholder="123"]').clear().type('888');
      cy.get('input[type="radio"]').check();
    });

    // Salvar e verificar fechamento do modal e listagem
    cy.get('#btn-salvar-cliente').click();
    cy.get('#modal-cliente').should('not.be.visible');
    cy.get('#mensagem-alerta').should('contain', 'sucesso');

    // Verifica que o novo cliente foi listado com código único (RNF0035)
    cy.get('#tabela-clientes-body').should('contain', 'José de Alencar');
    cy.get('#tabela-clientes-body').should('contain', 'CLI-003');
  });

  // --------------------------------------------------------------------------
  // TESTE 3: VALIDAÇÃO DE SENHA FORTE (RNF0031)
  // --------------------------------------------------------------------------
  it('[RNF0031] Deve exibir erro e rejeitar cadastro com senha fraca (sem maiúscula ou caractere especial)', () => {
    cy.get('#btn-novo-cliente').click();

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

    cy.get('#btn-salvar-cliente').click();
    cy.get('#modal-erros-validacao').scrollIntoView().should('be.visible').and('contain', 'RNF0031');
    cy.get('#modal-cliente').should('be.visible');
    cy.contains('button', 'Cancelar').click();
  });

  // --------------------------------------------------------------------------
  // TESTE 4: CONFIRMAÇÃO DUPLA DE SENHA DIVERGENTE (RNF0032)
  // --------------------------------------------------------------------------
  it('[RNF0032] Deve rejeitar cadastro quando a confirmação de senha for diferente da senha', () => {
    cy.get('#btn-novo-cliente').click();

    cy.get('#field-nome').type('Cliente Senha Divergente');
    cy.get('#field-cpf').type('222.222.222-22');
    cy.get('#field-email').type('divergente@email.com');
    cy.get('#field-nascimento').type('1990-01-01');
    cy.get('#field-tel-ddd').type('11');
    cy.get('#field-tel-numero').type('99999-0000');

    // Digita senhas divergentes
    cy.get('#field-senha').type('SenhaForte@123');
    cy.get('#field-senha-confirma').type('OutraSenha@999');

    cy.get('#btn-salvar-cliente').click();
    cy.get('#modal-erros-validacao').scrollIntoView().should('be.visible').and('contain', 'RNF0032');
    cy.contains('button', 'Cancelar').click();
  });

  // --------------------------------------------------------------------------
  // TESTE 5: ALTERAÇÃO DE DADOS CADASTRAIS (RF0022)
  // --------------------------------------------------------------------------
  it('[RF0022] Deve alterar dados cadastrais de um cliente existente', () => {
    // Edita o José de Alencar cadastrado anteriormente
    cy.get('[data-cy="linha-cliente-CLI-003"]').within(() => {
      cy.contains('button', 'Editar').click();
    });

    cy.get('#modal-cliente').should('be.visible');
    cy.get('#field-nome').clear().type('José de Alencar (Edição Histórica)');
    cy.get('#btn-salvar-cliente').click();

    cy.get('#modal-cliente').should('not.be.visible');
    cy.get('#mensagem-alerta').should('contain', 'sucesso');
    cy.get('#tabela-clientes-body').should('contain', 'José de Alencar (Edição Histórica)');
  });

  // --------------------------------------------------------------------------
  // TESTE 6: ALTERAÇÃO EXCLUSIVA DE SENHA (RF0028, RNF0031, RNF0032)
  // --------------------------------------------------------------------------
  it('[RF0028] Deve alterar exclusivamente a senha do cliente sem revalidar demais dados', () => {
    cy.get('[data-cy="linha-cliente-CLI-003"]').within(() => {
      cy.contains('button', 'Senha').click();
    });

    cy.get('#modal-senha').should('be.visible');
    cy.get('#campo-nova-senha').type('NovaSenha@2026');
    cy.get('#campo-confirma-nova-senha').type('NovaSenha@2026');
    cy.get('#modal-senha').contains('button', 'Atualizar Senha').click();

    cy.get('#modal-senha').should('not.be.visible');
    cy.get('#mensagem-alerta').should('contain', 'RF0028');
  });

  // --------------------------------------------------------------------------
  // TESTE 7: INATIVAÇÃO E REATIVAÇÃO DE CLIENTE (RF0023)
  // --------------------------------------------------------------------------
  it('[RF0023] Deve inativar o cliente (mudança de status para INATIVO) e permitir posterior reativação', () => {
    // 1. Inativar José de Alencar
    cy.get('[data-cy="linha-cliente-CLI-003"]').within(() => {
      cy.contains('button', 'Inativar').click();
    });

    cy.get('[data-cy="badge-status-CLI-003"]').should('contain', 'INATIVO');

    // 2. Reativar José de Alencar
    cy.get('[data-cy="linha-cliente-CLI-003"]').within(() => {
      cy.contains('button', 'Reativar').click();
    });

    cy.get('[data-cy="badge-status-CLI-003"]').should('contain', 'ATIVO');
  });

  // --------------------------------------------------------------------------
  // TESTE 8: CONSULTA DE TRANSAÇÕES DO CLIENTE (RF0025)
  // --------------------------------------------------------------------------
  it('[RF0025] Deve exibir o histórico de transações/pedidos vinculados ao cliente', () => {
    cy.get('[data-cy="linha-cliente-CLI-001"]').within(() => {
      cy.contains('button', 'Transações').click();
    });

    cy.get('#modal-transacoes').should('be.visible');
    cy.get('#container-tabela-transacoes').should('contain', 'PED-2026-001');
    cy.get('#container-tabela-transacoes').should('contain', 'Dom Casmurro');
    cy.get('#container-tabela-transacoes').should('contain', 'R$ 89,90');
    cy.get('#modal-transacoes').contains('button', 'Fechar').click();
    cy.get('#modal-transacoes').should('not.be.visible');
  });

  // --------------------------------------------------------------------------
  // TESTE 9: DISTINÇÃO INATIVAÇÃO VS EXCLUSÃO — BLOQUEIO POR HISTÓRICO
  // --------------------------------------------------------------------------
  it('[DISTINÇÃO] Deve BLOQUEAR a exclusão física de cliente que possui transações e instruir uso da inativação', () => {
    // Machado de Assis tem pedidos registrados
    cy.get('[data-cy="linha-cliente-CLI-001"]').within(() => {
      cy.contains('button', 'Excluir').click();
    });

    // Deve abrir o modal explicativo de BLOQUEIO da regra de negócio
    cy.get('#modal-bloqueio-exclusao').should('be.visible');
    cy.get('#texto-bloqueio-exclusao').should('contain', 'transação(ões)');
    cy.get('#modal-bloqueio-exclusao').contains('button', 'Entendido').click();
    cy.get('#modal-bloqueio-exclusao').should('not.be.visible');

    // Garante que Machado de Assis NÃO foi excluído
    cy.get('#tabela-clientes-body').should('contain', 'Machado de Assis');
  });

  // --------------------------------------------------------------------------
  // TESTE 10: EXCLUSÃO PERMITIDA PARA CLIENTE SEM PEDIDOS
  // --------------------------------------------------------------------------
  it('[EXCLUSÃO PERMITIDA] Deve permitir a exclusão física de cliente que NÃO possui histórico de pedidos', () => {
    // José de Alencar (CLI-003) não possui compras registradas
    cy.get('[data-cy="linha-cliente-CLI-003"]').within(() => {
      cy.contains('button', 'Excluir').click();
    });

    cy.get('#mensagem-alerta').should('contain', 'excluído fisicamente com sucesso');
    cy.get('#tabela-clientes-body').should('not.contain', 'CLI-003');
  });
});
