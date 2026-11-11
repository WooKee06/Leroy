# Доставка СДЭК: что нужно сделать на сервере

Клиентская часть уже готова и работает в двух режимах:

- **есть `POST /api/delivery/quote`** → цены, сроки и варианты берутся из ответа;
- **эндпоинта нет / СДЭК недоступен** → клиент показывает три варианта с плоской
  оценкой `350 ₽` (бесплатно от `5000 ₽`) и помечает сумму как предварительную.

Ниже — контракт, который клиент уже ожидает, и серверная реализация под него.

---

## 1. Габариты товара

Без веса и габаритов тариф не посчитать.

### `Product`

```ts
@Column({ type: 'int', default: 500 })
weightG: number;          // граммы

@Column({ type: 'int', default: 20 })
lengthCm: number;

@Column({ type: 'int', default: 15 })
widthCm: number;

@Column({ type: 'int', default: 10 })
heightCm: number;
```

Миграция:

```ts
await queryRunner.query(`
  ALTER TABLE products
    ADD COLUMN "weightG"  integer NOT NULL DEFAULT 500,
    ADD COLUMN "lengthCm" integer NOT NULL DEFAULT 20,
    ADD COLUMN "widthCm"  integer NOT NULL DEFAULT 15,
    ADD COLUMN "heightCm" integer NOT NULL DEFAULT 10
`);
```

Правила:

- значения по умолчанию нужны, чтобы старые товары не ломали расчёт;
- `weightG` — на **одну единицу**, не на весь заказ;
- в DTO создания/редактирования товара добавить те же поля с валидацией
  `@IsInt() @Min(1) @Max(100000)`;
- сид/админка должны дать реальные значения хотя бы для трёх текущих товаров;
- в ответ `GET /products/:id` поля можно не отдавать клиенту — они нужны только
  серверу.

---

## 2. Расчёт доставки

### `POST /api/delivery/quote`

Доступ: `JwtAuthGuard` (в корзине уже есть пользователь). Рейт-лимит: например
10 запросов/мин на пользователя.

Запрос (ровно это уже отправляет клиент):

```json
{
  "city": "Москва",
  "cityCode": 44,
  "subtotal": 5250,
  "items": [
    { "productId": "uuid", "quantity": 2 }
  ]
}
```

`cityCode` может отсутствовать — тогда искать город по строке через
`GET /v2/location/cities?city=...`. Если не найден — `400` с понятным текстом.

Ответ (клиент ждёт `data` из общего `TransformInterceptor`):

```json
{
  "options": [
    {
      "id": "cdek-136",
      "provider": "cdek",
      "kind": "pickup_point",
      "tariffCode": 136,
      "tariffName": "Посылка склад-склад",
      "title": "СДЭК — пункт выдачи",
      "price": 280,
      "currency": "RUB",
      "minDays": 2,
      "maxDays": 4,
      "eta": "2–4 дня",
      "fallback": false
    },
    {
      "id": "cdek-138",
      "provider": "cdek",
      "kind": "postamat",
      "tariffCode": 138,
      "price": 250,
      "minDays": 2,
      "maxDays": 4
    },
    {
      "id": "cdek-137",
      "provider": "cdek",
      "kind": "courier",
      "tariffCode": 137,
      "price": 490,
      "minDays": 2,
      "maxDays": 5
    }
  ],
  "city": "Москва",
  "cityCode": 44,
  "fallback": false,
  "expiresAt": "2026-11-11T12:15:00.000Z"
}
```

Как считать:

1. Загрузить товары из `items` (id, цена, `weightG`, габариты, `storeId`).
   Сумму брать из БД, а не из `subtotal` клиента — `subtotal` только для сверки.
2. Сгруппировать по магазину: у маркетплейса каждый продавец — отдельная
   отправка. Тариф = сумма тарифов по группам, срок = максимум по группам.
3. Для каждой группы:
   - вес = `Σ(weightG × quantity)`;
   - габариты: либо `max(length) × max(width) × max(height)` с запасом, либо
     суммирование объёмов и пересчёт в одну коробку (выбрать одну политику и
     описать в коде);
   - минимум для СДЭК: `weight ≥ 100 г`, стороны ≥ 1 см.
