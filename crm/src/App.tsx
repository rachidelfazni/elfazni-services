import { CrmStorageGate } from './components/CrmStorage';
import React, { useState } from "react";
import { VisibilitySection } from "./components/common/VisibilitySection";
import { useCopy } from "./i18n/useCopy";
import { AppProvider, useApp } from "./context/AppContext";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { WorkspaceNavbar as Navbar } from "./components/workspace/WorkspaceNavbar";
import { WorkspaceTools } from "./components/workspace/WorkspaceTools";
import { WorkspaceDashboard as KPICards } from "./components/workspace/WorkspaceDashboard";
import { TimelineView } from "./components/timeline/TimelineView";

import { ConsulateModal } from "./components/consulate/ConsulateModal";

import { FlightModal } from "./components/flights/FlightModal";

import { BackupModal } from "./components/modals/BackupModal";
import { ExchangeRatesModal } from "./components/modals/ExchangeRatesModal";
import { CustomListsModal } from "./components/modals/CustomListsModal";
import { CardSpotlightModal } from "./components/modals/CardSpotlightModal";
import { ReminderModal } from "./components/modals/ReminderModal";
import { RemindersDrawer } from "./components/reminders/RemindersDrawer";
import { UndoToast } from "./components/common/UndoToast";

import { TimelineStage } from "./types";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPortal } from "./components/auth/LoginPortal";
import { LockScreenModal } from "./components/auth/LockScreenModal";

const CustomersCRMModule = React.lazy(() =>
  import("./components/customers/CustomersCRMModule").then((module) => ({
    default: module.CustomersCRMModule,
  })),
);

const ConsulateModule = React.lazy(() =>
  import("./components/consulate/ConsulateModule").then((module) => ({
    default: module.ConsulateModule,
  })),
);

const FlightModule = React.lazy(() =>
  import("./components/flights/FlightModule").then((module) => ({
    default: module.FlightModule,
  })),
);

const DebtsTable = React.lazy(() =>
  import("./components/debts/DebtWorkspace").then((module) => ({
    default: module.DebtWorkspace,
  })),
);

const FinancialReports = React.lazy(() =>
  import("./components/reports/FinancialReports").then((module) => ({
    default: module.FinancialReports,
  })),
);

const InvoicesModule = React.lazy(() =>
  import("./components/invoices/InvoicesModule").then((module) => ({
    default: module.InvoicesModule,
  })),
);

const PrintPreviewModal = React.lazy(() =>
  import("./components/invoices/PrintPreviewModal").then((module) => ({
    default: module.PrintPreviewModal,
  })),
);

const TangibleShowcaseFooter = React.lazy(() =>
  import("./components/common/TangibleShowcaseFooter").then((module) => ({
    default: module.TangibleShowcaseFooter,
  })),
);

const UserProfileModal = React.lazy(() =>
  import("./components/auth/UserProfileModal").then((module) => ({
    default: module.UserProfileModal,
  })),
);

const UserManagementModal = React.lazy(() =>
  import("./components/auth/UserManagementModal").then((module) => ({
    default: module.UserManagementModal,
  })),
);

