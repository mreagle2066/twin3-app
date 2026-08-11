import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { intentTone } from "@/lib/growth";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, ShieldAlert } from "lucide-react";

export default function EscalationQueue({ onSelect }: { onSelect: (id: number) => void }) {
  const { data } = trpc.growth.conversations.list.useQuery();
  const escalated = data?.filter((conversation) => conversation.status === "escalated" || conversation.intent === "Needs Human") ?? [];
  return <section className="mt-5 overflow-hidden rounded-2xl border border-rose-300/15 bg-rose-300/[.035]"><div className="flex items-center justify-between border-b border-rose-300/10 px-5 py-4"><div className="flex items-center gap-3"><div className="flex size-8 items-center justify-center rounded-lg bg-rose-300/10 text-rose-200"><ShieldAlert className="size-4" /></div><div><h2 className="text-sm font-semibold text-rose-50">Human escalation queue</h2><p className="mt-0.5 text-xs text-slate-500">Priority threads with the full history available for review.</p></div></div><span className="mono text-[10px] text-rose-200">{escalated.length} OPEN</span></div>{escalated.length ? <div className="divide-y divide-rose-300/10">{escalated.map((conversation) => <button key={conversation.id} onClick={() => onSelect(conversation.id)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-rose-300/[.05]"><div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate text-sm font-medium text-slate-200">{conversation.contactName}</p><Badge className={`border px-2 py-0.5 text-[9px] hover:bg-transparent ${intentTone(conversation.intent)}`}>{conversation.intent}</Badge></div><p className="mt-1 truncate text-xs text-slate-500">{conversation.escalationReason || conversation.preview}</p></div><ArrowUpRight className="size-4 shrink-0 text-rose-200" /></button>)}</div> : <p className="px-5 py-6 text-xs leading-5 text-slate-500">No conversations currently require a human handoff. Escalated threads will remain here until your team reviews them.</p>}</section>;
}
