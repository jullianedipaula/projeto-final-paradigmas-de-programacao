// Regra de negócio da meia-entrada.
import type { Pessoa } from "./tipos.ts";

const IDADE_IDOSO = 60;

// Estudante, pessoa com deficiência (PcD) e quem tem 60 anos ou mais pagam meia.
export function direitoAMeia(pessoa: Pessoa): boolean {
  return pessoa.estudante || pessoa.pcd || pessoa.idade >= IDADE_IDOSO;
}
