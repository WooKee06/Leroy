import { makeAutoObservable } from "mobx";
import { leroyApi } from "@shared/api/leroyApi";
import type { AddressDto } from "@shared/api/models";
import { formatAddress } from "@shared/lib/address";

export type DeliveryKind =
  | "pickup_point"
  | "postamat"
  | "courier"
  | "post"
  | "store_pickup";

export type CarrierId = "sdek" | "5post" | "post_ru" | "seller";

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

export type AddressLabel = "home" | "work" | "other";

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
  home: "Дом",
  work: "Работа",
  other: "Другое",
};

export const DELIVERY_OPTIONS: DeliveryOption[] = [
  {
    id: "sdek-pvz",
    carrier: "sdek",
    carrierName: "СДЭК",
    kind: "pickup_point",
    title: "СДЭК — пункт выдачи",
    desc: "Получение в ближайшем ПВЗ",
    price: null,
    eta: "2–5 дней",
  },
  {
    id: "sdek-postamat",
    carrier: "sdek",
    carrierName: "СДЭК",
    kind: "postamat",
    title: "СДЭК — постамат",
    desc: "Круглосуточная выдача из постамата",
    price: null,
    eta: "2–5 дней",
  },
  {
    id: "sdek-courier",
    carrier: "sdek",
    carrierName: "СДЭК",
    kind: "courier",
    title: "СДЭК — курьер до двери",
    desc: "Доставка прямо по адресу",
    price: null,
    eta: "2–5 дней",
  },
  {
    id: "5post-postamat",
    carrier: "5post",
    carrierName: "5Post",
    kind: "postamat",
    title: "Постамат 5Post",
    desc: "Выдача в постаматах у «Пятёрочки»",
    price: null,
    eta: "2–6 дней",
  },
  {
    id: "post-ru",
    carrier: "post_ru",
    carrierName: "Почта России",
    kind: "post",
    title: "Почта России",
    desc: "В отделение или до двери",
    price: null,
    eta: "4–10 дней",
  },
  {
    id: "seller-pickup",
    carrier: "seller",
    carrierName: "Магазин",
    kind: "store_pickup",
    title: "Самовывоз из магазина",
    desc: "Забрать в точке продавца",
    price: 0,
    eta: "в день готовности",
  },
  {
    id: "seller-courier",
    carrier: "seller",
    carrierName: "Продавец",
    kind: "courier",
    title: "Курьер продавца",
    desc: "Экспресс-доставка по городу",
    price: null,
    eta: "в день заказа",
  },
];

/** Что присылает форма (без id — его выдаёт сервер). */
export type AddressInput = Omit<DeliveryAddress, "id" | "isDefault"> & {
  isDefault?: boolean;
};

class AddressStore {
  addresses: DeliveryAddress[] = [];
  loaded = false;
  loading = false;
  saving = false;
  error = "";

  /** id адреса, который редактируется (null — создание нового). */
  editingId: string | null = null;

  /** Управление bottom-sheet с формой. */
  formOpen = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  async load(force = false): Promise<void> {
    if (this.loaded && !force) return;
    this.loading = true;
    this.error = "";
    try {
      const res = await leroyApi.addresses();
      this.addresses = res.map((a: AddressDto) => ({ ...a }));
      this.loaded = true;
    } catch (e) {
      this.error =
        e instanceof Error ? e.message : "Не удалось загрузить адреса";
    } finally {
      this.loading = false;
    }
  }

  get count(): number {
    return this.addresses.length;
  }

  get defaultAddress(): DeliveryAddress | undefined {
    return this.addresses.find((a) => a.isDefault) ?? this.addresses[0];
  }

  /** Основной адрес одной строкой — для чекаута. */
  get defaultAddressText(): string {
    return formatAddress(this.defaultAddress);
  }

  get editing(): DeliveryAddress | undefined {
    return this.addresses.find((a) => a.id === this.editingId);
  }

  openForm(id: string | null = null): void {
    this.editingId = id;
    this.formOpen = true;
    this.error = "";
  }

  closeForm(): void {
    this.formOpen = false;
    this.editingId = null;
  }

  /** Создание или обновление адреса на сервере. Возвращает успех. */
  async save(input: AddressInput): Promise<boolean> {
    if (this.saving) return false;
    this.saving = true;
    this.error = "";
    try {
      let targetId: string;
      if (this.editingId) {
        const updated = await leroyApi.updateAddress(this.editingId, input);
        targetId = updated.id;
      } else {
        const created = await leroyApi.createAddress(input);
        targetId = created.id;
      }

      // 2. «сделать основным» — отдельным вызовом, уже по серверному id
      if (input.isDefault === true) {
        await leroyApi.setDefaultAddress(targetId);
      }

      // 3. перечитать список с сервера — источник правды
      await this.load(true);
      this.closeForm();
      return true;
    } catch (e) {
      this.error =
        e instanceof Error ? e.message : "Не удалось сохранить адрес";
      return false;
    } finally {
      this.saving = false;
    }
  }

  async remove(id: string): Promise<void> {
    this.error = "";
    try {
      await leroyApi.deleteAddress(id);
      if (this.editingId === id) this.closeForm();
      await this.load(true);
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Не удалось удалить адрес";
    }
  }

  /** Оптимистично переключаем «основной», при ошибке откатываем. */
  async setDefault(id: string): Promise<void> {
    const snapshot = this.addresses.map((a) => a.isDefault);
    this.addresses.forEach((a) => {
      a.isDefault = a.id === id;
    });
    try {
      await leroyApi.setDefaultAddress(id);
    } catch (e) {
      this.addresses.forEach((a, i) => {
        a.isDefault = snapshot[i];
      });
      this.error =
        e instanceof Error ? e.message : "Не удалось сделать адрес основным";
    }
  }
}

export const addressStore = new AddressStore();
