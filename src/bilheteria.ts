// A venda: onde a CONCORRÊNCIA aparece.
// O Node roda o JavaScript numa linha só. Enquanto um pedido espera no `await` do pagamento,
// o Node atende os outros pedidos. Por isso a ordem dos passos do `reservar` importa tanto.
import { DadosInvalidosErro, NaoEncontradoErro, PagamentoErro, type Evento } from "./dominio.ts";
import type { Pagamento } from "./pagamento.ts";
import { calcularTotal, montarIngressos } from "./preco.ts";
import { direitoAMeia } from "./regras.ts";
import type { Comprovante, ConfigBilheteria, EventoInfo, Pedido } from "./tipos.ts";

// Corrida entre a cobrança e um relógio: quem terminar primeiro decide.
// Se o relógio ganhar, a promessa rejeita com "tempo esgotado".
function comTempoLimite<T>(promessa: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const limite = new Promise<never>((_, rejeitar) => {
    timer = setTimeout(() => rejeitar(new Error("tempo esgotado")), ms);
  });
  // O finally desliga o relógio quando a cobrança termina antes.
  return Promise.race([promessa, limite]).finally(() => clearTimeout(timer));
}

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

  listarEventos(): EventoInfo[] {
    return this.#eventos.map((evento) => evento.info());
  }

  async reservar(pedido: Pedido): Promise<Comprovante> {
    // 1. Confere o pedido e acha o evento.
    if (!pedido || !Array.isArray(pedido.ingressos) || pedido.ingressos.length === 0) {
      throw new DadosInvalidosErro("o pedido precisa de ao menos um ingresso");
    }
    const evento = this.#eventos.find((e) => e.id === pedido.eventoId);
    if (!evento) {
      throw new NaoEncontradoErro(`evento ${pedido.eventoId} não existe`);
    }

    // 2. Marca as poltronas ANTES de qualquer await. Este trecho é síncrono: nenhum outro
    //    pedido roda no meio dele, então dois pedidos nunca pegam a mesma poltrona.
    //    Se a poltrona já tem dono, o erro sai daqui e ninguém é cobrado.
    const poltronas = pedido.ingressos.map((pessoa) => pessoa.poltrona);
    evento.reservar(poltronas);

    // 3. Calcula o preço com as funções puras.
    const ingressos = montarIngressos(evento.preco, pedido.ingressos, direitoAMeia);
    const total = calcularTotal(ingressos);

    // 4. Cobra. Aqui o pedido PAUSA e o Node atende os outros enquanto a operadora responde.
    //    O tempo limite impede que uma operadora travada prenda o pedido para sempre.
    try {
      await comTempoLimite(this.#pagar(total), this.#limitePagamentoMs);
    } catch (erro) {
      // Pagamento recusado ou demorado: devolve as poltronas para a venda.
      evento.liberar(poltronas);
      const motivo = erro instanceof Error ? erro.message : String(erro);
      throw new PagamentoErro(`pagamento não aprovado: ${motivo}`);
    }

    // 5. Comprovante com um reservaId novo a cada compra.
    const reservaId = this.#proximoReservaId++;
    return { reservaId, eventoId: evento.id, ingressos, total };
  }
}

export function criarBilheteria(config: ConfigBilheteria): Bilheteria {
  return new Bilheteria(config);
}
