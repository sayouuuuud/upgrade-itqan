"use client"

import { UserPlus, Mail, Link as LinkIcon, Copy } from 'lucide-react'

export default function TeacherCreateStudentsPage() {
    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <UserPlus className="w-6 h-6 text-blue-500" />
                    إضافة طلاب جدد
                </h1>
                <p className="text-sm text-muted-foreground mt-1">دعوة وإضافة الطلاب إلى دوراتك أو حلقاتك</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                {/* Share Link */}
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                        <LinkIcon className="w-5 h-5 text-muted-foreground" />
                        رابط الانضمام المباشر
                    </h3>
                    <div className="flex gap-2">
                        <input type="text" readOnly value="https://itqan.academy/join/teacher-xyz123" className="w-full p-3 bg-secondary/20 border border-border border-l-0 rounded-r-lg text-left text-sm text-muted-foreground" dir="ltr" />
                        <button className="px-4 bg-secondary border border-border border-r-0 rounded-l-lg hover:bg-secondary/80 flex items-center justify-center text-muted-foreground">
                            <Copy className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">شارك هذا الرابط مع طلابك ليسجلوا مباشرة تحت إشرافك.</p>
                </div>

                <hr className="border-border" />

                {/* Email Invite */}
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        دعوة عبر البريد الإلكتروني
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">البريد الإلكتروني للطلاب (مفصول بفواصل)</label>
                            <textarea className="w-full p-3 bg-secondary/20 border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-blue-500 h-24" placeholder="student1@example.com, student2@example.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">دورة / حلقة مستهدفة (إختياري)</label>
                            <select className="w-full p-3 bg-secondary/20 border border-border rounded-lg text-sm text-foreground">
                                <option value="">بدون تحديد</option>
                                <option value="course_1">التجويد الميسر</option>
                                <option value="halaqa_1">حلقة الصحابة</option>
                            </select>
                        </div>
                        <button className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold flex items-center justify-center gap-2">
                            <Mail className="w-4 h-4" />
                            إرسال الدعوات
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
