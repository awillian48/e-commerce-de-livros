# 📋 Especificação Completa de Tarefas — Desk Manager (App Projeto)

> **Destinado a:** Agente / IA Executora conectada ao MCP `desk-integrations`
> **Projeto:** E-Commerce de Livros Clássicos — Livraria Alexandria (LES 2026)
> **Desenvolvedor Responsável:** Anderson Barros
> **Total de Tarefas:** 37 (33 Concluídas | 4 Backlog)

---

## 🤖 Guia de Execução para a IA (Fluxo MCP Desk Manager)

Se você for uma IA executando este processo via MCP `desk-integrations`, siga esta sequência padrão:

1. **Obter ID do Operador Responsável:**
   - Chame a tool `lista_de_operadores` com `{"body": {"Pesquisa": "Anderson Barros", "Ativo": "1"}}`.
   - Guarde a `Chave` do operador retornado (`CodOperador`).

2. **Criar o Projeto na Desk Manager:**
   - Chame a tool `salvar_projetos_simples` com o seguinte payload:
   ```json
   {
     "body": {
       "TProjeto": {
         "Chave": "",
         "Nome": "E-Commerce de Livros Clássicos — Livraria Alexandria (LES 2026)",
         "Descricao": "E-Commerce especializado em livros clássicos (LES 2026 FATEC). Desenvolvedor: Anderson Barros.",
         "CodGerente": "<CodOperador>",
         "TipoFim": "P",
         "Previsto": "160",
         "DataPrevista": "10-12-2026",
         "Concluido": "N"
       },
       "TProjetoOperadoresVinculo": {
         "CodOperador": ["<CodOperador>"]
       }
     }
   }
   ```
   - O retorno conterá a `Chave` do projeto criado (`CodProjeto`).

3. **Identificar as Colunas / Status do Projeto:**
   - Chame `dados_de_um_projetos` com `{"body": {"Chave": "<CodProjeto>"}}`.
   - Inspecione a lista `TProjetoStatus` para mapear os IDs de cada coluna do quadro:
     - Coluna: **Backlog (Sprint 5)** (Ordem 1)
     - Coluna: **Arquitetura & Concepção (Sprint 1)** (Ordem 2)
     - Coluna: **CRUD de Clientes - CDU02 (Sprint 2)** (Ordem 3)
     - Coluna: **Vendas & Checkout - CDU03 (Sprint 3)** (Ordem 4)
     - Coluna: **Trocas & Logística Reversa - CDU04 (Sprint 4)** (Ordem 5)

4. **Criar as Tarefas com Subtasks/Checklist:**
   - Para cada uma das tarefas listadas abaixo, chame `salvar_tarefas_completa`:
   ```json
   {
     "body": {
       "TTarefa": {
         "Chave": "",
         "CodProjeto": "<CodProjeto>",
         "CodProjetoStatus": "<CodStatusDaColuna>",
         "CodOperador": "<CodOperador>",
         "Titulo": "<Titulo da Tarefa>",
         "Descricao": "<Descricao com regras e DRS>",
         "DataVencimento": "23-10-2026",
         "HoraVencimento": "18:00",
         "HorasPrevistas": "<Horas>",
         "PConcluido": "<100 ou 0>",
         "Labels": "<Tags separadas por virgula>",
         "Template": "off"
       },
       "TProjetoCheckList": [
         {
           "Chave": "",
           "Grupo": "Critérios de Aceitação",
           "Concluida": "<1 ou 0>",
           "Titulo": "<Item do Checklist>",
           "DtEntrega": "23-10-2026"
         }
       ]
     }
   }
   ```

---

## 📊 Tabela Resumo das 37 Tarefas