4. Вызвать `POST /v2/calculator/tarifflist`:

```json
{
  "type": 1,
  "currency": 1,
  "lang": "rus",
  "from_location": { "code": 44 },
  "to_location": { "code": 44 },
  "tariff_codes": [136, 137, 138],
  "packages": [
    {
      "weight": 1200,
      "length": 30,
      "width": 20,
      "height": 15
    }
  ]
}
```

5. Смапить тарифы в `pickup_point` / `postamat` / `courier`, округлить цену до
   рубля, `period_min`/`period_max` → `minDays`/`maxDays` и `eta`.

**Важно:** бесплатной доставки «от 5000 ₽» в обычном расчёте больше нет.
Формула `350 ₽ / 0 от 5000 ₽` остаётся **только** как fallback (п. 2.1).

### 2.1. Fallback

Если СДЭК недоступен (таймаут, 5xx, нет ключей, город не найден):

- вернуть `200`, а не `500`;
- три варианта с плоской ценой:
  `subtotal >= DELIVERY_FALLBACK_FREE_FROM ? 0 : DELIVERY_FALLBACK_BASE`;
- `fallback: true` в каждом варианте и в корне;
- залогировать причину;
- не кэшировать дольше 30 секунд.

Так checkout не блокируется, а клиент честно пишет «стоимость предварительная».

### 2.2. Кэш и `quoteId`

- Кэш на 5–10 минут по ключу
  `(cityCode, storeGroup, weightBucket, dimsBucket)`.
- В ответ добавить `quoteId` (uuid) и хранить снимок расчёта в таблице
  `delivery_quotes` (jsonb, `expiresAt` 15 мин). Это позволит `POST /orders`
  проверить цену без повторного вызова СДЭК.
- Джоб раз в час удаляет истёкшие `delivery_quotes`.

---

## 3. Создание заказа

`POST /api/orders` уже транзакционный (фаза 2). Добавить в `CreateOrderDto`:

```ts
@IsOptional() @IsUUID() deliveryQuoteId?: string;
@IsOptional() @IsString() pickupCode?: string;
@IsOptional() @IsString() deliveryKind?: 'pickup_point' | 'postamat' | 'courier';
@IsOptional() @IsNumber() deliveryPrice?: number; // только для сверки
```

Клиент уже отправляет:

```json
{
  "deliveryAddress": "Москва, Тверская 1",
  "deliveryMethod": "СДЭК — пункт выдачи",
  "deliveryProvider": "cdek",
  "deliveryTariff": "136",
  "deliveryPrice": 280,
  "pickupCode": "MSK123",
  "pickupAddress": "Москва, Тверская 1",
  "paymentMethod": "balance",
  "idempotencyKey": "…"
}
```

Правила сервера:

1. `deliveryPrice` **никогда** не брать из тела как истину. Загрузить
   `deliveryQuoteId`, проверить: принадлежит пользователю, не истёк, тариф
   существует, цена совпадает (±1 ₽). Иначе `409` и актуальный quote в теле.
2. Если `deliveryQuoteId` не передан (старый клиент) — пересчитать quote на
   сервере или использовать fallback.
3. Для `pickup_point`/`postamat` обязательны `pickupCode` и `pickupAddress`.
   Проверить точку через `GET /v2/deliverypoints?code=...` и сохранить
   **снимок** (имя, адрес, город, координаты, режим работы) — если СДЭК потом
   удалит точку, заказ всё равно покажет её.
4. Для `courier` обязателен реальный адрес.
5. Убрать из `orders.service.ts` строку

   ```ts
   const deliveryPrice = totalSum > 5000 ? 0 : 350;
   ```

   и брать цену из подтверждённого quote/fallback.
6. Записать в `Order`: `deliveryPrice`, `deliveryProvider`, `deliveryTariff`,
   `pickupCode`, `pickupAddress`. `total = товары + deliveryPrice`.
