const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'academy', 'teacher', 'chat', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Shield to imports
content = content.replace(
  "import { Search, Send, User, Loader2, ArrowRight, UserPlus, X } from 'lucide-react'",
  "import { Search, Send, User, Loader2, ArrowRight, UserPlus, X, Shield } from 'lucide-react'"
);

// 2. Add is_ticket to Conversation interface
content = content.replace(
  "  unread_count: number\n}",
  "  unread_count: number\n  is_ticket?: boolean\n}"
);

// 3. Add handleCreateTicket function
const handleCreateTicketFn = `
  const handleCreateTicket = async () => {
    setCreatingConv(true)
    try {
      const res = await fetch('/api/academy/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTicket: true }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data?.error || (isAr ? 'تعذر فتح التذكرة' : 'Could not open ticket'))
        return
      }
      const newConvs = await fetchConversations()
      const found = newConvs.find((c: any) => c.id === data.conversationId)
      if (found) setActiveConv(found)
    } catch {
      // ignore
    } finally {
      setCreatingConv(false)
    }
  }

  // Fetch messages for active conversation`;
content = content.replace("  // Fetch messages for active conversation", handleCreateTicketFn);

// 4. Update the sidebar buttons
const oldButtons = `            <Button
              onClick={() => {
                setShowNewConv(true)
                if (students.length === 0) fetchStudents()
              }}
              className="w-full justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
            >
              <UserPlus className="w-4 h-4" />
              {isAr ? 'بدء محادثة جديدة' : 'New conversation'}
            </Button>`;
const newButtons = `            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShowNewConv(true)
                  if (students.length === 0) fetchStudents()
                }}
                className="flex-1 justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-2"
              >
                <UserPlus className="w-4 h-4" />
                <span className="truncate">{isAr ? 'محادثة' : 'Chat'}</span>
              </Button>
              <Button
                onClick={handleCreateTicket}
                disabled={creatingConv}
                variant="outline"
                className="flex-1 justify-center gap-2 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 px-2"
              >
                {creatingConv ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                <span className="truncate">{isAr ? 'الدعم' : 'Support'}</span>
              </Button>
            </div>`;
content = content.replace(oldButtons, newButtons);

// 5. Update header info
const oldHeader = `                <div>
                  <h3 className="font-bold text-foreground">{activeConv.other_user_name}</h3>
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 rounded-full hidden sm:inline-block">
                    {isAr ? "طالب الأكاديمية" : "Academy Student"}
                  </span>
                </div>`;
const newHeader = `                <div>
                  <h3 className="font-bold text-foreground">{activeConv.other_user_name}</h3>
                  {activeConv.is_ticket ? (
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 rounded-full hidden sm:inline-block">
                      {isAr ? "الدعم الفني" : "Support"}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 rounded-full hidden sm:inline-block">
                      {isAr ? "مستخدم" : "User"}
                    </span>
                  )}
                </div>`;
content = content.replace(oldHeader, newHeader);

fs.writeFileSync(filePath, content);
console.log('Updated teacher chat');
