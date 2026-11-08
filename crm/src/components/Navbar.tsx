import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ActiveTab, SUPPORTED_CURRENCIES, SupportedCurrency, ROLE_DEFINITIONS } from '../types';
import { BrandLogo } from './common/BrandLogo';
import {
  LayoutDashboard,
  CalendarCheck,
  Plane,
  Receipt,
  FileSpreadsheet,
  Plus,
  Database,
  Menu,
  X,
  CalendarDays,
  NotebookPen,
  Bell,
  DollarSign,
  ListPlus,
  Globe,
  ExternalLink,
  LogOut,
  Lock,
  ChevronDown,
  Users,
  User,
  Search,
  PanelRightClose,
  PanelRightOpen,
  Home,
  Building2,
  Car,
  FileText,
  Eye,
  EyeOff,
  Printer,
  AlertCircle,
  CheckCircle2,
  LayoutGrid,
  Landmark,
  ArrowUpRight,
  ArrowUpLeft,
} from 'lucide-react';

import { formatMoney } from '../utils/formatters';
import { BRAND_CONFIG } from '../config/brandConfig';
import { useAuth } from '../context/AuthContext';
import { useLanguage, LANGUAGE_OPTIONS, SupportedLanguage } from '../context/LanguageContext';
import { useCopy } from '../i18n/useCopy';
import { CalendarWorkspace, type ToolsTab } from './tools/CalendarWorkspace';

