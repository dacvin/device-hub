/**
 * Escape user input destined for a PostgREST `.or()` filter string.
 *
 * PostgREST treats `,` `(` `)` as filter delimiters and `\` as escape, so
 * unescaped user text can inject additional filter clauses (e.g. a search
 * term containing `,name.eq.admin` would add an OR clause). Backslash-escape
 * those characters and any literal backslashes before interpolating into
 * `column.ilike.%term%` patterns.
 */
export function escapePostgrestFilter(term: string): string {
  return term.replace(/[\\,()]/g, (c) => `\\${c}`);
}
