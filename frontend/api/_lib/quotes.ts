/**
 * Wisdom quotes for each mentor persona.
 * Kazakh original + Russian translation — the cultural soul of Baǵdar.
 */

import type { PersonaType, QuoteResponse } from "./types.js";

const QUOTES: Record<PersonaType, QuoteResponse> = {
  aksakal: {
    kz: "Жолдың басында жүрген жақсы, жолдың соңында жүрген одан да жақсы.",
    ru: "Кто начинает путь первым — впереди, кто проходит его до конца — ещё впереди.",
  },
  abay: {
    kz: "Білім — кітапта емес, ілім — жүректе.",
    ru: "Знание — не в книге, мудрость — в сердце.",
  },
  nomad: {
    kz: "Далада жоқ жол жоқ, алдыңда жол бар — сол ізде.",
    ru: "В степи нет дороги, которая не ведёт вперёд — ищи свой путь.",
  },
};

/** Get the wisdom quote pair for a given persona */
export function getQuote(persona: PersonaType): QuoteResponse {
  return QUOTES[persona] ?? QUOTES.abay;
}
