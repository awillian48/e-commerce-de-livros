let valorFreteGlobal = 0.00;

document.addEventListener('DOMContentLoaded', () => {
  const inputQtd = document.getElementById('qtd-item');
  const btnCalcularFrete = document.getElementById('btn-frete');

  atualizarValores();

  if (inputQtd) {
    inputQtd.addEventListener('change', atualizarValores);
  }

  if (btnCalcularFrete) {
    btnCalcularFrete.addEventListener('click', (e) => {
      e.preventDefault();
      const inputCep = document.getElementById('cep-input');
      const elValorFrete = document.getElementById('valor-frete');
      if (!inputCep) return;

      const cepLimpo = inputCep.value.replace(/\D/g, '');
      if (cepLimpo.length === 8) {
        valorFreteGlobal = 15.00; // Simulação de valor fixo de frete
        if (elValorFrete) {
          elValorFrete.textContent = `R$ ${valorFreteGlobal.toFixed(2).replace('.', ',')}`;
        }
        atualizarValores();
      } else {
        alert('Informe um CEP válido com 8 dígitos (ex: 01000-000 ou 01000000).');
      }
    });
  }
});

function atualizarValores() {
  const inputQtd = document.getElementById('qtd-item');
  const elSubtotal = document.getElementById('subtotal-item');
  const elTotal = document.getElementById('total-carrinho');
  const precoUnitario = 45.90;
  const qtd = parseInt(inputQtd ? inputQtd.value : 1, 10) || 1;
  const subtotal = precoUnitario * qtd;
  const total = subtotal + valorFreteGlobal;

  if (elSubtotal) elSubtotal.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
  if (elTotal) elTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

function removerItem(btn) {
  const tr = btn.closest('tr');
  if (tr) tr.remove();

  const tbody = document.querySelector('tbody');
  const itensRestantes = tbody ? tbody.querySelectorAll('tr').length : 0;

  if (itensRestantes === 0) {
    valorFreteGlobal = 0.00;
    atualizarValores();
  }
}