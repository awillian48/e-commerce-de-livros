# 🛡️ Livraria Alexandria — E-Commerce & Control Center
> **Laboratório de Engenharia de Software (LES 2026)**  
> **Professor:** Rodrigo Rocha Silva  
> **Alunos:** Anderson Barros & João Pedro Scandiuzzi  
> **Repositório:** [awillian48/e-commerce-de-livros](https://github.com/awillian48/e-commerce-de-livros)

---

## 📌 Sobre o Projeto

A **Livraria Alexandria** é uma plataforma completa de comércio eletrônico de livros com foco em arquitetura limpa, alta conformidade aos requisitos do DRS (Documento de Requisitos de Software) e design refinado inspirado no estilo retrô/editorial.

A entrega atual contempla a implementação e homologação do **CRUD Completo de Gestão de Clientes**, cobrindo o ciclo de vida cadastral de usuários, regras de negócio de cartões e endereços, validação rigorosa de senhas fortes e governança contábil na distinção entre inativação e exclusão.

---

## 🚀 Como Executar

### 1. Pré-requisitos
- Node.js instalado (v18+)

### 2. Instalação das Dependências
```bash
npm install
```

### 3. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
O servidor iniciará em `http://localhost:3000`.

---

## 🧪 Bateria de Testes Automatizados (Cypress)

O sistema conta com testes automatizados desenvolvidos em **Cypress** com cobertura de 100% dos requisitos do DRS:

### 🌟 1. Direto pelo App do Cypress (Recomendado)
Com o Cypress App já aberto:
1. No Cypress, selecione ou adicione a pasta deste projeto:
   `C:\Users\anderson.barros\.gemini\antigravity-ide\scratch\e-commerce-de-livros`
2. Clique em **E2E Testing**
3. Escolha o navegador (Chrome ou Electron)
4. Clique na spec **`crud_cliente.cy.js`**
5. Todos os 10 testes serão executados visualmente e passo a passo!

*Para abrir o app do Cypress via npm (se necessário):*
```bash
npm run cypress:open
```

### 💻 2. Cypress Headed (Janela Automatizada)
Executa a suíte E2E automatizada pelo Cypress com o navegador visível em velocidade controlada:
```bash
npm run test:headed
```

### ⚙️ 3. Cypress Headless (Modo CI / Terminal)
Executa todos os 10 testes no terminal com relatório detalhado:
```bash
npm run test:e2e
```

---

## 📋 Cobertura de Requisitos do DRS

| Requisito | Descrição | Status |
| :--- | :--- | :---: |
| **RF0021** | Cadastrar cliente com dados pessoais e coleções associadas | ✅ 100% |
| **RF0022** | Alterar dados do cliente (com CPF imutável) | ✅ 100% |
| **RF0023** | Inativar e reativar cadastro do cliente | ✅ 100% |
| **RF0024** | Consulta de clientes com filtros combinados e isolados | ✅ 100% |
| **RF0025** | Consulta do histórico de transações/pedidos do cliente | ✅ 100% |
| **RF0026** | Cadastro de múltiplos endereços (1:N) com frase identificadora | ✅ 100% |
| **RF0027** | Cadastro de múltiplos cartões (1:N) com bandeira e preferencial | ✅ 100% |
| **RF0028** | Fluxo isolado para alteração exclusiva de senha | ✅ 100% |
| **RN0021/RN0022** | Obrigatoriedade de endereços de Cobrança e Entrega | ✅ 100% |
| **RN0023/RN0024** | Composição detalhada de registros de endereços e cartões | ✅ 100% |
| **RN0025** | Validação de bandeiras homologadas (Visa, Mastercard, Elo, Amex) | ✅ 100% |
| **RN0026** | Telefone composto por Tipo, DDD e Número | ✅ 100% |
| **RN0027** | Ranking do cliente de 1 a 5 estrelas | ✅ 100% |
| **RNF0031/RNF0032** | Senha forte (mín. 8 chars, maiúscula, minúscula, especial) e confirmação | ✅ 100% |
| **RNF0033/RNF0035** | Hash criptográfico SHA-256 e código sequencial único `CLI-XXX` | ✅ 100% |
| **Distinção Crítica** | Bloqueio de exclusão física para clientes com pedidos (auditoria fiscal) | ✅ 100% |

---

## 📂 Documentos Importantes

- 📘 [Documentação Técnica Completa do CRUD](DOCUMENTACAO_COMPLETA_CRUD_CLIENTE.md)
- 📊 [Roteiro e Slides para Apresentação em Sala de Aula](APRESENTACAO_PPT_LES_2026.md)
- 📄 Documento de Requisitos: `DRS_LES_2_2026.docx`
- 📈 Estimativas do Projeto: `Estimativa - Anderson e João Scandiuzzi.xlsx`
