export const FormatMoney = (value: number | string) =>
  `${Number(value || 0).toLocaleString("ru-RU")} ₽`;
