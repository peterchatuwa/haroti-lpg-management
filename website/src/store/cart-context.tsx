import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CatalogItem } from '../lib/api';

export interface CartLine {
  sku: string;
  name: string;
  category: CatalogItem['category'];
  unitPrice: number;
  quantity: number;
  maxQuantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  addItem: (item: CatalogItem, quantity?: number) => void;
  setQuantity: (sku: string, quantity: number) => void;
  removeItem: (sku: string) => void;
  clearCart: () => void;
}

const STORAGE_KEY = 'haroti-cart-v1';

const CartContext = createContext<CartContextValue | null>(null);

function loadStoredLines(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => loadStoredLines());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  const addItem = useCallback((item: CatalogItem, quantity = 1) => {
    if (!item.inStock) return;
    setLines((prev) => {
      const existing = prev.find((l) => l.sku === item.sku);
      const max = Math.max(1, item.quantityAvailable);
      if (existing) {
        return prev.map((l) =>
          l.sku === item.sku
            ? { ...l, maxQuantity: max, quantity: Math.min(l.quantity + quantity, max) }
            : l,
        );
      }
      return [
        ...prev,
        {
          sku: item.sku,
          name: item.name,
          category: item.category,
          unitPrice: item.unitPrice,
          quantity: Math.min(quantity, max),
          maxQuantity: max,
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((sku: string, quantity: number) => {
    setLines((prev) =>
      prev
        .map((l) =>
          l.sku === sku
            ? { ...l, quantity: Math.min(Math.max(1, quantity), l.maxQuantity) }
            : l,
        )
        .filter((l) => l.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((sku: string) => {
    setLines((prev) => prev.filter((l) => l.sku !== sku));
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const itemCount = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines],
  );

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
    [lines],
  );

  const value = useMemo(
    () => ({
      lines,
      itemCount,
      subtotal,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
    }),
    [lines, itemCount, subtotal, addItem, setQuantity, removeItem, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
}
