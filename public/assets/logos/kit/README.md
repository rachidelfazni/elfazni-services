# ELFAZNI SERVICES — SVG Logo System

## تنبيه مهم
هذه ملفات SVG **متجهة تقريبية مشتقة آليًا من صور JPEG** المرفقة، وليست ملفات SVG الأصلية للشعار. تمت إزالة الخلفية البيضاء، وتحويل حدود الألوان إلى مسارات قابلة للتكبير. قد توجد فروق دقيقة في حواف الحروف والشعار بسبب ضغط JPEG. يُفضّل استبدالها بملفات SVG الرسمية الأصلية إن توفرت.

## النسخ الست

| الخلفية | أفقي | عمودي |
|---|---|---|
| بيضاء | `logos/elfazni-horizontal-on-white.svg` | `logos/elfazni-vertical-on-white.svg` |
| زرقاء | `logos/elfazni-horizontal-on-blue.svg` | `logos/elfazni-vertical-on-blue.svg` |
| ذهبية | `logos/elfazni-horizontal-on-gold.svg` | `logos/elfazni-vertical-on-gold.svg` |

كل SVG بخلفية شفافة؛ لون الخلفية يتم تعيينه بواسطة عنصر الصفحة وليس داخل ملف الشعار. النسخ الزرقاء والذهبية أعيد تلوينها من هندسة الشعار المرجعي، لأن بعض التفاصيل البيضاء ضاعت في نسخ JPEG السابقة.

## قواعد الاستخدام

- استخدم النسخة المطابقة للون خلفية الحاوية.
- استخدم الأفقي في Header وCRM وAdmin وHUB، والعمودي في البطاقات والأغلفة.
- لا تضع خلفية داخل ملف SVG.
- حافظ على `object-fit: contain` ونسب العرض.
- لا تضف توهجًا أو تأثيرات على الشعار.
- الألوان الرسمية: `#004AA5`, `#CC9048`, `#FFFFFF`؛ أزرق الخلفية الداكنة `#01336F`.

## React Example

```jsx
const logoAssets = {
  white: {horizontal: '/logos/elfazni-horizontal-on-white.svg', vertical: '/logos/elfazni-vertical-on-white.svg'},
  blue: {horizontal: '/logos/elfazni-horizontal-on-blue.svg', vertical: '/logos/elfazni-vertical-on-blue.svg'},
  gold: {horizontal: '/logos/elfazni-horizontal-on-gold.svg', vertical: '/logos/elfazni-vertical-on-gold.svg'},
};
export function BrandLogo({background='white',orientation='horizontal',className=''}) {
  return <img className={className} src={logoAssets[background][orientation]} alt="ELFAZNI SERVICES" style={{objectFit:'contain',maxWidth:'100%',height:'auto'}}/>;
}
```

## المعاينة
افتح `logo-showcase.html` بعد فك الضغط.
