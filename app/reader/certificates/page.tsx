"use client";
import React, { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useI18n } from "@/lib/i18n/context";
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Loader2,
  Download,
  AlertCircle,
  Award,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ReaderCertificatesPage() {
    
  const { t } = useI18n()
  const { locale } = useI18n();
  const isAr = locale === "ar";

  const { data, error, mutate, isLoading } = useSWR(
    "/api/reader/certificates/requests",
    fetcher,
  );
  const [filter, setFilter] = useState("all");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const requests: any[] = data?.requests || [];

  const filteredRequests = requests.filter((req: any) => {
    if (filter === "all") return true;
    if (filter === "approved")
      return req.status === "approved" || req.status === "issued";
    return req.status === filter;
  });

  const handleApprove = async (id: string) => {
    setIsProcessing(id);
    try {
      const res = await fetch(`/api/reader/certificates/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || (''));
      toast.success('');
      mutate();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      toast.error('');
      return;
    }
    setIsProcessing(id);
    try {
      const res = await fetch(`/api/reader/certificates/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason: rejectReason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || (''));
      toast.success('');
      setRejectingId(null);
      setRejectReason("");
      mutate();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50/50 dark:bg-[#0A0A0A] p-6 md:p-12 font-sans"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
              <Award className="w-4 h-4" />
              <span>{''}</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {''}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl">
              {''}
            </p>
          </div>

          {/* Summary chips */}
          {data && !isLoading && (
            <div className="flex flex-wrap gap-3">
              {(data.counts?.submitted ?? 0) > 0 && (
                <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-full px-4 py-2 text-sm font-semibold">
                  <Clock className="w-4 h-4" />
                  <span>{data.counts.submitted} {''}</span>
                </div>
              )}
              {((data.counts?.approved ?? 0) + (data.counts?.issued ?? 0)) >
                0 && (
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-full px-4 py-2 text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {(data.counts?.approved ?? 0) + (data.counts?.issued ?? 0)}{" "}
                    {''}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 pb-4 border-b border-border">
          <FilterTab
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label={''}
            count={requests.length}
          />
          <FilterTab
            active={filter === "submitted"}
            onClick={() => setFilter("submitted")}
            label={''}
            count={data?.counts?.submitted || 0}
            color="text-amber-500"
          />
          <FilterTab
            active={filter === "approved"}
            onClick={() => setFilter("approved")}
            label={''}
            count={
              (data?.counts?.approved || 0) + (data?.counts?.issued || 0)
            }
            color="text-emerald-500"
          />
          <FilterTab
            active={filter === "rejected"}
            onClick={() => setFilter("rejected")}
            label={''}
            count={data?.counts?.rejected || 0}
            color="text-rose-500"
          />
          <FilterTab
            active={filter === "data_required"}
            onClick={() => setFilter("data_required")}
            label={''}
            count={data?.counts?.data_required || 0}
            color="text-slate-400"
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <CertificatesSkeleton />
        ) : error ? (
          <div className="text-center py-20 text-rose-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p>{''}</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center py-24 gap-4 text-slate-400">
            <BookOpen className="w-14 h-14 opacity-20" />
            <p className="text-lg font-medium">{''}</p>
            <p className="text-sm text-center max-w-sm">
              {''}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {filteredRequests.map((req: any) => (
                <RequestCard
                  key={req.id}
                  req={req}
                  isProcessing={isProcessing === req.id}
                  rejectingId={rejectingId}
                  setRejectingId={setRejectingId}
                  rejectReason={rejectReason}
                  setRejectReason={setRejectReason}
                  onApprove={() => handleApprove(req.id)}
                  onReject={() => handleReject(req.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FilterTab({
  active,
  onClick,
  label,
  count,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold rounded-full transition-all flex items-center gap-2 ${
        active
          ? "bg-emerald-600 text-white shadow-md shadow-emerald-200 dark:shadow-none"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
      }`}
    >
      <span>{label}</span>
      <span
        className={`px-2 py-0.5 rounded-full text-xs bg-white/20 dark:bg-black/20 ${active ? "text-white" : (color ?? "text-slate-500")}`}
      >
        {count || 0}
      </span>
    </button>
  );
}

function RequestCard({
  req,
  isProcessing,
  rejectingId,
  setRejectingId,
  rejectReason,
  setRejectReason,
  onApprove,
  onReject,
}: {
  req: any;
  isProcessing: boolean;
  rejectingId: string | null;
  setRejectingId: (id: string | null) => void;
  rejectReason: string;
  setRejectReason: (v: string) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const { locale, t } = useI18n();
  const isAr = locale === "ar";

  const isPending = req.status === "submitted";
  const isApproved = req.status === "approved" || req.status === "issued";
  const isRejected = req.status === "rejected";

  const pathTypeLabel =
    req.source_table === "tajweed_paths"
      ? ('')
      : req.source_table === "memorization_paths"
        ? ('')
        : ('');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row gap-6 md:items-center"
    >
      <div className="flex-1 space-y-4">
        {/* Student info + status */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {req.student_name}
              </h3>
              <StatusBadge status={req.status} />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {req.student_email}
            </p>
          </div>

          <p className="text-xs text-slate-400 font-medium bg-slate-50 dark:bg-white/5 px-2.5 py-1 rounded-md shrink-0">
            {req.requested_at
              ? format(new Date(req.requested_at), "d MMMM yyyy", {
                  locale: isAr ? ar : enUS,
                })
              : ""}
          </p>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-white/5 rounded-xl p-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">{pathTypeLabel}</p>
            <p className="font-medium text-sm text-slate-800 dark:text-slate-200">
              {req.path_title || req.source_label}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">
              {''}
            </p>
            <p className="font-medium text-sm text-slate-800 dark:text-slate-200">
              {req.data?.name || req.student_name}
            </p>
          </div>
          {req.data?.grade && (
            <div>
              <p className="text-xs text-slate-500 mb-1">{''}</p>
              <p className="font-medium text-sm text-slate-800 dark:text-slate-200">
                {req.data.grade}
              </p>
            </div>
          )}
          {isApproved && req.certificate_number && (
            <div>
              <p className="text-xs text-slate-500 mb-1">{''}</p>
              <p
                className="font-medium text-sm text-slate-800 dark:text-slate-200 font-mono text-left"
                dir="ltr"
              >
                {req.certificate_number}
              </p>
            </div>
          )}
        </div>

        {isRejected && req.rejection_reason && (
          <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              <strong>{''}</strong> {req.rejection_reason}
            </p>
          </div>
        )}
      </div>

      {/* Action panel — pending */}
      {isPending && (
        <div className="flex flex-col gap-3 min-w-[200px] border-t md:border-t-0 md:border-r border-slate-100 dark:border-white/10 pt-4 md:pt-0 md:pr-6">
          {rejectingId === req.id ? (
            <div className="space-y-3">
              <input
                type="text"
                placeholder={''}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full text-sm bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-rose-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={onReject}
                  disabled={isProcessing}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {''}
                </button>
                <button
                  onClick={() => setRejectingId(null)}
                  disabled={isProcessing}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 text-xs font-bold py-2 rounded-lg transition-colors"
                >
                  {''}
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={onApprove}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                {''}
              </button>
              <button
                onClick={() => setRejectingId(req.id)}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 bg-white dark:bg-[#111] hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 border border-rose-200 dark:border-rose-500/30 font-bold py-2.5 rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                <XCircle className="w-5 h-5" />
                {''}
              </button>
            </>
          )}
        </div>
      )}

      {/* Action panel — issued */}
      {isApproved && req.pdf_url && (
        <div className="flex flex-col gap-3 min-w-[200px] border-t md:border-t-0 md:border-r border-slate-100 dark:border-white/10 pt-4 md:pt-0 md:pr-6">
          <a
            href={req.pdf_url}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 font-bold py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            {''}
          </a>
        </div>
      )}
    </motion.div>
  );
}

function CertificatesSkeleton() {
  const { locale, t } = useI18n();
  const isAr = locale === "ar";
  return (
    <div className="grid gap-4" aria-busy="true" aria-label={''}>
      {/* Filter tabs skeleton */}
      <div className="flex gap-2 pb-4 border-b border-border">
        {[80, 130, 110, 90, 150].map((w, i) => (
          <div
            key={i}
            className="h-9 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse"
            style={{ width: w }}
          />
        ))}
      </div>

      {/* Card skeletons */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row gap-6"
        >
          {/* Left: info */}
          <div className="flex-1 space-y-4">
            {/* Name + badge row */}
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-36 rounded-lg bg-slate-200 dark:bg-white/10 animate-pulse" />
                  <div className="h-5 w-20 rounded-md bg-slate-200 dark:bg-white/10 animate-pulse" />
                </div>
                <div className="h-4 w-48 rounded-lg bg-slate-100 dark:bg-white/5 animate-pulse" />
              </div>
              <div className="h-7 w-24 rounded-md bg-slate-100 dark:bg-white/5 animate-pulse" />
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-white/5 rounded-xl p-4">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="space-y-1.5">
                  <div className="h-3 w-16 rounded bg-slate-200 dark:bg-white/10 animate-pulse" />
                  <div className="h-4 w-24 rounded bg-slate-200 dark:bg-white/10 animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Right: action buttons */}
          <div className="flex flex-col gap-3 min-w-[200px] border-t md:border-t-0 md:border-r border-slate-100 dark:border-white/10 pt-4 md:pt-0 md:pr-6">
            <div className="h-11 w-full rounded-xl bg-slate-200 dark:bg-white/10 animate-pulse" />
            <div className="h-11 w-full rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { locale } = useI18n();
  const isAr = locale === "ar";
  switch (status) {
    case "submitted":
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-2 py-0.5 rounded-md">
          <Clock className="w-3 h-3" /> {''}
        </span>
      );
    case "approved":
    case "issued":
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-0.5 rounded-md">
          <CheckCircle2 className="w-3 h-3" /> {''}
        </span>
      );
    case "rejected":
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 px-2 py-0.5 rounded-md">
          <XCircle className="w-3 h-3" /> {''}
        </span>
      );
    case "data_required":
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400 px-2 py-0.5 rounded-md">
          <FileText className="w-3 h-3" /> {''}
        </span>
      );
    default:
      return null;
  }
}
