import React, { useState } from 'react';

export type BrandLogoVariant =
  | 'brand-white'
  | 'brand-dark'
  | 'primary-dark'
  | 'primary-darknight'
  | 'primary-pink'
  | 'white';

const LOGO_ASSET_MAP: Record<BrandLogoVariant, string> = {
  'brand-white': 'assets/aistudio/logo-brand-white_63e87d9f.svg',
  'brand-dark': 'assets/aistudio/logo-brand-dark_3b6f0deb.svg',
  'primary-dark': 'assets/aistudio/logo-primary-dark_cb508cc5.svg',
  'primary-darknight': 'assets/aistudio/logo-primary-darknight_a0d05102.svg',
  'primary-pink': 'assets/aistudio/logo-primary-pink_7f283958.svg',
  'white': 'assets/aistudio/logo-white_2d5f1be6.svg',
};

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  className?: string;
  alt?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'brand-white',
  className = 'h-8 w-auto object-contain',
  alt = 'CleanSlate',
}) => {
  const [hasError, setHasError] = useState(false);

  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const src = `${normalizedBase}${LOGO_ASSET_MAP[variant]}`;

  if (hasError) {
    const isLightText = variant === 'brand-white' || variant === 'white';
    return (
      <span
        className={`inline-flex items-center font-black tracking-wider uppercase text-sm whitespace-nowrap ${
          isLightText ? 'text-white' : 'text-[#3E4A4F]'
        }`}
      >
        CLEANSLATE
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      draggable={false}
      onError={() => setHasError(true)}
    />
  );
};
