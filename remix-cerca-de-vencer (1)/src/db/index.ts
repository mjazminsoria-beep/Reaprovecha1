import 'dotenv/config';
import { Pool, QueryResult, QueryResultRow } from 'pg';

declare global {
  var _neonPostgresPool: Pool | undefined;
}

// Neon PostgreSQL credentials provided by user
const PGHOST = process.env.PGHOST || 'ep-summer-resonance-b5x41gp5-pooler.c-7.us-east-2.aws.neon.tech';
const PGDATABASE = process.env.PGDATABASE || 'neondb';
const PGUSER = process.env.PGUSER || 'neondb_owner';
const PGPASSWORD = process.env.PGPASSWORD || 'npg_My26CbWfXags';
const PGPORT = Number(process.env.PGPORT || 5432);

export const createPool = (): Pool => {
  if (!global._neonPostgresPool) {
    const connStr = process.env.DATABASE_URL;
    if (connStr) {
      global._neonPostgresPool = new Pool({
        connectionString: connStr,
        ssl: { rejectUnauthorized: false },
        max: 10,
        connectionTimeoutMillis: 10000,
      });
    } else {
      global._neonPostgresPool = new Pool({
        host: PGHOST,
        user: PGUSER,
        password: PGPASSWORD,
        database: PGDATABASE,
        port: PGPORT,
        ssl: { rejectUnauthorized: false },
        max: 10,
        connectionTimeoutMillis: 10000,
      });
    }

    global._neonPostgresPool.on('error', (err) => {
      console.warn('PostgreSQL Pool notice:', err.message);
    });
  }
  return global._neonPostgresPool;
};

export const pool = createPool();

export const isPostgresConfigured = (): boolean => true;

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}
