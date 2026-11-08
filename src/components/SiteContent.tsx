import React from 'react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useLanguage } from '../context/LanguageContext';
export function SectionTitle({sectionId, children, ...props}: React.HTMLAttributes<HTMLHeadingElement> & {sectionId:string}) {
 const {settings}=useSiteSettings();
 const {language}=useLanguage();
 return <h2 {...props}>{settings.sectionTitles?.[sectionId]?.[language] || children}</h2>;
}
export function OrderedSections({children}: {children:React.ReactNode}) {
 const {settings}=useSiteSettings();
 const order=settings.sectionOrder || [];
 const elements=React.Children.toArray(children);
 return <>{elements.sort((a,b)=>{
  const rank=(el:React.ReactNode)=>{const id=React.isValidElement<{id?:string}>(el)?el.props.id:undefined;const n=order.indexOf(id||'');return n<0?999:n;};
  return rank(a)-rank(b);
 })}</>;
}
