# Comandos

[🏠 Início](../../README.pt-BR.md) · [📚 Docs](./README.md) · [English 🇬🇧](../en/commands.md)

Todos os comandos aceitam as flags globais `-C, --path <dir>` (operar em outro diretório), `-p, --provider`, `--embedding-provider`, `-m, --model`, `--embedding-model` e `--index-dir`. Veja [Configuração](./configuration.md) para a lista completa.

## `ailore index [caminho]`

Varre o diretório (respeitando o `.gitignore`), divide os arquivos em chunks alinhados por linha, gera embeddings e armazena tudo localmente. Reexecutar só re-embeda arquivos cujo conteúdo mudou.

```bash
ailore index                 # indexa o diretório atual
ailore index ./packages/api  # indexa uma subpasta
```

## `ailore ask <pergunta>`

Recupera os trechos mais relevantes e pede ao modelo para responder usando **apenas** esse contexto, com citações inline. A resposta aparece em streaming no terminal e as fontes são listadas ao final.

```bash
ailore ask "como validamos a assinatura dos webhooks?"
ailore ask -k 10 "resuma o processo de deploy"          # recupera mais contexto
ailore ask --no-stream "o que a camada de cache faz?"   # imprime tudo de uma vez
```

Flags: `-k, --top-k`, `--min-score`, `--mode`, `-t, --temperature`, `--max-tokens`, `--top-p`, `--seed`, `--no-stream`. Veja [Configuração](./configuration.md).

## `ailore search <consulta>`

Trechos ranqueados, sem chamar LLM. Usa [busca híbrida](./retrieval-modes.md) por padrão; troque com `--mode`. Ótimo para pular direto ao código relevante.

```bash
ailore search "rotação de refresh token jwt"
ailore search --mode keyword "TokenRotationError"   # busca de símbolo exato
ailore search --json "migrations do banco" > hits.json
```

## `ailore init`

Cria um `ailore.config.json` inicial que você pode ajustar. Veja [Configuração](./configuration.md).

## `ailore mcp`

Sobe um servidor [MCP](https://modelcontextprotocol.io) via stdio, expondo duas ferramentas — `ailore_search` e `ailore_ask` — para que um cliente de IA busque e pergunte sobre o seu índice **sozinho**, com as mesmas citações `arquivo:linha`.

```bash
ailore mcp                 # serve o diretório atual
ailore mcp -C ./meu-projeto # serve um projeto específico
```

A configuração completa do cliente (Claude, Cursor, …) está em [Integração com editores / MCP](./mcp.md).

<!-- nav-footer -->

---

<div align="center"><sub>[← Anterior: Começando](./getting-started.md) · [📚 Todos os guias](./README.md) · [Próximo: Configuração →](./configuration.md)</sub></div>