| ID | Sprint | Título da Tarefa | Coluna no Kanban | Horas | Prioridade | Status |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| **`arq-01-arquitetura-e-modelagem-c4`** | Sprint 1 | Arquitetura do Sistema e Modelagem C4 | Arquitetura & Concepção (Sprint 1) | 16h | High | ✅ Concluído |
| **`arq-02-modelagem-relacional-postgresql`** | Sprint 1 | Modelagem Relacional e DDL no Supabase | Arquitetura & Concepção (Sprint 1) | 12h | Critical | ✅ Concluído |
| **`des-01-design-system-e-prototipo`** | Sprint 1 | Design System e Protótipo de Alta Fidelidade | Arquitetura & Concepção (Sprint 1) | 12h | Medium | ✅ Concluído |
| **`dta-01-script-seed-acervo-livros`** | Sprint 1 | Script de Seed e Carga de Dados do Acervo | Arquitetura & Concepção (Sprint 1) | 12h | Medium | ✅ Concluído |
| **`cli-01-cadastro-cliente-cpf-unico`** | Sprint 2 | Cadastro de Clientes e Validação de CPF Único (RF0021, RF0024) | CRUD de Clientes - CDU02 (Sprint 2) | 8h | Critical | ✅ Concluído |
| **`cli-02-composicao-obrigatoria-enderecos`** | Sprint 2 | Composição Obrigatória de Endereços com 10 Campos (RN0023) | CRUD de Clientes - CDU02 (Sprint 2) | 8h | High | ✅ Concluído |
| **`cli-03-gestao-cartoes-preferencial`** | Sprint 2 | Gestão de Cartões e Cartão Preferencial (RF0027, RN0024, RN0025) | CRUD de Clientes - CDU02 (Sprint 2) | 8h | High | ✅ Concluído |
| **`cli-04-validacao-senha-forte`** | Sprint 2 | Validação de Complexidade de Senha Forte (RNF0031, RNF0032) | CRUD de Clientes - CDU02 (Sprint 2) | 8h | High | ✅ Concluído |
| **`cli-05-criptografia-senha-bcrypt`** | Sprint 2 | Armazenamento Criptografado com Hash Seguro (RNF0033) | CRUD de Clientes - CDU02 (Sprint 2) | 8h | Critical | ✅ Concluído |
| **`cli-06-consulta-alteracao-inativacao`** | Sprint 2 | Consulta, Alteração e Inativação Lógica de Clientes (RF0022, RF0024, RF0025) | CRUD de Clientes - CDU02 (Sprint 2) | 8h | Medium | ✅ Concluído |
| **`cli-07-testes-cypress-crud-cliente`** | Sprint 2 | Suíte Automatizada E2E do Módulo de Clientes | CRUD de Clientes - CDU02 (Sprint 2) | 12h | High | ✅ Concluído |
| **`ped-01-gestao-itens-carrinho`** | Sprint 3 | Gestão Completa de Itens no Carrinho (RF0031, RF0032) | Vendas & Checkout - CDU03 (Sprint 3) | 8h | High | ✅ Concluído |
| **`ped-02-validacao-impeditiva-estoque`** | Sprint 3 | Validação Impeditiva de Estoque Físico (RN0031) | Vendas & Checkout - CDU03 (Sprint 3) | 8h | Critical | ✅ Concluído |
| **`ped-03-transicao-carrinho-checkout`** | Sprint 3 | Início da Realização de Compra (RF0033) | Vendas & Checkout - CDU03 (Sprint 3) | 8h | High | ✅ Concluído |
| **`ped-04-calculo-frete-regional-peso`** | Sprint 3 | Cálculo de Frete Regional por Peso e UF (RF0034) | Vendas & Checkout - CDU03 (Sprint 3) | 8h | High | ✅ Concluído |
| **`ped-05-selecao-e-novo-endereco-checkout`** | Sprint 3 | Seleção e Cadastro de Endereço no Checkout (RF0035, RN0023) | Vendas & Checkout - CDU03 (Sprint 3) | 8h | High | ✅ Concluído |
| **`ped-06-modal-centralizado-cartao-foco`** | Sprint 3 | Modal Centralizado de Cartão de Crédito e Foco (RN0024, RN0025) | Vendas & Checkout - CDU03 (Sprint 3) | 8h | Medium | ✅ Concluído |
| **`ped-07-pagamento-multiplos-cartoes-minimo-10`** | Sprint 3 | Pagamento com Múltiplos Cartões e Mínimo R$ 10,00 (RF0036, RN0034) | Vendas & Checkout - CDU03 (Sprint 3) | 12h | Critical | ✅ Concluído |
| **`ped-08-limite-cupom-promocional`** | Sprint 3 | Limite Estrito de 1 Cupom Promocional por Compra (RF0037, RN0033) | Vendas & Checkout - CDU03 (Sprint 3) | 8h | High | ✅ Concluído |
| **`ped-09-excecao-cupom-cartao-menor-10`** | Sprint 3 | Exceção de Cupom com Cartão Menor que R$ 10,00 (RN0035) | Vendas & Checkout - CDU03 (Sprint 3) | 8h | High | ✅ Concluído |
| **`ped-10-cupons-troca-bloqueio-troco`** | Sprint 3 | Cupons de Troca, Bloqueio Redundante e Troco (RN0036) | Vendas & Checkout - CDU03 (Sprint 3) | 8h | Critical | ✅ Concluído |
| **`ped-11-fechamento-pedido-em-processamento`** | Sprint 3 | Fechamento do Pedido com Status 'EM PROCESSAMENTO' (RF0038) | Vendas & Checkout - CDU03 (Sprint 3) | 8h | Critical | ✅ Concluído |
| **`ped-12-auditoria-logs-tempo-resposta`** | Sprint 3 | Auditoria de Transações e Tempo de Resposta (RNF0011, RNF0012) | Vendas & Checkout - CDU03 (Sprint 3) | 8h | Medium | ✅ Concluído |
| **`ped-13-suite-cypress-8-testes-hud`** | Sprint 3 | Suíte Cypress E2E com 8 Cenários, Slow Motion e HUD Visual | Vendas & Checkout - CDU03 (Sprint 3) | 12h | Critical | ✅ Concluído |
| **`ped-14-plano-de-testes-oficial`** | Sprint 3 | Elaboração do Plano de Testes Oficial (Word .docx) | Vendas & Checkout - CDU03 (Sprint 3) | 8h | High | ✅ Concluído |
| **`log-01-despacho-transporte-rastreio`** | Sprint 4 | Despacho, Transporte e Confirmação de Entrega (RF0039, RF0040) | Trocas & Logística Reversa - CDU04 (Sprint 4) | 8h | Medium | ✅ Concluído |
| **`trc-01-modelagem-tabela-trocas-supabase`** | Sprint 4 | Modelagem de Dados e DDL de Trocas no Supabase (CDU04) | Trocas & Logística Reversa - CDU04 (Sprint 4) | 8h | Critical | ✅ Concluído |
| **`trc-02-interface-cliente-solicitacao-troca`** | Sprint 4 | Interface do Cliente para Solicitação de Troca (RF0041) | Trocas & Logística Reversa - CDU04 (Sprint 4) | 8h | High | ✅ Concluído |
| **`trc-03-fluxo-admin-autorizacao-postagem`** | Sprint 4 | Fluxo Administrativo de Autorização e Código de Postagem (RF0042) | Trocas & Logística Reversa - CDU04 (Sprint 4) | 8h | High | ✅ Concluído |
| **`trc-04-conferencia-fisica-recebimento-estoque`** | Sprint 4 | Conferência Física e Recebimento de Produtos (RF0043) | Trocas & Logística Reversa - CDU04 (Sprint 4) | 8h | Medium | ✅ Concluído |
| **`trc-05-reincorporacao-ao-estoque-ou-descarte`** | Sprint 4 | Reincorporação ao Estoque ou Descarte de Avarias (RF0044) | Trocas & Logística Reversa - CDU04 (Sprint 4) | 8h | Medium | ✅ Concluído |
| **`trc-06-emissao-credito-cupom-troca-cliente`** | Sprint 4 | Emissão e Crédito Automático de Cupom de Troca (RF0045) | Trocas & Logística Reversa - CDU04 (Sprint 4) | 8h | Critical | ✅ Concluído |
| **`trc-07-testes-cypress-ciclo-trocas`** | Sprint 4 | Suíte Cypress E2E para o Fluxo Completo de Trocas | Trocas & Logística Reversa - CDU04 (Sprint 4) | 16h | High | ✅ Concluído |
| **`adm-01-cadastro-gestao-fornecedores`** | Sprint 5 | Módulo de Cadastro e Gestão de Fornecedores (CDU01, RF0081-RF0085) | Backlog (Sprint 5) | 16h | Medium | ⏳ Backlog |
| **`bi-01-hub-grafico-linhas-temporal-vendas`** | Sprint 5 | Hub de BI com Gráfico Temporal de Vendas (RF0055, RN0071) | Backlog (Sprint 5) | 16h | High | ⏳ Backlog |
| **`bi-02-filtros-analiticos-multidimensionais`** | Sprint 5 | Filtros Analíticos por Categoria, Autor e Região (RF0056) | Backlog (Sprint 5) | 16h | Medium | ⏳ Backlog |
| **`bi-03-exportacao-relatorios-pdf-excel`** | Sprint 5 | Exportação de Relatórios Gerenciais de Vendas (RF0058) | Backlog (Sprint 5) | 16h | Low | ⏳ Backlog |

