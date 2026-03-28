import { neon, type NeonQueryFunction } from "@neondatabase/serverless"

let _sql: NeonQueryFunction<false, false> | null = null

export function getDb() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set")
    }
    _sql = neon(process.env.DATABASE_URL)
  }
  return _sql
}
