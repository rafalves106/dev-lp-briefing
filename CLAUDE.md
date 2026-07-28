# CLAUDE.md — briefing-app

## Contexto do projeto

Ferramenta interna de briefing para clientes de LP (landing pages de alta conversão pra clínicas médicas/estéticas), enviada via WhatsApp logo após o fechamento do projeto. Fluxo: o cliente recebe um link único por token → responde poucas perguntas em formato de balões de chat, com áudio narrando cada pergunta e palavras-chave animadas no fundo conforme digita → tela de revisão com informações adicionais e upload de arquivos → envio salva no SQLite e dispara e-mail.

Não é uma LP pública de cliente — é uso interno da agência, sem necessidade de SEO/Schema/Open Graph.

## Stack obrigatória (não desviar sem confirmar antes)

- HTML5 semântico
- Tailwind CSS via CLI local — build: `npx tailwindcss -i input.css -o assets/style.min.css --minify` — nunca CDN, nunca editar `style.min.css` na mão
- GSAP self-hosted (`assets/js/gsap.min.js`) — animações só com `transform`/`opacity` (GPU), estados iniciais sempre via `gsap.set()`
- Fontes Inter self-hosted em woff2 (`assets/fonts/`), `font-display: swap`
- Vanilla JS dentro de `DOMContentLoaded`, scripts com `defer`
- Deploy via Docker + nginx + Cloudflare Tunnel (nunca Netlify/Vercel)
- Identidade visual: a mesma da LP pessoal do usuário (landing.falveshub.com) — fundo `#0a0a0a`, texto `#f0f0f0`, neon `#00ff88`, classes `.glass`/`.glass-neon`/`.neon-text`/`.btn-neon`/`.gradient-border`, cursor customizado, Inter 400/700/900 — tudo já replicado no `<style>` embutido do `index.html`, não recriar do zero

## Decisões já tomadas nessa conversa

- **TTS:** Piper self-hosted (não Web Speech API, não ElevenLabs). Como são poucas perguntas fixas, o áudio é **pré-gerado uma vez** e servido como arquivo estático em `assets/audio/pergunta-N.ogg` — não roda em tempo real a cada acesso
- **Painel admin:** quer um painel simples além do e-mail, pra ver os briefings recebidos
- **Acesso:** link único por token por projeto/cliente (não é formulário público)
- **Salvamento:** progressivo — cada resposta é salva no backend assim que o balão é respondido, não só no envio final
- **Revisão final** inclui: resumo editável das respostas + campo de informações adicionais (opcional, não bloqueia envio) + upload de identidade visual (múltiplos arquivos) + campo de links de inspiração + campo de concorrentes (textareas, um item por linha cada)
- Perguntas do briefing: poucas, 5 a 8 (hoje há 6 de exemplo, editáveis em `assets/js/app.js`, array `QUESTIONS`)

## O que já está pronto (front-end)

- `index.html` completo: tela intro → balões de pergunta → revisão/informações adicionais → confirmação
- `assets/js/app.js`: toda a lógica do fluxo — barra de progresso, áudio por pergunta, extração de palavras-chave (stopwords PT-BR) animadas com GSAP, chat log das respostas já dadas, edição a partir da revisão, upload de arquivos com drag&drop e validação (15MB, svg/png/webp/jpg/pdf), `fetch` já implementado para os endpoints do backend (falha graciosamente enquanto o backend não existe)
- `assets/style.min.css`: já buildado via Tailwind CLI a partir das classes usadas no `index.html`
- `assets/js/gsap.min.js`: arquivo real da lib (via pacote npm `gsap`)
- `assets/fonts/*.woff2`: arquivos reais (via pacote npm `@fontsource/inter`), renomeados pro padrão `inter-v20-latin-*` usado na LP original
- `tailwind.config.js`, `input.css`, `package.json`: fonte pro rebuild do CSS

## O que falta (nessa ordem)

1. **`server.js`** — Node/Express + `better-sqlite3`
   - `GET /briefing/:token` → carrega projeto e perguntas
   - `POST /briefing/:token/answer` → salva resposta progressiva (JSON: `question_key`, `answer_text`)
   - `POST /briefing/:token/submit` → recebe `multipart/form-data` (respostas + informações adicionais + anexos), marca projeto como concluído, salva anexos em `server/uploads/:project_id/`, dispara e-mail via nodemailer
   - `GET /admin` → painel de listagem dos briefings
   - `GET /admin/briefing/:id` → detalhe de um briefing, com anexos como links de download
   - Proteger `/admin` via Cloudflare Access (já que o deploy já roda atrás de Cloudflare Tunnel) em vez de montar login próprio
2. **Áudio Piper TTS** — gerar os `.ogg` das 6 perguntas de `assets/js/app.js` e salvar em `assets/audio/pergunta-1.ogg` até `pergunta-6.ogg`
3. **Dockerfile + docker-compose.yml + nginx.conf** — `expires 1y` + `Cache-Control public, immutable` pra `js`, `css`, `woff2`, `webp`, `svg`

## Schema SQLite (ainda não criado)

```sql
CREATE TABLE projects (
  id INTEGER PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  project_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending | in_progress | completed
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE answers (
  id INTEGER PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  question_key TEXT NOT NULL,
  answer_text TEXT,
  answered_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attachments (
  id INTEGER PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  question_key TEXT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

Campos como `informacoes_adicionais`, `links_inspiracao` e `concorrentes` entram na tabela `answers` com `question_key` correspondente — não precisam de tabela própria.

## Convenções de resposta

- Sempre português brasileiro, direto, sem frases genéricas de IA ("Certamente!", "Ótima pergunta!")
- Código sempre completo e funcional, sem placeholders tipo "adicione aqui"
- PageSpeed/SEO/Schema/Open Graph: **não se aplicam** a esse projeto (ferramenta interna, não indexada)
