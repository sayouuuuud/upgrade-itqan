const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'app', 'api', 'admin');
const destDir = path.join(__dirname, 'app', 'api', 'academy', 'admin');

function copyAndModify(src, dest) {
  if (!fs.existsSync(src)) return;
  let content = fs.readFileSync(src, 'utf8');
  
  // Replace tables
  content = content.replace(/conversations/g, 'academy_conversations');
  content = content.replace(/messages/g, 'academy_messages');
  
  // Because 'conversations' was replaced with 'academy_conversations', 'contact_messages' might also need replacing if it exists, though usually it's just 'contact_messages'
  content = content.replace(/academy_academy_conversations/g, 'academy_conversations');
  content = content.replace(/contact_messages/g, 'academy_contact_messages');
  
  // Replace roles/IDs
  content = content.replace(/reader_id/g, 'teacher_id');
  content = content.replace(/reader_name/g, 'teacher_name');
  content = content.replace(/reader_email/g, 'teacher_email');
  content = content.replace(/unread_count_reader/g, 'unread_count_teacher');
  
  // Replace allowed roles
  content = content.replace(/student_supervisor/g, 'supervisor'); // Maybe just keep admin for Academy for now
  
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content);
}

// 1. Conversations API
copyAndModify(
  path.join(srcDir, 'conversations', 'route.ts'),
  path.join(destDir, 'conversations', 'route.ts')
);

// 2. Contact Messages API (if it exists)
copyAndModify(
  path.join(srcDir, 'contact-messages', 'route.ts'),
  path.join(destDir, 'contact-messages', 'route.ts')
);

// 3. Conversation Messages API (GET messages by id) - WAIT, Maqraa has /api/admin/conversations/[id]
copyAndModify(
  path.join(srcDir, 'conversations', '[id]', 'route.ts'),
  path.join(destDir, 'conversations', '[id]', 'route.ts')
);

console.log('APIs duplicated');
