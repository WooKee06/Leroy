import type { DeliveryAddress } from '@shared/stores/addressStore';

/**
 * Единый текстовый формат адреса доставки.
 * Используется и в списке адресов, и в чекауте (deliveryAddress заказа).
 */
export function formatAddress(a?: DeliveryAddress): string {
  if (!a) return '';
  const parts = [`${a.city}, ${a.street} ${a.house}`];
  if (a.apartment) parts.push(`кв./офис ${a.apartment}`);
  if (a.postalCode) parts.push(a.postalCode);
  return parts.join(', ');
}
