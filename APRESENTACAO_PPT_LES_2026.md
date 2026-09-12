# 📊 ROTEIRO COMPLETO PARA A APRESENTAÇÃO EM SALA & SLIDES (PPT)
## Disciplina: Laboratório de Engenharia de Software (LES 2026)
### Equipe: Anderson Barros & João Pedro Scandiuzzi
### Tema: Módulo de Gestão de Clientes (CRUD Completo & Testes Automatizados de Interface)

---

## 🖥️ SLIDE 1: Capa
- **Título:** Livraria Alexandria — Sistema de E-Commerce de Livros
- **Subtítulo:** Entrega Semanal: CRUD Completo de Clientes & Validação por Testes Automatizados
- **Disciplina:** Laboratório de Engenharia de Software — 2º Semestre de 2026
- **Professor:** Rodrigo Rocha Silva
- **Integrantes:** Anderson Barros & João Pedro Scandiuzzi

---

## 🖥️ SLIDE 2: Escopo e Mapeamento de Requisitos (DRS_LES_2_2026)
- **Objetivo da Entrega:** Implementar o ciclo de vida completo do cliente (Cadastrar, Consultar, Alterar, Inativar e Excluir) em estrita conformidade com o documento de requisitos do projeto.
- **Tabela de Requisitos Funcionais Cobertos:**
  - `RF0021` — Cadastrar cliente (dados pessoais, múltiplos endereços e cartões)
  - `RF0022` — Alterar dados cadastrais do cliente
  - `RF0023` — Inativar cadastro de cliente (com histórico preservado)
  - `RF0024` — Consulta de clientes com filtros isolados e combinados
  - `RF0025` — Consulta de histórico de transações/compras vinculadas
  - `RF0026` — Associação de múltiplos endereços (1:N) com frase identificadora curta
  - `RF0027` — Associação de múltiplos cartões (1:N) com definição de preferencial
  - `RF0028` — Alteração exclusiva de senha

---

## 🖥️ SLIDE 3: Regras de Negócio e Requisitos Não Funcionais
- **Regras de Negócio (RNs):**
  - `RN0021` & `RN0022`: Obrigatoriedade de ao menos 1 endereço de cobrança e 1 de entrega
  - `RN0023`: Composição completa do endereço (Tipo residência, tipo logradouro, logradouro, número, bairro, CEP, cidade, UF, país)
  - `RN0024` & `RN0025`: Composição do cartão de crédito (número, nome impresso, bandeira homologada: Visa, Mastercard, Elo, Amex e CVV)
  - `RN0026`: Dados pessoais obrigatórios com telefone composto (Tipo [Celular/Fixo], DDD e Número)
  - `RN0027`: Ranking numérico do cliente (1 a 5 estrelas)
- **Requisitos Não Funcionais (RNFs):**
  - `RNF0031`: Senha forte (mínimo 8 caracteres, com maiúscula, minúscula e caractere especial)
  - `RNF0032`: Confirmação dupla de senha idêntica
  - `RNF0033`: Criptografia e hashing seguro de senhas (SHA-256)
  - `RNF0035`: Código único sequencial gerado pelo sistema (`CLI-001`, `CLI-002`...)

---

## 🖥️ SLIDE 4: Regra Crítica — Distinção entre Inativação e Exclusão
- **Por que essa distinção é fundamental no DRS?**
  - **Inativação (`RF0023`):** Altera o status da conta para `INATIVO`. O cliente não pode logar nem comprar, mas **seus dados e pedidos permanecem no banco de dados**, garantindo conformidade fiscal e integridade referencial de vendas passadas.
  - **Exclusão Física:** 
    - **Bloqueada pelo sistema** se o cliente possuir histórico de transações/compras (com mensagem explicativa da regra ao operador).
    - **Permitida apenas** para cadastros recém-criados ou que nunca movimentaram pedidos na loja.

---

## 🖥️ SLIDE 5: Arquitetura da Solução & Modelagem de Dados
- **Stack Tecnológica:**
  - Backend: Node.js + Express (Rotas RESTful padronizadas conforme planilha de estimativas)
  - Frontend: HTML5, CSS3 com Design System da Livraria Alexandria e Vanilla JavaScript
  - Testes E2E: Cypress 15 (Suíte automatizada de ponta a ponta)
- **Estrutura Relacional (1:N):**
  - Cliente (1) ───< (N) Endereços (Entrega, Cobrança, Ambos)
  - Cliente (1) ───< (N) Cartões de Crédito (com flag `preferencial`)
  - Cliente (1) ───< (N) Pedidos / Transações

---

## 🖥️ SLIDE 6: Demonstração da Suíte de Testes Automatizados (Cypress)
- **Ferramenta Utilizada:** Cypress E2E
- **Total de Testes:** 10 cenários automatizados cobrindo 100% dos fluxos principais e regras de negócio:
  1. `[RF0024]` Filtros isolados (por nome) e combinados (por status)
  2. `[RF0021][RN0026][RNF0035][RF0026][RF0027]` Cadastro completo com dados válidos
  3. `[RNF0031]` Rejeição e erro claro para senha fraca
  4. `[RNF0032]` Rejeição para confirmação dupla de senha divergente
  5. `[RF0022]` Alteração de dados cadastrais
  6. `[RF0028]` Alteração exclusiva de senha
  7. `[RF0023]` Inativação e posterior reativação de cliente
  8. `[RF0025]` Exibição do histórico de compras vinculadas
  9. `[DISTINÇÃO]` Bloqueio da exclusão física para cliente com pedidos
  10. `[EXCLUSÃO PERMITIDA]` Exclusão bem-sucedida de cliente sem histórico

---

## 🖥️ SLIDE 7: Conclusão & Demonstração ao Vivo
- **Comandos de Demonstração em Sala:**
  - Rodar suíte completa no terminal:
    ```bash
    npm run test:e2e
    ```
  - Abrir o executor visual interativo do Cypress:
    ```bash
    npm run test:e2e:open
    ```
- **Repositório GitHub:** `https://github.com/awillian48/e-commerce-de-livros` (Branch `main`)
- **Status:** Todos os requisitos cumpridos, código amplamente documentado e suíte de testes 100% aprovada.
