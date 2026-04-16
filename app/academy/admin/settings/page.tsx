"use client"

import { Settings, Save, Globe, Mail, Bell } from 'lucide-react'

export default function AdminSettingsPage() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Settings className="w-6 h-6 text-blue-500" />
                    إعدادات النظام
                </h1>
                <p className="text-sm text-muted-foreground mt-1">تكوين إعدادات منصة الأكاديمية</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 space-y-8">
                {/* General Settings */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold flex items-center gap-2 border-b border-border pb-2">
                        <Globe className="w-5 h-5 text-muted-foreground" /> الإعدادات العامة
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">اسم الأكاديمية</label>
                            <input type="text" defaultValue="أكاديمية إتقان" className="w-full p-2 bg-secondary/20 border border-border rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">اللغة الافتراضية</label>
                            <select className="w-full p-2 bg-secondary/20 border border-border rounded-lg">
                                <option>العربية</option>
                                <option>English</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Email & Notifications */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold flex items-center gap-2 border-b border-border pb-2">
                        <Bell className="w-5 h-5 text-muted-foreground" /> الإشعارات والتواصل
                    </h2>
                    <div className="space-y-3">
                        <label className="flex items-center gap-3">
                            <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded border-border" />
                            <span className="text-sm">إرسال إشعارات التسجيل الجديد للمسؤولين</span>
                        </label>
                        <label className="flex items-center gap-3">
                            <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded border-border" />
                            <span className="text-sm">السماح بإشعارات البريد لتذكيرات المهام</span>
                        </label>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        <Save className="w-4 h-4" /> حفظ الإعدادات
                    </button>
                </div>
            </div>
        </div>
    )
}