---

## 📝 Detalhamento Individual de Cada Tarefa

### 1. ✅ [arq-01-arquitetura-e-modelagem-c4] Arquitetura do Sistema e Modelagem C4

- **Sprint:** Sprint 1: Arquitetura & Concepção
- **Coluna no Kanban:** `Arquitetura & Concepção (Sprint 1)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** High
- **Horas Previstas:** 16h
- **Labels / Tags:** `arquitetura, sprint-1, node, express`

#### 🎯 Descrição / Objetivo:
> Estruturar a arquitetura base da Livraria Alexandria adotando arquitetura em camadas (MVC/Service/Repository) com Node.js (ESM), Express.js e banco de dados relacional.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] Definição de modelo de componentes e containers (C4 Model).
- [x] Estrutura modular de rotas (`src/routes/`), repositórios (`src/data/`) e regras de domínio (`src/domain/`).
- [x] Configuração de pipeline de CI/CD para deploy contínuo no Render.

---

### 2. ✅ [arq-02-modelagem-relacional-postgresql] Modelagem Relacional e DDL no Supabase

- **Sprint:** Sprint 1: Arquitetura & Concepção
- **Coluna no Kanban:** `Arquitetura & Concepção (Sprint 1)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** Critical
- **Horas Previstas:** 12h
- **Labels / Tags:** `banco-de-dados, supabase, postgresql, ddl`

#### 🎯 Descrição / Objetivo:
> Modelar o schema relacional PostgreSQL no Supabase com tabelas normalizadas e restrições de integridade referencial.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] Criação das tabelas: `livros`, `clientes`, `enderecos`, `cartoes_cliente`, `pedidos`, `itens_pedido`, `cupons` e `logs_transacoes`.
- [x] Chaves primárias UUID/Serial e chaves estrangeiras com `ON DELETE RESTRICT` para integridade contábil.
- [x] Fallback local e espelho SQLite resiliente para garantir disponibilidade em testes.

---

### 3. ✅ [des-01-design-system-e-prototipo] Design System e Protótipo de Alta Fidelidade

- **Sprint:** Sprint 1: Arquitetura & Concepção
- **Coluna no Kanban:** `Arquitetura & Concepção (Sprint 1)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** Medium
- **Horas Previstas:** 12h
- **Labels / Tags:** `ui-ux, design-system, css, prototipo`

#### 🎯 Descrição / Objetivo:
> Desenvolver a identidade visual refinada da Livraria Alexandria inspirada em livrarias clássicas, tipografia serifada e responsividade completa.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] Paleta oficial de cores: Borgonha Clássico (`#8B0000`), Dourado Antigo (`#DAA520`) e Pergaminho (`#FDFBF7`).
- [x] Telas desenhadas e prototipadas: Vitrine, Detalhes, Carrinho, Checkout, Modais e Painel do Cliente.

---

### 4. ✅ [dta-01-script-seed-acervo-livros] Script de Seed e Carga de Dados do Acervo

- **Sprint:** Sprint 1: Arquitetura & Concepção
- **Coluna no Kanban:** `Arquitetura & Concepção (Sprint 1)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** Medium
- **Horas Previstas:** 12h
- **Labels / Tags:** `seed, dados, popular-banco`

#### 🎯 Descrição / Objetivo:
> Construir script de população de banco para inicializar acervo com obras de Dom Casmurro, Memórias Póstumas de Brás Cubas, O Cortiço, A Relíquia e outros clássicos.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] Script `popular-banco-completo.js` populando livros, preços unitários e estoque físico inicial.
- [x] Carga de cupons promocionais e de troca para validação das regras de negócio.

---

### 5. ✅ [cli-01-cadastro-cliente-cpf-unico] Cadastro de Clientes e Validação de CPF Único (RF0021, RF0024)

- **Sprint:** Sprint 2: CRUD de Clientes (CDU02)
- **Coluna no Kanban:** `CRUD de Clientes - CDU02 (Sprint 2)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** Critical
- **Horas Previstas:** 8h
- **Labels / Tags:** `clientes, rf0021, cpf, sprint-2`

