'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Loader2, Edit2, Trash2, CheckCircle, GripVertical } from 'lucide-react'

export interface FiqhFormField {
  id: string
  name: string
  label_ar: string
  type: string
  options: string[] | null
  is_required: boolean
  sort_order: number
  is_active: boolean
}

interface Props {
  onClose: () => void
}

const emptyField: Partial<FiqhFormField> = {
  name: '', label_ar: '', type: 'text', options: [], is_required: false, is_active: true, sort_order: 0
}

export function FiqhFormSettingsModal({ onClose }: Props) {
  const [fields, setFields] = useState<FiqhFormField[]>([])
  const [loading, setLoading] = useState(true)
  
  const [editingField, setEditingField] = useState<Partial<FiqhFormField> | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchFields = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/academy/admin/fiqh/fields')
      if (res.ok) {
        const data = await res.json()
        setFields(data.fields || [])
      }
    } catch (e) {}
    setLoading(false)
  }

  useEffect(() => {
    fetchFields()
  }, [])

  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingField || !editingField.name || !editingField.label_ar) return
    setSaving(true)
    
    try {
      const isEdit = !!editingField.id
      const url = isEdit ? `/api/academy/admin/fiqh/fields/${editingField.id}` : '/api/academy/admin/fiqh/fields'
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingField)
      })
      if (res.ok) {
        setEditingField(null)
        fetchFields()
      } else {
        const errorData = await res.json()
        alert(errorData.error || "حدث خطأ أثناء الحفظ")
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الحقل؟ سيتم حذفه من النموذج تماماً.")) return
    try {
      const res = await fetch(`/api/academy/admin/fiqh/fields/${id}`, { method: 'DELETE' })
      if (res.ok) fetchFields()
    } catch {}
  }

  const toggleActive = async (f: FiqhFormField) => {
    try {
      const res = await fetch(`/api/academy/admin/fiqh/fields/${f.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !f.is_active })
      })
      if (res.ok) fetchFields()
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border bg-card z-10 shrink-0">
          <div>
            <h3 className="text-xl font-bold text-foreground">
              {"إعدادات نموذج الأسئلة"}</h3>
            <p className="text-sm text-muted-foreground mt-1">{"إضافة حقول مخصصة تظهر للطالب عند طرح سؤال جديد (مثل: العمر، الحالة الاجتماعية)."}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {editingField ? (
            <div className="bg-muted/30 p-5 rounded-xl border border-border mb-6">
              <h4 className="font-bold mb-4">{editingField.id ? "تعديل الحقل" : "إضافة حقل جديد"}</h4>
              <form onSubmit={handleSaveField} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">{"الاسم البرمجي (انجليزي، بدون مسافات)*"}</label>
                    <input required type="text" value={editingField.name} onChange={e => setEditingField({...editingField, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})} placeholder={"مثال: age"} className="w-full px-3 py-2 border rounded-lg bg-background text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">{"عنوان الحقل للمستخدم*"}</label>
                    <input required type="text" value={editingField.label_ar} onChange={e => setEditingField({...editingField, label_ar: e.target.value})} placeholder={"مثال: العمر"} className="w-full px-3 py-2 border rounded-lg bg-background text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">{"نوع الحقل"}</label>
                    <select value={editingField.type} onChange={e => setEditingField({...editingField, type: e.target.value, options: e.target.value === 'select' ? [] : null})} className="w-full px-3 py-2 border rounded-lg bg-background text-sm">
                      <option value="text">{"نص (Text)"}</option>
                      <option value="number">{"رقم (Number)"}</option>
                      <option value="select">{"قائمة منسدلة (Select)"}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">{"الترتيب"}</label>
                    <input type="number" value={editingField.sort_order} onChange={e => setEditingField({...editingField, sort_order: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border rounded-lg bg-background text-sm" />
                  </div>
                </div>

                {editingField.type === 'select' && (
                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">{"خيارات القائمة المنسدلة (خيار واحد في كل سطر)"}</label>
                    <textarea 
                      rows={3} 
                      value={(editingField.options || []).join('\\n')} 
                      onChange={e => setEditingField({...editingField, options: e.target.value.split('\\n').map(s=>s.trim()).filter(Boolean)})}
                      placeholder={"أعزب\\\\nمتزوج\\\\nمطلق"} 
                      className="w-full px-3 py-2 border rounded-lg bg-background text-sm resize-none" 
                    />
                  </div>
                )}

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editingField.is_required} onChange={e => setEditingField({...editingField, is_required: e.target.checked})} className="accent-teal-600 w-4 h-4" />
                    <span className="text-sm font-medium">{"حقل إجباري"}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editingField.is_active} onChange={e => setEditingField({...editingField, is_active: e.target.checked})} className="accent-teal-600 w-4 h-4" />
                    <span className="text-sm font-medium">{"مُفعّل"}</span>
                  </label>
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-border">
                  <button type="button" onClick={() => setEditingField(null)} className="px-4 py-2 border rounded-lg font-bold text-sm">{"إلغاء"}</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 bg-teal-600 text-white rounded-lg font-bold flex items-center gap-2 text-sm disabled:opacity-50">
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {"حفظ الحقل"}</button>
                </div>
              </form>
            </div>
          ) : (
            <div className="mb-4">
              <button onClick={() => setEditingField(emptyField)} className="flex items-center gap-2 px-4 py-2 bg-teal-600/10 text-teal-600 hover:bg-teal-600/20 rounded-lg font-bold text-sm transition-colors">
                <Plus className="w-4 h-4" />
                {"إضافة حقل جديد"}</button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-teal-500" /></div>
          ) : fields.length === 0 ? (
            <div className="text-center p-8 border border-dashed rounded-xl text-muted-foreground">
              {"لا توجد حقول مخصصة حتى الآن."}</div>
          ) : (
            <div className="space-y-2">
              {fields.map(f => (
                <div key={f.id} className={`flex items-center justify-between p-3 border rounded-xl ${!f.is_active ? 'opacity-60 bg-muted/20' : 'bg-card'}`}>
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{f.label_ar}</span>
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">{f.name}</span>
                        {f.is_required && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">{"مطلوب"}</span>}
                        <span className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded">{f.type === 'select' ? "قائمة" : f.type === 'number' ? "رقم" : "نص"}</span>
                      </div>
                      {f.type === 'select' && f.options && (
                        <p className="text-xs text-muted-foreground mt-1 truncate max-w-sm">
                          {f.options.join(" ، ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleActive(f)} title={f.is_active ? "تعطيل" : "تفعيل"} className={`p-2 rounded-lg ${f.is_active ? 'text-green-600 hover:bg-green-50' : 'text-muted-foreground hover:bg-muted'}`}>
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingField(f)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(f.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
