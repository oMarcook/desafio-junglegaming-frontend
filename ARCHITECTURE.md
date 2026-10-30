# Arquitetura — Kurio

## Camadas

`src/domain` define contratos, validação Zod e aritmética ETH. `src/lib` contém Axios, hooks Query e reconciliação Socket.IO. `src/mocks` funciona como backend simulado persistente na camada de rede. `src/pages` e `src/components` apresentam a interface. Os componentes não importam fixtures ou banco de dados.

O bootstrap aguarda a inicialização do MSW antes de importar a aplicação e o cliente Socket.IO. Isso evita conexões disparadas antes da interceptação de WebSocket.

TanStack Router mantém o catálogo na URL. TanStack Query mantém estado remoto e cancela consultas obsoletas usando o `AbortSignal` enviado ao Axios. Os componentes shadcn/ui de botão e diálogo são mantidos no próprio repositório, usam Radix e recebem os tokens Kurio no CSS/Tailwind.

## Contratos REST implementados

O prefixo é `/api`. Erros retornam `{ code, message, fields? }`. Os handlers usam HTTP 401, 403, 404, 409, 422 e 503 nos respectivos cenários. Os tipos estão em `src/domain/types.ts`.

| Método e recurso | Entrada / resposta |
| --- | --- |
| `GET /session` | `{ user, expiresAt }`; visitante retorna `user: null`. |
| `POST /session/register` | Nome, e-mail, senha e confirmação; cria conta e sessão. |
| `POST /session/login` | E-mail e senha; mescla carrinho visitante e retorna sessão. |
| `POST /session/logout` | Encerra sessão. |
| `GET /nfts` | `q`, `collections`, `networks`, `min`, `max`, `sort`, `page`, `tab`; retorna itens e metadados de paginação. |
| `GET /nfts/:id` | NFT com preço, rede, versão e disponibilidade por edição. |
| `GET /favorites` | Lista privada de identificadores. |
| `PUT /favorites` | `{ nftId, favorite }`. |
| `GET /cart` | Carrinho do visitante ou usuário autenticado. |
| `POST /cart` | `{ nftId, editionId, quantity }`; adiciona à quantidade existente. |
| `PUT /cart` | Mesmos campos; substitui quantidade. Zero remove o item. |
| `GET /quote` | Cotação autoritativa do carrinho, válida por 60 segundos. |
| `POST /quote` | `{ coupon }`; valida/aplica cupom. String vazia remove. |
| `POST /orders` | Header `Idempotency-Key`, `{ quoteId, walletId, collector: { name, email, phone } }`. |
| `GET /orders` | Pedidos privados do usuário. |
| `GET /orders/:id` | Estado e snapshot do pedido; verifica proprietário. |
| `GET /profile`, `PUT /profile` | Dados do colecionador e avatar como data URL PNG/JPEG/WebP limitada. |
| `POST /profile/password` | Senha atual, nova senha e confirmação. |
| `GET /wallets`, `POST /wallets`, `PUT /wallets/:id` | Carteiras com nome, endereço, rede e indicação de principal. |
| `POST /wallet-connection` | `action`: `connect`, `reject` ou `disconnect`; simula a resposta da carteira. |

As rotas `/simulation/*` são exclusivas dos mocks e controlam cenário, reset, expiração e alteração de NFT. Continuam acessíveis nos cenários de rede indisponível para permitir recuperação da demonstração.

## Dinheiro, cotação e pedidos

Preços trafegam como strings. `wei()` converte para `BigInt` com 18 casas; `eth()` faz a conversão inversa, sem `Number` nos cálculos monetários. A taxa simulada é `0.016 ETH`; `KURIO10` aplica 10% sobre o subtotal, truncado no menor inteiro wei.

Cada cotação registra no backend um identificador, dono, conteúdo e expiração. A criação compara esse conteúdo com uma nova leitura de preços/estoque/cupom. Uma cotação expirada ou alterada retorna 409. O checkout consulta uma cotação antes de abrir a revisão e novamente ao confirmar. A assinatura inclui itens, quantidades, preços, versão, disponibilidade, cupom, taxa e total. Mudança mantém a revisão aberta com aviso e exige nova confirmação; esgotamento bloqueia o envio.

