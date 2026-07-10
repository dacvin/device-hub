// PostgREST's `.or()` filter uses commas as condition separators and parens for
// grouping, so a raw search term containing `,`, `(`, or `)` corrupts the filter
// (→ HTTP 400). Wrapping each value in double quotes lets it contain those
// reserved characters; embedded `"` and `\` are backslash-escaped so they can't
// break out of the quotes. See PostgREST "Reserved characters" docs.
export function escapePostgrestValue(value: string): string {
  return value.replace(/[\\"]/g, (c) => `\\${c}`);
}

// Builds the argument for `query.or(...)` matching the term against name OR email.
export function buildNameEmailSearch(q: string): string {
  const escaped = escapePostgrestValue(q);
  return `name.ilike."%${escaped}%",email.ilike."%${escaped}%"`;
}
