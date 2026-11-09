/**
 * ELFAZNI SERVICES — Central Navigation Matrix
 * Single source of truth for paths between Website, Admin Panel, CRM, and HUB.
 * Strictly adheres to Master Implementation Brief V5 and Brand Navigation Audit.
 */

export const APP_ROUTES = {
  website: {
    home: '/',
    services: '/#services',
    blog: '/blog',
    about: '/#about',
    contact: '/#contact-form',
    airlines: '/#airlines',
    consular: '/#consular-checklist',
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
  badge?: string;
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
  crm: {
    id: 'crm',
    nameAr: 'نظام إدارة العملاء (CRM)',
    nameEn: 'CRM Workspace',
    nameFr: 'Espace CRM',
    path: APP_ROUTES.crm.dashboard,
  },
  admin: {
    id: 'admin',
    nameAr: 'بوابة الإدارة والتحكم',
    nameEn: 'Control Portal',
    nameFr: 'Portail de Contrôle',
    path: APP_ROUTES.admin.dashboard,
  },
};
