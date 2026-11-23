// Domínio no paradigma ORIENTADO A OBJETOS: os erros de negócio e o Evento.

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
