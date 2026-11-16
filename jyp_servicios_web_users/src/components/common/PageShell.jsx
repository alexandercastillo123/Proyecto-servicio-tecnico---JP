import React from 'react';

const WIDTHS = {
  xs: 'max-w-xl',
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-5xl',
  xl: 'max-w-6xl',
  '2xl': 'max-w-7xl',
  full: 'max-w-none',
};

const GAPS = {
  none: 'page-shell--gap-none',
  compact: 'page-shell--gap-compact',
  normal: '',
  loose: 'page-shell--gap-loose',
};

/**
 * Contenedor estándar de página.
 *
 * Centraliza ancho máximo, ritmo vertical y tipografía base para que
 * cada módulo no repita `w-full space-y-* max-w-* mx-auto`.
 */
const PageShell = ({
  as: Tag = 'div',
  width = 'full',
  gap = 'normal',
  className = '',
  children,
  ...rest
}) => {
  const classes = [
    'page-shell',
    'mx-auto',
    WIDTHS[width] || WIDTHS.full,
    GAPS[gap] || '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
};

export default PageShell;
export { PageShell };
