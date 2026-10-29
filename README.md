# Kurio — Marketplace de NFTs

Implementação em andamento do desafio de frontend. O enunciado completo está em [REQUIREMENTS.md](REQUIREMENTS.md) e o plano em [PLAN.md](PLAN.md).

**Estado desta etapa:** catálogo desktop/mobile funcional; API simulada persistente e tempo real integrados; testes iniciais aprovados. As telas de detalhe, carrinho, pagamento, confirmação e conta ainda não estão implementadas na interface. As rotas correspondentes mostram explicitamente que estão em implementação. Não é a entrega final do desafio.

O MCP do Figma permitiu extrair início desktop/mobile e seus assets antes de atingir a cota Starter. Por decisão do usuário, as demais telas serão implementadas após o recebimento das imagens exportadas. Não há deploy público nesta etapa.

## Executar

Recomendado: Node.js 22.19+ ou 24 LTS e npm. O build desta etapa foi verificado com Node 22.18.0; Lighthouse 13.6 requer pelo menos 22.19 para a auditoria futura.

```sh
npm ci
npm run dev
```

Abra a URL apresentada pelo Vite, normalmente `http://127.0.0.1:5173`.

```sh
npm run typecheck
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm run test:visual
npm run build
npm run preview
```

O relatório E2E fica em `playwright-report/index.html`. Falhas geram screenshots e traces em `test-results/`. Use `npx playwright show-report` ou `npx playwright show-trace <arquivo.zip>`. As baselines iniciais da home foram geradas em Windows/Chromium e são versionadas em `tests/e2e/visual.spec.ts-snapshots`.

Validação em 29/10/2026: build, TypeScript e lint aprovados; 3 testes unitários aprovados; Playwright com 11 casos aprovados e 1 ignorado intencionalmente (teste exclusivo de foco mobile no projeto desktop). `npm audit` reportou zero vulnerabilidades após as atualizações. Esses resultados cobrem somente a etapa atual, não todo o desafio.

## Ambiente e mocks

Copie `.env.example` para `.env.local` somente se precisar alterar os padrões:

| Variável | Padrão | Uso |
| --- | --- | --- |
| `VITE_ENABLE_MOCKS` | `true` | Ativa MSW também no build. `false` exige uma API externa compatível, que não faz parte da entrega. |
| `VITE_API_URL` | `/api` | Prefixo usado pelo Axios. |

Não há carteira real, blockchain, pagamentos reais ou credenciais de produção. As imagens e a fonte são locais.

Contas fictícias disponíveis na API simulada (a interface de login está pendente):

| E-mail | Senha |
| --- | --- |
| `nova@kurio.test` | `Kurio123!` |
| `alex@kurio.test` | `Kurio123!` |

As senhas são persistidas como hashes PBKDF2 com salt individual; os valores acima são fixtures públicas de demonstração.

## Cenários

O botão **Demonstração**, no canto inferior direito, abre os controles dos mocks. **Restaurar demonstração** apaga todos os dados simulados e recria as fixtures e as duas contas. Cada contexto novo de navegador usado nos testes possui seu próprio estado.

| Cenário | Comportamento atual |
| --- | --- |
| `default` | 36 NFTs, nove coleções, três redes e latência de 120 ms. |
| `empty` | Catálogo sem resultados. |
| `slow` | Latência de 2,2 segundos para observar skeletons. |
| `variable-latency` | Alterna respostas de 1,2 segundo e 150 ms. |
| `offline` | Erro de conexão nas chamadas de negócio. |
| `server-error` | HTTP 503. |
| `expired-session` | Expira a sessão antes das operações protegidas. |
| `validation-error` | Erro de validação no perfil. |
| `favorite-error` | Falha ao persistir favorito. |
| `payment-declined` | Pedidos terminam recusados. |
| `order-timeout` | O pedido é criado, mas a primeira resposta demora e falha; repetir a chave recupera o pedido. |

Os cenários de conta/compra estão disponíveis nos handlers e serão exercitados pela interface nas próximas etapas. Os controles de preço, esgotamento e duplicação publicam eventos através do MSW e do cliente Socket.IO. Para reproduzir a atualização já implementada, abra o catálogo, escolha **Alterar preço do Emerald** e observe o novo preço e o aviso acessível.

Busca, filtros combinados, ordenação e paginação ficam na URL. As alterações reiniciam a paginação. O cupom de teste da API é `KURIO10`; `EXPIRED` representa um cupom expirado.

## Documentação e próximos passos

- [Arquitetura e contratos](ARCHITECTURE.md).
- [Roteiro inicial de estudo](STUDY_GUIDE.md).
- [Plano e pendências](PLAN.md).

Ainda faltam: demais telas e fluxos completos de conta/compra, testes de interface desses fluxos, baselines de detalhe/carrinho/pagamento, auditorias Lighthouse e publicação. `vercel.json` já contém o fallback de rotas, mas não comprova um deploy. O README e o roteiro de estudo serão consolidados ao terminar o escopo.
