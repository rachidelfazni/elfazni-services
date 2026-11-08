export const homepageSections = {
  services: 'الخدمات',
  'consular-checklist': 'دليل المعاملات القنصلية',
  airlines: 'الحجوزات والسفر',
  'service-slides': 'معرض الخدمات',
  guides: 'الأدلة',
  'how-it-works': 'كيف نساعدك',
  work: 'أعمالنا',
  about: 'من نحن',
  faq: 'الأسئلة الشائعة',
  'contact-form': 'نموذج التواصل',
} as const;

export type HomepageSection = keyof typeof homepageSections;
