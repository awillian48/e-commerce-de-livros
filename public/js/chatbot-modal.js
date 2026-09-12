document.addEventListener('DOMContentLoaded', () => {
  // Impede duplicidade de injeção caso o script seja importado mais de uma vez
  if (document.getElementById('chat-toggle-btn')) return;

  const modalHTML = `
    <button id="chat-toggle-btn" class="chat-btn-floating">Recomendador Virtual</button>
    <div id="chat-modal-window" class="chat-modal-box">
      <div class="chat-modal-header">
        <span>Livreiro Virtual</span>
        <button id="chat-close-btn" style="background:none; border:none; color:white; font-size:1.1rem; cursor:pointer; font-weight:bold;">✕</button>
      </div>
      
      <!-- Container de logs com colapso de altura flexível (min-height: 0) -->
      <div id="chat-log-window" style="flex: 1; min-height: 0; overflow-y: auto; padding: 12px; background: var(--palette-cream, #fbf7ee); font-family: var(--font-ui, sans-serif); font-size: 0.85rem; display: flex; flex-direction: column; gap: 10px;">
        <div style="background: #e2e8f0; color: var(--text-title, #1b2a47); padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-color, #e2e8f0); max-width: 85%;">
          Olá! Em que posso ajudar na escolha do seu clássico hoje?
        </div>
      </div>

      <!-- Formulário fixado na base com flex-shrink: 0 -->
      <form id="chat-modal-form" style="display: flex; gap: 8px; padding: 10px; border-top: 1px solid var(--border-color, #e2e8f0); background: white; flex-shrink: 0;">
        <input type="text" id="chat-modal-input" placeholder="Digite um tema..." style="flex: 1; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; outline: none;" required>
        <button type="submit" style="background: var(--palette-terracotta, #c1121f); color: white; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem; flex-shrink: 0;">Enviar</button>
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

  toggleBtn.addEventListener('click', () => {
    const isVisible = modalWindow.style.display === 'flex';
    modalWindow.style.display = isVisible ? 'none' : 'flex';
  });

  closeBtn.addEventListener('click', () => {
    modalWindow.style.display = 'none';
  });

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const texto = chatInput.value.trim();
    if (!texto) return;

    // Mensagem do Usuário com cor de fundo escura explícita para garantir contraste
    const userMsg = document.createElement('div');
    userMsg.style.cssText = 'background: var(--palette-navy-dark, #1b2a47); color: #ffffff; padding: 10px 12px; border-radius: 8px; margin-left: auto; max-width: 85%; font-family: var(--font-ui, sans-serif); font-size: 0.85rem; font-weight: 500; word-break: break-word; box-shadow: 0 1px 3px rgba(0,0,0,0.1);';
    userMsg.textContent = texto;
    chatLog.appendChild(userMsg);
    chatInput.value = '';
    chatLog.scrollTop = chatLog.scrollHeight;

    setTimeout(() => {
      const botMsg = document.createElement('div');
      botMsg.style.cssText = 'background: #e2e8f0; color: var(--text-title, #1b2a47); padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-color, #e2e8f0); max-width: 85%; font-family: var(--font-ui, sans-serif); font-size: 0.85rem; word-break: break-word;';
      botMsg.innerHTML = `Para "<strong>${texto}</strong>", recomendo a leitura de <strong>Dom Casmurro</strong> de Machado de Assis!`;
      chatLog.appendChild(botMsg);
      chatLog.scrollTop = chatLog.scrollHeight;
    }, 400);
  });
});