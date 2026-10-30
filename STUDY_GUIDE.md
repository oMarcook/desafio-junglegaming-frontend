# Roteiro de estudo — Kurio

## A ideia central

A interface não decide se uma compra deu certo. Ela coleta a intenção, consulta uma API, mostra a revisão e acompanha o pedido. Nesta demonstração, o MSW representa o servidor e aplica as regras. Isso permite estudar integração sem depender de serviços reais.

## 1. Siga uma requisição

Leia `src/pages/home.tsx`, `src/lib/queries.ts`, `src/lib/api.ts` e `src/mocks/handlers.ts`, nessa ordem.

```text
URL → TanStack Router → hook Query → Axios → handler MSW
                                            ↓
                                      banco simulado
                                            ↓
Componente ← cache Query ← resposta HTTP ← regras
```

A busca faz parte da URL; a resposta faz parte do cache remoto. O componente guarda apenas interação temporária, como texto ainda não enviado ou diálogo aberto. A chave do catálogo inclui todos os filtros. O AbortSignal permite cancelar respostas obsoletas.

**Exercício:** busque Golden, filtre Ethereum, mude a ordenação, copie a URL e recarregue. Explique por que duas buscas diferentes precisam de chaves de cache diferentes.

## 2. Entenda o estado de sessão

Leia `src/lib/auth.tsx`, `src/pages/auth.tsx` e o interceptor em `src/lib/api.ts`.

`beforeLoad` protege o acesso inicial. `Protected` reage quando a sessão expira com a tela aberta. Login preserva o destino interno e incorpora o carrinho visitante. Cache e drafts usam o identificador do usuário; sair ou trocar de conta não deve mostrar dados de outra pessoa.

**Exercício:** preencha o checkout, expire a sessão no painel e entre novamente. Depois use Alex e confira que favoritos e pedidos de Nova não aparecem.

**Pergunta de entrevista:** por que ocultar um botão não protege um recurso? Porque a API precisa verificar sessão e propriedade em cada operação, inclusive no acesso direto ao pedido.

## 3. Faça dinheiro sem ponto flutuante

Leia `src/domain/money.ts` e `tests/unit/money.test.ts`. Preços trafegam como strings; cálculos usam BigInt em wei (18 casas). Isso evita erros como a soma binária de 0.1 e 0.2.

Duas unidades de 1.19 somam 2.38; com desconto de 10% e taxa de 0.016, o total é 2.158 ETH. A cotação vem da API; a UI não mantém uma segunda fórmula independente.

**Exercício:** siga subtotal, desconto, taxa e total em `quote()` de `src/mocks/database.ts`.

## 4. Estude a compra em três momentos

Leia `prepare`, `confirm` e `purchase` em `src/pages/checkout.tsx`.

1. **Preparar:** validar dados, conexão e cotação; abrir revisão.
2. **Confirmar:** consultar novamente e comparar conteúdo. Mudou preço/estoque? Solicitar outra confirmação. Esgotou? Impedir envio.
3. **Acompanhar:** criar pedido pendente e mostrar sucesso apenas quando a simulação confirmar.

Uma trava imediata impede cliques concorrentes. A tentativa com chave e corpo é gravada antes do POST. Timeout não prova que a operação falhou: o servidor pode ter criado o pedido e a resposta pode ter se perdido. Recuperar usa exatamente a mesma chave/corpo.

**Exercício:** ative `order-timeout`, compre, recarregue e recupere. Confira que Meus pedidos mostra uma única compra.

**Pergunta de entrevista:** desabilitar o botão resolve duplicidade? Ajuda na UI, mas idempotência no servidor é necessária para reenvios e falhas de rede.

## 5. Diferencie catálogo e recibo

Leia `settle()` e a criação de pedido nos mocks. O pedido copia itens, preços, taxa, carteira e dados do colecionador. Esse snapshot preserva o histórico. Depois da confirmação, uma alteração no catálogo não altera o recibo.

Somente as quantidades compradas saem do carrinho. Pedido recusado preserva os itens. Confirmado/recusado são estados terminais; uma mensagem velha não pode fazê-los voltar a pendente.

## 6. Acompanhe um evento Socket.IO

Leia `src/mocks/realtime.ts` e `src/lib/realtime.ts`.

```text
Controle de demonstração → REST → banco alterado → evento MSW
→ protocolo Socket.IO → socket.io-client → conferir versão/usuário
→ invalidar Query → REST reconciliado → interface atualizada
```

O evento informa que um recurso mudou; o REST devolve seu estado atual. A maior versão por recurso impede reaplicar duplicatas/eventos antigos. Reconectar invalida consultas ativas, pois eventos podem ter sido perdidos. Listeners antigos são liberados na troca de sessão.

**Exercício:** deixe Emerald no carrinho, desconecte o tempo real, altere o preço e reconecte. Explique por que reconsultar é mais robusto do que presumir que todos os eventos chegaram.

## 7. Entenda atualização otimista

Em `useFavoriteMutation`, observe cancelamento da consulta, cópia do estado anterior, alteração imediata, rollback e invalidação final. A sensação de rapidez não dispensa tratar erro.

**Exercício:** use `favorite-error`, favorite e observe o retorno ao estado anterior. Depois volte a `default` e confirme a persistência após refresh.

## 8. Leia testes como cenários do usuário

| Arquivo | O que demonstra |
| --- | --- |
| `catalog.spec.ts` | URL, filtros, histórico, teclado e larguras. |
| `account.spec.ts` | Cadastro, avatar, senha, carteiras, sessão e favoritos. |
| `purchase.spec.ts` | Compra completa, cotação alterada, timeout e recusa. |
| `resilience.spec.ts` | Skeleton, falhas, esgotamento, desconexão e responsividade. |
| `validation.spec.ts` | Conflitos, erros de campo, cupons e respostas obsoletas. |
| `network.spec.ts` | Contratos REST, precisão, idempotência, isolamento e eventos. |
| `visual.spec.ts` | Comparação de screenshots das quatro telas exigidas. |

E2E comprova comportamento; snapshot visual detecta mudanças de aparência; Lighthouse mede outro conjunto de propriedades. Nenhum deles, isoladamente, prova qualidade completa. Os relatórios devem ser lidos junto às limitações.

## 9. Explique performance

Leia `PERFORMANCE.md`, `lighthouse.config.mjs` e `scripts/audit.mjs`. São três medições por página/perfil e medianas por categoria. LCP mede quando o maior conteúdo aparece; CLS mede deslocamentos; TBT mede bloqueio da thread principal. WebP reduziu transferência; o skeleton do detalhe reserva espaço; nada foi desligado exclusivamente para a auditoria.

## Apresentação em cinco minutos

1. Mostre o catálogo e uma URL com filtros.
2. Faça uma compra e explique cotação, idempotência e snapshot.
3. Dispare alteração de preço e timeout no painel.
4. Mostre um teste e o relatório Lighthouse.
5. Explique os limites: tudo é simulado, banco local não é autenticação de produção e o deploy foi adiado por escolha do usuário.

## Próximos exercícios

- Criar um endpoint paginado de favoritos, sem consultar o catálogo inteiro.
- Separar checkout por rede e validar endereços conforme a rede escolhida.
- Projetar reserva de estoque e transações no backend real.
- Acrescentar testes de zoom e leitor de tela além das verificações atuais.
- Publicar na Vercel e repetir os testes essenciais na URL pública.
