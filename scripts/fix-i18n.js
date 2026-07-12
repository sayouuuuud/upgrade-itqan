const fs = require('fs');
const path = require('path');

const reportPath = path.join(__dirname, '..', 'arabic_hardcoded_strings.md');
const text = fs.readFileSync(reportPath, 'utf8');

const lines = text.split('\n');
const tasks = {};
let currentFile = null;

// Basic translation dictionary for common words found in admin
const translations = {
  "الكل": "All",
  "حفظ التغييرات": "Save Changes",
  "تم الحفظ": "Saved",
  "تحديث": "Refresh",
  "تحميل": "Loading",
  "رجوع": "Back",
  "معاينة": "Preview",
  "التاريخ": "Date",
  "المدير العام": "Super Admin",
  "مدير المقرأة": "Maqraa Admin",
  "مدير الأكاديمية": "Academy Admin",
  "معلم": "Teacher",
  "مقرئ": "Reciter",
  "طالب": "Student",
  "ولي أمر": "Parent",
  "مشرف طلاب": "Students Supervisor",
  "مشرف مقرئين": "Reciters Supervisor",
  "مشرف محتوى": "Content Supervisor",
  "مشرف فقه": "Fiqh Supervisor",
  "مشرف جودة": "Quality Supervisor",
  "مشرف": "Supervisor",
  "نشط": "Active",
  "غير نشط": "Inactive",
  "قيد الانتظار": "Pending",
  "مقبول": "Accepted",
  "مرفوض": "Rejected",
  "تعديل": "Edit",
  "حذف": "Delete",
  "إلغاء": "Cancel",
  "تأكيد": "Confirm",
  "ابحث...": "Search...",
  "لا توجد نتائج": "No results found",
  "حالة": "Status",
  "الاسم": "Name",
  "البريد الإلكتروني": "Email",
  "رقم الهاتف": "Phone",
  "تاريخ التسجيل": "Registration Date"
};

function translate(ar) {
  for (const [k, v] of Object.entries(translations)) {
    if (ar.includes(k)) {
      return ar.replace(k, v); // Simplistic
    }
  }
  return "Translated";
}

for (let line of lines) {
  if (line.startsWith('**File:**')) {
    const match = line.match(/\[(.*?)\]/);
    if (match) {
      currentFile = match[1].replace(/\\/g, '/');
      if (!tasks[currentFile]) tasks[currentFile] = [];
    }
  } else if (line.startsWith('**Line ')) {
    const match = line.match(/\*\*Line (\d+):\*\* `(.*)`/);
    if (match) {
      const lineNum = parseInt(match[1]);
      const content = match[2];
      const arMatch = content.match(/[\u0600-\u06FF\s]+/);
      if (arMatch) {
        const arabic = arMatch[0].trim();
        if (arabic) {
          tasks[currentFile].push({ lineNum, content, arabic });
        }
      }
    }
  }
}

let modifiedFiles = 0;

for (const [filePath, items] of Object.entries(tasks)) {
  if (!fs.existsSync(filePath)) continue;
  
  let fileLines = fs.readFileSync(filePath, 'utf8').split('\n');
  let needsHook = false;
  
  for (const item of items) {
    const idx = item.lineNum - 1;
    if (idx >= fileLines.length) continue;
    
    let originalLine = fileLines[idx];
    if (originalLine.includes('isAr ?') || originalLine.includes('isAr?')) continue;
    
    const ar = item.arabic;
    const en = translate(ar);
    let newLine = originalLine;
    
    if (newLine.includes(`>{"${ar}"}<`)) {
      newLine = newLine.replace(`>{"${ar}"}<`, `>{isAr ? "${ar}" : "${en}"}<`);
    } else if (newLine.includes(`>${ar}<`)) {
      newLine = newLine.replace(`>${ar}<`, `>{isAr ? "${ar}" : "${en}"}<`);
    } else if (newLine.includes(`="${ar}"`)) {
      newLine = newLine.replace(`="${ar}"`, `={isAr ? "${ar}" : "${en}"}`);
    } else if (newLine.includes(`: "${ar}"`)) {
      newLine = newLine.replace(`: "${ar}"`, `: isAr ? "${ar}" : "${en}"`);
    } else if (newLine.includes(`"${ar}"`)) {
      newLine = newLine.replace(`"${ar}"`, `isAr ? "${ar}" : "${en}"`);
    } else if (newLine.includes(`'${ar}'`)) {
      newLine = newLine.replace(`'${ar}'`, `isAr ? "${ar}" : "${en}"`);
    } else if (newLine.includes(ar)) {
      // safe fallback for free text inside tags if it contains tags itself
      if (!newLine.includes('<') || !newLine.includes('>')) {
        newLine = newLine.replace(ar, `{isAr ? "${ar}" : "${en}"}`);
      }
    }
    
    if (newLine !== originalLine) {
      fileLines[idx] = newLine;
      needsHook = true;
    }
  }
  
  if (needsHook) {
    // Inject hook logic
    const hasUseI18nImport = fileLines.some(l => l.includes('useI18n'));
    if (!hasUseI18nImport) {
      let lastImport = 0;
      for (let i = 0; i < fileLines.length; i++) {
        if (fileLines[i].startsWith('import ')) lastImport = i;
      }
      fileLines.splice(lastImport + 1, 0, 'import { useI18n } from "@/lib/i18n/context";');
    }
    
    const hasConstT = fileLines.some(l => l.includes('const { t } =') || l.includes('const { t,') || l.includes('const {t}'));
    if (!hasConstT) {
      for (let i = 0; i < fileLines.length; i++) {
        if ((fileLines[i].includes('export default function') || fileLines[i].includes('export function')) && fileLines[i].includes('{')) {
          fileLines.splice(i + 1, 0, '  const { t } = useI18n();\n  const isAr = t.locale === "ar";');
          break;
        }
      }
    } else {
      // It has const t, check if it has isAr
      const hasIsAr = fileLines.some(l => l.includes('const isAr ='));
      if (!hasIsAr) {
        for (let i = 0; i < fileLines.length; i++) {
          if (fileLines[i].includes('const { t } =') || fileLines[i].includes('const { t,')) {
            fileLines.splice(i + 1, 0, '  const isAr = t.locale === "ar";');
            break;
          }
        }
      }
    }
    
    fs.writeFileSync(filePath, fileLines.join('\n'));
    modifiedFiles++;
  }
}

console.log(`Modified ${modifiedFiles} files.`);
