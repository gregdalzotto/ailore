# Provedores

[🏠 Início](../../README.pt-BR.md) · [📚 Docs](./README.md) · [English 🇬🇧](../en/providers.md)

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

## Misturando embeddings e chat

Como as duas etapas são desacopladas, você pode embedar localmente (grátis, privado) e responder com um modelo hospedado, ou vice-versa:

```bash
# Embeddings locais e privados + um modelo de chat hospedado
ailore index --embedding-provider ollama
ailore ask -p openai --embedding-provider ollama "resuma o indexador"
```

> [!NOTE]
> **OpenRouter** não oferece um endpoint de embeddings dedicado, então quando ele é o provedor de chat, os embeddings caem automaticamente para o Ollama local. Use `--embedding-provider openai` se preferir embeddings hospedados.

## Privacidade

- **Com Ollama:** nada sai da sua máquina — indexação e respostas são totalmente locais.
- **Com um provedor hospedado:** os trechos recuperados mais a sua pergunta são enviados a esse provedor para gerar a resposta, como em qualquer chamada de API. As API keys são lidas apenas de variáveis de ambiente. Veja o [FAQ](./faq.md) para detalhes.

<!-- nav-footer -->

---

<div align="center"><sub>[← Anterior: Modos de recuperação](./retrieval-modes.md) · [📚 Todos os guias](./README.md) · [Próximo: Integração com editores / MCP →](./mcp.md)</sub></div>