const MainContent: React.FC = () => {
  const {
    activeTab,
    printPreviewTarget,
    isConsulateModalOpen,
    setIsConsulateModalOpen,
    editingConsulate,
    setEditingConsulate,
    isFlightModalOpen,
    setIsFlightModalOpen,
    editingFlight,
    setEditingFlight,
    setPresetServiceType,
    setBookingContact,
  } = useApp();

  const { canViewAccounting } = useAuth();
  const { isRTL, t } = useLanguage();

  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isExchangeRatesModalOpen, setIsExchangeRatesModalOpen] =
    useState(false);
  const [isCustomListsModalOpen, setIsCustomListsModalOpen] = useState(false);
  const [isRemindersDrawerOpen, setIsRemindersDrawerOpen] = useState(false);
  const [presetConsulateStage, setPresetConsulateStage] =
    useState<TimelineStage>("registered");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('elfazni_crm_sidebar_width');
      if (saved) {
        const n = parseInt(saved, 10);
        if (!isNaN(n) && n >= 180 && n <= 420) return n;
      }
    }
    return 256;
  });

  const handleSidebarWidthChange = (width: number) => {
    const clamped = Math.max(180, Math.min(420, width));
    setSidebarWidth(clamped);
    if (typeof window !== 'undefined') {
      localStorage.setItem('elfazni_crm_sidebar_width', clamped.toString());
    }
  };

  const { l } = useCopy();
  const moduleTitles: Record<string, string> = {
    dashboard: l("لوحة العمل", "Workspace", "Espace de travail"),
    customers: l("ملفات العملاء", "Customers", "Clients"),
    consulate: l(
      "المعاملات القنصلية",
      "Consular services",
      "Services consulaires",
    ),
    flights: l("حجوزات الطيران", "Flight bookings", "Réservations de vols"),
    invoices: l("الفواتير", "Invoices", "Factures"),
    debts: l("المستحقات", "Outstanding balances", "Soldes à recevoir"),
    reports: l("التقارير المالية", "Financial reports", "Rapports financiers"),
    tools: l("أدوات العمل", "Workspace tools", "Outils de travail"),
  };

  const handleOpenConsulateWithStage = (
    stage: TimelineStage = "registered",
  ) => {
    setPresetConsulateStage(stage);
    setEditingConsulate(null);
    setIsConsulateModalOpen(true);
  };

  const mainOffsetStyle: React.CSSProperties = {
    [isRTL ? "marginRight" : "marginLeft"]: isSidebarCollapsed ? "80px" : `${sidebarWidth}px`,
  };

  return (
    <div className="crm-app-shell ws-professional min-h-screen bg-[#F8FAFC] flex flex-col text-[#0B2E57]">
      {/* Responsive Brand Navy Sidebar + White Topbar Shell */}
      <Navbar
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenExchangeRatesModal={() => {
          if (canViewAccounting) setIsExchangeRatesModalOpen(true);
        }}
        onOpenCustomListsModal={() => setIsCustomListsModalOpen(true)}
        onOpenRemindersDrawer={() => setIsRemindersDrawerOpen(true)}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebarCollapse={() =>
          setIsSidebarCollapsed(!isSidebarCollapsed)
        }
        sidebarWidth={sidebarWidth}
        onSidebarWidthChange={handleSidebarWidthChange}
      />

      {/* Main Content Area offset by RTL/LTR Sidebar on Desktop */}
      <div
        className="crm-main-wrapper flex-1 flex flex-col transition-all duration-150"
        style={mainOffsetStyle}
      >
        <main className="crm-main-container flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <a href="/portal" className="no-print inline-flex items-center gap-2 rounded-lg border border-[#C7DCF5] bg-white px-3 py-2 text-sm font-bold text-[#004AA5] hover:bg-[#eaf4ff]">
            <span aria-hidden="true">↗</span>
            {isRTL ? "بوابة إدارة الموقع" : "Site Management Portal"}
          </a>
          <VisibilitySection
            key={activeTab}
            sectionId={`module-${activeTab}`}
            title={moduleTitles[activeTab] || activeTab}
          >
            <React.Suspense
              fallback={
                <div className="ws-loading" role="status">
                  {t("workspace.loading")}
                </div>
              }
            >
              {/* Tab Specific Content */}
              {activeTab === "dashboard" && (
                <div className="space-y-6">
                  <KPICards>
                    <TimelineView
                      onOpenNewModal={handleOpenConsulateWithStage}
                      onEditItem={(item) => {
                        setEditingConsulate(item);
                        setIsConsulateModalOpen(true);
                      }}
                    />
                  </KPICards>
                </div>
              )}

              {activeTab === "customers" && <CustomersCRMModule />}
              {activeTab === "tools" && <WorkspaceTools />}

              {activeTab === "consulate" && (
                <ConsulateModule
                  onOpenNewModal={() =>
                    handleOpenConsulateWithStage("registered")
                  }
                  onEditItem={(item) => {
                    setEditingConsulate(item);
                    setIsConsulateModalOpen(true);
                  }}
                />
              )}

              {activeTab === "flights" && (
                <FlightModule
                  onOpenNewModal={() => {
                    setEditingFlight(null);
                    setIsFlightModalOpen(true);
                  }}
                  onEditItem={(item) => {
                    setEditingFlight(item);
                    setIsFlightModalOpen(true);
                  }}
                />
              )}

              {activeTab === "invoices" && <InvoicesModule />}

              {activeTab === "debts" && canViewAccounting && <DebtsTable />}

              {activeTab === "reports" && canViewAccounting && (
                <FinancialReports />
              )}
            </React.Suspense>
          </VisibilitySection>
        </main>

        {/* Brand Footer Showcase */}
        <VisibilitySection
          sectionId="company-hub"
          title={l(
            "المؤسسة والخدمات",
            "Company & services",
            "Entreprise et services",
          )}
          className="crm-institution-panel no-print mx-4 sm:mx-6 lg:mx-8 mb-6"
        >
          <React.Suspense
            fallback={
              <div className="ws-loading">{t("workspace.loading")}</div>
            }
          >
            <TangibleShowcaseFooter
              onStartService={(serviceType, isFlight) => {
                if (isFlight) {
                  setEditingFlight(null);
                  setIsFlightModalOpen(true);
                } else {
                  setPresetServiceType(serviceType);
                  handleOpenConsulateWithStage("registered");
                }
              }}
              onOpenBackupModal={() => setIsBackupModalOpen(true)}
              onOpenExchangeRatesModal={() => {
                if (canViewAccounting) setIsExchangeRatesModalOpen(true);
              }}
            />
          </React.Suspense>
        </VisibilitySection>
      </div>

      {/* Modals & Drawers */}
      <ConsulateModal
        isOpen={isConsulateModalOpen}
        onClose={() => {
          setBookingContact(null);
          setIsConsulateModalOpen(false);
          setEditingConsulate(null);
          setPresetServiceType(null);
        }}
        editItem={editingConsulate}
        presetStage={presetConsulateStage}
      />

      <FlightModal
        isOpen={isFlightModalOpen}
        onClose={() => {
          setBookingContact(null);
          setIsFlightModalOpen(false);
          setEditingFlight(null);
        }}
        editItem={editingFlight}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />

      {canViewAccounting && (
        <ExchangeRatesModal
          isOpen={isExchangeRatesModalOpen}
          onClose={() => setIsExchangeRatesModalOpen(false)}
        />
      )}

      <CustomListsModal
        isOpen={isCustomListsModalOpen}
        onClose={() => setIsCustomListsModalOpen(false)}
      />

      <CardSpotlightModal />

      <ReminderModal />

      <RemindersDrawer
        isOpen={isRemindersDrawerOpen}
        onClose={() => setIsRemindersDrawerOpen(false)}
      />

      {/* A4 Print & PDF Preview Modal */}
      {printPreviewTarget && (
        <React.Suspense fallback={null}>
          <PrintPreviewModal />
        </React.Suspense>
      )}

      {/* Instant Undo Toast */}
      <UndoToast />
    </div>
  );
};

