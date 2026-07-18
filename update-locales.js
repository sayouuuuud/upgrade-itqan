const fs = require('fs');

function updateLocales() {
  const arPath = 'lib/i18n/locales/ar.ts';
  const enPath = 'lib/i18n/locales/en.ts';
  
  const arKeys = `
    studentsList: {
      registeredInAcademy: 'مسجلين في الأكاديمية',
      ofTotal: 'من الإجمالي',
      currentlyActive: 'نشطين حالياً',
      coursesPerStudent: 'دورة لكل طالب',
      all: 'الكل',
      searchNoResults: 'حاول استخدام كلمات بحث مختلفة أو تغيير الفلاتر.',
      noStudentsYet: 'لم يتم تسجيل أي طلاب في الأكاديمية حتى الآن.',
      actions: 'إجراءات',
      active: 'نشط',
      total: 'إجمالي',
      editInfo: 'تعديل البيانات',
      showing: 'يعرض',
      of: 'من',
      studentsCount: 'طالب',
      editStudentInfo: 'تعديل بيانات الطالب',
    },
    points: {
      previous: 'السابق',
      error: 'خطأ',
    },
`;

  const enKeys = `
    studentsList: {
      registeredInAcademy: 'registered in the academy',
      ofTotal: 'of total',
      currentlyActive: 'currently active',
      coursesPerStudent: 'courses per student',
      all: 'All',
      searchNoResults: 'Try using different search terms or changing filters.',
      noStudentsYet: 'No students have registered in the academy yet.',
      actions: 'Actions',
      active: 'Active',
      total: 'Total',
      editInfo: 'Edit Info',
      showing: 'Showing',
      of: 'of',
      studentsCount: 'students',
      editStudentInfo: 'Edit Student Info',
    },
    points: {
      previous: 'Previous',
      error: 'Error',
    },
`;

  let arContent = fs.readFileSync(arPath, 'utf8');
  arContent = arContent.replace(/academyAdmin: \{/, "academyAdmin: {" + arKeys);
  fs.writeFileSync(arPath, arContent);

  let enContent = fs.readFileSync(enPath, 'utf8');
  enContent = enContent.replace(/academyAdmin: \{/, "academyAdmin: {" + enKeys);
  fs.writeFileSync(enPath, enContent);
  
  console.log("Locales updated!");
}

updateLocales();
