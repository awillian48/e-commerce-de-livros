/**
 * Lógica do Checkout / Criação de Pedido
 * Atende: RF0033 a RF0038, RN0023, RN0024, RN0025, RN0033 a RN0036
 */
(function() {
  let clienteAtual = null;
  let enderecosCliente = [];
  let cartoesCliente = [];
  let cuponsDisponiveis = [];
  let cuponsSelecionados = [];

  let valorFreteCentavos = 0;
  let criterioFreteTexto = '';

  let novoEnderecoTemp = null;
  let novoCartaoTemp = null;
  let alvoSelectNovoCartao = 'select-cartao-1';

  document.addEventListener('DOMContentLoaded', async () => {
    configurarSeletorCliente();
    configurarEventosEndereco();
    configurarEventosCupons();
    configurarEventosCartao();
    configurarEventosModalCartao();
    configurarFinalizacao();

    const clienteCodigo = window.Carrinho ? window.Carrinho.obterClienteAtual() : 'CLI-001';
    await carregarDadosCheckout(clienteCodigo);
  });

  // ==========================================================================
  // 1. CARREGAMENTO DE DADOS INICIAIS
  // ==========================================================================
  function configurarSeletorCliente() {
    const sel = document.getElementById('select-cliente');
    if (!sel) return;

    sel.addEventListener('change', async (e) => {
      const codigo = e.target.value;
      if (window.Carrinho) window.Carrinho.definirClienteAtual(codigo);
      await carregarDadosCheckout(codigo);
    });
  }

  async function carregarDadosCheckout(codigoCliente) {
    try {
      const res = await fetch(`/api/checkout/cliente/${codigoCliente}`);
      if (!res.ok) throw new Error('Não foi possível carregar dados do cliente');
      const dados = await res.json();

      clienteAtual = dados.cliente;
      enderecosCliente = dados.enderecos || [];
      cartoesCliente = dados.cartoes || [];
      cuponsDisponiveis = dados.cupons || [];

      // Atualiza o select de cliente no header se necessário
      const selCliente = document.getElementById('select-cliente');
      if (selCliente && selCliente.value !== clienteAtual.codigo) {
        selCliente.value = clienteAtual.codigo;
      }

      renderizarEnderecos();
      renderizarCupons();
      renderizarSelectsCartoes();
      await recalcularFrete();
      atualizarResumo();
    } catch (err) {
      console.error('Erro ao carregar checkout:', err);
    }
  }

  // ==========================================================================
  // 2. ENDEREÇO DE ENTREGA E CÁLCULO DE FRETE (RF0034, RF0035, RN0023)
  // ==========================================================================
  function renderizarEnderecos() {
    const container = document.getElementById('container-enderecos-salvos');
    if (!container) return;

    container.innerHTML = '';

    if (enderecosCliente.length === 0) {
      container.innerHTML = '<p style="color: #64748b; font-size: 0.85rem;">Nenhum endereço previamente cadastrado no perfil.</p>';
      const radioNovo = document.getElementById('radio-novo-endereco');
      if (radioNovo) {
        radioNovo.checked = true;
        document.getElementById('form-novo-endereco').style.display = 'block';
      }
      return;
    }

    const jaSelecionouNovo = document.getElementById('radio-novo-endereco')?.checked;
    enderecosCliente.forEach((end, idx) => {
      const card = document.createElement('label');
      card.className = `card-opcao ${(!jaSelecionouNovo && idx === 0) ? 'selecionado' : ''}`;
      card.style.display = 'block';

      card.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 10px;">
          <input type="radio" name="opcao-endereco" class="radio-endereco-item" value="${end.id}" ${(!jaSelecionouNovo && idx === 0) ? 'checked' : ''} style="margin-top: 3px;">
          <div>
            <strong style="color: #1e293b; display: block; font-size: 0.95rem;">${end.fraseIdentificadora || end.frase_identificadora || 'Endereço'}</strong>
            <span style="font-size: 0.83rem; color: #475569;">
              ${end.tipoLogradouro || end.tipo_logradouro || ''} ${end.logradouro}, ${end.numero} - ${end.bairro}
            </span>
            <div style="font-size: 0.8rem; color: #64748b;">
              CEP: ${end.cep} - ${end.cidade}/${end.estado} (${end.pais || 'Brasil'})
            </div>
          </div>
        </div>
      `;
      container.appendChild(card);
    });

    conectarRadiosEndereco();
  }

  function conectarRadiosEndereco() {
    const radios = document.querySelectorAll('input[name="opcao-endereco"]');
    const formNovo = document.getElementById('form-novo-endereco');

    radios.forEach(radio => {
      radio.onchange = async (e) => {
        document.querySelectorAll('.card-opcao').forEach(c => c.classList.remove('selecionado'));
        if (e.target.value === '__NOVO__') {
          if (formNovo) formNovo.style.display = 'block';
        } else {
          if (formNovo) formNovo.style.display = 'none';
          const cardParent = e.target.closest('.card-opcao');
          if (cardParent) cardParent.classList.add('selecionado');
        }
        await recalcularFrete();
        atualizarResumo();
      };
    });
  }

  function configurarEventosEndereco() {
    const radioNovo = document.getElementById('radio-novo-endereco');
    if (radioNovo) {
      radioNovo.addEventListener('change', () => {
        const formNovo = document.getElementById('form-novo-endereco');
        if (radioNovo.checked && formNovo) {
          formNovo.style.display = 'block';
          document.querySelectorAll('.card-opcao').forEach(c => c.classList.remove('selecionado'));
        }
      });
    }
    const camposNovoEndereco = ['end-cep', 'end-estado', 'end-cidade', 'end-logradouro', 'end-numero'];
    camposNovoEndereco.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('blur', async () => {
          const radioNovo = document.getElementById('radio-novo-endereco');
          if (radioNovo && radioNovo.checked) {
            await recalcularFrete();
            atualizarResumo();
          }
        });
      }
    });
  }

  function obterEnderecoSelecionado() {
    const radioChecked = document.querySelector('input[name="opcao-endereco"]:checked');
    if (!radioChecked) return null;

    if (radioChecked.value === '__NOVO__') {
      const frase = document.getElementById('end-frase')?.value.trim();
      const tipoResidencia = document.getElementById('end-tipo-residencia')?.value;
      const tipoLogradouro = document.getElementById('end-tipo-logradouro')?.value;
      const logradouro = document.getElementById('end-logradouro')?.value.trim();
      const numero = document.getElementById('end-numero')?.value.trim();
      const bairro = document.getElementById('end-bairro')?.value.trim();
      const cep = document.getElementById('end-cep')?.value.trim();
      const cidade = document.getElementById('end-cidade')?.value.trim();
      const estado = document.getElementById('end-estado')?.value.trim().toUpperCase();
      const pais = document.getElementById('end-pais')?.value.trim() || 'Brasil';
      const observacoes = document.getElementById('end-observacoes')?.value.trim() || '';
      const salvarNoPerfil = document.getElementById('end-salvar-perfil')?.checked ?? true;

      return {
        tipo: 'NOVO',
        dados: {
          frase_identificadora: frase,
          tipo_residencia: tipoResidencia,
          tipo_logradouro: tipoLogradouro,
          logradouro,
          numero,
          bairro,
          cep,
          cidade,
          estado,
          pais,
          observacoes
        },
        salvarNoPerfil
      };
    } else {
      const endId = radioChecked.value;
      const end = enderecosCliente.find(e => e.id === endId);
      return {
        tipo: 'SALVO',
        id: endId,
        dados: end
      };
    }
  }

  async function recalcularFrete() {
    const end = obterEnderecoSelecionado();
    const itens = window.Carrinho ? window.Carrinho.obterItens() : [];

    if (!end || itens.length === 0) {
      valorFreteCentavos = 0;
      definirTextoFrete(0, 'Selecione ou preencha o endereço para calcular o frete.');
      return;
    }

    const estado = end.tipo === 'NOVO' ? end.dados.estado : end.dados?.estado;
    const cep = end.tipo === 'NOVO' ? end.dados.cep : end.dados?.cep;

    try {
      const res = await fetch('/api/checkout/frete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itens, estado, cep })
      });
      const data = await res.json();
      if (res.ok) {
        valorFreteCentavos = data.valorCentavos;
        definirTextoFrete(data.valorCentavos, data.criterio);
      }
    } catch (err) {
      console.warn('Cálculo de frete em fallback:', err);
      valorFreteCentavos = 1000;
      definirTextoFrete(1000, 'Tarifa base Sudeste R$ 10,00');
    }
  }

  function definirTextoFrete(centavos, criterio) {
    const elValor = document.getElementById('valor-frete');
    const elCrit = document.getElementById('criterio-frete');
    const elResumo = document.getElementById('resumo-frete');

    const formatado = (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    if (elValor) elValor.textContent = formatado;
    if (elCrit) elCrit.textContent = criterio;
    if (elResumo) elResumo.textContent = formatado;
  }

  // ==========================================================================
  // 3. CUPONS DE DESCONTO E TROCA (RN0033, RN0035, RN0036)
  // ==========================================================================
  function mostrarFeedbackCupom(msg, tipo = 'erro') {
    const el = document.getElementById('feedback-cupom');
    if (el) {
      el.style.display = 'block';
      el.style.color = tipo === 'erro' ? '#dc2626' : '#059669';
      el.textContent = msg;
    } else if (typeof window.mostrarModalAviso === 'function') {
      window.mostrarModalAviso(msg, 'Cupons');
    }
  }

  function renderizarCupons() {
    const container = document.getElementById('container-cupons-disponiveis');
    if (!container) return;

    container.innerHTML = '';
    if (cuponsDisponiveis.length === 0) {
      container.innerHTML = '<span style="color: #64748b; font-size: 0.85rem;">Nenhum cupom disponível na sua conta.</span>';
      return;
    }

    cuponsDisponiveis.forEach(cupom => {
      const label = document.createElement('label');
      label.style.display = 'flex';
      label.style.alignItems = 'center';
      label.style.gap = '8px';
      label.style.marginBottom = '8px';
      label.style.cursor = 'pointer';

      const isPromo = cupom.tipo === 'PROMOCIONAL';
      const valorFormatado = Number(cupom.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      label.innerHTML = `
        <input type="checkbox" class="chk-cupom" value="${cupom.codigo}" data-tipo="${cupom.tipo}" data-valor="${cupom.valor}">
        <span class="badge-cupom ${isPromo ? 'badge-promo' : 'badge-troca'}">${cupom.tipo}</span>
        <strong style="color: #1e293b; font-size: 0.9rem;">${cupom.codigo}</strong>
        <span style="color: #475569; font-size: 0.85rem;">(${valorFormatado})</span>
      `;

      container.appendChild(label);
    });

    conectarCheckboxesCupons();
  }

  function conectarCheckboxesCupons() {
    const checks = document.querySelectorAll('.chk-cupom');
    checks.forEach(chk => {
      chk.addEventListener('change', () => {
        atualizarListaCuponsSelecionados();
        atualizarResumo();
      });
    });
  }

  function configurarEventosCupons() {
    const btn = document.getElementById('btn-aplicar-cupom');
    const input = document.getElementById('input-codigo-cupom');

    if (btn && input) {
      btn.addEventListener('click', async () => {
        const codigo = input.value.trim().toUpperCase();
        if (!codigo) return;

        // Se já está na lista, marca
        const chkExistente = document.querySelector(`.chk-cupom[value="${codigo}"]`);
        if (chkExistente) {
          chkExistente.checked = true;
          input.value = '';
          atualizarListaCuponsSelecionados();
          atualizarResumo();
          return;
        }

        // Tenta buscar da API de cupons
        try {
          const res = await fetch(`/api/cupons?codigo=${encodeURIComponent(codigo)}`);
          if (res.ok) {
            const list = await res.json();
            const cupom = Array.isArray(list) ? list.find(c => c.codigo.toUpperCase() === codigo) : list;
            if (cupom) {
              cuponsDisponiveis.push({
                codigo: cupom.codigo,
                tipo: cupom.tipo,
                valor: Number(cupom.valor)
              });
              renderizarCupons();
              const novoChk = document.querySelector(`.chk-cupom[value="${cupom.codigo}"]`);
              if (novoChk) novoChk.checked = true;
              input.value = '';
              atualizarListaCuponsSelecionados();
              atualizarResumo();
              return;
            }
          }
          mostrarFeedbackCupom(`Cupom "${codigo}" não encontrado ou inativo.`, 'erro');
        } catch (e) {
          mostrarFeedbackCupom('Erro ao consultar cupom.', 'erro');
        }
      });
    }
  }

  function atualizarListaCuponsSelecionados() {
    const checks = document.querySelectorAll('.chk-cupom:checked');
    cuponsSelecionados = Array.from(checks).map(chk => {
      const codigo = chk.value;
      const tipo = chk.dataset.tipo;
      const valor = parseFloat(chk.dataset.valor);
      return {
        codigo,
        tipo,
        valor,
        valorCentavos: Math.round(valor * 100)
      };
    });

    const listaEl = document.getElementById('lista-cupons-aplicados');
    if (listaEl) {
      if (cuponsSelecionados.length === 0) {
        listaEl.innerHTML = '';
      } else {
        listaEl.innerHTML = '<strong>Cupons aplicados:</strong> ' +
          cuponsSelecionados.map(c => `${c.codigo} (${c.tipo})`).join(', ');
      }
    }
  }

  // ==========================================================================
  // 4. FORMAS DE PAGAMENTO - CARTÕES DE CRÉDITO (RN0024, RN0025, RN0034, RN0035)
  // ==========================================================================
  function renderizarSelectsCartoes() {
    const sel1 = document.getElementById('select-cartao-1');
    const sel2 = document.getElementById('select-cartao-2');

    if (!sel1 || !sel2) return;

    const val1 = sel1.value;
    const val2 = sel2.value;

    sel1.innerHTML = '';
    sel2.innerHTML = '<option value="">Nenhum (pagar tudo no Cartão 1)</option>';

    if (cartoesCliente.length === 0) {
      sel1.innerHTML = '<option value="__NOVO__">+ Cadastrar Novo Cartão...</option>';
    } else {
      cartoesCliente.forEach(c => {
        const bandeira = c.bandeira || 'CARTÃO';
        const numMascarado = c.numeroMascarado || `final ${String(c.numero).slice(-4)}`;
        const pref = c.preferencial ? ' (Preferencial)' : '';

        const opt1 = document.createElement('option');
        opt1.value = c.id;
        opt1.textContent = `${bandeira} ${numMascarado}${pref}`;
        sel1.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = c.id;
        opt2.textContent = `${bandeira} ${numMascarado}`;
        sel2.appendChild(opt2);
      });

      const optNovo1 = document.createElement('option');
      optNovo1.value = '__NOVO__';
      optNovo1.textContent = '+ Adicionar novo cartão...';
      sel1.appendChild(optNovo1);

      const optNovo2 = document.createElement('option');
      optNovo2.value = '__NOVO__';
      optNovo2.textContent = '+ Adicionar novo cartão...';
      sel2.appendChild(optNovo2);
    }

    if (val1 && sel1.querySelector(`option[value="${val1}"]`)) sel1.value = val1;
    if (val2 && sel2.querySelector(`option[value="${val2}"]`)) sel2.value = val2;
  }

  function configurarEventosCartao() {
    const sel1 = document.getElementById('select-cartao-1');
    const sel2 = document.getElementById('select-cartao-2');
    const val1 = document.getElementById('input-valor-cartao1');
    const val2 = document.getElementById('input-valor-cartao2');

    if (sel1) {
      sel1.addEventListener('change', (e) => {
        if (e.target.value === '__NOVO__') {
          alvoSelectNovoCartao = 'select-cartao-1';
          abrirModalCartao();
        }
        atualizarResumo();
      });
    }

    if (sel2) {
      sel2.addEventListener('change', (e) => {
        if (e.target.value === '__NOVO__') {
          alvoSelectNovoCartao = 'select-cartao-2';
          abrirModalCartao();
        }
        atualizarResumo();
      });
    }

    if (val1) {
      val1.addEventListener('input', () => atualizarResumo());
      val1.addEventListener('change', () => atualizarResumo());
      val1.addEventListener('blur', () => atualizarResumo());
      val1.addEventListener('keyup', (e) => { if (e.key === 'Enter') atualizarResumo(); });
    }
    if (val2) {
      val2.addEventListener('input', () => atualizarResumo());
      val2.addEventListener('change', () => atualizarResumo());
      val2.addEventListener('blur', () => atualizarResumo());
      val2.addEventListener('keyup', (e) => { if (e.key === 'Enter') atualizarResumo(); });
    }
  }

  function configurarEventosModalCartao() {
    const modal = document.getElementById('modal-novo-cartao-checkout');
    const btnAbrir = document.getElementById('btn-abrir-modal-cartao');
    const btnFechar = document.getElementById('btn-fechar-modal-cartao');
    const btnCancelar = document.getElementById('btn-cancelar-novo-cartao');
    const form = document.getElementById('form-novo-cartao-checkout');

    if (btnAbrir) {
      btnAbrir.addEventListener('click', () => {
        alvoSelectNovoCartao = 'select-cartao-1';
        abrirModalCartao();
      });
    }

    if (btnFechar) btnFechar.addEventListener('click', fecharModalCartao);
    if (btnCancelar) btnCancelar.addEventListener('click', fecharModalCartao);

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        submeterNovoCartao();
      });
    }
  }

  function abrirModalCartao() {
    const modal = document.getElementById('modal-novo-cartao-checkout');
    const erroEl = document.getElementById('erro-novo-cartao');
    if (erroEl) erroEl.style.display = 'none';
    if (modal) modal.style.display = 'flex';
  }

  function fecharModalCartao() {
    const modal = document.getElementById('modal-novo-cartao-checkout');
    if (modal) modal.style.display = 'none';

    // Se o select estava em __NOVO__, restaura para o primeiro cartão se disponível
    const sel = document.getElementById(alvoSelectNovoCartao);
    if (sel && sel.value === '__NOVO__') {
      sel.value = cartoesCliente[0]?.id || '';
    }
  }

  function submeterNovoCartao() {
    const numero = document.getElementById('novo-cartao-numero')?.value.replace(/\s+/g, '');
    const nome = document.getElementById('novo-cartao-nome')?.value.trim();
    const bandeira = document.getElementById('novo-cartao-bandeira')?.value;
    const validade = document.getElementById('novo-cartao-validade')?.value.trim();
    const cvv = document.getElementById('novo-cartao-cvv')?.value.trim();
    const preferencial = document.getElementById('novo-cartao-preferencial')?.checked ?? false;
    const salvarNoPerfil = document.getElementById('novo-cartao-salvar-perfil')?.checked ?? true;

    const erroEl = document.getElementById('erro-novo-cartao');

    // Validação RN0024 e RN0025
    if (!numero || !/^\d{13,19}$/.test(numero)) {
      if (erroEl) {
        erroEl.textContent = 'Número do cartão inválido (deve conter entre 13 e 19 dígitos).';
        erroEl.style.display = 'block';
      }
      return;
    }
    if (!nome) {
      if (erroEl) {
        erroEl.textContent = 'Nome impresso é obrigatório.';
        erroEl.style.display = 'block';
      }
      return;
    }
    if (!cvv || !/^\d{3,4}$/.test(cvv)) {
      if (erroEl) {
        erroEl.textContent = 'CVV inválido (3 ou 4 dígitos).';
        erroEl.style.display = 'block';
      }
      return;
    }

    const final4 = numero.slice(-4);
    const novoCard = {
      id: `novo-card-${Date.now()}`,
      numero,
      numeroMascarado: `•••• •••• •••• ${final4}`,
      nomeImpresso: nome,
      bandeira,
      cvv,
      validade,
      preferencial,
      salvarNoPerfil,
      isNovo: true
    };

    cartoesCliente.push(novoCard);
    renderizarSelectsCartoes();

    const selAlvo = document.getElementById(alvoSelectNovoCartao);
    if (selAlvo) selAlvo.value = novoCard.id;

    // Feedback visual
    const badge = document.getElementById('badge-cartao-feedback');
    if (badge) {
      badge.textContent = `✓ Cartão ${bandeira} final ${final4} adicionado com sucesso!`;
      badge.style.display = 'block';
    }

    fecharModalCartao();
    atualizarResumo();
  }

  // ==========================================================================
  // 5. RESUMO FINANCEIRO E VALIDAÇÃO DAS REGRAS (RN0033 a RN0036)
  // ==========================================================================
  function parseMoedaCentavos(texto) {
    if (!texto) return 0;
    let str = String(texto).trim();
    if (str.includes(',')) {
      str = str.replace(/\./g, '').replace(',', '.');
    }
    const valor = parseFloat(str.replace(/[^\d.-]/g, ''));
    return isNaN(valor) ? 0 : Math.round(valor * 100);
  }

  function formatarCentavos(centavos) {
    return ((centavos || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function atualizarResumo() {
    const itens = window.Carrinho ? window.Carrinho.obterItens() : [];
    const subtotalCentavos = window.Carrinho ? window.Carrinho.subtotalCentavos() : 0;
    const totalCompraCentavos = subtotalCentavos + valorFreteCentavos;

    const elSubtotal = document.getElementById('resumo-subtotal');
    const elFrete = document.getElementById('resumo-frete');
    const elCupons = document.getElementById('resumo-cupons');
    const elCartoes = document.getElementById('resumo-cartoes');
    const elTotal = document.getElementById('resumo-total');
    const elTroco = document.getElementById('resumo-troco');
    const linhaTroco = document.getElementById('linha-troco');

    if (elSubtotal) elSubtotal.textContent = formatarCentavos(subtotalCentavos);
    if (elFrete) elFrete.textContent = formatarCentavos(valorFreteCentavos);
    if (elTotal) elTotal.textContent = formatarCentavos(totalCompraCentavos);

    const totalCuponsCentavos = cuponsSelecionados.reduce((acc, c) => acc + c.valorCentavos, 0);
    if (elCupons) elCupons.textContent = `- ${formatarCentavos(totalCuponsCentavos)}`;

    // Distribuição automática no Cartão 1 se valor não preenchido ou cartão único
    const sel1 = document.getElementById('select-cartao-1');
    const sel2 = document.getElementById('select-cartao-2');
    const inputVal1 = document.getElementById('input-valor-cartao1');
    const inputVal2 = document.getElementById('input-valor-cartao2');

    const temCartao2 = sel2 && sel2.value && sel2.value !== '';
    let val1Centavos = parseMoedaCentavos(inputVal1?.value);
    let val2Centavos = temCartao2 ? parseMoedaCentavos(inputVal2?.value) : 0;

    // Se só tem Cartão 1 ou se valores estão zerados, auto-preenche a diferença no Cartão 1
    const saldoRestante = Math.max(0, totalCompraCentavos - totalCuponsCentavos);
    if (!temCartao2 && saldoRestante >= 0) {
      val1Centavos = saldoRestante;
      if (inputVal1) inputVal1.value = formatarCentavos(val1Centavos);
    }

    const totalCartoesCentavos = (sel1 && sel1.value ? val1Centavos : 0) + (temCartao2 ? val2Centavos : 0);
    if (elCartoes) elCartoes.textContent = formatarCentavos(totalCartoesCentavos);

    // RN0036: Troco em cupom se cupons superarem a compra
    const trocoCentavos = Math.max(0, totalCuponsCentavos - totalCompraCentavos);
    if (trocoCentavos > 0) {
      if (linhaTroco) linhaTroco.style.display = 'block';
      if (elTroco) elTroco.textContent = formatarCentavos(trocoCentavos);
    } else {
      if (linhaTroco) linhaTroco.style.display = 'none';
    }

    validarRegrasEAtivarBotao(totalCompraCentavos, totalCuponsCentavos, val1Centavos, val2Centavos, temCartao2);
  }

  function validarRegrasEAtivarBotao(totalCompraCentavos, totalCuponsCentavos, val1Centavos, val2Centavos, temCartao2) {
    const erros = [];
    const itens = window.Carrinho ? window.Carrinho.obterItens() : [];

    if (itens.length === 0) {
      erros.push('Seu carrinho está vazio.');
    }

    // Endereço
    const end = obterEnderecoSelecionado();
    if (!end) {
      erros.push('Selecione ou cadastre um endereço de entrega (RF0035).');
    } else if (end.tipo === 'NOVO') {
      const d = end.dados;
      if (!d.frase_identificadora) erros.push('Novo Endereço: Frase identificadora é obrigatória.');
      if (!d.logradouro) erros.push('Novo Endereço: Logradouro é obrigatório.');
      if (!d.numero) erros.push('Novo Endereço: Número é obrigatório.');
      if (!d.bairro) erros.push('Novo Endereço: Bairro é obrigatório.');
      if (!d.cep || d.cep.replace(/\D/g, '').length !== 8) erros.push('Novo Endereço: CEP deve conter 8 dígitos.');
      if (!d.cidade) erros.push('Novo Endereço: Cidade é obrigatória.');
      if (!d.estado || d.estado.length !== 2) erros.push('Novo Endereço: Estado (UF) deve ter 2 letras.');
    }

    // RN0033: Apenas um cupom promocional por compra
    const promoCupons = cuponsSelecionados.filter(c => c.tipo === 'PROMOCIONAL');
    if (promoCupons.length > 1) {
      erros.push('Regra RN0033: É permitido apenas 1 cupom promocional por compra.');
    }

    // RN0036: Não permitir uso de cupons desnecessários
    // Se o valor de um cupom individual já cobre a compra, não adicionar outro
    if (cuponsSelecionados.length > 1 && totalCuponsCentavos > totalCompraCentavos) {
      for (const cupom of cuponsSelecionados) {
        if ((totalCuponsCentavos - cupom.valorCentavos) >= totalCompraCentavos) {
          erros.push(`Regra RN0036: O cupom ${cupom.codigo} é desnecessário para cobrir esta compra.`);
          break;
        }
      }
    }

    // Cartões
    const sel1 = document.getElementById('select-cartao-1');
    const sel2 = document.getElementById('select-cartao-2');
    const temCupons = cuponsSelecionados.length > 0;
    const coberturaTotal = totalCuponsCentavos + (sel1?.value ? val1Centavos : 0) + (temCartao2 ? val2Centavos : 0);

    // Se os cupons não cobrem a compra toda, cartão é obrigatório
    if (totalCuponsCentavos < totalCompraCentavos) {
      if (!sel1 || !sel1.value) {
        erros.push('Selecione ou cadastre ao menos um cartão de crédito para pagar o restante.');
      }

      if (temCartao2) {
        // RN0034: mais de um cartão exige R$ 10,00 por cartão
        if (val1Centavos < 1000) {
          erros.push('Regra RN0034: Pagamento com mais de um cartão exige valor mínimo de R$ 10,00 no Cartão 1.');
        }
        if (val2Centavos < 1000) {
          erros.push('Regra RN0034: Pagamento com mais de um cartão exige valor mínimo de R$ 10,00 no Cartão 2.');
        }
      } else {
        // Apenas 1 cartão
        // RN0035: Se tem cupons, é permitido < R$ 10,00 no cartão. Se NÃO tem cupons, o mínimo é R$ 10,00
        if (!temCupons && val1Centavos < 1000 && totalCompraCentavos >= 1000) {
          erros.push('Valor mínimo por cartão é de R$ 10,00.');
        }
      }

      if (coberturaTotal < totalCompraCentavos) {
        const falta = ((totalCompraCentavos - coberturaTotal) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        erros.push(`Valor insuficiente para cobrir o total da compra. Faltam ${falta}.`);
      }
    }

    // Exibição de erros
    const containerErros = document.getElementById('container-erros-pagamento');
    const listaErros = document.getElementById('erros-pagamento');
    const btnFinalizar = document.getElementById('btn-finalizar-compra');

    if (erros.length > 0) {
      if (containerErros) containerErros.style.display = 'block';
      if (listaErros) {
        listaErros.innerHTML = erros.map(e => `<li>${e}</li>`).join('');
      }
      if (btnFinalizar) {
        btnFinalizar.disabled = true;
        btnFinalizar.style.opacity = '0.6';
        btnFinalizar.style.cursor = 'not-allowed';
      }
    } else {
      if (containerErros) containerErros.style.display = 'none';
      if (btnFinalizar) {
        btnFinalizar.disabled = false;
        btnFinalizar.style.opacity = '1';
        btnFinalizar.style.cursor = 'pointer';
      }
    }
  }

  // ==========================================================================
  // 6. FINALIZAÇÃO DA COMPRA (RF0038 / RNF0012)
  // ==========================================================================
  function configurarFinalizacao() {
    const btn = document.getElementById('btn-finalizar-compra');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = 'Processando pedido...';

      try {
        const payload = montarPayloadPedido();
        const res = await fetch('/api/pedidos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const resultado = await res.json();
        if (!res.ok) {
          const msg = resultado.erro || resultado.mensagem || (Array.isArray(resultado.detalhes) ? resultado.detalhes.join('; ') : 'Falha ao finalizar pedido.');
          throw new Error(msg);
        }

        // Sucesso na finalização
        if (window.Carrinho) window.Carrinho.limpar();
        exibirConfirmacao(resultado);
      } catch (err) {
        console.error('Erro na finalização:', err);
        const containerErros = document.getElementById('container-erros-pagamento');
        const listaErros = document.getElementById('erros-pagamento');
        if (containerErros) containerErros.style.display = 'block';
        if (listaErros) listaErros.innerHTML = `<li>${err.message}</li>`;
        btn.disabled = false;
        btn.textContent = 'Finalizar Compra (RF0038)';
      }
    });
  }

  function montarPayloadPedido() {
    const end = obterEnderecoSelecionado();
    const itens = window.Carrinho ? window.Carrinho.obterItens() : [];

    const sel1 = document.getElementById('select-cartao-1');
    const sel2 = document.getElementById('select-cartao-2');
    let val1 = parseMoedaCentavos(document.getElementById('input-valor-cartao1')?.value);
    let val2 = parseMoedaCentavos(document.getElementById('input-valor-cartao2')?.value);

    const pagamentos = [];

    // Cupons
    cuponsSelecionados.forEach(c => {
      pagamentos.push({
        tipo: 'CUPOM',
        cupomCodigo: c.codigo,
        valorCentavos: c.valorCentavos,
        valor: c.valor
      });
    });

    const subtotalCentavos = window.Carrinho ? window.Carrinho.subtotalCentavos() : 0;
    const totalCompraCentavos = subtotalCentavos + valorFreteCentavos;
    const totalCuponsCentavos = cuponsSelecionados.reduce((acc, c) => acc + c.valorCentavos, 0);

    if (sel1 && sel1.value && val1 <= 0 && (!sel2 || !sel2.value || val2 <= 0)) {
      val1 = Math.max(0, totalCompraCentavos - totalCuponsCentavos);
    }

    // Cartão 1
    if (sel1 && sel1.value && val1 > 0) {
      const cardObj = cartoesCliente.find(c => c.id === sel1.value);
      if (cardObj && cardObj.isNovo) {
        pagamentos.push({
          tipo: 'CARTAO',
          novoCartao: {
            numero: cardObj.numero,
            nome_impresso: cardObj.nomeImpresso,
            bandeira: cardObj.bandeira,
            cvv: cardObj.cvv,
            preferencial: cardObj.preferencial
          },
          salvarNovoCartaoNoPerfil: cardObj.salvarNoPerfil,
          valorCentavos: val1,
          valor: val1 / 100
        });
      } else {
        pagamentos.push({
          tipo: 'CARTAO',
          cartaoId: sel1.value,
          valorCentavos: val1,
          valor: val1 / 100
        });
      }
    }

    // Cartão 2
    if (sel2 && sel2.value && val2 > 0) {
      const cardObj2 = cartoesCliente.find(c => c.id === sel2.value);
      if (cardObj2 && cardObj2.isNovo) {
        pagamentos.push({
          tipo: 'CARTAO',
          novoCartao: {
            numero: cardObj2.numero,
            nome_impresso: cardObj2.nomeImpresso,
            bandeira: cardObj2.bandeira,
            cvv: cardObj2.cvv,
            preferencial: cardObj2.preferencial
          },
          salvarNovoCartaoNoPerfil: cardObj2.salvarNoPerfil,
          valorCentavos: val2,
          valor: val2 / 100
        });
      } else {
        pagamentos.push({
          tipo: 'CARTAO',
          cartaoId: sel2.value,
          valorCentavos: val2,
          valor: val2 / 100
        });
      }
    }

    return {
      clienteId: clienteAtual.id || clienteAtual.uuid,
      clienteCodigo: clienteAtual.codigo,
      usuario: clienteAtual.nome,
      itens: itens.map(it => ({
        livroId: it.livroId,
        quantidade: it.quantidade,
        precoUnitario: it.preco
      })),
      enderecoEntregaId: end.tipo === 'SALVO' ? end.id : null,
      novoEndereco: end.tipo === 'NOVO' ? end.dados : null,
      salvarNovoEnderecoNoPerfil: end.tipo === 'NOVO' ? end.salvarNoPerfil : false,
      pagamentos
    };
  }

  function exibirConfirmacao(resultado) {
    const containerForm = document.getElementById('checkout-form-container');
    const containerConfirmacao = document.getElementById('confirmacao-pedido');
    const elNumero = document.getElementById('pedido-numero');
    const elStatus = document.getElementById('pedido-status');
    const containerTroca = document.getElementById('container-cupom-troca');
    const elCupomTroca = document.getElementById('cupom-troca-gerado');
    const elValorTroca = document.getElementById('cupom-troca-valor');

    if (containerForm) containerForm.style.display = 'none';
    if (containerConfirmacao) containerConfirmacao.style.display = 'block';

    if (elNumero) elNumero.textContent = resultado.pedido?.id || 'PED-2026';
    if (elStatus) elStatus.textContent = resultado.pedido?.status || 'EM PROCESSAMENTO';

    const trocaObj = resultado.cupomTrocaGerado || resultado.cupomTroca;
    if (trocaObj) {
      if (containerTroca) containerTroca.style.display = 'block';
      if (elCupomTroca) elCupomTroca.textContent = trocaObj.codigo;
      const vCent = trocaObj.valorCentavos ?? Math.round(Number(trocaObj.valor || 0) * 100);
      if (elValorTroca) elValorTroca.textContent = `(${formatarCentavos(vCent)})`;
    } else {
      if (containerTroca) containerTroca.style.display = 'none';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
})();
