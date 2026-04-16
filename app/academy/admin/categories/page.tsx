"use client"

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newCat, setNewCat] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

  const fetchCats = async () => {
    try {
      const res = await fetch('/api/academy/admin/categories')
      if (res.ok) {
        const json = await res.json()
        setCategories(json.data || [])
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchCats() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCat.name) return
    setSaving(true)
    try {
      const res = await fetch('/api/academy/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCat)
      })
      if (res.ok) {
        setNewCat({ name: '', description: '' })
        fetchCats()
      }
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟')) return
    try {
      const res = await fetch(`/api/academy/admin/categories/${id}`, { method: 'DELETE' })
      if (res.ok) fetchCats()
      else alert('لا يمكن الحذف (قد يكون مرتبطاً بدورات)')
    } catch {}
  }

  if (loading) return <div className="p-8 text-center"><div className="animate-spin h-8 w-8 mx-auto border-4 border-blue-500 rounded-full border-t-transparent" /></div>

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
         <div>
           <h1 className="text-2xl font-bold">إدارة التصنيفات</h1>
           <p className="text-muted-foreground mt-1">أقسام الدورات في الأكاديمية</p>
         </div>
       </div>

       <div className="grid md:grid-cols-3 gap-6">
         {/* Form */}
         <div className="bg-card p-5 border border-border rounded-xl h-max">
           <h3 className="font-bold mb-4">إضافة تصنيف جديد</h3>
           <form onSubmit={handleAdd} className="space-y-4">
             <div>
               <label className="text-sm font-bold block mb-1">اسم التصنيف <span className="text-red-500">*</span></label>
               <input 
                 required type="text" value={newCat.name} onChange={e => setNewCat({...newCat, name: e.target.value})}
                 className="w-full p-2 border border-border rounded-lg bg-background"
               />
             </div>
             <div>
               <label className="text-sm font-bold block mb-1">الوصف</label>
               <textarea 
                 rows={3} value={newCat.description} onChange={e => setNewCat({...newCat, description: e.target.value})}
                 className="w-full p-2 border border-border rounded-lg bg-background"
               />
             </div>
             <button disabled={saving} className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold flex justify-center items-center gap-2">
               <Plus className="w-4 h-4"/> حفظ التصنيف
             </button>
           </form>
         </div>

         {/* List */}
         <div className="md:col-span-2 space-y-3">
           {categories.length === 0 ? (
             <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground flex flex-col items-center">لا توجد تصنيفات بعد</div>
           ) : (
             categories.map(cat => (
               <div key={cat.id} className="bg-card p-4 border border-border rounded-xl flex justify-between items-center shadow-sm">
                  <div>
                    <h4 className="font-bold text-lg">{cat.name}</h4>
                    {cat.description && <p className="text-sm text-muted-foreground mt-1">{cat.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleDelete(cat.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <Trash2 className="w-5 h-5"/>
                    </button>
                  </div>
               </div>
             ))
           )}
         </div>
       </div>
    </div>
  )
}
