# Kurio — Marketplace de NFTs

Desafio frontend em React e TypeScript: descoberta, compra e área do colecionador, com APIs, autenticação, carteiras, pagamentos e tempo real simulados na camada de rede.

- [Repositório](https://github.com/oMarcook/desafio-junglegaming-frontend)
- [Layout de referência no Figma](https://www.figma.com/design/MyWoBOc1rDIB63aXDxMM48/Frontend-Challenge--Copy-?node-id=0-1).
- **Aplicação:** [desafio-junglegaming-frontend.vercel.app](https://desafio-junglegaming-frontend.vercel.app)

## Funcionalidades

- Catálogo com destaques, busca, filtros combinados, ordenação e paginação na URL.
- Detalhe do NFT com galeria, edições, disponibilidade, quantidade e favoritos.
- Carrinho persistente, edição de itens, cupons e cotação com precisão em ETH.
- Checkout com dados do colecionador, carteira/rede, revisão e criação idempotente do pedido.
- Pedidos pendentes, confirmados ou recusados, recuperação após timeout e recibo imutável.
- Cadastro, login, logout, expiração de sessão, edição de perfil/avatar/senha e carteiras.
- Atualizações de preço, disponibilidade e pedido via Socket.IO, com reconciliação REST.
- Layouts responsivos, estados de carregamento/erro/vazio e operação por teclado.

O escopo completo está em [REQUIREMENTS.md](REQUIREMENTS.md). Blockchain, extensões de carteira e pagamentos reais estão fora do escopo.

## Tecnologias

| Responsabilidade | Tecnologia |
| --- | --- |
| Interface e linguagem | React e TypeScript |
| Roteamento e parâmetros da URL | TanStack Router |
| Estado remoto e cache | TanStack Query |
| Cliente HTTP e integração | Axios e REST |
| Tempo real | Socket.IO client |
| Estilização e componentes | Tailwind CSS e shadcn/ui com Radix |
| Simulação de rede e eventos | MSW e `@mswjs/socket.io-binding` |
| Testes E2E e regressão visual | Playwright |
| Auditoria de qualidade | Lighthouse |
| Build e validação de dados | Vite e Zod |

## Executar

Use **Node.js 24 LTS** (mínimo 22.19 para Lighthouse) e npm.

```sh
npm ci
npx playwright install chromium
npm run dev
```

Abra [localhost:5173](http://127.0.0.1:5173). Não exige backend privado ou extensão de carteira. Imagens e fonte são locais. MSW inicia antes da aplicação; a primeira visita cria 36 NFTs, nove coleções, três redes e duas contas.

| E-mail fictício | Senha |
| --- | --- |
| `nova@kurio.test` | `Kurio123!` |
| `alex@kurio.test` | `Kurio123!` |

Ambas têm carteiras de exemplo. Novas contas começam sem carteira: cadastre uma em **Meu perfil → Carteiras**. Use dados fictícios. Senhas são derivadas com PBKDF2 e salt, sem armazenamento em claro.

## Comandos

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Vite com mocks. |
| `npm run build` | TypeScript + build otimizado em `dist/`. |
| `npm run preview` | Build em `127.0.0.1:4173`. |
| `npm run typecheck` | Verificação de tipos. |
| `npm run lint` | ESLint. |
| `npm test` | Invariantes de precisão monetária. |
| `npm run test:e2e -- --workers=2` | Fluxos Chromium desktop/mobile e relatório HTML. |
| `npm run test:visual` | Baselines de início, detalhe, carrinho, pagamento e confirmação. |
| `npm run audit` | 12 medições Lighthouse; requer preview ativo em 4173. |
| `npm run assets:optimize` | Recria WebPs usando os PNGs originais. |

O relatório é gerado em `playwright-report/index.html`; abra com `npx playwright show-report`. Falhas geram screenshots/traces em `test-results/`; use `npx playwright show-trace caminho/trace.zip`. A execução entregue está em `reports/e2e/`. Baselines em `tests/e2e/visual.spec.ts-snapshots/` foram geradas em Windows/Chromium; diferenças de rasterização em outro sistema devem ser revisadas antes de gerar referências próprias.

Para auditar: `npm run build`, `npm run preview` e, em outro terminal, `npm run audit`. Resultados e condições estão em [PERFORMANCE.md](PERFORMANCE.md).

Última validação funcional: **64 E2E aprovados**, dois casos ignorados somente no viewport ao qual não se aplicam (foco do filtro mobile e logout pelo cabeçalho desktop), **3 testes unitários aprovados**, TypeScript/lint/build aprovados. A cobertura inclui busca pelas lupas, histórico, conta, compra, falhas de rede, controles de demonstração e avisos em diálogos. Na auditoria Lighthouse documentada em `PERFORMANCE.md`, as quatro combinações página/perfil atingiram as metas: performance 91–99, acessibilidade 98–100, boas práticas e SEO 100. O relatório entregue não contém falhas; traces são retidos automaticamente quando uma execução falha.

Uma instalação limpa também foi verificada com `npm ci` e `npm run build`, sem aproveitar o `node_modules` de desenvolvimento.

## Ambiente

Os padrões já funcionam. Copie `.env.example` para `.env.local` somente para alterá-los.

| Variável | Padrão | Uso |
| --- | --- | --- |
| `VITE_ENABLE_MOCKS` | `true` | MSW em desenvolvimento e build de demonstração. |
| `VITE_API_URL` | `/api` | Prefixo Axios. |
| `AUDIT_URL` | `http://127.0.0.1:4173` | URL do script Lighthouse. |

Desabilitar mocks exige uma API compatível e adaptar o endpoint do socket em `src/lib/realtime.ts`. Não há backend de produção. A persistência pertence ao navegador/origem; outro navegador recebe uma demonstração independente.

## Fazer uma compra

1. Explore o catálogo. Busca, filtros combinados, ordenação e paginação ficam na URL e sobrevivem ao refresh/histórico.
2. Abra **Emerald Ape #042**, selecione edição/quantidade e adicione ao carrinho.
3. Aplique `KURIO10`. Uma unidade de `1.19 ETH`, com desconto de 10% e taxa de `0.016 ETH`, totaliza `1.087 ETH`.
4. Clique em **Conectar e finalizar**. Entre com uma conta; o carrinho visitante será incorporado ao carrinho dela.
5. Confira os dados, escolha a carteira Ethereum e conecte na simulação. A carteira deve corresponder à rede de todos os itens; redes diferentes exigem pedidos separados.
6. **Revisar compra → Confirmar compra** revalida a cotação. Alterações exigem outra confirmação. O pedido passa por pendente e o recibo de sucesso aparece somente após confirmação da API.

O recibo mantém um snapshot imutável. Cliques repetidos e recuperação após timeout reutilizam a mesma tentativa. Somente as quantidades confirmadas saem do carrinho. Rascunho e tentativa pendente são persistidos por usuário para retomada após refresh ou expiração.

## Cenários de falha

O botão **Demonstração**, no canto inferior direito, abre os controles. **Restaurar demonstração** recria banco, contas, carrinhos, favoritos e pedidos e limpa rascunhos/tentativas. Os controles continuam acessíveis no cenário offline.

| Cenário | Como observar |
| --- | --- |
| `default` | Latência de 120 ms e compra confirmada. |
| `empty` | Catálogo sem resultados. |
| `slow` | Latência de 2,2 s para observar skeletons. |
| `variable-latency` | Alterna 1,2 s/150 ms. Buscas sucessivas não deixam o resultado antigo substituir a URL atual. |
| `offline` | Falha de conexão. Volte a `default` e repita a operação. |
| `server-error` | HTTP 503, feedback e nova tentativa. |
| `expired-session` | Expiração repetida; volte a `default` para retomar. O botão **Expirar sessão** produz uma expiração única. |
| `validation-error` | Salvar perfil retorna erro de campo da API. |
| `favorite-error` | Favoritar atualiza otimisticamente e desfaz após falha. |
| `payment-declined` | Pedido recusado; itens permanecem no carrinho. |
| `order-timeout` | Pedido criado com resposta perdida; recarregue e use **Recuperar pedido**. |

- **Alterar preço / Esgotar Emerald:** abra a revisão com o NFT no carrinho e dispare a ação. Socket.IO atualiza dados e a compra exige revisão ou fica bloqueada.
- **Evento duplicado e antigo:** versões repetidas/antigas não reaplicam o aumento.
- **Desconectar tempo real / Reconectar:** a reconexão consulta recursos ativos via REST. Pedido pendente também é recuperável por refresh e consulta periódica.
- **Recusar conexão:** o diálogo da carteira apresenta erro e permite tentar de novo.
- **Cupom:** `INVALID` é inválido; `EXPIRED` está expirado. Um cupom aplicado pode ser removido.
- **Cadastro:** use `nova@kurio.test` para conflito. Perfil/senha/carteiras têm validação local e erros da API.

## Estrutura e documentação

Rotas: `/`, `/nft/:id`, `/cart`, `/checkout`, `/orders/:id`, `/login`, `/register`, `/profile`, `/wallets`, `/favorites`, `/orders`. Rotas privadas preservam o destino no login. Há tratamento de rota e NFT inexistentes.

| Pasta | Responsabilidade |
| --- | --- |
| `src/domain/` | Tipos, schemas Zod e cálculo exato em wei. |
| `src/lib/` | Axios, Query, autenticação e Socket.IO. |
| `src/mocks/` | Banco persistente, fixtures, REST e eventos MSW. |
| `src/pages/` | Telas e fluxos. |
| `src/components/` | Composição, formulários e componentes shadcn/Radix. |
| `tests/` | E2E, visual e testes monetários. |
| `reports/`, `scripts/` | Evidências e auditoria reproduzível. |

## Contratos, sessão e sincronização

Os recursos REST usam o prefixo `/api`: sessão/conta, NFTs, favoritos, carrinho, cotação, pedidos, perfil e carteiras. Erros retornam `{ code, message, fields? }`, com estados HTTP para validação, sessão inválida, falta de permissão, recurso inexistente, conflito e indisponibilidade. A criação de pedidos exige o header `Idempotency-Key`.

A sessão simulada dura uma hora. Rotas privadas verificam autenticação e preservam o destino para retomada. O carrinho visitante é mesclado no login; dados privados do cache e conexões da sessão anterior são limpos na troca de conta. Rascunhos e tentativas de compra ficam separados por usuário.

O cache usa `staleTime` de 30 segundos, `gcTime` de cinco minutos e revalidação no foco. A sessão usa `staleTime` de dez segundos. Consultas tentam novamente uma vez em falhas de rede/5xx; mutations não repetem automaticamente. Favoritos usam atualização otimista com rollback. Requisições obsoletas são canceladas pelo `AbortSignal` do Axios.

Eventos `nft.updated` e `order.updated` carregam identidade, recurso e versão. O cliente ignora versões antigas/duplicadas e eventos de outro usuário; ao reconectar, consulta novamente os recursos ativos via REST. MSW intercepta o transporte WebSocket utilizado pelo cliente Socket.IO.

Os contratos completos, as políticas de cache/sessão, os limites do transporte simulado e as decisões de UX estão em [ARCHITECTURE.md](ARCHITECTURE.md). As medições, ferramentas e condições das auditorias estão em [PERFORMANCE.md](PERFORMANCE.md).

## Deploy na Vercel

Produção: **[desafio-junglegaming-frontend.vercel.app](https://desafio-junglegaming-frontend.vercel.app)**. Publicação realizada em 30/10/2026, com os mocks habilitados. A aplicação pode ser acessada sem uma conta da Vercel; use as credenciais fictícias acima para os fluxos autenticados.

O projeto utiliza o preset **Vite**, build `npm run build`, saída `dist` e Node.js **26.x** na Vercel, compatível com `engines.node` do projeto. Para publicar atualizações pelo terminal:

```sh
npx vercel login
npx vercel link --project desafio-junglegaming-frontend
npx vercel deploy --prod --build-env VITE_ENABLE_MOCKS=true --build-env VITE_API_URL=/api
```

O repositório está conectado ao projeto na Vercel. Para publicações pela integração Git, configure `VITE_ENABLE_MOCKS=true` e `VITE_API_URL=/api` no ambiente Production. Esses também são os valores padrão da aplicação.

`vercel.json` define o build e o fallback da SPA, mantendo o service worker e os assets acessíveis. `.vercelignore` exclui arquivos temporários e relatórios do upload. Credenciais locais da Vercel e arquivos `.env` ficam fora do Git; `.env.example` permanece versionado.

Após publicar, confira abertura direta e refresh de `/nft/nft-1` e `/profile`, conclua uma compra e use o painel de demonstração para testar alterações de preço e reconexão. Os dados simulados pertencem ao navegador e ao domínio: a instalação local e o site publicado têm bancos independentes.

Validação da publicação em 30/10/2026: acesso público e rotas diretas verificados; 26 testes de conta, compra e resiliência aprovados na URL de produção, em desktop e mobile.

Carteira, blockchain, gateway e login social reais não fazem parte do escopo. Ações auxiliares indisponíveis informam isso, sem aparentar sucesso. Ajustes em relação ao Figma estão na arquitetura.
