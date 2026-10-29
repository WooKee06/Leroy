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

async function cdekRequest(path: string): Promise<unknown> {
  const res = await fetch(`${SERVICE_PATH}${path}`);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Ошибка СДЭК: ${res.status} ${text.slice(0, 200)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("СДЭК вернул невалидный JSON");
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
