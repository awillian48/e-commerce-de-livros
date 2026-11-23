/**
 * Controlador Frontend do Chatbot do Cliente — Livraria Alexandria (RNF0044)
 * Respostas baseadas estritamente no acervo da livraria com IA Generativa & RLHF
 */
document.addEventListener('DOMContentLoaded', () => {
  const selectCliente = document.getElementById('select-cliente-chat');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatLog = document.getElementById('chat-log');
  const btnTogglePref = document.getElementById('btn-toggle-pref');
  const formPref = document.getElementById('form-preferencias-cliente');
  const btnCompararClientes = document.getElementById('btn-cenario-comparar-clientes');
  const btnAtualizarComparativo = document.getElementById('btn-atualizar-comparativo');

  const clienteSalvo = localStorage.getItem('alexandria:cliente_codigo');
  if (selectCliente && ['CLI-001', 'CLI-002', 'CLI-003'].includes(clienteSalvo)) {
    selectCliente.value = clienteSalvo;
  }

  function getClienteAtual() {
    return selectCliente ? selectCliente.value : 'CLI-001';
  }

  function formatarMarkdown(texto = '') {
    return String(texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  async function carregarContextoCliente() {
    const clienteId = getClienteAtual();
    try {
      const respRec = await fetch(`/api/chatbot/recomendacoes/${clienteId}?limite=4`);
      const rec = await respRec.json();

      const lblNome = document.getElementById('lbl-nome-cliente');
      const lblHist = document.getElementById('lbl-historico-livros');
      const lblPref = document.getElementById('lbl-preferencias-cliente');
      const lblTemas = document.getElementById('lbl-temas-cliente');

      if (lblNome) lblNome.textContent = rec.nomeCliente || clienteId;
      if (lblHist) {
        const titulos = rec.historicoResumo?.livrosCompradosTitulos || [];
        lblHist.textContent = titulos.length > 0 ? titulos.join(', ') : 'Nenhuma compra anterior registrada';
      }
      if (lblPref) {
        lblPref.textContent = (rec.preferencias?.categoriasFavoritas || []).join(', ') || 'Literatura Brasileira';
      }
      if (lblTemas) {
        lblTemas.textContent = (rec.preferencias?.temasInteresse || []).join(', ') || 'Clássicos';
      }

      // Checkboxes do formulário de preferências
      const catsAtuais = rec.preferencias?.categoriasFavoritas || [];
      document.querySelectorAll('.chk-pref-cat').forEach(chk => {
        chk.checked = catsAtuais.includes(chk.value);
      });
      const inputTemas = document.getElementById('input-pref-temas');
      if (inputTemas) {
        inputTemas.value = (rec.preferencias?.temasInteresse || []).join(', ');
      }
    } catch (e) {
      console.warn('Erro ao carregar contexto do cliente:', e);
    }
  }

  async function carregarComparativoClientes() {
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/chatbot/recomendacoes/CLI-001?limite=3').then(r => r.json()),
        fetch('/api/chatbot/recomendacoes/CLI-002?limite=3').then(r => r.json())
      ]);

      const renderBox = (dados) => `
        <div style="font-weight: 800; color: #1b2a47; font-size: 0.86rem; margin-bottom: 4px;">
          ${dados.clienteId} — ${dados.nomeCliente}
        </div>
        <div style="font-size: 0.74rem; color: #475569; margin-bottom: 6px;">
          <strong>Preferências:</strong> ${(dados.preferencias?.categoriasFavoritas || []).join(', ')}<br>
          <strong>Compras anteriores:</strong> ${(dados.historicoResumo?.livrosCompradosTitulos || []).slice(0, 2).join(', ') || 'N/A'}
        </div>
        <div style="font-size: 0.75rem; font-weight: 700; color: #0f766e; margin-bottom: 4px;">
          Top Recomendações do Nosso Acervo (${dados.versaoModelo}):
        </div>
        ${(dados.recomendacoes || [])
          .map(
            (l, i) => `
            <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 5px; padding: 5px 8px; margin-bottom: 4px;">
              <strong>${i + 1}. ${l.titulo}</strong> <span style="color:#047857; font-weight:700;">(${l.afinidadePercentual}%)</span><br>
              <span style="font-size: 0.7rem; color: #64748b;">${l.categoria} | R$ ${Number(l.preco).toFixed(2).replace('.', ',')}</span>
            </div>
          `
          )
          .join('')}
      `;

      const box1 = document.getElementById('comp-cli-001');
      const box2 = document.getElementById('comp-cli-002');
      if (box1) box1.innerHTML = renderBox(r1);
      if (box2) box2.innerHTML = renderBox(r2);
    } catch (e) {
      console.warn('Erro ao carregar comparativo:', e);
    }
  }

  async function enviarMensagem(texto) {
    const clienteId = getClienteAtual();
    if (!texto) return;

    const userDiv = document.createElement('div');
    userDiv.className = 'chat-msg-usuario';
    userDiv.style.cssText = 'background: #1b2a47; color: #ffffff; padding: 10px 14px; border-radius: 10px; margin-left: auto; max-width: 82%; font-size: 0.88rem; font-weight: 500; box-shadow: 0 1px 3px rgba(0,0,0,0.05);';
    userDiv.textContent = texto;
    chatLog.appendChild(userDiv);
    chatLog.scrollTop = chatLog.scrollHeight;

    const loadDiv = document.createElement('div');
    loadDiv.style.cssText = 'background: #e2e8f0; color: #475569; padding: 9px 12px; border-radius: 8px; max-width: 70%; font-size: 0.8rem; font-style: italic;';
    loadDiv.textContent = 'O Livreiro Virtual está consultando o acervo...';
    chatLog.appendChild(loadDiv);
    chatLog.scrollTop = chatLog.scrollHeight;

    try {
      const resp = await fetch('/api/chatbot/mensagem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem: texto, clienteId })
      });
      const dados = await resp.json();
      loadDiv.remove();

      const botDiv = document.createElement('div');
      botDiv.className = 'chat-msg-assistente';
      botDiv.style.cssText = 'background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1; padding: 14px 16px; border-radius: 10px; max-width: 94%; font-size: 0.87rem; line-height: 1.5; box-shadow: 0 2px 5px rgba(0,0,0,0.03);';

      const cardsHTML = (dados.livrosRecomendados || [])
        .map(
          liv => `
          <div class="card-livro-sugerido-chat" style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 9px 12px; margin-top: 8px; display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
            <div>
              <strong style="color: #1b2a47; font-size: 0.85rem;">${liv.titulo}</strong>
              <span style="color: #475569; font-size: 0.78rem;"> — ${liv.autor} (${liv.categoria})</span>
              <div style="font-size: 0.74rem; color: #64748b; margin-top: 2px;">${liv.motivoPersonalizado || ''}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: #dcfce7; color: #166534; padding: 3px 8px; border-radius: 999px; font-size: 0.73rem; font-weight: 800;">
                ${liv.afinidadePercentual || 92}% afinidade
              </span>
              <strong style="color: #047857; font-size: 0.85rem;">R$ ${Number(liv.preco || 45.9).toFixed(2).replace('.', ',')}</strong>
            </div>
          </div>
        `
        )
        .join('');

      const interacaoId = dados.id || `INT-${Date.now()}`;
      const livrosIdsJson = encodeURIComponent(JSON.stringify((dados.livrosRecomendados || []).map(l => l.id)));

      botDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.73rem; color: #64748b; margin-bottom: 6px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
          <span><strong>Livreiro Virtual</strong> (${dados.motorIA?.includes('Gemini') ? 'Google Gemini Live' : 'Motor Neural Local'})</span>
          <span>Cliente: <strong>${dados.nomeCliente || dados.clienteId}</strong> | <strong>${dados.tempoRespostaMs || 12}ms</strong></span>
        </div>
        <div class="chat-resposta-conteudo">${formatarMarkdown(dados.resposta)}</div>
        ${cardsHTML ? `<div style="margin-top: 8px;">${cardsHTML}</div>` : ''}
        <div class="chat-avaliacao-container" data-interacao="${interacaoId}" style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 0.78rem;">
          <span style="color: #334155; font-weight: 600;">Esta resposta foi útil?</span>
          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn-avaliar-resposta btn-feedback-util" data-avaliacao="UTIL" data-interacao="${interacaoId}" data-cliente="${clienteId}" data-categoria="${dados.categoriaFoco || ''}" data-livros="${livrosIdsJson}" style="background: #ecfdf5; color: #047857; border: 1px solid #6ee7b7; padding: 5px 12px; border-radius: 6px; font-weight: 800; font-size: 0.76rem; cursor: pointer;">
              Útil
            </button>
            <button type="button" class="btn-avaliar-resposta btn-feedback-nao-util" data-avaliacao="NAO_UTIL" data-interacao="${interacaoId}" data-cliente="${clienteId}" data-categoria="${dados.categoriaFoco || ''}" data-livros="${livrosIdsJson}" style="background: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5; padding: 5px 12px; border-radius: 6px; font-weight: 800; font-size: 0.76rem; cursor: pointer;">
              Não útil
            </button>
          </div>
        </div>
      `;

      chatLog.appendChild(botDiv);
      chatLog.scrollTop = chatLog.scrollHeight;

      botDiv.querySelectorAll('.btn-avaliar-resposta').forEach(btnFb => {
        btnFb.addEventListener('click', async () => {
          const avaliacao = btnFb.getAttribute('data-avaliacao');
          const intId = btnFb.getAttribute('data-interacao');
          const cli = btnFb.getAttribute('data-cliente');
          const cat = btnFb.getAttribute('data-categoria');
          const livrosRec = JSON.parse(decodeURIComponent(btnFb.getAttribute('data-livros') || '[]'));

          const rFb = await fetch('/api/chatbot/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              interacaoId: intId,
              clienteId: cli,
              avaliacao,
              categoriaFoco: cat,
              livrosRecomendados: livrosRec,
              pergunta: texto
            })
          });
          const resFb = await rFb.json();
          const containerAval = botDiv.querySelector('.chat-avaliacao-container');
          if (containerAval) {
            containerAval.innerHTML = `
              <span class="feedback-registrado-badge" style="color: #047857; font-weight: 800;">
                Feedback registrado (${avaliacao === 'UTIL' ? 'Útil' : 'Não útil'}) e incorporado ao modelo (${resFb.modeloAtualizado?.versaoAjusteFino || 'RLHF'})!
              </span>
            `;
          }
          await carregarComparativoClientes();
        });
      });

    } catch (err) {
      loadDiv.textContent = 'Erro ao processar a pergunta no servidor.';
    }
  }

  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const txt = (chatInput?.value || '').trim();
      if (!txt) return;
      chatInput.value = '';
      enviarMensagem(txt);
    });
  }

  // Atalhos Rápidos
  document.querySelectorAll('.cenario-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const prompt = pill.getAttribute('data-prompt');
      if (prompt) {
        enviarMensagem(prompt);
      }
    });
  });

  if (btnCompararClientes) {
    btnCompararClientes.addEventListener('click', () => {
      const painel = document.getElementById('painel-comparativo-clientes');
      if (painel) {
        painel.scrollIntoView({ behavior: 'smooth' });
      }
      carregarComparativoClientes();
    });
  }

  if (btnAtualizarComparativo) {
    btnAtualizarComparativo.addEventListener('click', () => {
      carregarComparativoClientes();
    });
  }

  if (selectCliente) {
    selectCliente.addEventListener('change', () => {
      localStorage.setItem('alexandria:cliente_codigo', selectCliente.value);
      carregarContextoCliente();
      carregarComparativoClientes();
    });
  }

  if (btnTogglePref && formPref) {
    btnTogglePref.addEventListener('click', () => {
      formPref.style.display = formPref.style.display === 'none' ? 'block' : 'none';
    });
  }

  if (formPref) {
    formPref.addEventListener('submit', async (e) => {
      e.preventDefault();
      const clienteId = getClienteAtual();
      const categorias = Array.from(document.querySelectorAll('.chk-pref-cat:checked')).map(c => c.value);
      const temasStr = document.getElementById('input-pref-temas')?.value || '';
      const temas = temasStr.split(',').map(t => t.trim()).filter(Boolean);

      try {
        const resp = await fetch(`/api/chatbot/preferencias/${clienteId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoriasFavoritas: categorias, temasInteresse: temas })
        });
        const res = await resp.json();
        alert('Preferências atualizadas com sucesso! O modelo recalibrou a afinidade.');
        formPref.style.display = 'none';
        await carregarContextoCliente();
        await carregarComparativoClientes();
      } catch (err) {
        alert('Erro ao salvar preferências.');
      }
    });
  }

  carregarContextoCliente();
  carregarComparativoClientes();
});
