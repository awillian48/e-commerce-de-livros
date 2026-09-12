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
  configurarScrollDinamicoModal();
});

function configurarScrollDinamicoModal() {
  const modalBox = document.querySelector('#modal-cliente .modal-box');
  if (!modalBox) return;

  // Ao focar em qualquer input/select, faz scroll suave no modal para centralizar o campo
  modalBox.addEventListener('focusin', (e) => {
    if (e.target.matches('input, select, textarea')) {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const secaoPai = e.target.closest('.modal-form-section');
      if (secaoPai && secaoPai.id) {
        document.querySelectorAll('.pill-nav-item').forEach(p => p.classList.remove('active'));
        const linkAtivo = document.querySelector(`.pill-nav-item[href="#${secaoPai.id}"]`);
        if (linkAtivo) linkAtivo.classList.add('active');
      }
    }
  });
}

function navegarSecaoModal(e, idSecao) {
  if (e) e.preventDefault();
  const el = document.getElementById(idSecao);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.querySelectorAll('.pill-nav-item').forEach(p => p.classList.remove('active'));
    const linkAtivo = document.querySelector(`.pill-nav-item[href="#${idSecao}"]`);
    if (linkAtivo) linkAtivo.classList.add('active');
  }
}

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
  if (badgeTotal) {
    badgeTotal.textContent = `${clientes.length} ${clientes.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}`;
  }

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

    // Formatação do ranking com estética editorial (RN0027)
    const rankingBadge = `<span class="ranking-pill">Nível <strong>${cliente.ranking || 1}</strong> / 5</span>`;

    // Formatação do telefone composto (RN0026)
    const telFormatado = cliente.telefone
      ? `(${cliente.telefone.ddd}) ${cliente.telefone.numero} [${cliente.telefone.tipo}]`
      : 'Não informado';

    const tr = document.createElement('tr');
    tr.setAttribute('data-cy', `linha-cliente-${cliente.codigo}`);
    tr.innerHTML = `
      <td style="font-weight: bold; color: var(--palette-navy-dark);">
        <span style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 3px 8px; border-radius: 4px; font-family: monospace; font-size: 0.85rem;">
          ${cliente.codigo || cliente.id}
        </span>
      </td>
      <td>
        <strong style="color: var(--palette-navy-dark); font-size: 0.95rem;">${cliente.nome}</strong><br>
        <small style="color: #64748b;">CPF: ${cliente.cpf}</small>
      </td>
      <td>
        <span style="color: #334155;">${cliente.email}</span><br>
        <small style="color: #64748b;">Tel: ${telFormatado}</small><br>
        <small style="color: var(--palette-teal-dark); font-weight: 600;">Endereços: ${totalEnderecos} &nbsp;|&nbsp; Cartões: ${totalCartoes}</small>
      </td>
      <td>
        ${rankingBadge}
      </td>
      <td>
        <span class="pill-status ${isAtivo ? 'ativo' : 'inativo'}" data-cy="badge-status-${cliente.codigo}">
          ● ${cliente.status}
        </span>
      </td>
      <td style="text-align: right; padding-right: 18px;">
        <div class="action-toolbar">
          <button type="button" class="btn-tbl btn-tbl-primary" onclick="abrirModalTransacoes('${cliente.id}')" title="Ver Compras (RF0025)" data-cy="btn-transacoes-${cliente.codigo}">
            Transações <span class="btn-tbl-badge">${totalTransacoes}</span>
          </button>
          <button type="button" class="btn-tbl btn-tbl-outline" onclick="abrirModalEdicao('${cliente.id}')" title="Editar Dados (RF0022)" data-cy="btn-editar-${cliente.codigo}">
            Editar
          </button>
          <button type="button" class="btn-tbl btn-tbl-outline" onclick="abrirModalSenha('${cliente.id}')" title="Alterar Senha (RF0028)" data-cy="btn-senha-${cliente.codigo}">
            Senha
          </button>
          <button type="button" class="btn-tbl ${isAtivo ? 'btn-tbl-warning' : 'btn-tbl-success'}" onclick="alternarStatus('${cliente.id}')" title="Inativar/Reativar (RF0023)" data-cy="btn-inativar-${cliente.codigo}">
            ${isAtivo ? 'Inativar' : 'Reativar'}
          </button>
          <button type="button" class="btn-tbl btn-tbl-danger" onclick="tentarExcluirCliente('${cliente.id}')" title="Excluir" data-cy="btn-excluir-${cliente.codigo}">
            Excluir
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
  const blocoSenha = document.getElementById('secao-seguranca') || document.getElementById('bloco-senha-cadastro');
  if (blocoSenha) blocoSenha.style.display = 'block';
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
  const blocoSenha = document.getElementById('secao-seguranca') || document.getElementById('bloco-senha-cadastro');
  if (blocoSenha) blocoSenha.style.display = 'none';
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
    div.style.cssText = 'background: #ffffff; border: 1px solid #e2e8f0; padding: 18px 20px; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);';
    div.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 6px;">
        <strong style="color: var(--palette-navy-dark); font-size: 0.9rem;">
          Endereço #${idx + 1}
        </strong>
        <button type="button" onclick="removerBlocoEnderecoForm(${idx})" style="color: #b91c1c; border: none; background: none; cursor: pointer; font-weight: 600; font-size: 0.8rem;">
          ✕ Remover
        </button>
      </div>

      <!-- Linha 1: Identificador / Frase Curta (RF0026) e Finalidade (RN0021/RN0022) -->
      <div style="display: grid; grid-template-columns: 2fr 1.2fr; gap: 14px; margin-bottom: 12px;">
        <div>
          <label class="form-label">Frase Identificadora do Endereço * (RF0026)</label>
          <input type="text" id="end-frase-${idx}" placeholder="Ex: Minha Casa, Escritório Centro" value="${end.fraseIdentificadora || ''}" oninput="enderecosBuffer[${idx}].fraseIdentificadora = this.value" required class="input-clean">
        </div>
        <div>
          <label class="form-label">Finalidade do Endereço *</label>
          <select id="end-finalidade-${idx}" onchange="enderecosBuffer[${idx}].finalidade = this.value" class="input-clean">
            <option value="ENTREGA" ${end.finalidade === 'ENTREGA' ? 'selected' : ''}>Apenas Entrega</option>
            <option value="COBRANCA" ${end.finalidade === 'COBRANCA' ? 'selected' : ''}>Apenas Cobrança</option>
            <option value="AMBOS" ${end.finalidade === 'AMBOS' ? 'selected' : ''}>Ambos (Entrega & Cobrança)</option>
          </select>
        </div>
      </div>

      <!-- Linha 2: Tipo de Residência, Tipo Logradouro, Logradouro e Número (RN0023) -->
      <div style="display: grid; grid-template-columns: 160px 160px 2fr 110px; gap: 12px; margin-bottom: 12px;">
        <div>
          <label class="form-label">Tipo Residência *</label>
          <select id="end-tipo-res-${idx}" onchange="enderecosBuffer[${idx}].tipoResidencia = this.value" class="input-clean">
            <option value="Casa" ${end.tipoResidencia === 'Casa' ? 'selected' : ''}>Casa</option>
            <option value="Apartamento" ${end.tipoResidencia === 'Apartamento' ? 'selected' : ''}>Apartamento</option>
            <option value="Sobrado" ${end.tipoResidencia === 'Sobrado' ? 'selected' : ''}>Sobrado</option>
            <option value="Comercial" ${end.tipoResidencia === 'Comercial' ? 'selected' : ''}>Comercial</option>
            <option value="Outro" ${end.tipoResidencia === 'Outro' ? 'selected' : ''}>Outro</option>
          </select>
        </div>
        <div>
          <label class="form-label">Tipo Logradouro *</label>
          <select id="end-tipo-logr-${idx}" onchange="enderecosBuffer[${idx}].tipoLogradouro = this.value" class="input-clean">
            <option value="Rua" ${end.tipoLogradouro === 'Rua' ? 'selected' : ''}>Rua</option>
            <option value="Avenida" ${end.tipoLogradouro === 'Avenida' ? 'selected' : ''}>Avenida</option>
            <option value="Alameda" ${end.tipoLogradouro === 'Alameda' ? 'selected' : ''}>Alameda</option>
            <option value="Travessa" ${end.tipoLogradouro === 'Travessa' ? 'selected' : ''}>Travessa</option>
            <option value="Praça" ${end.tipoLogradouro === 'Praça' ? 'selected' : ''}>Praça</option>
          </select>
        </div>
        <div>
          <label class="form-label">Logradouro *</label>
          <input type="text" id="end-logradouro-${idx}" placeholder="Nome da rua/av" value="${end.logradouro || ''}" oninput="enderecosBuffer[${idx}].logradouro = this.value" required class="input-clean">
        </div>
        <div>
          <label class="form-label">Número *</label>
          <input type="text" id="end-numero-${idx}" placeholder="Nº" value="${end.numero || ''}" oninput="enderecosBuffer[${idx}].numero = this.value" required class="input-clean">
        </div>
      </div>

      <!-- Linha 3: Bairro, CEP, Cidade, Estado, País (RN0023) -->
      <div style="display: grid; grid-template-columns: 1.5fr 140px 1.5fr 90px 130px; gap: 12px; margin-bottom: 12px;">
        <div>
          <label class="form-label">Bairro *</label>
          <input type="text" id="end-bairro-${idx}" placeholder="Bairro" value="${end.bairro || ''}" oninput="enderecosBuffer[${idx}].bairro = this.value" required class="input-clean">
        </div>
        <div>
          <label class="form-label">CEP *</label>
          <input type="text" id="end-cep-${idx}" placeholder="00000-000" value="${end.cep || ''}" oninput="enderecosBuffer[${idx}].cep = this.value" required class="input-clean">
        </div>
        <div>
          <label class="form-label">Cidade *</label>
          <input type="text" id="end-cidade-${idx}" placeholder="Cidade" value="${end.cidade || ''}" oninput="enderecosBuffer[${idx}].cidade = this.value" required class="input-clean">
        </div>
        <div>
          <label class="form-label">UF *</label>
          <input type="text" id="end-estado-${idx}" placeholder="SP" maxlength="2" value="${end.estado || ''}" oninput="enderecosBuffer[${idx}].estado = this.value" required class="input-clean">
        </div>
        <div>
          <label class="form-label">País *</label>
          <input type="text" id="end-pais-${idx}" placeholder="Brasil" value="${end.pais || 'Brasil'}" oninput="enderecosBuffer[${idx}].pais = this.value" required class="input-clean">
        </div>
      </div>

      <!-- Linha 4: Observações Opcionais (RN0023) -->
      <div>
        <label class="form-label">Observações (Opcional)</label>
        <input type="text" id="end-obs-${idx}" placeholder="Ponto de referência, bloco, apto, etc." value="${end.observacoes || ''}" oninput="enderecosBuffer[${idx}].observacoes = this.value" class="input-clean">
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
    div.style.cssText = 'background: #ffffff; border: 1px solid #e2e8f0; padding: 18px 20px; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);';
    div.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 6px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <strong style="color: var(--palette-navy-dark); font-size: 0.9rem;">Cartão #${idx + 1}</strong>
          ${card.preferencial ? '<span style="background: #fef08a; color: #854d0e; font-size: 0.75rem; font-weight: bold; padding: 3px 8px; border-radius: 4px;">PREFERENCIAL (RF0027)</span>' : ''}
        </div>
        <button type="button" onclick="removerBlocoCartaoForm(${idx})" style="color: #b91c1c; border: none; background: none; cursor: pointer; font-weight: 600; font-size: 0.8rem;">
          ✕ Remover
        </button>
      </div>

      <div style="display: grid; grid-template-columns: 2fr 2fr 1.4fr 110px; gap: 14px; margin-bottom: 12px;">
        <div>
          <label class="form-label">Número do Cartão * (RN0024)</label>
          <input type="text" id="card-numero-${idx}" placeholder="0000 0000 0000 0000" value="${card.numero || ''}" oninput="cartoesBuffer[${idx}].numero = this.value" required class="input-clean">
        </div>
        <div>
          <label class="form-label">Nome Impresso no Cartão * (RN0024)</label>
          <input type="text" id="card-nome-${idx}" placeholder="Nome como no plástico" value="${card.nomeImpresso || ''}" oninput="cartoesBuffer[${idx}].nomeImpresso = this.value" required class="input-clean">
        </div>
        <div>
          <label class="form-label">Bandeira * (RN0025)</label>
          <select id="card-bandeira-${idx}" onchange="cartoesBuffer[${idx}].bandeira = this.value" class="input-clean">
            <option value="VISA" ${card.bandeira === 'VISA' ? 'selected' : ''}>Visa</option>
            <option value="MASTERCARD" ${card.bandeira === 'MASTERCARD' ? 'selected' : ''}>Mastercard</option>
            <option value="ELO" ${card.bandeira === 'ELO' ? 'selected' : ''}>Elo</option>
            <option value="AMERICAN EXPRESS" ${card.bandeira === 'AMERICAN EXPRESS' ? 'selected' : ''}>American Express</option>
          </select>
        </div>
        <div>
          <label class="form-label">CVV * (RN0024)</label>
          <input type="text" id="card-cvv-${idx}" placeholder="123" maxlength="4" value="${card.cvv || ''}" oninput="cartoesBuffer[${idx}].cvv = this.value" required class="input-clean">
        </div>
      </div>

      <!-- Configuração de Cartão Preferencial (RF0027) -->
      <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; cursor: pointer; color: #334155; margin-top: 6px;">
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
    box.textContent = 'Senha Forte (atende a RNF0031)';
    box.style.color = '#15803d';
  } else {
    box.textContent = 'Senha Fraca: precisa de 8+ caracteres, letra maiúscula, minúscula e caractere especial (@#$...).';
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