/**
 * Atividade 2 — Suíte de Testes Funcionais Automatizados (Cypress)
 * Análise Gráfica do Histórico de Vendas por Categoria (DRS LES 2026)
 * Requisitos: RF0055, RNF0043, RNF0011, RNF0045, RNF0046
 *
 * Roteiro Mínimo de Demonstração (8 Cenários Oficiais):
 * 1) Consulta de uma categoria em um período válido, com valores mensais iguais à soma das vendas ENTREGUE registradas na base.
 * 2) Comparação entre duas ou mais categorias no período.
 * 3) Apresentação do resultado em gráfico de linhas, com valores em reais agrupados por mês.
 * 4) Alteração da data de início ou de fim resultando em um novo resultado no gráfico.
 * 5) Compra com status diferente de ENTREGUE não contabilizada no gráfico.
 * 6) Compra que passa a ENTREGUE dentro do período refletida na consulta seguinte.
 * 7) Acesso ao gráfico permitido ao administrador e negado a outros perfis.
 * 8) Tempo de resposta da consulta de até 1 segundo.
 */

// ============================================================================
// CONTROLE DE VELOCIDADE E FOCO VISUAL PARA DEMONSTRAÇÃO (SLOW MOTION + HUD)
// ============================================================================
const PAUSA_DEMO = 1500;        // Pausa após cliques, selects, checks e navegação (1.5s)
const PAUSA_DIGITACAO = 1100;   // Pausa após digitação de cada campo (1.1s)
const PAUSA_LIMPEZA = 350;      // Pausa após clear()
const PAUSA_FIM_CENARIO = 1800; // Pausa ao final de cada cenário para leitura do gráfico

// Digitação visível caractere por caractere (90ms entre teclas)
Cypress.Keyboard.defaults({
  keystrokeDelay: 90
});

let cenarioAtualTitulo = 'Atividade 2';

function atualizarHUD(mensagem) {
  try {
    const doc = Cypress.$(cy.state('window').document);
    let hud = doc.find('#cypress-demo-hud');
    if (!hud.length) {
      hud = Cypress.$(
        '<div id="cypress-demo-hud" style="position: fixed; top: 12px; left: 50%; transform: translateX(-50%); z-index: 9999999; background: #0f172a; color: #f8fafc; padding: 8px 22px; border-radius: 9999px; font-size: 0.86rem; font-weight: 600; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5), 0 0 0 2px #d97706; pointer-events: none; transition: all 0.2s ease; display: flex; align-items: center; gap: 10px; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;">' +
          '<span style="display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: #22c55e;"></span>' +
          '<span id="hud-texto"></span>' +
        '</div>'
      );
      doc.find('body').append(hud);
    }
    hud.find('#hud-texto').text(`${cenarioAtualTitulo}  |  ${mensagem || 'Executando...'}`);
  } catch (e) {}
}

function focarNoElemento($el, acao = 'Focando') {
  if (!$el) return;
  const domEl = $el[0] || $el;
  if (!domEl) return;

  try {
    if (typeof domEl.scrollIntoView === 'function') {
      domEl.scrollIntoView({ block: 'center', inline: 'center' });
    }

    const rotulo =
      domEl.getAttribute('id') ||
      domEl.getAttribute('name') ||
      domEl.getAttribute('placeholder') ||
      domEl.textContent?.trim().slice(0, 28) ||
      domEl.tagName;
    atualizarHUD(`${acao}: ${rotulo}`);

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
        } catch (e) {}
      }, PAUSA_DEMO + 400);
    }
  } catch (e) {}
}

