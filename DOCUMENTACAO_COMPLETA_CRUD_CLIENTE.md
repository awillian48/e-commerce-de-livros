# Livraria Alexandria — Documentação Técnica do Módulo de Clientes (CRUD)
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
| **RF0021** | Cadastrar cliente | RF | `POST /api/clientes` | Botão "Novo Cliente", preenchimento completo de formulário e persistência. |
| **RF0022** | Alterar cliente | RF | `PUT /api/clientes/:id` | Botão "Editar" na tabela. Permite alterar nome, nascimento, telefone, etc. (CPF imutável). |
| **RF0023** | Inativar cadastro de cliente | RF | `PATCH /api/clientes/:id/status` | Botão "Inativar" / "Reativar" alternando status `ATIVO` / `INATIVO` com badges coloridos. |
| **RF0024** | Consulta de clientes com filtros | RF | `GET /api/clientes?nome=...` | Formulário de busca no topo com filtros combinados e isolados (Nome, CPF, E-mail, Status, Ranking). |
| **RF0025** | Consulta de transações do cliente | RF | `GET /api/clientes/:id/transacoes` | Botão "Transações" abrindo modal detalhado com pedidos, datas, itens e valores. |
| **RF0026** | Cadastro de múltiplos endereços com frase curta | RF | Coleção 1:N no cadastro/edição | Bloco de endereços dinâmico com campo `fraseIdentificadora` obrigatório ("Minha Residência", etc.). |
| **RF0027** | Cadastro de múltiplos cartões com preferencial | RF | Coleção 1:N no cadastro/edição | Bloco de cartões dinâmico com bandeira e botão rádio exclusivo para `preferencial`. |
| **RF0028** | Alteração exclusiva de senha | RF | `PATCH /api/clientes/:id/senha` | Botão "Senha" abrindo modal dedicado, sem necessidade de editar outros dados. |
| **RN0021** | Endereço de cobrança obrigatório | RN | `clienteValidator.js` | Validação impedindo salvar sem ao menos um endereço com finalidade `COBRANCA` ou `AMBOS`. |
| **RN0022** | Endereço de entrega obrigatório | RN | `clienteValidator.js` | Validação impedindo salvar sem ao menos um endereço com finalidade `ENTREGA` ou `AMBOS`. |
| **RN0023** | Composição detalhada do registro de endereços | RN | Objeto estruturado de endereço | Campos: Frase, Tipo Residência, Logradouro, Número, Bairro, CEP, Cidade, Estado, País, Observações. |
| **RN0024** | Composição do registro de cartões de crédito | RN | Objeto estruturado de cartão | Campos: Número, Nome impresso, Bandeira homologada, CVV (3 ou 4 dígitos) e Preferencial. |
| **RN0025** | Bandeiras de cartão homologadas | RN | Validação de Bandeiras | Suporte a: `VISA`, `MASTERCARD`, `ELO`, `AMERICAN EXPRESS`. Outras são recusadas. |
| **RN0026** | Dados cadastrais obrigatórios e telefone composto | RN | Modelo de Dados de Cliente | Nome, CPF único, E-mail, Nascimento, Gênero e Telefone Composto (Tipo, DDD e Número). |
| **RN0027** | Ranking do cliente | RN | Campo `ranking` (1 a 5 estrelas) | Apresentado na tabela em escala numérica (1 a 5) com filtro dedicado. |
| **RNF0031** | Senha forte | RNF | Regex de Complexidade | Mínimo 8 caracteres, contendo letra maiúscula, letra minúscula e caractere especial (@#$%&*). |
| **RNF0032** | Confirmação dupla de senha | RNF | Comparador de campos | Obrigatoriedade de confirmação idêntica da senha no cadastro e na alteração de senha. |
| **RNF0033** | Criptografia / Hashing de senha | RNF | SHA-256 no backend | A senha em texto claro é convertida em hash seguro antes de persistir no banco JSON. |
| **RNF0035** | Código identificador único sequencial | RNF | Gerador `CLI-XXX` | Criação automática de códigos sequenciais únicos (`CLI-001`, `CLI-002`, `CLI-003`...). |

---

## 3. Distinção Crítica de Engenharia: Inativação vs. Exclusão Física

Uma das principais regras de negócio de governança contábil e fiscal do sistema é a distinção estrita entre **Inativação** e **Exclusão Física**:

### Bloqueio de Exclusão Física para Clientes com Histórico de Compras:
- Se um cliente possui pedidos ou transações registradas no sistema (como o cliente `CLI-001 - Machado de Assis`), a tentativa de exclusão física é **imediatamente bloqueada** pela API REST (retornando HTTP 400).
- **Justificativa de Negócio / Auditoria:** A exclusão física de um cliente que realizou compras destruiria a integridade referencial dos registros fiscais, contábeis e de emissão de notas fiscais dos pedidos já faturados.
- **Solução preconizada:** O sistema exibe um modal didático explicando que o cliente deve ser **Inativado (RF0023)**, preservando a auditoria contábil.

### Exclusão Física Permitida:
- Apenas clientes recém-cadastrados que **nunca realizaram pedidos** (ex: o cliente de teste `CLI-003`) podem ser fisicamente removidos da base de dados, garantindo a conformidade com as leis de privacidade (LGPD).

---

## 4. Como Executar e Demonstrar os Testes

O projeto conta com **execução de testes no Cypress Desktop App** de forma profissional e isolada, sem poluir a interface do usuário:

### Opção 1: Cypress Desktop App Direto (Recomendado para a Apresentação)
Com o aplicativo do Cypress já aberto:
1. No Cypress, selecione ou adicione o projeto apontando para:
   `C:\Users\anderson.barros\.gemini\antigravity-ide\scratch\e-commerce-de-livros`
2. Clique em **E2E Testing** -> escolha o navegador (Chrome ou Electron) -> clique em **`crud_cliente.cy.js`**.
3. O Cypress executará todos os 10 testes com visualização passo a passo e ritmo pausado para o professor acompanhar.

Ou inicie o app via terminal a partir da pasta do projeto:
```powershell
npm run test:e2e:open
```

---

### Opção 2: Cypress Headed (Janela do Navegador Automatizada)
Executa a suíte E2E automatizada pelo Cypress com o navegador visível em velocidade controlada:

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

### Opção 4: Gravação no Cypress Cloud
Envia a execução para o painel de monitoramento do Cypress Cloud:

```powershell
npm run test:record
```

---

## 5. Roteiro Sugerido para Apresentação em Sala de Aula (5 a 8 Minutos)

1. **Abertura (1 minuto):**
   - Apresentar a dupla (Anderson e João) e contextualizar o módulo de Gestão de Clientes da Livraria Alexandria.
   - Destacar o design editorial limpo, a paleta retrô original (Navy, Teal, Sand, Terracotta e Cream), os cards de KPIs no topo e o **modal ampliado (1140px)** com layout espaçoso sem quebra de linhas.

2. **Demonstração em Tempo Real no Cypress Desktop App (3 a 4 minutos):**
   - Executar a spec `crud_cliente.cy.js` diretamente no aplicativo do Cypress (`npm run test:e2e:open`).
   - Conforme cada teste é executado, comentar a conformidade com os requisitos e regras de negócio:
     - *"Aqui vemos o RF0024 com filtro dinâmico por nome e status..."*
     - *"Aqui o RNF0031 e RNF0032 barrando senhas fracas e confirmações divergentes..."*
     - *"Aqui o RF0021 com todas as regras de composição: telefone (RN0026), múltiplos endereços (RN0021/RN0022/RN0023) e múltiplos cartões homologados (RN0024/RN0025) com definição de preferencial (RF0027)..."*
     - *"Aqui o RF0022 comprovando que o CPF é imutável na edição..."*
     - *"Aqui a consulta exclusiva de transações do cliente (RF0025)..."*
     - *"Aqui a regra crítica de distinção de negócio: tentamos excluir o Machado de Assis e o sistema BLOQUEIA a exclusão física, exigindo a Inativação pelo RF0023 para proteger o histórico fiscal..."*
     - *"Por fim, a exclusão física é testada com sucesso para um cliente sem pedidos associados."*

3. **Conclusão (1 minuto):**
   - Mostrar o relatório final do Cypress com **10 testes aprovados (100% de sucesso)**.
   - Informar que o código está completamente versionado no repositório GitHub: [awillian48/e-commerce-de-livros](https://github.com/awillian48/e-commerce-de-livros).
