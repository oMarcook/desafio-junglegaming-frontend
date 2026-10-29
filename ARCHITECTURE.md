# Arquitetura — estado da primeira etapa

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

Cada cotação registra no backend um identificador, dono, conteúdo e expiração. A criação compara esse conteúdo com uma nova leitura de preços/estoque/cupom. Uma cotação expirada ou alterada retorna 409. A interface de revisão explícita ainda será implementada.

Idempotência é indexada por usuário e chave. A mesma chave e conteúdo retornam o pedido existente; conteúdo diferente retorna 409. A resposta pode se perder depois da criação no cenário `order-timeout`. O cliente de checkout deverá preservar a tentativa e repetir o mesmo conteúdo/chave, comportamento ainda pendente na UI.

Pedidos pendentes guardam a data de resolução. Timers e consultas REST finalizam a simulação. Uma nova carga recupera o estado persistido. Confirmado/recusado são terminais. Na confirmação, o estoque é validado e reduzido e somente as quantidades compradas são descontadas do carrinho. O recibo guarda cópias de itens, preços, taxas, carteira e dados do colecionador.

## Sessão e persistência

A simulação guarda seu banco em `localStorage`, chave `kurio.mock.database.v1`. É um mecanismo de demonstração, não um backend seguro multiusuário. Os dados pertencem ao navegador e podem ser editados por quem tem acesso a ele. Não há cookie HttpOnly nem autenticação de produção.

A sessão dura uma hora e é validada nas operações privadas. O interceptor Axios limpa dados privados quando recebe 401 de uma operação protegida. O login mescla o carrinho visitante respeitando disponibilidade. O logout da interface desconecta o socket e limpa o cache privado. Os formulários de autenticação e retomada de checkout ainda estão pendentes.

Senhas são derivadas com PBKDF2/SHA-256, 100 mil iterações e salt aleatório. Fixtures públicas não devem receber dados pessoais ou senhas reais.

## Cache e tempo real

Queries usam `staleTime: 30s`, `gcTime: 5min`, revalidação no foco e uma repetição somente em falha de rede/5xx. Mutations não repetem automaticamente. Sessão usa `staleTime: 10s`. Catálogo inclui todos os parâmetros na chave; recursos privados incluem o identificador do usuário.

Favoritos fazem atualização otimista, cancelamento de consultas concorrentes, snapshot anterior, rollback no erro e invalidação ao finalizar. Mutations de carrinho invalidam carrinho e cotação.

Eventos `nft.updated` e `order.updated` usam `{ id, resourceId, version, userId? }`. O cliente memoriza a maior versão por recurso, ignora versões repetidas/antigas e eventos de outro usuário e invalida as queries afetadas. O REST continua sendo a fonte autoritativa. Ao reconectar, queries ativas são reconciliadas. O encerramento remove listeners e desconecta o socket.

O transporte é WebSocket (`socket.io-client`, `transports: ['websocket']`), interceptado por MSW. `@mswjs/socket.io-binding@0.2.0` faz a codificação e handshake. O mock envia ping Engine.IO a cada 20 segundos. Não simula polling HTTP, rooms, namespaces adicionais, anexos binários ou infraestrutura de múltiplos servidores. A troca de dados ocorre realmente pelo cliente Socket.IO, não por setters de UI.

## Design e acessibilidade

Fonte Roboto Mono local, cores `#140d0a`, `#241612`, `#d28a4c`, `#e89b55`, `#f5f1eb`, `#cfb28c`. Assets originais do Figma foram baixados localmente e não dependem de URLs temporárias.

Foram extraídos os frames `2:2` e `14:5226` do arquivo `MyWoBOc1rDIB63aXDxMM48`. O MCP Starter bloqueou as leituras seguintes. O usuário escolheu fornecer imagens exportadas antes da implementação das demais telas. Essa é uma pendência de fidelidade, não uma tela considerada concluída.

A home acrescenta campo de busca desktop, ordenação mobile, checkboxes visíveis, entradas numéricas de faixa de preço e paginação mobile para os comportamentos do enunciado. Contagens vêm das 36 fixtures, não dos números estáticos do Figma. A ordenação dos dados permanece consistente entre desktop e mobile. O rodapé oferece apenas ações coerentes com a demonstração; artigos e newsletter informam sua indisponibilidade.

Diálogos Radix controlam foco, Escape e retorno ao acionador. Skeletons usam shimmer e respeitam movimento reduzido. Mensagens de mutations/eventos usam região `role=status`. Há link de salto, labels, foco visível e testes de overflow em 390/768/1440 pixels. A conformidade completa de acessibilidade ainda depende das demais telas e auditorias.

## Validação e limites

As verificações iniciais cobrem catálogo e contratos críticos da API. Testes que chamam fetch diretamente são testes de integração através do MSW, não substituem os fluxos E2E de compra/conta exigidos. As baselines verificam regressões da implementação, não equivalência automática com o Figma.

O build inclui os mocks por padrão. Ainda faltam os fluxos completos, auditorias Lighthouse, relatórios de performance, deploy público e testes em checkout limpo após concluir a aplicação. As imagens PNG originais têm aproximadamente 2 MB cada; a estratégia de otimização deverá preservar a aparência e ser medida na auditoria, sem remover funcionalidades.
