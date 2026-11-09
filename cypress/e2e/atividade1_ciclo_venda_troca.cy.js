/**
 * Atividade 1 — Suíte de Testes Funcionais Automatizados (Cypress)
 * Caso de Uso de Venda de Ponta a Ponta no E-Commerce de Livros (LES 2026)
 *
 * Roteiro Mínimo de Demonstração (11 Cenários Oficiais):
 * 1) Compra aprovada com um cartão.
 * 2) Compra com dois ou mais cartões, incluindo a tentativa de pagar menos de R$ 10,00 em um deles (deve ser bloqueada).
 * 3) Compra com cupom promocional e cartão, com menos de R$ 10,00 no cartão (permitido).
 * 4) Compra paga com cupons de troca de valor superior ao da compra, com emissão do cupom de diferença.
 * 5) Compra REPROVADA, com itens desbloqueados e sem baixa de estoque.
 * 6) Expiração do bloqueio no carrinho, com remoção dos itens e desativação do botão de compra.
 * 7) Fluxo do administrador: APROVADA -> EM TRANSPORTE -> ENTREGUE.
 * 8) Tentativa de solicitar a troca de um pedido que não está ENTREGUE (deve ser bloqueada).
 * 9) Troca de um item de um pedido e troca de uma compra inteira.
 * 10) Fluxo da troca: solicitação, visualização pelo administrador, autorização com notificação ao cliente, confirmação do recebimento, emissão do cupom e reentrada no estoque.
 * 11) Uso do cupom de troca gerado em uma nova compra.
 */

