# Bilheteria concorrente

Projeto final de Paradigmas de Linguagens de Programação. Enunciado completo no Blackboard.

Os arquivos de `src/` que vocês escrevem já existem, vazios; o `tipos.ts` e o `servidor.ts` vêm prontos. O que vai em cada um está no passo
indicado do enunciado:

| Arquivo | Passo do enunciado |
| :--- | :--- |
| `src/tipos.ts` (pronto) | 1: os tipos |
| `src/regras.ts` | 2: meia-entrada |
| `src/preco.ts` | 3: preço (funcional) |
| `src/dominio.ts` | 4: evento e erros (orientado a objetos) |
| `src/bilheteria.ts` | 5: a venda, onde a concorrência aparece |
| `src/servidor.ts` (pronto) e `src/main.ts` | 6: ligar o servidor |

Não alterem `src/pagamento.ts`, `src/servidor.ts`, `src/bench.ts` nem `testes/`: a correção usa os originais.

Para começar, sigam o `GUIA.md`. Depois dele, os comandos são:

```bash
npm install
npm test          # correção automática: mostra os pontos
npm start         # serviço em http://localhost:3000
npm run bench     # com o serviço no ar: 200 pedidos simultâneos no evento 1, dois por poltrona
```

Exemplo de pedido:

```bash
curl -X POST localhost:3000/reservas -H 'Content-Type: application/json' \
  -d '{"eventoId":1,"ingressos":[{"nome":"Ana","idade":20,"estudante":true,"pcd":false,"poltrona":7}]}'
```

---

## Preencham (avaliado no vídeo)

**Link do vídeo:** _(a preencher)_

### Integrantes

