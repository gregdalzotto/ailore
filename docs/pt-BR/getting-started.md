# Começando

[🏠 Início](../../README.pt-BR.md) · [📚 Docs](./README.md) · [English 🇬🇧](../en/getting-started.md)

Este guia vai do zero até a sua primeira resposta usando o modo **100% local** (Ollama) — sem API key, sem custo, nada sai da sua máquina.

> [!NOTE]
> **Você não precisa clonar este repositório para usar o ailore.** Basta instalar o pacote do npm (abaixo) — o código-fonte está aqui apenas para você ler ou contribuir. Para usar a ferramenta: `npm install -g ailore`, ou rode sob demanda com `npx ailore`.

## Início rápido (3 passos)

1. Instale o [Ollama](https://ollama.com) e baixe um modelo de chat e um de embedding:

   ```bash
   ollama pull llama3.1
   ollama pull nomic-embed-text
   ```

2. Instale o ailore e indexe um projeto:

   ```bash
   npm install -g ailore
   cd meu-projeto
   ailore index
   ```

3. Pergunte:

   ```bash
   ailore ask "onde está implementado o rate limiter?"
   ```

O índice é gravado em `.ailore/` no diretório atual.

## Tutorial passo a passo (para iniciantes)

### 1. Confirme que você tem Node.js 20+

```bash
node --version
```

Se aparecer `v20.x` ou superior, está tudo certo. Se aparecer uma versão menor ou `command not found`, instale o Node.js em [nodejs.org](https://nodejs.org) e rode o comando de novo.

### 2. Instale o ailore

```bash
npm install -g ailore
ailore --version
```

`ailore --version` deve imprimir um número de versão. Se o terminal disser `command not found: ailore`, feche e reabra o terminal e tente de novo.

### 3. Instale o Ollama e baixe dois modelos

O ailore precisa de **dois** modelos: um para transformar texto em vetores (para a busca) e um para escrever as respostas (no `ask`).

1. Instale o Ollama em [ollama.com](https://ollama.com). Ele roda um pequeno servidor local em segundo plano.
2. Baixe um modelo de chat e um de embedding:

   ```bash
   ollama pull llama3.2   # modelo de chat — escreve as respostas
   ollama pull bge-m3     # modelo de embedding — multilíngue (ótimo p/ EN + PT-BR)
   ```

   > Só precisa de inglês? Use `nomic-embed-text` no lugar do `bge-m3` — é menor e mais rápido, mas mais fraco para outros idiomas.

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

Abra o `ailore.config.json` gerado e confirme que os nomes dos modelos batem com os que você baixou no passo 3:

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

Você recebe uma lista dos trechos mais relevantes, cada um com a referência `arquivo:linha` e um score de relevância.

### 7. Perguntar (resposta completa com citações)

```bash
ailore ask "como funciona a autenticação?"
```

A resposta aparece em streaming no terminal e os arquivos de origem usados são listados no final. Você pode perguntar em qualquer idioma — incluindo português.

🎉 Esse é o ciclo completo: **instalar → modelos → config → indexar → buscar → perguntar.**

## Próximos passos

- [Referência de comandos](./commands.md) — todos os comandos e flags.
- [Configuração](./configuration.md) — ajuste modelos, recuperação e geração.
- [Integração com editores / MCP](./mcp.md) — deixe seu assistente de IA consultar o índice.
- [FAQ](./faq.md) — idiomas, privacidade, solução de problemas.

<!-- nav-footer -->

---

<div align="center"><sub>[📚 Todos os guias](./README.md) · [Próximo: Comandos →](./commands.md)</sub></div>
