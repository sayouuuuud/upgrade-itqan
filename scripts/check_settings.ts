import { query } from "../lib/db"

async function check() {
    const rows = await query("SELECT * FROM system_settings")
    console.log(JSON.stringify(rows, null, 2))
}

check()
