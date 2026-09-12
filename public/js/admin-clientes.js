const STORAGE_KEY = '@alexandria:clientes';

// Base de dados mockada com estrutura de relacionamento 1:N
const clientesIniciaisMock = [
  {
    id: '1',
    cpf: '123.456.789-00',
    nome: 'Machado de Assis',
    email: 'machado@alexandria.com.br',
    dataNascimento: '1839-06-21',
    genero: 'Masculino',
    telefone: '(21) 98888-7777',
    status: 'ATIVO',
    enderecos: [
      { logradouro: 'Rua Cosme Velho', numero: '100', bairro: 'Botafogo', cep: '22241-090', cidade: 'Rio de Janeiro', estado: 'RJ', tipo: 'ENTREGA' },
      { logradouro: 'Av. Rio Branco', numero: '156', bairro: 'Centro', cep: '20040-003', cidade: 'Rio de Janeiro', estado: 'RJ', tipo: 'COBRANCA' }
    ],
    cartoes: [
      { numero: '•••• •••• •••• 4321', nomeImpresso: 'N MACHADO ASSIS', bandeira: 'VISA' },
      { numero: '•••• •••• •••• 8765', nomeImpresso: 'JOAQUIM M ASSIS', bandeira: 'MASTERCARD' }
    ]
  },
  {
    id: '2',
    cpf: '987.654.321-11',
    nome: 'Clarice Lispector',
    email: 'clarice@alexandria.com.br',
    dataNascimento: '1920-12-10',
    genero: 'Feminino',
    telefone: '(21) 97777-6666',
    status: 'INATIVO',
    enderecos: [
      { logradouro: 'Av. Atlântica', numero: '1500', bairro: 'Copacabana', cep: '22021-001', cidade: 'Rio de Janeiro', estado: 'RJ', tipo: 'AMBOS' }
    ],
    cartoes: [
      { numero: '•••• •••• •••• 1122', nomeImpresso: 'CLARICE LISPECTOR', bandeira: 'ELO' }
    ]
  }
];

// Estado temporário em memória para manipular os blocos do modal antes de salvar
let enderecosTemporarios = [];
let cartoesTemporarios = [];

document.addEventListener('DOMContentLoaded', () => {
  inicializarStorage();
  renderizarTabela();

  const form = document.getElementById('form-cliente-admin');
  if (form) form.addEventListener('submit', salvarCliente);
});

function inicializarStorage() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clientesIniciaisMock));
  }
}

function obterClientes() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function salvarClientesStorage(lista) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

