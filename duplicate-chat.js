const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'app', 'admin', 'conversations', 'page.tsx');
const destDir = path.join(__dirname, 'app', 'academy', 'admin', 'conversations');
const destPath = path.join(destDir, 'page.tsx');

let content = fs.readFileSync(srcPath, 'utf8');

// Replace API paths
content = content.replace(/\/api\/admin\/conversations/g, '/api/academy/admin/conversations');
content = content.replace(/\/api\/admin\/contact-messages/g, '/api/academy/admin/contact-messages');
content = content.replace(/\/api\/admin\/users/g, '/api/academy/admin/users');

// Replace domain specific text
content = content.replace(/البحث باسم الطالب أو المقرئ/g, 'البحث باسم الطالب أو المدرس أو ولي الأمر');
content = content.replace(/Search by student or reader name/g, 'Search by student, teacher or parent name');
content = content.replace(/reader_name/g, 'teacher_name');
content = content.replace(/reader_avatar/g, 'teacher_avatar');
content = content.replace(/reader_id/g, 'teacher_id');

// Actually wait, some roles might need more complex renaming: "المقرئ" to "المدرس"
content = content.replace(/المقرئ/g, 'المدرس');
content = content.replace(/Reader/g, 'Teacher');
content = content.replace(/reader/g, 'teacher');

// Adding parent specific logic where necessary, though just replacing reader->teacher handles 90%.
// The generic replacement will cover most of it. We can manually fix the rest.

fs.mkdirSync(destDir, { recursive: true });
fs.writeFileSync(destPath, content);
console.log('Duplicated to Academy');
