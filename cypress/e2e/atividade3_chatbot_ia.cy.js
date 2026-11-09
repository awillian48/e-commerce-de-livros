/**
 * ============================================================================
 * ATIVIDADE 3 (LES 2026): CHATBOT DE RECOMENDAÇÃO COM IA GENERATIVA (RNF0044)
 * ============================================================================
 * Cenários da Apresentação Presencial (Seção 7):
 *  1) Integração com IA Generativa escolhida e justificativa da escolha (RNF0044.1)
 *  2) Recomendação personalizada coerente com histórico e preferências (CLI-001)
 *  3) Recomendações distintas para dois clientes com históricos distintos (CLI-001 vs CLI-002)
 *  4) Auxílio na busca por livros pelo chat (RNF0044.2)
 *  5) Resposta a dúvidas livres sobre obras do acervo (RNF0044.2)
 *  6) Sugestão de conteúdos relevantes e trilhas de leitura (RNF0044.2)
 *  7) Avaliação de resposta como Útil / Não Útil com registro de feedback (RNF0044.3)
 *  8) Treinamento / Ajuste Fino contínuo com dados de vendas e feedback (RNF0044.3)
 * ============================================================================
 */

const PAUSA_DEMO = 1500;
const PAUSA_DIGITACAO = 1100;
const PAUSA_FIM_CENARIO = 1800;

function mostrarBannerPassos(win, titulo, subtitulo) {
  let banner = win.document.getElementById('cypress-demo-hud');
  if (!banner) {
    banner = win.document.createElement('div');
    banner.id = 'cypress-demo-hud';
    banner.style.cssText = [
      'position: fixed',
      'top: 10px',
      'left: 50%',
      'transform: translateX(-50%)',
      'z-index: 999999',
      'background: rgba(15, 23, 42, 0.94)',
      'color: #f8fafc',
      'padding: 10px 22px',
      'border-radius: 10px',
      'border: 2px solid #38bdf8',
      'box-shadow: 0 10px 25px rgba(0,0,0,0.45)',
      'font-family: system-ui, -apple-system, sans-serif',
      'text-align: center',
      'pointer-events: none',
      'min-width: 460px'
    ].join(';');
    win.document.body.appendChild(banner);
  }
  banner.innerHTML = `
    <div style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 1px;">
      ATIVIDADE 3 — CHATBOT DE RECOMENDAÇÃO IA GENERATIVA & AJUSTE FINO (RNF0044)
    </div>
    <div style="font-size: 14px; font-weight: 700; color: #ffffff; margin-top: 2px;">${titulo}</div>
    <div style="font-size: 12px; color: #cbd5e1; margin-top: 2px;">${subtitulo || ''}</div>
  `;
}

function destacarElemento($el) {
  if (!$el || !$el.length) return;
  const el = $el[0];
  const originalOutline = el.style.outline;
  const originalBoxShadow = el.style.boxShadow;
  el.style.outline = '3px solid #f59e0b';
  el.style.boxShadow = '0 0 16px rgba(245, 158, 11, 0.75)';
  setTimeout(() => {
    el.style.outline = originalOutline;
    el.style.boxShadow = originalBoxShadow;
  }, 1100);
}

