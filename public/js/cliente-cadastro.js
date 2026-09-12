const STORAGE_KEY = '@alexandria:clientes';

// Id do cliente em sessão (Simulação do leitor "Machado de Assis")
const CLIENTE_SESSAO_ID = 'CLI-001';

// Buffers temporários em memória para manipulação das coleções 1:N
let enderecosTemporarios = [];
let cartoesTemporarios = [];

document.addEventListener('DOMContentLoaded', () => {
  carregarPerfilCliente(CLIENTE_SESSAO_ID);

  const form = document.getElementById('form-cliente-publico');
  if (form) {
    form.addEventListener('submit', salvarPerfilCliente);
  }
});

async function carregarPerfilCliente(id) {
  let cliente = null;

  try {
    const res = await fetch(`/api/clientes/${id}`);
    if (res.ok) {
      cliente = await res.json();
    }
  } catch (err) {
    console.warn('API indisponível, usando localStorage');
  }

  if (!cliente) {
    const clientes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    cliente = clientes.find(c => c.id === id || c.codigo === id);
  }

  if (!cliente) return;

  // Preenchimento dos campos escalares do perfil
  document.getElementById('cli-nome').value = cliente.nome || '';
  document.getElementById('cli-cpf').value = cliente.cpf || '';
  document.getElementById('cli-cpf').setAttribute('readonly', 'true'); // CPF imutável
  document.getElementById('cli-email').value = cliente.email || '';
  document.getElementById('cli-senha').value = '********'; // Não expõe hash da senha
  
  if (cliente.telefone) {
    document.getElementById('cli-telefone').value = typeof cliente.telefone === 'object'
      ? `(${cliente.telefone.ddd || '21'}) ${cliente.telefone.numero || ''}`
      : cliente.telefone;
  }
  
  document.getElementById('cli-nascimento').value = cliente.dataNascimento || '';
  document.getElementById('cli-genero').value = cliente.genero || 'Masculino';

  // Deep copy dos dados relacionais para os buffers de memória
  enderecosTemporarios = cliente.enderecos && cliente.enderecos.length > 0
    ? JSON.parse(JSON.stringify(cliente.enderecos))
    : [{ fraseIdentificadora: 'Residência', tipoResidencia: 'Casa', tipoLogradouro: 'Rua', logradouro: '', numero: '', bairro: '', cep: '', cidade: '', estado: 'SP', pais: 'Brasil', finalidade: 'ENTREGA' }];

  cartoesTemporarios = cliente.cartoes && cliente.cartoes.length > 0
    ? JSON.parse(JSON.stringify(cliente.cartoes))
    : [{ numero: '', nomeImpresso: '', bandeira: 'VISA', cvv: '', preferencial: true }];

  renderizarEnderecosPublicos();
  renderizarCartoesPublicos();
}

