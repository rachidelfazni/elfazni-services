import fs from 'node:fs';
import path from 'node:path';
import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import {
  readThemes,
  writeThemes,
  resolveEffectiveTheme,
  InterfaceTarget,
  InterfaceThemeConfig,
  ThemeAuditLog,
  ThemeVersion,
  ThemePreset,
  ThemeAsset,
  OFFICIAL_BRAND_COLORS,
  OFFICIAL_TYPOGRAPHY,
} from './themeStore';
import { getBearerUser, hasPermission } from './auth';

export const themeRouter = Router();

// Multer storage for Theme & Branding Media
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const themeStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, '_');
    const uniqueSuffix = `theme-${Date.now()}-${Math.round(Math.random() * 1e5)}`;
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

const themeUpload = multer({
  storage: themeStorage,
  limits: { fileSize: 12 * 1024 * 1024 }, // 12MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/avif'];
    const lowerName = file.originalname.toLowerCase();
    if (
      allowed.includes(file.mimetype) ||
      lowerName.endsWith('.svg') ||
      lowerName.endsWith('.avif') ||
      lowerName.endsWith('.webp') ||
      lowerName.endsWith('.png') ||
      lowerName.endsWith('.jpg') ||
      lowerName.endsWith('.jpeg')
    ) {
      cb(null, true);
    } else {
      cb(new Error('صيغة الملف غير مدعومة. يرجى رفع ملفات SVG، PNG، JPG، WebP، أو AVIF فقط'));
    }
  },
});

/**
 * Robust SVG Sanitizer: strips executable scripts, inline event handlers,
 * iframe/embed/foreignObject tags, and javascript: pseudo-protocols.
 */
