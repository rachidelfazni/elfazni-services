import {usePendingContactReminders} from "../contacts/ContactReminders";
import React, { useEffect, useRef, useState } from "react";
import {
  Eye,
  LayoutDashboard,
  Users,
  CalendarCheck,
  Plane,
  Receipt,
  ChartNoAxesCombined,
  Wallet,
  Search,
  Plus,
  Bell,
  Settings2,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  LockKeyhole,
  UserRound,
  Database,
  ListFilter,
  ArrowRightLeft,
  Printer,
  Command,
  ChevronDown,
  CalendarDays,
  NotebookPen,
  Building2,
  ExternalLink,
  Workflow,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { useCopy } from "../../i18n/useCopy";
import { ActiveTab } from "../../types";
import { BRAND_CONFIG } from "../../config/brandConfig";
import { BankDetailsShare } from "../common/BankDetailsShare";
import { showAllSections } from "../common/VisibilitySection";
import { CalendarWorkspace, type ToolsTab } from "../tools/CalendarWorkspace";
interface Props {
  onOpenBackupModal: () => void;
  onOpenExchangeRatesModal: () => void;
  onOpenCustomListsModal: () => void;
  onOpenRemindersDrawer: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
}
export const WorkspaceNavbar: React.FC<Props> = (props) => {
  const app = useApp();
  const contactDueReminders=usePendingContactReminders(true);
  const auth = useAuth();
  const { l, language, setLanguage, isRTL, getMonthName } = useCopy();
  const [mobile, setMobile] = useState(false),
    [search, setSearch] = useState(false),
    [query, setQuery] = useState(""),
    [menu, setMenu] = useState<"add" | "settings" | "print" | null>(null);
  const [workspace, setWorkspace] = useState<{ open: boolean; tab: ToolsTab }>({
    open: false,
    tab: "calendar",
  });
  const openWorkspace = (tab: ToolsTab) => setWorkspace({ open: true, tab });
  const searchRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const admin =
    auth.user?.role === "super_admin" || auth.user?.role === "admin";
  const consulate =
    admin ||
    ["editor", "agent"].includes(auth.user?.role || "") ||
    !!auth.user?.canAccessConsulate;
  const flights =
    admin ||
    ["editor", "agent"].includes(auth.user?.role || "") ||
    !!auth.user?.canAccessFlights;
  const nav = [
    {
      id: "dashboard",
      label: l("نظرة عامة", "Overview", "Vue d’ensemble"),
      icon: LayoutDashboard,
      allowed: true,
    },
    {
      id: "customers",
      label: l("العملاء", "Customers", "Clients"),
      icon: Users,
      allowed: true,
    },
    {
      id: "consulate",
      label: l(
        "المعاملات القنصلية",
        "Consular services",
        "Services consulaires",
      ),
      icon: CalendarCheck,
      allowed: consulate,
    },
    {
      id: "flights",
      label: l("حجوزات الطيران", "Flight bookings", "Réservations de vols"),
      icon: Plane,
      allowed: flights,
    },
    {
      id: "invoices",
      label: l(
        "الفواتير والمستندات",
        "Invoices & documents",
        "Factures et documents",
      ),
      icon: Receipt,
      allowed: auth.canViewAccounting || consulate || flights,
    },
    {
      id: "debts",
      label: l("المستحقات", "Receivables", "Créances"),
      icon: Wallet,
      allowed: auth.canViewAccounting,
    },
    {
      id: "reports",
      label: l("التقارير المالية", "Financial reports", "Rapports financiers"),
      icon: ChartNoAxesCombined,
      allowed: auth.canViewAccounting,
    },
    {
      id: "tools",
      label: l("مركز المتابعات", "Follow-up center", "Centre de suivi"),
      icon: Workflow,
      allowed: true,
    },
  ].filter((x) => x.allowed);
  const go = (id: string) => {
    app.setActiveTab(id as ActiveTab);
    setMobile(false);
    setSearch(false);
    setMenu(null);
  };
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearch((x) => !x);
      }
      if (e.key === "Escape") {
        setSearch(false);
        setMobile(false);
        setMenu(null);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);
  useEffect(() => {
    if (search) {
      searchRef.current?.focus();
    } else {
      triggerRef.current?.focus();
    }
  }, [search]);
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenu(null);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  const q = query.trim().toLowerCase();
  const records = [
    ...(consulate
      ? app.consulateAppointments.map((item) => ({
          key: "c" + item.id,
          title: item.clientName,
          detail: item.appointmentType,
          phone: item.phoneNumber,
          action: () => app.setSpotlightItem({ type: "consulate", item }),
        }))
      : []),
    ...(flights
      ? app.flightBookings.map((item) => ({
          key: "f" + item.id,
          title: item.clientName,
          detail: item.pnr,
          phone: item.phoneNumber,
          action: () => app.setSpotlightItem({ type: "flight", item }),
        }))
      : []),
  ]
    .filter(
      (x) => q && `${x.title} ${x.detail} ${x.phone}`.toLowerCase().includes(q),
    )
    .slice(0, 8);
  const navLinks = (
    <>
      <div className="ws-nav-label">
        {l("مساحة العمل", "WORKSPACE", "ESPACE DE TRAVAIL")}
      </div>
      {nav.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => go(id)}
          className={`ws-nav-link ${app.activeTab === id ? "active" : ""}`}
          aria-current={app.activeTab === id ? "page" : undefined}
          title={label}
        >
          <Icon />
          <span>{label}</span>
          {id === "tools" && (app.dueReminders.length + contactDueReminders.length) > 0 && (
            <b>{app.dueReminders.length + contactDueReminders.length}</b>
          )}
        </button>
      ))}
    </>
  );
  const startConsulate = () => {
    app.setEditingConsulate(null);
    app.setIsConsulateModalOpen(true);
    setMenu(null);
  };
  const startFlight = () => {
    app.setEditingFlight(null);
    app.setIsFlightModalOpen(true);
    setMenu(null);
  };
  const printItems = [
    ["invoice", l("فاتورة", "Invoice", "Facture")],
    ["payment_receipt", l("إيصال دفع", "Payment receipt", "Reçu de paiement")],
    ["statement", l("كشف حساب عميل", "Customer statement", "Relevé client")],
    ...(auth.canViewAccounting
      ? [
          [
            "all_accounts_report",
            l("تقرير مالي شامل", "Financial report", "Rapport financier"),
          ],
          [
            "outstanding_balances_report",
            l("تقرير المستحقات", "Receivables report", "Rapport des créances"),
          ],
          [
            "periodic_payment_report",
            l("تقرير المدفوعات", "Payment report", "Rapport des paiements"),
          ],
        ]
      : []),
  ];
  return (
    <>
      <aside
        className={`ws-sidebar no-print ${props.isSidebarCollapsed ? "collapsed" : ""}`}
      >
        <a
          className="ws-brand"
          href={BRAND_CONFIG.proWebsiteUrl}
          target="_blank"
          rel="noreferrer"
        >
          <img
            src={
              props.isSidebarCollapsed
                ? "/admin/crm/assets/logos/kit/elfazni-vertical-on-white.svg"
                : "/admin/crm/assets/logos/kit/elfazni-horizontal-on-white.svg"
            }
            alt="ELFAZNI SERVICES"
          />
          <small>
            {l("مساحة العمل", "BUSINESS WORKSPACE", "ESPACE DE TRAVAIL")}
          </small>
        </a>
        <div className="ws-nav-scroll">
          {navLinks}
          <div className="ws-nav-label">
            {l("أدوات شخصية", "PERSONAL TOOLS", "OUTILS PERSONNELS")}
          </div>
          <button
            className="ws-nav-link"
            onClick={() => openWorkspace("calendar")}
            title={l("التقويم والمهام", "Calendar & tasks", "Calendrier et tâches")}
          >
            <CalendarDays />
            <span>{l("تقويمي", "My calendar", "Mon calendrier")}</span>
            <b className="ws-mini-count">
              {app.consulateAppointments.length + app.flightBookings.length + app.debts.length}
            </b>
          </button>
          <button
            className="ws-nav-link"
            onClick={() => openWorkspace("notebook")}
            title={l("دفتر الملاحظات", "Notebook", "Carnet de notes")}
          >
            <NotebookPen />
            <span>{l("مفكرتي", "My notebook", "Mon carnet")}</span>
          </button>
          <div className="ws-sidebar-support">
            <span className="ws-gold-line" />
            <span>
              {l(
                "كل خدماتك، في مكان واحد.",
                "Every service. One workspace.",
                "Tous vos services, un seul espace.",
              )}
            </span>
            <a
              href={BRAND_CONFIG.proWebsiteUrl}
              target="_blank"
              rel="noreferrer"
            >
              ELFAZNI SERVICES PRO <ExternalLink size={13} />
            </a>
          </div>
        </div>
        <div className="ws-sidebar-bottom">
          <button
            onClick={() => auth.setIsUserProfileModalOpen(true)}
            title={l("الملف الشخصي", "My profile", "Mon profil")}
          >
            <span className="ws-avatar">
              <span>{auth.user?.displayName?.slice(0, 1) || "E"}</span>
              {auth.user?.avatarUrl && (
                <img
                  key={auth.user.avatarUrl}
                  src={auth.user.avatarUrl}
                  alt={l("الصورة الشخصية", "Profile photo", "Photo de profil")}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
            </span>
            <span>
              <strong>{auth.user?.displayName?.split("(")[0]?.trim()}</strong>
              <small>
                {l(
                  "إدارة مساحة العمل",
                  "Workspace account",
                  "Compte professionnel",
                )}
              </small>
            </span>
          </button>
          <button
            className="ws-collapse"
            onClick={props.onToggleSidebarCollapse}
            aria-label={l(
              "تغيير حجم القائمة",
              "Resize navigation",
              "Redimensionner le menu",
            )}
          >
            {props.isSidebarCollapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
        </div>
      </aside>
      <header
        className={`ws-topbar no-print ${props.isSidebarCollapsed ? "collapsed" : ""}`}
      >
        <div className="ws-topbar-title">
          <button
            className="ws-icon-btn ws-mobile-only"
            onClick={() => setMobile(true)}
            aria-label={l("فتح القائمة", "Open menu", "Ouvrir le menu")}
          >
            <Menu />
          </button>
          <span className="ws-topbar-logo" aria-hidden="true">
            <img src="/admin/crm/assets/logos/kit/elfazni-horizontal-on-white.svg" alt="" />
          </span>
          <div>
            <small>
              ELFAZNI <span>/</span> CRM
            </small>
            <h1>{nav.find((x) => x.id === app.activeTab)?.label}</h1>
          </div>
        </div>
        <button
          ref={triggerRef}
          className="ws-search-trigger"
          onClick={() => setSearch(true)}
        >
          <Search size={17} />
          <span>
            {l(
              "ابحث عن عميل أو معاملة…",
              "Search customers, bookings…",
              "Rechercher un client, un dossier…",
            )}
          </span>
          <kbd>⌘ K</kbd>
        </button>
        <div className="ws-topbar-actions" ref={menuRef}>
          <label className="ws-language">
            <span className="sr-only">{l("اللغة", "Language", "Langue")}</span>
            <select
              value={language}
              onChange={(e) =>
                setLanguage(e.target.value as "ar" | "en" | "fr")
              }
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </label>
          <button
            className="ws-icon-btn ws-mobile-only"
            onClick={() => setSearch(true)}
            aria-label={l("بحث", "Search", "Rechercher")}
          >
            <Search />
          </button>
          <button
            className="ws-icon-btn ws-bell"
            onClick={props.onOpenRemindersDrawer}
            aria-label={`${l("التذكيرات", "Reminders", "Rappels")} (${app.dueReminders.length + contactDueReminders.length})`}
          >
            <Bell />
            {(app.dueReminders.length + contactDueReminders.length) > 0 && (
              <span className="ws-reminder-count" aria-hidden="true">
                {app.dueReminders.length + contactDueReminders.length}
              </span>
            )}
          </button>
          <button
            className="ws-icon-btn is-logout"
            onClick={auth.logout}
            title={l("تسجيل الخروج", "Sign out", "Déconnexion")}
            aria-label={l("تسجيل الخروج", "Sign out", "Déconnexion")}
          >
            <LogOut />
          </button>
          <div className="ws-menu-anchor">
            <button
              className="ws-icon-btn"
              aria-expanded={menu === "settings"}
              aria-label={l("الإعدادات", "Settings", "Paramètres")}
              onClick={() => setMenu(menu === "settings" ? null : "settings")}
            >
              <Settings2 />
            </button>
            {menu === "settings" && (
              <div className="ws-dropdown">
                <BankDetailsShare compact/>
                <button
                  onClick={() => {
                    auth.setIsUserProfileModalOpen(true);
                    setMenu(null);
                  }}
                >
                  <UserRound />
                  {l("الملف الشخصي", "My profile", "Mon profil")}
                </button>
                {auth.canManageSystemUsers && (
                  <button
                    onClick={() => {
                      auth.setIsUserManagementModalOpen(true);
                      setMenu(null);
                    }}
                  >
                    <Users />
                    {l(
                      "إدارة المستخدمين",
                      "Manage users",
                      "Gérer les utilisateurs",
                    )}
                  </button>
                )}
                <button
                  onClick={() => {
                    props.onOpenBackupModal();
                    setMenu(null);
                  }}
                >
                  <Database />
                  {l("النسخ الاحتياطي", "Backup & restore", "Sauvegarde")}
                </button>
                {auth.canViewAccounting && (
                  <button
                    onClick={() => {
                      props.onOpenExchangeRatesModal();
                      setMenu(null);
                    }}
                  >
                    <ArrowRightLeft />
                    {l("أسعار الصرف", "Exchange rates", "Taux de change")}
                  </button>
                )}
                <button
                  onClick={() => {
                    props.onOpenCustomListsModal();
                    setMenu(null);
                  }}
                >
                  <ListFilter />
                  {l("تخصيص القوائم", "Custom lists", "Listes personnalisées")}
                </button>
                <button
                  onClick={() => {
                    openWorkspace("notebook");
                    setMenu(null);
                  }}
                >
                  <NotebookPen />
                  {l("دفتر الملاحظات", "Notebook", "Carnet de notes")}
                </button>
                <button
                  onClick={() => {
                    openWorkspace("calendar");
                    setMenu(null);
                  }}
                >
                  <CalendarDays />
                  {l("التقويم والمهام", "Calendar & tasks", "Calendrier et tâches")}
                </button>
                <a href="/admin">
                  <Building2 />
                  <span className="ws-dropdown-spread">
                    {l(
                      "لوحة إدارة الموقع",
                      "Website admin panel",
                      "Panneau d'administration",
                    )}
                    <ExternalLink size={13} />
                  </span>
                </a>
                <button
                  onClick={() => {
                    showAllSections(auth.user?.id || "guest");
                    setMenu(null);
                  }}
                >
                  <Eye />
                  {l(
                    "إظهار جميع الأقسام",
                    "Show all sections",
                    "Afficher toutes les sections",
                  )}
                </button>
                <button
                  onClick={() => {
                    auth.lockScreen();
                    setMenu(null);
                  }}
                >
                  <LockKeyhole />
                  {l("قفل الشاشة", "Lock workspace", "Verrouiller")}
                </button>
                <button onClick={auth.logout}>
                  <LogOut />
                  {l("تسجيل الخروج", "Sign out", "Déconnexion")}
                </button>
              </div>
            )}
          </div>
          <div className="ws-menu-anchor">
            <button
              className="ws-icon-btn"
              aria-label={l(
                "المستندات والطباعة",
                "Documents & print",
                "Documents et impression",
              )}
              aria-expanded={menu === "print"}
              onClick={() => setMenu(menu === "print" ? null : "print")}
            >
              <Printer />
            </button>
            {menu === "print" && (
              <div className="ws-dropdown">
                {printItems.map(([type, label]) => (
                  <button
                    key={type}
                    onClick={() => {
                      app.setPrintPreviewTarget({
                        type: type as any,
                        invoiceId: app.invoices[0]?.id,
                        customerId: app.customerProfiles[0]?.customerId,
                      });
                      setMenu(null);
                    }}
                  >
                    <Receipt />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {(consulate || flights) && (
            <div className="ws-menu-anchor">
              <button
                className="ws-btn ws-btn-primary"
                aria-label={l(
                  "إضافة معاملة",
                  "New transaction",
                  "Nouveau dossier",
                )}
                aria-expanded={menu === "add"}
                onClick={() => setMenu(menu === "add" ? null : "add")}
              >
                <Plus size={17} />
                <span className="ws-add-label">
                  {l("معاملة جديدة", "New transaction", "Nouveau dossier")}
                </span>
                <ChevronDown size={13} />
              </button>
              {menu === "add" && (
                <div className="ws-dropdown">
                  {consulate && (
                    <button onClick={startConsulate}>
                      <CalendarCheck />
                      {l(
                        "معاملة قنصلية",
                        "Consular service",
                        "Service consulaire",
                      )}
                    </button>
                  )}
                  {flights && (
                    <button onClick={startFlight}>
                      <Plane />
                      {l("حجز طيران", "Flight booking", "Réservation de vol")}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </header>
      <div
        className={`ws-period-bar no-print ${props.isSidebarCollapsed ? "collapsed" : ""}`}
      >
        <span>
          <CalendarDays size={15} />
          {l("فترة العرض", "Reporting period", "Période affichée")}
        </span>
        <select
          aria-label={l("الشهر", "Month", "Mois")}
          value={app.selectedMonth}
          onChange={(e) => app.setSelectedMonth(+e.target.value)}
        >
          <option value={0}>
            {l("جميع الشهور", "All months", "Tous les mois")}
          </option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {getMonthName(i + 1)}
            </option>
          ))}
        </select>
        <select
          aria-label={l("السنة", "Year", "Année")}
          value={app.selectedYear}
          onChange={(e) => app.setSelectedYear(+e.target.value)}
        >
          {Array.from(
            new Set([
              app.selectedYear,
              new Date().getFullYear() - 1,
              new Date().getFullYear(),
              new Date().getFullYear() + 1,
            ]),
          )
            .sort()
            .map((y) => (
              <option key={y}>{y}</option>
            ))}
        </select>
        <small>
          {l(
            "إدارة واضحة. خدمة أفضل.",
            "Clear operations. Better service.",
            "Une gestion claire. Un meilleur service.",
          )}
        </small>
      </div>
      {mobile && (
        <div className="ws-overlay no-print" onClick={() => setMobile(false)}>
          <aside className="ws-mobile-nav" onClick={(e) => e.stopPropagation()}>
            <div className="ws-mobile-nav-head">
              <img src="/admin/crm/assets/logos/kit/elfazni-horizontal-on-white.svg" alt="ELFAZNI SERVICES" />
              <button
                className="ws-icon-btn"
                onClick={() => setMobile(false)}
                aria-label={l("إغلاق", "Close", "Fermer")}
              >
                <X />
              </button>
            </div>
            {navLinks}
          </aside>
        </div>
      )}
      {search && (
        <div
          className="ws-overlay ws-command-overlay no-print"
          onClick={() => setSearch(false)}
        >
          <div
            className="ws-command"
            role="dialog"
            aria-modal="true"
            aria-label={l("البحث السريع", "Quick search", "Recherche rapide")}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ws-command-input">
              <Search />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={l(
                  "اسم العميل، الهاتف، رقم الحجز…",
                  "Customer, phone, booking reference…",
                  "Client, téléphone, référence…",
                )}
              />
              <button
                className="ws-icon-btn"
                onClick={() => setSearch(false)}
                aria-label={l("إغلاق", "Close", "Fermer")}
              >
                <X />
              </button>
            </div>
            <div className="ws-command-results">
              {q ? (
                records.length ? (
                  records.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => {
                        r.action();
                        setSearch(false);
                      }}
                    >
                      <UserRound />
                      <span>
                        <strong>{r.title}</strong>
                        <small>
                          {r.detail} · <bdi>{r.phone}</bdi>
                        </small>
                      </span>
                    </button>
                  ))
                ) : (
                  <p>
                    {l(
                      "لا توجد نتائج مطابقة.",
                      "No matching results.",
                      "Aucun résultat.",
                    )}
                  </p>
                )
              ) : (
                nav.map((n) => (
                  <button key={n.id} onClick={() => go(n.id)}>
                    <n.icon />
                    <span>{n.label}</span>
                  </button>
                ))
              )}
            </div>
            <footer>
              <Command size={13} />
              {l(
                "بحث موحّد في مساحة العمل",
                "Search your workspace",
                "Rechercher dans votre espace",
              )}
              <kbd>ESC</kbd>
            </footer>
          </div>
        </div>
      )}
      {/* Scheduler-style personal workspace: Calendar + Notebook + Tasks + Bookings */}
      <CalendarWorkspace
        open={workspace.open}
        initialTab={workspace.tab}
        onClose={() => setWorkspace((w) => ({ ...w, open: false }))}
      />
    </>
  );
};
