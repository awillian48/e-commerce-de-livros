/**
 * Chatbot Flutuante de Recomendação Personalizada com IA Generativa (RNF0044)
 * Integrado ao Backend de Fine-Tuning Contínuo & RLHF (/api/chatbot/*)
 */
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('chat-toggle-btn')) return;

  const clienteInicial = localStorage.getItem('alexandria:cliente_codigo') || 'CLI-001';

  const modalHTML = `
    <button id="chat-toggle-btn" class="chat-btn-floating" title="Abrir Recomendador com IA Generativa (RNF0044)">
      Recomendador Virtual
    </button>

    <div id="chat-modal-window" class="chat-modal-box" style="width: 410px; height: 590px; max-height: 86vh; display: none; flex-direction: column; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 45px rgba(15,23,42,0.28); border: 1px solid #cbd5e1; z-index: 9999;">
      <!-- Cabeçalho com Seletor de Cliente e Link para Painel de Fine-Tuning -->
      <div class="chat-modal-header" style="background: #1b2a47; color: #fff; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:#22c55e;"></span>
            <strong style="font-size: 0.95rem; letter-spacing: 0.2px;">Livreiro Virtual IA (Gemini FT)</strong>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <a href="/chatbot.html" id="link-abrir-painel-ia" title="Abrir Central Completa e Painel de Fine-Tuning (RNF0044)" style="color: #fbbf24; font-size: 0.75rem; text-decoration: none; font-weight: 700; background: rgba(255,255,255,0.12); padding: 4px 8px; border-radius: 4px;">
              Painel IA & Treino ↗
            </a>
            <button id="chat-close-btn" style="background:none; border:none; color:white; font-size:1.1rem; cursor:pointer; font-weight:bold;">✕</button>
          </div>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 0.76rem; background: rgba(255,255,255,0.1); padding: 6px 8px; border-radius: 6px;">
          <label for="chat-select-cliente" style="color: #cbd5e1; font-weight: 600; white-space: nowrap;">Perfil Cliente:</label>
          <select id="chat-select-cliente" style="flex: 1; background: #0f172a; color: #f8fafc; border: 1px solid #475569; border-radius: 4px; padding: 3px 6px; font-size: 0.76rem; outline: none;">
            <option value="CLI-001">CLI-001 — Machado de Assis (Lit. Brasileira / Raras)</option>
            <option value="CLI-002">CLI-002 — Clarice Lispector (Filosofia / Eng. Software)</option>
            <option value="CLI-003">CLI-003 — Carlos Drummond (Eng. Software / Raras)</option>
          </select>
        </div>
      </div>

      <!-- Barra de Ações Rápidas para Demonstração -->
      <div style="background: #f1f5f9; padding: 7px 10px; border-bottom: 1px solid #e2e8f0; display: flex; gap: 6px; overflow-x: auto; flex-shrink: 0;">
        <button type="button" class="chat-quick-btn" data-prompt="Me recomende livros personalizados com base no meu histórico de compras e preferências" style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 999px; padding: 4px 10px; font-size: 0.73rem; font-weight: 600; color: #1e293b; cursor: pointer; white-space: nowrap;">
          ✨ Recomendar p/ Meu Perfil
        </button>
        <button type="button" class="chat-quick-btn" data-prompt="Sugira uma trilha de conteúdo relevante para meus estudos" style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 999px; padding: 4px 10px; font-size: 0.73rem; font-weight: 600; color: #1e293b; cursor: pointer; white-space: nowrap;">
          📚 Sugerir Conteúdo
        </button>
        <button type="button" class="chat-quick-btn" data-prompt="Quais livros de Engenharia de Software ou Filosofia estão disponíveis?" style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 999px; padding: 4px 10px; font-size: 0.73rem; font-weight: 600; color: #1e293b; cursor: pointer; white-space: nowrap;">
          🔍 Buscar Livros
        </button>
        <button type="button" class="chat-quick-btn" data-prompt="Sobre o que fala o livro Dom Casmurro e Capitu traiu ou não?" style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 999px; padding: 4px 10px; font-size: 0.73rem; font-weight: 600; color: #1e293b; cursor: pointer; white-space: nowrap;">
          ❓ Dúvida de Obra
        </button>
      </div>

      <!-- Janela de Mensagens -->
      <div id="chat-log-window" style="flex: 1; min-height: 0; overflow-y: auto; padding: 12px; background: #fbf7ee; font-family: var(--font-ui, sans-serif); font-size: 0.84rem; display: flex; flex-direction: column; gap: 10px;">
        <div id="chat-boas-vindas" style="background: #ffffff; color: #1b2a47; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0; max-width: 92%; line-height: 1.45;">
          Olá! Sou o <strong>Livreiro Virtual com IA Generativa (RNF0044)</strong>. Posso oferecer <strong>recomendações personalizadas</strong> com base no seu histórico de compras e preferências, ajudar na <strong>busca por livros</strong>, tirar <strong>dúvidas sobre obras</strong> e sugerir <strong>conteúdos relevantes</strong>!
        </div>
      </div>

      <!-- Formulário de Envio -->
      <form id="chat-modal-form" style="display: flex; gap: 8px; padding: 10px; border-top: 1px solid #e2e8f0; background: white; flex-shrink: 0;">
        <input type="text" id="chat-modal-input" placeholder="Pergunte sobre livros, peça recomendações ou tire dúvidas..." style="flex: 1; padding: 9px 11px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.84rem; outline: none;" required>
        <button type="submit" id="chat-modal-submit" style="background: #c1121f; color: white; border: none; padding: 9px 15px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.84rem; flex-shrink: 0;">
          Enviar
        </button>
      </form>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const toggleBtn = document.getElementById('chat-toggle-btn');
  const closeBtn = document.getElementById('chat-close-btn');
  const modalWindow = document.getElementById('chat-modal-window');
  const chatForm = document.getElementById('chat-modal-form');
  const chatInput = document.getElementById('chat-modal-input');
  const chatLog = document.getElementById('chat-log-window');
  const selectCliente = document.getElementById('chat-select-cliente');

  if (selectCliente) {
    selectCliente.value = ['CLI-001', 'CLI-002', 'CLI-003'].includes(clienteInicial) ? clienteInicial : 'CLI-001';
    selectCliente.addEventListener('change', () => {
      localStorage.setItem('alexandria:cliente_codigo', selectCliente.value);
      adicionarAvisoSistema(`Perfil alternado para ${selectCliente.options[selectCliente.selectedIndex].text}. As recomendações usarão o histórico de compras e preferências deste cliente.`);
    });
  }

  document.querySelectorAll('.chat-quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const prompt = btn.getAttribute('data-prompt');
      if (prompt) {
        chatInput.value = prompt;
        chatForm.requestSubmit();
      }
    });
  });

  toggleBtn.addEventListener('click', () => {
    const isVisible = modalWindow.style.display === 'flex';
    modalWindow.style.display = isVisible ? 'none' : 'flex';
  });

  closeBtn.addEventListener('click', () => {
    modalWindow.style.display = 'none';
  });

  function formatarMarkdownSimples(texto = '') {
    return String(texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  function adicionarAvisoSistema(msg) {
    const div = document.createElement('div');
    div.style.cssText = 'background: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 7px 10px; border-radius: 6px; font-size: 0.76rem; text-align: center;';
    div.textContent = msg;
    chatLog.appendChild(div);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const texto = chatInput.value.trim();
    if (!texto) return;

    const clienteId = selectCliente ? selectCliente.value : 'CLI-001';

    // Mensagem do cliente
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg-usuario';
    userMsg.style.cssText = 'background: #1b2a47; color: #ffffff; padding: 9px 12px; border-radius: 8px; margin-left: auto; max-width: 86%; font-size: 0.84rem; font-weight: 500; word-break: break-word;';
    userMsg.textContent = texto;
    chatLog.appendChild(userMsg);
    chatInput.value = '';
    chatLog.scrollTop = chatLog.scrollHeight;

    // Indicador de processamento
    const loadingMsg = document.createElement('div');
    loadingMsg.style.cssText = 'background: #e2e8f0; color: #475569; padding: 8px 12px; border-radius: 8px; max-width: 75%; font-size: 0.78rem; font-style: italic;';
    loadingMsg.textContent = 'Consultando modelo fine-tuned e histórico do cliente...';
    chatLog.appendChild(loadingMsg);
    chatLog.scrollTop = chatLog.scrollHeight;

    try {
      const resp = await fetch('/api/chatbot/mensagem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem: texto, clienteId })
      });
      const dados = await resp.json();
      loadingMsg.remove();

      const botMsg = document.createElement('div');
      botMsg.className = 'chat-msg-assistente';
      botMsg.style.cssText = 'background: #ffffff; color: #1b2a47; padding: 11px 12px; border-radius: 8px; border: 1px solid #cbd5e1; max-width: 95%; font-size: 0.83rem; line-height: 1.45; box-shadow: 0 1px 2px rgba(0,0,0,0.04);';

      const livrosCardsHTML = (dados.livrosRecomendados || [])
        .map(
          liv => `
          <div class="chat-card-livro-recomendado" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 7px 9px; margin-top: 6px; display: flex; justify-content: space-between; align-items: center; gap: 8px;">
            <div style="font-size: 0.76rem;">
              <strong style="color: #0f172a;">${liv.titulo}</strong> <span style="color:#64748b;">(${liv.categoria})</span><br>
              <span style="color: #047857; font-weight: 700;">R$ ${Number(liv.preco || 45.9).toFixed(2).replace('.', ',')}</span>
              <span style="background: #dcfce7; color: #166534; padding: 1px 6px; border-radius: 999px; font-size: 0.68rem; font-weight: 700; margin-left: 4px;">${liv.afinidadePercentual || 92}% afinidade</span>
            </div>
          </div>`
        )
        .join('');

      const interacaoId = dados.id || `INT-${Date.now()}`;
      const livrosIdsJson = encodeURIComponent(JSON.stringify((dados.livrosRecomendados || []).map(l => l.id)));

      botMsg.innerHTML = `
        <div style="font-size: 0.7rem; color: #64748b; margin-bottom: 5px; display: flex; justify-content: space-between;">
          <span>🤖 <strong>${dados.versaoModelo || 'alexandria-ft'}</strong></span>
          <span>Cliente: <strong>${dados.clienteId || clienteId}</strong></span>
        </div>
        <div class="chat-resposta-texto">${formatarMarkdownSimples(dados.resposta || 'Recomendação gerada com sucesso.')}</div>
        ${livrosCardsHTML ? `<div style="margin-top: 8px;">${livrosCardsHTML}</div>` : ''}
        <div class="chat-feedback-bar" data-interacao="${interacaoId}" style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #e2e8f0; display: flex; align-items: center; justify-content: space-between; gap: 6px; font-size: 0.74rem;">
          <span style="color: #475569; font-weight: 600;">Esta resposta foi útil?</span>
          <div style="display: flex; gap: 6px;">
            <button type="button" class="btn-feedback-chat btn-feedback-util" data-avaliacao="UTIL" data-interacao="${interacaoId}" data-cliente="${clienteId}" data-categoria="${dados.categoriaFoco || ''}" data-livros="${livrosIdsJson}" style="background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; border-radius: 4px; padding: 3px 9px; font-size: 0.73rem; font-weight: 700; cursor: pointer;">
              👍 Útil
            </button>
            <button type="button" class="btn-feedback-chat btn-feedback-nao-util" data-avaliacao="NAO_UTIL" data-interacao="${interacaoId}" data-cliente="${clienteId}" data-categoria="${dados.categoriaFoco || ''}" data-livros="${livrosIdsJson}" style="background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: 4px; padding: 3px 9px; font-size: 0.73rem; font-weight: 700; cursor: pointer;">
              👎 Não útil
            </button>
          </div>
        </div>
      `;

      chatLog.appendChild(botMsg);
      chatLog.scrollTop = chatLog.scrollHeight;

      botMsg.querySelectorAll('.btn-feedback-chat').forEach(btnFb => {
        btnFb.addEventListener('click', async () => {
          const avaliacao = btnFb.getAttribute('data-avaliacao');
          const intId = btnFb.getAttribute('data-interacao');
          const cli = btnFb.getAttribute('data-cliente');
          const cat = btnFb.getAttribute('data-categoria');
          const livrosRec = JSON.parse(decodeURIComponent(btnFb.getAttribute('data-livros') || '[]'));

          try {
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
            const barra = botMsg.querySelector('.chat-feedback-bar');
            if (barra) {
              barra.innerHTML = `<span class="feedback-confirmado-msg" style="color: #047857; font-weight: 700;">✓ Feedback (${avaliacao === 'UTIL' ? '👍 Útil' : '👎 Não útil'}) registrado! Modelo ajustado (${resFb.modeloAtualizado?.versaoAjusteFino || 'RLHF'}).</span>`;
            }
          } catch (err) {}
        });
      });
    } catch (err) {
      loadingMsg.textContent = 'Erro ao contatar o motor de IA.';
    }
  });
});
