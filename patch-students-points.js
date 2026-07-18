const fs = require('fs');

function patchStudents() {
  const path = 'app/academy/admin/students/page.tsx';
  let c = fs.readFileSync(path, 'utf8');
  
  c = c.replace(/\{language === 'ar' \? 'مسجلين في الأكاديمية' : 'registered in the academy'\}/g, '{a.studentsList?.registeredInAcademy}');
  c = c.replace(/\{language === 'ar' \? 'من الإجمالي' : 'of total'\}/g, '{a.studentsList?.ofTotal}');
  c = c.replace(/\{language === 'ar' \? 'نشطين حالياً' : 'currently active'\}/g, '{a.studentsList?.currentlyActive}');
  c = c.replace(/\{language === 'ar' \? 'دورة لكل طالب' : 'courses per student'\}/g, '{a.studentsList?.coursesPerStudent}');
  c = c.replace(/\{language === 'ar' \? 'الكل' : 'All'\}/g, '{a.studentsList?.all}');
  c = c.replace(/\{searchQuery \? \(language === 'ar' \? 'حاول استخدام كلمات بحث مختلفة أو تغيير الفلاتر\.' : 'Try using different search terms or changing filters\.'\) : \(language === 'ar' \? 'لم يتم تسجيل أي طلاب في الأكاديمية حتى الآن\.' : 'No students have registered in the academy yet\.'\)\}/g, '{searchQuery ? a.studentsList?.searchNoResults : a.studentsList?.noStudentsYet}');
  c = c.replace(/\{language === 'ar' \? 'إجراءات' : 'Actions'\}/g, '{a.studentsList?.actions}');
  c = c.replace(/\{language === 'ar' \? 'نشط' : 'Active'\}/g, '{a.studentsList?.active}');
  c = c.replace(/\{language === 'ar' \? 'إجمالي' : 'Total'\}/g, '{a.studentsList?.total}');
  c = c.replace(/\{language === 'ar' \? 'تعديل البيانات' : 'Edit Info'\}/g, '{a.studentsList?.editInfo}');
  c = c.replace(/\{language === 'ar' \? 'يعرض' : 'Showing'\}/g, '{a.studentsList?.showing}');
  c = c.replace(/\{language === 'ar' \? 'من' : 'of'\}/g, '{a.studentsList?.of}');
  c = c.replace(/\{language === 'ar' \? 'طالب' : 'students'\}/g, '{a.studentsList?.studentsCount}');
  c = c.replace(/\{language === 'ar' \? 'تعديل بيانات الطالب' : 'Edit Student Info'\}/g, '{a.studentsList?.editStudentInfo}');
  
  fs.writeFileSync(path, c);
}

function patchPoints() {
  const path = 'app/academy/admin/points/page.tsx';
  let c = fs.readFileSync(path, 'utf8');
  
  c = c.replace(/\(isAr \? 'السابق' : 'Previous'\)/g, '(a.points?.previous || "Previous")');
  c = c.replace(/\(isAr \? 'خطأ' : 'Error'\)/g, '(a.points?.error || "Error")');
  
  fs.writeFileSync(path, c);
}

patchStudents();
patchPoints();
console.log("Patched!");