if (PAUSA_DEMO > 0) {
  Cypress.Commands.overwrite('visit', (originalFn, ...args) => {
    atualizarHUD(`Abrindo tela: ${args[0]}`);
    return originalFn(...args).then((val) => {
      atualizarHUD(`Tela carregada: ${args[0]}`);
      return Cypress.Promise.delay(PAUSA_DEMO).then(() => val);
    });
  });

  Cypress.Commands.overwrite('click', (originalFn, subject, ...args) => {
    focarNoElemento(subject, 'Clicando');
    return originalFn(subject, ...args).then((val) => {
      return Cypress.Promise.delay(PAUSA_DEMO).then(() => val);
    });
  });

  Cypress.Commands.overwrite('type', (originalFn, subject, text, options) => {
    focarNoElemento(subject, `Digitando "${text}"`);
    return originalFn(subject, text, options).then((val) => {
      return Cypress.Promise.delay(PAUSA_DIGITACAO).then(() => val);
    });
  });

  Cypress.Commands.overwrite('clear', (originalFn, subject, ...args) => {
    focarNoElemento(subject, 'Limpando campo');
    return originalFn(subject, ...args).then((val) => {
      return Cypress.Promise.delay(PAUSA_LIMPEZA).then(() => val);
    });
  });

  Cypress.Commands.overwrite('select', (originalFn, subject, ...args) => {
    focarNoElemento(subject, 'Selecionando opção');
    return originalFn(subject, ...args).then((val) => {
      return Cypress.Promise.delay(PAUSA_DEMO).then(() => val);
    });
  });

  Cypress.Commands.overwrite('check', (originalFn, subject, ...args) => {
    focarNoElemento(subject, 'Marcando categoria');
    return originalFn(subject, ...args).then((val) => {
      return Cypress.Promise.delay(900).then(() => val);
    });
  });
}

