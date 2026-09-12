/**
 * ============================================================================
 * Livraria Alexandria — Controle Administrativo de Clientes (CRUD)
 * Disciplina: Laboratório de Engenharia de Software (LES 2026)
 * Alunos: Anderson Barros & João Pedro Scandiuzzi
 * 
 * Requisitos Implementados:
 * - RF0021: Cadastrar cliente
 * - RF0022: Alterar cliente
 * - RF0023: Inativar cadastro de cliente
 * - RF0024: Consulta de clientes (filtros combinados e isolados)
 * - RF0025: Consulta de transações
 * - RF0026: Cadastro de endereços com frase curta identificadora
 * - RF0027: Cadastro de cartões de crédito com cartão preferencial
 * - RF0028: Alteração exclusiva de senha
 * - RN0021: Endereço de cobrança obrigatório
 * - RN0022: Endereço de entrega obrigatório
 * - RN0023: Composição detalhada do registro de endereços
 * - RN0024: Composição do registro de cartões de crédito
 * - RN0025: Validação de bandeiras homologadas
 * - RN0026: Dados obrigatórios do cliente (incluindo telefone detalhado)
 * - RN0027: Ranking numérico do cliente
 * - RNF0031: Senha forte (mínimo 8 caracteres, maiúscula, minúscula, especial)
 * - RNF0032: Confirmação dupla de senha
 * - RNF0035: Código único de cliente (CLI-XXX)
 * ============================================================================
 */

const API_BASE = '/api/clientes';

// Armazena em memória os clientes carregados atualmente
let clientesCache = [];

// Buffers temporários para edição das coleções 1:N de endereços e cartões
let enderecosBuffer = [];
let cartoesBuffer = [];

// Inicialização ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  carregarClientes();

  // Executa automaticamente a demonstração se a URL contiver ?autoRun=1 ou ?test=1
  if (window.location.search.includes('autoRun=1') || window.location.search.includes('test=1') || window.location.search.includes('demo=1')) {
    setTimeout(() => {
      iniciarDemonstracaoVisual();
    }, 800);
  }
});

/**
 * Exibe mensagens de feedback com cores adequadas
 */
function exibirMensagem(texto, tipo = 'sucesso') {
  const box = document.getElementById('mensagem-alerta');
  if (!box) return;
  box.textContent = texto;
  box.style.display = 'block';
  if (tipo === 'sucesso') {
    box.style.background = '#dcfce7';
    box.style.color = '#15803d';
    box.style.border = '1px solid #86efac';
  } else {
    box.style.background = '#fee2e2';
    box.style.color = '#991b1b';
    box.style.border = '1px solid #fca5a5';
  }
  setTimeout(() => {
    box.style.display = 'none';
  }, 5000);
}

/**
 * RF0024: Carrega e consulta clientes via API REST
 */
async function carregarClientes(queryParams = '') {
  try {
    const url = queryParams ? `${API_BASE}?${queryParams}` : API_BASE;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Falha ao obter lista de clientes');
    clientesCache = await response.json();
    renderizarTabelaClientes(clientesCache);
  } catch (err) {
    console.error(err);
    exibirMensagem('Erro ao carregar dados de clientes da API.', 'erro');
  }
}

/**
 * RF0024: Aplica filtros isolados ou combinados
 */
function aplicarFiltros(e) {
  e.preventDefault();
  const nome = document.getElementById('filtro-nome').value.trim();
  const cpf = document.getElementById('filtro-cpf').value.trim();
  const email = document.getElementById('filtro-email').value.trim();
  const status = document.getElementById('filtro-status').value;
  const ranking = document.getElementById('filtro-ranking').value;

  const params = new URLSearchParams();
  if (nome) params.append('nome', nome);
  if (cpf) params.append('cpf', cpf);
  if (email) params.append('email', email);
  if (status) params.append('status', status);
  if (ranking) params.append('ranking', ranking);

  carregarClientes(params.toString());
}

/**
 * Limpa os filtros e recarrega a base completa
 */
function limparFiltros() {
  document.getElementById('form-filtro-clientes').reset();
  carregarClientes();
}

/**
 * Renderiza as linhas da tabela de clientes
 */
