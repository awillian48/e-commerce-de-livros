import express from 'express';
import path from 'path';
import clientesRoutes from './routes/clientesRoutes.js';

const app = express();

app.use(express.json());

// Rotas da API REST de Clientes (conforme especificado no DRS e Estimativa)
app.use('/api/clientes', clientesRoutes);
app.use('/clientes', clientesRoutes); // Alias para flexibilidade

// Mapeamento absoluto do diretório estático público
const publicPath = path.resolve('public');
app.use(express.static(publicPath));

// Redirecionamento da raiz para a área administrativa de clientes
app.get('/', (req, res) => {
  res.redirect('/admin/clientes.html');
});

export default app;