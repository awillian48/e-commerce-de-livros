/**
 * Controlador do Painel Administrativo de Inteligência Artificial & Fine-Tuning (RNF0044)
 * Livraria Alexandria — Alexandria Control Center
 */
document.addEventListener('DOMContentLoaded', () => {
  const btnRetreinar = document.getElementById('btn-retreinar-modelo');
  const btnAtualizarComparativo = document.getElementById('btn-atualizar-comparativo');
  const formGeminiKey = document.getElementById('form-salvar-gemini-key');
  const inputGeminiKey = document.getElementById('input-gemini-key');
  const msgRetornoGemini = document.getElementById('msg-retorno-gemini');

  async function carregarEstadoIA() {
    try {
      const resp = await fetch('/api/chatbot/estado');
      const data = await resp.json();
      const mod = data.estadoModelo || {};
      const feedbacks = data.feedbacksRegistrados || [];

      // KPIs
      const kpiVersao = document.getElementById('kpi-versao-ft');
      const kpiEpocas = document.getElementById('kpi-epocas-loss');
      const kpiAcuracia = document.getElementById('kpi-acuracia');
      const kpiAmostras = document.getElementById('kpi-amostras');
      const badgeVersao = document.getElementById('badge-versao-modelo');

      if (kpiVersao) kpiVersao.textContent = mod.versaoAjusteFino || 'alexandria-ft-v2.5.0';
      if (badgeVersao) badgeVersao.textContent = `Modelo: ${mod.versaoAjusteFino || 'alexandria-ft-v2.5.0'}`;
      if (kpiEpocas) kpiEpocas.textContent = `${mod.epocasTotais || 14} épocas (Loss: ${mod.lossAtual || 0.0842})`;
      if (kpiAcuracia) kpiAcuracia.textContent = `${((mod.acuraciaValidacao || 0.946) * 100).toFixed(1).replace('.', ',')}%`;
      if (kpiAmostras) {
        const ult = (mod.historicoTreinamentos || [])[0];
        kpiAmostras.textContent = `${ult?.amostrasVendas || 12} Vendas + ${feedbacks.length} Feedbacks`;
      }

      // Status Gemini
      const lblGemini = document.getElementById('lbl-status-gemini');
      const txtStatusGemini = document.getElementById('txt-status-chave-atual');
      if (data.geminiConfigurado) {
        if (lblGemini) lblGemini.innerHTML = `<span style="color: #047857;">🟢 Gemini Live Conectado (${data.geminiKeyMascarada})</span>`;
        if (txtStatusGemini) txtStatusGemini.innerHTML = `<span style="color: #166534; font-weight: 700;">🟢 Chave configurada e conectada (${data.geminiKeyMascarada}). Respostas generativas em tempo real ativas via gemini-3.5-flash-lite!</span>`;
      } else {
        if (lblGemini) lblGemini.innerHTML = `<span style="color: #b45309;">🟡 Motor Neural Local Embarcado</span>`;
        if (txtStatusGemini) txtStatusGemini.innerHTML = `<span style="color: #b45309;">🟡 Nenhuma chave externa configurada. O sistema está usando o Motor Neural Local Embarcado (${mod.versaoAjusteFino}).</span>`;
      }

      // Matriz de Pesos Sinápticos por Categoria
      const containerPesos = document.getElementById('container-pesos-categorias');
      if (containerPesos) {
        const pesos = mod.pesosCategoriasTreinados || {
          'Literatura Brasileira': 0.58,
          'Engenharia de Software': 0.28,
          'Filosofia': 0.10,
          'Obras Raras': 0.04
        };
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

      // Feedbacks Registrados no Chat
      const badgeFb = document.getElementById('badge-total-feedbacks');
      if (badgeFb) badgeFb.textContent = `${feedbacks.length} registros`;

      const listaFb = document.getElementById('lista-feedbacks-recentes');
      if (listaFb) {
        if (feedbacks.length === 0) {
          listaFb.innerHTML = '<div style="color: #64748b; font-style: italic;">Nenhum feedback registrado ainda. Avalie as respostas no chatbot para calibrar o modelo!</div>';
        } else {
          listaFb.innerHTML = feedbacks
            .slice(0, 10)
            .map(
              fb => `
              <div style="background: ${fb.avaliacao === 'UTIL' ? '#f0fdf4' : '#fef2f2'}; border: 1px solid ${fb.avaliacao === 'UTIL' ? '#bbf7d0' : '#fecaca'}; border-radius: 6px; padding: 7px 10px;">
                <div style="display: flex; justify-content: space-between; font-weight: 700;">
                  <span>${fb.avaliacao === 'UTIL' ? '👍 ÚTIL (+0.45 RLHF)' : '👎 NÃO ÚTIL (-0.80 RLHF)'} — ${fb.clienteId}</span>
                  <span style="color: #64748b; font-size: 0.7rem;">${fb.categoriaFoco || ''}</span>
                </div>
                <div style="color: #334155; margin-top: 2px;">"${fb.pergunta}"</div>
              </div>
            `
            )
            .join('');
        }
      }

      // Histórico de Treinamentos
      const listaTreino = document.getElementById('lista-historico-treinamentos');
      if (listaTreino) {
        listaTreino.innerHTML = (mod.historicoTreinamentos || [])
          .slice(0, 5)
          .map(
            t => `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; display: flex; justify-content: space-between; align-items: center;">
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

    } catch (err) {
      console.error('Erro ao carregar estado de IA:', err);
    }
  }

  async function carregarComparativoClientes() {
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/chatbot/recomendacoes/CLI-001?limite=3').then(r => r.json()),
        fetch('/api/chatbot/recomendacoes/CLI-002?limite=3').then(r => r.json())
      ]);

      const renderBox = (dados) => `
        <div style="font-weight: 800; color: #1b2a47; font-size: 0.88rem; margin-bottom: 4px;">
          👤 ${dados.clienteId} — ${dados.nomeCliente}
        </div>
        <div style="font-size: 0.75rem; color: #475569; margin-bottom: 6px;">
          <strong>Preferências:</strong> ${(dados.preferencias?.categoriasFavoritas || []).join(', ')}<br>
          <strong>Compras anteriores:</strong> ${(dados.historicoResumo?.livrosCompradosTitulos || []).slice(0, 2).join(', ') || 'N/A'}
        </div>
        <div style="font-size: 0.76rem; font-weight: 700; color: #0f766e; margin-bottom: 6px;">
          Top Recomendações (${dados.versaoModelo}):
        </div>
        ${(dados.recomendacoes || [])
          .map(
            (l, i) => `
            <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 5px; padding: 6px 8px; margin-bottom: 5px;">
              <strong>${i + 1}. ${l.titulo}</strong> <span style="color:#047857; font-weight:700;">(${l.afinidadePercentual}%)</span><br>
              <span style="font-size: 0.72rem; color: #64748b;">${l.categoria} | R$ ${Number(l.preco).toFixed(2).replace('.', ',')}</span>
            </div>
          `
          )
          .join('')}
      `;

      const box1 = document.getElementById('comp-cli-001');
      const box2 = document.getElementById('comp-cli-002');
      if (box1) box1.innerHTML = renderBox(r1);
      if (box2) box2.innerHTML = renderBox(r2);
    } catch (err) {
      console.error('Erro ao carregar comparativo:', err);
    }
  }

  // Executar Ajuste Fino
  if (btnRetreinar) {
    btnRetreinar.addEventListener('click', async () => {
      btnRetreinar.disabled = true;
      btnRetreinar.textContent = 'Treinando modelo...';
      try {
        const resp = await fetch('/api/chatbot/treinar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gatilho: 'Ajuste Fino Manual disparado no Painel Admin' })
        });
        const res = await resp.json();
        alert(`Sucesso! ${res.mensagem || 'Modelo retreinado com sucesso.'}`);
        await carregarEstadoIA();
        await carregarComparativoClientes();
      } catch (e) {
        alert('Erro ao disparar treinamento.');
      } finally {
        btnRetreinar.disabled = false;
        btnRetreinar.textContent = '⚡ Executar Ajuste Fino Agora';
      }
    });
  }

  // Atualizar Comparativo
  if (btnAtualizarComparativo) {
    btnAtualizarComparativo.addEventListener('click', () => {
      carregarComparativoClientes();
    });
  }

  // Salvar Chave Gemini
  if (formGeminiKey) {
    formGeminiKey.addEventListener('submit', async (e) => {
      e.preventDefault();
      const chave = (inputGeminiKey?.value || '').trim();
      if (!chave) return;

      const btnSalvar = document.getElementById('btn-salvar-gemini');
      if (btnSalvar) {
        btnSalvar.disabled = true;
        btnSalvar.textContent = 'Validando conexão com Google AI Studio...';
      }

      try {
        const resp = await fetch('/api/chatbot/configurar-gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chave })
        });
        const res = await resp.json();
        if (msgRetornoGemini) {
          msgRetornoGemini.style.display = 'block';
          if (res.sucesso) {
            msgRetornoGemini.style.background = '#ecfdf5';
            msgRetornoGemini.style.color = '#065f46';
            msgRetornoGemini.style.border = '1px solid #a7f3d0';
            msgRetornoGemini.textContent = `✓ ${res.mensagem || 'Chave configurada com sucesso!'}`;
            inputGeminiKey.value = '';
          } else {
            msgRetornoGemini.style.background = '#fef2f2';
            msgRetornoGemini.style.color = '#991b1b';
            msgRetornoGemini.style.border = '1px solid #fecaca';
            msgRetornoGemini.textContent = `Erro: ${res.erro || 'Falha ao validar chave.'}`;
          }
        }
        await carregarEstadoIA();
      } catch (err) {
        if (msgRetornoGemini) {
          msgRetornoGemini.style.display = 'block';
          msgRetornoGemini.style.background = '#fef2f2';
          msgRetornoGemini.style.color = '#991b1b';
          msgRetornoGemini.textContent = 'Erro ao enviar chave para o servidor.';
        }
      } finally {
        if (btnSalvar) {
          btnSalvar.disabled = false;
          btnSalvar.textContent = 'Testar & Salvar Chave';
        }
      }
    });
  }

  carregarEstadoIA();
  carregarComparativoClientes();
});
