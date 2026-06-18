# Integração com editores / MCP

[← Índice de docs](../../README.pt-BR.md) · [English 🇬🇧](../en/mcp.md)

O `ailore` fala o [Model Context Protocol](https://modelcontextprotocol.io), então qualquer cliente compatível com MCP (clientes Claude, Cursor, …) pode usar o seu índice como ferramenta. Indexe uma vez e deixe o assistente chamar `ailore_search` / `ailore_ask` enquanto você trabalha — as respostas continuam fundamentadas nos seus arquivos, com citações `arquivo:linha`.

O servidor expõe duas ferramentas:

| Ferramenta      | O que faz                                  | Argumentos                   |
| --------------- | ------------------------------------------ | ---------------------------- |
| `ailore_search` | Trechos ranqueados, sem chamar LLM.        | `query`, `topK?`, `mode?`    |
| `ailore_ask`    | Resposta fundamentada com lista de fontes. | `question`, `topK?`, `mode?` |

`mode` é um de `vector` / `keyword` / `hybrid` (veja [Modos de recuperação](./retrieval-modes.md)).

## Pré-requisitos (uma vez)

O SDK do MCP é uma dependência **opcional**, então o install base continua enxuto. Instale-o ao lado do `ailore` e indexe o projeto que você quer consultar:

```bash
# 1. Instale o ailore + o SDK opcional do MCP, globais e lado a lado
npm install -g ailore @modelcontextprotocol/sdk

# 2. Indexe o projeto (Ollama rodando, ou um provedor configurado)
cd /caminho/do/seu-projeto
ailore index
```

> Se o SDK estiver ausente, o `ailore mcp` mostra exatamente o que instalar — ele nunca falha em silêncio.

## Claude Code

Registre o servidor com um comando:

```bash
claude mcp add ailore -- ailore mcp -C /caminho/absoluto/do/seu-projeto
```

- O `--` separa as flags do próprio Claude do comando do servidor. Use um caminho **absoluto** no `-C` (o cliente pode iniciar de outro diretório de trabalho).
- **Escopo** (opcional): o padrão é `local` (este projeto, só você). Use `-s user` para todos os seus projetos, ou `-s project` para compartilhar via um `.mcp.json` commitado.
- **Provedor hospedado?** Passe a chave no ambiente do servidor: `claude mcp add ailore -e OPENAI_API_KEY=sk-... -- ailore mcp -C /caminho`. Com Ollama (local) não precisa de chave.

Verifique e use:

```bash
claude mcp list          # ailore deve mostrar ✔ Connected
claude mcp get ailore
```

Numa sessão, digite `/mcp` para ver os servidores conectados e suas ferramentas. Depois é só perguntar naturalmente — o assistente chama `ailore_search` / `ailore_ask` sozinho. Pode forçar: _"use as ferramentas do ailore para responder a partir do código indexado."_

Remova com `claude mcp remove ailore`.

## Claude Desktop

Edite o arquivo de config (macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`):

```jsonc
{
  "mcpServers": {
    "ailore": {
      "command": "ailore",
      "args": ["mcp", "-C", "/caminho/absoluto/do/seu-projeto"],
      "env": { "OPENAI_API_KEY": "sk-..." }, // omita ao usar Ollama
    },
  },
}
```

Reinicie o Claude Desktop. As ferramentas aparecem no menu de ferramentas (🔌).

## Cursor e outros clientes MCP

O formato é o mesmo para qualquer cliente — uma entrada de servidor stdio:

```jsonc
{
  "mcpServers": {
    "ailore": {
      "command": "ailore",
      "args": ["mcp", "-C", "/caminho/absoluto/do/seu-projeto"],
    },
  },
}
```

## Notas

- **`ailore_ask`** precisa do provedor de chat disponível (Ollama rodando, ou uma API key no ambiente do servidor). **`ailore_search --mode keyword`** não precisa de nenhum — apenas do índice.
- A comunicação é via **stdio**: o stdout carrega o protocolo, então o `ailore` loga apenas no stderr.
- Rode `ailore index` de novo sempre que o código mudar, para as ferramentas ficarem atualizadas.
