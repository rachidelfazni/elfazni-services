import React from 'react';
import {
  Palette,
  Globe,
  Layers,
  Lock,
  Users,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import {
  InterfaceTarget,
  InterfaceThemeConfig,
  ThemeColors,
} from '../../../services/themeService';
import { BrandLogo } from '../../common/BrandLogo';

interface ThemeOverviewViewProps {
  published: Record<InterfaceTarget, InterfaceThemeConfig>;
  globalBrand?: {
    brandNameEn: string;
    brandNameAr: string;
    colors: ThemeColors;
  };
  onSelectInterface: (target: InterfaceTarget) => void;
}

export const ThemeOverviewView: React.FC<ThemeOverviewViewProps> = ({
  published,
  globalBrand,
  onSelectInterface,
}) => {
  const interfaces: Array<{
    id: InterfaceTarget;
    title: string;
    desc: string;
    icon: any;
    route: string;
  }> = [
    {
      id: 'website',
      title: 'مظهر الموقع الإلكتروني (Main Website)',
      desc: 'الواجهة الرئيسية العامة للعملاء وزوار الموقع وحجوزات الطيران والفنادق والمواعيد.',
      icon: Globe,
      route: '/',
    },
    {
      id: 'portal',
      title: 'بوابة الوصول الموحدة (HUB & Workspace)',
      desc: 'بوابة التحويل المركزية ومساحة العمل للوصول السريع إلى الموقع، CRM، ولوحة الإدارة (/hub و /workspace).',
      icon: Layers,
      route: '/hub',
    },
    {
      id: 'admin_login',
      title: 'مظهر تسجيل دخول الإدارة (Portal Login)',
      desc: 'شاشة تسجيل الدخول الآمنة الخاصة بإدارة ومحرري موقع الفزني للخدمات.',
      icon: Lock,
      route: '/portal/login',
    },
    {
      id: 'crm_login',
      title: 'مظهر تسجيل دخول CRM (CRM Login)',
      desc: 'شاشة تسجيل الدخول المستقلة الخاصة بموظفي وعمليات نظام إدارة العملاء.',
      icon: Users,
      route: '/portal/login?next=crm',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Global Identity Card */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0E4B87] via-[#0B2E57] to-[#0E4B87] text-white p-6 sm:p-8 shadow-xl border border-blue-900/40 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl text-right">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#CC9048] border border-[#CC9048]/30 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>نظام إدارة المظهر والهوية البصرية المتقدم</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            الهوية البصرية الموحدة لمؤسسة ELFAZNI SERVICES
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            تحكم كامل في مظهر الموقع، البوابة، وشاشات تسجيل الدخول دون الحاجة لتعديل الأكواد البرمجية، مع الحفاظ الكامل على الألوان الرسمية المعتمدة والتوافق مع Bahij.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onSelectInterface('global')}
              className="px-4 py-2 rounded-xl bg-[#CC9048] hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
            >
              تعديل توكنات الهوية العامة
            </button>
          </div>
        </div>

        <div className="p-4 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-xs flex flex-col items-center gap-3">
          <BrandLogo background="blue" orientation="horizontal" size="lg" className="h-12 w-auto" />
          <div className="flex items-center gap-2 pt-1">
            <div className="w-5 h-5 rounded-full bg-[#004AA5] border border-white/50" title="الأزرق الملكي #004AA5" />
            <div className="w-5 h-5 rounded-full bg-[#CC9048] border border-white/50" title="الذهب الرسمي #CC9048" />
            <div className="w-5 h-5 rounded-full bg-[#FFFFFF] border border-white/50" title="الأبيض المحايد #FFFFFF" />
            <div className="w-5 h-5 rounded-full bg-[#0B2E57] border border-white/50" title="الكحلي المساند #0B2E57" />
          </div>
        </div>
      </div>

      {/* Grid of the 4 Interface Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {interfaces.map((item) => {
          const Icon = item.icon;
          const conf = published[item.id];
          const colors = conf?.colors || {};

          return (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#004AA5] border border-blue-100 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>منشور (v{conf?.version || 1})</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-black text-[#0B2E57]">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                </div>

                {/* Status & Swatches */}
                <div className="pt-2 flex items-center justify-between text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold block">الوراثة العامة:</span>
                    <span className="font-bold text-slate-700 text-xs">
                      {conf?.inheritBrandColors !== false ? 'وراثة تلقائية ✓' : 'تخصيص مستقل'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-5 h-5 rounded-md border border-slate-300 shadow-xs"
                      style={{ backgroundColor: colors.primary || '#004AA5' }}
                      title="Primary"
                    />
                    <div
                      className="w-5 h-5 rounded-md border border-slate-300 shadow-xs"
                      style={{ backgroundColor: colors.gold || '#CC9048' }}
                      title="Gold"
                    />
                    <div
                      className="w-5 h-5 rounded-md border border-slate-300 shadow-xs"
                      style={{ backgroundColor: colors.secondary || '#0B2E57' }}
                      title="Secondary"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectInterface(item.id)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#004AA5] hover:bg-[#003B84] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Palette className="w-4 h-4" />
                  <span>تعديل المظهر في المحرر المرئي</span>
                </button>

                <a
                  href={item.route}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-[#0B2E57] hover:bg-slate-100 transition"
                  title="عرض الواجهة الحية في نافذة جديدة"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
