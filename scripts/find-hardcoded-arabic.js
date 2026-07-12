const fs = require('fs');
const path = require('path');

const excludeDirs = ['node_modules', '.git', '.next', 'public', 'locales', 'scripts'];
const excludeFiles = ['ar.ts', 'en.ts'];

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
    
    // Skip entirely if it doesn't have Arabic
    if (!arabicRegex.test(line)) continue;

    // Ignore comments
    if (line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) continue;
    
    // Ignore console.log
    if (line.includes('console.log')) continue;

    // Ignore if it uses `tr(`
    if (line.includes('tr(')) continue;

    // Ignore ternary translations: isAr ? '...' : '...'
    if (line.includes('?') && line.includes(':') && (line.includes('isAr') || line.includes('locale'))) continue;

    // If we reach here, it's likely a true hardcoded Arabic string without translation!
    results.push({ file: filePath, line: i + 1, content: line });
  }
}

const targetDirs = ['app/admin', 'components/admin'];
const results = [];

for (const dir of targetDirs) {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
      scanDir(fullPath, results);
  }
}

let output = '# Unhandled Arabic Strings in Admin Section\n\n';
if (results.length === 0) {
    output += 'No unhandled Arabic strings found!';
} else {
    for (const result of results) {
        output += `**File:** [${result.file}](file:///${result.file.replace(/\\/g, '/')}#L${result.line})\n`;
        output += `**Line ${result.line}:** \`${result.content}\`\n\n`;
    }
}

fs.writeFileSync('arabic_hardcoded_strings.md', output);
console.log('Found ' + results.length + ' instances. Output written to arabic_hardcoded_strings.md');
