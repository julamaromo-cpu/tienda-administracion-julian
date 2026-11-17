import { createPool, type Pool } from "mysql2/promise";

type DatabaseGlobal = typeof globalThis & { lumenMysqlPool?: Pool };

const globalForMysql = globalThis as DatabaseGlobal;

export function getPool(): Pool {
  if (globalForMysql.lumenMysqlPool) return globalForMysql.lumenMysqlPool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Falta DATABASE_URL. Configura la conexión a MySQL en .env.local.");
  }

  const databaseUrl = new URL(connectionString);
  if (databaseUrl.protocol !== "mysql:") {
    throw new Error("DATABASE_URL debe usar el protocolo mysql://.");
  }

  const database = decodeURIComponent(databaseUrl.pathname.replace(/^\/+/, ""));
  if (!database || !databaseUrl.hostname) {
    throw new Error("DATABASE_URL debe incluir el host y el nombre de la base de datos.");
  }

  globalForMysql.lumenMysqlPool = createPool({
    host: databaseUrl.hostname,
    port: Number(databaseUrl.port || 3306),
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true,
  });

  return globalForMysql.lumenMysqlPool;
}
