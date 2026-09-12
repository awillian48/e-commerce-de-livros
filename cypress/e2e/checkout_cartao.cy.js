describe('Validação de Adição de Novo Cartão no Checkout', () => {
  beforeEach(() => {
    cy.visit('/checkout.html');
  });

  it('Deve carregar os cartões padrão e abrir o modal ao clicar em Adicionar Novo Cartão', () => {
    cy.get('#select-cartao-1').should('be.visible');
    cy.get('#select-cartao-1 option').should('have.length.at.least', 2);

    // Modal inicialmente fechado
    cy.get('#modal-novo-cartao-checkout').should('not.be.visible');

    // Clica no botão de adicionar novo cartão
    cy.get('#btn-abrir-modal-cartao').click();
    cy.get('#modal-novo-cartao-checkout').should('be.visible');

    // Fecha modal
    cy.get('#modal-novo-cartao-checkout button:contains("✕")').click();
    cy.get('#modal-novo-cartao-checkout').should('not.be.visible');
  });

  it('Deve preencher, validar e adicionar com sucesso um novo cartão ao checkout', () => {
    cy.get('#btn-abrir-modal-cartao').click();
    cy.get('#modal-novo-cartao-checkout').should('be.visible');

    // Preenche os dados do novo cartão
    cy.get('#novo-cartao-numero').type('5555444433332222');
    cy.get('#novo-cartao-nome').type('Machado de Assis');
    cy.get('#novo-cartao-bandeira').select('MASTERCARD');
    cy.get('#novo-cartao-validade').type('1129');
    cy.get('#novo-cartao-cvv').type('789');
    cy.get('#novo-cartao-preferencial').check();

    // Submete o formulário
    cy.get('#form-novo-cartao-checkout').submit();

    // Modal deve fechar
    cy.get('#modal-novo-cartao-checkout').should('not.be.visible');

    // Feedback de sucesso visível
    cy.get('#badge-cartao-feedback').should('be.visible').and('contain', 'final 2222');

    // Novo cartão deve ser selecionado no Cartão 1
    cy.get('#select-cartao-1 option:selected').should('contain', '2222');
  });

  it('Deve abrir o modal ao selecionar a opção "+ Adicionar novo cartão..." no select', () => {
    cy.get('#select-cartao-2').select('__NOVO__');
    cy.get('#modal-novo-cartao-checkout').should('be.visible');
    cy.get('#modal-novo-cartao-checkout button:contains("Cancelar")').click();
    cy.get('#modal-novo-cartao-checkout').should('not.be.visible');
  });
});
