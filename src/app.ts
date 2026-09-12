// src/app.ts
import express, { Application, Request, Response } from 'express';
import path from 'node:path';

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.middlewares();
    this.routes();
  }

  private middlewares(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Servidor de arquivos estáticos apontando para a pasta /public
    const publicPath = path.resolve('public');
    this.app.use(express.static(publicPath));
  }

  private routes(): void {
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({ status: 'OK', message: 'API Alexandria ativa' });
    });
  }
}

export default new App().app;