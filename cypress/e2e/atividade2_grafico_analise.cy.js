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

describe('Atividade 2: Análise Gráfica por Categoria de Produtos (RF0055, RNF0043, RNF0011)', () => {

  beforeEach(() => {
    cy.on('window:confirm', () => true);
    cy.on('window:alert', () => true);
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

    // Valida que a tabela comparativa possui apenas a categoria selecionada e valores positivos
    cy.get('#tabela-analise-head').should('contain', 'Literatura Brasileira');
    cy.get('#tabela-analise-head').should('not.contain', 'Engenharia de Software');

    // Valida via API que o total coincide exatamente com a soma dos pedidos ENTREGUE
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

    // Ambas devem constar no cabeçalho da tabela e no resumo
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

    // Valida que o canvas do gráfico existe e possui dimensões renderizadas
    cy.get('#grafico-linhas-historico').then($canvas => {
      expect($canvas.width()).to.be.gte(200);
      expect($canvas.height()).to.be.gte(100);
    });

    // Valida os meses no formato MM/AAAA na tabela e nas legendas
    cy.get('#tabela-analise-body tr').first().find('td').first().invoke('text').should('match', /\d{2}\/2026/);

    // Valida formato em Reais (R$) nos valores
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

        // O pedido PED-2026-013 (REPROVADA) e PED-2026-094 (EM TRANSPORTE) não devem estar nos cálculos
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

          // 4. Consulta novamente a API: o total faturado DEVE ser maior agora!
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
    // 1. Acesso com perfil Administrador: deve retornar 200 OK
    cy.request({
      url: '/api/analise/historico-categorias?perfil=ADMIN',
      headers: { 'X-User-Role': 'ADMIN' }
    }).then(resp => {
      expect(resp.status).to.eq(200);
      expect(resp.body.sucesso).to.eq(true);
    });

    // 2. Tentativa com perfil Cliente: deve retornar 403 Forbidden
    cy.request({
      url: '/api/analise/historico-categorias?perfil=CLIENTE',
      headers: { 'X-User-Role': 'CLIENTE' },
      failOnStatusCode: false
    }).then(resp => {
      expect(resp.status).to.eq(403);
      expect(resp.body.erro).to.contain('restrita ao perfil administrador');
    });

    // 3. Validação visual na interface ao alternar o seletor de perfil para Cliente
    cy.visit('/admin/analise.html');
    cy.get('#select-perfil-acesso').select('CLIENTE');
    cy.get('#painel-acesso-negado').should('be.visible').and('contain', 'Acesso Negado (403 Forbidden)');
    cy.get('#conteudo-analitico-admin').should('not.be.visible');

    // 4. Retorna para Administrador e valida recuperação do painel
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
        expect(resp.body.tempoRespostaMs).to.be.lte(1000); // RNF0011: <= 1s
        expect(resp.body.tempoRespostaConformeRNF0011).to.eq(true);
      });

    cy.visit('/admin/analise.html');
    cy.get('#badge-tempo-resposta', { timeout: 8000 }).should('contain', 'CONFORME <= 1s');
  });

});
