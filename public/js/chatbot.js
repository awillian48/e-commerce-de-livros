/**
 * Controlador Frontend da Central do Chatbot de Recomendação IA Generativa & Fine-Tuning (RNF0044)
 */
document.addEventListener('DOMContentLoaded', () => {
  const selectCliente = document.getElementById('select-cliente-chat');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatLog = document.getElementById('chat-log');
  const btnRetreinar = document.getElementById('btn-retreinar-modelo');
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

  async function carregarEstadoEPesos() {
    const clienteId = getClienteAtual();
    try {
      const [respEstado, respRec] = await Promise.all([
        fetch('/api/chatbot/estado'),
        fetch(`/api/chatbot/recomendacoes/${clienteId}?limite=4`)
      ]);
      const estado = await respEstado.json();
      const rec = await respRec.json();

      const mod = estado.estadoModelo || {};
      const badgeVersao = document.getElementById('badge-versao-modelo');
      const kpiVersao = document.getElementById('kpi-versao-ft');
      const kpiEpocas = document.getElementById('kpi-epocas-loss');
      const kpiAcuracia = document.getElementById('kpi-acuracia');
      const kpiAmostras = document.getElementById('kpi-amostras');

      if (badgeVersao) badgeVersao.textContent = `Modelo: ${mod.versaoAjusteFino || 'alexandria-ft-v2.4.0'}`;
      if (kpiVersao) kpiVersao.textContent = mod.versaoAjusteFino || 'alexandria-ft-v2.4.0';
      if (kpiEpocas) kpiEpocas.textContent = `${mod.epocasTotais || 14} épocas (Loss: ${mod.lossAtual || 0.0842})`;
      if (kpiAcuracia) kpiAcuracia.textContent = `${((mod.acuraciaValidacao || 0.946) * 100).toFixed(1).replace('.', ',')}%`;

      const feedbacks = estado.feedbacksRegistrados || [];
      if (kpiAmostras) {
        const ultTreino = (mod.historicoTreinamentos || [])[0];
        kpiAmostras.textContent = `${ultTreino?.amostrasVendas || 12} Vendas + ${feedbacks.length} Feedbacks`;
      }

      // Indicador da API do Google Gemini Live
      const lblGemini = document.getElementById('lbl-status-gemini');
      const txtStatusGemini = document.getElementById('txt-status-chave-atual');
      if (estado.geminiConfigurado) {
        if (lblGemini) lblGemini.innerHTML = `<span style="color: #4ade80;">🟢 Gemini Live Ativo (${estado.geminiKeyMascarada})</span>`;
        if (txtStatusGemini) txtStatusGemini.innerHTML = `<span style="color: #166534;">🟢 Chave configurada e conectada (${estado.geminiKeyMascarada}). As respostas livres usam o Google Gemini Live!</span>`;
      } else {
        if (lblGemini) lblGemini.textContent = 'Conectar Gemini API';
        if (txtStatusGemini) txtStatusGemini.innerHTML = `<span style="color: #b45309;">🟡 Nenhuma chave configurada. O sistema está usando o Motor Neural Local Embarcado.</span>`;
      }

      // Contexto do cliente selecionado
      const lblNome = document.getElementById('lbl-nome-cliente');
      const lblHist = document.getElementById('lbl-historico-livros');
      const lblPref = document.getElementById('lbl-preferencias-cliente');
      const lblTemas = document.getElementById('lbl-temas-cliente');
      const lblPesosCli = document.getElementById('lbl-pesos-cliente');

      if (lblNome) lblNome.textContent = rec.nomeCliente || clienteId;
      if (lblPesosCli) lblPesosCli.textContent = `${clienteId} (${rec.nomeCliente || ''})`;
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

      // Atualiza checkboxes do formulário de preferências
      const catsAtuais = rec.preferencias?.categoriasFavoritas || [];
      document.querySelectorAll('.chk-pref-cat').forEach(chk => {
        chk.checked = catsAtuais.includes(chk.value);
      });
      const inputTemas = document.getElementById('input-pref-temas');
      if (inputTemas) {
        inputTemas.value = (rec.preferencias?.temasInteresse || []).join(', ');
      }

      // Barras de Pesos Sinápticos por Categoria
      const containerPesos = document.getElementById('container-pesos-categorias');
      if (containerPesos) {
        const pesos = rec.pesosCategoriasTreinados || {};
        const entradas = Object.entries(pesos).sort((a, b) => b[1] - a[1]);
        containerPesos.innerHTML = entradas
          .map(([cat, peso]) => {
            const pct = (peso * 100).toFixed(1);
            return `
              <div class="peso-bar-wrap">
                <div class="peso-bar-header">
                  <span>${cat}</span>
                  <span style="color: #0f766e; font-weight: 800;">${pct}%</span>
                </div>
                <div class="peso-bar-bg">
                  <div class="peso-bar-fill" style="width: ${Math.min(100, Math.max(6, Number(pct)))}%;"></div>
                </div>
              </div>
            `;
          })
          .join('');
      }

      // Lista de Feedbacks Registrados no Chat
      const badgeFb = document.getElementById('badge-total-feedbacks');
      if (badgeFb) badgeFb.textContent = `${feedbacks.length} registros`;

      const listaFb = document.getElementById('lista-feedbacks-recentes');
      if (listaFb) {
        listaFb.innerHTML = feedbacks
          .slice(0, 8)
          .map(
            fb => `
            <div class="item-feedback-registrado" style="background: ${fb.avaliacao === 'UTIL' ? '#f0fdf4' : '#fef2f2'}; border: 1px solid ${fb.avaliacao === 'UTIL' ? '#bbf7d0' : '#fecaca'}; border-radius: 6px; padding: 7px 10px;">
              <div style="display: flex; justify-content: space-between; font-weight: 700;">
                <span>${fb.avaliacao === 'UTIL' ? '👍 ÚTIL (+RLHF)' : '👎 NÃO ÚTIL (-RLHF)'} — Cliente ${fb.clienteId}</span>
                <span style="color: #64748b; font-size: 0.7rem;">${fb.categoriaFoco || ''}</span>
              </div>
              <div style="color: #334155; margin-top: 2px;">"${fb.pergunta}"</div>
            </div>
          `
          )
          .join('');
      }

      // Histórico de Treinamentos
      const listaTreino = document.getElementById('lista-historico-treinamentos');
      if (listaTreino) {
        listaTreino.innerHTML = (mod.historicoTreinamentos || [])
          .slice(0, 4)
          .map(
            t => `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 9px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="color: #0f766e;">${t.versao}</strong> — <span>${t.gatilho}</span>
              </div>
              <span style="color: #475569; font-weight: 700; white-space: nowrap;">Loss: ${t.loss} | Acurácia: ${(t.acuracia * 100).toFixed(1)}%</span>
            </div>
          `
          )
          .join('');
      }

      // Dataset JSONL
      const preJsonl = document.getElementById('pre-dataset-jsonl');
      if (preJsonl) {
        preJsonl.textContent = (mod.datasetFineTuning || [])
          .map(item => JSON.stringify(item))
          .join('\n');
      }
    } catch (e) {}
  }

  async function carregarComparativoClientes() {
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/chatbot/recomendacoes/CLI-001?limite=3').then(r => r.json()),
        fetch('/api/chatbot/recomendacoes/CLI-002?limite=3').then(r => r.json())
      ]);

      const renderBox = (dados) => `
        <div style="font-weight: 800; color: #1b2a47; font-size: 0.86rem; margin-bottom: 4px;">
          👤 ${dados.clienteId} — ${dados.nomeCliente}
        </div>
        <div style="font-size: 0.74rem; color: #475569; margin-bottom: 6px;">
          <strong>Preferências:</strong> ${(dados.preferencias?.categoriasFavoritas || []).join(', ')}<br>
          <strong>Compras anteriores:</strong> ${(dados.historicoResumo?.livrosCompradosTitulos || []).slice(0, 2).join(', ') || 'N/A'}
        </div>
        <div style="font-size: 0.75rem; font-weight: 700; color: #0f766e; margin-bottom: 4px;">
          Top Recomendações Personalizadas (${dados.versaoModelo}):
        </div>
        ${(dados.recomendacoes || [])
          .map(
            (l, i) => `
            <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 5px; padding: 5px 8px; margin-bottom: 4px;">
              <strong>${i + 1}. ${l.titulo}</strong> <span style="color:#047857; font-weight:700;">(${l.afinidadePercentual}%)</span><br>
              <span style="font-size: 0.7rem; color: #64748b;">Categoria: ${l.categoria} | R$ ${Number(l.preco).toFixed(2).replace('.', ',')}</span>
            </div>
          `
          )
          .join('')}
      `;

      const box1 = document.getElementById('comp-cli-001');
      const box2 = document.getElementById('comp-cli-002');
      if (box1) box1.innerHTML = renderBox(r1);
      if (box2) box2.innerHTML = renderBox(r2);
    } catch (e) {}
  }

  async function enviarMensagem(texto) {
    const clienteId = getClienteAtual();
    if (!texto) return;

    const userDiv = document.createElement('div');
    userDiv.className = 'chat-msg-usuario';
    userDiv.style.cssText = 'background: #1b2a47; color: #ffffff; padding: 10px 14px; border-radius: 10px; margin-left: auto; max-width: 82%; font-size: 0.87rem; font-weight: 500;';
    userDiv.textContent = texto;
    chatLog.appendChild(userDiv);
    chatLog.scrollTop = chatLog.scrollHeight;

    const loadDiv = document.createElement('div');
    loadDiv.style.cssText = 'background: #e2e8f0; color: #475569; padding: 9px 12px; border-radius: 8px; max-width: 70%; font-size: 0.8rem; font-style: italic;';
    loadDiv.textContent = 'Processando com IA Generativa e pesos treinados...';
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
      botDiv.style.cssText = 'background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1; padding: 12px 15px; border-radius: 10px; max-width: 94%; font-size: 0.86rem; line-height: 1.5; box-shadow: 0 2px 4px rgba(0,0,0,0.03);';

      const cardsHTML = (dados.livrosRecomendados || [])
        .map(
          liv => `
          <div class="card-livro-sugerido-chat" style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 9px 12px; margin-top: 8px; display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
            <div>
              <strong style="color: #1b2a47; font-size: 0.85rem;">${liv.titulo}</strong>
              <span style="color: #475569; font-size: 0.78rem;"> — ${liv.autor} (${liv.categoria})</span>
              <div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">${liv.motivoPersonalizado || ''}</div>
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
          <span>🤖 <strong>${dados.motorIA || 'Gemini FT'}</strong></span>
          <span>Cliente: <strong>${dados.clienteId} (${dados.nomeCliente || ''})</strong> | Tempo: <strong>${dados.tempoRespostaMs || 12}ms</strong></span>
        </div>
        <div class="chat-resposta-conteudo">${formatarMarkdown(dados.resposta)}</div>
        ${cardsHTML ? `<div style="margin-top: 8px;">${cardsHTML}</div>` : ''}
        <div class="chat-avaliacao-container" data-interacao="${interacaoId}" style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 0.78rem;">
          <span style="color: #334155; font-weight: 700;">Avalie esta resposta para treinar o modelo (RNF0044 item 3):</span>
          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn-avaliar-resposta btn-feedback-util" data-avaliacao="UTIL" data-interacao="${interacaoId}" data-cliente="${clienteId}" data-categoria="${dados.categoriaFoco || ''}" data-livros="${livrosIdsJson}" style="background: #ecfdf5; color: #047857; border: 1px solid #6ee7b7; padding: 5px 12px; border-radius: 6px; font-weight: 800; font-size: 0.76rem; cursor: pointer;">
              👍 Útil
            </button>
            <button type="button" class="btn-avaliar-resposta btn-feedback-nao-util" data-avaliacao="NAO_UTIL" data-interacao="${interacaoId}" data-cliente="${clienteId}" data-categoria="${dados.categoriaFoco || ''}" data-livros="${livrosIdsJson}" style="background: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5; padding: 5px 12px; border-radius: 6px; font-weight: 800; font-size: 0.76rem; cursor: pointer;">
              👎 Não útil
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
                ✓ Feedback registrado (${avaliacao === 'UTIL' ? '👍 Útil' : '👎 Não útil'}) e incorporado ao modelo (${resFb.modeloAtualizado?.versaoAjusteFino || 'RLHF'})!
              </span>
            `;
          }
          await carregarEstadoEPesos();
          await carregarComparativoClientes();
        });
      });

      await carregarEstadoEPesos();
    } catch (err) {
      loadDiv.textContent = 'Erro ao processar a pergunta no servidor.';
    }
  }

  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const txt = chatInput.value.trim();
      if (!txt) return;
      chatInput.value = '';
      enviarMensagem(txt);
    });
  }

  document.querySelectorAll('.cenario-pill[data-prompt]').forEach(btn => {
    btn.addEventListener('click', () => {
      const prompt = btn.getAttribute('data-prompt');
      if (prompt) enviarMensagem(prompt);
    });
  });

  if (btnCompararClientes) {
    btnCompararClientes.addEventListener('click', async () => {
      await carregarComparativoClientes();
      const painel = document.getElementById('painel-comparativo-clientes');
      if (painel) painel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  if (btnAtualizarComparativo) {
    btnAtualizarComparativo.addEventListener('click', carregarComparativoClientes);
  }

  if (selectCliente) {
    selectCliente.addEventListener('change', async () => {
      localStorage.setItem('alexandria:cliente_codigo', selectCliente.value);
      await carregarEstadoEPesos();
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
      const categoriasFavoritas = Array.from(document.querySelectorAll('.chk-pref-cat:checked')).map(c => c.value);
      const temasStr = document.getElementById('input-pref-temas')?.value || '';
      const temasInteresse = temasStr.split(',').map(s => s.trim()).filter(Boolean);

      await fetch(`/api/chatbot/preferencias/${clienteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoriasFavoritas: categoriasFavoritas.length ? categoriasFavoritas : ['Literatura Brasileira'],
          temasInteresse
        })
      });
      formPref.style.display = 'none';
      await carregarEstadoEPesos();
      await carregarComparativoClientes();
    });
  }

  if (btnRetreinar) {
    btnRetreinar.addEventListener('click', async () => {
      btnRetreinar.disabled = true;
      btnRetreinar.textContent = '⏳ Executando Ajuste Fino...';
      await fetch('/api/chatbot/treinar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gatilho: 'Ajuste Fino Acionado na Apresentação (Vendas + Feedback RLHF)'
        })
      });
      await carregarEstadoEPesos();
      await carregarComparativoClientes();
      btnRetreinar.disabled = false;
      btnRetreinar.textContent = '✓ Modelo Ajustado com Sucesso!';
      setTimeout(() => {
        btnRetreinar.textContent = '⚡ Executar Ajuste Fino Agora';
      }, 2200);
    });
  }

  // Modal de Configuração do Google Gemini Live
  const btnModalGemini = document.getElementById('btn-modal-gemini');
  const modalGemini = document.getElementById('modal-config-gemini');
  const btnFecharModalGemini = document.getElementById('btn-fechar-modal-gemini');
  const btnCancelarGemini = document.getElementById('btn-cancelar-gemini');
  const formSalvarGemini = document.getElementById('form-salvar-gemini-key');
  const inputGemini = document.getElementById('input-gemini-key');
  const msgRetornoGemini = document.getElementById('msg-retorno-gemini');

  function abrirModalGemini() {
    if (modalGemini) {
      modalGemini.style.display = 'flex';
      if (msgRetornoGemini) msgRetornoGemini.style.display = 'none';
      if (inputGemini) inputGemini.focus();
    }
  }

  function fecharModalGemini() {
    if (modalGemini) modalGemini.style.display = 'none';
  }

  if (btnModalGemini) btnModalGemini.addEventListener('click', abrirModalGemini);
  if (btnFecharModalGemini) btnFecharModalGemini.addEventListener('click', fecharModalGemini);
  if (btnCancelarGemini) btnCancelarGemini.addEventListener('click', fecharModalGemini);

  if (formSalvarGemini) {
    formSalvarGemini.addEventListener('submit', async (e) => {
      e.preventDefault();
      const chave = inputGemini?.value.trim();
      if (!chave) return;

      const btnSalvar = document.getElementById('btn-salvar-gemini');
      if (btnSalvar) {
        btnSalvar.disabled = true;
        btnSalvar.textContent = '⏳ Validando Chave com Google...';
      }

      try {
        const resp = await fetch('/api/chatbot/configurar-gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chave })
        });
        const resJson = await resp.json();

        if (msgRetornoGemini) {
          msgRetornoGemini.style.display = 'block';
          if (resp.ok && resJson.sucesso) {
            msgRetornoGemini.style.background = '#ecfdf5';
            msgRetornoGemini.style.border = '1px solid #6ee7b7';
            msgRetornoGemini.style.color = '#065f46';
            msgRetornoGemini.textContent = `✓ ${resJson.mensagem} (Modelo: ${resJson.modeloAtivo})`;
            setTimeout(() => {
              fecharModalGemini();
            }, 1800);
            await carregarEstadoEPesos();
          } else {
            msgRetornoGemini.style.background = '#fef2f2';
            msgRetornoGemini.style.border = '1px solid #fca5a5';
            msgRetornoGemini.style.color = '#991b1b';
            msgRetornoGemini.textContent = `Erro: ${resJson.erro || 'Não foi possível validar a chave'}`;
          }
        }
      } catch (err) {
        if (msgRetornoGemini) {
          msgRetornoGemini.style.display = 'block';
          msgRetornoGemini.style.background = '#fef2f2';
          msgRetornoGemini.style.border = '1px solid #fca5a5';
          msgRetornoGemini.style.color = '#991b1b';
          msgRetornoGemini.textContent = `Erro de rede: ${err.message}`;
        }
      } finally {
        if (btnSalvar) {
          btnSalvar.disabled = false;
          btnSalvar.textContent = 'Testar & Salvar Chave';
        }
      }
    });
  }

  carregarEstadoEPesos();
  carregarComparativoClientes();
});