7. `deliveryMethod` формировать на сервере из `provider + kind`, а не из
   клиентской строки.

---

## 4. Отправление в СДЭК после оплаты

### `POST /api/delivery/order`

Вызывать не из HTTP-запроса покупателя, а после успешной оплаты:

- из `onOrderPaid` поставить задачу `delivery.create` в очередь/outbox;
- либо джоб раз в минуту ищет `paid` заказы без `Delivery`.

Тело (внутренний вызов): `{ orderId }`.

Логика:

1. Загрузить заказ, `Delivery`-снимок, позиции, магазины.
2. Если `delivery.cdekOrderUuid` уже есть — вернуть его (идемпотентность).
3. Проверить, что заказ оплачен и не отменён.
4. Собрать `POST /v2/orders`:
   - `number` = `order.orderNumber`;
   - `tariff_code` = сохранённый тариф;
   - `from_location` = склад продавца/платформы (env);
   - `to_location` = `pickupCode` для ПВЗ/постамата или адрес для курьера;
   - `packages` = позиции с весом/габаритами;
   - `recipient` = имя/телефон покупателя;
   - `delivery_recipient_cost` и т.п. по необходимости.
5. Сохранить `cdekOrderUuid`, `cdekNumber` (трек), `status`.
6. При ошибке — записать `failureReason`, повторить с exponential backoff
   (5 попыток), не теряя заказ.

Эндпоинт для ручного перезапуска: `POST /api/delivery/order/:orderId/retry`
(только админ).

### Что хранить

```ts
Delivery
  id uuid
  orderId uuid unique
  provider varchar            // cdek
  tariffCode int
  price decimal(10,2)
  cityCode int
  city varchar
  address text                // адрес получателя (курьер)
  pickupCode varchar
  pickupName varchar
  pickupAddress text
  pickupMeta jsonb            // снимок точки: координаты, режим работы
  weightG int
  lengthCm int
  widthCm int
  heightCm int
  cdekOrderUuid varchar
  trackingNumber varchar
  status varchar              // внутренний статус
  providerStatus varchar      // сырой статус СДЭК
  failureReason text
  createdAt, updatedAt
```

`Order.pickupCode/pickupAddress/trackingNumber/deliveryStatus` остаются
денормализованными для быстрого ответа клиенту.

---

## 5. Вебхук статусов

### `POST /api/delivery/cdek/webhook`

Публичный, без JWT. Защита:

- секрет в пути или заголовке: `?secret=...` / `X-Cdek-Secret`;
- сравнение `timingSafeEqual`;
- принимать только `type = ORDER_STATUS`;
- отвечать `200` быстро, обработку — асинхронно.

Тело СДЭК (упрощённо):

```json
{
  "type": "ORDER_STATUS",
  "uuid": "cdek-order-uuid",
  "attributes": {
    "number": "123456",
    "status_code": "DELIVERED",
    "status_name": "Доставлен",
    "date_time": "2026-11-11T12:00:00Z",
    "city_name": "Москва"
  }
}
```

Алгоритм:

1. Найти `Delivery` по `cdekOrderUuid`.
2. Записать событие в `delivery_events` с уникальным
   `(provider, externalEventId)` (id из тела или `uuid + status + date_time`),
   чтобы повтор не задвоил историю.
3. Обновить `Delivery.status`, `Delivery.providerStatus`,
   `Order.deliveryStatus`.
4. Смапить статус:
   - `CREATED`, `ACCEPTED`, `RECEIVED_AT_SHIPMENT_WAREHOUSE` → без смены
     `Order.status`;
   - `SENT_TO_TRANSIT`, `IN_TRANSIT`, `ARRIVED_AT_CITY` → `Order.status = SHIPPED`,
     проставить `shippedAt`, `OrderEvent(SHIPPED)`, уведомить покупателя;
   - `DELIVERED`, `RECEIVED` → `Order.status = DELIVERED`, `deliveredAt`,
     `OrderEvent(DELIVERED)`, уведомить;
   - `NOT_DELIVERED`, `RETURNED` → `deliveryStatus`, уведомить, но не
     отменять заказ автоматически.
