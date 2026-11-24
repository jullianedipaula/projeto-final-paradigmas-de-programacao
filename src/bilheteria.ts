// A venda: onde a CONCORRÊNCIA aparece.
// O Node roda o JavaScript numa linha só. Enquanto um pedido espera no `await` do pagamento,
// o Node atende os outros pedidos. Por isso a ordem dos passos do `reservar` importa tanto.
import type { Evento } from "./dominio.ts";
import type { Pagamento } from "./pagamento.ts";
import type { ConfigBilheteria } from "./tipos.ts";

export class Bilheteria {
  // Campos privados: ninguém de fora troca os eventos, a operadora, o limite ou o contador.
  #eventos: Evento[];
  #pagar: Pagamento;
  #limitePagamentoMs: number;
  #proximoReservaId = 1;

  constructor(config: ConfigBilheteria) {
    this.#eventos = config.eventos;
    this.#pagar = config.pagar;
    this.#limitePagamentoMs = config.limitePagamentoMs;
  }
}

export function criarBilheteria(config: ConfigBilheteria): Bilheteria {
  return new Bilheteria(config);
}
