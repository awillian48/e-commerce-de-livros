/**
 * Testes Funcionais Automatizados - Criação de Pedido (CDU03 / DRS LES 2026)
 *
 * Roteiro Mínimo da Demonstração:
 * 1. Inclusão de mais de um livro no carrinho e alteração da quantidade de itens (RF0031, RF0032, RN0031).
 * 2. Bloqueio de itens indisponíveis ou quantidade superior ao estoque (RN0031).
 * 3. Compra com endereço e cartão previamente cadastrados (RF0033, RF0035, RF0036, RF0038).
 * 4. Compra com novo endereço e novo cartão incorporados ao perfil do cliente (RN0023, RN0024, RN0025, RF0035, RF0036).
 * 5. Pagamento com mais de um cartão de crédito, respeitando valor mínimo de R$ 10,00 por cartão (RN0034).
 * 6. Pagamento combinando cupons e cartão com valor inferior a R$ 10,00 no cartão (RN0035).
 * 7. Uso de cupons cujo valor supere o da compra com emissão de cupom de troca para a diferença (RN0036).
 * 8. Validação de regras de cupons: apenas 1 promocional (RN0033).
 */

// ============================================================================
// CONTROLE DE VELOCIDADE E FOCO VISUAL PARA APRESENTAÇÃO (DEMO / SLOW MOTION)
// ============================================================================
const PAUSA_DEMO = 1400;       // Pausa após cliques, selects e transições
const PAUSA_DIGITACAO = 1000;  // Pausa após digitação de cada campo
const PAUSA_LIMPEZA = 300;     // Pausa após clear()

// Digitação visível caractere por caractere (85ms entre teclas)
Cypress.Keyboard.defaults({
  keystrokeDelay: 85
});

/**
 * Cria ou atualiza o HUD (indicador flutuante) de demonstração no topo da tela
 */
function atualizarHUD(mensagem) {
  try {
    const doc = Cypress.$(cy.state('window').document);
    let hud = doc.find('#cypress-demo-hud');
    if (!hud.length) {
      hud = Cypress.$('<div id="cypress-demo-hud" style="position: fixed; top: 12px; left: 50%; transform: translateX(-50%); z-index: 9999999; background: #0f172a; color: #f8fafc; padding: 7px 20px; border-radius: 9999px; font-size: 0.85rem; font-weight: 600; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5), 0 0 0 2px #d97706; pointer-events: none; transition: all 0.2s ease; display: flex; align-items: center; gap: 8px; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;"><span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #22c55e;"></span><span id="hud-texto"></span></div>');
      doc.find('body').append(hud);
    }
    hud.find('#hud-texto').text(mensagem || 'Executando...');
  } catch (e) { }
}

/**
 * Centraliza o elemento no meio da tela e aplica destaque visual
 */
function focarNoElemento($el, acao = 'Focando') {
  if (!$el) return;
  const domEl = $el[0] || $el;
  if (!domEl) return;

  try {
    const isDentroDeModal = domEl.closest && domEl.closest('.modal-overlay, #modal-novo-cartao-checkout, #sistema-modal-dialogo, .modal-box');

    // 1. Rolagem de tela:
    // Se o elemento estiver dentro de um modal fixo, NÃO rola a página de fundo
    if (isDentroDeModal) {
      const modalBox = domEl.closest('.modal-box, #sistema-modal-dialogo > div');
      if (modalBox && modalBox.scrollHeight > modalBox.clientHeight && typeof domEl.scrollIntoView === 'function') {
        domEl.scrollIntoView({ block: 'nearest', inline: 'center' });
      }
    } else {
      // Se for elemento da página comum, centraliza no meio vertical da tela
      if (typeof domEl.scrollIntoView === 'function') {
        domEl.scrollIntoView({ block: 'center', inline: 'center' });
      }
    }

    // 2. Atualiza o HUD visual no topo
    const rotulo = domEl.getAttribute('id') || domEl.getAttribute('name') || domEl.getAttribute('placeholder') || domEl.textContent?.trim().slice(0, 25) || domEl.tagName;
    atualizarHUD(`${acao}: ${rotulo}`);

    // 3. Destaca o elemento ativo
    if (domEl.style) {
      domEl.style.transition = 'box-shadow 0.2s ease, border-color 0.2s ease';
      domEl.style.boxShadow = '0 0 0 4px rgba(217, 119, 6, 0.85), 0 0 25px rgba(217, 119, 6, 0.45)';
      domEl.style.borderColor = '#d97706';
      domEl.style.outline = 'none';
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(domEl.tagName)) {
        domEl.style.backgroundColor = '#fffbeb';
      }
      setTimeout(() => {
        try {
          domEl.style.boxShadow = '';
          domEl.style.borderColor = '';
          domEl.style.backgroundColor = '';
        } catch (e) { }
      }, PAUSA_DEMO + 400);
    }
  } catch (e) { }
}