| Nome | Usuário do GitHub | Parte principal |
| :--- | :--- | :--- |
| Julliane Di Paula | [jullianedipaula](https://github.com/jullianedipaula) | regras.ts, preco.ts (funcional), README.md |
| Felipe Souto | [FelipeSoutoo](https://github.com/FelipeSoutoo) | dominio.ts (orientado a objetos), main.ts |
| Arthur Xavier | [ArthurXavier01](https://github.com/ArthurXavier01) | bilheteria.ts (concorrência) |

### Decisões

1. **Concorrência.** Como vocês garantem que duas pessoas não ficam com a mesma poltrona? Onde estava o
   `await` perigoso?

   O Node executa o JavaScript numa linha só e só troca de pedido num `await`. No `Bilheteria.reservar`, a
   conferência do pedido e o `evento.reservar(poltronas)` são **síncronos** e acontecem **antes** do
   `await` do pagamento: entre olhar se a poltrona está livre e marcá-la, nenhum outro pedido roda. Quem
   chega depois já encontra a poltrona vendida e recebe `PoltronaOcupadaErro` (409) sem ser cobrado.
   O `await` perigoso é o da cobrança (`await comTempoLimite(pagar(total), ...)`): se as poltronas fossem
   marcadas só depois dele, os 4 pedidos da mesma poltrona passariam pela conferência, todos pagariam
   durante a espera e só depois um deles descobriria que a poltrona já tinha dono — gente cobrada sem
   poltrona. Se o pagamento falha ou passa do tempo limite, o `catch` chama `evento.liberar(poltronas)`
   e lança `PagamentoErro` (502), devolvendo as poltronas para a venda.

2. **OO.** O que o `Evento` esconde e por quê? Por que o `reservar` é tudo ou nada? Por que os erros são uma hierarquia de classes?

   O `Evento` esconde a lista de poltronas vendidas no campo privado `#vendidas`. De fora só dá para ler
   `disponivel` (um getter sem setter) e pedir `reservar`/`liberar`, que validam tudo antes de mudar o
   estado. Assim ninguém consegue "vender" uma poltrona sem passar pelas regras (encapsulamento).
   O `reservar` é tudo ou nada porque um pedido é de uma família: ou todos sentam, ou ninguém. Ele
   confere todas as poltronas (existe? repetida? já vendida?) e só depois marca; se marcasse uma a uma,
   um erro no meio deixaria poltronas presas para um pedido recusado.
   Os erros são uma hierarquia (`ErroDeNegocio` abstrato e quatro filhas) porque cada erro carrega o
   próprio `status` HTTP. O servidor faz um único `instanceof ErroDeNegocio` e responde `erro.status`,
   sem um `if` para cada tipo (polimorfismo); criar um erro novo não exige mexer no servidor.

3. **Funcional.** O que ganhamos com `preco.ts` puro? Como vocês testariam ele sem subir o servidor?

   As funções de `preco.ts` só dependem dos argumentos e não alteram nada (sem `let`, laço ou `push`):
   a mesma entrada dá sempre a mesma saída. Isso as torna previsíveis, fáceis de combinar (as fábricas
   `valorDoIngresso` e `aplicarTaxa` devolvem funções prontas para reusar) e seguras sob concorrência,
   já que não há estado compartilhado para dois pedidos disputarem. A regra da meia entra como parâmetro
   (`temDireitoAMeia`), então dá para trocá-la sem mudar o cálculo.
   Para testar basta importar e chamar, sem servidor, banco ou operadora: por exemplo
   `assert.equal(aplicarTaxa(0.1)(100), 110)` ou `calcularTotal(montarIngressos(100, pessoas, regra))` —
   é o que os testes de `testes/projeto.ts` fazem.

4. **Se fosse em outro paradigma.** Escolham uma das partes e expliquem como ficaria em outro
   paradigma, e se ficaria melhor ou pior.

   O `Evento` no paradigma funcional: em vez de um objeto que muda o próprio `#vendidas`, ele seria um
   valor imutável `{ id, capacidade, vendidas }` e `reservar(evento, poltronas)` devolveria **um evento
   novo** (ou um erro). Ganharíamos testes ainda mais simples e histórico de estados, mas alguém
   precisaria guardar "o evento atual" e trocá-lo a cada venda — e é justamente esse ponto de troca que
   precisa ser protegido na concorrência. Na bilheteria, com muitas vendas sobre o mesmo evento, o
   objeto com estado encapsulado fica mais direto; o funcional ficaria pior aqui, mas melhor no preço,
   onde não existe estado.

5. **Concorrente × paralelo.** O Node roda o JavaScript numa linha só: os pedidos de vocês são
   concorrentes, não paralelos. O que mudaria se a venda rodasse em vários núcleos ao mesmo tempo?

   Hoje a garantia vem de o trecho "confere e marca" nunca ser interrompido. Com vários núcleos
   executando ao mesmo tempo, duas threads poderiam ler a mesma poltrona como livre no mesmo instante e
   as duas marcarem (condição de corrida). Seria preciso sincronizar: uma trava (mutex) por evento ou
   por poltrona, operações atômicas, ou deixar a decisão para um banco de dados com transação/restrição
   de unicidade. Também não daria para guardar as poltronas em memória de cada processo: vários
   processos precisariam de um estado compartilhado (banco, Redis) para enxergarem as mesmas vendas.

### Resultados do bench

| Cenário | Pedidos | Tempo (ms) | Vendidos | Poltrona ocupada | Falha de pagamento |
| :--- | ---: | ---: | ---: | ---: | ---: |
| Padrão (`main.ts`) | 200 | 367 | 90 | 100 | 10 |

O bench ocupa as poltronas do evento 1: para rodar de novo, parem o `npm start` (Ctrl+C) e subam outra
vez.

O que os números mostram:

- Os 200 pedidos terminaram em cerca de 0,4 s, embora cada cobrança demore 80 ms: um a um levariam
  16 s. Enquanto um pedido espera a operadora no `await`, o Node atende os outros (concorrência).
- Nenhuma poltrona foi vendida duas vezes: cada poltrona recebeu 2 pedidos e, no máximo, um foi
  vendido. O segundo pedido de cada poltrona recebeu 409 **sem ser cobrado**, porque a poltrona é
  marcada antes do pagamento.
- Cerca de 10% dos pagamentos falharam (502), que é a `taxaDeFalha: 0.1` da operadora falsa. Essas
  poltronas voltaram para a venda (`liberar`): no fim, `disponivel` do evento 1 era exatamente o número
  de falhas (10).
- Em outra rodada saíram 96 vendidos, 91 ocupados e 13 falhas: quando o pagamento do primeiro pedido
  falha e a poltrona é liberada antes de o segundo pedido chegar, o segundo consegue comprá-la. Isso
  mostra a devolução funcionando, e a soma vendidos + ocupados + falhas é sempre 200.
