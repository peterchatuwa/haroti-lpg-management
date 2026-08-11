/** Base URL for the ERP web app (staff login, customer portal). */
export const ERP_BASE_URL =
  import.meta.env.VITE_ERP_BASE_URL ||
  (import.meta.env.PROD
    ? 'https://harotiholdingslimited.com/erp'
    : 'http://localhost:5173');

export const erpUrl = (path: string) =>
  `${ERP_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
