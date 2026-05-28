const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'academy', 'admin', 'conversations', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// We need to replace `"/api/conversations` and `\`/api/conversations` with academy equivalents.
// But we must NOT touch `/api/academy/admin/conversations`.

content = content.replace(/\/api\/conversations/g, '/api/academy/conversations');

// If this replaced `/api/academy/admin/conversations` into `/api/academy/admin/academy/conversations`, we need to revert those.
// Actually, in the file, we only had `/api/conversations` and `/api/academy/admin/conversations`.
// Wait, `/api/academy/admin/conversations` does NOT contain `/api/conversations`?
// String `/api/academy/admin/conversations` contains `api/academy/admin/conversations`, it does NOT contain `/api/conversations` next to each other.
// Yes! `/api/conversations` matches exactly `"/api/conversations"` or `\`/api/conversations...`

fs.writeFileSync(filePath, content);
console.log('Fixed API endpoints in admin page');
