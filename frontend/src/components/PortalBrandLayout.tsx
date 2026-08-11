import type { ReactNode } from 'react';
import { SiteBrandStrip } from './SiteBrandFooter';

export function PortalBrandLayout({ children }: { children: ReactNode }) {
  return (
    <div className="portal-brand-shell">
      <div className="portal-brand-banner">
        <img
          src="/brand/malawian-mother.png"
          alt="Haroti Gas customer cooking with smart metered LPG"
        />
        <div className="portal-brand-banner-copy">
          <p>Haroti Gas</p>
          <h1>Safe, smart LPG for every home</h1>
        </div>
      </div>
      <div className="portal-brand-content">{children}</div>
      <SiteBrandStrip variant="light" />
    </div>
  );
}
