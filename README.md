# Calendário Editorial

App autónoma (HTML/CSS/JS, sem dependências externas) para planear conteúdos de
Produto e Marketing, com vista mensal/trimestral, filtros por categoria, modal de
detalhes por evento e criação de tarefas no Asana.

Publicada em **GitHub Pages** e, opcionalmente, ligada a uma **Google Sheet
partilhada** para que toda a equipa veja e edite os mesmos eventos.

## Como funciona o armazenamento

- **Modo local** (`API_URL` vazio no `index.html`): os eventos ficam no
  `localStorage` do navegador de cada pessoa. Bom para testar; **não** partilha
  dados entre pessoas.
- **Modo partilhado** (`API_URL` preenchido): os eventos ficam numa Google Sheet,
  acedida através de um Google Apps Script Web App. Todos veem e editam o mesmo.
  O indicador no canto superior direito mostra `☁ Partilhado` / `⚠ Sem ligação`.

O token do Asana **nunca** é partilhado — fica sempre no `localStorage` do
navegador de cada pessoa (⚙ Asana).

## Ativar os dados partilhados (Google Apps Script)

1. Cria uma **Google Sheet** nova (folha em branco).
2. Menu **Extensões → Apps Script**.
3. Apaga o conteúdo inicial, cola todo o `Code.gs` deste repositório e **guarda**
   (ícone do disco).
4. **Implementar → Nova implementação**.
   - Clica na roda dentada → **Aplicação Web**.
   - **Executar como:** Eu (a tua conta).
   - **Quem tem acesso:** Qualquer pessoa.
   - **Implementar**. Autoriza os acessos quando pedido.
5. Copia o **URL da aplicação Web** (termina em `/exec`).
6. No `index.html`, preenche a constante:
   ```js
   const API_URL = 'https://script.google.com/macros/s/AKfy.../exec';
   ```
7. Faz commit + push. O GitHub Pages atualiza em 1–2 minutos.

> Se atualizares o `Code.gs` mais tarde, usa **Implementar → Gerir implementações
> → editar (lápis) → Nova versão** para o URL `/exec` continuar o mesmo.

### Nota de segurança

O site publicado e o endpoint da Sheet são acessíveis a quem tiver o link
(qualquer pessoa pode ler/editar). É adequado para um calendário interno de
equipa; não coloques aqui dados sensíveis.

## Desenvolvimento

É um único ficheiro `index.html`. Abre-o diretamente no navegador ou serve a
pasta com qualquer servidor estático.
