const STORAGE_KEY = '@alexandria:clientes';

// Id do cliente em sessão (Simulação do leitor "Machado de Assis")
const CLIENTE_SESSAO_ID = '1';

// Buffers temporários em memória para manipulação das coleções 1:N
let enderecosTemporarios = [];
let cartoesTemporarios = [];

document.addEventListener('DOMContentLoaded', () => {
  inicializarStorage();
  carregarPerfilCliente(CLIENTE_SESSAO_ID);

  const form = document.getElementById('form-cliente-publico');
  if (form) {
    form.addEventListener('submit', salvarPerfilCliente);
  }
});

function inicializarStorage() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    const mockInicial = [
      {
        id: '1',
        cpf: '123.456.789-00',
        nome: 'Machado de Assis',
        email: 'machado@alexandria.com.br',
        senha: 'senha123SuperSegura',
        telefone: '(21) 98888-7777',
        dataNascimento: '1839-06-21',
        genero: 'Masculino',
        status: 'ATIVO',
        enderecos: [
          { logradouro: 'Rua Cosme Velho', numero: '100', bairro: 'Botafogo', cep: '22241-090', cidade: 'Rio de Janeiro', estado: 'RJ', tipo: 'ENTREGA' },
          { logradouro: 'Av. Rio Branco', numero: '156', bairro: 'Centro', cep: '20040-003', cidade: 'Rio de Janeiro', estado: 'RJ', tipo: 'COBRANCA' }
        ],
        cartoes: [
          { numero: '4532 1111 2222 4321', nomeImpresso: 'N MACHADO ASSIS', bandeira: 'VISA' },
          { numero: '5412 8888 7777 8765', nomeImpresso: 'JOAQUIM M ASSIS', bandeira: 'MASTERCARD' }
        ]
      }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockInicial));
  }
}

function obterClientesStorage() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function carregarPerfilCliente(id) {
  const clientes = obterClientesStorage();
  const cliente = clientes.find(c => c.id === String(id));
  if (!cliente) return;

  // Preenchimento dos campos escalares do perfil
  document.getElementById('cli-nome').value = cliente.nome || '';
  document.getElementById('cli-cpf').value = cliente.cpf || '';
  document.getElementById('cli-cpf').setAttribute('readonly', 'true'); // CPF imutável
  document.getElementById('cli-email').value = cliente.email || '';
  document.getElementById('cli-senha').value = cliente.senha || '';
  document.getElementById('cli-telefone').value = cliente.telefone || '';
  document.getElementById('cli-nascimento').value = cliente.dataNascimento || '';
  document.getElementById('cli-genero').value = cliente.genero || 'Masculino';

  // Deep copy dos dados relacionais para os buffers de memória
  enderecosTemporarios = cliente.enderecos && cliente.enderecos.length > 0
    ? JSON.parse(JSON.stringify(cliente.enderecos))
    : [{ logradouro: '', numero: '', bairro: '', cep: '', cidade: '', estado: 'SP', tipo: 'ENTREGA' }];

  cartoesTemporarios = cliente.cartoes && cliente.cartoes.length > 0
    ? JSON.parse(JSON.stringify(cliente.cartoes))
    : [{ numero: '', nomeImpresso: '', bandeira: 'VISA' }];

  renderizarEnderecosPublicos();
  renderizarCartoesPublicos();
}

// Manipulação Dinâmica da Subcoleção de Endereços (1:N)
function adicionarEnderecoPublico() {
  enderecosTemporarios.push({ logradouro: '', numero: '', bairro: '', cep: '', cidade: '', estado: 'SP', tipo: 'ENTREGA' });
  renderizarEnderecosPublicos();
}

function removerEnderecoPublico(index) {
  if (enderecosTemporarios.length === 1) {
    alert('Você deve manter pelo menos um endereço cadastrado para entregas.');
    return;
  }
  enderecosTemporarios.splice(index, 1);
  renderizarEnderecosPublicos();
}

function renderizarEnderecosPublicos() {
  const container = document.getElementById('container-enderecos-cliente');
  if (!container) return;
  container.innerHTML = '';

  enderecosTemporarios.forEach((end, idx) => {
    const div = document.createElement('div');
    div.style.cssText = 'background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px;';
    div.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <strong style="color: var(--palette-navy-dark);">Endereço #${idx + 1}</strong>
        <button type="button" onclick="removerEnderecoPublico(${idx})" style="color: #b91c1c; border: none; background: none; cursor: pointer; font-weight: bold; font-size: 0.8rem;">✕ Remover</button>
      </div>
      <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 8px; margin-bottom: 8px;">
        <input type="text" placeholder="Logradouro (Rua, Av.)" value="${end.logradouro}" onchange="enderecosTemporarios[${idx}].logradouro = this.value" required style="padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
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

// Manipulação Dinâmica da Subcoleção de Cartões (1:N)
function adicionarCartaoPublico() {
  cartoesTemporarios.push({ numero: '', nomeImpresso: '', bandeira: 'VISA' });
  renderizarCartoesPublicos();
}

function removerCartaoPublico(index) {
  if (cartoesTemporarios.length === 1) {
    alert('Você deve manter pelo menos um cartão cadastrado para compras rápidas.');
    return;
  }
  cartoesTemporarios.splice(index, 1);
  renderizarCartoesPublicos();
}

function renderizarCartoesPublicos() {
  const container = document.getElementById('container-cartoes-cliente');
  if (!container) return;
  container.innerHTML = '';

  cartoesTemporarios.forEach((card, idx) => {
    const div = document.createElement('div');
    div.style.cssText = 'background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px;';
    div.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <strong style="color: var(--palette-navy-dark);">Cartão #${idx + 1}</strong>
        <button type="button" onclick="removerCartaoPublico(${idx})" style="color: #b91c1c; border: none; background: none; cursor: pointer; font-weight: bold; font-size: 0.8rem;">✕ Remover</button>
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

// Persistência das Modificações do Perfil do Leitor
function salvarPerfilCliente(e) {
  e.preventDefault();
  const clientes = obterClientesStorage();
  const index = clientes.findIndex(c => c.id === CLIENTE_SESSAO_ID);

  if (index === -1) {
    alert('Erro: Perfil do leitor não localizado na sessão.');
    return;
  }

  const clienteAtualizado = {
    ...clientes[index],
    nome: document.getElementById('cli-nome').value.trim(),
    email: document.getElementById('cli-email').value.trim(),
    senha: document.getElementById('cli-senha').value.trim(),
    telefone: document.getElementById('cli-telefone').value.trim(),
    dataNascimento: document.getElementById('cli-nascimento').value,
    genero: document.getElementById('cli-genero').value,
    enderecos: JSON.parse(JSON.stringify(enderecosTemporarios)),
    cartoes: JSON.parse(JSON.stringify(cartoesTemporarios))
  };

  clientes[index] = clienteAtualizado;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes));

  alert('✅ Seu perfil, endereços e cartões foram atualizados com sucesso!');
  carregarPerfilCliente(CLIENTE_SESSAO_ID);
}