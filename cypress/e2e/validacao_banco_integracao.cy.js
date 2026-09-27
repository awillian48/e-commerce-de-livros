describe('Auditoria de Integração Integral com o Banco de Dados (Supabase)', () => {
  
  it('API /api/livros deve retornar livros reais do acervo Supabase', () => {
    cy.request('/api/livros').then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(10);
      const domCasmurro = res.body.find(l => l.titulo.includes('Dom Casmurro'));
      expect(domCasmurro).to.exist;
      expect(domCasmurro.status).to.eq('ATIVO');
    });
  });

  it('API /api/livros/estoque/todos deve retornar o saldo físico real do banco', () => {
    cy.request('/api/livros/estoque/todos').then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(10);
      res.body.forEach(item => {
        expect(item).to.have.property('quantidade');
        expect(item.livros).to.have.property('titulo');
      });
    });
  });

  it('API /api/pedidos deve retornar o histórico real de transações analíticas', () => {
    cy.request('/api/pedidos').then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(15);
      const pedido101 = res.body.find(p => p.id === 'PED-2026-101');
      expect(pedido101).to.exist;
      expect(pedido101.status).to.eq('ENTREGUE');
    });
  });

  it('API /api/cupons deve listar cupons promocionais e de troca válidos', () => {
    cy.request('/api/cupons').then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array');
      const promo10 = res.body.find(c => c.codigo === 'PROMO10');
      expect(promo10).to.exist;
      expect(Number(promo10.valor)).to.eq(10.00);
    });
  });

  it('Tela Admin de Pedidos deve carregar a listagem dinâmica do banco', () => {
    cy.visit('/admin/pedidos.html');
    cy.get('#tabela-pedidos-body tr').should('have.length.at.least', 5);
    cy.get('#tabela-pedidos-body').should('contain', 'PED-2026-');
  });

  it('Tela Admin de Trocas deve carregar as solicitações de troca do banco', () => {
    cy.visit('/admin/trocas.html');
    cy.get('#tabela-trocas-body tr').should('have.length.at.least', 2);
    cy.get('#tabela-trocas-body').should('contain', 'TRC-2026-');
  });

  it('Tela Admin de Estoque deve renderizar os livros e atualizar contadores KPI', () => {
    cy.visit('/admin/estoque.html');
    cy.get('#tabela-estoque-body tr').should('have.length.at.least', 5);
    cy.get('#kpi-total-itens').should('not.contain', '0 un');
  });

});