#### 🎯 Descrição / Objetivo:
> Implementar o formulário completo de cadastro de clientes com validação rigorosa de CPF válido e garantia de unicidade no banco de dados.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] Validação algorítmica dos dígitos verificadores do CPF.
- [x] Bloqueio impeditivo caso o CPF já esteja cadastrado na base (retornando status 422).
- [x] Armazenamento de dados pessoais obrigatórios (Nome, Gênero, Data Nasc, Telefone, E-mail).

---

### 6. ✅ [cli-02-composicao-obrigatoria-enderecos] Composição Obrigatória de Endereços com 10 Campos (RN0023)

- **Sprint:** Sprint 2: CRUD de Clientes (CDU02)
- **Coluna no Kanban:** `CRUD de Clientes - CDU02 (Sprint 2)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** High
- **Horas Previstas:** 8h
- **Labels / Tags:** `clientes, rn0023, enderecos, cep`

#### 🎯 Descrição / Objetivo:
> Implementar a regra RN0023 exigindo a composição de 10 campos obrigatórios para cada endereço cadastrado no perfil do cliente.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] Campos obrigatórios: Frase Identificadora, Tipo Residência, Tipo Logradouro, Logradouro, Número, Bairro, CEP (8 dígitos), Cidade, UF válida e País.
- [x] Suporte à classificação: Residencial, Entrega e Cobrança.

---

### 7. ✅ [cli-03-gestao-cartoes-preferencial] Gestão de Cartões e Cartão Preferencial (RF0027, RN0024, RN0025)

- **Sprint:** Sprint 2: CRUD de Clientes (CDU02)
- **Coluna no Kanban:** `CRUD de Clientes - CDU02 (Sprint 2)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** High
- **Horas Previstas:** 8h
- **Labels / Tags:** `clientes, cartoes, rn0024, rn0025`

#### 🎯 Descrição / Objetivo:
> Cadastrar múltiplos cartões no perfil do cliente com identificação do preferencial e validação de bandeiras homologadas.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] Validação de bandeiras autorizadas: VISA, MASTERCARD, ELO, AMERICAN EXPRESS (RN0025).
- [x] Máscara e validação de 13 a 19 dígitos e código de segurança CVV (RN0024).
- [x] Marcação unívoca do cartão preferencial na carteira do cliente.

---

### 8. ✅ [cli-04-validacao-senha-forte] Validação de Complexidade de Senha Forte (RNF0031, RNF0032)

- **Sprint:** Sprint 2: CRUD de Clientes (CDU02)
- **Coluna no Kanban:** `CRUD de Clientes - CDU02 (Sprint 2)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** High
- **Horas Previstas:** 8h
- **Labels / Tags:** `seguranca, rnf0031, rnf0032, senha`

#### 🎯 Descrição / Objetivo:
> Garantir que toda senha cadastrada atenda aos requisitos não funcionais de segurança da informação da FATEC.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] RNF0031: Mínimo de 8 caracteres, contendo letras maiúsculas, minúsculas e caractere especial.
- [x] RNF0032: Confirmação de senha obrigatória com digitação dupla estritamente coincidente.
- [x] Indicador visual de força de senha no formulário.

---

### 9. ✅ [cli-05-criptografia-senha-bcrypt] Armazenamento Criptografado com Hash Seguro (RNF0033)

- **Sprint:** Sprint 2: CRUD de Clientes (CDU02)
- **Coluna no Kanban:** `CRUD de Clientes - CDU02 (Sprint 2)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** Critical
- **Horas Previstas:** 8h
- **Labels / Tags:** `seguranca, rnf0033, bcrypt, hash`

#### 🎯 Descrição / Objetivo:
> Proteger as senhas de clientes no banco Supabase utilizando algoritmo de hash com salt.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] Senhas nunca salvas em texto puro.
- [x] Aplicação de algoritmo BCrypt com fator de custo calibrado.
- [x] Comparação segura de senhas no login.

---

### 10. ✅ [cli-06-consulta-alteracao-inativacao] Consulta, Alteração e Inativação Lógica de Clientes (RF0022, RF0024, RF0025)

- **Sprint:** Sprint 2: CRUD de Clientes (CDU02)
- **Coluna no Kanban:** `CRUD de Clientes - CDU02 (Sprint 2)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** Medium
- **Horas Previstas:** 8h
- **Labels / Tags:** `clientes, rf0022, rf0025, crud`

#### 🎯 Descrição / Objetivo:
> Completar o ciclo de vida do cliente com busca por filtros, atualização de cadastro e desativação lógica preservando histórico.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] Consulta de cliente por CPF com carregamento dos endereços e cartões.
- [x] Atualização de dados cadastrais com validação prévia.
- [x] Inativação lógica (`status = 'INATIVO'`) sem deleção física no banco.

---

### 11. ✅ [cli-07-testes-cypress-crud-cliente] Suíte Automatizada E2E do Módulo de Clientes

- **Sprint:** Sprint 2: CRUD de Clientes (CDU02)
- **Coluna no Kanban:** `CRUD de Clientes - CDU02 (Sprint 2)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** High
- **Horas Previstas:** 12h
- **Labels / Tags:** `cypress, e2e, testes, crud-cliente`

#### 🎯 Descrição / Objetivo:
> Implementar testes automatizados Cypress cobrindo cadastro com dados válidos, bloqueio de CPF duplicado e regras de senha.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] Arquivo `cypress/e2e/crud_cliente.cy.js` executando com sucesso.
- [x] Cobertura de cenários felizes e caminhos de exceção.

---