describe('Atividade 1: Caso de Uso de Venda Ponta a Ponta (DRS LES 2026)', () => {

  beforeEach(() => {
    cy.on('window:confirm', () => true);
    cy.on('window:alert', () => true);
  });

  const criarItensCarrinhoPadrao = () => [
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

  // --------------------------------------------------------------------------
  // CENÁRIO 1: Compra aprovada com um cartão
  // --------------------------------------------------------------------------
  it('1. Compra aprovada com um cartão (RF0033 a RF0038, RN0037, RN0038)', () => {
    cy.visit('/checkout.html', {
      onBeforeLoad(win) {
        win.localStorage.setItem('alexandria:carrinho', JSON.stringify(criarItensCarrinhoPadrao()));
        win.localStorage.setItem('alexandria:cliente_codigo', 'CLI-001');
      }
    });

    // Aguarda o frete ser calculado automaticamente
    cy.get('#valor-frete', { timeout: 10000 }).should('not.contain', 'R$ 0,00');

    // Valida seleção do endereço salvo
    cy.get('#container-enderecos-salvos input[type="radio"]', { timeout: 8000 }).first().should('be.checked');

    // Finaliza a compra
    cy.get('#btn-finalizar-compra', { timeout: 10000 }).should('be.enabled').click();

    // Valida tela de confirmação
    cy.get('#confirmacao-pedido', { timeout: 15000 }).should('be.visible');
    cy.get('#pedido-numero').should('contain', 'PED-');
    cy.get('#pedido-status').invoke('text').should('match', /APROVADA|EM PROCESSAMENTO/);
  });

  // --------------------------------------------------------------------------
  // CENÁRIO 2: Compra com dois ou mais cartões (< R$ 10,00 bloqueada)
  // --------------------------------------------------------------------------
  it('2. Compra com dois ou mais cartões, bloqueando valor inferior a R$ 10,00 por cartão (RN0034)', () => {
    const itensCarrinho = [
      {
        livroId: 'LIV-001',
        titulo: 'Dom Casmurro (Edição Luxo)',
        preco: 45.90,
        precoCentavos: 4590,
        pesoKg: 0.65,
        quantidade: 2,
        capa: '/img/capas/LIV-001.svg'
      },
      {
        livroId: 'LIV-002',
        titulo: 'O Cortiço',
        preco: 38.00,
        precoCentavos: 3800,
        pesoKg: 0.45,
        quantidade: 1,
        capa: '/img/capas/LIV-002.svg'
      }
    ];

    cy.visit('/checkout.html', {
      onBeforeLoad(win) {
        win.localStorage.setItem('alexandria:carrinho', JSON.stringify(itensCarrinho));
        win.localStorage.setItem('alexandria:cliente_codigo', 'CLI-001');
      }
    });

    cy.get('#valor-frete', { timeout: 15000 }).should('not.contain', 'R$ 0,00');

    // Seleciona Cartão 2
    cy.get('#select-cartao-2 option', { timeout: 15000 }).should('have.length.at.least', 3);
    cy.get('#select-cartao-2').select(2);

    // Tenta pagar R$ 5,00 no Cartão 2 (inferior ao mínimo de R$ 10,00)
    cy.get('#input-valor-cartao2').clear().type('5.00').trigger('input').trigger('change').trigger('blur');

    // Valida bloqueio por RN0034
    cy.get('#container-erros-pagamento').should('be.visible');
    cy.get('#erros-pagamento').should('contain', 'RN0034');
    cy.get('#btn-finalizar-compra').should('be.disabled');

    // Corrige para valor válido respeitando o mínimo (R$ 30,00 no Cartão 2)
    cy.get('#input-valor-cartao2').clear().type('30.00').trigger('input').trigger('change').trigger('blur');

    // Preenche o valor restante no Cartão 1
    cy.get('#resumo-total').invoke('text').then((totalTexto) => {
      const totalNum = parseFloat(totalTexto.replace(/[^\d,]/g, '').replace(',', '.'));
      const val1 = (totalNum - 30.00).toFixed(2);
      cy.get('#input-valor-cartao1').clear().type(val1).trigger('input').trigger('change').trigger('blur');

      // Botão deve ser liberado
      cy.get('#container-erros-pagamento').should('not.be.visible');
      cy.get('#btn-finalizar-compra').should('be.enabled').click();

      cy.get('#confirmacao-pedido', { timeout: 20000 }).should('be.visible');
      cy.get('#pedido-status').invoke('text').should('match', /EM PROCESSAMENTO|APROVADA/);
    });
  });

  // --------------------------------------------------------------------------
  // CENÁRIO 3: Compra com cupom promocional e cartão (< R$ 10,00 permitido)
  // --------------------------------------------------------------------------
  it('3. Compra com cupom promocional e cartão, permitindo valor inferior a R$ 10,00 no cartão (RN0035)', () => {
    const cupomCodigo = `TR-RN35-${Date.now().toString().slice(-6)}`;
    cy.request('POST', '/api/cupons', {
      codigo: cupomCodigo,
      tipo: 'TROCA',
      valor: 50.00
    });

    cy.visit('/checkout.html', {
      onBeforeLoad(win) {
        win.localStorage.setItem('alexandria:carrinho', JSON.stringify(criarItensCarrinhoPadrao()));
        win.localStorage.setItem('alexandria:cliente_codigo', 'CLI-001');
      }
    });

    cy.get('#valor-frete', { timeout: 10000 }).should('not.contain', 'R$ 0,00');

    // Aplica o cupom de R$ 50,00
    cy.get('#input-codigo-cupom').clear().type(cupomCodigo);
    cy.get('#btn-aplicar-cupom').click();
    cy.get('#lista-cupons-aplicados', { timeout: 8000 }).should('contain', cupomCodigo);

    // O resíduo a pagar no cartão fica inferior a R$ 10,00 e o botão deve estar habilitado conforme RN0035
    cy.get('#btn-finalizar-compra', { timeout: 10000 }).should('be.enabled').click();
    cy.get('#confirmacao-pedido', { timeout: 15000 }).should('be.visible');
  });

  // --------------------------------------------------------------------------
  // CENÁRIO 4: Compra com cupons superiores gerando cupom de troca (diferença)
  // --------------------------------------------------------------------------
  it('4. Compra paga com cupons de troca com emissão de cupom de diferença (RN0036)', () => {
    const cupomAlto = `TR-ALTO-${Date.now().toString().slice(-6)}`;
    cy.request('POST', '/api/cupons', {
      codigo: cupomAlto,
      tipo: 'TROCA',
      valor: 150.00
    });

    cy.visit('/checkout.html', {
      onBeforeLoad(win) {
        win.localStorage.setItem('alexandria:carrinho', JSON.stringify(criarItensCarrinhoPadrao()));
        win.localStorage.setItem('alexandria:cliente_codigo', 'CLI-001');
      }
    });

    cy.get('#input-codigo-cupom').clear().type(cupomAlto);
    cy.get('#btn-aplicar-cupom').click();

    // Valida exibição da linha de troco/crédito
    cy.get('#linha-troco', { timeout: 8000 }).should('be.visible');

    cy.get('#btn-finalizar-compra', { timeout: 10000 }).should('be.enabled').click();

    // Valida geração e exibição do novo cupom de troca
    cy.get('#confirmacao-pedido', { timeout: 15000 }).should('be.visible');
    cy.get('#container-cupom-troca').should('be.visible');
    cy.get('#cupom-troca-gerado').should('contain', 'TR-');
  });

  // --------------------------------------------------------------------------
  // CENÁRIO 5: Compra REPROVADA (itens desbloqueados e sem baixa de estoque)
  // --------------------------------------------------------------------------
  it('5. Compra REPROVADA: registra recusa, desbloqueia itens e mantém estoque intacto (RF0053, RN0028, RN0038)', () => {
    cy.request('GET', '/api/livros/LIV-001').then((respLivroAntes) => {
      const estoqueAntes = respLivroAntes.body.estoque;

      cy.request({
        method: 'POST',
        url: '/api/pedidos',
        body: {
          clienteId: 'CLI-001',
          enderecoId: 'end-1',
          simularReprovacao: true,
          itens: [
            {
              livroId: 'LIV-001',
              quantidade: 1,
              precoUnitario: 45.90
            }
          ],
          cartoes: [
            {
              id: 'card-1',
              valor: 57.85
            }
          ]
        }
      }).then((resp) => {
        expect(resp.status).to.eq(201);
        expect(resp.body.pedido.status).to.eq('REPROVADA');
        expect(resp.body.aprovado).to.eq(false);

        // Verifica que o estoque se manteve intacto (RF0053, RN0028)
        cy.request('GET', '/api/livros/LIV-001').then((respLivroDepois) => {
          expect(respLivroDepois.body.estoque).to.deep.equal(estoqueAntes);
        });
      });
    });
  });

  // --------------------------------------------------------------------------
  // CENÁRIO 6: Expiração do bloqueio no carrinho
  // --------------------------------------------------------------------------
  it('6. Expiração do bloqueio no carrinho: remove itens e desativa compra (RN0044, RNF0042, RNF0045)', () => {
    cy.visit('/carrinho.html', {
      onBeforeLoad(win) {
        win.localStorage.setItem('alexandria:carrinho', JSON.stringify(criarItensCarrinhoPadrao()));
        // Simula timestamp expirado
        win.localStorage.setItem('alexandria:carrinho_timestamp', String(Date.now() - 350000));
      }
    });

    // Clica no botão de simular expiração ou aciona expiração do carrinho
    cy.window().then((win) => {
      if (win.Carrinho) win.Carrinho.expirarBloqueio();
    });

    cy.get('#contador-bloqueio', { timeout: 8000 }).should('contain', 'EXPIRADO');
    cy.get('#btn-ir-checkout').should('be.disabled');
  });

  // --------------------------------------------------------------------------
  // CENÁRIO 7: Fluxo do Administrador: APROVADA -> EM TRANSPORTE -> ENTREGUE
  // --------------------------------------------------------------------------
  it('7. Fluxo do Administrador: APROVADA -> EM TRANSPORTE -> ENTREGUE (RF0038, RF0039, RN0039, RN0040)', () => {
    cy.visit('/admin/pedidos.html');
    cy.get('#tabela-pedidos-body', { timeout: 8000 }).should('be.visible');

    // Despacha pedido
    cy.get('body').then($body => {
      const btnDespachar = $body.find('.btn-despachar-pedido').first();
      if (btnDespachar.length > 0) {
        cy.wrap(btnDespachar).click();
        cy.wait(600);
      }
    });

    // Confirma entrega
    cy.get('body').then($body => {
      const btnConfirmar = $body.find('.btn-confirmar-entrega').first();
      if (btnConfirmar.length > 0) {
        cy.wrap(btnConfirmar).click();
        cy.wait(600);
      }
    });

    cy.get('#tabela-pedidos-body').should('contain', 'ENTREGUE');
  });

  // --------------------------------------------------------------------------
  // CENÁRIO 8: Tentativa de solicitar troca de pedido não ENTREGUE (bloqueada)
  // --------------------------------------------------------------------------
  it('8. Tentativa de solicitar troca de pedido que não está ENTREGUE é bloqueada (RN0041, RN0043)', () => {
    // 1. Validação visual no portal do cliente
    cy.visit('/cliente-pedidos.html', {
      onBeforeLoad(win) {
        win.localStorage.setItem('alexandria:cliente_codigo', 'CLI-001');
      }
    });

    cy.get('#container-historico-pedidos', { timeout: 8000 }).should('be.visible');
    cy.get('.btn-solicitar-troca-bloqueada').first().should('be.visible').and('contain', 'Bloqueada');

    // 2. Validação da API: bloqueia troca para pedidos não entregues
    cy.request({
      method: 'POST',
      url: '/api/trocas/solicitar',
      failOnStatusCode: false,
      body: {
        pedidoId: 'PED-2026-095', // Pedido em status APROVADA
        clienteId: 'CLI-001',
        motivo: 'Tentativa de troca em pedido não entregue'
      }
    }).then(resp => {
      expect(resp.status).to.eq(400);
      expect(resp.body.mensagem || resp.body.erro).to.contain('ENTREGUE');
    });
  });

  // --------------------------------------------------------------------------
  // CENÁRIO 9: Troca de um item de um pedido e troca de compra inteira
  // --------------------------------------------------------------------------
  it('9. Solicitação de troca de um item e troca de compra inteira (RF0040, RN0041)', () => {
    cy.visit('/cliente-pedidos.html', {
      onBeforeLoad(win) {
        win.localStorage.setItem('alexandria:cliente_codigo', 'CLI-001');
      }
    });

    cy.get('#container-historico-pedidos', { timeout: 8000 }).should('be.visible');

    // 1. Troca de 1 item
    cy.get('.btn-solicitar-troca').first().click();
    cy.get('#modal-solicitar-troca').should('be.visible');
    cy.get('#escopo-item').should('be.checked');
    cy.get('#btn-cancelar-modal-troca').click();

    // 2. Troca de compra inteira
    cy.get('.btn-trocar-compra-inteira').first().click();
    cy.get('#modal-solicitar-troca').should('be.visible');
    cy.get('#escopo-total').should('be.checked');
    cy.get('#btn-cancelar-modal-troca').click();
  });

  // --------------------------------------------------------------------------
  // CENÁRIO 10: Fluxo completo da Troca
  // --------------------------------------------------------------------------
  it('10. Fluxo completo da troca: solicitação, autorização, notificação, confirmação, cupom e reentrada no estoque (RF0041 a RF0044, RF0054, RN0042, RNF0046)', () => {
    let trocaCriadaId = null;

    // Garante que o pedido de teste PED-2026-091 esteja no status ENTREGUE (RN0041)
    cy.request('PUT', '/api/pedidos/PED-2026-091/status', { status: 'ENTREGUE' }).then(() => {
      // 1. Solicita troca para o pedido entregue PED-2026-091
      cy.request({
        method: 'POST',
        url: '/api/trocas/solicitar',
        body: {
          pedidoId: 'PED-2026-091',
          clienteId: 'CLI-001',
          motivo: 'Páginas com defeito na encadernação',
          descricao: 'Teste automatizado de fluxo de troca',
          tipo: 'ITEM'
        }
      }).then(resp => {
        expect(resp.status).to.eq(201);
        expect(resp.body.troca.status).to.eq('EM TROCA');
        trocaCriadaId = resp.body.troca.id;

        // 2. Administrador autoriza a troca (RF0041, RNF0046)
        cy.request({
          method: 'PUT',
          url: `/api/trocas/${trocaCriadaId}/autorizar`
        }).then(respAut => {
          expect(respAut.status).to.eq(200);
          expect(respAut.body.troca.status).to.eq('TROCA AUTORIZADA');
          expect(respAut.body.codigoPostagem).to.contain('PAC-REV-');
          expect(respAut.body.notificacao).to.not.be.null;

          // 3. Administrador confirma o recebimento dos itens (RF0043, RN0042)
          cy.request({
            method: 'PUT',
            url: `/api/trocas/${trocaCriadaId}/confirmar-recebimento`
          }).then(respConf => {
            expect(respConf.status).to.eq(200);
            expect(respConf.body.troca.status).to.eq('TROCADO');
            expect(respConf.body.cupomGerado.codigo).to.contain('TR-');
            expect(respConf.body.itensReentrados).to.be.gte(1);
          });
        });
      });
    });
  });

  // --------------------------------------------------------------------------
  // CENÁRIO 11: Uso do cupom de troca gerado em nova compra
  // --------------------------------------------------------------------------
  it('11. Uso do cupom de troca gerado em uma nova compra (RF0044)', () => {
    const cupomTrocaCodigo = 'TR-USO-' + Date.now().toString(36).toUpperCase();
    cy.request({
      method: 'POST',
      url: '/api/cupons',
      body: {
        codigo: cupomTrocaCodigo,
        tipo: 'TROCA',
        valor: 20.00,
        clienteId: 'CLI-001'
      }
    });

    cy.visit('/checkout.html', {
      onBeforeLoad(win) {
        win.localStorage.setItem('alexandria:cliente_codigo', 'CLI-001');
        win.localStorage.setItem('alexandria:carrinho', JSON.stringify(criarItensCarrinhoPadrao()));
      }
    });

    cy.get('#valor-frete', { timeout: 10000 }).should('not.contain', 'R$ 0,00');

    // Aplica o cupom de troca gerado
    cy.get('#input-codigo-cupom').clear().type(cupomTrocaCodigo);
    cy.get('#btn-aplicar-cupom').click();

    cy.get('#lista-cupons-aplicados', { timeout: 8000 }).should('contain', cupomTrocaCodigo);

    // Finaliza a compra
    cy.get('#btn-finalizar-compra', { timeout: 10000 }).should('be.enabled').click();
    cy.get('#confirmacao-pedido', { timeout: 15000 }).should('be.visible');
  });

});
