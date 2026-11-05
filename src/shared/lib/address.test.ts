import { describe, it, expect } from 'vitest';
import { formatAddress } from './address';
import type { DeliveryAddress } from '@shared/stores/addressStore';

function makeAddress(overrides: Partial<DeliveryAddress> = {}): DeliveryAddress {
  return {
    id: '1',
    label: 'home',
    recipientName: 'Иван',
    phone: '+79990000000',
    city: 'Москва',
    street: 'Ленина',
    house: '10',
    isDefault: true,
    ...overrides,
  };
}

describe('formatAddress', () => {
  it('formats minimal address', () => {
    expect(formatAddress(makeAddress())).toBe('Москва, Ленина 10');
  });

  it('appends apartment and postal code', () => {
    expect(
      formatAddress(makeAddress({ apartment: '5', postalCode: '101000' })),
    ).toBe('Москва, Ленина 10, кв./офис 5, 101000');
  });

  it('returns empty string for undefined', () => {
    expect(formatAddress(undefined)).toBe('');
  });
});