### 12. ✅ [ped-01-gestao-itens-carrinho] Gestão Completa de Itens no Carrinho (RF0031, RF0032)

- **Sprint:** Sprint 3: Vendas & Checkout (CDU03)
- **Coluna no Kanban:** `Vendas & Checkout - CDU03 (Sprint 3)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** High
- **Horas Previstas:** 8h
- **Labels / Tags:** `vendas, carrinho, rf0031, rf0032`

#### 🎯 Descrição / Objetivo:
> Permitir adicionar múltiplos livros, alterar quantidade na vitrine e no carrinho, e remover itens com recálculo instantâneo de totais.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] Adição de múltiplos produtos com persistência em LocalStorage sincronizado.
- [x] Edição de quantidade com botões de incremento/decremento e input manual.
- [x] Recálculo dinâmico de subtotais e atualização do badge do carrinho no cabeçalho.

---

### 13. ✅ [ped-02-validacao-impeditiva-estoque] Validação Impeditiva de Estoque Físico (RN0031)

- **Sprint:** Sprint 3: Vendas & Checkout (CDU03)
- **Coluna no Kanban:** `Vendas & Checkout - CDU03 (Sprint 3)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** Critical
- **Horas Previstas:** 8h
- **Labels / Tags:** `vendas, estoque, rn0031, validacao`

#### 🎯 Descrição / Objetivo:
> Impedir a adição ou alteração de quantidade no carrinho superior ao estoque físico disponível no banco.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] Limitação do input numérico ao valor máximo em estoque.
- [x] Alerta impeditivo caso o usuário tente forçar adição além da capacidade.
- [x] Validação redundante no backend (`POST /api/carrinho/validar`).

---

### 14. ✅ [ped-03-transicao-carrinho-checkout] Início da Realização de Compra (RF0033)

- **Sprint:** Sprint 3: Vendas & Checkout (CDU03)
- **Coluna no Kanban:** `Vendas & Checkout - CDU03 (Sprint 3)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** High
- **Horas Previstas:** 8h
- **Labels / Tags:** `vendas, checkout, rf0033`

#### 🎯 Descrição / Objetivo:
> Iniciar o processo de compra a partir do carrinho, transportando o estado do pedido para a página de checkout.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] Botão "Finalizar Compra" valida existência de itens e redireciona para `/checkout.html`.
- [x] Carregamento automático do resumo de itens, quantidades e subtotais no checkout.

---

### 15. ✅ [ped-04-calculo-frete-regional-peso] Cálculo de Frete Regional por Peso e UF (RF0034)

- **Sprint:** Sprint 3: Vendas & Checkout (CDU03)
- **Coluna no Kanban:** `Vendas & Checkout - CDU03 (Sprint 3)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** High
- **Horas Previstas:** 8h
- **Labels / Tags:** `vendas, frete, rf0034, regras-negocio`

#### 🎯 Descrição / Objetivo:
> Implementar a fórmula de frete regional no módulo de domínio `calcularFrete(itens, uf)`.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] Tarifa base por região: Sudeste (R$ 10,00), Sul (R$ 14,00), Centro-Oeste (R$ 16,00), Nordeste (R$ 20,00) e Norte (R$ 25,00).
- [x] Acréscimo variável de R$ 3,00 por kg do peso total dos itens.
- [x] Exibição transparente do critério de frete ao cliente.

---

### 16. ✅ [ped-05-selecao-e-novo-endereco-checkout] Seleção e Cadastro de Endereço no Checkout (RF0035, RN0023)

- **Sprint:** Sprint 3: Vendas & Checkout (CDU03)
- **Coluna no Kanban:** `Vendas & Checkout - CDU03 (Sprint 3)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** High
- **Horas Previstas:** 8h
- **Labels / Tags:** `vendas, checkout, enderecos, rf0035`

#### 🎯 Descrição / Objetivo:
> Permitir ao cliente selecionar um endereço previamente salvo ou cadastrar um novo endereço diretamente no fluxo de fechamento.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] Listagem dos endereços de entrega vinculados ao perfil do cliente.
- [x] Opção "Adicionar novo endereço" com salvamento no perfil e recálculo imediato do frete.

---

### 17. ✅ [ped-06-modal-centralizado-cartao-foco] Modal Centralizado de Cartão de Crédito e Foco (RN0024, RN0025)

- **Sprint:** Sprint 3: Vendas & Checkout (CDU03)
- **Coluna no Kanban:** `Vendas & Checkout - CDU03 (Sprint 3)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** Medium
- **Horas Previstas:** 8h
- **Labels / Tags:** `ui-ux, modal, cartao, foco`

#### 🎯 Descrição / Objetivo:
> Garantir experiência visual de excelência no modal de cadastro de novo cartão, posicionado centralizadamente no viewport.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] Posicionamento fixo central (`top: 50%; left: 50%; transform: translate(-50%, -50%)`).
- [x] Backdrop escuro com scroll lock e scroll automático para centralização de campos em foco.
- [x] Validação das 4 bandeiras homologadas (VISA, Mastercard, Elo, Amex).

---

### 18. ✅ [ped-07-pagamento-multiplos-cartoes-minimo-10] Pagamento com Múltiplos Cartões e Mínimo R$ 10,00 (RF0036, RN0034)

