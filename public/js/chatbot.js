document.addEventListener('DOMContentLoaded', () => {
  const chatLog = document.getElementById('chat-log');
  const chatInput = document.getElementById('chat-input');
  const chatForm = document.getElementById('chat-form');

  function adicionarMensagem(remetente, texto) {
    const msgDiv = document.createElement('div');
    msgDiv.style.marginBottom = '12px';
    msgDiv.style.padding = '10px 14px';
    msgDiv.style.borderRadius = '8px';
    msgDiv.style.fontFamily = 'sans-serif';
    msgDiv.style.fontSize = '0.9rem';
    msgDiv.style.maxWidth = '80%';

    if (remetente === 'usuario') {
      msgDiv.style.background = 'var(--header-teal)';
      msgDiv.style.color = 'white';
      msgDiv.style.marginLeft = 'auto';
    } else {
      msgDiv.style.background = '#f0ebe1';
      msgDiv.style.color = 'var(--text-dark)';
      msgDiv.style.border = '1px solid var(--border-color)';
    }

    msgDiv.innerHTML = texto;
    chatLog.appendChild(msgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const textoUsuario = chatInput.value.trim();
      if (!textoUsuario) return;

      adicionarMensagem('usuario', textoUsuario);
      chatInput.value = '';

      // Simulação de inteligência conversacional de recomendação
      setTimeout(() => {
        let respostaBot = "Para apreciadores de grandes clássicos, recomendo <strong>Dom Casmurro</strong> de Machado de Assis ou <strong>O Cortiço</strong> de Aluísio Azevedo!";
        const busca = textoUsuario.toLowerCase();

        if (busca.includes('romance') || busca.includes('amor')) {
          respostaBot = "Se você busca um romance de época, recomendo <strong>A Senhora</strong> de José de Alencar.";
        } else if (busca.includes('codigo') || busca.includes('programação') || busca.includes('tecnologia')) {
          respostaBot = "Para arquitetura e engenharia de software, a melhor opção é <strong>Clean Code</strong> de Robert C. Martin.";
        }

        adicionarMensagem('bot', `<strong>Livreiro Virtual:</strong> ${respostaBot}`);
      }, 500);
    });
  }
});