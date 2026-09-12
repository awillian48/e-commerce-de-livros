// src/server.ts
import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor executando em http://localhost:${PORT}`);
  console.log(`📖 Loja Pública: http://localhost:${PORT}/index.html`);
  console.log(`🛡️ Control Center: http://localhost:${PORT}/admin/index.html`);
});