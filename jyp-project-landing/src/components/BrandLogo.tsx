import React from 'react';

interface BrandLogoProps {
  variant?: 'color' | 'white' | 'badge';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'color',
  size = 'md',
  className = ''
}) => {
  const sizeStyles = {
    sm: { img: 'h-7', badge: 'h-7 w-7' },
    md: { img: 'h-9 sm:h-10', badge: 'h-9 w-9 sm:h-10 sm:w-10' },
    lg: { img: 'h-12 sm:h-14', badge: 'h-12 w-12 sm:h-14 sm:w-14' },
    xl: { img: 'h-16 sm:h-20', badge: 'h-16 w-16 sm:h-20 sm:w-20' },
  }[size];

  // Square blue badge with white lettering
  if (variant === 'badge') {
    return (
      <div className={`relative inline-flex items-center shrink-0 ${className}`}>
        <img
          src="/assets/aistudio/image_967d6eb3.png"
          alt="J&P Periféricos S.A.C."
          className={`${sizeStyles.badge} object-contain rounded-xl shadow-xs`}
          loading="eager"
        />
      </div>
    );
  }

  // Footer / Dark surface variant: original logo enclosed in a clean white card so the blue text is 100% visible
  if (variant === 'white') {
    return (
      <div className={`inline-flex items-center bg-white px-3.5 py-1.5 rounded-xl shadow-xs select-none shrink-0 ${className}`}>
        <img
          src="/assets/aistudio/image_e0c29a30.png"
          alt="J&P Periféricos S.A.C."
          className={`${sizeStyles.img} w-auto object-contain`}
          loading="eager"
        />
      </div>
    );
  }

  // Default color version: authentic original image in full electric blue
  return (
    <div className={`relative inline-flex items-center select-none shrink-0 ${className}`}>
      <img
        src="/assets/aistudio/image_e0c29a30.png"
        alt="J&P Periféricos S.A.C."
        className={`${sizeStyles.img} w-auto object-contain`}
        loading="eager"
      />
    </div>
  );
};
