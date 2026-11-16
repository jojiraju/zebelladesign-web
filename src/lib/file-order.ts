const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];

/** Turns number words in a file name into digits so "ad-two" sorts before "ad-three" (as does "ad-2" before "ad-10"). */
const key = (name: string) => name.toLowerCase().replace(/(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)/g, (w) => String(WORDS.indexOf(w)));

export const byFileNumber = (a: string, b: string) => key(a).localeCompare(key(b), undefined, { numeric: true });
