export function cleanString(input: string | undefined | null): string {
  let current = input ?? "";
  let previous: string;

  do {
    previous = current;
    current = current
      .trim()
      .toLowerCase()
      .replace(/\s*[—–]\s*/g, ",")
      .replace(/\.$/, "");
  } while (current !== previous);

  return current;
}