interface NavbarProps {
  onOpenBackupModal: () => void;
  onOpenExchangeRatesModal: () => void;
  onOpenCustomListsModal: () => void;
  onOpenRemindersDrawer: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenBackupModal,
  onOpenExchangeRatesModal,
  onOpenCustomListsModal,
  onOpenRemindersDrawer,
  isSidebarCollapsed = false,
  onToggleSidebarCollapse,
}) => {
  const {
    activeTab,
    setActiveTab,
    consulateAppointments,
    flightBookings,
    debts,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    setIsConsulateModalOpen,
    setEditingConsulate,
    setIsFlightModalOpen,
    setEditingFlight,
    dueReminders,
    setSpotlightItem,
    setPresetServiceType,
    showExtraServicesInMenu,
    setShowExtraServicesInMenu,
    invoices,
    customerProfiles,
    setInvoiceSubView,
    setPrintPreviewTarget,
  } = useApp();

  const {
    user,
    users,
    logout,
    lockScreen,
    canViewAccounting,
    canManageSystemUsers,
    setIsUserProfileModalOpen,
    setIsUserManagementModalOpen,
  } = useAuth();

  const { language, setLanguage, isRTL, t, getMonthName } = useLanguage();
  const { l } = useCopy();

  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [workspaceTab, setWorkspaceTab] = useState<ToolsTab>('calendar');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [printMenuOpen, setPrintMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [portalsMenuOpen, setPortalsMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  // Role & Granular module access checks
  const isSuperOrAdmin = user?.role === 'super_admin' || user?.role === 'admin';
  const canAccessConsulate =
    isSuperOrAdmin || user?.role === 'editor' || user?.role === 'agent' || Boolean(user?.canAccessConsulate);
  const canAccessFlights =
    isSuperOrAdmin || user?.role === 'editor' || user?.role === 'agent' || Boolean(user?.canAccessFlights);
  const canAccessInvoices =
    isSuperOrAdmin || user?.role === 'accountant' || canAccessConsulate || canAccessFlights || canViewAccounting;
  const canAccessDebts =
    canViewAccounting && (isSuperOrAdmin || user?.role === 'accountant' || Boolean(user?.canAccessDebts || user?.canAccessAccounting));
  const canAccessReports =
    canViewAccounting && (isSuperOrAdmin || user?.role === 'accountant' || Boolean(user?.canAccessReports || user?.canAccessAccounting));
  const canAccessDashboard = true;

  const allNavItems: {
    id: ActiveTab;
    label: string;
    subtitle: string;
    icon: React.ReactNode;
    badge?: number;
    allowed: boolean;
  }[] = [
    {
      id: 'dashboard',
      label: t('nav.dashboard'),
      subtitle: t('nav.dashboardSub'),
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
      allowed: canAccessDashboard,
    },
    {
      id: 'customers',
      label: t('nav.customers'),
      subtitle: t('nav.customersSub'),
      icon: <Users className="w-5 h-5 shrink-0" />,
      badge: customerProfiles.length,
      allowed: canAccessDashboard,
    },
    {
      id: 'consulate',
      label: t('nav.consulate'),
      subtitle: t('nav.consulateSub'),
      icon: <CalendarCheck className="w-5 h-5 shrink-0" />,
      badge: consulateAppointments.length,
      allowed: canAccessConsulate,
    },
    {
      id: 'flights',
      label: t('nav.flights'),
      subtitle: t('nav.flightsSub'),
      icon: <Plane className="w-5 h-5 shrink-0" />,
      badge: flightBookings.length,
      allowed: canAccessFlights,
    },
    {
      id: 'invoices',
      label: t('nav.invoices'),
      subtitle: t('nav.invoicesSub'),
      icon: <FileText className="w-5 h-5 shrink-0" />,
      badge: invoices.filter((i) => i.status !== 'void').length,
      allowed: canAccessInvoices,
    },
    {
      id: 'debts',
      label: t('nav.debts'),
      subtitle: t('nav.debtsSub'),
      icon: <Receipt className="w-5 h-5 shrink-0" />,
      badge: debts.length,
      allowed: canAccessDebts,
    },
    {
      id: 'reports',
      label: t('nav.reports'),
      subtitle: t('nav.reportsSub'),
      icon: <FileSpreadsheet className="w-5 h-5 shrink-0" />,
      allowed: canAccessReports,
    },
  ];

  const navItems = allNavItems.filter((item) => item.allowed);

  React.useEffect(() => {
    if (navItems.length > 0 && !navItems.some((item) => item.id === activeTab)) {
      setActiveTab(navItems[0].id);
    }
  }, [navItems, activeTab, setActiveTab]);

  const currentTabInfo = navItems.find((tItem) => tItem.id === activeTab) || navItems[0];

  // Global Search Results across Consulate & Flights
  const searchResults = useMemo(() => {
    const q = globalSearchQuery.trim().toLowerCase();
    if (!q) return [];

    const matchedConsulate = consulateAppointments
      .filter(
        (c) =>
          c.clientName.toLowerCase().includes(q) ||
          c.phoneNumber.toLowerCase().includes(q) ||
          c.appointmentType.toLowerCase().includes(q) ||
          (c.notes && c.notes.toLowerCase().includes(q))
      )
      .slice(0, 4)
      .map((c) => ({
        id: c.id,
        type: 'consulate' as const,
        title: c.clientName,
        subtitle: `${c.appointmentType} — ${c.submissionDate}`,
        amount: c.price,
        currency: c.currency,
        raw: c,
      }));

    const matchedFlights = flightBookings
      .filter(
        (f) =>
          f.clientName.toLowerCase().includes(q) ||
          f.phoneNumber.toLowerCase().includes(q) ||
          f.airlineAndRoute.toLowerCase().includes(q) ||
          (f.pnr && f.pnr.toLowerCase().includes(q))
      )
      .slice(0, 4)
      .map((f) => ({
        id: f.id,
        type: 'flight' as const,
        title: f.clientName,
        subtitle: `${f.airlineAndRoute} (${f.pnr || 'PNR'})`,
        amount: f.sellingPrice,
        currency: f.currency,
        raw: f,
      }));

    return [...matchedConsulate, ...matchedFlights].slice(0, 6);
  }, [globalSearchQuery, consulateAppointments, flightBookings]);

  const handleOpenConsulateModal = (serviceType: string | null = null) => {
    setPresetServiceType(serviceType);
    setEditingConsulate(null);
    setIsConsulateModalOpen(true);
    setQuickAddOpen(false);
    setMobileMenuOpen(false);
  };

  const handleOpenFlightModal = () => {
    setEditingFlight(null);
    setIsFlightModalOpen(true);
    setQuickAddOpen(false);
    setMobileMenuOpen(false);
  };

  const extraOfficialServices = [
    {
      id: 'residence',
      label: t('service.residence'),
      serviceType: 'تجديد الإقامات',
      icon: <Home className="w-4 h-4 text-amber-400 shrink-0" />,
      count: consulateAppointments.filter((c) => c.appointmentType === 'تجديد الإقامات').length,
    },
    {
      id: 'hotels',
      label: t('service.hotels'),
      serviceType: 'حجوزات فنادق',
      icon: <Building2 className="w-4 h-4 text-[#2A83D5] shrink-0" />,
      count: consulateAppointments.filter((c) => c.appointmentType === 'حجوزات فنادق').length,
    },
    {
      id: 'airport',
      label: t('service.airport'),
      serviceType: 'توصيل إلى المطار',
      icon: <Car className="w-4 h-4 text-emerald-400 shrink-0" />,
      count: consulateAppointments.filter((c) => c.appointmentType === 'توصيل إلى المطار').length,
    },
    {
      id: 'translation',
      label: t('service.translation'),
      serviceType: 'الترجمة المحلفة',
      icon: <FileText className="w-4 h-4 text-[#82B1E4] shrink-0" />,
      count: consulateAppointments.filter((c) => c.appointmentType === 'الترجمة المحلفة').length,
    },
  ];

  const sidebarPositionClasses = isRTL
    ? 'right-0 border-l border-[#004AA5]/30'
    : 'left-0 border-r border-[#004AA5]/30';

  const topbarOffsetClasses = isSidebarCollapsed
    ? isRTL
      ? 'lg:mr-20'
      : 'lg:ml-20'
    : isRTL
    ? 'lg:mr-64'
    : 'lg:ml-64';

  const dropdownAlignClass = isRTL ? 'left-0 text-right' : 'right-0 text-left';

  return (
    <>
      {/* 1. Desktop Fixed Collapsible Brand Navy Sidebar (#0B2E57) */}
      <aside
        className={`crm-sidebar hidden lg:flex flex-col fixed top-0 bottom-0 z-40 bg-gradient-to-b from-[#0B2E57] via-[#12335D] to-[#0B2E57] text-white shadow-xl transition-all duration-200 no-print select-none ${sidebarPositionClasses} ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header in Sidebar */}
        <div className="min-h-20 py-3.5 px-4 flex items-center justify-between border-b border-white/10">
          {!isSidebarCollapsed ? (
            <div className="flex items-center gap-3 min-w-0">
              <BrandLogo
                background="blue"
                orientation="horizontal"
                size="md"
                className="h-9 sm:h-10 w-auto max-w-[160px] object-contain shrink-0 drop-shadow-xs"
              />
              <div className="min-w-0">
                <div className="text-xs font-black text-white truncate">{t('brand.name')}</div>
                <div className="text-[10px] text-[#54B7DA] font-bold tracking-wider truncate">
                  ELFAZNI SERVICES
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex items-center justify-center">
              <BrandLogo
                background="blue"
                orientation="vertical"
                size="sm"
                className="w-8 h-10 object-contain drop-shadow-xs"
              />
            </div>
          )}

          {onToggleSidebarCollapse && (
            <button
              onClick={onToggleSidebarCollapse}
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              className="p-1.5 rounded-lg text-[#B7CFEA] hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
            >
              {isSidebarCollapsed ? (
                <PanelRightOpen className="w-4 h-4" />
              ) : (
                <PanelRightClose className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Primary Navigation Links */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5 no-scrollbar">
          <div className="space-y-1">
            {!isSidebarCollapsed && (
              <div className="px-3 pb-1.5 text-[11px] font-bold text-[#B7CFEA]/70">
                {t('nav.mainSections')}
              </div>
            )}
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#004AA5] text-white shadow-md shadow-[#004AA5]/35 ring-1 ring-white/15'
                      : 'text-[#D7E7F7]/85 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className={`flex items-center gap-3 min-w-0 ${isSidebarCollapsed ? 'mx-auto' : ''}`}>
                    {item.icon}
                    {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!isSidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono ${
                        isActive
                          ? 'bg-white text-[#004AA5]'
                          : item.id === 'debts'
                          ? 'bg-rose-500 text-white'
                          : 'bg-white/15 text-[#D7E7F7]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Toggleable Additional Website Services */}
          {canAccessConsulate && (
            <div className="space-y-1 pt-2 border-t border-white/10">
              {!isSidebarCollapsed ? (
                <div className="px-3 pb-1 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#CC9048]">
                    {t('nav.extraServices')}
                  </span>
                  <button
                    onClick={() => setShowExtraServicesInMenu(!showExtraServicesInMenu)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/10 hover:bg-white/20 text-[#D7E7F7] transition cursor-pointer"
                  >
                    {showExtraServicesInMenu ? (
                      <>
                        <EyeOff className="w-3 h-3 text-[#CC9048]" />
                        <span>{t('nav.hide')}</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3 text-[#2A83D5]" />
                        <span>{t('nav.show')} (4)</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowExtraServicesInMenu(!showExtraServicesInMenu)}
                  className="w-full flex justify-center py-1.5 text-[#CC9048] hover:bg-white/10 rounded-xl cursor-pointer"
                >
                  {showExtraServicesInMenu ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              )}

              {showExtraServicesInMenu && (
                <div className="space-y-1 pt-0.5">
                  {extraOfficialServices.map((srv) => (
                    <button
                      key={srv.id}
                      onClick={() => handleOpenConsulateModal(srv.serviceType)}
                      className="w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#D7E7F7]/90 hover:text-white hover:bg-white/10 transition cursor-pointer group"
                    >
                      <div className={`flex items-center gap-2.5 min-w-0 ${isSidebarCollapsed ? 'mx-auto' : ''}`}>
                        {srv.icon}
                        {!isSidebarCollapsed && <span className="truncate">{srv.label}</span>}
                      </div>
                      {!isSidebarCollapsed && (
                        <div className="flex items-center gap-1">
                          {srv.count > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/10 text-[#B7CFEA] font-mono">
                              {srv.count}
                            </span>
                          )}
                          <Plus className="w-3.5 h-3.5 text-[#82B1E4]/60 group-hover:text-[#CC9048] transition" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* System & Admin Tools in Sidebar */}
          <div className="space-y-1 pt-2 border-t border-white/10">
            {!isSidebarCollapsed && (
              <div className="px-3 pb-1.5 text-[11px] font-bold text-[#B7CFEA]/70">
                {t('nav.systemTools')}
              </div>
            )}

            {canManageSystemUsers && (
              <button
                onClick={() => setIsUserManagementModalOpen(true)}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-[#F3E4C6] hover:bg-white/10 transition cursor-pointer"
              >
                <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'mx-auto' : ''}`}>
                  <Users className="w-5 h-5 text-[#CC9048] shrink-0" />
                  {!isSidebarCollapsed && <span>{t('nav.userManagement')}</span>}
                </div>
                {!isSidebarCollapsed && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#CC9048] text-slate-950 font-mono">
                    {users.length}
                  </span>
                )}
              </button>
            )}

            {canViewAccounting && (
              <button
                onClick={onOpenExchangeRatesModal}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#D7E7F7]/85 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'mx-auto' : ''}`}>
                  <DollarSign className="w-5 h-5 text-emerald-400 shrink-0" />
                  {!isSidebarCollapsed && <span>{t('nav.exchangeRates')}</span>}
                </div>
              </button>
            )}

            <button
              onClick={onOpenCustomListsModal}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#D7E7F7]/85 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'mx-auto' : ''}`}>
                <ListPlus className="w-5 h-5 text-[#2A83D5] shrink-0" />
                {!isSidebarCollapsed && <span>{t('nav.customLists')}</span>}
              </div>
            </button>

            {/* Personal workspace quick access: Calendar + Notebook */}
            <button
              onClick={() => {
                setWorkspaceTab('calendar');
                setWorkspaceOpen(true);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#D7E7F7]/85 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'mx-auto' : ''}`}>
                <CalendarDays className="w-5 h-5 text-[#E3C88F] shrink-0" />
                {!isSidebarCollapsed && <span>{l('تقويمي', 'My calendar', 'Mon calendrier')}</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#004AA5] text-white font-mono">
                  {consulateAppointments.length + flightBookings.length + debts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setWorkspaceTab('notebook');
                setWorkspaceOpen(true);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#D7E7F7]/85 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'mx-auto' : ''}`}>
                <NotebookPen className="w-5 h-5 text-[#E3C88F] shrink-0" />
                {!isSidebarCollapsed && <span>{l('مفكرتي', 'My notebook', 'Mon carnet')}</span>}
              </div>
            </button>

            <button
              onClick={onOpenBackupModal}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#D7E7F7]/85 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'mx-auto' : ''}`}>
                <Database className="w-5 h-5 text-[#82B1E4] shrink-0" />
                {!isSidebarCollapsed && <span>{t('nav.backup')}</span>}
              </div>
            </button>
          </div>

          {/* External Portals Switcher */}
          <div className="pt-2 mt-2 border-t border-white/10 space-y-1">
            {!isSidebarCollapsed ? (
              <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#E3C88F]">
                {l("الانتقال إلى الواجهات", "Switch Interfaces", "Passer aux interfaces")}
              </div>
            ) : null}

            <a
              href="/admin"
              className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-white bg-white/10 hover:bg-[#004AA5] rounded-xl transition shadow-xs group"
              title={l("لوحة إدارة الموقع (Admin Panel)", "Admin Panel", "Panneau d'administration")}
            >
              <Building2 className="w-4 h-4 text-[#E3C88F] shrink-0" />
              {!isSidebarCollapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate">{l("لوحة إدارة الموقع", "Admin Panel", "Panneau Admin")}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#B7CFEA] group-hover:text-white" />
                </div>
              )}
            </a>

            <a
              href="/"
              className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-[#B7CFEA] hover:text-white hover:bg-white/10 rounded-xl transition"
              title={l("الموقع العام الرسمي", "Official Public Website", "Site Web Public")}
            >
              <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
              {!isSidebarCollapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate">{l("الموقع الرسمي", "Public Website", "Site Web")}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                </div>
              )}
            </a>

            <a
              href="/hub"
              className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-[#B7CFEA] hover:text-white hover:bg-white/10 rounded-xl transition"
              title={l("بوابة HUB الموحدة", "HUB Gateway", "Portail HUB")}
            >
              <Landmark className="w-4 h-4 text-[#E3C88F] shrink-0" />
              {!isSidebarCollapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate">{l("بوابة HUB", "HUB Gateway", "Portail HUB")}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                </div>
              )}
            </a>
          </div>
        </div>

        {/* Sidebar Bottom User Profile Bar */}
        <div className="p-3 border-t border-white/10 bg-[#0B1F3A]/70">
          <div className="flex items-center justify-between gap-2">
            <div
              onClick={() => setIsUserProfileModalOpen(true)}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
            >
              <img
                src={user?.avatarUrl || '/admin/crm/assets/founder-rachid-elfazni-v2.webp'}
                alt={user?.displayName || 'User'}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-[#CC9048]/70 shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/admin/crm/assets/founder-rachid-elfazni-v2.webp';
                }}
              />
              {!isSidebarCollapsed && (
                <div className="min-w-0">
                  <div className="text-xs font-black text-white truncate group-hover:text-[#CC9048] transition">
                    {user?.displayName || BRAND_CONFIG.founderShort}
                  </div>
                  <div className="text-[10px] text-[#B7CFEA]/80 font-mono truncate">
                    @{user?.username}
                  </div>
                </div>
              )}
            </div>

            {!isSidebarCollapsed && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={lockScreen}
                  title="Lock Screen"
                  className="p-1.5 rounded-lg text-[#B7CFEA] hover:text-[#CC9048] hover:bg-white/10 transition cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                </button>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-1.5 rounded-lg text-rose-300 hover:text-rose-200 hover:bg-rose-500/20 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 2. Sticky Clean White Topbar */}
      <header
        className={`crm-topbar sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#D7E7F7] transition-all duration-200 no-print ${topbarOffsetClasses}`}
      >
        <div className="crm-topbar-inner max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-18 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Start: Mobile Menu Button + Page Title & Subtitle */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-[#0B2E57] hover:bg-[#eaf4ff] transition cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="min-w-0 flex items-center gap-2.5">
              <div className="hidden md:flex items-center bg-white px-3 py-1.5 rounded-2xl shadow-xs border border-[#D7E7F7] shrink-0">
                <BrandLogo
                  background="white"
                  orientation="horizontal"
                  size="md"
                  className="h-8 sm:h-9 w-auto max-w-[150px] object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-[#0B2E57] truncate">
                    {currentTabInfo?.label || t('nav.dashboard')}
                  </h2>

                </div>
                <p className="text-xs text-[#5E7086] truncate hidden md:block">
                  {currentTabInfo?.subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Center: Global Search Bar */}
          <div className="crm-global-search relative flex-1 min-w-40 max-w-md hidden md:block">
            <div className="relative">
              <Search
                className={`w-4 h-4 text-[#5E7086] absolute top-1/2 -translate-y-1/2 pointer-events-none ${
                  isRTL ? 'right-3.5' : 'left-3.5'
                }`}
              />
              <input
                type="text"
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                placeholder={t('topbar.searchPlaceholder')}
                className={`w-full ${
                  isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'
                } py-2 rounded-xl bg-[#F8FAFC] border border-[#D7E7F7] focus:bg-white focus:border-[#004AA5] text-xs font-semibold text-[#0B2E57] placeholder-[#5E7086]/70 focus:outline-none transition`}
              />
              {globalSearchQuery && (
                <button
                  onClick={() => setGlobalSearchQuery('')}
                  className={`absolute top-1/2 -translate-y-1/2 ${
                    isRTL ? 'left-3' : 'right-3'
                  } text-slate-400 hover:text-slate-600`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Instant Search Results Dropdown */}
            {searchFocused && globalSearchQuery.trim().length > 0 && (
              <div className="absolute right-0 left-0 mt-2 bg-white border border-[#D7E7F7] rounded-2xl shadow-xl p-2 z-50 divide-y divide-slate-100">
                {searchResults.length === 0 ? (
                  <div className="py-4 text-center text-xs text-[#5E7086]">
                    {t('topbar.noResults')} «{globalSearchQuery}»
                  </div>
                ) : (
                  searchResults.map((res) => (
                    <button
                      key={`${res.type}-${res.id}`}
                      onMouseDown={() => {
                        setSpotlightItem({ type: res.type, item: res.raw });
                        setGlobalSearchQuery('');
                      }}
                      className="w-full flex items-center justify-between gap-3 p-2.5 hover:bg-[#eaf4ff]/60 rounded-xl text-start transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            res.type === 'consulate'
                              ? 'bg-[#eaf4ff] text-[#004AA5]'
                              : 'bg-emerald-50 text-emerald-600'
                          }`}
                        >
                          {res.type === 'consulate' ? (
                            <CalendarCheck className="w-3.5 h-3.5" />
                          ) : (
                            <Plane className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black text-[#0B2E57] truncate">{res.title}</div>
                          <div className="text-[11px] text-[#5E7086] truncate">{res.subtitle}</div>
                        </div>
                      </div>
                      {canViewAccounting && (
                        <span className="text-xs font-mono font-bold text-[#004AA5] shrink-0" dir="ltr">
                          {formatMoney(res.amount, res.currency)}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* End: Language Switcher (AR / EN / FR), Date Filter, Quick Add, Print 6 Docs, Bell & User */}
          <div className="crm-topbar-actions flex flex-wrap items-center gap-2">
            {/* Multilingual Switcher (AR / EN / FR) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#eaf4ff]/70 hover:bg-[#eaf4ff] border border-[#004AA5]/25 text-xs font-black text-[#0B2E57] transition cursor-pointer"
                title="Switch Language (AR / EN / FR)"
              >
                <Globe className="w-3.5 h-3.5 text-[#004AA5]" />
                <span className="uppercase font-mono">{language}</span>
                <ChevronDown className="w-3 h-3 text-[#5E7086]" />
              </button>

              {langMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLangMenuOpen(false)} />
                  <div
                    className={`absolute ${dropdownAlignClass} mt-2 w-44 bg-white border border-[#D7E7F7] rounded-2xl shadow-xl p-1.5 z-50 space-y-1`}
                  >
                    {(Object.values(LANGUAGE_OPTIONS) as typeof LANGUAGE_OPTIONS[SupportedLanguage][]).map(
                      (opt) => (
                        <button
                          key={opt.code}
                          type="button"
                          onClick={() => {
                            setLanguage(opt.code);
                            setLangMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                            language === opt.code
                              ? 'bg-[#0B2E57] text-white'
                              : 'text-[#0B2E57] hover:bg-[#eaf4ff]'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{opt.flag}</span>
                            <span>{opt.nativeLabel}</span>
                          </span>
                          <span className="text-[10px] font-mono uppercase opacity-75">
                            {opt.dir}
                          </span>
                        </button>
                      )
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Period Filter (Month & Year) */}
            <div className="hidden sm:flex items-center bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl px-2.5 py-1.5 text-xs text-[#0B2E57]">
              <CalendarDays className="w-3.5 h-3.5 text-[#004AA5] mx-1 shrink-0" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-[#0B2E57] text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value={0}>{t('topbar.allMonths')}</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>
                    {getMonthName(m)}
                  </option>
                ))}
              </select>
              <span className="text-slate-300 px-1">/</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-[#0B2E57] text-xs font-bold focus:outline-none cursor-pointer font-mono"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>

            {/* Quick Add Dropdown */}
            {(canAccessConsulate || canAccessFlights) && (
              <div className="relative">
                <button
                  onClick={() => setQuickAddOpen(!quickAddOpen)}
                  className="inline-flex items-center gap-1.5 bg-[#004AA5] hover:bg-[#0B2E57] text-white px-3 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden lg:inline">{t('topbar.quickAdd')}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#B7CFEA]" />
                </button>

                {quickAddOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setQuickAddOpen(false)} />
                    <div
                      className={`absolute ${dropdownAlignClass} mt-2 w-60 bg-white border border-[#D7E7F7] rounded-2xl shadow-xl p-2 z-50 space-y-1`}
                    >
                      {canAccessConsulate && (
                        <button
                          onClick={() => handleOpenConsulateModal(null)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#0B2E57] hover:bg-[#eaf4ff] transition cursor-pointer text-start"
                        >
                          <CalendarCheck className="w-4 h-4 text-[#004AA5] shrink-0" />
                          <span>{t('topbar.newConsulate')}</span>
                        </button>
                      )}
                      {canAccessFlights && (
                        <button
                          onClick={handleOpenFlightModal}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#0B2E57] hover:bg-emerald-50 transition cursor-pointer text-start"
                        >
                          <Plane className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{t('topbar.newFlight')}</span>
                        </button>
                      )}

                      {canAccessConsulate && showExtraServicesInMenu && (
                        <div className="pt-1.5 mt-1 border-t border-slate-100 space-y-0.5">
                          {extraOfficialServices.map((srv) => (
                            <button
                              key={srv.id}
                              onClick={() => handleOpenConsulateModal(srv.serviceType)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#0B2E57] hover:bg-[#F8FAFC] transition cursor-pointer text-start"
                            >
                              {srv.icon}
                              <span>+ {srv.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Global Print & PDF Menu (All 6 Document Types) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setPrintMenuOpen(!printMenuOpen)}
                className="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#eaf4ff] text-[#0B2E57] border border-[#D7E7F7] text-xs font-bold transition cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#004AA5]" />
                <span className="hidden xl:inline">{t('topbar.printAndPdf')}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#5E7086]" />
              </button>

              {printMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setPrintMenuOpen(false)} />
                  <div
                    className={`absolute ${dropdownAlignClass} mt-2 w-80 bg-white border border-[#D7E7F7] rounded-2xl shadow-2xl p-2.5 z-50 space-y-1`}
                  >
                    <div className="px-2.5 py-1.5 text-[10px] font-black text-[#004AA5] border-b border-slate-100">
                      {t('topbar.printMenuTitle')}
                    </div>

                    {/* 1. Individual Customer Invoice */}
                    <button
                      type="button"
                      onClick={() => {
                        setPrintMenuOpen(false);
                        if (invoices.length > 0) {
                          setPrintPreviewTarget({
                            type: 'invoice',
                            invoiceId: invoices[0].id,
                          });
                        } else {
                          setInvoiceSubView('invoice_editor');
                          setActiveTab('invoices');
                        }
                      }}
                      className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-[#eaf4ff] transition cursor-pointer text-start"
                    >
                      <Receipt className="w-4 h-4 text-[#004AA5] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-black text-[#0B2E57]">
                          {t('topbar.doc1Title')}
                        </div>
                        <div className="text-[10px] text-[#5E7086]">{t('topbar.doc1Sub')}</div>
                      </div>
                    </button>

                    {/* 2. Official Payment Receipt */}
                    <button
                      type="button"
                      onClick={() => {
                        setPrintMenuOpen(false);
                        if (invoices.length > 0) {
                          setPrintPreviewTarget({
                            type: 'payment_receipt',
                            invoiceId: invoices[0].id,
                          });
                        } else {
                          setActiveTab('invoices');
                        }
                      }}
                      className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-[#eaf4ff] transition cursor-pointer text-start"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-black text-[#0B2E57]">
                          {t('topbar.doc2Title')}
                        </div>
                        <div className="text-[10px] text-[#5E7086]">{t('topbar.doc2Sub')}</div>
                      </div>
                    </button>

                    {/* 3. Customer Account Statement */}
                    <button
                      type="button"
                      onClick={() => {
                        setPrintMenuOpen(false);
                        if (customerProfiles.length > 0) {
                          setPrintPreviewTarget({
                            type: 'statement',
                            customerId: customerProfiles[0].customerId,
                            currency: customerProfiles[0].currencies[0] || 'TRY',
                          });
                        } else {
                          setInvoiceSubView('customer_statement');
                          setActiveTab('invoices');
                        }
                      }}
                      className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-[#eaf4ff] transition cursor-pointer text-start"
                    >
                      <FileText className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-black text-[#0B2E57]">
                          {t('topbar.doc3Title')}
                        </div>
                        <div className="text-[10px] text-[#5E7086]">{t('topbar.doc3Sub')}</div>
                      </div>
                    </button>

                    {canViewAccounting && (
                      <>
                        {/* 4. Consolidated Financial Report */}
                        <button
                          type="button"
                          onClick={() => {
                            setPrintMenuOpen(false);
                            setPrintPreviewTarget({
                              type: 'all_accounts_report',
                            });
                          }}
                          className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-[#eaf4ff] transition cursor-pointer text-start"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-[#CC9048] shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-black text-[#0B2E57]">
                              {t('topbar.doc4Title')}
                            </div>
                            <div className="text-[10px] text-[#5E7086]">{t('topbar.doc4Sub')}</div>
                          </div>
                        </button>

                        {/* 5. Outstanding Balances Report */}
                        <button
                          type="button"
                          onClick={() => {
                            setPrintMenuOpen(false);
                            setPrintPreviewTarget({
                              type: 'outstanding_balances_report',
                            });
                          }}
                          className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-[#eaf4ff] transition cursor-pointer text-start"
                        >
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-black text-[#0B2E57]">
                              {t('topbar.doc5Title')}
                            </div>
                            <div className="text-[10px] text-[#5E7086]">{t('topbar.doc5Sub')}</div>
                          </div>
                        </button>

                        {/* 6. Periodic Payment Report */}
                        <button
                          type="button"
                          onClick={() => {
                            setPrintMenuOpen(false);
                            setPrintPreviewTarget({
                              type: 'periodic_payment_report',
                            });
                          }}
                          className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-[#eaf4ff] transition cursor-pointer text-start"
                        >
                          <DollarSign className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-black text-[#0B2E57]">
                              {t('topbar.doc6Title')}
                            </div>
                            <div className="text-[10px] text-[#5E7086]">{t('topbar.doc6Sub')}</div>
                          </div>
                        </button>
                      </>
                    )}

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setPrintMenuOpen(false);
                          setInvoiceSubView('invoices_list');
                          setActiveTab('invoices');
                        }}
                        className="w-full py-1.5 text-center text-[11px] font-bold text-[#004AA5] hover:underline cursor-pointer"
                      >
                        {t('topbar.openInvoicesCenter')}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Reminders Bell */}
            <button
              onClick={onOpenRemindersDrawer}
              className="relative p-2 rounded-xl bg-[#F8FAFC] hover:bg-[#eaf4ff] text-[#0B2E57] border border-[#D7E7F7] transition cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {dueReminders.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white font-mono">
                  {dueReminders.length}
                </span>
              )}
            </button>

            {/* Dedicated Switch Interfaces Button / Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setPortalsMenuOpen(!portalsMenuOpen)}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-[#0B2E57] via-[#004AA5] to-[#0B2E57] text-white border border-[#CC9048]/50 shadow-xs hover:shadow-md hover:border-[#CC9048] transition cursor-pointer text-xs font-black group"
                title={l("الانتقال إلى الواجهات (لوحة الإدارة، الموقع الرسمي، HUB)", "Switch Interfaces (Admin Panel, Official Website, HUB)", "Changer d'interface (Admin, Site Web, HUB)")}
              >
                <LayoutGrid className="w-4 h-4 text-[#E3C88F] group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline font-bold">{l("الانتقال إلى الواجهات", "Switch Interfaces", "Passer aux interfaces")}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#B7CFEA]" />
              </button>

              {portalsMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setPortalsMenuOpen(false)} />
                  <div className={`absolute ${dropdownAlignClass} mt-2 w-72 sm:w-80 bg-white border border-[#D7E7F7] rounded-2xl shadow-2xl p-2.5 z-50 space-y-1.5 divide-y divide-slate-100`}>
                    <div className="px-2.5 py-1 text-[11px] font-black text-[#004AA5] flex items-center justify-between">
                      <span>{l("الانتقال إلى واجهات النظام", "Switch Portal Interface", "Passer aux interfaces")}</span>
                      <span className="text-[10px] bg-[#EAF4FF] text-[#004AA5] px-2 py-0.5 rounded-full font-bold">ELFAZNI</span>
                    </div>

                    <div className="pt-1.5 space-y-1">
                      {/* 1. Admin Panel */}
                      <a
                        href="/admin"
                        className="w-full flex items-center justify-between gap-3 p-2.5 hover:bg-[#EAF4FF] rounded-xl transition cursor-pointer group text-start"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#004AA5]/10 text-[#004AA5] flex items-center justify-center shrink-0 group-hover:bg-[#004AA5] group-hover:text-white transition-colors">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-black text-[#0B2E57] group-hover:text-[#004AA5]">{l("لوحة إدارة الموقع", "Admin Panel", "Panneau d'administration")}</div>
                            <div className="text-[10px] text-[#5E7086]">{l("إدارة المقالات، المحتوى، والرسائل", "Manage posts, chats & site content", "Gestion des articles et contenus")}</div>
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-[#5E7086] group-hover:text-[#004AA5] shrink-0" />
                      </a>

                      {/* 2. Public Official Website */}
                      <a
                        href="/"
                        className="w-full flex items-center justify-between gap-3 p-2.5 hover:bg-emerald-50/70 rounded-xl transition cursor-pointer group text-start"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <Globe className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-black text-[#0B2E57] group-hover:text-emerald-700">{l("الموقع الرسمي العام", "Official Public Website", "Site Web Officiel")}</div>
                            <div className="text-[10px] text-[#5E7086]">{l("عرض الموقع الرئيسي وحجز الخدمات", "Browse public site & bookings", "Visiter le site public et réservations")}</div>
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-[#5E7086] group-hover:text-emerald-600 shrink-0" />
                      </a>

                      {/* 3. HUB Gateway */}
                      <a
                        href="/hub"
                        className="w-full flex items-center justify-between gap-3 p-2.5 hover:bg-amber-50/70 rounded-xl transition cursor-pointer group text-start"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#CC9048]/15 text-[#CC9048] flex items-center justify-center shrink-0 group-hover:bg-[#CC9048] group-hover:text-white transition-colors">
                            <Landmark className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-black text-[#0B2E57] group-hover:text-[#CC9048]">{l("بوابة HUB الموحدة", "HUB Unified Gateway", "Portail HUB Unifié")}</div>
                            <div className="text-[10px] text-[#5E7086]">{l("المدخل الموحد لكافة فروع ومكاتب الفزني", "Central gateway to all services", "Passerelle centrale vers tous les services")}</div>
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-[#5E7086] group-hover:text-[#CC9048] shrink-0" />
                      </a>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Quick 1-Click Desktop Portal Badges */}
            <div className="hidden xl:flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-xl border border-[#D7E7F7] text-xs font-bold">
              <a
                href="/"
                className="px-2.5 py-1 rounded-lg text-[#0B2E57] hover:bg-[#eaf4ff] transition-colors flex items-center gap-1 cursor-pointer"
                title={l("الموقع العام", "Public Website", "Site Web Public")}
              >
                <span>🌐</span>
                <span>{l("الموقع العام", "Website", "Site Web")}</span>
              </a>

              <a
                href="/admin"
                className="px-2.5 py-1 rounded-lg text-[#004AA5] hover:bg-[#eaf4ff] transition-colors flex items-center gap-1 cursor-pointer"
                title={l("لوحة إدارة الموقع", "Website Admin", "Admin du Site")}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{l("لوحة الإدارة", "Admin", "Admin")}</span>
              </a>

              <a
                href="/hub"
                className="px-2.5 py-1 rounded-lg text-[#CC9048] hover:bg-[#eaf4ff] transition-colors flex items-center gap-1 cursor-pointer"
                title={l("بوابة HUB الموحدة", "HUB Gateway", "Portail HUB")}
              >
                <span>🏛️</span>
                <span>HUB</span>
              </a>
            </div>

            {/* Visible logout */}
            <button
              onClick={logout}
              title={l("تسجيل الخروج", "Sign out", "Se déconnecter")}
              aria-label={l("تسجيل الخروج", "Sign out", "Se déconnecter")}
              className="p-2 rounded-xl bg-[#F8FAFC] hover:bg-rose-50 hover:text-rose-600 text-[#0B2E57] border border-[#D7E7F7] transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* User Avatar & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                className="flex items-center gap-1.5 bg-[#F8FAFC] hover:bg-[#eaf4ff] border border-[#D7E7F7] p-1.5 sm:px-2 sm:py-1.5 rounded-xl transition cursor-pointer"
              >
                <img
                  src={user?.avatarUrl || '/admin/crm/assets/founder-rachid-elfazni-v2.webp'}
                  alt={user?.displayName || 'User'}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-[#004AA5]/30"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/admin/crm/assets/founder-rachid-elfazni-v2.webp';
                  }}
                />
                <ChevronDown className="w-3.5 h-3.5 text-[#5E7086]" />
              </button>

              {adminMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAdminMenuOpen(false)} />
                  <div
                    className={`absolute ${dropdownAlignClass} mt-2 w-72 bg-white border border-[#D7E7F7] rounded-2xl shadow-2xl p-3 z-50 space-y-2`}
                  >
                    <div
                      onClick={() => {
                        setAdminMenuOpen(false);
                        setIsUserProfileModalOpen(true);
                      }}
                      className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#D7E7F7] flex items-center gap-3 cursor-pointer hover:border-[#004AA5]/50 transition"
                    >
                      <img
                        src={user?.avatarUrl || '/admin/crm/assets/founder-rachid-elfazni-v2.webp'}
                        alt={user?.displayName || 'User'}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-[#004AA5]"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/admin/crm/assets/founder-rachid-elfazni-v2.webp';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black text-[#0B2E57] truncate">
                          {user?.displayName || BRAND_CONFIG.founder}
                        </div>
                        <div className="text-[11px] text-[#5E7086] font-mono truncate">
                          @{user?.username}
                        </div>
                      </div>
                    </div>

                    <div className="pt-1 space-y-1">
                      <button
                        onClick={() => {
                          setAdminMenuOpen(false);
                          setIsUserProfileModalOpen(true);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-[#0B2E57] hover:bg-[#eaf4ff] transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-[#004AA5]" />
                          <span>Profile & Password</span>
                        </div>
                      </button>

                      {canManageSystemUsers && (
                        <button
                          onClick={() => {
                            setAdminMenuOpen(false);
                            setIsUserManagementModalOpen(true);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-[#0B2E57] hover:bg-amber-50 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-[#CC9048]" />
                            <span>{t('nav.userManagement')}</span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#eaf4ff] text-[#004AA5] font-black font-mono">
                            {users.length}
                          </span>
                        </button>
                      )}

                      {canViewAccounting && (
                        <button
                          onClick={() => {
                            setAdminMenuOpen(false);
                            onOpenExchangeRatesModal();
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#5E7086] hover:text-[#0B2E57] hover:bg-[#F8FAFC] transition cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-600" />
                            <span>{t('nav.exchangeRates')}</span>
                          </div>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setAdminMenuOpen(false);
                          onOpenCustomListsModal();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#5E7086] hover:text-[#0B2E57] hover:bg-[#F8FAFC] transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <ListPlus className="w-4 h-4 text-[#004AA5]" />
                          <span>{t('nav.customLists')}</span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setAdminMenuOpen(false);
                          onOpenBackupModal();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#5E7086] hover:text-[#0B2E57] hover:bg-[#F8FAFC] transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-[#004AA5]" />
                          <span>{t('nav.backup')}</span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setAdminMenuOpen(false);
                          setWorkspaceTab('notebook');
                          setWorkspaceOpen(true);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#5E7086] hover:text-[#0B2E57] hover:bg-[#F8FAFC] transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <NotebookPen className="w-4 h-4 text-[#004AA5]" />
                          <span>{l('دفتر الملاحظات', 'Notebook', 'Carnet de notes')}</span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setAdminMenuOpen(false);
                          setWorkspaceTab('calendar');
                          setWorkspaceOpen(true);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#5E7086] hover:text-[#0B2E57] hover:bg-[#F8FAFC] transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-[#004AA5]" />
                          <span>{l('التقويم والمهام', 'Calendar & tasks', 'Calendrier et tâches')}</span>
                        </div>
                      </button>

                      {/* Jump to the Website Admin panel */}
                      <a
                        href="/admin"
                        onClick={() => setAdminMenuOpen(false)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-[#0B2E57] hover:bg-[#eaf4ff] transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[#CC9048]" />
                          <span>{l('لوحة إدارة الموقع', 'Website Admin panel', 'Panneau d’administration du site')}</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-[#5E7086]" />
                      </a>

                      {/* Jump to Public Website */}
                      <a
                        href="/"
                        onClick={() => setAdminMenuOpen(false)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-[#0B2E57] hover:bg-[#eaf4ff] transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-[#004AA5]" />
                          <span>{l('الموقع العام', 'Public Website', 'Site Web Public')}</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-[#5E7086]" />
                      </a>

                      {/* Jump to HUB */}
                      <a
                        href="/hub"
                        onClick={() => setAdminMenuOpen(false)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-[#0B2E57] hover:bg-[#eaf4ff] transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🏛️</span>
                          <span>{l('بوابة HUB الموحدة', 'HUB Gateway', 'Portail HUB')}</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-[#5E7086]" />
                      </a>

                      <div className="border-t border-slate-100 my-1" />

                      <button
                        onClick={() => {
                          setAdminMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 3. Mobile / Tablet Slide-over Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#0B2E57]/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-[#0B2E57] text-white h-full flex flex-col justify-between p-4 z-10 shadow-2xl">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="py-1">
                  <BrandLogo
                    background="blue"
                    orientation="horizontal"
                    size="md"
                    className="h-9 sm:h-10 w-auto object-contain"
                  />
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl text-[#B7CFEA] hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1.5">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition ${
                      activeTab === item.id
                        ? 'bg-[#004AA5] text-white shadow-sm'
                        : 'text-[#D7E7F7] hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white font-mono">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-2">
              <a
                href="/"
                className="w-full py-2.5 px-3 rounded-xl bg-white/10 text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition cursor-pointer"
              >
                <Globe className="w-4 h-4 text-[#2A83D5]" />
                <span>{l("الموقع العام", "Public Website", "Site Web Public")}</span>
              </a>

              <a
                href="/hub"
                className="w-full py-2.5 px-3 rounded-xl bg-white/10 text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition cursor-pointer"
              >
                <span>🏛️</span>
                <span>{l("بوابة HUB الموحدة", "HUB Gateway", "Portail HUB")}</span>
              </a>

              <a
                href="/admin"
                className="w-full py-2.5 px-3 rounded-xl bg-white/10 text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-[#CC9048]" />
                <span>{l("لوحة إدارة الموقع", "Website Admin panel", "Panneau d’administration du site")}</span>
              </a>

              <button
                type="button"
                onClick={logout}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 hover:bg-rose-500 hover:text-white transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{l("تسجيل الخروج", "Sign out", "Se déconnecter")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scheduler-style personal workspace: Calendar + Notebook + Tasks + Bookings */}
      <CalendarWorkspace
        open={workspaceOpen}
        initialTab={workspaceTab}
        onClose={() => setWorkspaceOpen(false)}
      />
    </>
  );
};
