// A migration ".sql" script may contain several statements, and SQL Server
// happily runs a whole multi-statement batch in one call via Request#batch()
// - unlike oracledb, which runs exactly one statement per call. However,
// T-SQL requires CREATE TRIGGER/PROCEDURE/FUNCTION/VIEW (and CREATE SCHEMA)
// to be the *first* statement in their batch - confirmed live against a
// real server: `'CREATE TRIGGER' must be the first statement in a query
// batch`. This follows the standard sqlcmd/SSMS script convention so
// existing SQL Server scripts/DBAs' habits carry over unchanged: "GO" alone
// on its own line separates one batch from the next.
const SOLO_GO_PATTERN = /^\s*GO\s*$/i;

export function splitMssqlScript(script: string): string[] {
  const lines = script.split(/\r?\n/);
  const statements: string[] = [];
  let buffer: string[] = [];

  const flush = () => {
    const text = buffer.join('\n').trim();
    buffer = [];
    if (text) statements.push(text);
  };

  for (const line of lines) {
    if (SOLO_GO_PATTERN.test(line)) {
      flush();
      continue; // the "GO" line itself is a marker, not part of the batch
    }
    buffer.push(line);
  }
  flush();

  return statements;
}