function renderizarTabela() {
  const tbody = document.getElementById('tabela-clientes-body');
  if (!tbody) return;

  const clientes = obterClientes();
  tbody.innerHTML = '';

  clientes.forEach(cliente => {
    const isAtivo = cliente.status === 'ATIVO';
    const totalEnderecos = cliente.enderecos ? cliente.enderecos.length : 0;
    const totalCartoes = cliente.cartoes ? cliente.cartoes.length : 0;

    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid #f1f5f9';
    tr.innerHTML = `
      <td style="padding: 12px 10px;">
        <strong>#${cliente.id}</strong><br>
        <small style="color: var(--text-muted);">${cliente.cpf}</small>
      </td>
      <td style="padding: 12px 10px;">
        <strong style="color: var(--text-title);">${cliente.nome}</strong><br>
        <small style="color: var(--text-muted);">${cliente.telefone || 'Sem telefone'} | 📍 ${totalEnderecos} end. | 💳 ${totalCartoes} cartão(ões)</small>
      </td>
      <td style="padding: 12px 10px;">${cliente.email}</td>
      <td style="padding: 12px 10px;">
        <span style="background: ${isAtivo ? '#dcfce7' : '#fee2e2'}; color: ${isAtivo ? '#15803d' : '#b91c1c'}; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 0.75rem;">
          ${cliente.status}
        </span>
      </td>
      <td style="padding: 12px 10px; text-align: center;">
        <button onclick="abrirModalEdicao('${cliente.id}')" style="background: var(--palette-navy-dark); color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Editar</button>
        <button onclick="alternarStatusCliente('${cliente.id}')" style="background: ${isAtivo ? 'var(--palette-terracotta)' : 'var(--palette-teal-dark)'}; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; margin-left: 4px;">
          ${isAtivo ? 'Inativar' : 'Reativar'}
        </button>
        <button onclick="excluirCliente('${cliente.id}')" style="background: #991b1b; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; margin-left: 4px;">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function abrirModalNovo() {
  document.getElementById('modal-titulo').textContent = 'Novo Cliente';
  document.getElementById('form-cliente-admin').reset();
  document.getElementById('cliente-id').value = '';
  document.getElementById('field-cpf').removeAttribute('readonly');

  // Inicializa arrays com 1 registro padrão
  enderecosTemporarios = [{ logradouro: '', numero: '', bairro: '', cep: '', cidade: '', estado: 'SP', tipo: 'ENTREGA' }];
  cartoesTemporarios = [{ numero: '', nomeImpresso: '', bandeira: 'VISA' }];

  renderizarBlocosEnderecos();
  renderizarBlocosCartoes();
  document.getElementById('modal-cliente').style.display = 'flex';
}

function abrirModalEdicao(id) {
  const clientes = obterClientes();
  const cliente = clientes.find(c => c.id === String(id));
  if (!cliente) return;

  document.getElementById('modal-titulo').textContent = `Editar Cliente #${cliente.id}`;
  document.getElementById('cliente-id').value = cliente.id;
  document.getElementById('field-nome').value = cliente.nome;
  document.getElementById('field-cpf').value = cliente.cpf;
  document.getElementById('field-cpf').setAttribute('readonly', 'true');
  document.getElementById('field-email').value = cliente.email;
  document.getElementById('field-telefone').value = cliente.telefone || '';
  document.getElementById('field-nascimento').value = cliente.dataNascimento || '';
  document.getElementById('field-genero').value = cliente.genero || 'Masculino';
  document.getElementById('field-status').value = cliente.status;

  // Carrega subcoleções existentes ou garante array padrão
  enderecosTemporarios = cliente.enderecos && cliente.enderecos.length > 0
    ? JSON.parse(JSON.stringify(cliente.enderecos))
    : [{ logradouro: '', numero: '', bairro: '', cep: '', cidade: '', estado: 'SP', tipo: 'ENTREGA' }];

  cartoesTemporarios = cliente.cartoes && cliente.cartoes.length > 0
    ? JSON.parse(JSON.stringify(cliente.cartoes))
    : [{ numero: '', nomeImpresso: '', bandeira: 'VISA' }];

  renderizarBlocosEnderecos();
  renderizarBlocosCartoes();
  document.getElementById('modal-cliente').style.display = 'flex';
}

function fecharModal() {
  document.getElementById('modal-cliente').style.display = 'none';
}

// Manipulação Dinâmica da Subcoleção de Endereços
function adicionarBlocoEndereco() {
  enderecosTemporarios.push({ logradouro: '', numero: '', bairro: '', cep: '', cidade: '', estado: 'SP', tipo: 'ENTREGA' });
  renderizarBlocosEnderecos();
}

function removerBlocoEndereco(index) {
  if (enderecosTemporarios.length === 1) {
    alert('O cliente precisa ter ao menos 1 endereço cadastrado.');
    return;
  }
  enderecosTemporarios.splice(index, 1);
  renderizarBlocosEnderecos();
}

function renderizarBlocosEnderecos() {
  const container = document.getElementById('container-lista-enderecos');
  if (!container) return;
  container.innerHTML = '';

  enderecosTemporarios.forEach((end, idx) => {
    const div = document.createElement('div');
    div.style.cssText = 'background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px;';
    div.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
        <strong>Endereço #${idx + 1}</strong>
        <button type="button" onclick="removerBlocoEndereco(${idx})" style="color: #b91c1c; border: none; background: none; cursor: pointer; font-weight: bold; font-size: 0.75rem;">✕ Remover</button>
      </div>
      <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 8px; margin-bottom: 8px;">
        <input type="text" placeholder="Logradouro" value="${end.logradouro}" onchange="enderecosTemporarios[${idx}].logradouro = this.value" required style="padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
        <input type="text" placeholder="Número" value="${end.numero}" onchange="enderecosTemporarios[${idx}].numero = this.value" required style="padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
        <input type="text" placeholder="Bairro" value="${end.bairro}" onchange="enderecosTemporarios[${idx}].bairro = this.value" required style="padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px;">
        <input type="text" placeholder="CEP" value="${end.cep}" onchange="enderecosTemporarios[${idx}].cep = this.value" required style="padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
        <input type="text" placeholder="Cidade" value="${end.cidade}" onchange="enderecosTemporarios[${idx}].cidade = this.value" required style="padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
        <input type="text" placeholder="Estado (UF)" value="${end.estado}" onchange="enderecosTemporarios[${idx}].estado = this.value" required style="padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
        <select onchange="enderecosTemporarios[${idx}].tipo = this.value" style="padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
          <option value="ENTREGA" ${end.tipo === 'ENTREGA' ? 'selected' : ''}>Entrega</option>
          <option value="COBRANCA" ${end.tipo === 'COBRANCA' ? 'selected' : ''}>Cobrança</option>
          <option value="AMBOS" ${end.tipo === 'AMBOS' ? 'selected' : ''}>Ambos</option>
        </select>
      </div>
    `;
    container.appendChild(div);
  });
}

// Manipulação Dinâmica da Subcoleção de Cartões
function adicionarBlocoCartao() {
  cartoesTemporarios.push({ numero: '', nomeImpresso: '', bandeira: 'VISA' });
  renderizarBlocosCartoes();
}

function removerBlocoCartao(index) {
  if (cartoesTemporarios.length === 1) {
    alert('O cliente precisa ter ao menos 1 cartão cadastrado.');
    return;
  }
  cartoesTemporarios.splice(index, 1);
  renderizarBlocosCartoes();
}

function renderizarBlocosCartoes() {
  const container = document.getElementById('container-lista-cartoes');
  if (!container) return;
  container.innerHTML = '';

  cartoesTemporarios.forEach((card, idx) => {
    const div = document.createElement('div');
    div.style.cssText = 'background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px;';
    div.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
        <strong>Cartão #${idx + 1}</strong>
        <button type="button" onclick="removerBlocoCartao(${idx})" style="color: #b91c1c; border: none; background: none; cursor: pointer; font-weight: bold; font-size: 0.75rem;">✕ Remover</button>
      </div>
      <div style="display: grid; grid-template-columns: 2fr 2fr 1fr; gap: 8px;">
        <input type="text" placeholder="Número do Cartão" value="${card.numero}" onchange="cartoesTemporarios[${idx}].numero = this.value" required style="padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
        <input type="text" placeholder="Nome Impresso" value="${card.nomeImpresso}" onchange="cartoesTemporarios[${idx}].nomeImpresso = this.value" required style="padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
        <select onchange="cartoesTemporarios[${idx}].bandeira = this.value" style="padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
          <option value="VISA" ${card.bandeira === 'VISA' ? 'selected' : ''}>Visa</option>
          <option value="MASTERCARD" ${card.bandeira === 'MASTERCARD' ? 'selected' : ''}>Mastercard</option>
          <option value="ELO" ${card.bandeira === 'ELO' ? 'selected' : ''}>Elo</option>
        </select>
      </div>
    `;
    container.appendChild(div);
  });
}

// Persistência Completa do Payload Aninhado (1:N)
function salvarCliente(e) {
  e.preventDefault();
  const id = document.getElementById('cliente-id').value;
  const clientes = obterClientes();

  const clientePayload = {
    id: id || String(Date.now()),
    nome: document.getElementById('field-nome').value.trim(),
    cpf: document.getElementById('field-cpf').value.trim(),
    email: document.getElementById('field-email').value.trim(),
    telefone: document.getElementById('field-telefone').value.trim(),
    dataNascimento: document.getElementById('field-nascimento').value,
    genero: document.getElementById('field-genero').value,
    status: document.getElementById('field-status').value,
    enderecos: JSON.parse(JSON.stringify(enderecosTemporarios)),
    cartoes: JSON.parse(JSON.stringify(cartoesTemporarios))
  };

  if (id) {
    const index = clientes.findIndex(c => c.id === id);
    if (index !== -1) clientes[index] = clientePayload;
  } else {
    clientes.push(clientePayload);
  }

  salvarClientesStorage(clientes);
  fecharModal();
  renderizarTabela();
}

function alternarStatusCliente(id) {
  const clientes = obterClientes();
  const cliente = clientes.find(c => c.id === String(id));
  if (cliente) {
    cliente.status = cliente.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    salvarClientesStorage(clientes);
    renderizarTabela();
  }
}

function excluirCliente(id) {
  const clientes = obterClientes();
  const cliente = clientes.find(c => c.id === String(id));
  if (!cliente) return;

  if (confirm(`Deseja EXCLUIR DEFINITIVAMENTE o cliente "${cliente.nome}"?`)) {
    const novaLista = clientes.filter(c => c.id !== String(id));
    salvarClientesStorage(novaLista);
    renderizarTabela();
  }
}