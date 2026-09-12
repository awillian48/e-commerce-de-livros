@echo off
title Livraria Alexandria - Abrir Cypress App
cd /d "%~dp0"

echo ================================================================
echo   Livraria Alexandria - Painel de Testes Cypress (LES 2026)
echo   Anderson Barros & Joao Pedro Scandiuzzi
echo ================================================================
echo.
echo Abrindo o aplicativo desktop do Cypress diretamente na tela...
echo.
echo Passos no aplicativo:
echo  1. Clique em "E2E Testing"
echo  2. Escolha o navegador (Chrome ou Electron)
echo  3. Clique no arquivo "crud_cliente.cy.js" para executar os testes!
echo.

call npx cypress open
