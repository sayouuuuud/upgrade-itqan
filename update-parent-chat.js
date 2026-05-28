const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'academy', 'parent', 'messages', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update imports
content = content.replace(
  "import { Loader2, MessageSquare, Send, UserRound } from 'lucide-react'",
  "import { Loader2, MessageSquare, Send, UserRound, Shield } from 'lucide-react'\nimport { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'"
);

// 2. Update Conversation interface
content = content.replace(
  "  unread_count: number\n}",
  "  unread_count: number\n  platform?: 'academy' | 'maqraa'\n  is_ticket?: boolean\n}"
);

// 3. Add state for dialog
content = content.replace(
  "  const messagesEndRef = useRef<HTMLDivElement>(null)",
  "  const messagesEndRef = useRef<HTMLDivElement>(null)\n  const [showTicketDialog, setShowTicketDialog] = useState(false)"
);

// 4. Update fetchConversations
const oldFetch = `  async function fetchConversations() {
    const res = await fetch('/api/academy/conversations')
    const data = await res.json()
    if (res.ok) setConversations(data.conversations || [])
  }`;
const newFetch = `  async function fetchConversations() {
    const [resAca, resMaq] = await Promise.all([
      fetch('/api/academy/conversations'),
      fetch('/api/conversations')
    ])
    
    const dataAca = resAca.ok ? await resAca.json() : { conversations: [] }
    const dataMaq = resMaq.ok ? await resMaq.json() : { conversations: [] }
    
    const acaConvs = (dataAca.conversations || []).map((c: any) => ({ ...c, platform: 'academy' }))
    const maqConvs = (dataMaq.conversations || []).map((c: any) => ({ ...c, platform: 'maqraa' }))
    
    const all = [...acaConvs, ...maqConvs].sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime())
    setConversations(all)
  }`;
content = content.replace(oldFetch, newFetch);

// 5. Update fetchMessages inside useEffect
content = content.replace(
  "const res = await fetch(`/api/academy/conversations/${conversationId}/messages`)",
  "const res = await fetch(activeConv.platform === 'maqraa' ? `/api/conversations/${conversationId}/messages` : `/api/academy/conversations/${conversationId}/messages`)"
);

// 6. Update startConversation to include platform
content = content.replace(
  "unread_count: 0,",
  "unread_count: 0,\n          platform: 'academy',"
);

// 7. Update sendMessage to use platform
content = content.replace(
  "const res = await fetch(`/api/academy/conversations/${activeConv.id}/messages`, {",
  "const res = await fetch(activeConv.platform === 'maqraa' ? `/api/conversations/${activeConv.id}/messages` : `/api/academy/conversations/${activeConv.id}/messages`, {"
);

// 8. Add create ticket logic
const createTicketFn = `  async function handleCreateTicket(platform: 'maqraa' | 'academy') {
    setSending(true)
    setShowTicketDialog(false)
    try {
      const url = platform === 'maqraa' ? '/api/conversations' : '/api/academy/conversations'
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTicket: true }),
      })
      const data = await res.json()
      if (res.ok && data.conversationId) {
        await fetchConversations()
        setActiveConv({
          id: data.conversationId,
          other_user_id: 'admin',
          other_user_name: platform === 'maqraa' ? (isAr ? 'إدارة المقرأة' : 'Maqraa Support') : (isAr ? 'إدارة الأكاديمية' : 'Academy Support'),
          other_user_avatar: null,
          last_message: null,
          last_message_at: null,
          unread_count: 0,
          platform: platform,
          is_ticket: true,
        })
      }
    } finally {
      setSending(false)
    }
  }

  if (loading) {`;
content = content.replace("  if (loading) {", createTicketFn);

// 9. Update UI for the sidebar headers and button
const oldSidebarHeader = `<h3 className="font-bold text-sm text-muted-foreground">{isAr ? 'المحادثات السابقة' : 'Conversations'}</h3>`;
const newSidebarHeader = `
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <h3 className="font-bold text-sm text-muted-foreground">{isAr ? 'المحادثات السابقة' : 'Conversations'}</h3>
                <Button variant="outline" size="sm" onClick={() => setShowTicketDialog(true)} className="h-8 gap-1 rounded-xl text-blue-600 border-blue-200 hover:bg-blue-50">
                  <Shield className="w-3.5 h-3.5" />
                  {isAr ? 'تذكرة دعم' : 'Support Ticket'}
                </Button>
              </div>`;
content = content.replace(oldSidebarHeader, newSidebarHeader);

// 10. Update the conversation list rendering to show platform labels
const oldConvRender = `<div className="min-w-0">
                    <p className="font-bold text-sm truncate">{conv.other_user_name || (isAr ? 'الشيخ' : 'Teacher')}</p>
                    <p className="text-xs text-muted-foreground truncate">{conv.last_message || (isAr ? 'لا توجد رسائل بعد' : 'No messages yet')}</p>
                  </div>`;
const newConvRender = `<div className="min-w-0 text-start">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm truncate">{conv.other_user_name || (isAr ? 'الشيخ' : 'Teacher')}</p>
                      {conv.is_ticket && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold whitespace-nowrap">
                          {conv.platform === 'maqraa' ? (isAr ? 'تذكرة مقرأة' : 'Maqraa Ticket') : (isAr ? 'تذكرة أكاديمية' : 'Academy Ticket')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conv.last_message || (isAr ? 'لا توجد رسائل بعد' : 'No messages yet')}</p>
                  </div>`;
content = content.replace(oldConvRender, newConvRender);

// 11. Add the dialog to the bottom of the component
const oldReturnTail = `    </div>
  )
}`;
const newReturnTail = `
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-center">{isAr ? 'إنشاء تذكرة دعم فني' : 'Create Support Ticket'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-center text-muted-foreground font-medium">
              {isAr ? 'إلى أي إدارة تريد توجيه التذكرة؟' : 'Which administration do you want to contact?'}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={() => handleCreateTicket('maqraa')} className="h-20 flex flex-col gap-2 rounded-2xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200">
                <Shield className="w-6 h-6" />
                <span className="font-bold">{isAr ? 'إدارة المقرأة' : 'Maqraa Support'}</span>
              </Button>
              <Button onClick={() => handleCreateTicket('academy')} className="h-20 flex flex-col gap-2 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200">
                <Shield className="w-6 h-6" />
                <span className="font-bold">{isAr ? 'إدارة الأكاديمية' : 'Academy Support'}</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}`;
content = content.replace(oldReturnTail, newReturnTail);

fs.writeFileSync(filePath, content);
console.log('Updated parent chat');
