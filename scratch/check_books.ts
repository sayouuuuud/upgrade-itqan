import { readFileSync } from "fs";
const env = readFileSync(".env.local", "utf-8");
env.split("\n").forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
});

// require AFTER env is loaded
const { query } = require("../lib/db");

async function main() {
  const cols = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'books'");
  console.log("Columns:", cols.map((c: any) => c.column_name).join(", "));
  
  const books = await query("SELECT id, title, library_domain FROM books LIMIT 50");
  console.log("Books:", books);
  
  process.exit(0);
}
main().catch(console.error);