- **Sprint:** Sprint 3: Vendas & Checkout (CDU03)
- **Coluna no Kanban:** `Vendas & Checkout - CDU03 (Sprint 3)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** Critical
- **Horas Previstas:** 12h
- **Labels / Tags:** `vendas, pagamento, rn0034, multiplos-cartoes`

#### 🎯 Descrição / Objetivo:
> Permitir a divisão do pagamento em múltiplos cartões de crédito exigindo valor mínimo de R$ 10,00 por cartão.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] Rateio de valores entre Cartão 1 e Cartão 2.
- [x] Rejeição impeditiva de valores inferiores a R$ 10,00 (ex.: R$ 9,99 rejeitado).
- [x] Soma dos cartões exatamente igual ao total a pagar.

---

### 19. ✅ [ped-08-limite-cupom-promocional] Limite Estrito de 1 Cupom Promocional por Compra (RF0037, RN0033)

- **Sprint:** Sprint 3: Vendas & Checkout (CDU03)
- **Coluna no Kanban:** `Vendas & Checkout - CDU03 (Sprint 3)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** High
- **Horas Previstas:** 8h
- **Labels / Tags:** `vendas, cupons, rn0033, promocional`

#### 🎯 Descrição / Objetivo:
> Garantir a regra RN0033 que impede a aplicação simultânea de mais de um cupom promocional no mesmo pedido.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] Ao tentar adicionar um segundo cupom promocional, o sistema bloqueia e exibe aviso impeditivo.
- [x] Aplicação correta de abatimento financeiro do cupom no subtotal.

---

### 20. ✅ [ped-09-excecao-cupom-cartao-menor-10] Exceção de Cupom com Cartão Menor que R$ 10,00 (RN0035)

- **Sprint:** Sprint 3: Vendas & Checkout (CDU03)
- **Coluna no Kanban:** `Vendas & Checkout - CDU03 (Sprint 3)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** High
- **Horas Previstas:** 8h
- **Labels / Tags:** `vendas, cupons, rn0035, regra-negocio`

#### 🎯 Descrição / Objetivo:
> Permitir que um cartão assuma valor inferior a R$ 10,00 caso esteja cobrindo o saldo residual de cupons.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] Se cupom cobre a quase totalidade e resta saldo menor que R$ 10 (ex.: R$ 4,00), o cartão é autorizado.
- [x] Validação em `regrasPedido.js` via constante `excecaoRN0035`.

---

### 21. ✅ [ped-10-cupons-troca-bloqueio-troco] Cupons de Troca, Bloqueio Redundante e Troco (RN0036)

- **Sprint:** Sprint 3: Vendas & Checkout (CDU03)
- **Coluna no Kanban:** `Vendas & Checkout - CDU03 (Sprint 3)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** Critical
- **Horas Previstas:** 8h
- **Labels / Tags:** `vendas, cupons-troca, rn0036, troco`

#### 🎯 Descrição / Objetivo:
> Permitir múltiplos cupons de troca, bloqueando cupons desnecessários e gerando novo cupom de troca caso haja valor excedente.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] Múltiplos cupons de troca permitidos na mesma compra.
- [x] Bloqueio de cupons desnecessários cujos valores excedam a compra antes de sua inclusão.
- [x] Emissão de novo cupom de troca com o saldo do troco.

---

### 22. ✅ [ped-11-fechamento-pedido-em-processamento] Fechamento do Pedido com Status 'EM PROCESSAMENTO' (RF0038)

- **Sprint:** Sprint 3: Vendas & Checkout (CDU03)
- **Coluna no Kanban:** `Vendas & Checkout - CDU03 (Sprint 3)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** Critical
- **Horas Previstas:** 8h
- **Labels / Tags:** `vendas, pedidos, rf0038, baixa-estoque`

#### 🎯 Descrição / Objetivo:
> Concluir a transação de compra, gerando o número do pedido com status inicial 'EM PROCESSAMENTO' e debitando o estoque.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] Criação de registro em `pedidos` com status `EM PROCESSAMENTO`.
- [x] Gravação dos itens em `itens_pedido` e débito transacional em `livros.estoque`.
- [x] Esvaziamento do carrinho e exibição da tela de confirmação de compra.

---

### 23. ✅ [ped-12-auditoria-logs-tempo-resposta] Auditoria de Transações e Tempo de Resposta (RNF0011, RNF0012)

- **Sprint:** Sprint 3: Vendas & Checkout (CDU03)
- **Coluna no Kanban:** `Vendas & Checkout - CDU03 (Sprint 3)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** Medium
- **Horas Previstas:** 8h
- **Labels / Tags:** `auditoria, rnf0011, rnf0012, performance`

#### 🎯 Descrição / Objetivo:
> Atender aos requisitos não funcionais de auditoria de operações de escrita e latência de consulta.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] RNF0011: Tempo de resposta em consultas na vitrine em menos de 1 segundo (medido em 340 ms).
- [x] RNF0012: Registro de log em banco contendo data, hora, usuário, operação e dados alterados.

---

### 24. ✅ [ped-13-suite-cypress-8-testes-hud] Suíte Cypress E2E com 8 Cenários, Slow Motion e HUD Visual

- **Sprint:** Sprint 3: Vendas & Checkout (CDU03)
- **Coluna no Kanban:** `Vendas & Checkout - CDU03 (Sprint 3)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** Critical
- **Horas Previstas:** 12h
- **Labels / Tags:** `cypress, e2e, slow-motion, hud`

#### 🎯 Descrição / Objetivo:
> Implementar a suíte definitiva `cypress/e2e/criacao_pedido.cy.js` cobrindo 100% dos requisitos de vendas com visualização guiada para a banca.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] 8 cenários de testes automatizados aprovados (0 falhas em 2m 37s).
- [x] HUD visual no topo destacando as etapas e tempo em slow motion.
- [x] Rota `DELETE /api/checkout/limpeza-testes` garantindo repetibilidade limpa.

---

### 25. ✅ [ped-14-plano-de-testes-oficial] Elaboração do Plano de Testes Oficial (Word .docx)

- **Sprint:** Sprint 3: Vendas & Checkout (CDU03)
- **Coluna no Kanban:** `Vendas & Checkout - CDU03 (Sprint 3)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** High
- **Horas Previstas:** 8h
- **Labels / Tags:** `plano-testes, documentacao, pert, rastreabilidade`

