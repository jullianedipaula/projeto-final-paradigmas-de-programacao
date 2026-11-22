// Preço no paradigma FUNCIONAL: só funções puras, sem estado, sem laço e sem mutação.
// Cada função depende só do que recebe e devolve um valor novo.
import type { TipoIngresso } from "./tipos.ts";

// Arredonda em 2 casas decimais devolvendo número (o toFixed devolveria texto).
const arredondar = (valor: number): number => Math.round(valor * 100) / 100;

// Fábrica: fixa o preço base e devolve uma função que recebe o tipo do ingresso.
//   valorDoIngresso(80)("meia") === 40
export const valorDoIngresso =
  (precoBase: number) =>
  (tipo: TipoIngresso): number =>
    tipo === "meia" ? arredondar(precoBase / 2) : precoBase;
