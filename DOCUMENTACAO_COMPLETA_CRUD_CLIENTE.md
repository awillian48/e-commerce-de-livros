# 🛡️ Livraria Alexandria — Documentação Técnica do Módulo de Clientes (CRUD)
### Laboratório de Engenharia de Software (LES 2026) — Prof. Rodrigo Rocha Silva
**Equipe:** Anderson Barros & João Pedro Scandiuzzi  
**Entrega:** Apresentação do CRUD Completo de Clientes (Cadastrar, Consultar, Alterar e Inativar/Excluir)

---

## 1. Visão Geral do Projeto

Este documento detalha a implementação completa do módulo de **Gestão de Clientes (CRUD)** do sistema de comércio eletrônico **Livraria Alexandria**, em estrita conformidade com o Documento de Requisitos de Software (**DRS_LES_2_2026**) e a planilha de estimativas do projeto.

O módulo atende com 100% de cobertura a todos os **Requisitos Funcionais (RFs)**, **Regras de Negócio (RNs)** e **Requisitos Não Funcionais (RNFs)** estipulados para a manutenção cadastral de clientes, com validações robustas no frontend e backend (Node.js/Express REST API com persistência de dados).

---

## 2. Matriz de Rastreabilidade de Requisitos

A tabela abaixo correlaciona diretamente cada requisito do DRS com sua implementação e forma de validação:

