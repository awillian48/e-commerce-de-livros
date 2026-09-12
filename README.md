# Livraria Alexandria — E-Commerce & Control Center
> **Laboratório de Engenharia de Software (LES 2026)**  
> **Professor:** Rodrigo Rocha Silva  
> **Alunos:** Anderson Barros & João Pedro Scandiuzzi  
> **Repositório:** [awillian48/e-commerce-de-livros](https://github.com/awillian48/e-commerce-de-livros)

---

## Sobre o Projeto

A **Livraria Alexandria** é uma plataforma de comércio eletrônico de livros com foco em arquitetura limpa, alta conformidade aos requisitos do DRS (Documento de Requisitos de Software) e design refinado inspirado no estilo retrô/editorial.

A entrega atual contempla a implementação e homologação do **CRUD Completo de Gestão de Clientes**, cobrindo o ciclo de vida cadastral de usuários, regras de negócio de cartões e endereços, validação rigorosa de senhas fortes e governança contábil na distinção entre inativação e exclusão.

---

## Como Executar

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

## Bateria de Testes Automatizados (Cypress)

O sistema conta com testes automatizados desenvolvidos em **Cypress** com cobertura de 100% dos requisitos do DRS:

### 1. Execução Interativa via Cypress Desktop App (Recomendado)
Para abrir a interface gráfica do Cypress:
```bash
npm run test:e2e:open
```
1. Selecione **E2E Testing**
2. Escolha o navegador desejado (Chrome ou Electron)
3. Clique no arquivo **`crud_cliente.cy.js`**
4. Todos os 10 testes serão executados com visualização em tempo real.

### 2. Execução Automatizada com Navegador Visível (Headed)
Executa a suíte E2E automatizada abrindo o navegador com visualização passo a passo:
```bash
npm run test:headed
```

### 3. Execução em Linha de Comando (Headless / CI)
Executa todos os testes no terminal com relatório detalhado de status e tempo:
```bash
npm run test:e2e
```

### 4. Gravação no Cypress Cloud
Envia a execução para o painel de monitoramento do Cypress Cloud:
```bash
npm run test:record
```

---

## Cobertura de Requisitos do DRS

| Requisito | Descrição | Status |
| :--- | :--- | :---: |
| **RF0021** | Cadastrar cliente com dados pessoais e coleções associadas | Aprovado (100%) |
| **RF0022** | Alterar dados do cliente (com CPF imutável) | Aprovado (100%) |
| **RF0023** | Inativar e reativar cadastro do cliente | Aprovado (100%) |
| **RF0024** | Consulta de clientes com filtros combinados e isolados | Aprovado (100%) |
| **RF0025** | Consulta do histórico de transações/pedidos do cliente | Aprovado (100%) |
| **RF0026** | Cadastro de múltiplos endereços (1:N) com frase identificadora | Aprovado (100%) |
| **RF0027** | Cadastro de múltiplos cartões (1:N) com bandeira e preferencial | Aprovado (100%) |
| **RF0028** | Fluxo isolado para alteração exclusiva de senha | Aprovado (100%) |
| **RN0021/RN0022** | Obrigatoriedade de endereços de Cobrança e Entrega | Aprovado (100%) |
| **RN0023/RN0024** | Composição detalhada de registros de endereços e cartões | Aprovado (100%) |
| **RN0025** | Validação de bandeiras homologadas (Visa, Mastercard, Elo, Amex) | Aprovado (100%) |
| **RN0026** | Telefone composto por Tipo, DDD e Número | Aprovado (100%) |
| **RN0027** | Ranking do cliente de 1 a 5 estrelas | Aprovado (100%) |
| **RNF0031/RNF0032** | Senha forte (mín. 8 caracteres, maiúscula, minúscula, especial) e confirmação | Aprovado (100%) |
| **RNF0033/RNF0035** | Hash criptográfico SHA-256 e código sequencial único `CLI-XXX` | Aprovado (100%) |
| **Distinção Crítica** | Bloqueio de exclusão física para clientes com pedidos (auditoria fiscal) | Aprovado (100%) |

---

## Documentos do Projeto

- [Documentação Técnica Completa do CRUD](DOCUMENTACAO_COMPLETA_CRUD_CLIENTE.md)
- [Roteiro e Estrutura de Apresentação](APRESENTACAO_PPT_LES_2026.md)
- Documento de Requisitos: `DRS_LES_2_2026.docx`
- Estimativas do Projeto: `Estimativa - Anderson e João Scandiuzzi.xlsx`
