# Guia Prático — Conexão do Banco Relacional PostgreSQL no Supabase
**Livraria Alexandria — Laboratório de Engenharia de Software (LES 2026)**  
**Equipe:** Anderson Barros & João Pedro Scandiuzzi  

Este guia detalha o passo a passo para criar o banco de dados relacional no **Supabase**, executar o script de criação das tabelas e conectar a aplicação web.

---

## 1. O que foi Modelado e Estruturado no Supabase

O arquivo [`supabase/schema.sql`](supabase/schema.sql) contém todo o modelo relacional em **PostgreSQL** pronto para execução:
* **Tabelas Normalizadas:**
  * `clientes`: Chave primária UUID, código sequencial `CLI-XXX` (`RNF0035`), CPF único, e-mail único, hash SHA-256 (`RNF0033`), ranking de 1 a 5 (`RN0027`) e status `ATIVO`/`INATIVO` (`RF0023`).
  * `telefones`: Relacionamento 1:1 com cliente, composto por tipo (`CELULAR`, `RESIDENCIAL`, `COMERCIAL`), DDD e número (`RN0026`).
  * `enderecos`: Relacionamento 1:N com cliente, frase curta identificadora (`RF0026`), tipo de residência, tipo de logradouro, cep, bairro, cidade, estado e finalidade (`ENTREGA`, `COBRANCA`, `AMBOS`) (`RN0021`, `RN0022`, `RN0023`).
  * `cartoes`: Relacionamento 1:N com cliente, número, nome impresso, CVV, bandeiras homologadas (`VISA`, `MASTERCARD`, `ELO`, `AMERICAN EXPRESS`) (`RN0024`, `RN0025`) e indicador de cartão preferencial (`RF0027`).
  * `pedidos`: Histórico de compras (`RF0025`). **Possui constraint `ON DELETE RESTRICT` na chave estrangeira do cliente**, impedindo no próprio banco de dados a exclusão física de clientes que possuam transações vinculadas.
  * `itens_pedido`: Detalhamento dos livros comprados em cada pedido.
* **Políticas de RLS (Row Level Security):** Todas as tabelas já possuem RLS habilitado com permissão total para a chave pública anon da API.
* **Carga Inicial (Seed Data):** Registros completos dos autores Machado de Assis, Clarice Lispector e Guimarães Rosa com seus respectivos telefones, endereços, cartões e pedidos.

---

## 2. Passo a Passo para Subir no Supabase

### Passo 1: Criar Conta e Novo Projeto no Supabase
1. Acesse o site oficial: **[https://supabase.com](https://supabase.com)**;
2. Clique em **Sign In** (ou faça login com sua conta do GitHub);
3. No painel inicial (Dashboard), clique em **New Project**;
4. Preencha as informações:
   * **Name:** `livraria-alexandria`
   * **Database Password:** crie uma senha segura de sua preferência
   * **Region:** selecione `South America (São Paulo)` para menor latência
5. Clique em **Create new project** e aguarde cerca de 1 a 2 minutos até o banco inicializar.

---

### Passo 2: Executar o Script SQL
1. No menu lateral esquerdo do Supabase, clique no ícone **SQL Editor**;
2. Clique no botão **New Query** (ou *+ Blank snippet*);
3. Abra no seu editor o arquivo [`supabase/schema.sql`](supabase/schema.sql), copie todo o seu conteúdo e cole na área de texto do SQL Editor;
4. Clique no botão verde **Run** (ou pressione `Ctrl + Enter`);
5. O Supabase exibirá a mensagem: `Success. No rows returned`.
6. No menu lateral, clique em **Table Editor**: você verá todas as 6 tabelas criadas (`clientes`, `telefones`, `enderecos`, `cartoes`, `pedidos`, `itens_pedido`) com os dados dos autores já carregados!

---

### Passo 3: Obter a URL e a Chave de API do Supabase
1. No menu lateral esquerdo, clique no ícone de engrenagem **Project Settings**;
2. Clique na aba **API** (ou **Data API**);
3. Localize dois campos essenciais:
   * **Project URL:** algo como `https://abcdefghijklm.supabase.co`
   * **Project API keys > anon public:** uma chave longa iniciando com `eyJ...`
4. Copie esses dois valores.

---

### Passo 4: Conectar à Aplicação Local
1. No projeto `e-commerce-de-livros`, abra o arquivo `.env`:
   ```env
   PORT=3000
   SUPABASE_URL=https://abcdefghijklm.supabase.co
   SUPABASE_KEY=sua-chave-anon-copiada-do-supabase
   ```
2. Salve o arquivo.
3. Ao rodar o servidor (`npm run dev`), o console exibirá:
   ```text
   Conexão com Supabase inicializada com sucesso!
   Servidor ativo na porta 3000: http://localhost:3000
   ```

---

## 3. Resiliência e Fallback Offline

O sistema foi desenvolvido com arquitetura resiliente:
* Se as variáveis de ambiente `SUPABASE_URL` e `SUPABASE_KEY` estiverem preenchidas, a aplicação lê e grava diretamente nas tabelas relacionais do Supabase.
* Se você estiver sem internet ou demonstrando offline, a aplicação utiliza automaticamente o arquivo local `src/data/clientes.json`, permitindo que os testes do Cypress passem com 100% de sucesso em qualquer circunstância.