const AppGate: React.FC = () => {
  const {
    isAuthenticated,
    canManageSystemUsers,
    isUserProfileModalOpen,
    setIsUserProfileModalOpen,
    isUserManagementModalOpen,
    setIsUserManagementModalOpen,
  } = useAuth();

  if (!isAuthenticated) {
    return <LoginPortal />;
  }

  return (
    <>
      <MainContent />
      <LockScreenModal />
      {isUserProfileModalOpen && (
        <React.Suspense fallback={null}>
          <UserProfileModal
            isOpen={isUserProfileModalOpen}
            onClose={() => setIsUserProfileModalOpen(false)}
            onOpenUserManagement={() => {
              if (canManageSystemUsers) setIsUserManagementModalOpen(true);
            }}
          />
        </React.Suspense>
      )}
      {canManageSystemUsers && isUserManagementModalOpen && (
        <React.Suspense fallback={null}>
          <UserManagementModal
            isOpen={isUserManagementModalOpen}
            onClose={() => setIsUserManagementModalOpen(false)}
            onOpenUserProfile={() => setIsUserProfileModalOpen(true)}
          />
        </React.Suspense>
      )}
    </>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CrmStorageGate>{initial => <AppProvider initial={initial}>
          <AppGate />
        </AppProvider>}</CrmStorageGate>
      </AuthProvider>
    </LanguageProvider>
  );
}