#### 🎯 Descrição / Objetivo:
> Elaborar o documento formal de Plano de Testes da Sprint 3 no template oficial exigido pelo professor.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] Arquivo `PlanoTestes_AndersonBarros.docx` com todas as 32 tabelas preenchidas.
- [x] Matriz de rastreabilidade completa (27 requisitos) e cronograma PERT (20,4 horas).
- [x] 10 Casos de Teste (CT001 a CT010) com subtabelas de técnicas (equivalência, valor limite, tabela de decisão).

---

### 26. ✅ [log-01-despacho-transporte-rastreio] Despacho, Transporte e Confirmação de Entrega (RF0039, RF0040)

- **Sprint:** Sprint 4: Trocas & Logística Reversa (CDU04)
- **Coluna no Kanban:** `Trocas & Logística Reversa - CDU04 (Sprint 4)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** Medium
- **Horas Previstas:** 8h
- **Labels / Tags:** `logistica, rf0039, rf0040, rastreio`

#### 🎯 Descrição / Objetivo:
> Implementar as transições de status pós-compra no painel administrativo: despachado, em transporte e entregue.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] Mudança de status `EM PROCESSAMENTO` -> `DESPACHADO` -> `EM TRANSPORTE` -> `ENTREGUE`.
- [x] Código de rastreamento e registro de data/hora de entrega efetiva.

---

### 27. ✅ [trc-01-modelagem-tabela-trocas-supabase] Modelagem de Dados e DDL de Trocas no Supabase (CDU04)

- **Sprint:** Sprint 4: Trocas & Logística Reversa (CDU04)
- **Coluna no Kanban:** `Trocas & Logística Reversa - CDU04 (Sprint 4)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** Critical
- **Horas Previstas:** 8h
- **Labels / Tags:** `trocas, sprint-4, cdu04, banco-de-dados`

#### 🎯 Descrição / Objetivo:
> Criar as tabelas `solicitacoes_troca` e `itens_troca` no Supabase para dar suporte ao ciclo de vida de logística reversa.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] Tabela `solicitacoes_troca` com campos: `id`, `pedido_id`, `cliente_id`, `status`, `motivo`, `codigo_postagem`, `created_at`.
- [x] Status suportados: `EM TROCA`, `TROCA AUTORIZADA`, `PRODUTO RECEBIDO`, `TROCA APROVADA`, `TROCA RECUSADA`.
- [x] Chaves estrangeiras e integridade referencial vinculadas ao pedido entregue.

---

### 28. ✅ [trc-02-interface-cliente-solicitacao-troca] Interface do Cliente para Solicitação de Troca (RF0041)

- **Sprint:** Sprint 4: Trocas & Logística Reversa (CDU04)
- **Coluna no Kanban:** `Trocas & Logística Reversa - CDU04 (Sprint 4)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** High
- **Horas Previstas:** 8h
- **Labels / Tags:** `trocas, frontend, rf0041, cliente`

#### 🎯 Descrição / Objetivo:
> Implementar na tela de 'Meus Pedidos' a opção de solicitar troca de livros para pedidos que já estejam com status 'ENTREGUE'.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] Exibir botão 'Solicitar Troca' apenas para pedidos com status 'ENTREGUE'.
- [x] Modal permitindo selecionar quais itens do pedido serão trocados e a quantidade.
- [x] Campo obrigatório para seleção do motivo da troca (Defeito, Arrependimento, Outro).

---

### 29. ✅ [trc-03-fluxo-admin-autorizacao-postagem] Fluxo Administrativo de Autorização e Código de Postagem (RF0042)

- **Sprint:** Sprint 4: Trocas & Logística Reversa (CDU04)
- **Coluna no Kanban:** `Trocas & Logística Reversa - CDU04 (Sprint 4)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** High
- **Horas Previstas:** 8h
- **Labels / Tags:** `trocas, admin, rf0042, logistica-reversa`

#### 🎯 Descrição / Objetivo:
> Disponibilizar no painel administrativo a gestão de pedidos de troca com geração de código de postagem para logística reversa.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] Administrador visualiza solicitações pendentes e aprova ou recusa a solicitação.
- [x] Ao aprovar, o sistema gera código de postagem fictício (ex.: `POST-2026-XXXX`) e atualiza o status para `TROCA AUTORIZADA`.
- [x] Envio de notificação ao cliente com instruções de postagem.

---

### 30. ✅ [trc-04-conferencia-fisica-recebimento-estoque] Conferência Física e Recebimento de Produtos (RF0043)

- **Sprint:** Sprint 4: Trocas & Logística Reversa (CDU04)
- **Coluna no Kanban:** `Trocas & Logística Reversa - CDU04 (Sprint 4)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** Medium
- **Horas Previstas:** 8h
- **Labels / Tags:** `trocas, admin, rf0043, estoque`

#### 🎯 Descrição / Objetivo:
> Registrar o recebimento físico do livro devolvido no armazém e laudo técnico de inspeção.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] Registro da data de recebimento do pacote no centro de distribuição.
- [x] Transição do status para `PRODUTO RECEBIDO`.
- [x] Checklist de vistoria: integridade do livro, capa, páginas e presença de avarias.

---

### 31. ✅ [trc-05-reincorporacao-ao-estoque-ou-descarte] Reincorporação ao Estoque ou Descarte de Avarias (RF0044)

- **Sprint:** Sprint 4: Trocas & Logística Reversa (CDU04)
- **Coluna no Kanban:** `Trocas & Logística Reversa - CDU04 (Sprint 4)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** Medium
- **Horas Previstas:** 8h
- **Labels / Tags:** `trocas, estoque, rf0044`