export function sanitizeSvgContent(rawSvg: string): string {
  let cleaned = rawSvg;
  // Remove <script> tags and contents
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Remove dangerous tags like iframe, embed, object, foreignObject
  cleaned = cleaned.replace(/<\/?(iframe|embed|object|foreignObject)\b[^>]*>/gi, '');
  // Remove on* event handlers (e.g. onload, onerror, onclick)
  cleaned = cleaned.replace(/\s+on[a-z]+\s*=\s*(['"]).*?\1/gi, '');
  cleaned = cleaned.replace(/\s+on[a-z]+\s*=\s*[^>\s]+/gi, '');
  // Remove javascript: and other executable pseudo-protocols anywhere in attributes
  cleaned = cleaned.replace(/(href|xlink:href|src)\s*=\s*(["'])[\s\S]*?(?:javascript|vbscript|data:text\/html):[\s\S]*?\2/gi, '$1=""');
  cleaned = cleaned.replace(/(?:javascript|vbscript)\s*:/gi, 'blocked-protocol:');
  return cleaned;
}

/**
 * RBAC authorization middleware
 */
function requireThemePermission(permKey: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = getBearerUser(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'جلسة تسجيل الدخول غير صالحة أو منتهية' });
    }
    if (!hasPermission(user, permKey)) {
      return res.status(403).json({
        success: false,
        message: `ليس لديك الصلاحية المطلوبة (${permKey}) للوصول إلى إدارة المظهر والهوية`,
      });
    }
    (req as any).user = user;
    next();
  };
}

// =========================================================================
// 1. PUBLIC ENDPOINTS (Consumed by Website, HUB, Admin Login, CRM Login)
// =========================================================================

/**
 * GET /api/theme/published/:target
 * Returns the effective active published theme for an interface.
 */
themeRouter.get('/published/:target', (req: Request, res: Response) => {
  try {
    const target = req.params.target as InterfaceTarget;
    const db = readThemes();
    const effectiveTheme = resolveEffectiveTheme(target, false);
    const globalBrand = db.globalBrand;

    res.json({
      success: true,
      target,
      theme: effectiveTheme,
      globalBrand,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'خطأ في جلب المظهر النشط' });
  }
});

/**
 * GET /api/theme/presets
 * Returns public theme presets.
 */
themeRouter.get('/presets', (_req: Request, res: Response) => {
  try {
    const db = readThemes();
    res.json({ success: true, presets: db.presets });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================================
// 2. ADMIN THEME MANAGEMENT ENDPOINTS (Protected by RBAC)
// =========================================================================

/**
 * GET /api/theme/all
 * Returns all drafts, published configs, global brand, presets, versions, assets, and audit logs.
 */
themeRouter.get('/all', requireThemePermission('theme.view'), (_req: Request, res: Response) => {
  try {
    const db = readThemes();
    res.json({
      success: true,
      globalBrand: db.globalBrand,
      drafts: db.drafts,
      published: db.published,
      presets: db.presets,
      versions: db.versions,
      assets: db.assets,
      auditLogs: db.auditLogs.slice(-100),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/theme/preview/:target
 * Returns effective theme from draft for live builder preview without publishing.
 */
themeRouter.get('/preview/:target', requireThemePermission('theme.preview'), (req: Request, res: Response) => {
  try {
    const target = req.params.target as InterfaceTarget;
    const effectiveDraft = resolveEffectiveTheme(target, true);
    res.json({
      success: true,
      target,
      theme: effectiveDraft,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/theme/draft/:target
 * Saves changes as a draft without publishing to live visitors.
 */
themeRouter.put('/draft/:target', requireThemePermission('theme.edit'), (req: Request, res: Response) => {
  try {
    const target = req.params.target as InterfaceTarget;
    const user = (req as any).user;
    const updates = req.body as Partial<InterfaceThemeConfig>;

    const db = readThemes();
    const existing = db.drafts[target] || db.published[target];

    const mergedColors = { ...(existing?.colors || {}) };
    if (updates.colors) {
      for (const [k, v] of Object.entries(updates.colors)) {
        if (v === null || v === '' || v === undefined) {
          delete (mergedColors as any)[k];
        } else {
          (mergedColors as any)[k] = v;
        }
      }
    }

    const mergedTypography = { ...(existing?.typography || {}) };
    if (updates.typography) {
      for (const [k, v] of Object.entries(updates.typography)) {
        if (v === null || v === '' || v === undefined) {
          delete (mergedTypography as any)[k];
        } else {
          (mergedTypography as any)[k] = v;
        }
      }
    }

    const updatedConfig: InterfaceThemeConfig = {
      ...existing,
      ...updates,
      target,
      colors: mergedColors,
      typography: mergedTypography,
      texts: (() => {
        const merged: Record<string, Record<string, string>> = { ...(existing?.texts || {}) };
        if (updates.texts) {
          for (const [k, v] of Object.entries(updates.texts)) {
            merged[k] = { ...(merged[k] || {}), ...v };
          }
        }
        return merged;
      })(),
      outerBackground: updates.outerBackground !== undefined
        ? { ...(existing?.outerBackground || {}), ...updates.outerBackground }
        : existing?.outerBackground,
      menuPanel: updates.menuPanel !== undefined
        ? { ...(existing?.menuPanel || {}), ...updates.menuPanel }
        : existing?.menuPanel,
      sidePanel: updates.sidePanel !== undefined
        ? { ...(existing?.sidePanel || {}), ...updates.sidePanel }
        : existing?.sidePanel,
      updatedAt: new Date().toISOString(),
      updatedBy: user.username || user.displayName || 'admin',
    };

    db.drafts[target] = updatedConfig;

    if (target === 'global' && updates.colors) {
      db.globalBrand.colors = { ...db.globalBrand.colors, ...(updates.colors as any) };
      db.globalBrand.updatedAt = new Date().toISOString();
      db.globalBrand.updatedBy = user.username;
    }

    const log: ThemeAuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action: 'DRAFT_SAVE',
      target,
      actorUsername: user.username,
      timestamp: new Date().toISOString(),
      details: `تم حفظ مسودة مظهر [${updatedConfig.nameAr || target}]`,
    };
    db.auditLogs.push(log);

    writeThemes(db);

    res.json({
      success: true,
      message: 'تم حفظ المسودة بنجاح',
      draft: db.drafts[target],
      effectiveTheme: resolveEffectiveTheme(target, true),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/theme/publish/:target
 * Validates, publishes draft to live site, creates a snapshot version, and records audit log.
 */
themeRouter.post('/publish/:target', requireThemePermission('theme.publish'), (req: Request, res: Response) => {
  try {
    const target = req.params.target as InterfaceTarget;
    const user = (req as any).user;
    const { changeSummary } = req.body;

    const db = readThemes();
    const draft = db.drafts[target] || db.published[target];

    if (!draft) {
      return res.status(404).json({ success: false, message: 'لم يتم العثور على مسودة لنشرها' });
    }

    const newVersionNumber = (db.published[target]?.version || 0) + 1;
    const now = new Date().toISOString();

    const publishedConfig: InterfaceThemeConfig = {
      ...draft,
      version: newVersionNumber,
      updatedAt: now,
      updatedBy: user.username || user.displayName || 'admin',
    };

    db.published[target] = publishedConfig;
    db.drafts[target] = { ...publishedConfig };

    if (target === 'global') {
      db.globalBrand.colors = { ...db.globalBrand.colors, ...((publishedConfig.colors || {}) as any) };
      db.globalBrand.typography = { ...db.globalBrand.typography, ...((publishedConfig.typography || {}) as any) };
      db.globalBrand.updatedAt = now;
      db.globalBrand.updatedBy = user.username;

      // Automatically touch child interfaces that inherit from global
      const childTargets: InterfaceTarget[] = ['website', 'portal', 'admin_login', 'crm_login'];
      for (const ct of childTargets) {
        if (db.drafts[ct]?.inheritBrandColors !== false) {
          db.drafts[ct].updatedAt = now;
        }
        if (db.published[ct]?.inheritBrandColors !== false) {
          db.published[ct].updatedAt = now;
        }
      }
    }

    const versionSnapshot: ThemeVersion = {
      id: `ver_${target}_${Date.now()}`,
      target,
      versionNumber: newVersionNumber,
      snapshot: JSON.parse(JSON.stringify(publishedConfig)),
      publishedAt: now,
      publishedBy: user.username || 'admin',
      changeSummary: changeSummary || `نشر النسخة رقم ${newVersionNumber}`,
    };
    db.versions.unshift(versionSnapshot);

    const log: ThemeAuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action: 'PUBLISH',
      target,
      actorUsername: user.username,
      timestamp: now,
      details: `تم نشر النسخة #${newVersionNumber} من واجهة [${publishedConfig.nameAr || target}] للعامة بنجاح`,
    };
    db.auditLogs.push(log);

    writeThemes(db);

    res.json({
      success: true,
      message: `تم نشر التعديلات بنجاح (النسخة #${newVersionNumber})`,
      published: publishedConfig,
      version: versionSnapshot,
      effectiveTheme: resolveEffectiveTheme(target, false),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/theme/reset-property/:target
 * Resets a single property key back to inherited value from global brand.
 */
themeRouter.post('/reset-property/:target', requireThemePermission('theme.edit'), (req: Request, res: Response) => {
  try {
    const target = req.params.target as InterfaceTarget;
    const { property } = req.body;
    const user = (req as any).user;

    const db = readThemes();
    const draft = db.drafts[target];
    if (!draft) {
      return res.status(404).json({ success: false, message: 'الواجهة المحددة غير موجودة' });
    }

    if (property.startsWith('colors.')) {
      const colorKey = property.replace('colors.', '');
      if (draft.colors) {
        delete (draft.colors as any)[colorKey];
      }
    } else if (property.startsWith('typography.')) {
      const typoKey = property.replace('typography.', '');
      if (draft.typography) {
        delete (draft.typography as any)[typoKey];
      }
    } else if (property === 'outerBackground') {
      draft.outerBackground = undefined;
    } else if (property === 'menuPanel') {
      draft.menuPanel = undefined;
    } else if (property === 'sidePanel') {
      draft.sidePanel = undefined;
    } else {
      delete (draft as any)[property];
    }

    draft.updatedAt = new Date().toISOString();
    draft.updatedBy = user.username || 'admin';

    writeThemes(db);

    res.json({
      success: true,
      message: `تمت استعادة خاصية [${property}] من الهوية العامة بنجاح`,
      draft,
      effectiveTheme: resolveEffectiveTheme(target, true),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Helper to apply a preset's complete visual properties onto an InterfaceThemeConfig
 */
function applyPresetToInterfaceConfig(
  cfg: InterfaceThemeConfig,
  preset: ThemePreset,
  isGlobalScope: boolean,
  actorUsername: string,
  now: string
): InterfaceThemeConfig {
  const updated: InterfaceThemeConfig = {
    ...cfg,
    inheritBrandColors: isGlobalScope ? true : false,
    inheritTypography: isGlobalScope ? true : false,
    colors: { ...(preset.globalColors || {}) },
    typography: { ...(preset.typography || {}) },
    appliedPresetId: preset.id,
    appliedPresetName: preset.nameAr || preset.name,
    updatedAt: now,
    updatedBy: actorUsername,
  };

  if (preset.backgroundColor !== undefined) updated.backgroundColor = preset.backgroundColor;
  if (preset.backgroundImage !== undefined) updated.backgroundImage = preset.backgroundImage;
  if (preset.gradient) updated.gradient = JSON.parse(JSON.stringify(preset.gradient));
  if (preset.illustrationScale !== undefined) updated.illustrationScale = preset.illustrationScale;
  if (preset.illustrationPosition) updated.illustrationPosition = preset.illustrationPosition;
  if (preset.illustrationVerticalPosition) updated.illustrationVerticalPosition = preset.illustrationVerticalPosition;
  if (preset.illustrationFit) updated.illustrationFit = preset.illustrationFit;
  if (preset.logoVariant) updated.logoVariant = preset.logoVariant;
  if (preset.illustrationLogoVariant) updated.illustrationLogoVariant = preset.illustrationLogoVariant;
  if (preset.kickerColor) updated.kickerColor = preset.kickerColor;
  if (preset.titleColor) updated.titleColor = preset.titleColor;
  if (preset.noteColor) updated.noteColor = preset.noteColor;
  if (preset.formBg) updated.formBg = preset.formBg;
  if (preset.formTextColor) updated.formTextColor = preset.formTextColor;
  if (preset.formMutedColor) updated.formMutedColor = preset.formMutedColor;
  if (preset.inputBg) updated.inputBg = preset.inputBg;
  if (preset.inputBorder) updated.inputBorder = preset.inputBorder;
  if (preset.inputTextColor) updated.inputTextColor = preset.inputTextColor;
  if (preset.primaryButtonBg) updated.primaryButtonBg = preset.primaryButtonBg;
  if (preset.primaryButtonTextColor) updated.primaryButtonTextColor = preset.primaryButtonTextColor;

  if (preset.outerBackground) updated.outerBackground = JSON.parse(JSON.stringify(preset.outerBackground));
  if (preset.menuPanel) {
    updated.menuPanel = JSON.parse(JSON.stringify(preset.menuPanel));
    if (cfg.target !== 'portal') {
      updated.menuPanel.width = '480px';
    }
  }
  if (preset.sidePanel) {
    const spCopy = JSON.parse(JSON.stringify(preset.sidePanel));
    if (cfg.target === 'admin_login') {
      spCopy.foregroundImage = '/assets/brand/3d/02-consular-documents-transparent.png';
      spCopy.headingAr = 'الفزني سيرفيسز';
      spCopy.headingEn = 'ELFAZNI SERVICES';
      spCopy.descriptionAr = 'مدونة، خدمات، ولوحة إدارة محتوى الموقع.';
    } else if (cfg.target === 'crm_login') {
      spCopy.foregroundImage = '/assets/brand/3d/04-hotels-residency-transparent.png';
      spCopy.headingAr = 'الفزني CRM';
      spCopy.headingEn = 'ELFAZNI CRM';
      spCopy.descriptionAr = 'نظام إدارة العملاء والمعاملات والحجوزات والمالية.';
    }
    updated.sidePanel = spCopy;
    updated.illustrationUrl = spCopy.foregroundImage;
  }

  return updated;
}

/**
 * POST /api/theme/reset/:target
 * Resets an interface to inherit global settings and removes local overrides.
 */
themeRouter.post('/reset/:target', requireThemePermission('theme.edit'), (req: Request, res: Response) => {
  try {
    const target = req.params.target as InterfaceTarget;
    const user = (req as any).user;

    const db = readThemes();
    const existing = db.drafts[target] || db.published[target];
    const globalCfg = db.drafts.global || db.published.global;

    existing.inheritBrandColors = true;
    existing.inheritTypography = true;
    existing.colors = {};
    existing.typography = {};
    existing.appliedPresetId = undefined;
    existing.appliedPresetName = undefined;
    existing.backgroundColor = globalCfg?.backgroundColor || '#071629';
    existing.gradient = globalCfg?.gradient ? JSON.parse(JSON.stringify(globalCfg.gradient)) : undefined;
    existing.kickerColor = globalCfg?.kickerColor || '#CC9048';
    existing.titleColor = globalCfg?.titleColor || '#FFFFFF';
    existing.noteColor = globalCfg?.noteColor || '#E2E8F0';
    existing.formBg = globalCfg?.formBg || '#FFFFFF';
    existing.formTextColor = globalCfg?.formTextColor || '#0B2E57';
    existing.formMutedColor = globalCfg?.formMutedColor || '#5E7086';
    existing.inputBg = globalCfg?.inputBg || '#F8FAFC';
    existing.inputBorder = globalCfg?.inputBorder || '#D7E7F7';
    existing.inputTextColor = globalCfg?.inputTextColor || '#0B2E57';
    existing.primaryButtonBg = globalCfg?.primaryButtonBg || '#004AA5';
    existing.primaryButtonTextColor = globalCfg?.primaryButtonTextColor || '#FFFFFF';
    existing.illustrationScale = 100;
    existing.illustrationPosition = 'center';
    existing.illustrationVerticalPosition = 'center';
    existing.illustrationCustomX = 0;
    existing.illustrationCustomY = 0;
    existing.illustrationRotation = 0;
    existing.illustrationFit = 'contain';
    existing.illustrationClip = undefined;
    existing.updatedAt = new Date().toISOString();
    existing.updatedBy = user.username;

    db.drafts[target] = existing;

    const log: ThemeAuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action: 'RESET_GLOBAL',
      target,
      actorUsername: user.username,
      timestamp: new Date().toISOString(),
      details: `إعادة ربط الواجهة [${existing.nameAr || target}] بالهوية البصرية العامة وإلغاء التخصيصات الفردية`,
    };
    db.auditLogs.push(log);

    writeThemes(db);

    res.json({
      success: true,
      message: 'تمت استعادة إعدادات الهوية العامة بنجاح',
      draft: existing,
      effectiveTheme: resolveEffectiveTheme(target, true),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/theme/presets/apply/:presetId
 * Applies a theme preset completely to global or to a specific target interface.
 */
themeRouter.post(
  '/presets/apply/:presetId',
  requireThemePermission('theme.edit'),
  (req: Request, res: Response) => {
    try {
      const { presetId } = req.params;
      const { target, forceOverwriteLocal, autoPublish } = req.body;
      const user = (req as any).user;

      const db = readThemes();
      const preset = db.presets.find((p) => p.id === presetId);

      if (!preset) {
        return res.status(404).json({ success: false, message: 'القالب المحدد غير موجود' });
      }

      const now = new Date().toISOString();
      const actor = user.username || user.displayName || 'admin';
      const effectiveTarget: InterfaceTarget = (target as InterfaceTarget) || 'global';

      if (effectiveTarget === 'global') {
        db.globalBrand.colors = { ...preset.globalColors };
        db.globalBrand.typography = { ...preset.typography };
        db.globalBrand.updatedAt = now;
        db.globalBrand.updatedBy = actor;

        db.drafts.global = applyPresetToInterfaceConfig(db.drafts.global, preset, true, actor, now);
        db.published.global = applyPresetToInterfaceConfig(db.published.global, preset, true, actor, now);

        // Propagate to interfaces that inherit from global (or all if forceOverwriteLocal is true)
        const childInterfaces: InterfaceTarget[] = ['website', 'portal', 'admin_login', 'crm_login'];
        for (const iface of childInterfaces) {
          const draftCfg = db.drafts[iface];
          if (draftCfg && (draftCfg.inheritBrandColors !== false || forceOverwriteLocal)) {
            db.drafts[iface] = applyPresetToInterfaceConfig(draftCfg, preset, true, actor, now);
            if (autoPublish) {
              db.published[iface] = JSON.parse(JSON.stringify(db.drafts[iface]));
            }
          }
        }
      } else {
        if (!db.drafts[effectiveTarget]) {
          return res.status(404).json({ success: false, message: 'الواجهة المحددة غير موجودة' });
        }
        db.drafts[effectiveTarget] = applyPresetToInterfaceConfig(
          db.drafts[effectiveTarget],
          preset,
          false,
          actor,
          now
        );
        if (autoPublish) {
          const newVer = (db.published[effectiveTarget]?.version || 0) + 1;
          db.drafts[effectiveTarget].version = newVer;
          db.published[effectiveTarget] = JSON.parse(JSON.stringify(db.drafts[effectiveTarget]));
          db.versions.unshift({
            id: `ver_${effectiveTarget}_${Date.now()}`,
            target: effectiveTarget,
            versionNumber: newVer,
            snapshot: JSON.parse(JSON.stringify(db.published[effectiveTarget])),
            publishedAt: now,
            publishedBy: actor,
            changeSummary: `تطبيق ونشر القالب: ${preset.nameAr}`,
          });
        }
      }

      const log: ThemeAuditLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        action: 'PRESET_APPLY',
        target: effectiveTarget,
        actorUsername: actor,
        timestamp: now,
        details: `تطبيق القالب الجاهز: [${preset.nameAr}] على [${effectiveTarget}]`,
      };
      db.auditLogs.push(log);

      writeThemes(db);

      res.json({
        success: true,
        message: `تم تطبيق القالب [${preset.nameAr}] بنجاح`,
        preset,
        target: effectiveTarget,
        draft: db.drafts[effectiveTarget],
        effectiveTheme: resolveEffectiveTheme(effectiveTarget, true),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

/**
 * POST /api/theme/presets/create
 * Creates a new custom theme preset from scratch or from a full interface config snapshot.
 */
themeRouter.post('/presets/create', requireThemePermission('theme.edit'), (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const {
      name,
      nameAr,
      description,
      descriptionAr,
      globalColors,
      typography,
      sourceConfig,
    } = req.body;

    if (!name && !nameAr) {
      return res.status(400).json({ success: false, message: 'يرجى تقديم اسم القالب' });
    }

    const db = readThemes();
    const src: Partial<InterfaceThemeConfig> = sourceConfig || req.body || {};
    const mergedColors = {
      ...OFFICIAL_BRAND_COLORS,
      ...(src.colors || {}),
      ...(globalColors || {}),
    };

    const newPreset: ThemePreset = {
      id: `preset_custom_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      name: name || nameAr,
      nameAr: nameAr || name,
      description: description || descriptionAr || 'Custom administrator theme preset',
      descriptionAr: descriptionAr || description || 'قالب مخصص تم إنشاؤه وحفظه بواسطة مدير النظام',
      previewColors: [
        src.primaryButtonBg || mergedColors.primary || OFFICIAL_BRAND_COLORS.primary,
        src.kickerColor || mergedColors.gold || OFFICIAL_BRAND_COLORS.gold,
        src.formBg || mergedColors.surface || OFFICIAL_BRAND_COLORS.background,
        src.backgroundColor || mergedColors.secondary || OFFICIAL_BRAND_COLORS.secondary,
      ],
      globalColors: mergedColors,
      typography: { ...OFFICIAL_TYPOGRAPHY, ...(src.typography || {}), ...(typography || {}) },
      backgroundColor: src.backgroundColor || '#071629',
      backgroundImage: src.backgroundImage,
      gradient: src.gradient ? JSON.parse(JSON.stringify(src.gradient)) : undefined,
      illustrationUrl: src.illustrationUrl,
      illustrationScale: src.illustrationScale,
      illustrationPosition: src.illustrationPosition,
      illustrationVerticalPosition: src.illustrationVerticalPosition,
      illustrationFit: src.illustrationFit,
      logoVariant: src.logoVariant,
      illustrationLogoVariant: src.illustrationLogoVariant,
      kickerColor: src.kickerColor,
      titleColor: src.titleColor,
      noteColor: src.noteColor,
      formBg: src.formBg,
      formTextColor: src.formTextColor,
      formMutedColor: src.formMutedColor,
      inputBg: src.inputBg,
      inputBorder: src.inputBorder,
      inputTextColor: src.inputTextColor,
      primaryButtonBg: src.primaryButtonBg,
      primaryButtonTextColor: src.primaryButtonTextColor,
      isSystem: false,
      createdAt: new Date().toISOString(),
    };

    db.presets.push(newPreset);

    db.auditLogs.push({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action: 'PRESET_APPLY',
      target: 'preset',
      actorUsername: user?.username || 'admin',
      timestamp: new Date().toISOString(),
      details: `حفظ قالب مخصص جديد: [${newPreset.nameAr}]`,
    });

    writeThemes(db);

    res.json({ success: true, message: 'تم حفظ القالب الجديد بنجاح', preset: newPreset });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/theme/presets/duplicate/:presetId
 * Duplicates any preset (system or custom) into a new editable custom preset.
 */
themeRouter.post('/presets/duplicate/:presetId', requireThemePermission('theme.edit'), (req: Request, res: Response) => {
  try {
    const { presetId } = req.params;
    const { nameAr, name } = req.body || {};
    const db = readThemes();
    const original = db.presets.find((p) => p.id === presetId);
    if (!original) {
      return res.status(404).json({ success: false, message: 'القالب المحدد غير موجود' });
    }

    const copy: ThemePreset = {
      ...JSON.parse(JSON.stringify(original)),
      id: `preset_custom_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      name: name || `${original.name} (Copy)`,
      nameAr: nameAr || `${original.nameAr} (نسخة مخصصة)`,
      isSystem: false,
      createdAt: new Date().toISOString(),
    };

    db.presets.push(copy);
    writeThemes(db);
    res.json({ success: true, message: 'تم تكرار القالب بنجاح', preset: copy });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/theme/presets/:presetId
 * Renames or updates a custom preset.
 */
themeRouter.put('/presets/:presetId', requireThemePermission('theme.edit'), (req: Request, res: Response) => {
  try {
    const { presetId } = req.params;
    const { name, nameAr, description, descriptionAr } = req.body;
    const db = readThemes();
    const preset = db.presets.find((p) => p.id === presetId);
    if (!preset) {
      return res.status(404).json({ success: false, message: 'القالب غير موجود' });
    }
    if (nameAr) preset.nameAr = nameAr;
    if (name) preset.name = name;
    if (descriptionAr !== undefined) preset.descriptionAr = descriptionAr;
    if (description !== undefined) preset.description = description;

    writeThemes(db);
    res.json({ success: true, message: 'تم تحديث بيانات القالب بنجاح', preset });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/theme/presets/:presetId
 * Deletes a custom preset (System presets are protected).
 */
themeRouter.delete('/presets/:presetId', requireThemePermission('theme.edit'), (req: Request, res: Response) => {
  try {
    const { presetId } = req.params;
    const db = readThemes();
    const idx = db.presets.findIndex((p) => p.id === presetId);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'القالب غير موجود' });
    }
    if (db.presets[idx].isSystem) {
      return res.status(403).json({
        success: false,
        message: 'لا يمكن حذف القوالب الرسمية المعتمدة للنظام. يمكنك تكرارها وتعديل النسخة.',
      });
    }
    const [removed] = db.presets.splice(idx, 1);
    writeThemes(db);
    res.json({ success: true, message: `تم حذف القالب [${removed.nameAr}] بنجاح`, id: presetId });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================================
// 3. MEDIA & ASSET MANAGEMENT (Images, Logos, Illustrations)
// =========================================================================

/**
 * POST /api/theme/media/upload
 * Securely uploads image or SVG, sanitizes SVGs, registers in Media Library.
 */
themeRouter.post(
  '/media/upload',
  requireThemePermission('theme.assets.manage'),
  (req: Request, res: Response) => {
    themeUpload.single('file')(req, res, (err: any) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message || 'فشل رفع الملف' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'لم يتم إرفاق أي ملف' });
      }

      try {
        const user = (req as any).user;
        const filePath = req.file.path;
        const isSvg = req.file.mimetype === 'image/svg+xml' || req.file.originalname.toLowerCase().endsWith('.svg');

        // Sanitize SVG content
        if (isSvg) {
          const raw = fs.readFileSync(filePath, 'utf8');
          const sanitized = sanitizeSvgContent(raw);
          fs.writeFileSync(filePath, sanitized, 'utf8');
        }

        const category = (req.body.category as ThemeAsset['category']) || 'illustration';
        const fileUrl = `/uploads/${req.file.filename}`;

        const asset: ThemeAsset = {
          id: `asset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          url: fileUrl,
          category,
          uploadedAt: new Date().toISOString(),
          uploadedBy: user?.username || 'admin',
        };

        const db = readThemes();
        db.assets.unshift(asset);

        const log: ThemeAuditLog = {
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          action: 'ASSET_UPLOAD',
          target: 'asset',
          actorUsername: user?.username || 'admin',
          timestamp: new Date().toISOString(),
          details: `رفع ملف جديد: [${req.file.originalname}] (${req.file.mimetype})`,
        };
        db.auditLogs.push(log);

        writeThemes(db);

        res.json({
          success: true,
          message: 'تم رفع الملف والتحقق الأمني منه بنجاح',
          asset,
        });
      } catch (procErr: any) {
        res.status(500).json({ success: false, message: procErr.message || 'فشل معالجة الملف' });
      }
    });
  }
);

/**
 * GET /api/theme/media
 * Lists all assets in the Theme & Brand Media Library.
 */
themeRouter.get('/media', requireThemePermission('theme.view'), (_req: Request, res: Response) => {
  try {
    const db = readThemes();
    res.json({ success: true, assets: db.assets });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/theme/media/:id
 * Removes an asset from the media library and disk.
 */
themeRouter.delete(
  '/media/:id',
  requireThemePermission('theme.assets.manage'),
  (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      const db = readThemes();
      const index = db.assets.findIndex((a) => a.id === id);

      if (index === -1) {
        return res.status(404).json({ success: false, message: 'الملف غير موجود في المكتبة' });
      }

      const [removed] = db.assets.splice(index, 1);

      // Attempt to delete physical file if inside /uploads/
      if (removed.url.startsWith('/uploads/')) {
        const diskPath = path.join(process.cwd(), 'public', removed.url);
        if (fs.existsSync(diskPath)) {
          fs.unlinkSync(diskPath);
        }
      }

      const log: ThemeAuditLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        action: 'ASSET_DELETE',
        target: 'asset',
        actorUsername: user?.username || 'admin',
        timestamp: new Date().toISOString(),
        details: `حذف الملف [${removed.originalName}] من مكتبة الوسائط`,
      };
      db.auditLogs.push(log);

      writeThemes(db);

      res.json({ success: true, message: 'تم حذف الملف بنجاح', id });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);
