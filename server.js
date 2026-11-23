import dns from 'node:dns';
import app from './src/app.js';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor executando na porta ${PORT}`);
});