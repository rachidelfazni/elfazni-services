/**
 * ELFAZNI SERVICES — Central Navigation Matrix (CRM)
 * Single source of truth for cross-app navigation between CRM, Admin Panel, Website, and HUB.
 */

export const APP_ROUTES = {
  website: {
    home: '/',
    services: '/#services',
    blog: '/blog',
  },
  hub: '/hub',
  admin: {
    dashboard: '/portal',
    login: '/portal/login',
  },
  crm: {
    dashboard: '/crm',
    login: '/portal/login?next=crm',
  },
  auth: {
    logout: '/api/auth/logout',
  },
} as const;

export interface AppDestination {
  id: 'website' | 'crm' | 'admin' | 'hub';
  nameAr: string;
  nameEn: string;
  nameFr: string;
  path: string;
}

export const APP_DESTINATIONS: Record<string, AppDestination> = {
  website: {
    id: 'website',
    nameAr: 'الموقع الإلكتروني',
    nameEn: 'Public Website',
    nameFr: 'Site Web Public',
    path: APP_ROUTES.website.home,
  },
  hub: {
    id: 'hub',
    nameAr: 'بوابة HUB',
    nameEn: 'HUB Gateway',
    nameFr: 'Portail HUB',
    path: APP_ROUTES.hub,
  },
  admin: {
    id: 'admin',
    nameAr: 'بوابة إدارة الموقع',
    nameEn: 'Management Portal',
    nameFr: 'Portail de Gestion',
    path: APP_ROUTES.admin.dashboard,
  },
  crm: {
    id: 'crm',
    nameAr: 'نظام إدارة العملاء (CRM)',
    nameEn: 'CRM Workspace',
    nameFr: 'Espace CRM',
    path: APP_ROUTES.crm.dashboard,
  },
};