| Código | Descrição do Requisito | Tipo | Implementação no Sistema | Como Demonstrar / Testar |
| :--- | :--- | :---: | :--- | :--- |
| **RF0021** | Cadastrar cliente | RF | `POST /api/clientes` | Botão "➕ Novo Cliente", preenchimento completo de formulário e persistência. |
| **RF0022** | Alterar cliente | RF | `PUT /api/clientes/:id` | Botão "✏️ Editar" na tabela. Permite alterar nome, nascimento, telefone, etc. (CPF imutável). |
| **RF0023** | Inativar cadastro de cliente | RF | `PATCH /api/clientes/:id/status` | Botão "Inativar" / "Reativar" alternando status `ATIVO` / `INATIVO` com badges coloridos. |
| **RF0024** | Consulta de clientes com filtros | RF | `GET /api/clientes?nome=...` | Formulário de busca no topo com filtros combinados e isolados (Nome, CPF, E-mail, Status, Ranking). |
| **RF0025** | Consulta de transações do cliente | RF | `GET /api/clientes/:id/transacoes` | Botão "📦 Transações" abrindo modal detalhado com pedidos, datas, itens e valores. |
| **RF0026** | Cadastro de múltiplos endereços com frase curta | RF | Coleção 1:N no cadastro/edição | Bloco de endereços dinâmico com campo `fraseIdentificadora` obrigatório ("Minha Residência", etc.). |
| **RF0027** | Cadastro de múltiplos cartões com preferencial | RF | Coleção 1:N no cadastro/edição | Bloco de cartões dinâmico com bandeira e botão rádio exclusivo para `preferencial`. |
| **RF0028** | Alteração exclusiva de senha | RF | `PATCH /api/clientes/:id/senha` | Botão "🔑 Senha" abrindo modal dedicado, sem necessidade de editar outros dados. |
| **RN0021** | Endereço de cobrança obrigatório | RN | `clienteValidator.js` | Validação impedindo salvar sem ao menos um endereço com finalidade `COBRANCA` ou `AMBOS`. |
| **RN0022** | Endereço de entrega obrigatório | RN | `clienteValidator.js` | Validação impedindo salvar sem ao menos um endereço com finalidade `ENTREGA` ou `AMBOS`. |
| **RN0023** | Composição detalhada do registro de endereços | RN | Objeto estruturado de endereço | Campos: Frase, Tipo Residência, Logradouro, Número, Bairro, CEP, Cidade, Estado, País, Observações. |
| **RN0024** | Composição do registro de cartões de crédito | RN | Objeto estruturado de cartão | Campos: Número, Nome impresso, Bandeira homologada, CVV (3 ou 4 dígitos) e Preferencial. |
| **RN0025** | Bandeiras de cartão homologadas | RN | Validação de Bandeiras | Suporte a: `VISA`, `MASTERCARD`, `ELO`, `AMERICAN EXPRESS`. Outras são recusadas. |
| **RN0026** | Dados cadastrais obrigatórios e telefone composto | RN | Modelo de Dados de Cliente | Nome, CPF único, E-mail, Nascimento, Gênero e Telefone Composto (Tipo, DDD e Número). |
| **RN0027** | Ranking do cliente | RN | Campo `ranking` (1 a 5 estrelas) | Apresentado na tabela em estrelas (`⭐` a `⭐⭐⭐⭐⭐`) com filtro dedicado. |
| **RNF0031** | Senha forte | RNF | Regex de Complexidade | Mínimo 8 caracteres, contendo letra maiúscula, letra minúscula e caractere especial (@#$%&*). |
| **RNF0032** | Confirmação dupla de senha | RNF | Comparador de campos | Obrigatoriedade de confirmação idêntica da senha no cadastro e na alteração de senha. |
| **RNF0033** | Criptografia / Hashing de senha | RNF | SHA-256 no backend | A senha em texto claro é convertida em hash seguro antes de persistir no banco JSON. |
| **RNF0035** | Código identificador único sequencial | RNF | Gerador `CLI-XXX` | Criação automática de códigos sequenciais únicos (`CLI-001`, `CLI-002`, `CLI-003`...). |

---

## 3. Distinção Crítica de Engenharia: Inativação vs. Exclusão Física

Uma das principais regras de negócio de governança contábil e fiscal do sistema é a distinção estrita entre **Inativação** e **Exclusão Física**:

### 🔴 Bloqueio de Exclusão Física para Clientes com Histórico de Compras:
- Se um cliente possui pedidos ou transações registradas no sistema (como o cliente `CLI-001 - Machado de Assis`), a tentativa de exclusão física é **imediatamente bloqueada** pela API REST (retornando HTTP 400).
- **Justificativa de Negócio / Auditoria:** A exclusão física de um cliente que realizou compras destruiria a integridade referencial dos registros fiscais, contábeis e de emissão de notas fiscais dos pedidos já faturados.
- **Solução preconizada:** O sistema exibe um modal didático explicando que o cliente deve ser **Inativado (RF0023)**, preservando a auditoria contábil.

### 🟢 Exclusão Física Permitida:
- Apenas clientes recém-cadastrados que **nunca realizaram pedidos** (ex: o cliente de teste `CLI-003`) podem ser fisicamente removidos da base de dados, garantindo a conformidade com as leis de privacidade (LGPD).

---

## 4. Como Executar e Demonstrar os Testes

O projeto oferece **3 formas complementares** de execução dos testes:

### Opção 1: Direto no Navegador com Demonstração Visual (Recomendado para a Aula)
Abre diretamente o Google Chrome / navegador padrão do Windows sem passar por telas de setup ou pelo Cypress:

```powershell
# 1. Iniciar o servidor (se ainda não estiver rodando)
npm run dev

# 2. Em outro terminal, disparar o navegador diretamente
npm run test:browser
```
> **Ou simplesmente:** Abra o navegador em `http://localhost:3000/admin/clientes.html` e clique no botão **`▶️ Executar Testes no Navegador`**.

O motor de testes interativo executará na tela:
1. Digitação visual no campo de filtro ("Clarice") e verificação de busca.
2. Abertura do modal e rejeição visual de senha fraca ("123").
3. Preenchimento de senha forte ("Livro@2026") com confirmação dupla.
4. Preenchimento completo de cliente (João Guimarães Rosa) com telefone composto, endereço e cartão de crédito.
5. Gravação e verificação do novo código `CLI-003`.
6. Edição de dados e comprovação de que o CPF é imutável.
7. Alteração exclusiva de senha via modal dedicado.
8. Consulta do histórico de pedidos e transações do Machado de Assis.
9. Tentativa de exclusão do Machado de Assis e exibição da regra de bloqueio contábil.
10. Inativação e reativação de cadastro com atualização dos badges.
11. Exclusão física permitida do cliente recém-criado sem histórico.
12. Exibição do relatório comemorativo com 100% dos requisitos validados.

---

### Opção 2: Cypress Headed (Janela do Navegador pelo Cypress)
Executa a suíte E2E automatizada completa abrindo a janela do navegador em velocidade controlada para a apresentação:

```powershell
npm run test:headed
```

---

### Opção 3: Cypress Terminal (Headless / Modo CI)
Executa todos os 10 testes no terminal com relatório detalhado de tempo e status:

```powershell
npm run test:e2e
```

---

## 5. Roteiro Sugerido para Apresentação em Sala de Aula (5 a 8 Minutos)

1. **Abertura (1 minuto):**
   - Apresentar a dupla (Anderson e João) e contextualizar o módulo de Gestão de Clientes da Livraria Alexandria.
   - Destacar que o design utiliza a paleta original retrô (Navy, Teal, Sand, Terracotta e Cream) com visual limpo, moderno e cards de KPIs no topo.

2. **Demonstração em Tempo Real (3 a 4 minutos):**
   - Disparar `npm run test:browser` ou clicar no botão "▶️ Executar Testes no Navegador".
   - Conforme cada passo é executado pelo motor de testes no navegador, explicar o requisito correspondente ao professor Rodrigo:
     - *"Aqui vemos o RF0024 com filtro dinâmico..."*
     - *"Aqui o RNF0031 barrando a senha fraca..."*
     - *"Aqui o RF0021 com todas as regras de composição de telefone (RN0026), endereço (RN0021/RN0022/RN0023) e cartão homologado (RN0024/RN0025)..."*
     - *"Aqui o RF0022 comprovando o CPF imutável..."*
     - *"Aqui a consulta exclusiva de transações do RF0025..."*
     - *"Aqui a regra crítica de distinção: tentamos excluir o Machado de Assis e o sistema bloqueia, exigindo a Inativação pelo RF0023 para proteger o histórico fiscal..."*

3. **Conclusão (1 minuto):**
   - Mostrar o modal final com todos os 100% dos requisitos aprovados.
   - Informar que o código está completamente documentado e versionado no GitHub (`awillian48/e-commerce-de-livros`).
