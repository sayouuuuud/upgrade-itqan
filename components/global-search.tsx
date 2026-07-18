"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { Search, Loader2, User, BookOpen, MessageSquare, Mic, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function GlobalSearch({ role }: { role: 'admin' | 'reader' }) {
    const { t } = useI18n()
  const app = (t as any).app as Record<string, string> | undefined
    const isAr = t.locale === "ar"
    const router = useRouter()
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
        const fetchResults = async () => {
            if (query.length < 2) {
                setResults([])
                return
            }
            setLoading(true)
            try {
                const res = await fetch(`/api/${role}/search?q=${encodeURIComponent(query)}`)
                if (res.ok) {
                    const data = await res.json()
                    setResults(role === 'admin' ? data.users : data.students)
                }
            } catch (err) {
                console.error("Search error:", err)
            } finally {
                setLoading(false)
            }
        }

        const timer = setTimeout(fetchResults, 300)
        return () => clearTimeout(timer)
    }, [query, role])

    const handleSelect = (item: any) => {
        setIsOpen(false)
        setQuery("")
        if (role === 'admin') {
            router.push(`/admin/users/${item.id}`)
        } else {
            // Options for reader: direct to recitations or chat? 
            // User requested link to chat or student recitation. 
            // Default to student recitation list for the reader.
            router.push(`/reader/recitations?studentId=${item.id}`)
        }
    }

    return (
        <div className="relative w-full max-w-md" ref={wrapperRef}>
            <div className="relative group">
                <Search className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                    isOpen ? "text-primary" : "text-muted-foreground"
                )} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setIsOpen(true)
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={role === 'admin' ? (isAr ? "ابحث عن طالب أو مقرئ..." : "Search users...") : (isAr ? "ابحث عن طالب..." : "Search students...")}
                    className="w-full bg-muted/50 border border-border rounded-xl py-2.5 pr-10 pl-4 text-sm text-foreground focus:ring-4 focus:ring-primary/5 focus:border-primary placeholder:text-muted-foreground shadow-sm transition-all outline-none"
                />
                {loading && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                )}
            </div>

            {isOpen && query.length >= 2 && (
                <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-[400px] overflow-y-auto">
                        {results.length > 0 ? (
                            <div className="p-2 space-y-1">
                                {results.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleSelect(item)}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 rounded-xl transition-all group text-right"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            {item.avatar_url ? (
                                                <img src={item.avatar_url} className="w-full h-full object-cover rounded-lg" />
                                            ) : (
                                                <User className="w-5 h-5 text-primary" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-foreground text-sm truncate">{item.name}</p>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                {role === 'admin' ? (
                                                    <>
                                                        <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                                            <Mic className="w-3 h-3" /> {item.total_recitations} {isAr ? "تلاوة" : "Recs"}
                                                        </span>
                                                        <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                                            <BookOpen className="w-3 h-3" /> {item.total_sessions} {isAr ? "جلسة" : "Sess"}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        {item.last_recitation_at ? (
                                                            <span className="text-[10px] font-medium text-primary flex items-center gap-1">
                                                                {isAr ? "آخر تلاوة:" : "Last Rec:"} {new Date(item.last_recitation_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-medium text-muted-foreground">{isAr ? "لا توجد تلاوات" : "No recitations"}</span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ArrowUpRight className="w-4 h-4 text-primary" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : !loading ? (
                            <div className="p-8 text-center">
                                <p className="text-sm text-muted-foreground">{isAr ? "لا توجد نتائج مطابقة" : "No results found"}</p>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    )
}
