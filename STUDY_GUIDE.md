# Roteiro inicial de estudo

Este roteiro descreve o que já está implementado. Será complementado com checkout, sessão na interface e auditorias quando as demais telas estiverem prontas.

## 1. Entenda o caminho de uma consulta

Comece em `src/pages/home.tsx`: o catálogo recebe parâmetros da URL. Depois leia `src/lib/queries.ts`: a query usa esses parâmetros na chave e envia a chamada Axios. Em `src/mocks/handlers.ts`, o MSW recebe a chamada REST e filtra as fixtures. A resposta volta ao Query e ao componente.

Pergunta para praticar: por que buscar `ape` e buscar `nomad` não devem compartilhar a mesma entrada de cache?

## 2. Separe estado da URL e estado remoto

Busca, filtros, ordenação e página representam a navegação; por isso ficam no Router. Itens, preços, estoque e favoritos pertencem à API; por isso ficam no Query. O estado React local guarda apenas interações temporárias, como o drawer aberto ou o texto ainda não enviado.

Exercício: combine uma coleção e uma rede, copie a URL, recarregue e volte pelo histórico.

## 3. Explique a precisão de ETH

Leia `src/domain/money.ts` e seu teste. JavaScript com ponto flutuante não representa todas as frações decimais exatamente. O projeto transporta strings e calcula usando inteiros wei. Assim, `0.1 + 0.2` resulta exatamente em `0.3` no domínio.

Exercício: acompanhe duas unidades de `1.19 ETH` mais `0.016 ETH` de taxa até o total `2.396 ETH`.

## 4. Entenda idempotência e snapshot

Em `src/mocks/handlers.ts`, procure `Idempotency-Key`. A chave identifica uma tentativa de compra, inclusive quando a primeira resposta se perde. Repetir a tentativa retorna o mesmo pedido. Reutilizar a chave com outro conteúdo é um conflito.

Leia também `settle()` em `src/mocks/database.ts`. O recibo copia os preços no momento da compra; atualizar o catálogo depois não pode reescrever o histórico.

## 5. Siga o evento de tempo real

O painel de demonstração chama uma rota de simulação. Essa rota muda o banco e publica o evento. MSW e o binding codificam a mensagem Socket.IO. O cliente recebe o evento, verifica a versão e invalida queries. O Axios então consulta os dados atualizados.

Exercício: dispare **Evento duplicado e antigo** e explique por que o preço aumenta uma única vez. Depois desconecte, altere o preço e reconecte para observar a reconciliação.

## 6. Leia os testes pelo comportamento

`tests/e2e/catalog.spec.ts` verifica URL, histórico, filtros, foco e responsividade. `network.spec.ts` testa integração da API e Socket.IO. `visual.spec.ts` mantém baselines da home. `tests/unit/money.test.ts` protege as invariantes numéricas.

Distinção importante para apresentar o projeto: testar a API diretamente não equivale a testar a compra inteira pela interface. Essa cobertura ainda será adicionada.

## Ordem recomendada de leitura

1. `PLAN.md` e `REQUIREMENTS.md`: objetivo e critérios.
2. `src/domain/types.ts`: vocabulário e contratos.
3. `src/main.tsx`: inicialização do MSW antes da aplicação.
4. `src/router.tsx` e `src/pages/home.tsx`: URL e composição da tela.
5. `src/lib/queries.ts` e `src/lib/api.ts`: dados remotos e falhas.
6. `src/mocks/database.ts` e `src/mocks/handlers.ts`: regras da simulação.
7. `src/lib/realtime.ts` e `src/mocks/realtime.ts`: eventos e reconciliação.
8. Testes e `ARCHITECTURE.md`: evidências e limites.
