# Segurança

[🏠 Início](../../README.pt-BR.md) · [📚 Docs](./README.md) · [English 🇬🇧](../en/security.md)

Como o ailore lida com seus dados, segredos e entradas não confiáveis — e como reportar uma vulnerabilidade.

## Reportar uma vulnerabilidade

> [!IMPORTANT]
> Por favor, **não** abra uma issue pública para problemas de segurança. Reporte de forma privada pelos [GitHub Security Advisories](https://github.com/gregdalzotto/ailore/security/advisories/new), ou por e-mail para **gregori.d@gmail.com**.

Você pode esperar uma primeira resposta em poucos dias. Quando uma correção estiver pronta, uma nova versão é lançada e quem reportou é creditado (a menos que prefira anonimato).

## Seus dados e para onde vão

O ailore é uma CLI local que lê seus arquivos, guarda um índice em disco e (no `ask`) envia os trechos recuperados a um provedor de modelo.

| Configuração                                          | O que sai da sua máquina                                                                                                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ollama** (padrão)                                   | Nada — indexação e respostas rodam inteiramente local.                                                                                                        |
| **Provedor hospedado** (OpenAI / Gemini / OpenRouter) | Para uma pergunta, o texto dos trechos recuperados **mais a sua pergunta** são enviados a esse provedor — a mesma exposição de qualquer chamada de API a ele. |

## API keys

> [!NOTE]
> As chaves são lidas **somente** de variáveis de ambiente (`OPENAI_API_KEY`, `GEMINI_API_KEY` / `GOOGLE_API_KEY`, `OPENROUTER_API_KEY`). Elas nunca são lidas de, nem gravadas em, o arquivo de config ou o índice — então não podem ser commitadas por acidente.

O ailore não loga URLs de requisição nem chaves. (A API do Gemini recebe a chave como parâmetro de query na URL por design; o ailore a mantém fora das mensagens de erro.)

## Repositórios / config não confiáveis

> [!WARNING]
> O `ailore.config.json` é um **arquivo de projeto**. Se você roda o ailore dentro de um repositório que não confia, revise a config antes — como qualquer outra config executável de projeto (scripts de build, tasks de editor). Em particular, ela pode definir o **provider / modelo / base URL** (ex.: `ollamaBaseUrl`), que controla _para onde_ seus trechos e perguntas são enviados.

Como medida de hardening, o scanner de arquivos é **limitado à raiz do projeto**: globs de `include` que usam `..` ou caminhos absolutos são rejeitados, então uma config commitada não pode ampliar a indexação para ler arquivos fora do diretório que você apontou.

## Prompt injection

Como o conteúdo dos arquivos recuperados entra no prompt do modelo, o conteúdo de um arquivo indexado pode tentar influenciar a resposta — uma característica inerente a todo RAG. Trate as respostas geradas como auxílio, não autoridade, e use as [citações](./architecture.md) `arquivo:linha` para conferir contra a fonte real.

## Dependências

O pacote publicado entrega um runtime enxuto; o SDK do MCP, mais pesado, é uma dependência **opcional** instalada só por quem roda [`ailore mcp`](./mcp.md). O ferramental de desenvolvimento e build não faz parte do pacote publicado.

> [!NOTE]
> A CI audita o runtime de produção (`npm audit --omit=dev`) a cada mudança **e** no release — uma dependência vulnerável publicada falha o build, então não chega aos usuários.

## Versões suportadas

Como projeto pré-1.0, apenas a última versão lançada recebe correções de segurança.

<!-- nav-footer -->

---

<div align="center"><sub>[← Anterior: Como funciona](./architecture.md) · [📚 Todos os guias](./README.md) · [Próximo: Uso como biblioteca →](./library-api.md)</sub></div>
