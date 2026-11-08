import React, { useState } from 'react';
import { History, RotateCcw, Clock, ShieldCheck, User, ArrowRight, Eye, Check } from 'lucide-react';
import {
  ThemeVersion,
  ThemeAuditLog,
  InterfaceTarget,
  themeService,
} from '../../../services/themeService';

interface ThemeHistoryViewProps {
  versions: ThemeVersion[];
  auditLogs: ThemeAuditLog[];
  currentTarget: InterfaceTarget;
  onRestoreSuccess: () => void;
  showFeedback: (msg: string, type?: 'success' | 'error') => void;
}

export const ThemeHistoryView: React.FC<ThemeHistoryViewProps> = ({
  versions,
  auditLogs,
  currentTarget,
  onRestoreSuccess,
  showFeedback,
}) => {
  const [selectedTarget, setSelectedTarget] = useState<InterfaceTarget | 'all'>(currentTarget);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'versions' | 'audit'>('versions');

  const targets = [
    { id: 'all', label: 'كافة الواجهات' },
    { id: 'website', label: 'الموقع الإلكتروني' },
    { id: 'portal', label: 'البوابة (HUB)' },
    { id: 'admin_login', label: 'تسجيل دخول الإدارة' },
    { id: 'crm_login', label: 'تسجيل دخول CRM' },
    { id: 'global', label: 'الهوية العامة' },
  ];

  const handleRestore = async (version: ThemeVersion) => {
    if (
      !window.confirm(
        `هل أنت متأكد من استعادة النسخة رقم #${version.versionNumber} لواجهة (${version.target})؟ سيتم تطبيق التعديلات فورًا.`
      )
    ) {
      return;
    }

    setRestoringId(version.id);
    try {
      await themeService.restoreVersion(version.target, version.id);
      showFeedback(`تمت استعادة النسخة #${version.versionNumber} بنجاح!`);
      onRestoreSuccess();
    } catch (err: any) {
      showFeedback(err.message || 'فشل استعادة النسخة', 'error');
    } finally {
      setRestoringId(null);
    }
  };

  const filteredVersions = versions.filter(
    (v) => selectedTarget === 'all' || v.target === selectedTarget
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base sm:text-lg font-black text-[#0B2E57] flex items-center gap-2">
            <History className="w-5 h-5 text-[#CC9048]" />
            <span>سجل النسخ السابقة والأرشيف (Theme History & Rollback)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            استعرض كافة النسخ المنشورة سابقاً مع إمكانية الرجوع الفوري لأي نسخة معتمدة بضغطة واحدة.
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('versions')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              activeTab === 'versions' ? 'bg-white text-[#004AA5] shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            النسخ المنشورة ({versions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              activeTab === 'audit' ? 'bg-white text-[#004AA5] shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            سجل العمليات الأمني ({auditLogs.length})
          </button>
        </div>
      </div>

      {activeTab === 'versions' ? (
        <div className="space-y-4">
          {/* Target Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {targets.map((tgt) => (
              <button
                key={tgt.id}
                type="button"
                onClick={() => setSelectedTarget(tgt.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedTarget === tgt.id
                    ? 'bg-[#004AA5] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tgt.label}
              </button>
            ))}
          </div>

          {/* Versions Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="p-3">النسخة</th>
                  <th className="p-3">الواجهة</th>
                  <th className="p-3">الوصف والتفاصيل</th>
                  <th className="p-3">تاريخ النشر</th>
                  <th className="p-3">الناشر</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredVersions.map((ver) => (
                  <tr key={ver.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#004AA5]">
                      v{ver.versionNumber}
                    </td>
                    <td className="p-3 font-bold text-slate-800">
                      {ver.target === 'website'
                        ? 'الموقع الإلكتروني'
                        : ver.target === 'portal'
                        ? 'البوابة الرئيسية'
                        : ver.target === 'admin_login'
                        ? 'دخول الإدارة'
                        : ver.target === 'crm_login'
                        ? 'دخول CRM'
                        : 'الهوية العامة'}
                    </td>
                    <td className="p-3 text-slate-600 max-w-xs truncate" title={ver.changeSummary}>
                      {ver.changeSummary}
                    </td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]" dir="ltr">
                      {new Date(ver.publishedAt).toLocaleString('ar-MA')}
                    </td>
                    <td className="p-3 text-slate-700 font-bold">{ver.publishedBy}</td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRestore(ver)}
                        disabled={restoringId === ver.id}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-[#81521C] border border-amber-200 font-bold text-xs inline-flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{restoringId === ver.id ? 'جاري الاستعادة...' : 'استعادة'}</span>
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredVersions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      لا توجد نسخ سابقة محفوظة لهذه الواجهة بعد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Audit Log Table */
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="p-3">الإجراء</th>
                <th className="p-3">الواجهة</th>
                <th className="p-3">المستخدم</th>
                <th className="p-3">التفاصيل</th>
                <th className="p-3">الوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70">
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        log.action === 'PUBLISH'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : log.action === 'RESTORE'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-slate-700">{log.target}</td>
                  <td className="p-3 font-bold text-slate-800">{log.actorUsername}</td>
                  <td className="p-3 text-slate-600">{log.details}</td>
                  <td className="p-3 text-slate-400 font-mono text-[11px]" dir="ltr">
                    {new Date(log.timestamp).toLocaleString('ar-MA')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