// Manipulação Dinâmica da Subcoleção de Endereços (1:N)
function adicionarEnderecoPublico() {
  enderecosTemporarios.push({
    fraseIdentificadora: 'Novo Endereço',
    tipoResidencia: 'Casa',
    tipoLogradouro: 'Rua',
    logradouro: '',
    numero: '',
    bairro: '',
    cep: '',
    cidade: '',
    estado: 'SP',
    pais: 'Brasil',
    finalidade: 'ENTREGA'
  });
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
        <strong style="color: var(--palette-navy-dark);">📍 ${end.fraseIdentificadora || `Endereço #${idx + 1}`}</strong>
        <button type="button" onclick="removerEnderecoPublico(${idx})" style="color: #b91c1c; border: none; background: none; cursor: pointer; font-weight: bold; font-size: 0.8rem;">✕ Remover</button>
      </div>
      <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 8px; margin-bottom: 8px;">
        <input type="text" placeholder="Identificador / Frase Curta" value="${end.fraseIdentificadora || ''}" onchange="enderecosTemporarios[${idx}].fraseIdentificadora = this.value" required style="padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
        <input type="text" placeholder="Logradouro (Rua, Av.)" value="${end.logradouro || ''}" onchange="enderecosTemporarios[${idx}].logradouro = this.value" required style="padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
        <input type="text" placeholder="Número" value="${end.numero || ''}" onchange="enderecosTemporarios[${idx}].numero = this.value" required style="padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px;">
        <input type="text" placeholder="Bairro" value="${end.bairro || ''}" onchange="enderecosTemporarios[${idx}].bairro = this.value" required style="padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
        <input type="text" placeholder="CEP" value="${end.cep || ''}" onchange="enderecosTemporarios[${idx}].cep = this.value" required style="padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
        <input type="text" placeholder="Cidade" value="${end.cidade || ''}" onchange="enderecosTemporarios[${idx}].cidade = this.value" required style="padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
        <select onchange="enderecosTemporarios[${idx}].finalidade = this.value" style="padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
          <option value="ENTREGA" ${end.finalidade === 'ENTREGA' ? 'selected' : ''}>Entrega</option>
          <option value="COBRANCA" ${end.finalidade === 'COBRANCA' ? 'selected' : ''}>Cobrança</option>
          <option value="AMBOS" ${end.finalidade === 'AMBOS' ? 'selected' : ''}>Ambos</option>
        </select>
      </div>
    `;
    container.appendChild(div);
  });
}

// Manipulação Dinâmica da Subcoleção de Cartões (1:N)
function adicionarCartaoPublico() {
  cartoesTemporarios.push({ numero: '', nomeImpresso: '', bandeira: 'VISA', cvv: '', preferencial: false });
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
        <strong style="color: var(--palette-navy-dark);">💳 Cartão #${idx + 1} ${card.preferencial ? '⭐ (Preferencial)' : ''}</strong>
        <button type="button" onclick="removerCartaoPublico(${idx})" style="color: #b91c1c; border: none; background: none; cursor: pointer; font-weight: bold; font-size: 0.8rem;">✕ Remover</button>
      </div>
      <div style="display: grid; grid-template-columns: 2fr 2fr 1fr; gap: 8px;">
        <input type="text" placeholder="Número do Cartão" value="${card.numero || ''}" onchange="cartoesTemporarios[${idx}].numero = this.value" required style="padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
        <input type="text" placeholder="Nome Impresso" value="${card.nomeImpresso || ''}" onchange="cartoesTemporarios[${idx}].nomeImpresso = this.value" required style="padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
        <select onchange="cartoesTemporarios[${idx}].bandeira = this.value" style="padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
          <option value="VISA" ${card.bandeira === 'VISA' ? 'selected' : ''}>Visa</option>
          <option value="MASTERCARD" ${card.bandeira === 'MASTERCARD' ? 'selected' : ''}>Mastercard</option>
          <option value="ELO" ${card.bandeira === 'ELO' ? 'selected' : ''}>Elo</option>
          <option value="AMERICAN EXPRESS" ${card.bandeira === 'AMERICAN EXPRESS' ? 'selected' : ''}>American Express</option>
        </select>
      </div>
    `;
    container.appendChild(div);
  });
}

// Persistência das Modificações do Perfil do Leitor (RF0022)
async function salvarPerfilCliente(e) {
  e.preventDefault();

  const telRaw = document.getElementById('cli-telefone').value.trim();
  const telNums = telRaw.replace(/\D/g, '');
  const ddd = telNums.length >= 2 ? telNums.substring(0, 2) : '21';
  const numero = telNums.length >= 2 ? telNums.substring(2) : telRaw;

  const payload = {
    nome: document.getElementById('cli-nome').value.trim(),
    email: document.getElementById('cli-email').value.trim(),
    telefone: { tipo: 'CELULAR', ddd, numero },
    dataNascimento: document.getElementById('cli-nascimento').value,
    genero: document.getElementById('cli-genero').value,
    enderecos: enderecosTemporarios,
    cartoes: cartoesTemporarios
  };

  try {
    const res = await fetch(`/api/clientes/${CLIENTE_SESSAO_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.erro || 'Erro ao atualizar dados');
    alert('✅ Seu perfil, endereços e cartões foram atualizados com sucesso (RF0022)!');
    carregarPerfilCliente(CLIENTE_SESSAO_ID);
  } catch (err) {
    alert(err.message);
  }
}