// Ponto de entrada: monta os eventos, a operadora e a bilheteria, e liga o servidor.
import { criarBilheteria } from "./bilheteria.ts";
import { Evento } from "./dominio.ts";
import { criarPagamentoFalso } from "./pagamento.ts";
import { criarServidor } from "./servidor.ts";

const PORTA = 3000;

const eventos = [
  new Evento(1, "Show de abertura", 120, 100), // o bench usa o evento 1, com 100 poltronas
  new Evento(2, "Peça de teatro", 60, 40),
  new Evento(3, "Festival de jazz", 200, 250),
];

const pagar = criarPagamentoFalso({ latenciaMs: 80, taxaDeFalha: 0.1 });

const bilheteria = criarBilheteria({ eventos, pagar, limitePagamentoMs: 500 });

criarServidor(bilheteria).listen(PORTA, () => {
  console.log(`Bilheteria no ar em http://localhost:${PORTA}`);
});
