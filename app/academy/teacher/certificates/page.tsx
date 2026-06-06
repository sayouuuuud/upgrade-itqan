"use client";

import React from "react";
import { motion } from "framer-motion";
import { Award, Download, ExternalLink, Calendar, Star } from "lucide-react";

// Mock Data (Can be replaced with your actual API payload)
const CERTIFICATES = [
  {
    id: "cert-1",
    title: "مدرس معتمد - مستوى متقدم",
    issuer: "أكاديمية إتقان",
    date: "15 مايو 2026",
    grade: "امتياز",
    type: "شهادة اعتماد",
    gradient: "from-indigo-500/20 to-indigo-500/0",
    border: "group-hover:border-indigo-500/50",
    iconGlow: "text-indigo-600 dark:text-indigo-400"
  },
  {
    id: "cert-2",
    title: "دورة تجويد القرآن الكريم",
    issuer: "معهد القراءات",
    date: "10 أبريل 2025",
    grade: "جيد جداً",
    type: "دورة تدريبية",
    gradient: "from-emerald-500/20 to-emerald-500/0",
    border: "group-hover:border-emerald-500/50",
    iconGlow: "text-emerald-600 dark:text-emerald-400"
  },
  {
    id: "cert-3",
    title: "مهارات الاتصال التربوي",
    issuer: "وزارة التعليم",
    date: "05 سبتمبر 2024",
    grade: "اجتياز",
    type: "ورشة عمل",
    gradient: "from-amber-500/20 to-amber-500/0",
    border: "group-hover:border-amber-500/50",
    iconGlow: "text-amber-600 dark:text-amber-400"
  },
];

// Framer Motion Variants for Staggered Magic
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
};

export default function CertificatesPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#0A0A0A] p-6 md:p-12 font-sans selection:bg-indigo-500/30" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-medium">
              <Award className="w-4 h-4" />
              <span>إنجازاتك الأكاديمية</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white text-balance">
              شهاداتي واعتماداتي
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed text-sm md:text-base">
              تصفح وحمّل جميع شهاداتك والدورات التي اجتزتها بنجاح. هذه المساحة تعكس رحلتك المهنية وتطورك المستمر كمعلم.
            </p>
          </div>
        </motion.div>

        {/* Certificates Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {CERTIFICATES.map((cert) => (
            <motion.div
              key={cert.id}
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className={`group relative overflow-hidden bg-white dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgb(255,255,255,0.02)] transition-all duration-300 ease-out cursor-pointer ${cert.border}`}
            >
              {/* Subtle Top Glow Effect */}
              <div className={`absolute top-0 right-0 w-full h-32 bg-gradient-to-b ${cert.gradient} opacity-0 pointer-events-none transition-opacity duration-500 group-hover:opacity-100`} />
              
              <div className="p-6 relative z-10 flex flex-col h-full">
                {/* Top Bar: Icon & Type */}
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-white dark:bg-[#1A1A1A] rounded-xl border border-slate-100 dark:border-white/10 shadow-sm transition-colors duration-300 group-hover:border-transparent">
                    <Award className={`w-6 h-6 text-slate-700 dark:text-slate-300 transition-colors duration-300 ${cert.iconGlow}`} />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg">
                    {cert.type}
                  </span>
                </div>

                {/* Content */}
                <div className="space-y-1.5 mb-6 flex-grow">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight transition-colors duration-300">
                    {cert.title}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {cert.issuer}
                  </p>
                </div>

                {/* Meta Information */}
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 mb-6">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{cert.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-500" />
                    <span>{cert.grade}</span>
                  </div>
                </div>

                {/* Actions (Buttons) */}
                <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 text-sm font-semibold py-2.5 rounded-xl transition-all active:scale-[0.97]">
                    <Download className="w-4 h-4" />
                    تحميل PDF
                  </button>
                  <button className="p-2.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl transition-all active:scale-[0.97]">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
