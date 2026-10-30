# Plano e rastreabilidade — Kurio

Referência: Figma `MyWoBOc1rDIB63aXDxMM48`. Stack obrigatória: React, TypeScript, TanStack Router/Query, Axios, Tailwind, shadcn/ui, MSW, Socket.IO, Playwright e Lighthouse.

## Entrega organizada por commits

| Etapa | Resultado |
| --- | --- |
| Planejamento | Enunciado e critérios em `REQUIREMENTS.md`; plano versionado. |
| Base | Vite, TypeScript, ferramentas, tokens, componentes e assets locais. |
| Integração | REST/MSW persistente, sessão, precisão ETH, idempotência e Socket.IO. |
| Descoberta | Catálogo responsivo, URL, busca/filtros/ordenação/paginação. |
| Compra e conta | Detalhe, carrinho, pagamento, recibo, login/cadastro, perfil e carteiras. |
| Correções | Expiração, identidade durante requisições lentas, reset e metadados do checkout. |
| Testes | E2E, contratos, falhas, responsividade e oito baselines desktop/mobile. |
| Performance | WebP, skeleton do detalhe, Lighthouse e relatórios. |
| Documentação | README, arquitetura e performance. |
| Publicação | Produção em https://desafio-junglegaming-frontend.vercel.app. |

O histórico de Git registra essas etapas em commits separados.

## Critérios verificados

- [x] Filtros combinados, busca, ordenação, paginação e histórico na URL.
- [x] Chamadas REST via Axios; cache por parâmetros/usuário no Query.
- [x] Sessão recuperável e expiração durante checkout, com retomada.
- [x] Favoritos otimistas com rollback e isolamento entre contas.
- [x] Carrinho persistente, merge no login, quantidades e cupons.
- [x] ETH como string e cálculo BigInt; cotação autoritativa.
- [x] Revalidação e nova confirmação quando preço/estoque mudam.
- [x] Pedidos idempotentes, timeout recuperável, recusa e snapshot do recibo.
- [x] Eventos via socket.io-client/MSW, duplicatas/versões antigas e reconexão REST.
- [x] Perfil/avatar/senha/carteiras com validação e persistência.
- [x] Teclado, foco de diálogo, skeletons, falhas e estados vazios.
- [x] Larguras 390, 768 e 1440 nas telas principais.
- [x] 49 testes E2E aprovados; um teste exclusivamente mobile ignorado no projeto desktop.
- [x] Três testes unitários monetários, tipos, lint e build aprovados.
- [x] Baselines de início, detalhe, carrinho e pagamento versionadas.
- [x] Configuração e 12 relatórios Lighthouse HTML/JSON; medianas em `PERFORMANCE.md`.
- [x] README, arquitetura e resultados consolidados.
- [x] Deploy público, rotas diretas e 26 testes de conta, compra e resiliência aprovados na Vercel em desktop/mobile.

## Referências de design

Desktop: início `2:2`, detalhe `10:244`, carrinho `11:1278`, pagamento `11:2862`, confirmação `11:4385`, login `9:115`, cadastro `9:1022`, perfil `9:1238`, carteiras `9:1670`.

Mobile: início `14:5226`, detalhe `15:5536`, carrinho `16:360`, pagamento `16:748`, login `16:1022`, cadastro `16:1228`.

Os assets necessários ao funcionamento estão em `public/assets/`. As diferenças de UX em relação aos layouts de referência e os limites da simulação estão em `ARCHITECTURE.md`.