#### 🎯 Descrição / Objetivo:
> Decidir sobre o destino físico do item recebido na troca (retorno ao saldo comercial ou descarte/avaria).

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] Se o produto estiver em estado perfeito, reincorporar quantidade ao estoque ativo de vendas.
- [x] Se houver defeito/avaria irreversível, destinar ao estoque de avarias sem alimentar o saldo vendível.

---

### 32. ✅ [trc-06-emissao-credito-cupom-troca-cliente] Emissão e Crédito Automático de Cupom de Troca (RF0045)

- **Sprint:** Sprint 4: Trocas & Logística Reversa (CDU04)
- **Coluna no Kanban:** `Trocas & Logística Reversa - CDU04 (Sprint 4)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** Critical
- **Horas Previstas:** 8h
- **Labels / Tags:** `trocas, cupons, rf0045, credito`

#### 🎯 Descrição / Objetivo:
> Ao finalizar a aprovação da troca, emitir automaticamente um cupom de troca de valor equivalente ao item devolvido vinculado ao cliente.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] Geração do cupom com código único prefixado `TR-` (ex.: `TR-TROCA-8472`).
- [x] Vinculação unívoca ao CPF/ID do cliente para uso exclusivo no próximo checkout.
- [x] Atualização do status final para `TROCA APROVADA`.

---

### 33. ✅ [trc-07-testes-cypress-ciclo-trocas] Suíte Cypress E2E para o Fluxo Completo de Trocas

- **Sprint:** Sprint 4: Trocas & Logística Reversa (CDU04)
- **Coluna no Kanban:** `Trocas & Logística Reversa - CDU04 (Sprint 4)`
- **Status de Execução:** `Concluído` (100% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** High
- **Horas Previstas:** 16h
- **Labels / Tags:** `cypress, e2e, trocas, testes`

#### 🎯 Descrição / Objetivo:
> Desenvolver testes automatizados no Cypress validando solicitação de troca, autorização admin, emissão do cupom e recompra com o cupom gerado.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [x] Arquivo `cypress/e2e/trocas_pedidos.cy.js` implementado e aprovado.
- [x] Teste do ciclo completo de ponta a ponta (solicitação -> cupom -> novo pedido).

---

### 34. ⏳ [adm-01-cadastro-gestao-fornecedores] Módulo de Cadastro e Gestão de Fornecedores (CDU01, RF0081-RF0085)

- **Sprint:** Sprint 5: Backlog (BI & Fornecedores)
- **Coluna no Kanban:** `Backlog (Sprint 5)`
- **Status de Execução:** `Backlog` (0% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** Medium
- **Horas Previstas:** 16h
- **Labels / Tags:** `fornecedores, cdu01, backlog, sprint-5`

#### 🎯 Descrição / Objetivo:
> Implementar o CRUD completo de Fornecedores conforme especificação do caso de uso CDU01.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [ ] Cadastro com CNPJ único, Razão Social, Nome Fantasia, Inscrição Estadual e CNAE.
- [ ] Associação de produtos fornecidos e controle de entradas de estoque.

---

### 35. ⏳ [bi-01-hub-grafico-linhas-temporal-vendas] Hub de BI com Gráfico Temporal de Vendas (RF0055, RN0071)

- **Sprint:** Sprint 5: Backlog (BI & Fornecedores)
- **Coluna no Kanban:** `Backlog (Sprint 5)`
- **Status de Execução:** `Backlog` (0% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** High
- **Horas Previstas:** 16h
- **Labels / Tags:** `bi, analytics, rf0055, chartjs`

#### 🎯 Descrição / Objetivo:
> Desenvolver dashboard interativo de vendas com gráficos Chart.js exibindo evolução temporal de faturamento e volume.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [ ] Gráfico de linhas com valores agregados por dia, semana ou mês.
- [ ] Comparativo de períodos e cálculo de médias de faturamento.

---

### 36. ⏳ [bi-02-filtros-analiticos-multidimensionais] Filtros Analíticos por Categoria, Autor e Região (RF0056)

- **Sprint:** Sprint 5: Backlog (BI & Fornecedores)
- **Coluna no Kanban:** `Backlog (Sprint 5)`
- **Status de Execução:** `Backlog` (0% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** Medium
- **Horas Previstas:** 16h
- **Labels / Tags:** `bi, filtros, rf0056, drill-down`

#### 🎯 Descrição / Objetivo:
> Permitir drill-down analítico nas vendas filtrando por categorias literárias, autores e regiões geográficas de entrega.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [ ] Filtro por categoria (Realismo, Romantismo, Naturalismo, etc.).
- [ ] Filtro por estado/região de entrega correlacionando com custos de frete.

---

### 37. ⏳ [bi-03-exportacao-relatorios-pdf-excel] Exportação de Relatórios Gerenciais de Vendas (RF0058)

- **Sprint:** Sprint 5: Backlog (BI & Fornecedores)
- **Coluna no Kanban:** `Backlog (Sprint 5)`
- **Status de Execução:** `Backlog` (0% concluído)
- **Responsável:** Anderson Barros
- **Prioridade:** Low
- **Horas Previstas:** 16h
- **Labels / Tags:** `relatorios, exportacao, pdf, excel`

#### 🎯 Descrição / Objetivo:
> Possibilitar aos gestores a emissão e download de relatórios consolidados em formatos PDF e planilha eletrônica.

#### ☑️ Subtasks / Critérios de Aceitação (Checklist):
- [ ] Geração de PDF estruturado com KPIs e tabela de pedidos.
- [ ] Exportação de dados brutos tabulares em formato CSV / Excel.

---