if (PAUSA_DEMO > 0) {
  // Pausa após carregar uma página (visit)
  Cypress.Commands.overwrite('visit', (originalFn, ...args) => {
    atualizarHUD(`Navegando para: ${args[0]}`);
    return originalFn(...args).then((val) => {
      return Cypress.Promise.delay(PAUSA_DEMO).then(() => val);
    });
  });

  // Foco no centro + clique + pausa posterior
  Cypress.Commands.overwrite('click', (originalFn, subject, ...args) => {
    focarNoElemento(subject, 'Clicando');
    return originalFn(subject, ...args).then((val) => {
      return Cypress.Promise.delay(PAUSA_DEMO).then(() => val);
    });
  });

  // Foco no centro + digitação visível + pausa pós-digitação
  Cypress.Commands.overwrite('type', (originalFn, subject, text, options) => {
    focarNoElemento(subject, 'Digitando');
    return originalFn(subject, text, options).then((val) => {
      return Cypress.Promise.delay(PAUSA_DIGITACAO).then(() => val);
    });
  });

  // Limpeza de campo
  Cypress.Commands.overwrite('clear', (originalFn, subject, ...args) => {
    focarNoElemento(subject, 'Limpando');
    return originalFn(subject, ...args).then((val) => {
      return Cypress.Promise.delay(PAUSA_LIMPEZA).then(() => val);
    });
  });

  // Seleção de dropdown
  Cypress.Commands.overwrite('select', (originalFn, subject, ...args) => {
    focarNoElemento(subject, 'Selecionando');
    return originalFn(subject, ...args).then((val) => {
      return Cypress.Promise.delay(PAUSA_DEMO).then(() => val);
    });
  });

  // Marcação de checkbox/radio
  Cypress.Commands.overwrite('check', (originalFn, subject, ...args) => {
    focarNoElemento(subject, 'Marcando');
    return originalFn(subject, ...args).then((val) => {
      return Cypress.Promise.delay(PAUSA_DEMO).then(() => val);
    });
  });

  // Submissão de formulário
  Cypress.Commands.overwrite('submit', (originalFn, subject, ...args) => {
    focarNoElemento(subject, 'Enviando');
    return originalFn(subject, ...args).then((val) => {
      return Cypress.Promise.delay(PAUSA_DEMO).then(() => val);
    });
  });
}

