# Plano de implementação — Kurio

Referência: Figma `MyWoBOc1rDIB63aXDxMM48`. Stack: React, TypeScript, TanStack Router/Query, Axios, Tailwind, shadcn/ui, MSW, Socket.IO, Playwright e Lighthouse.

## Etapas e commits

1. `docs: record implementation plan and acceptance criteria` — plano e rastreabilidade.
2. `chore: bootstrap typed React application and tooling` — Vite, dependências, tokens, componentes e assets locais.
3. `feat: implement persistent mock API and realtime contracts` — fixtures, sessão, precisão decimal, carrinho, cotação, pedidos idempotentes e eventos MSW/Socket.IO.
4. `feat: build responsive marketplace and collector flows` — catálogo, detalhe, compra, conta e carteiras seguindo desktop/mobile.
5. `test: cover purchase recovery and responsive flows` — E2E, regressão visual, acessibilidade e correções verificadas.
6. `docs: document architecture audits and study guide` — README, arquitetura, contratos, auditorias e roteiro de estudo.

## Critérios de aceite

- Busca/filtros/ordenação/paginação na URL; chamadas REST pelo Axios e estado remoto no Query.
- Sessão recuperável, isolamento de usuários, favoritos otimistas com rollback e carrinho persistente/mesclado no login.
- ETH em strings decimais; cotação autoritativa; revalidação e confirmação explícita quando valores mudam.
- Pedido idempotente, recibo imutável, estados terminais e recuperação após timeout/refresh.
- Socket.IO real interceptado por MSW, versões de eventos, descarte de duplicatas e reconciliação REST.
- Formulários acessíveis, skeletons, erros/estados vazios e layouts 390/768/1440.
- Testes executáveis, baselines, auditorias Lighthouse (três amostras por página/perfil).
- Deploy público correspondente ao código; documentar qualquer impedimento ou desvio sem declarar verificações não executadas.

## Referências Figma

Desktop: início `2:2`, detalhe `10:244`, carrinho `11:1278`, pagamento `11:2862`, confirmação `11:4385`, login `9:115`, cadastro `9:1022`, perfil `9:1238`, carteiras `9:1670`.

Mobile: início `14:5226`, detalhe `15:5536`, carrinho `16:360`, pagamento `16:748`, login `16:1022`, cadastro `16:1228`.

## Estado

- [x] Acesso ao Figma e inventário de telas.
- [x] Plano inicial.
- [ ] Base e assets.
- [ ] API simulada e tempo real.
- [ ] Interface e fluxos.
- [ ] Testes e auditorias.
- [ ] Documentação e publicação.
