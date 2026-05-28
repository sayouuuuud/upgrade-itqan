import { query } from './lib/db'
import fs from 'fs'

async function run() {
  const sql = fs.readFileSync('scripts/033-fiqh-custom-fields.sql', 'utf8')
  console.log('Running script 033-fiqh-custom-fields.sql...')
  await query(sql)
  console.log('Done.')
}

run().catch(console.error).then(() => process.exit(0))
