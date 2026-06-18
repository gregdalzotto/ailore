<div align="center">

# ailore

**Busca semântica e RAG local-first para seu código e documentação.**

Faça perguntas em linguagem natural e receba respostas fundamentadas nos _seus próprios arquivos_ — com citações exatas no formato `arquivo:linha`. Funciona 100% offline com [Ollama](https://ollama.com), ou com OpenAI, Gemini e OpenRouter.

[![CI](https://github.com/gregdalzotto/ailore/actions/workflows/ci.yml/badge.svg)](https://github.com/gregdalzotto/ailore/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org)

[English 🇬🇧](./README.md)

</div>

---

## Por que o nome?

**`ailore` = AI + lore.**

Em inglês, _lore_ significa o conhecimento acumulado — muitas vezes informal — sobre algo: aquele entendimento que fica enterrado numa base de código e normalmente só vive na cabeça de quem está há mais tempo no projeto (_"the lore of this project"_). É exatamente esse conhecimento escondido e difícil de extrair que esta ferramenta traz à tona: ela lê seus arquivos e os transforma em respostas que você pode pedir em linguagem natural. O prefixo `ai` deixa o propósito explícito. Curto, fácil de digitar e de lembrar: `ailore ask "como funciona o auth?"`.

## O que faz

- 🔍 **Busca semântica** em qualquer pasta de código ou documentação.
- 💬 **Respostas fundamentadas** (RAG): pergunte e receba uma resposta sintetizada que **cita as linhas de origem** usadas.
- 🔒 **Local-first**: com Ollama, nada sai da sua máquina — sem API key, sem custo.
- 🔌 **Agnóstico de provedor**: alterne entre Ollama, OpenAI, Gemini e OpenRouter com uma flag.
- ⚡ **Indexação incremental**: só os arquivos alterados são re-embedados, então reindexar um repo grande é barato.
- 📎 **Citações confiáveis**: todo trecho aponta para `arquivo:linhaInicio-linhaFim`, então você pode verificar a resposta.
- 🪶 **Sem dependências pesadas**: o índice é um arquivo simples, sem banco para rodar, sem módulos nativos.

## Instalação

```bash
npm install -g ailore
# ou rode sem instalar:
npx ailore --help
```

Requer **Node.js >= 20**.

## Início rápido (100% local, sem API key)

1. Instale o [Ollama](https://ollama.com) e baixe um modelo de chat e um de embedding:

   ```bash
   ollama pull llama3.1
   ollama pull nomic-embed-text
   ```

2. Indexe um projeto e comece a perguntar:

   ```bash
   cd meu-projeto
   ailore index
   ailore ask "onde está implementado o rate limiter?"
   ```

Pronto. O índice é gravado em `.ailore/` no diretório atual.

## Tutorial passo a passo (para iniciantes)

Nunca usou uma ferramenta assim? Este guia vai do zero até a sua primeira
resposta, mostrando exatamente o que digitar e o que esperar em cada etapa. Ele
usa o modo **100% local** (Ollama) — sem API key, sem custo, nada sai da sua
máquina.

<details>
<summary><b>Abrir o tutorial completo</b></summary>

### 1. Confirme que você tem Node.js 20+

```bash
node --version
```

Se aparecer `v20.x` ou superior, está tudo certo. Se aparecer uma versão menor
ou `command not found`, instale o Node.js em [nodejs.org](https://nodejs.org) e
rode o comando de novo.

### 2. Instale o ailore

```bash
npm install -g ailore
ailore --version
```

`ailore --version` deve imprimir um número de versão. Se o terminal disser
`command not found: ailore`, feche e reabra o terminal e tente de novo.

### 3. Instale o Ollama e baixe dois modelos

O ailore precisa de **dois** modelos: um para transformar texto em vetores (para
a busca) e um para escrever as respostas (no `ask`).

1. Instale o Ollama em [ollama.com](https://ollama.com). Ele roda um pequeno
   servidor local em segundo plano.
2. Baixe um modelo de chat e um de embedding:

   ```bash
   ollama pull llama3.2   # modelo de chat — escreve as respostas
   ollama pull bge-m3     # modelo de embedding — multilíngue (ótimo p/ EN + PT-BR)
   ```

   > Só precisa de inglês? Use `nomic-embed-text` no lugar do `bge-m3` — é menor
   > e mais rápido, mas mais fraco para outros idiomas.

3. Confirme que baixaram:

   ```bash
   ollama list
   ```

   Você deve ver `llama3.2` e `bge-m3` na lista.

### 4. Crie uma configuração no seu projeto

```bash
cd /caminho/do/seu-projeto
ailore init
```

Abra o `ailore.config.json` gerado e confirme que os nomes dos modelos batem com
os que você baixou no passo 3:

```jsonc
{
  "chatModel": "llama3.2",
  "embeddingModel": "bge-m3",
}
```

### 5. Construa o índice

```bash
ailore index
```

Saída esperada (os números variam por projeto):

```
• Indexing /caminho/do/seu-projeto with ollama:bge-m3
  scanning files...
  embedding chunks: 113
✓ Indexed 42 files / 113 chunks
```

### 6. Buscar (sem IA, só trechos ranqueados)

```bash
ailore search "como funciona a autenticação"
```

Você recebe uma lista dos trechos mais relevantes, cada um com a referência
`arquivo:linha` e um score de relevância.

### 7. Perguntar (resposta completa com citações)

```bash
ailore ask "como funciona a autenticação?"
```

A resposta aparece em streaming no terminal e os arquivos de origem usados são
listados no final. Você pode perguntar em qualquer idioma — incluindo português.

🎉 Esse é o ciclo completo: **instalar → modelos → config → indexar → buscar → perguntar.**

</details>

## Uso

### `ailore index [caminho]`

Varre o diretório (respeitando o `.gitignore`), divide os arquivos em chunks alinhados por linha, gera embeddings e armazena tudo localmente. Reexecutar só re-embeda arquivos cujo conteúdo mudou.

```bash
ailore index                 # indexa o diretório atual
ailore index ./packages/api  # indexa uma subpasta
```

### `ailore ask <pergunta>`

Recupera os trechos mais relevantes e pede ao modelo para responder usando **apenas** esse contexto, com citações inline. A resposta aparece em streaming no terminal e as fontes são listadas ao final.

```bash
ailore ask "como validamos a assinatura dos webhooks?"
ailore ask -k 10 "resuma o processo de deploy"          # recupera mais contexto
ailore ask --no-stream "o que a camada de cache faz?"   # imprime tudo de uma vez
```

### `ailore search <consulta>`

Busca semântica pura — trechos ranqueados, sem chamar LLM. Ótimo para pular direto ao código relevante.

```bash
ailore search "rotação de refresh token jwt"
ailore search --json "migrations do banco" > hits.json
```

### `ailore init`

Cria um `ailore.config.json` inicial que você pode ajustar.

## Provedores

Escolha um provedor com `-p/--provider` (ou defina no arquivo de config). Embeddings e chat são configurados de forma independente — dá para misturar.

| Provedor     | Chat (padrão)        | Embedding (padrão)       | Requer               |
| ------------ | -------------------- | ------------------------ | -------------------- |
| `ollama`     | `llama3.1`           | `nomic-embed-text`       | Ollama rodando       |
| `openai`     | `gpt-4o-mini`        | `text-embedding-3-small` | `OPENAI_API_KEY`     |
| `gemini`     | `gemini-1.5-flash`   | `text-embedding-004`     | `GEMINI_API_KEY`     |
| `openrouter` | `openai/gpt-4o-mini` | _(cai para Ollama)_      | `OPENROUTER_API_KEY` |

```bash
export OPENAI_API_KEY=sk-...
ailore ask -p openai "explique o middleware de auth"

# Híbrido: embeddings locais, resposta hospedada
ailore ask -p openrouter --embedding-provider ollama "..."
```

> **Sobre o OpenRouter:** ele não oferece um endpoint de embeddings dedicado, então quando o OpenRouter é o provedor de chat, os embeddings caem automaticamente para o Ollama local. Use `--embedding-provider openai` se preferir embeddings hospedados.

## Configuração

O `ailore` resolve a configuração nesta ordem (o último vence):

**padrões internos → `ailore.config.json` → variáveis de ambiente → flags de CLI**

API keys são lidas **somente** do ambiente, nunca do arquivo de config, para que segredos jamais sejam commitados.

```jsonc
// ailore.config.json
{
  "provider": "ollama",
  "embeddingProvider": "ollama",
  "chatModel": "llama3.1",
  "embeddingModel": "nomic-embed-text",
  "retrieval": { "topK": 6, "minScore": 0 },
  "generation": { "temperature": 0.2, "maxTokens": 1024, "topP": 1, "seed": 42 },
  "chunk": { "maxChars": 1200, "overlapLines": 2 },
  "exclude": ["**/*.test.ts"],
}
```

### Ajuste de geração e recuperação

Nada é hardcoded — todo parâmetro relevante pode ser definido no arquivo de config, via variável de ambiente ou por chamada com uma flag (a flag vence). Útil para equilibrar custo, determinismo e tamanho da resposta:

| Parâmetro    | Config / Env / Flag                                                   | Padrão             | O que faz                                                                                              |
| ------------ | --------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------ |
| Temperatura  | `generation.temperature` · `AILORE_TEMPERATURE` · `-t, --temperature` | `0.2`              | Aleatoriedade. Mantenha baixo para respostas factuais e fundamentadas.                                 |
| Máx. tokens  | `generation.maxTokens` · `AILORE_MAX_TOKENS` · `--max-tokens`         | padrão do provedor | Limita o tamanho da resposta.                                                                          |
| Top-p        | `generation.topP` · `AILORE_TOP_P` · `--top-p`                        | padrão do provedor | Corte do nucleus sampling (0–1).                                                                       |
| Seed         | `generation.seed` · `AILORE_SEED` · `--seed`                          | nenhum             | Fixe para respostas **reprodutíveis** (mesma pergunta → mesma saída).                                  |
| Top-k        | `retrieval.topK` · `-k, --top-k`                                      | `6`                | Quantos trechos alimentar o modelo.                                                                    |
| Score mínimo | `retrieval.minScore` · `AILORE_MIN_SCORE` · `--min-score`             | `0`                | Descarta trechos abaixo desse score de cosseno para que correspondências fracas não diluam o contexto. |

```bash
# Resposta determinística e concisa
ailore ask --seed 42 --temperature 0 --max-tokens 300 "o que o cache faz?"

# Usar apenas contexto fortemente relevante
ailore ask --min-score 0.35 -k 10 "como o rate limiting é configurado?"
```

| Variável de ambiente                                             | Função                                               |
| ---------------------------------------------------------------- | ---------------------------------------------------- |
| `OPENAI_API_KEY`                                                 | Autenticação OpenAI                                  |
| `GEMINI_API_KEY` / `GOOGLE_API_KEY`                              | Autenticação Gemini                                  |
| `OPENROUTER_API_KEY`                                             | Autenticação OpenRouter                              |
| `OLLAMA_BASE_URL`                                                | Endpoint do Ollama (padrão `http://localhost:11434`) |
| `AILORE_PROVIDER`, `AILORE_CHAT_MODEL`, `AILORE_EMBEDDING_MODEL` | Override sem flags                                   |

## Uso como biblioteca

O motor de indexação/recuperação é exportado, então você pode embuti-lo nas suas próprias ferramentas:

```ts
import { loadConfig, createEmbeddingProvider, buildIndex, retrieve } from 'ailore';

const config = await loadConfig(process.cwd());
const embedder = createEmbeddingProvider(config);

await buildIndex(process.cwd(), config, embedder);

const hits = await retrieve(process.cwd(), config, embedder, 'como funciona o cache?');
for (const { chunk, score } of hits) {
  console.log(`${chunk.file}:${chunk.startLine}-${chunk.endLine} (${score.toFixed(3)})`);
}
```

## Como funciona

```
arquivos ─▶ varredura (.gitignore) ─▶ chunk (por linha) ─▶ embed ─▶ .ailore/index.json
                                                                       │
pergunta ─▶ embed ─▶ busca cosseno (top-k) ─▶ prompt fundamentado ─▶ LLM ─┘─▶ resposta + citações
```

- O **chunking** é alinhado por linha, então todo trecho carrega um intervalo de linhas exato — é isso que torna as citações precisas.
- A **busca** é um scan de cosseno exato (força bruta). Simples, preciso e rápido para os corpora pequenos e médios que esta ferramenta atende.
- A reindexação **incremental** faz hash de cada arquivo e pula os inalterados; arquivos deletados são removidos.

## Perguntas frequentes (FAQ)

<details>
<summary><b>Em quais idiomas posso perguntar e buscar?</b></summary>

Qualquer idioma — não existe uma configuração de idioma. Mas as duas etapas se
comportam de formas diferentes:

- **Perguntar (`ask`)**: o modelo de chat responde no idioma em que você
  escrever. Pergunte em português → resposta em português, mesmo que o código
  esteja em inglês.
- **Buscar (recuperação)**: a qualidade depende do **modelo de embedding**. O
  `nomic-embed-text` é otimizado para inglês; para um português forte (ou
  qualquer busca cruzada, como uma pergunta em PT-BR sobre código em inglês),
  use um modelo multilíngue.

Para mudar para busca multilíngue:

```bash
ollama pull bge-m3
# defina "embeddingModel": "bge-m3" no ailore.config.json e então:
ailore index
```

Trocar o modelo de embedding exige reindexar tudo (vetores de modelos diferentes
não são comparáveis). O ailore detecta a troca e reconstrói automaticamente.

</details>

<details>
<summary><b>Preciso de API key? Tem algum custo?</b></summary>

Não. Com o **Ollama** (o padrão), tudo roda localmente e de graça — sem API key,
sem custo de uso. Você só precisa de uma chave se escolher um provedor
hospedado:

```bash
export OPENAI_API_KEY=sk-...
ailore ask -p openai "..."
```

</details>

<details>
<summary><b>Meu código é enviado para algum lugar? É privado?</b></summary>

- **Com Ollama:** nada sai da sua máquina. A indexação e a geração da resposta
  acontecem inteiramente no seu computador.
- **Com um provedor hospedado (OpenAI/Gemini/OpenRouter):** o texto dos trechos
  recuperados para uma pergunta, mais a sua pergunta, é enviado a esse provedor
  para gerar a resposta — como em qualquer chamada de API. Suas API keys são
  lidas apenas de variáveis de ambiente e nunca são gravadas no arquivo de
  config nem no índice.

</details>

<details>
<summary><b>Como uso o ailore em qualquer projeto sem editar o config toda vez?</b></summary>

O arquivo de config é por projeto. Para definir seus modelos preferidos na
máquina inteira, exporte variáveis de ambiente (ex.: no `~/.zshrc` ou
`~/.bashrc`):

```bash
export AILORE_CHAT_MODEL=llama3.2
export AILORE_EMBEDDING_MODEL=bge-m3
```

Agora você pode dar `cd` em qualquer projeto e simplesmente rodar `ailore index`
/ `ailore ask`.

</details>

<details>
<summary><b>Como obtenho a mesma resposta toda vez (reprodutível)?</b></summary>

Passe um `--seed` fixo e temperatura `0`:

```bash
ailore ask --seed 42 --temperature 0 "o que a camada de cache faz?"
```

</details>

<details>
<summary><b>A resposta cita os docs em vez do código — como controlo o que é indexado?</b></summary>

Use globs de `include`/`exclude` no `ailore.config.json`. Por exemplo, para
ignorar markdown e fazer as respostas virem do código:

```jsonc
{ "exclude": ["**/*.md"] }
```

Depois reindexe com `ailore index`. Você também pode limitar uma execução a uma
subpasta: `ailore index ./src`.

</details>

<details>
<summary><b>Aparece "No index found. Run ailore index first."</b></summary>

O `search` e o `ask` leem um índice criado pelo `index`. Rode `ailore index` no
projeto primeiro. Se você roda os comandos de outra pasta, aponte para o projeto
com `-C`: `ailore ask -C /caminho/do/projeto "..."`.

</details>

<details>
<summary><b>Aparece erro de conexão do Ollama ou "model not found"</b></summary>

- **Erro de conexão:** o servidor do Ollama não está rodando. Abra o app do
  Ollama, ou rode `ollama serve` em um terminal separado.
- **Model not found:** baixe o modelo primeiro, ex.: `ollama pull bge-m3`, e
  confirme com `ollama list`. O nome no `ailore.config.json` precisa ser
  exatamente igual.

</details>

<details>
<summary><b>Mudei alguns arquivos — preciso reindexar tudo?</b></summary>

Não. O `ailore index` é incremental: ele faz hash de cada arquivo e só re-embeda
os que mudaram (e remove os deletados). Basta rodar `ailore index` de novo — ele
vai reportar algo como `1 changed · 41 unchanged · 0 removed`.

</details>

<details>
<summary><b>Qual o tamanho de projeto que ele aguenta?</b></summary>

A busca é um scan de cosseno exato mantido inteiramente em memória, o que é
rápido e preciso para bases pequenas e médias (até cerca de dezenas de milhares
de chunks). Para monorepos muito grandes, limite o índice às pastas relevantes
(`ailore index ./src`) ou use globs de `exclude`. Um índice de vizinhos
aproximados (ANN) para repositórios enormes está no [roadmap](#roadmap).

</details>

<details>
<summary><b>Como desinstalo ou reseto?</b></summary>

```bash
rm -rf .ailore            # apaga o índice de um projeto (refeito no próximo `ailore index`)
npm uninstall -g ailore   # remove o comando global
```

</details>

## Roadmap

- [ ] Índice de vizinhos aproximados (ANN) para repositórios muito grandes
- [ ] Modo watch (`ailore index --watch`)
- [ ] Ingestão de PDF e notebooks
- [ ] Etapa de re-ranking antes da geração

## Contribuindo

Contribuições são bem-vindas — veja [CONTRIBUTING.md](./CONTRIBUTING.md).

## Licença

[MIT](./LICENSE) © [Gregori Dalzotto](https://github.com/gregdalzotto)
