import { query } from './lib/db'
import fs from 'fs'

async function run() {
  const sql = fs.readFileSync('scripts/032-fiqh-library-polish.sql', 'utf8')
  console.log('Running script 032-fiqh-library-polish.sql...')
  await query(sql)
  console.log('Done.')
}

run().catch(console.error).then(() => process.exit(0))
