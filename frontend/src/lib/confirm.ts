import type { ConfirmOptions } from '../store/confirm';
import { useConfirmStore } from '../store/confirm';

export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  return useConfirmStore.getState().request(options);
}
