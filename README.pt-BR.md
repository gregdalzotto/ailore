<div align="center">

<img src="./media/banner.svg" alt="ailore" width="820" />

<br>

**Busca semântica &amp; RAG local-first para seu código e documentação.**

Pergunte em linguagem natural e receba respostas fundamentadas nos _seus próprios arquivos_ — com citações exatas `arquivo:linha`.<br>Funciona 100% offline com [Ollama](https://ollama.com), ou com OpenAI, Gemini e OpenRouter.

<br>

[![npm version](https://img.shields.io/npm/v/ailore.svg?color=22d3ee&labelColor=0B0E14)](https://www.npmjs.com/package/ailore)
[![npm downloads](https://img.shields.io/npm/dm/ailore.svg?color=34d399&labelColor=0B0E14)](https://www.npmjs.com/package/ailore)
[![CI](https://github.com/gregdalzotto/ailore/actions/workflows/ci.yml/badge.svg)](https://github.com/gregdalzotto/ailore/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-22d3ee.svg?labelColor=0B0E14)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-34d399.svg?labelColor=0B0E14)](https://nodejs.org)

[**English 🇬🇧**](./README.md)

</div>

<br>

```console
$ ailore ask "como a busca híbrida combina BM25 e busca vetorial?"

O modo híbrido roda dois ranqueamentos sobre os mesmos trechos — cosseno para
significado e BM25 para tokens exatos — e os funde via Reciprocal Rank Fusion,
então a ordem reflete aquilo em que os dois métodos concordam. [core/retriever.ts:30-57]

Sources:
  core/retriever.ts:30-57
  core/bm25.ts:88-117
```

<br>

## O que faz

- 🔍 **Busca híbrida** — ranqueamento semântico (vetorial) e lexical (BM25) fundidos, acertando tanto conceitos quanto símbolos exatos.
- 💬 **Respostas fundamentadas** (RAG) — uma resposta sintetizada que cita as linhas de origem exatas que usou.
- 🔒 **Local-first** — com Ollama, nada sai da sua máquina: sem API key, sem custo.
- 🔌 **Agnóstico de provedor** — alterne entre Ollama, OpenAI, Gemini e OpenRouter com uma flag.
- 🧩 **Servidor MCP** — `ailore mcp` expõe buscar/perguntar como ferramentas para o Cursor e qualquer assistente compatível com MCP.
- ⚡ **Indexação incremental** — só os arquivos alterados são re-embedados; o índice é um arquivo simples, sem banco, sem módulos nativos.

<br>

## Início rápido

_Não precisa clonar este repositório — o `npm install` abaixo é tudo que você precisa para usar o ailore (o código aqui é só para ler ou contribuir)._

```bash
# 1. Instale (caminho Ollama = 100% local, sem API key)
npm install -g ailore
ollama pull llama3.1 && ollama pull nomic-embed-text

# 2. Indexe um projeto
cd meu-projeto && ailore index

# 3. Pergunte
ailore ask "onde está implementado o rate limiter?"
```

> [!TIP]
> Primeira vez? O [**guia Começando**](./docs/pt-BR/getting-started.md) te leva passo a passo — da instalação dos modelos à sua primeira resposta com citações.

<br>

## Demo

<div align="center">

![demo do ailore — index, search e ask com citações](./media/demo.gif)

</div>

<br>

## 📚 Documentação

| Guia                                                       | O que tem dentro                                                           |
| ---------------------------------------------------------- | -------------------------------------------------------------------------- |
| 🚀 [Começando](./docs/pt-BR/getting-started.md)            | Instalação, modelos, primeiro índice, primeira resposta — passo a passo.   |
| ⌨️ [Comandos](./docs/pt-BR/commands.md)                    | `index`, `ask`, `search`, `init`, `mcp` e suas flags.                      |
| ⚙️ [Configuração](./docs/pt-BR/configuration.md)           | Arquivo de config, variáveis de ambiente, ajuste de geração e recuperação. |
| 🎯 [Modos de recuperação](./docs/pt-BR/retrieval-modes.md) | `hybrid` / `vector` / `keyword` e como funciona a fusão RRF.               |
| 🔌 [Provedores](./docs/pt-BR/providers.md)                 | Ollama, OpenAI, Gemini, OpenRouter — misture à vontade.                    |
| 🧩 [Integração com editores / MCP](./docs/pt-BR/mcp.md)    | Conecte o `ailore` ao Claude, Cursor e outros clientes MCP.                |
| 🛠️ [Como funciona](./docs/pt-BR/architecture.md)           | O pipeline scan → chunk → embed → recuperar → responder.                   |
| 📦 [Uso como biblioteca](./docs/pt-BR/library-api.md)      | Embuta o motor nas suas próprias ferramentas.                              |
| ❓ [FAQ](./docs/pt-BR/faq.md)                              | Idiomas, privacidade, custo, solução de problemas.                         |

<div align="center"><sub><a href="./docs/pt-BR/README.md">Explore o hub completo de documentação →</a></sub></div>

<br>

## Como funciona

```
arquivos ─▶ varredura (.gitignore) ─▶ chunk (por linha) ─▶ embed ─▶ .ailore/index.json
                                                                       │
pergunta ─▶ ┌─ cosseno (semântico) ─┐                                  │
            ├─ BM25 (lexical) ──────┤─ fusão RRF (top-k) ─▶ prompt ─▶ LLM ┘─▶ resposta + citações
            └───────────────────────┘
```

O chunking é alinhado por linha, então todo trecho recuperado carrega um intervalo exato `arquivo:linhaInicio-linhaFim` — é isso que torna as citações precisas e verificáveis. Detalhes completos em [Como funciona](./docs/pt-BR/architecture.md).

<br>

## Por que o nome?

**`ailore` = AI + lore.** _Lore_ é o conhecimento acumulado e informal que fica enterrado numa base de código e normalmente só vive na cabeça de quem está há mais tempo no projeto. O ailore lê seus arquivos e transforma esse conhecimento escondido em respostas que você pede em linguagem natural.

<br>

## Roadmap

- [ ] Índice de vizinhos aproximados (ANN) para repositórios muito grandes
- [ ] Modo watch (`ailore index --watch`)
- [ ] Ingestão de PDF e notebooks
- [ ] Etapa de re-ranking antes da geração

## Contribuindo

Contribuições são bem-vindas — veja [CONTRIBUTING.md](./CONTRIBUTING.md).

## Licença

[MIT](./LICENSE) © [Gregori Dalzotto](https://github.com/gregdalzotto)