describe('Atividade 3 — Chatbot de Recomendação Personalizada com IA Generativa (RNF0044)', () => {
  beforeEach(() => {
    cy.viewport(1440, 900);
  });

  it('Cenários 1, 2 e 3: Demonstra integração IA, recomendação personalizada (CLI-001) e recomendações distintas para clientes com históricos diferentes (CLI-001 vs CLI-002)', () => {
    cy.visit('/chatbot.html');
    cy.window().then((win) =>
      mostrarBannerPassos(
        win,
        'Cenários 1 e 2: Recomendações Personalizadas para Cliente 1 (Machado de Assis)',
        'Histórico em Literatura Brasileira + Obras Raras (RNF0044 Item 1)'
      )
    );
    cy.wait(PAUSA_DEMO);

    // Verifica que o cliente inicial é CLI-001 (Machado de Assis)
    cy.get('#select-cliente-chat').should('have.value', 'CLI-001');
    cy.get('#lbl-nome-cliente').should('contain', 'Machado de Assis');

    // Clica no atalho de Recomendação Personalizada no Chat
    cy.get('#btn-cenario-recomendacao').then(($btn) => destacarElemento($btn));
    cy.wait(500);
    cy.get('#btn-cenario-recomendacao').click();
    cy.wait(PAUSA_DEMO);

    cy.get('#chat-log').should('contain', 'Machado de Assis');
    cy.get('#chat-log .card-livro-sugerido-chat').should('have.length.greaterThan', 0);

    // Agora alterna para o Cliente 2 (Clarice Lispector - CLI-002) e verifica recomendações distintas (Cenário 3)
    cy.window().then((win) =>
      mostrarBannerPassos(
        win,
        'Cenário 3: Recomendações Distintas para Clientes com Históricos Distintos',
        'Comparando CLI-001 (Machado de Assis) vs CLI-002 (Clarice Lispector — Filosofia & Eng. Software)'
      )
    );
    cy.get('#select-cliente-chat').then(($sel) => destacarElemento($sel));
    cy.get('#select-cliente-chat').select('CLI-002');
    cy.wait(PAUSA_DEMO);

    cy.get('#lbl-nome-cliente').should('contain', 'Clarice Lispector');

    // Verifica painel comparativo entre CLI-001 e CLI-002
    cy.get('#comp-cli-001').should('contain', 'Machado de Assis');
    cy.get('#comp-cli-002').should('contain', 'Clarice Lispector');
    cy.get('#comp-cli-001').invoke('text').then((txt1) => {
      cy.get('#comp-cli-002').invoke('text').should('not.equal', txt1);
    });

    cy.wait(PAUSA_FIM_CENARIO);
  });

  it('Cenários 4, 5 e 6: Auxilia na busca por livros no chat, responde dúvidas sobre obras e sugere conteúdos relevantes', () => {
    cy.visit('/chatbot.html');
    cy.window().then((win) =>
      mostrarBannerPassos(
        win,
        'Cenário 4: Busca de Livros no Acervo pelo Chatbot',
        'Buscando obras de Engenharia de Software e Arquitetura Limpa via linguagem natural'
      )
    );
    cy.wait(PAUSA_DEMO);

    cy.get('#chat-input')
      .then(($in) => destacarElemento($in))
      .clear()
      .type('Buscar livros sobre Engenharia de Software e Arquitetura Limpa no acervo', { delay: 40 });
    cy.wait(PAUSA_DIGITACAO);
    cy.get('#btn-enviar-chat').click();
    cy.wait(PAUSA_DEMO);

    cy.get('#chat-log').should('contain', 'Clean Architecture');

    // Cenário 5: Dúvida livre do professor sobre obra específica
    cy.window().then((win) =>
      mostrarBannerPassos(
        win,
        'Cenário 5: Resposta a Dúvidas sobre Livros feitas pelo Professor',
        'Perguntando sobre o enredo de Dom Casmurro, Capitu e preço no catálogo'
      )
    );
    cy.get('#btn-cenario-duvida').then(($btn) => destacarElemento($btn));
    cy.get('#btn-cenario-duvida').click();
    cy.wait(PAUSA_DEMO);

    cy.get('#chat-log').should('contain', 'Dom Casmurro').and('contain', 'Bentinho');

    // Cenário 6: Sugestão de conteúdos relevantes e trilhas de leitura
    cy.window().then((win) =>
      mostrarBannerPassos(
        win,
        'Cenário 6: Sugestão de Conteúdos Relevantes e Trilhas de Leitura',
        'Solicitando curadoria temática e trilha de estudos guiada ao chatbot'
      )
    );
    cy.get('#btn-cenario-conteudo').then(($btn) => destacarElemento($btn));
    cy.get('#btn-cenario-conteudo').click();
    cy.wait(PAUSA_DEMO);

    cy.get('#chat-log').should('contain', 'Trilha');
    cy.wait(PAUSA_FIM_CENARIO);
  });

  it('Cenários 7 e 8: Avalia resposta como Útil / Não Útil (RLHF) e apresenta o pipeline de Treinamento / Ajuste Fino contínuo', () => {
    cy.visit('/chatbot.html');
    cy.window().then((win) =>
      mostrarBannerPassos(
        win,
        'Cenário 7: Avaliação de Resposta do Chatbot (Útil / Não Útil)',
        'Registrando feedback explícito na resposta do chat e recalibrando pesos RLHF em tempo real'
      )
    );
    cy.wait(PAUSA_DEMO);

    // Gera uma recomendação no chat para avaliar
    cy.get('#btn-cenario-recomendacao').click();
    cy.wait(PAUSA_DEMO);

    // Clica no botão "👍 Útil" da resposta gerada
    cy.get('.btn-feedback-util').last().then(($btn) => destacarElemento($btn));
    cy.wait(500);
    cy.get('.btn-feedback-util').last().click();
    cy.wait(PAUSA_DEMO);

    cy.get('.feedback-registrado-badge').should('be.visible').and('contain', 'Feedback registrado');

    // Cenário 8: Demonstração do Treinamento / Ajuste Fino e Matriz de Pesos
    cy.window().then((win) =>
      mostrarBannerPassos(
        win,
        'Cenário 8: Apresentação do Treinamento / Ajuste Fino Contínuo',
        'Re-treinando o modelo com dados de vendas + feedbacks e inspecionando a Matriz Neural e Dataset .JSONL'
      )
    );
    cy.get('#btn-retreinar-modelo').then(($btn) => destacarElemento($btn));
    cy.get('#btn-retreinar-modelo').click();
    cy.wait(PAUSA_DEMO);

    cy.get('#container-pesos-categorias .peso-bar-wrap').should('have.length.greaterThan', 0);
    cy.get('#lista-historico-treinamentos').should('contain', 'alexandria-ft');

    cy.wait(PAUSA_FIM_CENARIO);
  });
});
