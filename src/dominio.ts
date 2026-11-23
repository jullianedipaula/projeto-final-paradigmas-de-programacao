// Domínio no paradigma ORIENTADO A OBJETOS: os erros de negócio e o Evento.
import type { EventoInfo } from "./tipos.ts";

// ---------------------------------------------------------------- Erros de negócio
// Classe abstrata: ninguém lança um "ErroDeNegocio" genérico, só uma das filhas.
// Cada erro carrega o próprio status HTTP, então o servidor não precisa de um if por tipo.
export abstract class ErroDeNegocio extends Error {
  readonly status: number;

  constructor(mensagem: string, status: number) {
    super(mensagem);
    this.name = new.target.name;
    this.status = status;
  }
}

// Pedido ou poltrona inválidos.
export class DadosInvalidosErro extends ErroDeNegocio {
  constructor(mensagem: string) {
    super(mensagem, 400);
  }
}

// O evento não existe.
export class NaoEncontradoErro extends ErroDeNegocio {
  constructor(mensagem: string) {
    super(mensagem, 404);
  }
}

// A poltrona já foi vendida.
export class PoltronaOcupadaErro extends ErroDeNegocio {
  constructor(mensagem: string) {
    super(mensagem, 409);
  }
}

// A operadora não aprovou o pagamento (ou demorou demais).
export class PagamentoErro extends ErroDeNegocio {
  constructor(mensagem: string) {
    super(mensagem, 502);
  }
}

// ---------------------------------------------------------------- Evento
export class Evento {
  readonly id: number;
  readonly nome: string;
  readonly preco: number;
  readonly capacidade: number;

  // Campo privado (#): só o código desta classe enxerga e altera as poltronas vendidas.
  #vendidas: number[] = [];

  constructor(id: number, nome: string, preco: number, capacidade: number) {
    this.id = id;
    this.nome = nome;
    this.preco = preco;
    this.capacidade = capacidade;
  }

  // Só leitura: sem setter, `evento.disponivel = 999` não muda nada.
  get disponivel(): number {
    return this.capacidade - this.#vendidas.length;
  }

  // Tudo ou nada: confere TODAS as poltronas primeiro e só depois marca.
  reservar(poltronas: number[]): void {
    if (!Array.isArray(poltronas) || poltronas.length === 0) {
      throw new DadosInvalidosErro("informe ao menos uma poltrona");
    }
    for (const poltrona of poltronas) {
      if (!this.#existe(poltrona)) {
        throw new DadosInvalidosErro(`a poltrona ${poltrona} não existe (vai de 1 a ${this.capacidade})`);
      }
    }
    if (new Set(poltronas).size !== poltronas.length) {
      throw new DadosInvalidosErro("a mesma poltrona aparece mais de uma vez no pedido");
    }
    const ocupadas = poltronas.filter((poltrona) => this.#vendidas.includes(poltrona));
    if (ocupadas.length > 0) {
      throw new PoltronaOcupadaErro(`poltrona já vendida: ${ocupadas.join(", ")}`);
    }
    // Chegou aqui: nenhuma regra quebrou, então marca todas de uma vez.
    this.#vendidas.push(...poltronas);
  }

  info(): EventoInfo {
    return {
      id: this.id,
      nome: this.nome,
      preco: this.preco,
      capacidade: this.capacidade,
      disponivel: this.disponivel,
    };
  }

  #existe(poltrona: number): boolean {
    return Number.isInteger(poltrona) && poltrona >= 1 && poltrona <= this.capacidade;
  }
}
