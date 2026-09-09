import { Navigate } from 'react-router-dom';

/** Legacy route — product catalogue lives on the store. */
export const ProductsPage = () => <Navigate to="/store" replace />;
