import React from 'react';

/**
 * Encabezado estándar de página.
 *
 * Mantiene el mismo ritmo visual (eyebrow, título, descripción y acciones)
 * en los módulos que no necesitan un hero personalizado.
 */
const PageHeader = ({
  eyebrow,
  icon: Icon,
  title,
  description,
  actions,
  badge,
  className = '',
}) => (
  <header className={`page-header ${className}`.trim()}>
    <div className="page-header__content">
      {eyebrow && (
        <span className="jyp-eyebrow">
          {Icon && <Icon size={13} aria-hidden="true" />}
          {eyebrow}
        </span>
      )}

      {(title || badge) && (
        <div className="page-header__title-row">
          {title && <h1 className="page-header__title">{title}</h1>}
          {badge}
        </div>
      )}

      {description && <p className="page-header__description">{description}</p>}
    </div>

    {actions && <div className="page-header__actions">{actions}</div>}
  </header>
);

export default PageHeader;
export { PageHeader };
