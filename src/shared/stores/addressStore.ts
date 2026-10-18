import { makeAutoObservable } from 'mobx';

/**
 * Delivery addresses — UI-only (mock) for now.
 *
 * This store holds the address book and the list of available delivery options
 * entirely on the client, persisted to localStorage so testing survives reloads.
 * When the backend gets an addresses API, this store becomes a thin client for
 * `/api/addresses` and the local persistence goes away.
 */

export type DeliveryKind =
  | 'pickup_point'
  | 'postamat'
  | 'courier'
  | 'post'
  | 'store_pickup';

export type CarrierId = 'sdek' | '5post' | 'post_ru' | 'seller';

export interface DeliveryOption {
  id: string;
  carrier: CarrierId;
  carrierName: string;
  kind: DeliveryKind;
  title: string;
  desc: string;
  /** null — считается по тарифу перевозчика */
  price: number | null;
  eta: string;
}

export type AddressLabel = 'home' | 'work' | 'other';

export interface DeliveryAddress {
  id: string;
  label: AddressLabel;
  recipientName: string;
  phone: string;
  region?: string;
  city: string;
  street: string;
  house: string;
  apartment?: string;
  entrance?: string;
  floor?: string;
  intercom?: string;
  postalCode?: string;
  comment?: string;
  isDefault: boolean;
}

export const LABEL_TEXT: Record<AddressLabel, string> = {
  home: 'Дом',
  work: 'Работа',
  other: 'Другое',
};

export const DELIVERY_OPTIONS: DeliveryOption[] = [
  {
    id: 'sdek-pvz',
    carrier: 'sdek',
    carrierName: 'СДЭК',
    kind: 'pickup_point',
    title: 'СДЭК — пункт выдачи',
    desc: 'Получение в ближайшем ПВЗ',
    price: null,
    eta: '2–5 дней',
  },
  {
    id: 'sdek-postamat',
    carrier: 'sdek',
    carrierName: 'СДЭК',
    kind: 'postamat',
    title: 'СДЭК — постамат',
    desc: 'Круглосуточная выдача из постамата',
    price: null,
    eta: '2–5 дней',
  },
  {
    id: 'sdek-courier',
    carrier: 'sdek',
    carrierName: 'СДЭК',
    kind: 'courier',
    title: 'СДЭК — курьер до двери',
    desc: 'Доставка прямо по адресу',
    price: null,
    eta: '2–5 дней',
  },
  {
    id: '5post-postamat',
    carrier: '5post',
    carrierName: '5Post',
    kind: 'postamat',
    title: 'Постамат 5Post',
    desc: 'Выдача в постаматах у «Пятёрочки»',
    price: null,
    eta: '2–6 дней',
  },
  {
    id: 'post-ru',
    carrier: 'post_ru',
    carrierName: 'Почта России',
    kind: 'post',
    title: 'Почта России',
    desc: 'В отделение или до двери',
    price: null,
    eta: '4–10 дней',
  },
  {
    id: 'seller-pickup',
    carrier: 'seller',
    carrierName: 'Магазин',
    kind: 'store_pickup',
    title: 'Самовывоз из магазина',
    desc: 'Забрать в точке продавца',
    price: 0,
    eta: 'в день готовности',
  },
  {
    id: 'seller-courier',
    carrier: 'seller',
    carrierName: 'Продавец',
    kind: 'courier',
    title: 'Курьер продавца',
    desc: 'Экспресс-доставка по городу',
    price: null,
    eta: 'в день заказа',
  },
];

const STORAGE_KEY = 'leroy_addresses_v1';

const SEED_ADDRESSES: DeliveryAddress[] = [
  {
    id: 'seed-home',
    label: 'home',
    recipientName: 'Алексей Петров',
    phone: '+7 999 123-45-67',
    city: 'Москва',
    street: 'ул. Ленина',
    house: '10',
    apartment: '42',
    entrance: '2',
    floor: '5',
    intercom: '42К',
    postalCode: '101000',
    comment: 'Позвонить за 30 минут',
    isDefault: true,
  },
  {
    id: 'seed-work',
    label: 'work',
    recipientName: 'Алексей Петров',
    phone: '+7 999 123-45-67',
    city: 'Москва',
    street: 'Пресненская наб.',
    house: '12',
    apartment: '301',
    postalCode: '123112',
    isDefault: false,
  },
];

function makeId(): string {
  return `addr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

class AddressStore {
  addresses: DeliveryAddress[] = [];
  loaded = false;

  /** id адреса, выбранного по умолчанию (или идёт редактирование). */
  editingId: string | null = null;

  /** Управление bottom-sheet с формой. */
  formOpen = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  load(): void {
    if (this.loaded) return;
    this.loaded = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DeliveryAddress[];
        if (Array.isArray(parsed)) {
          this.addresses = parsed;
          return;
        }
      }
    } catch {
      // ignore corrupted storage and fall back to seed
    }
    this.addresses = SEED_ADDRESSES.map((a) => ({ ...a }));
    this.persist();
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.addresses));
    } catch {
      // storage unavailable — keep in memory only
    }
  }

  get count(): number {
    return this.addresses.length;
  }

  get defaultAddress(): DeliveryAddress | undefined {
    return this.addresses.find((a) => a.isDefault) ?? this.addresses[0];
  }

  get editing(): DeliveryAddress | undefined {
    return this.addresses.find((a) => a.id === this.editingId);
  }

  openForm(id: string | null = null): void {
    this.editingId = id;
    this.formOpen = true;
  }

  closeForm(): void {
    this.formOpen = false;
    this.editingId = null;
  }

  save(input: Omit<DeliveryAddress, 'id' | 'isDefault'> & { isDefault?: boolean }): void {
    const makeDefault = Boolean(input.isDefault);
    if (this.editingId) {
      const existing = this.addresses.find((a) => a.id === this.editingId);
      if (existing) {
        Object.assign(existing, input);
      }
    } else {
      this.addresses.push({
        ...input,
        id: makeId(),
        isDefault: false,
      });
    }

    const target =
      this.addresses.find((a) => a.id === this.editingId) ??
      this.addresses[this.addresses.length - 1];

    if (makeDefault && target) {
      this.setDefault(target.id);
    } else if (!this.addresses.some((a) => a.isDefault) && target) {
      target.isDefault = true;
    }

    this.persist();
    this.closeForm();
  }

  remove(id: string): void {
    const wasDefault = this.addresses.find((a) => a.id === id)?.isDefault;
    this.addresses = this.addresses.filter((a) => a.id !== id);
    if (wasDefault && this.addresses.length > 0) {
      this.addresses[0].isDefault = true;
    }
    if (this.editingId === id) this.closeForm();
    this.persist();
  }

  setDefault(id: string): void {
    for (const a of this.addresses) {
      a.isDefault = a.id === id;
    }
    this.persist();
  }
}

export const addressStore = new AddressStore();
