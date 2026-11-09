# 📋 Quadro Ágil & Matriz de Rastreabilidade Kanban (LES 2026)

**Projeto:** E-Commerce de Livros Clássicos (Livraria Alexandria)  
**Disciplina:** Laboratório de Engenharia de Software - FATEC (2º Semestre / 2026)  
**Desenvolvedor:** Anderson Barros  
**Deploy Homologado:** [https://e-commerce-de-livros.onrender.com](https://e-commerce-de-livros.onrender.com)  
**Diretório de Features da Extensão Kanban:** `.devtool/features/` (37 cards granulares)

---

## 🚀 Visão Geral das Sprints

| Sprint / Entrega | Prazo / Marco | Escopo Principal | Situação | Cards Granulares |
| :--- | :--- | :--- | :--- | :--- |
| **Sprint 1** | 24/08/2026 | Concepção, Arquitetura C4, Design System e DDL Supabase | ✅ **Concluído** | 4 cards concluídos |
| **Sprint 2** | 21/09/2026 | CRUD Completo de Clientes (CDU02), Endereços, Cartões e Senha | ✅ **Concluído** | 7 cards concluídos |
| **Sprint 3** | 05/10/2026 | Criação de Pedido / Vendas (CDU03), 8 Testes Cypress e Plano | ✅ **Concluído** | 14 cards concluídos |
| **Sprint 4** | 23/10/2026 | Ciclo Completo de Vendas, Trocas e Logística Reversa (CDU04) | ✅ **Concluído** | 8 cards concluídos (11/11 testes Cypress 100% aprovados) |
| **Sprint 5** | 10/12/2026 | Hub Analítico de BI e Fornecedores (CDU01) | ⏳ **Backlog** | 4 cards no Backlog |

---

## 📊 Quadro Kanban Granular (.devtool/features)

### 🟢 1. CONCLUÍDO (Done — 33 Cards)

#### Sprint 1: Arquitetura & Concepção
- [x] **`arq-01` [Arquitetura]** Arquitetura do Sistema e Modelagem C4 (Node.js, Express, Supabase)
- [x] **`arq-02` [Banco de Dados]** Modelagem Relacional e DDL no Supabase PostgreSQL
- [x] **`des-01` [UI/UX]** Design System da Livraria Alexandria e Protótipo de Alta Fidelidade
- [x] **`dta-01` [Seed]** Script de Seed e Carga de Dados do Acervo Clássico (`popular-banco-completo.js`)

#### Sprint 2: CRUD de Clientes (CDU02)
- [x] **`cli-01` [RF0021/RF0024]** Cadastro de Clientes com Validação de CPF Único
- [x] **`cli-02` [RN0023]** Composição Obrigatória de Endereços com 10 Campos
- [x] **`cli-03` [RF0027/RN0024/RN0025]** Gestão de Cartões de Crédito com Bandeiras Homologadas e Preferencial
- [x] **`cli-04` [RNF0031/RNF0032]** Validação de Complexidade de Senha Forte e Confirmação Idêntica
- [x] **`cli-05` [RNF0033]** Armazenamento Criptografado com Hash Seguro (BCrypt)
- [x] **`cli-06` [RF0022/RF0025]** Consulta, Alteração e Inativação Lógica de Clientes
- [x] **`cli-07` [Cypress]** Suíte Automatizada E2E do Módulo de Clientes (`crud_cliente.cy.js`)

#### Sprint 3: Criação de Pedido / Vendas (CDU03)
- [x] **`ped-01` [RF0031/RF0032]** Gestão Completa de Itens no Carrinho (Adicionar, Alterar, Excluir)
- [x] **`ped-02` [RN0031]** Validação Impeditiva de Limite de Estoque Físico no Carrinho
- [x] **`ped-03` [RF0033]** Início da Realização de Compra e Transição para o Checkout
- [x] **`ped-04` [RF0034]** Cálculo de Frete Regional por Peso e UF (`calcularFrete`)
- [x] **`ped-05` [RF0035/RN0023]** Seleção de Endereço Salvo ou Cadastro de Novo Endereço no Checkout
- [x] **`ped-06` [RN0024/RN0025]** Modal Centralizado de Cartão de Crédito com Backdrop e Foco
- [x] **`ped-07` [RF0036/RN0034]** Pagamento com Múltiplos Cartões e Valor Mínimo de R$ 10,00 por Cartão
- [x] **`ped-08` [RF0037/RN0033]** Regras de Cupons Promocionais (Limite de 1 Cupom por Compra)
- [x] **`ped-09` [RN0035]** Exceção de Cupom com Cartão Menor que R$ 10,00 para Saldo Residual
- [x] **`ped-10` [RN0036]** Cupons de Troca, Bloqueio de Cupons Redundantes e Emissão de Troco
- [x] **`ped-11` [RF0038]** Fechamento Transacional do Pedido com Status Inicial 'EM PROCESSAMENTO' e Baixa de Estoque
- [x] **`ped-12` [RNF0011/RNF0012]** Auditoria de Transações e Tempo de Resposta em Consultas < 1s
- [x] **`ped-13` [Cypress E2E]** Suíte Cypress com 8 Cenários, Slow Motion e HUD Visual (`criacao_pedido.cy.js`)
- [x] **`ped-14` [Documentação]** Elaboração do Plano de Testes Oficial da Sprint 3 (`PlanoTestes_AndersonBarros.docx`)

#### Sprint 4: Ciclo Completo de Vendas, Trocas e Logística Reversa (CDU04)
- [x] **`log-01` [RF0038/RF0039/RN0039/RN0040]** Despacho e Entrega pelo Administrador (APROVADA ➔ EM TRANSPORTE ➔ ENTREGUE)
- [x] **`trc-01` [Banco de Dados]** Modelagem de Dados e DDL de Trocas no Supabase (`solicitacoes_troca`, `itens_troca`)
- [x] **`trc-02` [RF0040/RN0041/RN0043]** Interface do Cliente: Solicitação de Troca de Item ou Compra Inteira em Pedidos ENTREGUE
- [x] **`trc-03` [RF0041/RNF0046]** Fluxo Admin: Autorização de Troca, Status 'TROCA AUTORIZADA' e Notificação Reversa (PAC-REV)
- [x] **`trc-04` [RF0043/RN0042]** Confirmação Administrativa de Recebimento Físico dos Itens com Status 'TROCADO'
- [x] **`trc-05` [RF0054]** Reentrada Automática dos Itens Trocados no Estoque Físico
- [x] **`trc-06` [RF0044/RN0036]** Emissão Automática de Cupom de Troca Vinculado ao Cliente e Reutilização no Checkout
- [x] **`trc-07` [Cypress E2E]** Suíte de Testes Automatizados Cypress Cobrindo os 11 Cenários Integrados (100% aprovados)

---

### ⚪ 2. BACKLOG (Sprint 5 — BI & Fornecedores — 4 Cards)

- [ ] **`adm-01` [CDU01]** Módulo de Cadastro e Manutenção de Fornecedores (RF0081 a RF0085, RN0081 a RN0086)
- [ ] **`bi-01` [Analytics]** Hub de BI com Gráfico Temporal de Linhas de Vendas por Período (RF0055, RN0071)
- [ ] **`bi-02` [Analytics]** Filtros Analíticos Multidimensionais por Categoria, Autor e Região (RF0056)
- [ ] **`bi-03` [Relatórios]** Exportação de Relatórios Gerenciais de Vendas em PDF e Excel (RF0058)

---

## 🧪 Matriz dos 11 Cenários de Testes Automatizados (criacao_pedido.cy.js)

| # | Cenário Validado | Requisitos DRS | Resultado Cypress |
| :-: | :--- | :--- | :-: |
| **1** | Compra aprovada com um cartão de crédito | RF0033, RF0037, RN0037, RN0038, RF0053 | ✅ **Aprovado (2.5s)** |
| **2** | Compra com 2 cartões bloqueando valor < R$ 10,00 | RN0034 | ✅ **Aprovado (3.8s)** |
| **3** | Compra com cupom promocional e cartão < R$ 10,00 no cartão | RN0035 | ✅ **Aprovado (3.9s)** |
| **4** | Compra com cupons superiores ao valor, emitindo cupom de diferença | RN0036 | ✅ **Aprovado (2.4s)** |
| **5** | Compra REPROVADA pela operadora, desbloqueio e estoque mantido | RN0038, RF0053, RN0028 | ✅ **Aprovado (8.2s)** |
| **6** | Expiração do bloqueio no carrinho, remoção e compra desabilitada | RN0044, RNF0042, RNF0045 | ✅ **Aprovado (0.7s)** |
| **7** | Fluxo do Administrador: APROVADA ➔ EM TRANSPORTE ➔ ENTREGUE | RF0038, RF0039, RN0039, RN0040 | ✅ **Aprovado (1.1s)** |
| **8** | Tentativa de solicitar troca de pedido NÃO entregue (bloqueada) | RN0041, RN0043 | ✅ **Aprovado (1.6s)** |
| **9** | Troca de um item e troca de uma compra inteira | RF0040, RN0041, RN0043 | ✅ **Aprovado (7.0s)** |
| **10** | Ciclo completo de troca: autorização, reversa, recebimento e reentrada | RF0041 a RF0044, RF0054, RNF0046 | ✅ **Aprovado (5.2s)** |
| **11** | Uso do cupom de troca gerado em uma nova compra no checkout | RF0044 | ✅ **Aprovado (3.5s)** |

**Tempo Total de Execução:** 51 segundos | **Taxa de Sucesso:** 11/11 (100%)

---

## 🎯 Instruções de Acesso na IDE Antigravity

Para abrir o painel gráfico interativo do Kanban:
1. Pressione `Ctrl + Shift + P` (ou `Cmd + Shift + P`).
2. Digite: **`Kanban Markdown: Open Kanban Board`** (ou clique no ícone de prancheta/kanban na barra lateral esquerda).
3. O painel exibirá as colunas com os 37 cards divididos por prioridades, prazos, labels coloridas e atribuição exclusiva a **Anderson Barros**.