5. Обновить `SellerOrder.status` по тем же правилам (использовать
   существующий `order-transitions.ts`, не писать статусы напрямую).
6. Вернуть `200` даже на неизвестный `uuid` (иначе СДЭК будет ретраить вечно),
   но залогировать.

---

## 6. Трек

### `GET /api/delivery/track/:orderId`

Доступ: владелец заказа, продавец этого заказа, админ. Ответ:

```json
{
  "orderId": "uuid",
  "provider": "cdek",
  "trackingNumber": "CDEK123456",
  "status": "in_transit",
  "statusLabel": "В пути",
  "pickupCode": "MSK123",
  "pickupAddress": "Москва, Тверская 1",
  "events": [
    { "code": "SENT_TO_TRANSIT", "name": "В пути", "date": "2026-11-10T10:00:00Z", "city": "Москва" }
  ]
}
```

- отдавать локальные `delivery_events`; если трек устарел — обновить через
  `GET /v2/orders?cdek_number=...` (не чаще раза в 10 минут);
- если СДЭК недоступен — вернуть `200` с локальными данными, без 5xx.

Клиент уже умеет показывать `trackingNumber`, `deliveryStatus` и таймлайн, даже
если `/delivery/track` временно недоступен.

---

## 7. Переменные окружения

```bash
CDEK_ACCOUNT=
CDEK_SECRET=
CDEK_API_URL=https://api.cdek.ru/v2
CDEK_SENDER_CITY_CODE=44
CDEK_SENDER_ADDRESS=
CDEK_SENDER_PHONE=
CDEK_WEBHOOK_SECRET=
DELIVERY_FALLBACK_BASE=350
DELIVERY_FALLBACK_FREE_FROM=5000
DELIVERY_QUOTE_TTL_SECONDS=900
```

Для тестов: `CDEK_API_URL=https://api.edu.cdek.ru/v2` и тестовые ключи.
На Render после добавления переменных нужен redeploy.

---

## 8. Что клиент уже делает (не менять контракт)

- `POST /api/delivery/quote` — при открытии checkout и при смене города/пункта.
- `POST /api/orders` — с `Idempotency-Key`, `deliveryProvider`,
  `deliveryTariff`, `deliveryPrice`, `pickupCode`, `pickupAddress`.
- `GET /api/orders/:id/events` — таймлайн («Заказ создан», «Оплачен»,
  «Отправлен», «Доставлен», «Отменён»).
- `POST /api/orders/:id/cancel` — отмена покупателем до отправки; сервер
  возвращает деньги на кошелёк и сток.
- `GET /api/delivery/track/:orderId` — опционально; при 404 клиент показывает
  данные из заказа.

Клиент устойчив к отсутствию эндпоинтов: quote → fallback, events → скрыть
историю, track → не показывать блок трека. Но без серверной части не будет
реальных цен, трек-номеров и статусов «в пути».

---

## 9. Чек-лист готовности

- [ ] `Product.weightG/lengthCm/widthCm/heightCm` + миграция + DTO.
- [ ] `POST /delivery/quote` считает СДЭК по городу и составу корзины.
- [ ] Fallback `350/0 от 5000` только при недоступности СДЭК, с флагом.
- [ ] `POST /orders` проверяет quote и не доверяет `deliveryPrice` клиента.
- [ ] ПВЗ сохраняется снимком и виден в заказе после удаления точки из СДЭК.
- [ ] `Delivery` + `delivery_events` + `delivery_quotes` созданы миграцией.
- [ ] После оплаты создаётся отправление, сохраняется трек-номер.
- [ ] Вебхук обновляет `Delivery`, `Order`, `SellerOrder`, пишет `OrderEvent`
      и уведомляет покупателя.
- [ ] `GET /delivery/track/:orderId` отдаёт трек и историю.
- [ ] Повторный вебхук/повторное создание отправления не задваивают данные.
- [ ] Цена доставки в заказе совпадает с quote; при изменении корзины —
      `409` и новый расчёт.