Idempotência é indexada por usuário e chave. A mesma chave e conteúdo retornam o pedido existente; conteúdo diferente retorna 409. A resposta pode se perder depois da criação no cenário `order-timeout`. O cliente persiste chave e corpo em `kurio.attempt.<userId>` antes do POST, usa trava imediata para cliques repetidos e não cria outra chave para recuperar uma resposta perdida. A recuperação tem prioridade sobre o carrinho vazio, pois o pedido pode já ter sido confirmado. Respostas 4xx definitivas liberam a tentativa; 401 preserva-a para novo login; falhas sem resposta mantêm a tentativa para recuperação explícita.

Pedidos pendentes guardam a data de resolução. Timers e consultas REST finalizam a simulação. Uma nova carga recupera o estado persistido. Confirmado/recusado são terminais. Na confirmação, o estoque é validado e reduzido e somente as quantidades compradas são descontadas do carrinho. O recibo guarda cópias de itens, preços, taxas, carteira e dados do colecionador.

## Sessão e persistência

A simulação guarda seu banco em `localStorage`, chave `kurio.mock.database.v1`. É um mecanismo de demonstração, não um backend seguro multiusuário. Os dados pertencem ao navegador e podem ser editados por quem tem acesso a ele. Não há cookie HttpOnly nem autenticação de produção.

A sessão dura uma hora e é validada nas operações privadas. TanStack Router faz a proteção inicial com `beforeLoad`, e `Protected` reage à expiração enquanto a tela está aberta. O destino interno é validado por `safeReturn` para impedir redirecionamento externo. Um timer revalida a sessão no vencimento. O interceptor Axios cancela consultas e remove dados privados ao receber 401; a query de sessão permanece observável e recebe `user: null`. O checkout exige sessão também ao cotar. Handlers com latência rejeitam operações privadas/carrinho/cotação quando a identidade muda enquanto a requisição está em andamento.

O login mescla o carrinho visitante respeitando disponibilidade e copia seu cupom quando a conta ainda não tem um. O logout encerra a sessão e limpa cache privado; o efeito de tempo real libera a conexão anterior. As chaves privadas incluem o usuário. Rascunhos `kurio.checkout.<userId>` e tentativas de compra sobrevivem à expiração para retomada somente na mesma conta. O reset remove ambos os namespaces e recria o banco. Os dados locais não são secretos: isolamento de UI/cache não transforma localStorage em um backend seguro.

Senhas são derivadas com PBKDF2/SHA-256, 100 mil iterações e salt aleatório. Fixtures públicas não devem receber dados pessoais ou senhas reais.

## Cache e tempo real

Queries usam `staleTime: 30s`, `gcTime: 5min`, revalidação no foco e uma repetição somente em falha de rede/5xx. Mutations não repetem automaticamente. Sessão usa `staleTime: 10s`. Catálogo inclui todos os parâmetros na chave; recursos privados incluem o identificador do usuário.

Favoritos fazem atualização otimista, cancelamento de consultas concorrentes, snapshot anterior, rollback no erro e invalidação ao finalizar. Mutations de carrinho invalidam carrinho e cotação.

Eventos `nft.updated` e `order.updated` usam `{ id, resourceId, version, userId? }`. O cliente memoriza a maior versão por recurso, ignora versões repetidas/antigas e eventos de outro usuário e invalida as queries afetadas. O REST continua sendo a fonte autoritativa. Ao reconectar, queries ativas são reconciliadas. O encerramento remove listeners e desconecta o socket.

O transporte é WebSocket (`socket.io-client`, `transports: ['websocket']`), interceptado por MSW. `@mswjs/socket.io-binding@0.2.0` faz a codificação e handshake. O mock envia ping Engine.IO a cada 20 segundos. Não simula polling HTTP, rooms, namespaces adicionais, anexos binários ou infraestrutura de múltiplos servidores. A troca de dados ocorre realmente pelo cliente Socket.IO, não por setters de UI.

## Design e acessibilidade

Fonte Roboto Mono local, cores `#140d0a`, `#241612`, `#d28a4c`, `#e89b55`, `#f5f1eb`, `#cfb28c`. Assets originais do Figma foram baixados localmente e não dependem de URLs temporárias.