describe('Criação de Pedido - Roteiro Completo da Apresentação (DRS LES 2026)', () => {
  before(() => {
    cy.request({
      method: 'DELETE',
      url: '/api/checkout/limpeza-testes',
      failOnStatusCode: false
    });
  });

  after(() => {
    cy.request({
      method: 'DELETE',
      url: '/api/checkout/limpeza-testes',
      failOnStatusCode: false
    });
  });


  beforeEach(() => {
    cy.clearLocalStorage();
  });

  // --------------------------------------------------------------------------
  // CENÁRIO 1: CARRINHO DE COMPRAS E CONTROLE DE ESTOQUE (RF0031, RF0032, RN0031)
  // --------------------------------------------------------------------------
  it('1. Deve incluir mais de um livro no carrinho e alterar a quantidade de itens (RF0031, RF0032)', () => {
    cy.visit('/index.html');

    // Aguarda carregar os cards da vitrine
    cy.get('.book-card', { timeout: 10000 }).should('have.length.at.least', 2);

    // Seleciona o primeiro card com botão ativo de adicionar
    cy.get('.btn-add-carrinho:not([disabled])').eq(0).closest('.book-card').within(() => {
      cy.get('.input-qtd-vitrine').clear().type('2');
      cy.get('.btn-add-carrinho').click();
    });

    // Seleciona o segundo card com botão ativo de adicionar
    cy.get('.btn-add-carrinho:not([disabled])').eq(1).closest('.book-card').within(() => {
      cy.get('.input-qtd-vitrine').clear().type('1');
      cy.get('.btn-add-carrinho').click();
    });

    // Verifica o badge de quantidade total no carrinho (2 + 1 = 3 itens)
    cy.get('a[href*="carrinho.html"]').first().should('contain', 'Carrinho (3)');

    // Navega para a página de carrinho
    cy.visit('/carrinho.html');

    // Valida que existem 2 linhas de produtos na tabela
    cy.get('#tabela-carrinho-body tr').should('have.length', 2);

    // Altera a quantidade do primeiro item de 2 para 4
    cy.get('.input-qtd-carrinho', { timeout: 10000 }).first().invoke('val', 4).trigger('change');

    // Valida que o total do carrinho foi recalculado
    cy.get('#total-carrinho').should('not.contain', 'R$ 0,00');

    // Valida o botão de Iniciar Compra (RF0033)
    cy.get('#btn-ir-checkout').should('be.visible').click();
    cy.url().should('include', 'checkout.html');
  });

  it('2. Não deve permitir adicionar itens indisponíveis ou quantidade superior ao estoque (RN0031)', () => {
    cy.visit('/index.html');

    // Livro esgotado deve ter o botão desabilitado
    cy.contains('.book-card', 'Esgotado').within(() => {
      cy.get('.btn-add-carrinho').should('be.disabled');
      cy.get('.input-qtd-vitrine').should('be.disabled');
    });

    // Testa tentativa de quantidade superior ao estoque via Carrinho Store no navegador
    cy.window().then((win) => {
      const resultado = win.Carrinho.adicionar(
        { id: 'teste-estoque', titulo: 'Livro Raro', estoque: 2, preco: 50.0 },
        5 // Deseja 5, estoque tem apenas 2
      );
      expect(resultado.sucesso).to.be.false;
      expect(resultado.mensagem).to.include('superior ao estoque');
    });
  });

  // --------------------------------------------------------------------------
  // CENÁRIO 2: COMPRA COM ENDEREÇO E CARTÃO SALVOS NO PERFIL (RF0033 a RF0038)
  // --------------------------------------------------------------------------
  it('3. Deve finalizar compra com endereço e cartão previamente cadastrados (RF0033 a RF0038)', () => {
    const itensCarrinho = [
      {
        livroId: 'LIV-001',
        titulo: 'Dom Casmurro',
        preco: 45.90,
        precoCentavos: 4590,
        pesoKg: 0.45,
        estoque: 20,
        quantidade: 1,
        capa: '/img/capas/LIV-001.svg'
      }
    ];

    cy.intercept('GET', '/api/checkout/cliente/*').as('carregarCliente');
    cy.intercept('POST', '/api/checkout/frete').as('calcularFrete');


    cy.visit('/checkout.html', {
      onBeforeLoad(win) {
        win.localStorage.setItem('alexandria:carrinho', JSON.stringify(itensCarrinho));
        win.localStorage.setItem('alexandria:cliente_codigo', 'CLI-001');
      }
    });

    cy.wait('@carregarCliente');
    cy.wait('@calcularFrete');

    // 1. Verifica seleção de endereço previamente cadastrado
    cy.get('#container-enderecos-salvos input[type="radio"]', { timeout: 10000 }).should('have.length.at.least', 1);
    cy.get('#container-enderecos-salvos input[type="radio"]').first().should('be.checked');

    // 2. Verifica cálculo automático do frete com critério adotado
    cy.get('#valor-frete').should('not.contain', 'R$ 0,00');

    // 3. Verifica seleção de cartão previamente cadastrado
    cy.get('#select-cartao-1 option').should('have.length.at.least', 2);

    // 4. Finaliza a compra
    cy.get('#btn-finalizar-compra', { timeout: 15000 }).should('be.enabled').click();

    // 5. Valida tela de confirmação e status EM PROCESSAMENTO
    cy.get('#confirmacao-pedido', { timeout: 20000 }).should('be.visible');
    cy.get('#pedido-numero').should('contain', 'PED-');
    cy.get('#pedido-status').should('contain', 'EM PROCESSAMENTO');
  });

  // --------------------------------------------------------------------------
  // CENÁRIO 3: NOVO ENDEREÇO E NOVO CARTÃO INCORPORADOS AO PERFIL
  // --------------------------------------------------------------------------
  it('4. Deve finalizar compra com novo endereço (RN0023) e novo cartão (RN0024/25) incorporados ao perfil', () => {
    const itensCarrinho = [
      {
        livroId: 'LIV-001',
        titulo: 'Dom Casmurro',
        preco: 45.90,
        precoCentavos: 4590,
        pesoKg: 0.45,
        estoque: 10,
        quantidade: 1,
        capa: '/img/capas/LIV-001.svg'
      }
    ];

    cy.visit('/checkout.html', {
      onBeforeLoad(win) {
        win.localStorage.setItem('alexandria:carrinho', JSON.stringify(itensCarrinho));
        win.localStorage.setItem('alexandria:cliente_codigo', 'CLI-001');
      }
    });

    // 1. Seleciona cadastrar novo endereço e dispara change
    cy.get('#radio-novo-endereco').check({ force: true }).trigger('change');
    cy.get('#form-novo-endereco').should('be.visible');

    // Preenche todos os campos obrigatórios da RN0023
    const timestamp = Date.now().toString().slice(-4);
    cy.get('#end-frase').type(`Residência de Férias ${timestamp}`);
    cy.get('#end-tipo-residencia').select('CASA');
    cy.get('#end-tipo-logradouro').select('RUA');
    cy.get('#end-logradouro').type('Rua das Acácias Floridas');
    cy.get('#end-numero').type('742');
    cy.get('#end-bairro').type('Jardim Primavera');
    cy.get('#end-cep').type('04538133');
    cy.get('#end-cidade').type('São Paulo');
    cy.get('#end-estado').type('SP').trigger('blur');
    cy.get('#end-salvar-perfil').should('be.checked'); // Incorpora ao perfil

    // 2. Cadastra novo cartão via modal (RN0024 e RN0025)
    cy.get('#btn-abrir-modal-cartao').click();
    cy.get('#modal-novo-cartao-checkout').should('be.visible');
    cy.wait(2000); // Pausa estratégica para visualização do modal 100% centralizado!

    cy.get('#novo-cartao-numero').type('4111222233334444');
    cy.get('#novo-cartao-nome').type('MACHADO DE ASSIS');
    cy.get('#novo-cartao-bandeira').select('VISA');
    cy.get('#novo-cartao-validade').type('1229');
    cy.get('#novo-cartao-cvv').type('888');
    cy.get('#novo-cartao-salvar-perfil').should('be.checked'); // Incorpora ao perfil
    cy.wait(1200); // Pausa para conferir todos os campos do modal preenchidos
    cy.get('#btn-salvar-novo-cartao').click();

    cy.get('#modal-novo-cartao-checkout').should('not.be.visible');
    cy.get('#badge-cartao-feedback').should('be.visible').and('contain', 'final 4444');

    // 3. Finaliza a compra
    cy.get('#btn-finalizar-compra', { timeout: 10000 }).should('be.enabled').click();

    // 4. Confirmação
    cy.get('#confirmacao-pedido', { timeout: 20000 }).should('be.visible');
    cy.get('#pedido-status').should('contain', 'EM PROCESSAMENTO');
  });

  // --------------------------------------------------------------------------
  // CENÁRIO 4: PAGAMENTO COM MÚLTIPLOS CARTÕES (RN0034)
  // --------------------------------------------------------------------------
  it('5. Deve validar pagamento com mais de um cartão e valor mínimo de R$ 10,00 por cartão (RN0034)', () => {
    const itensCarrinho = [
      {
        livroId: 'LIV-001',
        titulo: 'Dom Casmurro',
        preco: 45.90,
        precoCentavos: 4590,
        pesoKg: 0.45,
        estoque: 10,
        quantidade: 2, // 2 unidades = R$ 91,80
        capa: '/img/capas/LIV-001.svg'
      }
    ];

    cy.visit('/checkout.html', {
      onBeforeLoad(win) {
        win.localStorage.setItem('alexandria:carrinho', JSON.stringify(itensCarrinho));
        win.localStorage.setItem('alexandria:cliente_codigo', 'CLI-001');
      }
    });

    // Seleciona Cartão 2
    cy.get('#select-cartao-2 option', { timeout: 15000 }).should('have.length.at.least', 3);
    cy.get('#select-cartao-2').select(2);

    // Tenta colocar valor inferior a R$ 10,00 no Cartão 2 (ex: R$ 5,00)
    cy.get('#input-valor-cartao2').clear().type('5.00').trigger('input').trigger('change').trigger('blur');

    // RN0034: deve bloquear a finalização e exibir erro de valor mínimo
    cy.get('#container-erros-pagamento').should('be.visible');
    cy.get('#erros-pagamento').should('contain', 'RN0034');
    cy.get('#btn-finalizar-compra').should('be.disabled');

    // Corrige para valor válido respeitando o mínimo (ex: R$ 30,00 no Cartão 2)
    cy.get('#input-valor-cartao2').clear().type('30.00').trigger('input').trigger('change').trigger('blur');

    // Obtém o valor total para preencher a diferença exata no Cartão 1
    cy.get('#resumo-total').invoke('text').then((totalTexto) => {
      const totalNum = parseFloat(totalTexto.replace(/[^\d,]/g, '').replace(',', '.'));
      const val1 = (totalNum - 30.00).toFixed(2);
      cy.get('#input-valor-cartao1').clear().type(val1).trigger('input').trigger('change').trigger('blur');

      // Botão habilitado com valores >= 10 em ambos
      cy.get('#container-erros-pagamento').should('not.be.visible');
      cy.get('#btn-finalizar-compra').should('be.enabled').click();

      cy.get('#confirmacao-pedido', { timeout: 20000 }).should('be.visible');
      cy.get('#pedido-status').should('contain', 'EM PROCESSAMENTO');
    });
  });

  // --------------------------------------------------------------------------
  // CENÁRIO 5: CUPONS + CARTÃO COM VALOR INFERIOR A R$ 10,00 (RN0035)
  // --------------------------------------------------------------------------
  it('6. Deve permitir valor inferior a R$ 10,00 no cartão ao combinar com cupons (RN0035)', () => {
    const codigoCupomUnico = `TR-TEST-${Date.now().toString().slice(-6)}`;

    cy.request('POST', '/api/cupons', {
      codigo: codigoCupomUnico,
      tipo: 'TROCA',
      valor: 50.00
    });

    const itensCarrinho = [
      {
        livroId: 'LIV-001',
        titulo: 'Dom Casmurro',
        preco: 45.90, // Subtotal 45,90 + Frete 11,35 (RJ) = 57,25 -> Cupom 50,00 sobra 7,25 (< R$ 10,00)
        precoCentavos: 4590,
        pesoKg: 0.45,
        estoque: 10,
        quantidade: 1,
        capa: '/img/capas/LIV-001.svg'
      }
    ];

    cy.visit('/checkout.html', {
      onBeforeLoad(win) {
        win.localStorage.setItem('alexandria:carrinho', JSON.stringify(itensCarrinho));
        win.localStorage.setItem('alexandria:cliente_codigo', 'CLI-001');
      }
    });

    // 1. Aguarda cálculo automático do frete
    cy.get('#valor-frete', { timeout: 15000 }).should('not.contain', 'R$ 0,00');

    // 2. Aplica o cupom de troca de R$ 50,00
    cy.get('#input-codigo-cupom', { timeout: 15000 }).clear().type(codigoCupomUnico);
    cy.get('#btn-aplicar-cupom').click();
    cy.get('#lista-cupons-aplicados', { timeout: 15000 }).should('contain', codigoCupomUnico);

    // O valor no cartão restante é de ~R$ 7,25 (< 10,00)
    // De acordo com a RN0035, esta é a ÚNICA situação permitida para cartão < R$ 10,00
    cy.get('#btn-finalizar-compra', { timeout: 10000 }).should('be.enabled').click();

    cy.get('#confirmacao-pedido', { timeout: 20000 }).should('be.visible');
    cy.get('#pedido-status').should('contain', 'EM PROCESSAMENTO');
  });

  // --------------------------------------------------------------------------
  // CENÁRIO 6: CUPONS SUPERAM A COMPRA COM EMISSÃO DE CUPOM DE TROCA (RN0036)
  // --------------------------------------------------------------------------
  it('7. Deve emitir cupom de troca para a diferença quando cupons superarem o valor da compra (RN0036)', () => {
    const cupomAlto = `TR-SUPER-${Date.now().toString().slice(-6)}`;

    // Cria cupom de troca com valor superior à compra (ex: R$ 150,00)
    cy.request('POST', '/api/cupons', {
      codigo: cupomAlto,
      tipo: 'TROCA',
      valor: 150.00
    });

    const itensCarrinho = [
      {
        livroId: 'LIV-001',
        titulo: 'Dom Casmurro',
        preco: 45.90,
        precoCentavos: 4590,
        pesoKg: 0.45,
        estoque: 10,
        quantidade: 1,
        capa: '/img/capas/LIV-001.svg'
      }
    ];

    cy.visit('/checkout.html', {
      onBeforeLoad(win) {
        win.localStorage.setItem('alexandria:carrinho', JSON.stringify(itensCarrinho));
        win.localStorage.setItem('alexandria:cliente_codigo', 'CLI-001');
      }
    });

    // Aplica o cupom de R$ 150,00
    cy.get('#input-codigo-cupom').type(cupomAlto);
    cy.get('#btn-aplicar-cupom').click();

    // Verifica que a linha de troco/crédito é exibida
    cy.get('#linha-troco').should('be.visible');
    cy.get('#resumo-troco').should('not.contain', 'R$ 0,00');

    // Finaliza a compra paga 100% com cupons
    cy.get('#btn-finalizar-compra', { timeout: 10000 }).should('be.enabled').click();

    // Valida confirmação e o cupom de troca emitido
    cy.get('#confirmacao-pedido', { timeout: 20000 }).should('be.visible');
    cy.get('#container-cupom-troca').should('be.visible');
    cy.get('#cupom-troca-gerado').should('contain', 'TR-');
    cy.get('#pedido-status').should('contain', 'EM PROCESSAMENTO');
  });

  // --------------------------------------------------------------------------
  // CENÁRIO 7: REGRAS RESTRITIVAS DE CUPOM (RN0033)
  // --------------------------------------------------------------------------
  it('8. Deve validar restrição de cupons: máximo 1 promocional por compra (RN0033)', () => {
    const itensCarrinho = [
      {
        livroId: 'LIV-001',
        titulo: 'Dom Casmurro',
        preco: 45.90,
        precoCentavos: 4590,
        pesoKg: 0.45,
        estoque: 10,
        quantidade: 1,
        capa: '/img/capas/LIV-001.svg'
      }
    ];

    cy.visit('/checkout.html', {
      onBeforeLoad(win) {
        win.localStorage.setItem('alexandria:carrinho', JSON.stringify(itensCarrinho));
        win.localStorage.setItem('alexandria:cliente_codigo', 'CLI-001');
      }
    });

    // Usa os cupons promocionais oficiais PROMO10 e PROMO20
    const promo1 = 'PROMO10';
    const promo2 = 'PROMO20';

    // Aplica o primeiro
    cy.get('#input-codigo-cupom', { timeout: 15000 }).clear().type(promo1);
    cy.get('#btn-aplicar-cupom').click();
    cy.get('#lista-cupons-aplicados', { timeout: 10000 }).should('contain', promo1);

    // Aplica o segundo promocional
    cy.get('#input-codigo-cupom', { timeout: 15000 }).clear().type(promo2);
    cy.get('#btn-aplicar-cupom').click();
    cy.get('#lista-cupons-aplicados', { timeout: 10000 }).should('contain', promo2);

    // RN0033: Bloqueio por múltiplos promocionais
    cy.get('#container-erros-pagamento').should('be.visible');
    cy.get('#erros-pagamento').should('contain', 'RN0033');
    cy.get('#btn-finalizar-compra').should('be.disabled');
  });
});