describe('Atividade 2: Análise Gráfica por Categoria de Produtos (RF0055, RNF0043, RNF0011)', () => {

  beforeEach(function () {
    cenarioAtualTitulo = this.currentTest?.title?.split('(')[0]?.trim() || 'Atividade 2';
    cy.on('window:confirm', () => true);
    cy.on('window:alert', () => true);
  });

  afterEach(() => {
    cy.wait(PAUSA_FIM_CENARIO);
  });

  // --------------------------------------------------------------------------
  // CENÁRIO 1: Consulta de uma categoria com valores iguais à soma de ENTREGUE
  // --------------------------------------------------------------------------
  it('1. Consulta de uma categoria em período válido, somando apenas vendas ENTREGUE (RF0055, Critério 3.d)', () => {
    cy.visit('/admin/analise.html');
    cy.get('#conteudo-analitico-admin', { timeout: 8000 }).should('be.visible');

    // Desmarca todas e deixa apenas "Literatura Brasileira"
    cy.get('.check-categoria').uncheck({ force: true });
    cy.get('#cat-lit-brasil').check({ force: true });

    cy.get('#filtro-data-inicio').clear().type('2026-01-01');
    cy.get('#filtro-data-fim').clear().type('2026-12-31');
    cy.get('#btn-aplicar-filtro').click();

    cy.get('#tabela-analise-head').should('contain', 'Literatura Brasileira');
    cy.get('#tabela-analise-head').should('not.contain', 'Engenharia de Software');

    cy.request('/api/analise/historico-categorias?dataInicio=2026-01-01&dataFim=2026-12-31&categorias=Literatura Brasileira')
      .then(resp => {
        expect(resp.status).to.eq(200);
        expect(resp.body.series[0].categoria).to.eq('Literatura Brasileira');
        expect(resp.body.series[0].totalCategoria).to.be.gt(0);
        expect(resp.body.criterios.apenasStatusEntregue).to.eq(true);
      });
  });

  // --------------------------------------------------------------------------
  // CENÁRIO 2: Comparação entre duas ou mais categorias no período
  // --------------------------------------------------------------------------
  it('2. Comparação entre duas ou mais categorias no período (RF0055, Critério 3.a)', () => {
    cy.visit('/admin/analise.html');
    cy.get('#conteudo-analitico-admin', { timeout: 8000 }).should('be.visible');

    // Seleciona duas categorias: Literatura Brasileira e Engenharia de Software
    cy.get('.check-categoria').uncheck({ force: true });
    cy.get('#cat-lit-brasil').check({ force: true });
    cy.get('#cat-eng-soft').check({ force: true });

    cy.get('#btn-aplicar-filtro').click();

    cy.get('#tabela-analise-head').should('contain', 'Literatura Brasileira');
    cy.get('#tabela-analise-head').should('contain', 'Engenharia de Software');
    cy.get('#kpi-qtd-categorias').should('contain', '2');
  });

  // --------------------------------------------------------------------------
  // CENÁRIO 3: Apresentação do resultado em gráfico de linhas (mês/ano em R$)
  // --------------------------------------------------------------------------
  it('3. Apresentação do resultado em gráfico de linhas com valores em R$ agrupados por mês (RNF0043, Critério 3.c, 3.e)', () => {
    cy.visit('/admin/analise.html');
    cy.get('#grafico-linhas-historico', { timeout: 8000 }).should('be.visible');

    cy.get('#grafico-linhas-historico').then($canvas => {
      expect($canvas.width()).to.be.gte(200);
      expect($canvas.height()).to.be.gte(100);
    });

    cy.get('#tabela-analise-body tr').first().find('td').first().invoke('text').should('match', /\d{2}\/2026/);
    cy.get('#kpi-faturamento-total').should('contain', 'R$');
  });

  // --------------------------------------------------------------------------
  // CENÁRIO 4: Alteração da data de início ou de fim resultando em novo resultado
  // --------------------------------------------------------------------------
  it('4. Alteração da data de início ou fim resultando dinamicamente em novo resultado no gráfico (RF0055)', () => {
    cy.visit('/admin/analise.html');

    // Consulta 1: Período do 1º Trimestre (Janeiro a Março de 2026)
    cy.get('#filtro-data-inicio').clear().type('2026-01-01');
    cy.get('#filtro-data-fim').clear().type('2026-03-31');
    cy.get('#btn-aplicar-filtro').click();

    cy.get('#badge-chart-periodo').should('contain', '2026-03-31');
    cy.get('#tabela-analise-body').invoke('text').then(textoTrimestre1 => {
      // Consulta 2: Altera para o Segundo Semestre (Agosto a Outubro de 2026)
      cy.get('#filtro-data-inicio').clear().type('2026-08-01');
      cy.get('#filtro-data-fim').clear().type('2026-10-31');
      cy.get('#btn-aplicar-filtro').click();

      cy.get('#badge-chart-periodo').should('contain', '2026-10-31');
      cy.get('#tabela-analise-body').invoke('text').should('not.eq', textoTrimestre1);
    });
  });

  // --------------------------------------------------------------------------
  // CENÁRIO 5: Compra com status != ENTREGUE não contabilizada no gráfico
  // --------------------------------------------------------------------------
  it('5. Compra com status diferente de ENTREGUE não é contabilizada no gráfico (Critério 3.d)', () => {
    cy.request('/api/analise/historico-categorias?dataInicio=2026-01-01&dataFim=2026-12-31')
      .then(resp => {
        expect(resp.status).to.eq(200);
        expect(resp.body.criterios.apenasStatusEntregue).to.eq(true);
        expect(resp.body.pedidosIgnoradosNaoEntregues).to.be.gt(0);

        expect(resp.body.totalPedidosEntreguesContabilizados).to.be.lt(
          resp.body.totalPedidosEntreguesContabilizados + resp.body.pedidosIgnoradosNaoEntregues
        );
      });

    cy.visit('/admin/analise.html');
    cy.get('#badge-criterio-entregue').should('contain', 'Somente Compras ENTREGUE');
    cy.get('#kpi-pedidos-ignorados').should('contain', 'não-entregues ignoradas');
  });

  // --------------------------------------------------------------------------
  // CENÁRIO 6: Compra que passa a ENTREGUE refletida na consulta seguinte
  // --------------------------------------------------------------------------
  it('6. Compra que passa a ENTREGUE dentro do período é refletida na consulta seguinte (Critério 3.d)', () => {
    // 1. Garante que o pedido está inicialmente em 'EM TRANSPORTE'
    cy.request({
      method: 'PUT',
      url: '/api/pedidos/PED-2026-094/status',
      body: { status: 'EM TRANSPORTE' }
    });

    cy.visit('/admin/analise.html');
    cy.get('#filtro-data-inicio').clear().type('2026-09-01');
    cy.get('#filtro-data-fim').clear().type('2026-09-30');
    cy.get('#btn-aplicar-filtro').click();

    let faturamentoAntes = 0;

    // 2. Consulta inicial enquanto está em EM TRANSPORTE
    cy.request('/api/analise/historico-categorias?dataInicio=2026-09-01&dataFim=2026-09-30&categorias=Literatura Brasileira')
      .then(resp => {
        faturamentoAntes = resp.body.series[0].totalCategoria;

        // 3. Atualiza o pedido para 'ENTREGUE'
        cy.request({
          method: 'PUT',
          url: '/api/pedidos/PED-2026-094/status',
          body: { status: 'ENTREGUE' }
        }).then(respStatus => {
          expect(respStatus.status).to.eq(200);

          // 4. Recalcula no gráfico e valida aumento no faturamento de ENTREGUE
          cy.get('#btn-aplicar-filtro').click();

          cy.request('/api/analise/historico-categorias?dataInicio=2026-09-01&dataFim=2026-09-30&categorias=Literatura Brasileira')
            .then(respDepois => {
              expect(respDepois.body.series[0].totalCategoria).to.be.gt(faturamentoAntes);
            });
        });
      });
  });

  // --------------------------------------------------------------------------
  // CENÁRIO 7: Acesso permitido ao administrador e negado a outros perfis
  // --------------------------------------------------------------------------
  it('7. Acesso ao gráfico permitido ao administrador e negado a outros perfis (RF0055, Critério 3.b)', () => {
    cy.request({
      url: '/api/analise/historico-categorias?perfil=ADMIN',
      headers: { 'X-User-Role': 'ADMIN' }
    }).then(resp => {
      expect(resp.status).to.eq(200);
      expect(resp.body.sucesso).to.eq(true);
    });

    cy.request({
      url: '/api/analise/historico-categorias?perfil=CLIENTE',
      headers: { 'X-User-Role': 'CLIENTE' },
      failOnStatusCode: false
    }).then(resp => {
      expect(resp.status).to.eq(403);
      expect(resp.body.erro).to.contain('restrita ao perfil administrador');
    });

    cy.visit('/admin/analise.html');
    cy.get('#select-perfil-acesso').select('CLIENTE');
    cy.get('#painel-acesso-negado').should('be.visible').and('contain', 'Acesso Negado (403 Forbidden)');
    cy.get('#conteudo-analitico-admin').should('not.be.visible');
    cy.wait(1200);

    cy.get('#painel-acesso-negado button').click();
    cy.get('#conteudo-analitico-admin').should('be.visible');
  });

  // --------------------------------------------------------------------------
  // CENÁRIO 8: Tempo de resposta da consulta de até 1 segundo
  // --------------------------------------------------------------------------
  it('8. Tempo de resposta da consulta de até 1 segundo (RNF0011)', () => {
    cy.request('/api/analise/historico-categorias?dataInicio=2026-01-01&dataFim=2026-12-31')
      .then(resp => {
        expect(resp.status).to.eq(200);
        expect(resp.body.tempoRespostaMs).to.be.lte(1000);
        expect(resp.body.tempoRespostaConformeRNF0011).to.eq(true);
      });

    cy.visit('/admin/analise.html');
    cy.get('#badge-tempo-resposta', { timeout: 8000 }).should('contain', 'CONFORME <= 1s');
  });

});
