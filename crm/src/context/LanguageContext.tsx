import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

export type SupportedLanguage = 'ar' | 'en' | 'fr';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
  dir: 'rtl' | 'ltr';
  flag: string;
}

export const LANGUAGE_OPTIONS: Record<SupportedLanguage, LanguageOption> = {
  ar: {
    code: 'ar',
    label: 'Arabic',
    nativeLabel: 'العربية',
    dir: 'rtl',
    flag: '🇲🇦',
  },
  en: {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    dir: 'ltr',
    flag: '🇬🇧',
  },
  fr: {
    code: 'fr',
    label: 'French',
    nativeLabel: 'Français',
    dir: 'ltr',
    flag: '🇫🇷',
  },
};

const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  ar: {
    'workspace.loading': 'جارٍ تحميل مساحة العمل…',
    'workspace.institution': "معلومات المؤسسة والخدمات",
    'workspace.institutionHint': "الخدمات، معلومات الدفع، ووسائل التواصل",
    'workspace.analytics': "التحليلات التفصيلية",

    // Brand & General
    'brand.name': 'الفزني سيرفيسز',
    'brand.nameEn': 'ELFAZNI SERVICES',
    'brand.subtitle': 'منصة الإدارة الذكية والخدمات القنصلية والطيران',
    'brand.locations': 'الفزني للخدمات — إسطنبول',
    'brand.tagline': 'Travel • Tourism • Consular Services • Visa',
    'brand.disclaimer': 'خدمة مساعدة مستقلة ولا تمثل أي جهة حكومية.',

    // Navigation
    'nav.mainSections': 'الأقسام الرئيسية',
    'nav.dashboard': 'لوحة القيادة والتحليلات',
    'nav.dashboardSub': 'نظرة تنفيذية شاملة والخط الزمني الحر (Kanban)',
    'nav.customers': 'إدارة العملاء (CRM)',
    'nav.customersSub': 'ملفات العملاء، السجل المالي، الفواتير، وكشوف الحساب',
    'nav.consulate': 'مواعيد القنصلية',
    'nav.consulateSub': 'إدارة ملفات التأشيرات ومواعيد القنصليات والخدمات',
    'nav.flights': 'حجوزات الطيران',
    'nav.flightsSub': 'تذاكر السفر، خطوط الطيران، وأرقام الحجز PNR',
    'nav.invoices': 'الفواتير وكشوف الحساب',
    'nav.invoicesSub': 'إصدار الفواتير، الإيصالات، كشوف الحساب، والطباعة A4',
    'nav.debts': 'جدول الديون والمتبقي',
    'nav.debtsSub': 'متابعة المستحقات المالية وتسوية الدفعات المعلقة',
    'nav.reports': 'التقارير المالية الشاملة',
    'nav.reportsSub': 'كشوفات الأرباح والمبيعات والتقارير الدورية متعددة العملات',
    'nav.extraServices': 'الخدمات الإضافية (تسجيل سريع)',
    'nav.systemTools': 'أدوات النظام والإعدادات',
    'nav.userManagement': 'إدارة المستخدمين والأدوار',
    'nav.exchangeRates': 'أسعار الصرف المرجعية',
    'nav.customLists': 'تخصيص القوائم المنسدلة',
    'nav.backup': 'النسخ الاحتياطي والبيانات',
    'nav.visitWebsite': 'زيارة الموقع الرسمي',
    'nav.hide': 'إخفاء',
    'nav.show': 'إظهار',

    // Extra Services
    'service.residence': 'تجديد الإقامات',
    'service.hotels': 'حجوزات فنادق',
    'service.airport': 'توصيل إلى المطار',
    'service.translation': 'الترجمة المحلفة',
    'service.consulate': 'مواعيد القنصلية المغربية',
    'service.flights': 'حجوزات الطيران',
    'service.other': 'خدمات أخرى',

    // Topbar
    'topbar.searchPlaceholder': 'بحث سريع باسم العميل، الهاتف، رقم الحجز PNR، أو الفاتورة...',
    'topbar.noResults': 'لا توجد نتائج مطابقة لـ',
    'topbar.allMonths': 'كل الشهور',
    'topbar.quickAdd': 'إضافة معاملة',
    'topbar.newConsulate': '+ موعد قنصلية جديد',
    'topbar.newFlight': '+ حجز تذكرة طيران',
    'topbar.printAndPdf': 'الطباعة و PDF',
    'topbar.printMenuTitle': 'اختر نوع المستند للطباعة أو التنزيل (A4 PDF)',
    'topbar.doc1Title': '1. فاتورة عميل فردية (Invoice)',
    'topbar.doc1Sub': 'معاينة وطباعة فاتورة رسمية لعميل محدد',
    'topbar.doc2Title': '2. إيصال دفع واستلام (Receipt)',
    'topbar.doc2Sub': 'إيصال قبض رسمي للدفعات المستلمة من العميل',
    'topbar.doc3Title': '3. كشف حساب عميل (Statement)',
    'topbar.doc3Sub': 'كشف حساب مفصل لحركات ومدفوعات عميل واحد',
    'topbar.doc4Title': '4. التقرير المالي الشامل (Consolidated)',
    'topbar.doc4Sub': 'ملخص مالي تجميعي لجميع الحسابات حسب العملة',
    'topbar.doc5Title': '5. تقرير الأرصدة المتبقية والديون',
    'topbar.doc5Sub': 'كشف العملاء ذوي الذمم والأرصدة غير المسددة',
    'topbar.doc6Title': '6. تقرير المدفوعات والتحصيل الدوري',
    'topbar.doc6Sub': 'سجل المقبوضات النقدية والتحويلات البنكية للفترة',
    'topbar.openInvoicesCenter': 'فتح مركز الفواتير وكشوف الحساب الكامل ←',

    // Dashboard Welcome & KPIs
    'dash.welcome': 'مرحباً بعودتك،',
    'dash.subtitle': 'إليك ما يحدث في عمليات ومالية الفزني سيرفيسز اليوم',
    'dash.separateCurrencies': 'عملات مفصلة',
    'dash.unifiedView': 'المجموع الموحد',
    'dash.rateNote': 'سعر الصرف المرجعي:',
    'dash.kpi.totalCustomers': 'إجمالي العملاء المسجلين',
    'dash.kpi.activeTransactions': 'المعاملات النشطة الجارية',
    'dash.kpi.completedTransactions': 'المعاملات المنجزة',
    'dash.kpi.upcomingAppointments': 'المواعيد القنصلية القادمة',
    'dash.kpi.totalInvoiced': 'إجمالي المفوتر والمبيعات',
    'dash.kpi.paymentsCollected': 'المدفوعات المحصلة فعلياً',
    'dash.kpi.outstandingBalances': 'الأرصدة المتبقية (الديون)',
    'dash.kpi.pendingTasks': 'المهام والتذكيرات النشطة',
    'dash.kpi.fromLastPeriod': 'مقارنة بالفترة السابقة',
    'dash.kpi.collectionRate': 'معدل التحصيل',
    'dash.kpi.activeFiles': 'ملفات قيد المتابعة',
    'dash.kpi.clientsCount': 'عميل نشط',

    // Charts
    'chart.byCategoryTitle': 'توزيع المعاملات والإيرادات حسب الخدمة',
    'chart.byCategorySub': 'انقر على أي شريحة لتصفية جدول المعاملات أدناه',
    'chart.totalLabel': 'إجمالي المعاملات',
    'chart.topCategory': 'الخدمة الأكثر طلباً:',
    'chart.trendTitle': 'اتجاه المعاملات والأداء المالي',
    'chart.trendSub': 'تطور حجم العمليات والتحصيل عبر الزمن',
    'chart.period.daily': 'يومي',
    'chart.period.weekly': 'أسبوعي',
    'chart.period.monthly': 'شهري',
    'chart.period.yearly': 'سنوي',
    'chart.statusTitle': 'مقارنة حالات إنجاز المعاملات',
    'chart.statusSub': 'المعاملات المنجزة مقابل قيد المعالجة والملغاة',
    'chart.status.completed': 'منجزة ومكتملة',
    'chart.status.pending': 'قيد المعالجة والمتابعة',
    'chart.status.cancelled': 'ملغاة أو مرفوضة',
    'chart.multiCurrencyTitle': 'التحليل المالي متعدد العملات (بدون خلط العملات)',
    'chart.multiCurrencySub': 'الفواتير الصادرة، المبالغ المحصلة، والمتبقي لكل عملة على حدة',
    'chart.invoiced': 'إجمالي المفوتر',
    'chart.collected': 'المدفوع المحصل',
    'chart.outstanding': 'الرصيد المتبقي',
    'chart.serviceOverview': 'نظرة عامة على أداء الأقسام والخدمات',
    'chart.recentTransactions': 'أحدث المعاملات المسجلة',
    'chart.viewAll': 'عرض الكل',
    'chart.clearFilter': 'إلغاء التصفية',
    'chart.date': 'التاريخ',
    'chart.clientAndDesc': 'العميل والتفاصيل',
    'chart.category': 'الخدمة',
    'chart.paymentMethod': 'طريقة وحالة الدفع',
    'chart.amount': 'المبلغ',

    // Customers CRM
    'customers.title': 'إدارة العملاء الشاملة (Customer CRM)',
    'customers.subtitle': 'قاعدة بيانات العملاء الموحدة مع سجل المعاملات، المواعيد، المدفوعات، الفواتير، وكشوف الحساب',
    'customers.search': 'بحث باسم العميل، رقم الهاتف، أو معرف العميل...',
    'customers.filterCurrency': 'كل العملات',
    'customers.filterBalance': 'كل حالات الرصيد',
    'customers.hasBalance': 'عليه رصيد متبقي (مدين)',
    'customers.settled': 'خالص الذمة (مسدد بالكامل)',
    'customers.colClient': 'العميل',
    'customers.colPhone': 'رقم الهاتف',
    'customers.colServices': 'الخدمات المسجلة',
    'customers.colInvoices': 'الفواتير',
    'customers.colBilled': 'إجمالي المفوتر',
    'customers.colPaid': 'المدفوع',
    'customers.colOutstanding': 'المتبقي المستحق',
    'customers.colActions': 'الإجراءات السريعة',
    'customers.viewProfile': 'ملف العميل',
    'customers.newInvoice': 'إصدار فاتورة',
    'customers.printStatement': 'كشف حساب',
    'customers.tab.overview': 'نظرة عامة',
    'customers.tab.transactions': 'سجل المعاملات',
    'customers.tab.appointments': 'سجل المواعيد',
    'customers.tab.payments': 'سجل المدفوعات',
    'customers.tab.invoices': 'الفواتير وكشف الحساب',
    'customers.tab.actions': 'إجراءات سريعة',
  },
  en: {
    'workspace.loading': 'Loading workspace…',
    'workspace.institution': "Company & services",
    'workspace.institutionHint': "Services, payment information and contact details",
    'workspace.analytics': "Detailed analytics",

    // Brand & General
    'brand.name': 'ELFAZNI SERVICES',
    'brand.nameEn': 'الفزني سيرفيسز',
    'brand.subtitle': 'Smart CRM for Consular Appointments, Flights & Finance',
    'brand.locations': 'ELFAZNI SERVICES — Istanbul',
    'brand.tagline': 'Travel • Tourism • Consular Services • Visa',
    'brand.disclaimer': 'Independent support service and not affiliated with any governmental entity.',

    // Navigation
    'nav.mainSections': 'MAIN NAVIGATION',
    'nav.dashboard': 'Executive Dashboard',
    'nav.dashboardSub': 'Financial analytics, KPIs & interactive Kanban workflow',
    'nav.customers': 'Customers CRM',
    'nav.customersSub': 'Customer profiles, transaction history, invoices & statements',
    'nav.consulate': 'Consular Appointments',
    'nav.consulateSub': 'Manage visa files, consular appointments & extra services',
    'nav.flights': 'Flight Bookings',
    'nav.flightsSub': 'Airline tickets, routes, PNR codes & net profit tracking',
    'nav.invoices': 'Invoices & Statements',
    'nav.invoicesSub': 'Issue invoices, payment receipts, statements & A4 printing',
    'nav.debts': 'Outstanding Balances',
    'nav.debtsSub': 'Track receivables and settle pending customer balances',
    'nav.reports': 'Financial Reports',
    'nav.reportsSub': 'Multi-currency sales, profit & periodic payment reports',
    'nav.extraServices': 'EXTRA SERVICES (QUICK ADD)',
    'nav.systemTools': 'SYSTEM & SETTINGS',
    'nav.userManagement': 'Users & Role Permissions',
    'nav.exchangeRates': 'Reference Exchange Rates',
    'nav.customLists': 'Customize Dropdown Lists',
    'nav.backup': 'Backup & Data Restore',
    'nav.visitWebsite': 'Visit Official Website',
    'nav.hide': 'Hide',
    'nav.show': 'Show',

    // Extra Services
    'service.residence': 'Residence Permits',
    'service.hotels': 'Hotel Bookings',
    'service.airport': 'Airport Transfer',
    'service.translation': 'Sworn Translation',
    'service.consulate': 'Moroccan Consular Appts',
    'service.flights': 'Flight Bookings',
    'service.other': 'Other Services',

    // Topbar
    'topbar.searchPlaceholder': 'Quick search by customer name, phone, PNR, or invoice...',
    'topbar.noResults': 'No matching records for',
    'topbar.allMonths': 'All Months',
    'topbar.quickAdd': 'New Transaction',
    'topbar.newConsulate': '+ New Consular Appointment',
    'topbar.newFlight': '+ New Flight Booking',
    'topbar.printAndPdf': 'Print & PDF',
    'topbar.printMenuTitle': 'SELECT A4 DOCUMENT TO PRINT OR DOWNLOAD PDF',
    'topbar.doc1Title': '1. Individual Customer Invoice',
    'topbar.doc1Sub': 'Preview & print official bilingual invoice for a client',
    'topbar.doc2Title': '2. Official Payment Receipt',
    'topbar.doc2Sub': 'Print payment confirmation receipt for received funds',
    'topbar.doc3Title': '3. Customer Account Statement',
    'topbar.doc3Sub': 'Detailed chronological ledger of a customer’s account',
    'topbar.doc4Title': '4. Consolidated Financial Report',
    'topbar.doc4Sub': 'Executive multi-currency summary across all clients',
    'topbar.doc5Title': '5. Outstanding Balances Report',
    'topbar.doc5Sub': 'Receivables report of clients with unpaid balances',
    'topbar.doc6Title': '6. Periodic Payment Report',
    'topbar.doc6Sub': 'Chronological log of collected payments for the period',
    'topbar.openInvoicesCenter': 'Open Full Invoices & Statements Center →',

    // Dashboard Welcome & KPIs
    'dash.welcome': 'Welcome back,',
    'dash.subtitle': 'Here is what is happening with your operations and finances today.',
    'dash.separateCurrencies': 'By Currency',
    'dash.unifiedView': 'Converted Total',
    'dash.rateNote': 'Reference Rate:',
    'dash.kpi.totalCustomers': 'Total Customers',
    'dash.kpi.activeTransactions': 'Active Transactions',
    'dash.kpi.completedTransactions': 'Completed Transactions',
    'dash.kpi.upcomingAppointments': 'Upcoming Appointments',
    'dash.kpi.totalInvoiced': 'Total Invoiced & Sales',
    'dash.kpi.paymentsCollected': 'Payments Collected',
    'dash.kpi.outstandingBalances': 'Outstanding Balances',
    'dash.kpi.pendingTasks': 'Pending Tasks & Alerts',
    'dash.kpi.fromLastPeriod': 'vs previous period',
    'dash.kpi.collectionRate': 'Collection Rate',
    'dash.kpi.activeFiles': 'active files in pipeline',
    'dash.kpi.clientsCount': 'registered clients',

    // Charts
    'chart.byCategoryTitle': 'Transactions by Service Category',
    'chart.byCategorySub': 'Click any segment to filter the transactions list below',
    'chart.totalLabel': 'Total Files',
    'chart.topCategory': 'Top Service:',
    'chart.trendTitle': 'Business & Financial Trend',
    'chart.trendSub': 'Operational volume and revenue trajectory over time',
    'chart.period.daily': 'Daily',
    'chart.period.weekly': 'Weekly',
    'chart.period.monthly': 'Monthly',
    'chart.period.yearly': 'Yearly',
    'chart.statusTitle': 'Transactions Status Breakdown',
    'chart.statusSub': 'Completed vs. In-Progress vs. Cancelled/Rejected files',
    'chart.status.completed': 'Completed',
    'chart.status.pending': 'In Progress / Pending',
    'chart.status.cancelled': 'Cancelled / Rejected',
    'chart.multiCurrencyTitle': 'Multi-Currency Financial Ledger (Strict Separation)',
    'chart.multiCurrencySub': 'Invoiced totals, collected payments & outstanding balances per currency',
    'chart.invoiced': 'Total Invoiced',
    'chart.collected': 'Collected',
    'chart.outstanding': 'Outstanding',
    'chart.serviceOverview': 'Service Lines Performance Overview',
    'chart.recentTransactions': 'Recent Transactions',
    'chart.viewAll': 'View All',
    'chart.clearFilter': 'Clear Filter',
    'chart.date': 'Date',
    'chart.clientAndDesc': 'Customer & Description',
    'chart.category': 'Category',
    'chart.paymentMethod': 'Payment & Status',
    'chart.amount': 'Amount',

    // Customers CRM
    'customers.title': 'Customer Relationship Management (CRM)',
    'customers.subtitle': 'Unified directory of customers, transactions, appointments, payments, invoices & statements',
    'customers.search': 'Search by customer name, phone number, or client ID...',
    'customers.filterCurrency': 'All Currencies',
    'customers.filterBalance': 'All Balance States',
    'customers.hasBalance': 'Has Outstanding Balance',
    'customers.settled': 'Fully Settled (Zero Balance)',
    'customers.colClient': 'Customer',
    'customers.colPhone': 'Phone Number',
    'customers.colServices': 'Booked Services',
    'customers.colInvoices': 'Invoices',
    'customers.colBilled': 'Total Billed',
    'customers.colPaid': 'Total Paid',
    'customers.colOutstanding': 'Outstanding Balance',
    'customers.colActions': 'Quick Actions',
    'customers.viewProfile': 'Profile',
    'customers.newInvoice': 'New Invoice',
    'customers.printStatement': 'Statement',
    'customers.tab.overview': 'Overview',
    'customers.tab.transactions': 'Transaction History',
    'customers.tab.appointments': 'Appointment History',
    'customers.tab.payments': 'Payment History',
    'customers.tab.invoices': 'Invoices & Statements',
    'customers.tab.actions': 'Quick Actions',
  },
  fr: {
    'workspace.loading': 'Chargement de l’espace de travail…',
    'workspace.institution': "Entreprise et services",
    'workspace.institutionHint': "Services, informations de paiement et coordonnées",
    'workspace.analytics': "Analyses détaillées",

    // Brand & General
    'brand.name': 'ELFAZNI SERVICES',
    'brand.nameEn': 'الفزني سيرفيسز',
    'brand.subtitle': 'Plateforme CRM pour Rendez-vous Consulaires, Vols & Finances',
    'brand.locations': 'ELFAZNI SERVICES — Istanbul',
    'brand.tagline': 'Travel • Tourism • Consular Services • Visa',
    'brand.disclaimer': 'Service d’assistance indépendant non affilié à un organisme gouvernemental.',

    // Navigation
    'nav.mainSections': 'NAVIGATION PRINCIPALE',
    'nav.dashboard': 'Tableau de Bord',
    'nav.dashboardSub': 'Analytique financière, KPI et suivi Kanban interactif',
    'nav.customers': 'Gestion Clients (CRM)',
    'nav.customersSub': 'Dossiers clients, historique, factures et relevés de compte',
    'nav.consulate': 'Rendez-vous Consulaires',
    'nav.consulateSub': 'Gestion des dossiers visas, consulat et services additionnels',
    'nav.flights': 'Réservations de Vols',
    'nav.flightsSub': 'Billets d’avion, compagnies, codes PNR et marges nettes',
    'nav.invoices': 'Factures & Relevés',
    'nav.invoicesSub': 'Émission de factures, reçus, relevés clients et impression A4',
    'nav.debts': 'Soldes & Créances',
    'nav.debtsSub': 'Suivi des restes à payer et règlement des créances clients',
    'nav.reports': 'Rapports Financiers',
    'nav.reportsSub': 'Rapports multi-devises des ventes, bénéfices et encaissements',
    'nav.extraServices': 'SERVICES ADDITIONNELS',
    'nav.systemTools': 'SYSTÈME & PARAMÈTRES',
    'nav.userManagement': 'Utilisateurs & Rôles',
    'nav.exchangeRates': 'Taux de Change de Référence',
    'nav.customLists': 'Listes Personnalisées',
    'nav.backup': 'Sauvegarde & Données',
    'nav.visitWebsite': 'Visiter le Site Officiel',
    'nav.hide': 'Masquer',
    'nav.show': 'Afficher',

    // Extra Services
    'service.residence': 'Renouvellement Séjour',
    'service.hotels': 'Réservations Hôtels',
    'service.airport': 'Transfert Aéroport',
    'service.translation': 'Traduction Assermentée',
    'service.consulate': 'Rendez-vous Consulat Maroc',
    'service.flights': 'Billets d’Avion',
    'service.other': 'Autres Services',

    // Topbar
    'topbar.searchPlaceholder': 'Recherche rapide par client, téléphone, PNR ou facture...',
    'topbar.noResults': 'Aucun résultat pour',
    'topbar.allMonths': 'Tous les mois',
    'topbar.quickAdd': 'Nouvelle Opération',
    'topbar.newConsulate': '+ Nouveau RDV Consulaire',
    'topbar.newFlight': '+ Nouvelle Réservation Vol',
    'topbar.printAndPdf': 'Imprimer & PDF',
    'topbar.printMenuTitle': 'CHOISIR LE DOCUMENT A4 À IMPRIMER OU TÉLÉCHARGER',
    'topbar.doc1Title': '1. Facture Client Individuelle',
    'topbar.doc1Sub': 'Aperçu et impression de facture officielle pour un client',
    'topbar.doc2Title': '2. Reçu Officiel de Paiement',
    'topbar.doc2Sub': 'Reçu d’encaissement pour un paiement client',
    'topbar.doc3Title': '3. Relevé de Compte Client',
    'topbar.doc3Sub': 'Historique détaillé des opérations et paiements d’un client',
    'topbar.doc4Title': '4. Rapport Financier Consolidé',
    'topbar.doc4Sub': 'Synthèse financière globale par devise',
    'topbar.doc5Title': '5. Rapport des Soldes Impayés',
    'topbar.doc5Sub': 'Liste des clients ayant un solde restant à payer',
    'topbar.doc6Title': '6. Rapport Périodique des Paiements',
    'topbar.doc6Sub': 'Journal des encaissements reçus sur la période',
    'topbar.openInvoicesCenter': 'Ouvrir le Centre de Facturation Complet →',

    // Dashboard Welcome & KPIs
    'dash.welcome': 'Bon retour,',
    'dash.subtitle': 'Voici l’état de vos opérations et finances ELFAZNI SERVICES aujourd’hui.',
    'dash.separateCurrencies': 'Par Devise',
    'dash.unifiedView': 'Total Converti',
    'dash.rateNote': 'Taux Réf :',
    'dash.kpi.totalCustomers': 'Total Clients',
    'dash.kpi.activeTransactions': 'Opérations Actives',
    'dash.kpi.completedTransactions': 'Dossiers Terminés',
    'dash.kpi.upcomingAppointments': 'RDV Consulaires à Venir',
    'dash.kpi.totalInvoiced': 'Total Facturé & Ventes',
    'dash.kpi.paymentsCollected': 'Paiements Encaissés',
    'dash.kpi.outstandingBalances': 'Soldes Restants (Créances)',
    'dash.kpi.pendingTasks': 'Tâches & Rappels Actifs',
    'dash.kpi.fromLastPeriod': 'vs période précédente',
    'dash.kpi.collectionRate': 'Taux d’Encaissement',
    'dash.kpi.activeFiles': 'dossiers en cours',
    'dash.kpi.clientsCount': 'clients enregistrés',

    // Charts
    'chart.byCategoryTitle': 'Répartition par Catégorie de Service',
    'chart.byCategorySub': 'Cliquez sur un segment pour filtrer les transactions ci-dessous',
    'chart.totalLabel': 'Total Dossiers',
    'chart.topCategory': 'Service Principal :',
    'chart.trendTitle': 'Tendance des Opérations & Revenus',
    'chart.trendSub': 'Évolution du volume d’activité et des encaissements',
    'chart.period.daily': 'Jour',
    'chart.period.weekly': 'Semaine',
    'chart.period.monthly': 'Mois',
    'chart.period.yearly': 'Année',
    'chart.statusTitle': 'Comparaison des Statuts de Dossiers',
    'chart.statusSub': 'Dossiers terminés vs en cours vs annulés/refusés',
    'chart.status.completed': 'Terminés',
    'chart.status.pending': 'En Cours / En Attente',
    'chart.status.cancelled': 'Annulés / Refusés',
    'chart.multiCurrencyTitle': 'Grand Livre Multi-Devises (Séparation Stricte)',
    'chart.multiCurrencySub': 'Facturation, encaissements et soldes restants par devise (TRY, EUR, USD, MAD)',
    'chart.invoiced': 'Total Facturé',
    'chart.collected': 'Encaissé',
    'chart.outstanding': 'Reste à Payer',
    'chart.serviceOverview': 'Performance par Ligne de Service',
    'chart.recentTransactions': 'Transactions Récentes',
    'chart.viewAll': 'Voir Tout',
    'chart.clearFilter': 'Réinitialiser',
    'chart.date': 'Date',
    'chart.clientAndDesc': 'Client & Détails',
    'chart.category': 'Catégorie',
    'chart.paymentMethod': 'Paiement & Statut',
    'chart.amount': 'Montant',

    // Customers CRM
    'customers.title': 'Gestion de la Relation Client (CRM)',
    'customers.subtitle': 'Répertoire unifié des clients, transactions, rendez-vous, paiements, factures et relevés',
    'customers.search': 'Rechercher par nom, téléphone ou identifiant client...',
    'customers.filterCurrency': 'Toutes les Devises',
    'customers.filterBalance': 'Tous les Soldes',
    'customers.hasBalance': 'Avec Solde Impayé',
    'customers.settled': 'Solde Réglé (0)',
    'customers.colClient': 'Client',
    'customers.colPhone': 'Téléphone',
    'customers.colServices': 'Services',
    'customers.colInvoices': 'Factures',
    'customers.colBilled': 'Total Facturé',
    'customers.colPaid': 'Total Payé',
    'customers.colOutstanding': 'Reste à Payer',
    'customers.colActions': 'Actions Rapides',
    'customers.viewProfile': 'Profil',
    'customers.newInvoice': 'Facturer',
    'customers.printStatement': 'Relevé',
    'customers.tab.overview': 'Aperçu',
    'customers.tab.transactions': 'Transactions',
    'customers.tab.appointments': 'Rendez-vous',
    'customers.tab.payments': 'Paiements',
    'customers.tab.invoices': 'Factures & Relevés',
    'customers.tab.actions': 'Actions Rapides',
  },
};

