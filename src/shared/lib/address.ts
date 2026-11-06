import type { DeliveryAddress } from '@shared/stores/addressStore';

/**
 * Единый текстовый формат адреса доставки.
 * Используется и в списке адресов, и в чекауте (deliveryAddress заказа).
 */
export function formatAddress(a?: DeliveryAddress): string {
  if (!a) return '';
  const line = [a.street, a.house].filter(Boolean).join(' ').trim();
  const parts = [a.city, line].filter(Boolean);
  if (a.apartment) parts.push(`кв./офис ${a.apartment}`);
  if (a.postalCode) parts.push(a.postalCode);
  return parts.join(', ');
}
