import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')

// Files to fix with their target translation keys
const FILES_TO_FIX = [
  { path: 'app/reader/memorization-paths/page.tsx', keyPrefix: 'pages.readerMemPaths' },
  { path: 'app/academy/teacher/tasks/new/page.tsx', keyPrefix: 'pages.teacherTasksNew' },
  { path: 'app/academy/teacher/paths/page.tsx', keyPrefix: 'pages.teacherPaths' },
  { path: 'app/reader/learning-paths/page.tsx', keyPrefix: 'pages.readerLearningPaths' },
  { path: 'app/academy/pending/page.tsx', keyPrefix: 'pages.academyPending' },
  { path: '(public)/sitemap-page/page.tsx', keyPrefix: 'pages.sitemap' },
  { path: 'app/academy/supervisor/teachers/page.tsx', keyPrefix: 'pages.supervisorTeachers' },
  { path: 'app/student/profile/page.tsx', keyPrefix: 'pages.studentProfile' },
  { path: 'app/reader/certificates/page.tsx', keyPrefix: 'pages.readerCertificates' },
  { path: 'app/academy/teacher/courses/page.tsx', keyPrefix: 'pages.teacherCourses' },
  { path: 'app/academy/teacher/courses/new/page.tsx', keyPrefix: 'pages.teacherCoursesNew' },
  { path: 'app/(auth)/register/components/TeacherForm.tsx', keyPrefix: 'pages.teacherRegister' },
]

// Extract Arabic strings from file
function extractArabicStrings(content) {
  const arabicRegex = /(['"`])([^\1]*?[\u0600-\u06FF]+[^\1]*?)\1/g
  const strings = new Set()
  
  let match
  while ((match = arabicRegex.exec(content)) !== null) {
    const str = match[2].trim()
    if (str.length > 0 && !str.includes('$')) {
      strings.add(str)
    }
  }
  
  return Array.from(strings)
}

// Main process
async function main() {
  console.log('🔍 Extracting Arabic strings from pages...\n')
  
  const allTranslations = {
    ar: {},
    en: {}
  }
  
  for (const file of FILES_TO_FIX) {
    const filePath = path.join(projectRoot, 'app', file.path)
    
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${file.path}`)
      continue
    }
    
    const content = fs.readFileSync(filePath, 'utf-8')
    const arabicStrings = extractArabicStrings(content)
    
    console.log(`📄 ${file.path}`)
    console.log(`   Found: ${arabicStrings.length} strings\n`)
    
    // Create translation keys
    for (let i = 0; i < arabicStrings.length; i++) {
      const key = `${file.keyPrefix}.str${i}`
      allTranslations.ar[key] = arabicStrings[i]
      allTranslations.en[key] = `[EN: ${arabicStrings[i].substring(0, 30)}...]` // Placeholder
    }
  }
  
  console.log(`\n✅ Total strings found: ${Object.keys(allTranslations.ar).length}`)
  console.log('Now manually add English translations to the script output.')
}

main().catch(console.error)
