import { API_BASE } from "./client";

const SERVICE_PATH = `${API_BASE.replace(/\/+$/, "")}/cdek/service.php`;

export interface CdekCity {
  code: number;
  city: string;
  region?: string;
  country_code?: string;
}

export interface CdekOfficeLocation {
  address: string;
  city: string;
  city_code: number;
  longitude: number;
  latitude: number;
}

export interface CdekOfficeRaw {
  code: string;
  name: string;
  type: string;
  work_time?: string;
  have_cashless: boolean;
  have_cash: boolean;
  is_dressing_room: boolean;
  allowed_cod: boolean;
  location: CdekOfficeLocation;
}

export interface CdekOffice {
  code: string;
  name: string;
  type: "PVZ" | "POSTAMAT";
  work_time?: string;
  have_cashless: boolean;
  have_cash: boolean;
  is_dressing_room: boolean;
  allowed_cod: boolean;
  address?: string;
  city?: string;
  city_code?: number;
  location?: [number, number];
}

export class CdekApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "CdekApiError";
    this.status = status;
  }
}

/** Понятные пользователю сообщения вместо сырого ответа прокси. */
const FRIENDLY_ERROR: Record<number, string> = {
  400: "СДЭК не принял запрос. Измените запрос и попробуйте ещё раз.",
  401: "Сервис СДЭК не авторизован. Попробуйте позже.",
  403: "Доступ к сервису СДЭК ограничен.",
  404: "Сервис выбора пунктов СДЭК пока недоступен. Попробуйте позже.",
  429: "Слишком много запросов к СДЭК. Подождите немного.",
  500: "СДЭК временно недоступен. Попробуйте ещё раз.",
  502: "СДЭК временно недоступен. Попробуйте ещё раз.",
  503: "Сервис выбора пунктов ещё настраивается. Попробуйте позже.",
};

function parseServerMessage(text: string): string {
  try {
    const data = JSON.parse(text) as { message?: string | string[] };
    return Array.isArray(data.message)
      ? data.message.join(", ")
      : (data.message ?? "");
  } catch {
    return text.slice(0, 300);
  }
}

async function cdekRequest(path: string): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(`${SERVICE_PATH}${path}`, {
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new CdekApiError(
      0,
      "Не удалось связаться с сервисом СДЭК. Проверьте интернет и попробуйте ещё раз.",
    );
  }

  const text = await res.text();

  if (!res.ok) {
    // Технические детали оставляем в консоли, пользователю показываем текст.
    console.error(`CDEK ${res.status}: ${parseServerMessage(text)}`);
    throw new CdekApiError(
      res.status,
      FRIENDLY_ERROR[res.status] ??
        "Не удалось получить данные СДЭК. Попробуйте ещё раз.",
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    console.error("CDEK returned invalid JSON:", text.slice(0, 300));
    throw new CdekApiError(
      0,
      "СДЭК вернул некорректный ответ. Попробуйте ещё раз.",
    );
  }
}

function mapOffice(raw: CdekOfficeRaw): CdekOffice {
  return {
    code: raw.code,
    name: raw.name,
    type: raw.type === "POSTAMAT" ? "POSTAMAT" : "PVZ",
    work_time: raw.work_time,
    have_cashless: raw.have_cashless,
    have_cash: raw.have_cash,
    is_dressing_room: raw.is_dressing_room,
    allowed_cod: raw.allowed_cod,
    address: raw.location?.address,
    city: raw.location?.city,
    city_code: raw.location?.city_code,
    location: raw.location
      ? [raw.location.longitude, raw.location.latitude]
      : undefined,
  };
}

export async function searchCities(query: string): Promise<CdekCity[]> {
  const params = new URLSearchParams({
    action: "cities",
    country_codes: "RU",
    city: query,
    size: "10",
  });
  const data = (await cdekRequest(`?${params.toString()}`)) as CdekCity[];
  return Array.isArray(data) ? data : [];
}

export async function getOffices(
  cityCode: number,
  type?: "PVZ" | "POSTAMAT" | "ALL",
): Promise<CdekOffice[]> {
  const params = new URLSearchParams({
    action: "offices",
    city_code: String(cityCode),
    is_handout: "true",
    page: "0",
    size: "100",
  });
  if (type && type !== "ALL") {
    params.set("type", type);
  }
  const data = (await cdekRequest(`?${params.toString()}`)) as CdekOfficeRaw[];
  return Array.isArray(data) ? data.map(mapOffice) : [];
}
