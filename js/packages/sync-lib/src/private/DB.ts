import SQLiteDB from "better-sqlite3";
import type { Database } from "better-sqlite3";
import { Change, Config } from "../Types.js";
import { extensionPath } from "@vlcn.io/crsqlite";
import util from "../util.js";
import touchHack from "./touchHack.js";

/**
 * Wraps a normal better-sqlite3 connection to provide
 * easy access to things like site id, changeset pulling, seen peers.
 *
 * Creates the connection, set correct WAL mode, loads cr-sqlite extension.
 */
export default class DB {
  private readonly db: Database;
  readonly #pullChangesetStmt: SQLiteDB.Statement;
  readonly #applyChangesTx: SQLiteDB.Transaction;

  constructor(private readonly config: Config, private readonly dbid: string) {
    this.db = new SQLiteDB(util.getDbFilename(config, dbid));
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("synchronous = NORMAL");

    // check if siteid table exists
    const siteidTableExists = this.db
      .prepare(
        "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='__crsql_siteid'"
      )
      .pluck()
      .get();
    if (siteidTableExists == 0) {
      this.db.exec(`CREATE TABLE __crsql_siteid (site_id)`);
      this.db
        .prepare(`INSERT INTO "__crsql_siteid" VALUES (?)`)
        .run(util.uuidToBytes(dbid));
    }

    this.db.loadExtension(extensionPath);
    this.#pullChangesetStmt = this.db.prepare(
      `SELECT "table", "pk", "cid", "val", "col_version", "db_version" FROM crsql_changes WHERE db_version > ? AND site_id IS NOT ?`
    );
    this.#pullChangesetStmt.raw(true);
    const applyChangesetStmt = this.db.prepare(
      `INSERT INTO crsql_changes ("table", "pk", "cid", "val", "col_version", "db_version", "site_id") VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    this.#applyChangesTx = this.db.transaction(
      (from: Uint8Array, changes: readonly Change[]) => {
        for (const cs of changes) {
          applyChangesetStmt.run(
            cs[0],
            cs[1],
            cs[2],
            cs[3],
            cs[4],
            cs[5],
            from
          );
        }
      }
    );
  }

  __testsOnly(): Database {
    return this.db;
  }

  // TODO: when we're on litestream and have different nodes processing live streams
  // we'll need to tell them to check for schema changes.
  // We can do that before they pull changes for their stream and check schema version.
  // Maybe just do that by default? If schema version changes from last pull in stream, re-stablish a connection?
  // there's obvi the pragma to retrieve current schema version from sqlite.
  async migrateTo(
    schemaName: string,
    version: string,
    ignoreNameMismatch: boolean = false
  ): Promise<"noop" | "apply" | "migrate"> {
    // get current schema version
    const storedVersion = this.db
      .prepare(`SELECT value FROM crsql_master WHERE key = 'schema_version'`)
      .pluck()
      .get();
    const storedName = this.db
      .prepare(`SELECT value FROM crsql_master WHERE key = 'schema_name'`)
      .pluck()
      .get();

    if (storedVersion === version) {
      // no-op, no need to apply schema
      return "noop";
    }

    if (
      !ignoreNameMismatch &&
      storedName != null &&
      storedName !== schemaName
    ) {
      throw new Error(
        `Cannot migrate between completely different schemas. from ${storedName} to ${schemaName}`
      );
    }

    const schema = await util.readSchema(this.config, schemaName);
    if (storedVersion == null) {
      // first ever application of the schema
      this.db.exec(schema);
      return "apply";
    } else {
      // some version of the schema already exists. Run auto-migrate.
      this.db.transaction(() => {
        this.db.prepare(`SELECT crsql_automigrate(?)`).run(schema);
        this.db
          .prepare(
            `INSERT OR REPLACE INTO crsql_master (key, value) VALUES (?, ?)`
          )
          .run("schema_version", version);
        this.db
          .prepare(
            `INSERT OR REPLATE INTO crsql_master (key, value) VALUES (?, ?)`
          )
          .run("schema_name", schemaName);
      })();
      return "migrate";
    }
  }

  applyChanges(from: Uint8Array, changes: readonly Change[]) {
    // TODO: do we not need to check that the application is contiguous?
    // as well as update the last seen version?
    // not here. DBSyncService should do that I think.
    this.#applyChangesTx(from, changes);

    // probably in the future just set up some msg queue service.
    touchHack(this.config, this.dbid);
  }

  pullChangeset(
    requestor: Uint8Array,
    since: number
  ): IterableIterator<Change> {
    const iter = this.#pullChangesetStmt.iterate(
      since,
      requestor
    ) as IterableIterator<Change>;
    return iter;
  }

  close() {
    this.db.exec("SELECT crsql_finalize()");
    this.db.close();
  }
}
