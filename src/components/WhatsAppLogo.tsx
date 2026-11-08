import React from 'react';

export const WHATSAPP_LOGO_URL = '/assets/whatsapp.svg';

interface WhatsAppLogoProps {
  className?: string;
}

export const WhatsAppLogo: React.FC<WhatsAppLogoProps> = ({ className = 'w-5 h-5' }) => {
  return (
    <img
      src={WHATSAPP_LOGO_URL}
      alt=""
      aria-hidden="true"
      className={`inline-block shrink-0 object-contain select-none ${className}`}
    />
  );
};