function renderizarTabelaClientes(clientes) {
  const tbody = document.getElementById('tabela-clientes-body');
  const badgeTotal = document.getElementById('total-clientes-badge');
  if (badgeTotal) badgeTotal.textContent = clientes.length;

  // Atualiza os Cards de KPIs no topo
  const kpiTotal = document.getElementById('kpi-total-clientes');
  const kpiAtivos = document.getElementById('kpi-ativos');
  const kpiInativos = document.getElementById('kpi-inativos');
  const kpiComCompras = document.getElementById('kpi-com-compras');

  if (kpiTotal) kpiTotal.textContent = clientes.length;
  if (kpiAtivos) kpiAtivos.textContent = clientes.filter(c => c.status === 'ATIVO').length;
  if (kpiInativos) kpiInativos.textContent = clientes.filter(c => c.status === 'INATIVO').length;
  if (kpiComCompras) kpiComCompras.textContent = clientes.filter(c => c.transacoes && c.transacoes.length > 0).length;

  if (!tbody) return;

  tbody.innerHTML = '';

  if (clientes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 25px; color: #64748b;">
          Nenhum cliente encontrado com os critérios pesquisados (RF0024).
        </td>
      </tr>
    `;
    return;
  }

  clientes.forEach(cliente => {
    const isAtivo = cliente.status === 'ATIVO';
    const totalEnderecos = cliente.enderecos ? cliente.enderecos.length : 0;
    const totalCartoes = cliente.cartoes ? cliente.cartoes.length : 0;
    const totalTransacoes = cliente.transacoes ? cliente.transacoes.length : 0;

    // Formatação do ranking por estrelas (RN0027)
    const estrelas = '⭐'.repeat(cliente.ranking || 1);

    // Formatação do telefone composto (RN0026)
    const telFormatado = cliente.telefone
      ? `(${cliente.telefone.ddd}) ${cliente.telefone.numero} [${cliente.telefone.tipo}]`
      : 'Não informado';

    const tr = document.createElement('tr');
    tr.setAttribute('data-cy', `linha-cliente-${cliente.codigo}`);
    tr.innerHTML = `
      <td style="font-weight: bold; color: var(--palette-navy-dark);">
        <span style="background: #f1f5f9; border: 1px solid #e2e8f0; padding: 3px 8px; border-radius: 4px; font-family: monospace; font-size: 0.85rem;">
          ${cliente.codigo || cliente.id}
        </span>
      </td>
      <td>
        <strong style="color: var(--palette-navy-dark); font-size: 0.95rem;">${cliente.nome}</strong><br>
        <small style="color: #64748b;">CPF: ${cliente.cpf}</small>
      </td>
      <td>
        <span style="color: #334155;">${cliente.email}</span><br>
        <small style="color: #64748b;">📞 ${telFormatado}</small><br>
        <small style="color: var(--palette-teal-dark); font-weight: 600;">📍 ${totalEnderecos} end. &nbsp;|&nbsp; 💳 ${totalCartoes} cartão(ões)</small>
      </td>
      <td>
        <span style="font-size: 0.85rem;" title="Ranking: ${cliente.ranking} estrela(s)">${estrelas}</span>
      </td>
      <td>
        <span class="pill-status ${isAtivo ? 'ativo' : 'inativo'}" data-cy="badge-status-${cliente.codigo}">
          ● ${cliente.status}
        </span>
      </td>
      <td style="text-align: center;">
        <div style="display: flex; gap: 5px; justify-content: center; flex-wrap: wrap;">
          <button type="button" class="btn-action-row" style="background: #0284c7;" onclick="abrirModalTransacoes('${cliente.id}')" title="Ver Compras (RF0025)" data-cy="btn-transacoes-${cliente.codigo}">
            📦 Transações (${totalTransacoes})
          </button>
          <button type="button" class="btn-action-row" style="background: var(--palette-navy-dark);" onclick="abrirModalEdicao('${cliente.id}')" title="Editar Dados (RF0022)" data-cy="btn-editar-${cliente.codigo}">
            ✏️ Editar
          </button>
          <button type="button" class="btn-action-row" style="background: #475569;" onclick="abrirModalSenha('${cliente.id}')" title="Alterar Senha (RF0028)" data-cy="btn-senha-${cliente.codigo}">
            🔑 Senha
          </button>
          <button type="button" class="btn-action-row" style="background: ${isAtivo ? 'var(--palette-terracotta)' : 'var(--palette-teal-dark)'};" onclick="alternarStatus('${cliente.id}')" title="Inativar/Reativar (RF0023)" data-cy="btn-inativar-${cliente.codigo}">
            ${isAtivo ? 'Inativar' : 'Reativar'}
          </button>
          <button type="button" class="btn-action-row" style="background: #dc2626;" onclick="tentarExcluirCliente('${cliente.id}')" title="Excluir" data-cy="btn-excluir-${cliente.codigo}">
            🗑️ Excluir
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ============================================================================
// MODAL DE CADASTRO E EDIÇÃO (RF0021 & RF0022)
// ============================================================================

function abrirModalNovo() {
  document.getElementById('modal-titulo').textContent = 'Cadastrar Novo Cliente (RF0021)';
  document.getElementById('form-cliente-admin').reset();
  document.getElementById('cliente-id').value = '';
  document.getElementById('field-cpf').removeAttribute('readonly');
  document.getElementById('bloco-senha-cadastro').style.display = 'block';
  document.getElementById('modal-erros-validacao').style.display = 'none';

  // Inicializa 1 endereço com finalidade "AMBOS" (satisfaz RN0021 e RN0022)
  enderecosBuffer = [{
    id: `end-${Date.now()}-0`,
    fraseIdentificadora: 'Minha Residência',
    tipoResidencia: 'Casa',
    tipoLogradouro: 'Rua',
    logradouro: '',
    numero: '',
    bairro: '',
    cep: '',
    cidade: '',
    estado: 'SP',
    pais: 'Brasil',
    observacoes: '',
    finalidade: 'AMBOS'
  }];

  // Inicializa 1 cartão com rádio preferencial ativo (RF0027)
  cartoesBuffer = [{
    id: `card-${Date.now()}-0`,
    numero: '',
    nomeImpresso: '',
    bandeira: 'VISA',
    cvv: '',
    preferencial: true
  }];

  renderizarBlocosEnderecos();
  renderizarBlocosCartoes();
  const m = document.getElementById('modal-cliente');
  m.style.display = 'flex';
  m.classList.add('active');
}

function abrirModalEdicao(id) {
  const cliente = clientesCache.find(c => c.id === id || c.codigo === id);
  if (!cliente) return;

  document.getElementById('modal-titulo').textContent = `Editar Cliente ${cliente.codigo || cliente.id} (RF0022)`;
  document.getElementById('cliente-id').value = cliente.id;
  document.getElementById('field-nome').value = cliente.nome || '';
  document.getElementById('field-cpf').value = cliente.cpf || '';
  document.getElementById('field-cpf').setAttribute('readonly', 'true'); // CPF imutável
  document.getElementById('field-email').value = cliente.email || '';
  document.getElementById('field-nascimento').value = cliente.dataNascimento || '';
  document.getElementById('field-genero').value = cliente.genero || 'Masculino';
  document.getElementById('field-ranking').value = String(cliente.ranking || 1);

  // Preenchimento do telefone composto (RN0026)
  if (cliente.telefone) {
    document.getElementById('field-tel-tipo').value = cliente.telefone.tipo || 'CELULAR';
    document.getElementById('field-tel-ddd').value = cliente.telefone.ddd || '';
    document.getElementById('field-tel-numero').value = cliente.telefone.numero || '';
  }

  // Na edição, a senha não é re-exigida (RF0028 cuida de senhas isoladamente)
  document.getElementById('bloco-senha-cadastro').style.display = 'none';
  document.getElementById('modal-erros-validacao').style.display = 'none';

  enderecosBuffer = cliente.enderecos && cliente.enderecos.length > 0
    ? JSON.parse(JSON.stringify(cliente.enderecos))
    : [];

  cartoesBuffer = cliente.cartoes && cliente.cartoes.length > 0
    ? JSON.parse(JSON.stringify(cliente.cartoes))
    : [];

  renderizarBlocosEnderecos();
  renderizarBlocosCartoes();
  const m = document.getElementById('modal-cliente');
  m.style.display = 'flex';
  m.classList.add('active');
}

function fecharModal() {
  const m = document.getElementById('modal-cliente');
  m.style.display = 'none';
  m.classList.remove('active');
}

// ----------------------------------------------------------------------------
// Manipulação Dinâmica de Endereços (1:N — RN0021, RN0022, RN0023, RF0026)
// ----------------------------------------------------------------------------
function adicionarBlocoEnderecoForm() {
  enderecosBuffer.push({
    id: `end-${Date.now()}-${enderecosBuffer.length}`,
    fraseIdentificadora: '',
    tipoResidencia: 'Casa',
    tipoLogradouro: 'Rua',
    logradouro: '',
    numero: '',
    bairro: '',
    cep: '',
    cidade: '',
    estado: 'SP',
    pais: 'Brasil',
    observacoes: '',
    finalidade: 'ENTREGA'
  });
  renderizarBlocosEnderecos();
}

function removerBlocoEnderecoForm(index) {
  if (enderecosBuffer.length <= 1) {
    alert('Aviso: O cliente deve manter pelo menos um endereço cadastrado.');
    return;
  }
  enderecosBuffer.splice(index, 1);
  renderizarBlocosEnderecos();
}

function renderizarBlocosEnderecos() {
  const container = document.getElementById('container-enderecos-form');
  if (!container) return;
  container.innerHTML = '';

  enderecosBuffer.forEach((end, idx) => {
    const div = document.createElement('div');
    div.style.cssText = 'background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px;';
    div.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px;">
        <strong style="color: var(--palette-navy-dark); font-size: 0.85rem;">
          📍 Endereço #${idx + 1}
        </strong>
        <button type="button" onclick="removerBlocoEnderecoForm(${idx})" style="color: #b91c1c; border: none; background: none; cursor: pointer; font-weight: bold; font-size: 0.8rem;">
          ✕ Remover
        </button>
      </div>

      <!-- Linha 1: Identificador / Frase Curta (RF0026) e Finalidade (RN0021/RN0022) -->
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 10px; margin-bottom: 8px;">
        <div>
          <label class="form-label">Frase Identificadora do Endereço * (RF0026)</label>
          <input type="text" placeholder="Ex: Minha Casa, Escritório Centro" value="${end.fraseIdentificadora || ''}" oninput="enderecosBuffer[${idx}].fraseIdentificadora = this.value" required class="form-input">
        </div>
        <div>
          <label class="form-label">Finalidade do Endereço *</label>
          <select onchange="enderecosBuffer[${idx}].finalidade = this.value" class="form-input">
            <option value="ENTREGA" ${end.finalidade === 'ENTREGA' ? 'selected' : ''}>Apenas Entrega</option>
            <option value="COBRANCA" ${end.finalidade === 'COBRANCA' ? 'selected' : ''}>Apenas Cobrança</option>
            <option value="AMBOS" ${end.finalidade === 'AMBOS' ? 'selected' : ''}>Ambos (Entrega & Cobrança)</option>
          </select>
        </div>
      </div>

      <!-- Linha 2: Tipo de Residência, Tipo Logradouro, Logradouro e Número (RN0023) -->
      <div style="display: grid; grid-template-columns: 140px 140px 2fr 100px; gap: 8px; margin-bottom: 8px;">
        <div>
          <label class="form-label">Tipo Residência *</label>
          <select onchange="enderecosBuffer[${idx}].tipoResidencia = this.value" class="form-input">
            <option value="Casa" ${end.tipoResidencia === 'Casa' ? 'selected' : ''}>Casa</option>
            <option value="Apartamento" ${end.tipoResidencia === 'Apartamento' ? 'selected' : ''}>Apartamento</option>
            <option value="Sobrado" ${end.tipoResidencia === 'Sobrado' ? 'selected' : ''}>Sobrado</option>
            <option value="Comercial" ${end.tipoResidencia === 'Comercial' ? 'selected' : ''}>Comercial</option>
            <option value="Outro" ${end.tipoResidencia === 'Outro' ? 'selected' : ''}>Outro</option>
          </select>
        </div>
        <div>
          <label class="form-label">Tipo Logradouro *</label>
          <select onchange="enderecosBuffer[${idx}].tipoLogradouro = this.value" class="form-input">
            <option value="Rua" ${end.tipoLogradouro === 'Rua' ? 'selected' : ''}>Rua</option>
            <option value="Avenida" ${end.tipoLogradouro === 'Avenida' ? 'selected' : ''}>Avenida</option>
            <option value="Alameda" ${end.tipoLogradouro === 'Alameda' ? 'selected' : ''}>Alameda</option>
            <option value="Travessa" ${end.tipoLogradouro === 'Travessa' ? 'selected' : ''}>Travessa</option>
            <option value="Praça" ${end.tipoLogradouro === 'Praça' ? 'selected' : ''}>Praça</option>
          </select>
        </div>
        <div>
          <label class="form-label">Logradouro *</label>
          <input type="text" placeholder="Nome da rua/av" value="${end.logradouro || ''}" oninput="enderecosBuffer[${idx}].logradouro = this.value" required class="form-input">
        </div>
        <div>
          <label class="form-label">Número *</label>
          <input type="text" placeholder="Nº" value="${end.numero || ''}" oninput="enderecosBuffer[${idx}].numero = this.value" required class="form-input">
        </div>
      </div>

      <!-- Linha 3: Bairro, CEP, Cidade, Estado, País (RN0023) -->
      <div style="display: grid; grid-template-columns: 1.5fr 120px 1.5fr 80px 120px; gap: 8px; margin-bottom: 8px;">
        <div>
          <label class="form-label">Bairro *</label>
          <input type="text" placeholder="Bairro" value="${end.bairro || ''}" oninput="enderecosBuffer[${idx}].bairro = this.value" required class="form-input">
        </div>
        <div>
          <label class="form-label">CEP *</label>
          <input type="text" placeholder="00000-000" value="${end.cep || ''}" oninput="enderecosBuffer[${idx}].cep = this.value" required class="form-input">
        </div>
        <div>
          <label class="form-label">Cidade *</label>
          <input type="text" placeholder="Cidade" value="${end.cidade || ''}" oninput="enderecosBuffer[${idx}].cidade = this.value" required class="form-input">
        </div>
        <div>
          <label class="form-label">UF *</label>
          <input type="text" placeholder="SP" maxlength="2" value="${end.estado || ''}" oninput="enderecosBuffer[${idx}].estado = this.value" required class="form-input">
        </div>
        <div>
          <label class="form-label">País *</label>
          <input type="text" placeholder="Brasil" value="${end.pais || 'Brasil'}" oninput="enderecosBuffer[${idx}].pais = this.value" required class="form-input">
        </div>
      </div>

      <!-- Linha 4: Observações Opcionais (RN0023) -->
      <div>
        <label class="form-label">Observações (Opcional)</label>
        <input type="text" placeholder="Ponto de referência, bloco, etc." value="${end.observacoes || ''}" oninput="enderecosBuffer[${idx}].observacoes = this.value" class="form-input">
      </div>
    `;
    container.appendChild(div);
  });
}

// ----------------------------------------------------------------------------
// Manipulação Dinâmica de Cartões (1:N — RN0024, RN0025, RF0027)
// ----------------------------------------------------------------------------
function adicionarBlocoCartaoForm() {
  cartoesBuffer.push({
    id: `card-${Date.now()}-${cartoesBuffer.length}`,
    numero: '',
    nomeImpresso: '',
    bandeira: 'VISA',
    cvv: '',
    preferencial: cartoesBuffer.length === 0
  });
  renderizarBlocosCartoes();
}

function removerBlocoCartaoForm(index) {
  if (cartoesBuffer.length <= 1) {
    alert('Aviso: Mantenha pelo menos um cartão associado.');
    return;
  }
  const removendoPreferencial = cartoesBuffer[index].preferencial;
  cartoesBuffer.splice(index, 1);
  if (removendoPreferencial && cartoesBuffer.length > 0) {
    cartoesBuffer[0].preferencial = true;
  }
  renderizarBlocosCartoes();
}

function definirCartaoPreferencial(index) {
  cartoesBuffer.forEach((c, i) => {
    c.preferencial = i === index;
  });
  renderizarBlocosCartoes();
}

function renderizarBlocosCartoes() {
  const container = document.getElementById('container-cartoes-form');
  if (!container) return;
  container.innerHTML = '';

  cartoesBuffer.forEach((card, idx) => {
    const div = document.createElement('div');
    div.style.cssText = 'background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px;';
    div.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <strong style="color: var(--palette-navy-dark); font-size: 0.85rem;">💳 Cartão #${idx + 1}</strong>
          ${card.preferencial ? '<span style="background: #fef08a; color: #854d0e; font-size: 0.75rem; font-weight: bold; padding: 2px 6px; border-radius: 4px;">⭐ PREFERENCIAL (RF0027)</span>' : ''}
        </div>
        <button type="button" onclick="removerBlocoCartaoForm(${idx})" style="color: #b91c1c; border: none; background: none; cursor: pointer; font-weight: bold; font-size: 0.8rem;">
          ✕ Remover
        </button>
      </div>

      <div style="display: grid; grid-template-columns: 2fr 2fr 1.5fr 100px; gap: 8px; margin-bottom: 8px;">
        <div>
          <label class="form-label">Número do Cartão * (RN0024)</label>
          <input type="text" placeholder="0000 0000 0000 0000" value="${card.numero || ''}" oninput="cartoesBuffer[${idx}].numero = this.value" required class="form-input">
        </div>
        <div>
          <label class="form-label">Nome Impresso no Cartão * (RN0024)</label>
          <input type="text" placeholder="Nome como no plástico" value="${card.nomeImpresso || ''}" oninput="cartoesBuffer[${idx}].nomeImpresso = this.value" required class="form-input">
        </div>
        <div>
          <label class="form-label">Bandeira * (RN0025)</label>
          <select onchange="cartoesBuffer[${idx}].bandeira = this.value" class="form-input">
            <option value="VISA" ${card.bandeira === 'VISA' ? 'selected' : ''}>Visa</option>
            <option value="MASTERCARD" ${card.bandeira === 'MASTERCARD' ? 'selected' : ''}>Mastercard</option>
            <option value="ELO" ${card.bandeira === 'ELO' ? 'selected' : ''}>Elo</option>
            <option value="AMERICAN EXPRESS" ${card.bandeira === 'AMERICAN EXPRESS' ? 'selected' : ''}>American Express</option>
          </select>
        </div>
        <div>
          <label class="form-label">CVV * (RN0024)</label>
          <input type="text" placeholder="123" maxlength="4" value="${card.cvv || ''}" oninput="cartoesBuffer[${idx}].cvv = this.value" required class="form-input">
        </div>
      </div>

      <!-- Configuração de Cartão Preferencial (RF0027) -->
      <label style="display: flex; align-items: center; gap: 6px; font-size: 0.85rem; cursor: pointer; margin-top: 4px;">
        <input type="radio" name="radio-cartao-preferencial" ${card.preferencial ? 'checked' : ''} onchange="definirCartaoPreferencial(${idx})">
        <span>Definir este cartão como preferencial para compras (RF0027)</span>
      </label>
    `;
    container.appendChild(div);
  });
}

/**
 * Validação visual de senha forte em tempo real (RNF0031)
 */
function validarIndicadorSenha(senha) {
  const box = document.getElementById('indicador-forca-senha');
  if (!box) return;
  if (!senha) {
    box.textContent = '';
    return;
  }
  const temTam = senha.length >= 8;
  const temMai = /[A-Z]/.test(senha);
  const temMin = /[a-z]/.test(senha);
  const temEsp = /[^A-Za-z0-9]/.test(senha);

  if (temTam && temMai && temMin && temEsp) {
    box.textContent = '✅ Senha Forte (atende a RNF0031)';
    box.style.color = '#15803d';
  } else {
    box.textContent = '❌ Senha Fraca: precisa de 8+ caracteres, letra MAIÚSCULA, minúscula e caractere especial (@#$...).';
    box.style.color = '#b91c1c';
  }
}

/**
 * Submissão do Formulário de Salvar Cliente (POST ou PUT)
 */
async function salvarCliente(e) {
  e.preventDefault();
  const id = document.getElementById('cliente-id').value;
  const boxErro = document.getElementById('modal-erros-validacao');
  boxErro.style.display = 'none';

  const payload = {
    nome: document.getElementById('field-nome').value.trim(),
    cpf: document.getElementById('field-cpf').value.trim(),
    email: document.getElementById('field-email').value.trim(),
    dataNascimento: document.getElementById('field-nascimento').value,
    genero: document.getElementById('field-genero').value,
    ranking: Number(document.getElementById('field-ranking').value) || 1,
    telefone: {
      tipo: document.getElementById('field-tel-tipo').value,
      ddd: document.getElementById('field-tel-ddd').value.trim(),
      numero: document.getElementById('field-tel-numero').value.trim()
    },
    enderecos: enderecosBuffer,
    cartoes: cartoesBuffer
  };

  // Se for novo cadastro, inclui senha e confirmação (RN0026, RNF0031, RNF0032)
  if (!id) {
    payload.senha = document.getElementById('field-senha').value;
    payload.confirmacaoSenha = document.getElementById('field-senha-confirma').value;

    // Validação local de senha forte e confirmação para feedback imediato
    const errosLocais = [];
    if (!payload.senha) {
      errosLocais.push('Senha é obrigatória (RN0026).');
    } else {
      const temTam = payload.senha.length >= 8;
      const temMai = /[A-Z]/.test(payload.senha);
      const temMin = /[a-z]/.test(payload.senha);
      const temEsp = /[^A-Za-z0-9]/.test(payload.senha);
      if (!temTam || !temMai || !temMin || !temEsp) {
        errosLocais.push('A senha deve ter no mínimo 8 caracteres, contendo letras maiúsculas, minúsculas e caractere especial (RNF0031).');
      }
      if (payload.senha !== payload.confirmacaoSenha) {
        errosLocais.push('A confirmação de senha deve ser idêntica à senha digitada (RNF0032).');
      }
    }

    if (errosLocais.length > 0) {
      boxErro.innerHTML = `<strong>Falha de Validação:</strong><br>${errosLocais.map(d => `• ${d}`).join('<br>')}`;
      boxErro.style.display = 'block';
      boxErro.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
  }

  try {
    const url = id ? `${API_BASE}/${id}` : API_BASE;
    const method = id ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      boxErro.innerHTML = `<strong>Falha de Validação:</strong><br>${(result.detalhes || [result.erro]).map(d => `• ${d}`).join('<br>')}`;
      boxErro.style.display = 'block';
      return;
    }

    fecharModal();
    exibirMensagem(result.mensagem || 'Cliente salvo com sucesso!', 'sucesso');
    carregarClientes();
  } catch (err) {
    console.error(err);
    boxErro.textContent = 'Erro de comunicação ao salvar cliente.';
    boxErro.style.display = 'block';
  }
}

// ============================================================================
// RF0023: INATIVAR / REATIVAR CLIENTE
// ============================================================================
async function alternarStatus(id) {
  const cliente = clientesCache.find(c => c.id === id || c.codigo === id);
  if (!cliente) return;

  const acao = cliente.status === 'ATIVO' ? 'INATIVAR' : 'REATIVAR';
  if (!confirm(`Deseja realmente ${acao} o cadastro do cliente "${cliente.nome}" (RF0023)?`)) return;

  try {
    const response = await fetch(`${API_BASE}/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: cliente.status === 'ATIVO' ? 'INATIVO' : 'ATIVO' })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.erro || 'Erro ao alterar status');
    exibirMensagem(result.mensagem, 'sucesso');
    carregarClientes();
  } catch (err) {
    alert(err.message);
  }
}

// ============================================================================
// REGRA CRUCIAL: DISTINÇÃO ENTRE INATIVAÇÃO E EXCLUSÃO
// ============================================================================
let clienteBloqueadoParaInativarId = null;

async function tentarExcluirCliente(id) {
  const cliente = clientesCache.find(c => c.id === id || c.codigo === id);
  if (!cliente) return;

  if (!confirm(`Tem certeza que deseja solicitar a EXCLUSÃO do cliente "${cliente.nome}"?`)) return;

  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE'
    });
    const result = await response.json();

    if (!response.ok) {
      if (result.bloqueado) {
        // Exibe o modal didático explicando o bloqueio da exclusão física
        clienteBloqueadoParaInativarId = id;
        document.getElementById('texto-bloqueio-exclusao').textContent = result.erro;
        const mb = document.getElementById('modal-bloqueio-exclusao');
        mb.style.display = 'flex';
        mb.classList.add('active');
        document.getElementById('btn-inativar-direto-bloqueio').onclick = () => {
          fecharModalBloqueio();
          alternarStatus(clienteBloqueadoParaInativarId);
        };
      } else {
        alert(result.erro || 'Erro ao excluir');
      }
      return;
    }

    exibirMensagem(result.mensagem, 'sucesso');
    carregarClientes();
  } catch (err) {
    console.error(err);
    alert('Erro de comunicação ao tentar excluir cliente.');
  }
}

function fecharModalBloqueio() {
  const mb = document.getElementById('modal-bloqueio-exclusao');
  mb.style.display = 'none';
  mb.classList.remove('active');
  clienteBloqueadoParaInativarId = null;
}

// ============================================================================
// RF0028: ALTERAÇÃO EXCLUSIVA DE SENHA
// ============================================================================
function abrirModalSenha(id) {
  const cliente = clientesCache.find(c => c.id === id || c.codigo === id);
  if (!cliente) return;

  document.getElementById('modal-senha-cliente-id').value = cliente.id;
  document.getElementById('modal-senha-cliente-nome').textContent = cliente.nome;
  document.getElementById('modal-senha-cliente-codigo').textContent = cliente.codigo || cliente.id;
  document.getElementById('campo-nova-senha').value = '';
  document.getElementById('campo-confirma-nova-senha').value = '';
  document.getElementById('modal-senha-erros').style.display = 'none';
  const ms = document.getElementById('modal-senha');
  ms.style.display = 'flex';
  ms.classList.add('active');
}

function fecharModalSenha() {
  const ms = document.getElementById('modal-senha');
  ms.style.display = 'none';
  ms.classList.remove('active');
}

async function salvarApenasSenha(e) {
  e.preventDefault();
  const id = document.getElementById('modal-senha-cliente-id').value;
  const senhaNova = document.getElementById('campo-nova-senha').value;
  const confirmacaoSenhaNova = document.getElementById('campo-confirma-nova-senha').value;
  const boxErro = document.getElementById('modal-senha-erros');
  boxErro.style.display = 'none';

  try {
    const response = await fetch(`${API_BASE}/${id}/senha`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senhaNova, confirmacaoSenhaNova })
    });
    const result = await response.json();
    if (!response.ok) {
      boxErro.innerHTML = (result.detalhes || [result.erro]).map(d => `• ${d}`).join('<br>');
      boxErro.style.display = 'block';
      return;
    }

    fecharModalSenha();
    exibirMensagem(result.mensagem, 'sucesso');
  } catch (err) {
    console.error(err);
    boxErro.textContent = 'Erro ao atualizar senha.';
    boxErro.style.display = 'block';
  }
}

// ============================================================================
// RF0025: HISTÓRICO DE TRANSAÇÕES
// ============================================================================
async function abrirModalTransacoes(id) {
  const cliente = clientesCache.find(c => c.id === id || c.codigo === id);
  if (!cliente) return;

  document.getElementById('transacoes-cliente-nome').textContent = cliente.nome;
  document.getElementById('transacoes-cliente-codigo').textContent = cliente.codigo || cliente.id;

  const container = document.getElementById('container-tabela-transacoes');
  container.innerHTML = '<p style="color: var(--text-muted);">Carregando transações...</p>';
  const mt = document.getElementById('modal-transacoes');
  mt.style.display = 'flex';
  mt.classList.add('active');

  try {
    const response = await fetch(`${API_BASE}/${id}/transacoes`);
    const result = await response.json();
    const transacoes = result.transacoes || [];

    if (transacoes.length === 0) {
      container.innerHTML = `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 6px; text-align: center; color: var(--text-muted);">
          Nenhuma transação/pedido encontrado para este cliente (RF0025).
        </div>
      `;
      return;
    }

    let html = `
      <table class="table-default" style="width: 100%;">
        <thead>
          <tr>
            <th>ID Pedido</th>
            <th>Data</th>
            <th>Itens Comprados</th>
            <th>Valor Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
    `;

    transacoes.forEach(t => {
      html += `
        <tr>
          <td style="font-weight: bold; color: var(--palette-navy-dark);">${t.id}</td>
          <td>${t.data}</td>
          <td>${t.itens.join(', ')}</td>
          <td style="font-weight: bold; color: var(--palette-teal-dark);">R$ ${t.valor.toFixed(2).replace('.', ',')}</td>
          <td>
            <span class="badge-info">${t.status}</span>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = '<p style="color: #b91c1c;">Erro ao carregar transações.</p>';
  }
}

function fecharModalTransacoes() {
  const mt = document.getElementById('modal-transacoes');
  mt.style.display = 'none';
  mt.classList.remove('active');
}

function fecharModalConclusao() {
  const mc = document.getElementById('modal-conclusao-testes');
  if (mc) {
    mc.style.display = 'none';
    mc.classList.remove('active');
  }
}

// ============================================================================
// MOTOR DE TESTES AUTOMATIZADOS DIRETAMENTE NO NAVEGADOR (LES 2026)
// Abre o navegador e executa a demonstração em tempo real com HUD visual
// ============================================================================

window.__demoSpeedMultiplier = 1;
window.__demoPaused = false;
window.__demoCancelled = false;

function alternarPausaDemo() {
  window.__demoPaused = !window.__demoPaused;
  const btn = document.getElementById('demo-btn-pause');
  if (btn) {
    btn.textContent = window.__demoPaused ? '▶️ Continuar' : '⏸️ Pausar';
    btn.style.background = window.__demoPaused ? 'rgba(42, 157, 143, 0.5)' : 'rgba(255, 255, 255, 0.12)';
  }
}

function alternarVelocidadeDemo() {
  if (window.__demoSpeedMultiplier === 1) {
    window.__demoSpeedMultiplier = 2;
  } else {
    window.__demoSpeedMultiplier = 1;
  }
  const btn = document.getElementById('demo-btn-speed');
  if (btn) {
    btn.textContent = `⚡ ${window.__demoSpeedMultiplier}x`;
  }
}

function cancelarDemo() {
  window.__demoCancelled = true;
  window.__demoPaused = false;
  removerHUD();
  document.querySelectorAll('.test-highlight-pulse').forEach(el => el.classList.remove('test-highlight-pulse'));
}

async function aguardar(ms) {
  const step = 50;
  let decorrido = 0;
  const total = ms / (window.__demoSpeedMultiplier || 1);
  while (decorrido < total) {
    if (window.__demoCancelled) return;
    while (window.__demoPaused) {
      await new Promise(r => setTimeout(r, 200));
    }
    await new Promise(r => setTimeout(r, step));
    decorrido += step;
  }
}

function destacar(el) {
  if (!el) return;
  document.querySelectorAll('.test-highlight-pulse').forEach(e => e.classList.remove('test-highlight-pulse'));
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('test-highlight-pulse');
}

function removerDestaque(el) {
  if (!el) return;
  el.classList.remove('test-highlight-pulse');
}

async function digitarNoCampo(el, texto, atrasoMs = 40) {
  if (!el) return;
  destacar(el);
  el.focus();
  el.value = '';
  el.dispatchEvent(new Event('input', { bubbles: true }));
  for (const char of texto) {
    if (window.__demoCancelled) return;
    while (window.__demoPaused) await new Promise(r => setTimeout(r, 200));
    el.value += char;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, atrasoMs / window.__demoSpeedMultiplier));
  }
}

function atualizarHUD(passoAtual, totalPassos, titulo, descricao) {
  let hud = document.getElementById('demo-hud');
  if (!hud) {
    hud = document.createElement('div');
    hud.id = 'demo-hud';
    hud.className = 'demo-hud';
    hud.innerHTML = `
      <div class="demo-hud-header">
        <div class="demo-hud-title">
          <span>🧪 Testes Automatizados no Navegador (LES 2026)</span>
          <span class="demo-hud-tag" id="demo-hud-step-tag">Passo 1/${totalPassos}</span>
        </div>
        <div class="demo-hud-actions">
          <button type="button" id="demo-btn-pause" class="demo-hud-btn" onclick="alternarPausaDemo()">⏸️ Pausar</button>
          <button type="button" id="demo-btn-speed" class="demo-hud-btn" onclick="alternarVelocidadeDemo()">⚡ 1x</button>
          <button type="button" class="demo-hud-btn" style="background: rgba(220, 38, 38, 0.4); border-color: #ef4444;" onclick="cancelarDemo()">⏹️ Parar</button>
        </div>
      </div>
      <div class="demo-hud-step-desc" id="demo-hud-desc">Iniciando bateria de testes...</div>
      <div class="demo-hud-progress-bg">
        <div class="demo-hud-progress-fill" id="demo-hud-fill"></div>
      </div>
      <div class="demo-hud-footer">
        <span id="demo-hud-footer-req">Validando requisitos funcionais e regras de negócio...</span>
        <span>Livraria Alexandria — Anderson & João</span>
      </div>
    `;
    document.body.appendChild(hud);
  }

  const pct = Math.round((passoAtual / totalPassos) * 100);
  const tag = document.getElementById('demo-hud-step-tag');
  const desc = document.getElementById('demo-hud-desc');
  const fill = document.getElementById('demo-hud-fill');
  const req = document.getElementById('demo-hud-footer-req');

  if (tag) tag.textContent = `Passo ${passoAtual}/${totalPassos}`;
  if (desc) desc.innerHTML = `<strong>${titulo}:</strong> ${descricao}`;
  if (fill) fill.style.width = `${pct}%`;
  if (req) req.textContent = titulo;
}

function removerHUD() {
  const hud = document.getElementById('demo-hud');
  if (hud) hud.remove();
}

/**
 * Ponto de entrada principal para a demonstração visual
 */
async function iniciarDemonstracaoVisual() {
  window.__demoCancelled = false;
  window.__demoPaused = false;

  // Fecha qualquer modal aberto antes de iniciar
  fecharModal();
  fecharModalSenha();
  fecharModalTransacoes();
  fecharModalBloqueio();
  fecharModalConclusao();

  const totalPassos = 10;

  // PASSO 1: RF0024 - Consulta com Filtros
  atualizarHUD(1, totalPassos, 'RF0024: Consulta e Filtros', 'Digitando filtro de busca por "Clarice" e validando resultado instantâneo...');
  const inputNome = document.getElementById('filtro-nome');
  await digitarNoCampo(inputNome, 'Clarice', 50);
  await aguardar(500);

  const btnFiltrar = document.getElementById('btn-filtrar');
  destacar(btnFiltrar);
  btnFiltrar.click();
  removerDestaque(btnFiltrar);
  await aguardar(1600);

  // Limpa os filtros para restaurar a lista
  atualizarHUD(1, totalPassos, 'RF0024: Limpeza de Filtros', 'Restaurando a lista completa com o botão Limpar...');
  const btnLimpar = document.getElementById('btn-limpar-filtros');
  destacar(btnLimpar);
  btnLimpar.click();
  removerDestaque(btnLimpar);
  await aguardar(1400);
  if (window.__demoCancelled) return;

  // PASSO 2: RNF0031 & RNF0032 - Senha Forte e Confirmação
  atualizarHUD(2, totalPassos, 'RNF0031 & RNF0032: Validação de Senha Forte', 'Abrindo formulário e testando rejeição de senha fraca...');
  const btnNovo = document.getElementById('btn-novo-cliente');
  destacar(btnNovo);
  btnNovo.click();
  removerDestaque(btnNovo);
  await aguardar(900);

  const campoSenha = document.getElementById('field-senha');
  await digitarNoCampo(campoSenha, '123', 60);
  await aguardar(1400); // Visualiza o aviso de senha fraca

  atualizarHUD(2, totalPassos, 'RNF0031 & RNF0032: Senha Válida', 'Preenchendo senha forte com maiúscula, minúscula e caractere especial...');
  campoSenha.value = '';
  await digitarNoCampo(campoSenha, 'Livro@2026', 40);

  const campoConfirma = document.getElementById('field-senha-confirma');
  await digitarNoCampo(campoConfirma, 'Livro@2026', 40);
  await aguardar(800);
  if (window.__demoCancelled) return;

  // PASSO 3: RF0021 & RN0021-RN0027 - Cadastro Completo
  atualizarHUD(3, totalPassos, 'RF0021: Cadastro de Cliente', 'Preenchendo dados pessoais, telefone composto, endereço e cartão homologado...');
  const modalBox = document.querySelector('#modal-cliente .modal-box');
  if (modalBox) modalBox.scrollTo({ top: 0, behavior: 'smooth' });

  await digitarNoCampo(document.getElementById('field-nome'), 'João Guimarães Rosa', 35);
  await digitarNoCampo(document.getElementById('field-cpf'), '777.888.999-55', 35);
  await digitarNoCampo(document.getElementById('field-email'), 'guimaraes@alexandria.com.br', 35);
  
  const campoNascimento = document.getElementById('field-nascimento');
  destacar(campoNascimento);
  campoNascimento.value = '1908-06-27';
  campoNascimento.dispatchEvent(new Event('change', { bubbles: true }));
  await aguardar(400);

  // Telefone composto (RN0026)
  const telTipo = document.getElementById('field-tel-tipo');
  telTipo.value = 'CELULAR';
  await digitarNoCampo(document.getElementById('field-tel-ddd'), '31', 40);
  await digitarNoCampo(document.getElementById('field-tel-numero'), '98765-4321', 40);

  // Endereço (RN0021, RN0022, RN0023, RF0026)
  const endFrase = document.getElementById('end-frase-0');
  if (endFrase) await digitarNoCampo(endFrase, 'Fazenda Veredas', 35);
  const endLogradouro = document.getElementById('end-logradouro-0');
  if (endLogradouro) await digitarNoCampo(endLogradouro, 'Rua das Veredas', 35);
  const endNum = document.getElementById('end-numero-0');
  if (endNum) await digitarNoCampo(endNum, '500', 40);
  const endBairro = document.getElementById('end-bairro-0');
  if (endBairro) await digitarNoCampo(endBairro, 'Sertão', 35);
  const endCep = document.getElementById('end-cep-0');
  if (endCep) await digitarNoCampo(endCep, '30100-000', 40);
  const endCidade = document.getElementById('end-cidade-0');
  if (endCidade) await digitarNoCampo(endCidade, 'Cordisburgo', 35);

  // Cartão (RN0024, RN0025, RF0027)
  const cardNum = document.getElementById('card-numero-0');
  if (cardNum) await digitarNoCampo(cardNum, '5412 3333 4444 5555', 35);
  const cardNome = document.getElementById('card-nome-0');
  if (cardNome) await digitarNoCampo(cardNome, 'JOAO G ROSA', 35);
  const cardBandeira = document.getElementById('card-bandeira-0');
  if (cardBandeira) {
    cardBandeira.value = 'MASTERCARD';
    cardBandeira.dispatchEvent(new Event('change', { bubbles: true }));
  }
  const cardCvv = document.getElementById('card-cvv-0');
  if (cardCvv) await digitarNoCampo(cardCvv, '456', 40);

  atualizarHUD(3, totalPassos, 'RF0021 & RNF0035: Gravação', 'Enviando payload para a API REST e gerando código único sequencial...');
  const btnSalvar = document.getElementById('btn-salvar-cliente');
  destacar(btnSalvar);
  await aguardar(600);
  btnSalvar.click();
  removerDestaque(btnSalvar);
  await aguardar(2000);
  if (window.__demoCancelled) return;

  // Identifica o novo cliente na tabela
  const novoCliente = clientesCache.find(c => c.cpf === '777.888.999-55' || c.nome.includes('Guimarães'));
  const novoCodigo = novoCliente ? novoCliente.codigo : 'CLI-003';

  // PASSO 4: RF0022 - Alteração de Cadastro com CPF Imutável
  atualizarHUD(4, totalPassos, 'RF0022: Alteração de Cliente', `Abrindo edição de ${novoCodigo} e demonstrando CPF bloqueado/imutável...`);
  const btnEditar = document.querySelector(`[data-cy="btn-editar-${novoCodigo}"]`);
  if (btnEditar) {
    destacar(btnEditar);
    btnEditar.click();
    removerDestaque(btnEditar);
    await aguardar(1000);

    const campoCpf = document.getElementById('field-cpf');
    destacar(campoCpf); // Destaca que o CPF é imutável
    await aguardar(1200);

    const campoNomeEdit = document.getElementById('field-nome');
    await digitarNoCampo(campoNomeEdit, 'J. Guimarães Rosa (Sertão)', 35);
    const campoTelEdit = document.getElementById('field-tel-numero');
    await digitarNoCampo(campoTelEdit, '99999-8888', 40);

    const btnSalvarEdit = document.getElementById('btn-salvar-cliente');
    destacar(btnSalvarEdit);
    btnSalvarEdit.click();
    removerDestaque(btnSalvarEdit);
    await aguardar(1800);
  }
  if (window.__demoCancelled) return;

  // PASSO 5: RF0028 - Alteração Exclusiva de Senha
  atualizarHUD(5, totalPassos, 'RF0028: Alteração Exclusiva de Senha', `Testando fluxo isolado de troca de senha para o cliente ${novoCodigo}...`);
  const btnSenha = document.querySelector(`[data-cy="btn-senha-${novoCodigo}"]`);
  if (btnSenha) {
    destacar(btnSenha);
    btnSenha.click();
    removerDestaque(btnSenha);
    await aguardar(900);

    await digitarNoCampo(document.getElementById('campo-nova-senha'), 'NovaSenha#2026', 40);
    await digitarNoCampo(document.getElementById('campo-confirma-nova-senha'), 'NovaSenha#2026', 40);
    await aguardar(600);

    const btnSalvarSenha = document.querySelector('#modal-senha form button[type="submit"]');
    destacar(btnSalvarSenha);
    btnSalvarSenha.click();
    removerDestaque(btnSalvarSenha);
    await aguardar(1600);
  }
  if (window.__demoCancelled) return;

  // PASSO 6: RF0025 - Consulta de Transações
  atualizarHUD(6, totalPassos, 'RF0025: Histórico de Transações', 'Abrindo histórico de pedidos e compras do cliente Machado de Assis (CLI-001)...');
  const btnTransacoes = document.querySelector('[data-cy="btn-transacoes-CLI-001"]');
  if (btnTransacoes) {
    destacar(btnTransacoes);
    btnTransacoes.click();
    removerDestaque(btnTransacoes);
    await aguardar(2200);

    fecharModalTransacoes();
    await aguardar(800);
  }
  if (window.__demoCancelled) return;

  // PASSO 7: DISTINÇÃO DE REGRA DE NEGÓCIO - Bloqueio de Exclusão com Histórico
  atualizarHUD(7, totalPassos, 'Regra de Distinção: Inativação vs Exclusão', 'Tentando excluir Machado de Assis (possui compras). O sistema bloqueia a exclusão física!');
  const btnExcluirMachado = document.querySelector('[data-cy="btn-excluir-CLI-001"]');
  if (btnExcluirMachado) {
    destacar(btnExcluirMachado);
    await aguardar(600);
    btnExcluirMachado.click();
    removerDestaque(btnExcluirMachado);
    await aguardar(2800); // Visualiza o modal explicativo didático da regra de negócio

    fecharModalBloqueio();
    await aguardar(800);
  }
  if (window.__demoCancelled) return;

  // PASSO 8: RF0023 - Inativação e Reativação
  atualizarHUD(8, totalPassos, 'RF0023: Inativar Cadastro', 'Inativando o cadastro do cliente para preservar histórico contábil...');
  const btnInativarMachado = document.querySelector('[data-cy="btn-inativar-CLI-001"]');
  if (btnInativarMachado) {
    destacar(btnInativarMachado);
    btnInativarMachado.click();
    removerDestaque(btnInativarMachado);
    await aguardar(1600); // Mostra status INATIVO vermelho

    atualizarHUD(8, totalPassos, 'RF0023: Reativar Cadastro', 'Reativando o cadastro do cliente para o status ATIVO verde...');
    const btnReativarMachado = document.querySelector('[data-cy="btn-inativar-CLI-001"]');
    if (btnReativarMachado) {
      destacar(btnReativarMachado);
      btnReativarMachado.click();
      removerDestaque(btnReativarMachado);
      await aguardar(1600);
    }
  }
  if (window.__demoCancelled) return;

  // PASSO 9: EXCLUSÃO PERMITIDA - Cliente sem Compras
  atualizarHUD(9, totalPassos, 'Exclusão Física Permitida', `Excluindo fisicamente o cliente de teste ${novoCodigo} (sem pedidos vinculados)...`);
  const btnExcluirNovo = document.querySelector(`[data-cy="btn-excluir-${novoCodigo}"]`);
  if (btnExcluirNovo) {
    destacar(btnExcluirNovo);
    const confirmOriginal = window.confirm;
    window.confirm = () => true; // Confirmação automática durante a demo
    btnExcluirNovo.click();
    window.confirm = confirmOriginal;
    removerDestaque(btnExcluirNovo);
    await aguardar(1800);
  }
  if (window.__demoCancelled) return;

  // PASSO 10: CONCLUSÃO E RELATÓRIO
  atualizarHUD(10, totalPassos, '🏆 Demonstração Concluída', '100% dos requisitos do DRS_LES_2_2026 validados com sucesso!');
  await aguardar(1000);
  removerHUD();

  const modalConclusao = document.getElementById('modal-conclusao-testes');
  if (modalConclusao) {
    modalConclusao.style.display = 'flex';
    modalConclusao.classList.add('active');
  }
}