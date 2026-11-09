import fs from 'fs';
import path from 'path';

const themesPath = path.resolve('data/themes.json');
const raw = fs.readFileSync(themesPath, 'utf8');
const data = JSON.parse(raw);

const portal3Zones = {
  outerBackground: {
    type: 'radial_gradient',
    color: '#071629',
    image: '',
    scale: 100,
    fit: 'cover',
    overlay: {
      startColor: '#012247',
      middleColor: '#004AA5',
      endColor: '#071629',
      direction: 'to bottom',
      opacity: 85,
    },
  },
  menuPanel: {
    bgColor: '#FFFFFF',
    bgImage: '',
    opacity: 100,
    borderColor: '#E2E8F0',
    borderRadius: '30px',
    shadowIntensity: 'xl',
    headingColor: '#0B2E57',
    descriptionColor: '#5E7086',
    kickerColor: '#CC9048',
    buttonBg: '#F8FAFC',
    buttonTextColor: '#0B2E57',
    buttonBorderColor: '#D7E7F7',
    logoSize: 'md',
    logoVariant: 'horizontal-on-white',
    width: '520px',
    alignment: 'center',
  },
  sidePanel: {
    bgType: 'gradient',
    bgColor: '#004AA5',
    bgGradient: {
      enabled: true,
      type: 'radial',
      direction: 'to top',
      angle: 135,
      opacity: 0.95,
      stops: [
        { position: 0, color: '#004AA5', opacity: 0.95 },
        { position: 55, color: '#0B2E57', opacity: 0.95 },
        { position: 100, color: '#071629', opacity: 0.98 },
      ],
    },
    foregroundImage: '/assets/brand/3d/01-master-service-hero-transparent.png',
    illustrationScale: 100,
    illustrationOpacity: 100,
    illustrationRotation: 0,
    illustrationCustomX: 0,
    illustrationCustomY: 0,
    illustrationFit: 'contain',
    headingAr: 'بوابة الفزني سيرفيسز',
    headingEn: 'ELFAZNI SERVICES HUB',
    descriptionAr: 'خدمات السفر والمعاملات في تركيا',
    headingColor: '#FFFFFF',
    descriptionColor: '#E2E8F0',
    logoVariant: 'horizontal-on-blue',
  },
};

// Update drafts.portal
if (data.drafts && data.drafts.portal) {
  data.drafts.portal.backgroundImage = '';
  data.drafts.portal.outerBackground = portal3Zones.outerBackground;
  data.drafts.portal.menuPanel = portal3Zones.menuPanel;
  data.drafts.portal.sidePanel = portal3Zones.sidePanel;
}

// Update published.portal
if (data.published && data.published.portal) {
  data.published.portal.backgroundImage = '';
  data.published.portal.outerBackground = portal3Zones.outerBackground;
  data.published.portal.menuPanel = portal3Zones.menuPanel;
  data.published.portal.sidePanel = portal3Zones.sidePanel;
}

// Update presets if present
if (Array.isArray(data.presets)) {
  for (const preset of data.presets) {
    if (preset.id === 'official-elfazni') {
      preset.outerBackground = portal3Zones.outerBackground;
      preset.menuPanel = portal3Zones.menuPanel;
      preset.sidePanel = portal3Zones.sidePanel;
    }
  }
}

fs.writeFileSync(themesPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully updated data/themes.json with 3-Zone portal architecture and removed duplicate backgroundImage.');
