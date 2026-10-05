/**
 * Sistema Universal de Modais e Diálogos In-App - Livraria Alexandria
 * Substitui os alerts e confirms nativos do navegador por caixas de diálogo elegantes no padrão da livraria.
 */
(function(window) {
  let modalContainer = null;

  function obterOuCriarModal() {
    if (modalContainer && document.body.contains(modalContainer)) return modalContainer;

    modalContainer = document.createElement('div');
    modalContainer.id = 'sistema-modal-dialogo';
    modalContainer.style.cssText = [
      'display: none',
      'position: fixed',
      'top: 0',
      'left: 0',
      'width: 100vw',
      'height: 100vh',
      'background: rgba(15, 23, 42, 0.65)',
      'backdrop-filter: blur(4px)',
      'z-index: 99999',
      'justify-content: center',
      'align-items: center',
      'padding: 16px',
      'box-sizing: border-box',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ].join('; ');

    modalContainer.innerHTML = [
      '<div style="background: #ffffff; width: 90%; max-width: 440px; border-radius: 12px; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); margin: 0; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2); overflow: hidden; animation: modalEntrada 0.2s ease-out;">',
      '  <div style="background: var(--palette-navy-dark, #0f172a); color: white; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center;">',
      '    <strong id="modal-dialogo-titulo" style="font-size: 1rem; font-weight: 700; letter-spacing: -0.01em;">Aviso</strong>',
      '    <button id="modal-dialogo-fechar-topo" type="button" style="background: none; border: none; color: #94a3b8; font-size: 1.3rem; line-height: 1; cursor: pointer; padding: 0 4px;">&times;</button>',
      '  </div>',
      '  <div style="padding: 20px 24px;">',
      '    <p id="modal-dialogo-mensagem" style="margin: 0; color: #334155; font-size: 0.95rem; line-height: 1.5; white-space: pre-line;"></p>',
      '  </div>',
      '  <div id="modal-dialogo-botoes" style="padding: 12px 24px 20px; display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #f1f5f9;">',
      '  </div>',
      '</div>'
    ].join('');

    if (!document.getElementById('sistema-modal-animacao')) {
      const style = document.createElement('style');
      style.id = 'sistema-modal-animacao';
      style.textContent = '@keyframes modalEntrada { from { opacity: 0; transform: scale(0.96) translateY(-10px); } to { opacity: 1; transform: scale(1) translateY(0); } }';
      document.head.appendChild(style);
    }

    document.body.appendChild(modalContainer);

    document.getElementById('modal-dialogo-fechar-topo').onclick = () => {
      fecharModalDialogo();
    };

    modalContainer.onclick = (e) => {
      if (e.target === modalContainer) fecharModalDialogo();
    };

    return modalContainer;
  }

  function fecharModalDialogo() {
    if (modalContainer) {
      modalContainer.style.display = 'none';
    }
  }

  window.mostrarModalAviso = function(mensagem, titulo = 'Livraria Alexandria') {
    const modal = obterOuCriarModal();
    document.getElementById('modal-dialogo-titulo').textContent = titulo;
    document.getElementById('modal-dialogo-mensagem').textContent = String(mensagem || '');
    
    const containerBotoes = document.getElementById('modal-dialogo-botoes');
    containerBotoes.innerHTML = [
      '<button id="modal-btn-ok" type="button" style="background: var(--palette-navy-dark, #0f172a); color: white; border: none; padding: 9px 20px; border-radius: 6px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: background 0.15s ease;">',
      '  Entendido',
      '</button>'
    ].join('');

    const btnOk = document.getElementById('modal-btn-ok');
    btnOk.onclick = () => fecharModalDialogo();

    modal.style.display = 'flex';
    btnOk.focus();
  };

  window.mostrarModalConfirmacao = function(mensagem, onConfirmar, onCancelar, titulo = 'Confirmação') {
    const modal = obterOuCriarModal();
    document.getElementById('modal-dialogo-titulo').textContent = titulo;
    document.getElementById('modal-dialogo-mensagem').textContent = String(mensagem || '');

    const containerBotoes = document.getElementById('modal-dialogo-botoes');
    containerBotoes.innerHTML = [
      '<button id="modal-btn-cancelar" type="button" style="background: #ffffff; color: #475569; border: 1px solid #cbd5e1; padding: 9px 18px; border-radius: 6px; font-size: 0.9rem; font-weight: 600; cursor: pointer;">',
      '  Cancelar',
      '</button>',
      '<button id="modal-btn-confirmar" type="button" style="background: var(--palette-terracotta, #c1121f); color: white; border: none; padding: 9px 20px; border-radius: 6px; font-size: 0.9rem; font-weight: 600; cursor: pointer;">',
      '  Confirmar',
      '</button>'
    ].join('');

    document.getElementById('modal-btn-cancelar').onclick = () => {
      fecharModalDialogo();
      if (typeof onCancelar === 'function') onCancelar();
    };

    document.getElementById('modal-btn-confirmar').onclick = () => {
      fecharModalDialogo();
      if (typeof onConfirmar === 'function') onConfirmar();
    };

    modal.style.display = 'flex';
    document.getElementById('modal-btn-confirmar').focus();
  };

  // Sobrescreve alert nativo do navegador para usar sempre o modal in-app elegante
  window.alert = function(mensagem) {
    window.mostrarModalAviso(mensagem);
  };

})(window);
