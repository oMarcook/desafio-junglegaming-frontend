# Performance e qualidade — Lighthouse

Auditoria de 30/10/2026 sobre o build otimizado, com cenário padrão dos mocks, fonte local, imagens WebP e funcionalidades completas. As 12 execuções finais foram sequenciais e sem testes E2E concorrentes.

## Medianas de três execuções

| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Início | Mobile | 94 | 100 | 100 | 100 | 3.108 ms | 0,00093 | 36,5 ms |
| Início | Desktop | 99 | 100 | 100 | 100 | 1.041 ms | 0,00749 | 0 ms |
| Detalhe | Mobile | 91 | 98 | 100 | 100 | 3.076 ms | 0,00017 | 183,5 ms |
| Detalhe | Desktop | 99 | 100 | 100 | 100 | 991 ms | 0,00089 | 0 ms |

Metas do desafio: Performance ≥90, Acessibilidade ≥95, Boas práticas ≥95, SEO ≥90. **As quatro combinações atingiram todas as metas nas medianas.** As medianas de métricas são calculadas independentemente das medianas das categorias.

## Evidências

- [Resultados brutos e ambiente](reports/lighthouse/results.json)
- [Medianas em JSON](reports/lighthouse/medians.json)
- Início mobile: [1](reports/lighthouse/home-mobile-1.html), [2](reports/lighthouse/home-mobile-2.html), [3](reports/lighthouse/home-mobile-3.html)
- Início desktop: [1](reports/lighthouse/home-desktop-1.html), [2](reports/lighthouse/home-desktop-2.html), [3](reports/lighthouse/home-desktop-3.html)
- Detalhe mobile: [1](reports/lighthouse/detail-mobile-1.html), [2](reports/lighthouse/detail-mobile-2.html), [3](reports/lighthouse/detail-mobile-3.html)
- Detalhe desktop: [1](reports/lighthouse/detail-desktop-1.html), [2](reports/lighthouse/detail-desktop-2.html), [3](reports/lighthouse/detail-desktop-3.html)

Cada HTML possui o JSON equivalente no mesmo diretório. O script falha caso Lighthouse retorne erro de execução; uma auditoria não é substituída por uma pontuação estimada.

## Ambiente e reprodução

- Windows 10.0.26300; AMD Ryzen 7 5700X3D, 8 cores.
- Node **24.22.2**, Lighthouse **13.6.0**, Chromium **156.0.8078.4** controlado pelo Playwright.
- Vite **6.4.5**, build servido em `http://127.0.0.1:4173`.
- Navegador novo a cada amostra, armazenamento/caches de navegação limpos pelo Lighthouse, sem sessão autenticada.
- Mobile: 390×844, DPR 1, throttling simulado padrão Lighthouse (incluindo desaceleração de CPU).
- Desktop: 1440×1000, DPR 1, RTT 40 ms, throughput 10.240 Kbps, CPU 1×.
- Regras exatas em [lighthouse.config.mjs](lighthouse.config.mjs); execução em [scripts/audit.mjs](scripts/audit.mjs).

```sh
npm ci
npx playwright install chromium
npm run build
npm run preview
# Em outro terminal, com Node 24:
npm run audit
```

`AUDIT_URL` permite outro servidor, mas latência/hosting podem mudar os resultados. Os números são de laboratório local, não dados de usuários reais nem uma medição do ambiente de produção.

## Otimizações e limites observados

1. Os quatro PNGs originais totalizam 7.959.897 bytes. WebP de 960 px/qualidade 88 totaliza 349.636 bytes: redução de **95,6%**. Originais permanecem versionados e `npm run assets:optimize` reproduz a conversão.
2. Imagens abaixo da dobra usam lazy loading; o destaque tem prioridade de carregamento. Roboto Mono é servido localmente.
3. O skeleton do detalhe reserva espaço para galeria, informações e seções seguintes. O CLS desktop caiu de aproximadamente 0,164 na medição inicial para 0,00089 na rodada final.
4. `robots.txt` evita que o fallback da SPA seja interpretado como um arquivo robots inválido. A origem possui descrição, idioma e viewport.
5. Tailwind procura classes somente em `src/`; relatórios HTML não contaminam o CSS de produção.

Ainda há oportunidade de reduzir JavaScript inicial com divisão por rota. O bootstrap aguarda os mocks e a aplicação é uma SPA; a descoberta da imagem principal ocorre após JavaScript/API, contribuindo para LCP mobile em torno de 3,1 s. O detalhe mobile teve variação de TBT de 42 a 206,5 ms. Seus 98 pontos de acessibilidade refletem um aviso de sequência de headings quando seções desktop ficam ocultas no mobile. Não há categoria abaixo da meta, mas essas observações continuam sendo melhorias possíveis.

Nenhuma imagem, fonte, recurso de compra, mock ou conexão de tempo real foi removida exclusivamente para melhorar a auditoria. Lighthouse não substitui verificação manual com teclado/leitor de tela nem testes de negócio.