O layout segue os frames do arquivo Figma `MyWoBOc1rDIB63aXDxMM48`, com referências desktop e mobile de início, detalhe, carrinho, pagamento, confirmação, login, cadastro, perfil e carteiras. Todos os assets necessários à execução estão versionados. Perfil, carteiras e recibo foram adaptados ao mobile, que não tinha frame específico.

A home acrescenta campo de busca desktop, ordenação mobile, checkboxes visíveis, entradas numéricas de faixa de preço e paginação mobile para os comportamentos do enunciado. Contagens vêm das 36 fixtures, não dos números estáticos do Figma. A ordenação dos dados permanece consistente entre desktop e mobile. O rodapé oferece apenas ações coerentes com a demonstração; artigos e newsletter informam sua indisponibilidade.

Diálogos Radix controlam foco, Escape e retorno ao acionador. Skeletons usam shimmer e respeitam movimento reduzido. O detalhe reserva a composição da galeria e das seções para reduzir deslocamentos. Mensagens de mutations/eventos usam região `role=status`. Há link de salto, labels, erros associados, foco visível e testes de overflow nas telas principais em 390/768/1440 pixels. Lighthouse cobre início e detalhe; isso não representa uma certificação completa WCAG.

### Ajustes de UX em relação às imagens

- Dados de demonstração substituem contagens, estoque e valores estáticos. Uma edição esgotada permanece visível e explicitamente marcada.
- No detalhe mobile, a seleção de edição usa texto e sublinhado, sem o contorno arredondado. Os ícones de Google e Facebook são SVGs locais. O menu do perfil inclui atividade, ofertas, downloads e suporte com avisos de indisponibilidade, conforme o escopo.
- Labels de formulário permanecem visíveis no mobile. Checkout inclui os dados necessários à validação, controles de conexão e revisão antes do envio, mesmo quando o frame móvel os omite.
- Avatar aceita PNG/JPEG/WebP de até 500 KB; preview, remoção e persistência são reais na simulação. Carteiras possuem seletor entre registros e ação de adicionar.
- Metadados e referências de transação são identificados como simulados. Campos complementares do colecionador são enviados no snapshot; observação/indicação não causam ações externas ou descontos.
- Galeria repete a imagem do NFT, como na exportação recebida; não foram inventadas vistas alternativas. Miniaturas selecionam o destaque e a ampliação usa diálogo.
- Login social, recuperação de senha por e-mail, páginas editoriais/suporte e newsletter informam indisponibilidade. O compartilhamento usa a área de transferência. Avaliações são ilustrativas, não conteúdo produzido por usuários reais.
- Os quatro PNGs originais foram preservados; WebPs de 960 px/qualidade 88 são usados na UI. A redução foi de 7.959.897 para 349.636 bytes (95,6%). A fonte é local.

## Validação e limites

Playwright cobre catálogo, URL/histórico, acesso direto, conta, favoritos com rollback, carrinho, cotação, checkout, idempotência, recibo, expiração, validações, falhas de rede, eventos antigos/duplicados e retomada. Testes de integração que usam fetch passam pelos handlers MSW; os fluxos de compra/conta também são percorridos pela UI. Relógio é instalado antes do bootstrap no cenário sensível de pedido pendente. Cada teste usa um contexto de navegador isolado.

As baselines de início/detalhe/carrinho/pagamento verificam regressões da implementação, não equivalência automática com o Figma. O painel de demonstração é mascarado nas comparações. As auditorias reais e seu ambiente estão em `PERFORMANCE.md` e `reports/lighthouse/`. O build inclui mocks por padrão. A aplicação está publicada em https://desafio-junglegaming-frontend.vercel.app, com fallback da SPA e service worker disponíveis nas rotas de produção.

Limites: banco local por origem e sem coordenação transacional entre abas; sem backend multiusuário, blockchain, cobrança ou envio de e-mail; preço em ETH é apenas unidade da demonstração inclusive para fixtures de outras redes; favoritos consultam as quatro páginas da fixture fixa de 36 NFTs; a simulação não é uma arquitetura de produção. Uma evolução real exigiria API autenticada, armazenamento seguro no servidor, paginação própria de favoritos, validação de endereços por rede e tratamento de concorrência/reserva de estoque no backend.
