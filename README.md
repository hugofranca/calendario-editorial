# Calendário Editorial

App autónoma (HTML/CSS/JS, sem dependências externas) para planear conteúdos de
Produto e Marketing, com vista mensal/trimestral, filtros por categoria, modal de
detalhes por evento e criação de tarefas no Asana.

Serve-se **a partir do Google Apps Script** (HtmlService), com acesso **restrito
ao domínio visma.com** (SSO Google), e guarda os eventos numa **Google Sheet
partilhada** — todos veem e editam os mesmos dados.

## Arquitetura

- A app é servida pelo Apps Script: `doGet()` devolve o `Index.html`.
- O cliente lê/grava via `google.script.run` (sem `fetch`, sem CORS).
- Os eventos ficam numa folha `Eventos` da Google Sheet associada ao script.
- Só quem estiver autenticado numa conta Google **visma.com** consegue abrir a
  app (a Google faz o SSO). Nada é público na internet.

Aberto **fora** do Apps Script (ex.: `index.html` num ficheiro local), o
`google.script.run` não existe e a app corre em **modo local** (dados só nesse
navegador, via `localStorage`) — útil para testar o UI isoladamente.

O token do Asana **nunca** é partilhado — fica sempre no `localStorage` do
navegador de cada pessoa (⚙ Asana).

## Setup (uma vez)

1. Cria uma **Google Sheet** nova (folha em branco), com a tua conta visma.com.
2. Menu **Extensões → Apps Script**.
3. No ficheiro `Code.gs`, apaga o conteúdo inicial e cola todo o `Code.gs` deste
   repositório. Guarda 💾.
4. **+ (Adicionar ficheiro) → HTML**. Dá-lhe o nome exato **`Index`** (sem `.html`)
   e cola nele todo o conteúdo do `index.html` deste repositório. Guarda.
5. **Implementar → Nova implementação** → engrenagem → **Aplicação Web**:
   - **Executar como:** Eu (a tua conta).
   - **Quem tem acesso:** **Qualquer pessoa da Visma** (o domínio visma.com).
     *Não* "Só eu" nem "Qualquer pessoa".
   - **Implementar** e autoriza os acessos pedidos.
6. Partilha o **URL da aplicação Web** (`/exec`) com a equipa. Todos precisam de
   estar autenticados na conta Google visma.com.

> Ao atualizar o código mais tarde, usa **Implementar → Gerir implementações →
> editar (lápis) → Versão: Nova versão → Implementar** para o URL `/exec`
> continuar o mesmo.

### Nota sobre o Asana

O botão "Criar tarefa no Asana" faz o pedido a partir do browser (o token nunca
sai do teu navegador). Se num contexto Apps Script a API do Asana bloquear o
pedido por CORS, a alternativa é encaminhar a chamada pelo servidor
(`UrlFetchApp`); nesse caso o token passa a ser enviado para a tua própria
execução do script (continua guardado apenas no teu browser).

## Desenvolvimento

É um único ficheiro `index.html`. Abre-o diretamente no navegador para trabalhar
no UI (corre em modo local). A lógica de dados partilhados só está ativa quando
servido pelo Apps Script.
