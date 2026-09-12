import express from 'express';
import path from 'path';

const app = express();

app.use(express.json());

// Mapeamento absoluto do diretório estático público
const publicPath = path.resolve('public');
app.use(express.static(publicPath));

export default app;