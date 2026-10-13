import { randomInt } from "node:crypto";

// Product ID format from the project requirements, section 9.2:
// "TM-" + 10 random characters from an alphabet without look-alikes (no I, O, 0, 1).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePid(random: (max: number) => number = randomInt): string {
  let id = "";
  for (let i = 0; i < 10; i++) id += ALPHABET[random(ALPHABET.length)];
  return `TM-${id}`;
}
