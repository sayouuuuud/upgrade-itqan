const fs = require('fs');
const path = require('path');

const excludeDirs = ['node_modules', '.git', '.next', 'public', 'locales', 'scripts'];
const excludeFiles = ['ar.ts', 'en.ts', 'find-arabic.js'];

const arabicRegex = /[\u0600-\u06FF]+/;

function scanDir(dir, results) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!excludeDirs.includes(file)) {
        scanDir(fullPath, results);
      }
    } else {
      if (
        (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) &&
        !excludeFiles.includes(file)
      ) {
        checkFile(fullPath, results);
      }
    }
  }
}

function checkFile(filePath, results) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Ignore comments
    if (line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
      continue;
    }
    
    // Ignore console.log
    if (line.includes('console.log')) {
        continue;
    }

    if (arabicRegex.test(line)) {
      results.push({ file: filePath, line: i + 1, content: line });
    }
  }
}

const targetDirs = ['app/admin', 'components/admin', 'components/dashboard-shell.tsx', 'lib/admin', 'app/community/academy/admin'];
const results = [];

for (const dir of targetDirs) {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath, results);
      } else {
        checkFile(fullPath, results);
      }
  }
}

let output = '# Hardcoded Arabic Strings in Admin Section\n\n';
if (results.length === 0) {
    output += 'No hardcoded Arabic strings found!';
} else {
    for (const result of results) {
        output += `**File:** [${result.file}](file:///${result.file.replace(/\\/g, '/')}#L${result.line})\n`;
        output += `**Line ${result.line}:** \`${result.content}\`\n\n`;
    }
}

const outPath = path.join(process.env.APPDATA || process.env.HOME || '', '.gemini', 'antigravity-ide', 'brain', '2ac97319-875d-44f6-81a9-2346a09d3b09', 'arabic_hardcoded_strings.md');
fs.writeFileSync('arabic_hardcoded_strings.md', output); // Write locally as well
console.log('Found ' + results.length + ' instances. Output written to arabic_hardcoded_strings.md');