const MONTH_NAMES: Record<SupportedLanguage, string[]> = {
  ar: [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليوز',
    'غشت',
    'شتنبر',
    'أكتوبر',
    'نونبر',
    'دجنبر',
  ],
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  fr: [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ],
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  dir: 'rtl' | 'ltr';
  isRTL: boolean;
  t: (key: string, fallback?: string) => string;
  getMonthName: (monthNumber: number) => string;
  formatLocalizedDate: (dateStr?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANG_STORAGE_KEY = 'elfazni_crm_lang_v1';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY) as SupportedLanguage | null;
      if (saved && (saved === 'ar' || saved === 'en' || saved === 'fr')) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'ar';
  });

  const dir: 'rtl' | 'ltr' = LANGUAGE_OPTIONS[language].dir;
  const isRTL = dir === 'rtl';

  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, language);
    } catch {
      // ignore
    }
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    document.body.dir = dir;
    if (language === 'ar') {
      document.body.style.fontFamily = '"Bahij TheSansArabic", "Bahij", "Poppins", sans-serif';
    } else {
      document.body.style.fontFamily = '"Poppins", "Bahij TheSansArabic", sans-serif';
    }
  }, [language, dir]);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
  };

  const t = useMemo(() => {
    return (key: string, fallback?: string): string => {
      const dict = TRANSLATIONS[language] || TRANSLATIONS.ar;
      return dict[key] || TRANSLATIONS.ar[key] || fallback || key;
    };
  }, [language]);

  const getMonthName = (monthNumber: number): string => {
    if (monthNumber === 0) return t('topbar.allMonths');
    const list = MONTH_NAMES[language] || MONTH_NAMES.ar;
    return list[monthNumber - 1] || String(monthNumber);
  };

  const formatLocalizedDate = (dateStr?: string): string => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const locale = language === 'ar' ? 'ar-MA' : language === 'fr' ? 'fr-FR' : 'en-GB';
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        dir,
        isRTL,
        t,
        getMonthName,
        formatLocalizedDate,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
};
