import express from 'express';
import path from 'path';
import clientesRoutes from './routes/clientesRoutes.js';
import livrosRoutes from './routes/livrosRoutes.js';
import pedidosRoutes from './routes/pedidosRoutes.js';
import cuponsRoutes from './routes/cuponsRoutes.js';
import trocasRoutes from './routes/trocasRoutes.js';
import analiseRoutes from './routes/analiseRoutes.js';

const app = express();

app.use(express.json());

// Rotas da API REST
app.use('/api/clientes', clientesRoutes);
app.use('/clientes', clientesRoutes);
app.use('/api/livros', livrosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/cupons', cuponsRoutes);
app.use('/api/trocas', trocasRoutes);
app.use('/api/analise', analiseRoutes);

// Mapeamento absoluto do diretório estático público
const publicPath = path.resolve('public');
app.use(express.static(publicPath));

// Redirecionamento da raiz para a área administrativa de clientes
app.get('/', (req, res) => {
  res.redirect('/admin/clientes.html');
});

export default app;
