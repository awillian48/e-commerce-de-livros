# Guia Prático de Demonstração de Código em Sala (LES 2026)
## E-Commerce de Livros Clássicos (Livraria Alexandria) — Anderson Barros

Este documento é o roteiro exato para guiar sua apresentação de código diante do professor e da banca.

---

## 🚀 Como Iniciar o Sistema Localmente na Apresentação

Abra um terminal no VS Code ou PowerShell na pasta do projeto:
```bash
cd C:\Users\anderson.barros\ecommerce-livros
node server.js
```
O servidor inicializará na porta 3000:
- Vitrine da Loja: `http://localhost:3000/index.html`
- Chatbot Completo: `http://localhost:3000/chatbot.html`
- Painel Admin da IA: `http://localhost:3000/admin/ia.html`
- Deploy Oficial em Nuvem: `https://e-commerce-de-livros.onrender.com`

Para rodar os testes automatizados ao vivo:
```bash
npm run test:atividade3:local
```

---

## 📂 Arquivos Chave para Abrir no VS Code e Explicar

### 1. O Motor Principal da IA e o Treinamento Supervisionado
📄 **Arquivo:** `src/services/recomendacaoIAService.js`

* **Linhas ~360 a 480 — Função `treinarModeloIA()`:**
  - Mostre ao professor que o modelo possui uma **Matriz Sináptica de Pesos**:
    - **Fase 1 (Preferências):** Inicializa os pesos com $w_{\text{pref}} = 0,35$.
    - **Fase 2 (Vendas):** Varre os pedidos concluídos, aplicando $w_{\text{venda}} = 0,45$ e calculando a matriz de coocorrência entre categorias.
    - **Fase 3 (RLHF):** Aplica recompensas ($+0,45$) para feedback Útil e penalidades ($-0,80$) para Não Útil com $w_{\text{RLHF}} = 0,20$.
    - **Fase 4 (Métricas):** Normaliza via Softmax/L1, calcula o Loss ($0,0465$) e acurácia ($95,67\%$).

* **Linhas ~600 a 660 — Compilação do Dataset `.jsonl`:**
  - Mostre que o sistema gera o dataset formatado com pares conversacionais (`system`, `user`, `model`, `reward`), comprovando conformidade com a sintonia fina da Google Cloud / Vertex AI.

* **Linhas ~720 a 765 — Integração com Google Gemini:**
  - Função `chamarGeminiAPI()` consumindo a API REST oficial (`v1beta/models/gemini-flash-lite-latest:generateContent`).
  - Timeout resiliente e chave de API protegida em variáveis de ambiente.

* **Linhas ~770 a 820 — Função `detectarCategoriaNaMensagem()` e Priorização:**
  - Mostre que se o leitor pedir expressamente uma categoria (ex: *"livros de tenologia"*), o sistema reconhece erros de digitação e prioriza a categoria solicitada sobre o histórico prévio.

* **Linhas ~860 a 910 — Guardrails e Contingência:**
  - Bloqueio estrito de perguntas fora de escopo (receitas, esportes, fofocas).
  - Regra absoluta de zero emojis em conformidade com o brandbook da Livraria Alexandria.
  - Fallback automático para o motor neural local caso a conexão externa oscile.

---

### 2. Rotas do Backend (Express API)
📄 **Arquivo:** `src/routes/chatbotRoutes.js`

* **`GET /api/chatbot/estado`:** Retorna o estado completo da IA (versão, loss, épocas, pesos comparativos de cada cliente).
* **`GET /api/chatbot/recomendacoes/:clienteId`:** Retorna as recomendações personalizadas calculadas para o cliente informado.
* **`POST /api/chatbot/mensagem`:** Recebe a pergunta do leitor e orquestra a resposta entre Gemini e o motor local.
* **`POST /api/chatbot/feedback`:** Registra a avaliação Útil/Não Útil e aciona a recalibração imediata dos pesos via RLHF.
* **`POST /api/chatbot/modelo/treinar`:** Endpoint administrativo para disparar novo ciclo de treinamento supervisionado.

---

### 3. Painel Administrativo de Auditoria da IA
📄 **Arquivos:** `public/admin/ia.html` e `public/js/admin-ia.js`

* **O que mostrar no navegador (`http://localhost:3000/admin/ia.html`):**
  - Cards de topo: Modelo ativo, Versão do Ajuste Fino, Loss atual (0,0465) e Acurácia (95,67%).
  - Comparativo visual de barras: Pesos de Machado de Assis (Literatura) vs Clarice Lispector (Filosofia/Engenharia).
  - Tabela de Feedbacks RLHF com status `Incorporado ao Modelo`.
  - Botão **Retreinar Modelo com 1 Clique**.
  - Bloco expansível com o código `.jsonl` do dataset supervisionado.

---

### 4. Interface do Chatbot e Demonstração dos Cenários
📄 **Arquivos:** `public/chatbot.html` e `public/js/chatbot.js`

* **O que mostrar no navegador (`http://localhost:3000/chatbot.html`):**
  - Seletor de Cliente no topo (CLI-001 vs CLI-002) para provar recomendações diferentes.
  - Pílulas com os cenários prontos da Seção 7:
    - *Recomendação Personalizada*
    - *Busca Assistida no Acervo*
    - *Dúvidas sobre Obras Clássicas (Dom Casmurro / Capitu)*
    - *Trilha de Leitura Guiada*
  - Botões de feedback **Útil** e **Não útil** em cada mensagem do bot.
  - Cards interativos de compra com percentual de afinidade e preço.

---

### 5. Chatbot Flutuante na Loja Virtual (Portal do Cliente)
📄 **Arquivos:** `public/js/chatbot-modal.js` e `public/index.html`

* Mostre o botão flutuante vermelho no canto inferior direito: **Recomendador Virtual**.
* Ao clicar, o modal abre responsivo e permite que qualquer visitante interaja com a IA sem sair da vitrine.

---

### 6. Suíte de Testes Automatizados Cypress
📄 **Arquivo:** `cypress/e2e/atividade3_chatbot_ia.cy.js`

* Contém 3 testes cobrindo os 8 cenários exigidos no roteiro presencial do professor.
* Executa em ~38 segundos com 100% de aprovação (0 falhas).
