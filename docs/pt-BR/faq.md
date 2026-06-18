# Perguntas frequentes (FAQ)

[🏠 Início](../../README.pt-BR.md) · [📚 Docs](./README.md) · [English 🇬🇧](../en/faq.md)

<details open>
<summary><b>Preciso clonar este repositório para usar o ailore?</b></summary>

Não. Para **usar** o ailore, basta instalar o pacote publicado no npm:

```bash
npm install -g ailore     # depois rode `ailore` em qualquer lugar
# ou, sem instalar:
npx ailore --help
```

Clonar o repositório só é necessário se você quiser **ler o código-fonte ou contribuir**. Tudo que você precisa para indexar e consultar seus próprios projetos já vem no pacote do npm.

</details>

<details>
<summary><b>Em quais idiomas posso perguntar e buscar?</b></summary>

Qualquer idioma — não existe uma configuração de idioma. Mas as duas etapas se comportam de formas diferentes:

- **Perguntar (`ask`)**: o modelo de chat responde no idioma em que você escrever. Pergunte em português → resposta em português, mesmo que o código esteja em inglês.
- **Buscar (recuperação)**: a qualidade depende do **modelo de embedding**. O `nomic-embed-text` é otimizado para inglês; para um português forte (ou qualquer busca cruzada, como uma pergunta em PT-BR sobre código em inglês), use um modelo multilíngue.

Para mudar para busca multilíngue:

```bash
ollama pull bge-m3
# defina "embeddingModel": "bge-m3" no ailore.config.json e então:
ailore index
```

Trocar o modelo de embedding exige reindexar tudo (vetores de modelos diferentes não são comparáveis). O ailore detecta a troca e reconstrói automaticamente.

</details>

<details>
<summary><b>Preciso de API key? Tem algum custo?</b></summary>

Não. Com o **Ollama** (o padrão), tudo roda localmente e de graça — sem API key, sem custo de uso. Você só precisa de uma chave se escolher um provedor hospedado:

```bash
export OPENAI_API_KEY=sk-...
ailore ask -p openai "..."
```

</details>

<details>
<summary><b>Meu código é enviado para algum lugar? É privado?</b></summary>

- **Com Ollama:** nada sai da sua máquina. A indexação e a geração da resposta acontecem inteiramente no seu computador.
- **Com um provedor hospedado (OpenAI/Gemini/OpenRouter):** o texto dos trechos recuperados para uma pergunta, mais a sua pergunta, é enviado a esse provedor para gerar a resposta — como em qualquer chamada de API. Suas API keys são lidas apenas de variáveis de ambiente e nunca são gravadas no arquivo de config nem no índice.

</details>

<details>
<summary><b>Como uso o ailore em qualquer projeto sem editar o config toda vez?</b></summary>

O arquivo de config é por projeto. Para definir seus modelos preferidos na máquina inteira, exporte variáveis de ambiente (ex.: no `~/.zshrc` ou `~/.bashrc`):

```bash
export AILORE_CHAT_MODEL=llama3.2
export AILORE_EMBEDDING_MODEL=bge-m3
```

Agora você pode dar `cd` em qualquer projeto e simplesmente rodar `ailore index` / `ailore ask`.

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

Use globs de `include`/`exclude` no `ailore.config.json`. Por exemplo, para ignorar markdown e fazer as respostas virem do código:

```jsonc
{ "exclude": ["**/*.md"] }
```

Depois reindexe com `ailore index`. Você também pode limitar uma execução a uma subpasta: `ailore index ./src`.

</details>

<details>
<summary><b>Aparece "No index found. Run ailore index first."</b></summary>

O `search` e o `ask` leem um índice criado pelo `index`. Rode `ailore index` no projeto primeiro. Se você roda os comandos de outra pasta, aponte para o projeto com `-C`: `ailore ask -C /caminho/do/projeto "..."`.

</details>

<details>
<summary><b>Aparece erro de conexão do Ollama ou "model not found"</b></summary>

- **Erro de conexão:** o servidor do Ollama não está rodando. Abra o app do Ollama, ou rode `ollama serve` em um terminal separado.
- **Model not found:** baixe o modelo primeiro, ex.: `ollama pull bge-m3`, e confirme com `ollama list`. O nome no `ailore.config.json` precisa ser exatamente igual.

</details>

<details>
<summary><b>Mudei alguns arquivos — preciso reindexar tudo?</b></summary>

Não. O `ailore index` é incremental: ele faz hash de cada arquivo e só re-embeda os que mudaram (e remove os deletados). Basta rodar `ailore index` de novo — ele vai reportar algo como `1 changed · 41 unchanged · 0 removed`.

</details>

<details>
<summary><b>Qual o tamanho de projeto que ele aguenta?</b></summary>

A busca é um scan de cosseno exato mantido inteiramente em memória, o que é rápido e preciso para bases pequenas e médias (até cerca de dezenas de milhares de chunks). Para monorepos muito grandes, limite o índice às pastas relevantes (`ailore index ./src`) ou use globs de `exclude`. Um índice de vizinhos aproximados (ANN) para repositórios enormes está no [roadmap](../../README.pt-BR.md#roadmap).

</details>

<details>
<summary><b>Como desinstalo ou reseto?</b></summary>

```bash
rm -rf .ailore            # apaga o índice de um projeto (refeito no próximo `ailore index`)
npm uninstall -g ailore   # remove o comando global
```

</details>

<!-- nav-footer -->

---

<div align="center"><sub>[← Anterior: Uso como biblioteca](./library-api.md) · [📚 Todos os guias](./README.md)</sub></div>
