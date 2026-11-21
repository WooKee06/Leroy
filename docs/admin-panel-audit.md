# Аудит админ-панели и оставшегося бэклога Leroy

Дата: 21.11.2026 (первая версия — 20.11.2026). Репозитории: клиент `Leroy/`, сервер `LeroyServer/`.

Статус: **аудит текущего состояния репозиториев**. Phase A зафиксирована коммитами сервера `9e1e249`, `75ddfad` и клиента `1d818dd`, `5ca4fee`; Phase B — сервер `b8f12ea`, клиент `3a73707` (21.11.2026). Единственное исключение — сгенерированный `stats.html`, намеренно оставленный вне коммита.

Документ отвечает на три вопроса:

1. **Что уже сделано** по админ-панели и по проекту в целом.
2. **Что не сделано / сделано небезопасно**, с указанием файлов и приоритета.
3. **В каком порядке всё это закрывать**, с критериями готовности.

Номера строк приведены для состояния на 20.11.2026 и могут немного уехать после правок — опирайся в первую очередь на путь + имя функции/класса.

---

## 0. Краткое резюме

### Что уже реально работает

- Отдельный frontend-слой `/admin` со своим layout/sidebar, 15 маршрутами и guard'ом `RequireAdmin`.
- Все основные разделы админки существуют и ходят в реальные API, а не на моки:
  Overview, Moderation, Catalog, Sellers, Complaints, Orders, Users, Categories, Audit, Settings.
- Backend admin-модуль с 24 endpoints, все под `JwtAuthGuard + RolesGuard + @Roles(ADMIN)`.
- Таблицы `audit_logs`, `complaints` и moderation-поля в `products` / `stores` / `users`; миграция применена локально.
- Публичные товары скрыты до `moderationStatus = approved`; новые товары создаются с `pending_review + isActive=false`.
- Важные изменения товара после одобрения отправляют его обратно на модерацию.
- Пользовательская подача жалобы на товар: `ReportProductButton`.
- Status badge + модалка статуса магазина на публичной странице и в «Моём магазине».
- Редактирование магазина переведено на выбор файла + обрезку + upload вместо URL-инпутов.
- TON удалён, отзывы доступны только после покупки, адреса привязаны к профилю, есть skeletons и cache-busting картинок.
- Жёсткие таблицы переходов магазина/товара (Phase B): невалидное действие → `400`, повтор уже применённого → `409`. Админ видит только доступные в текущем статусе кнопки.
- Продавец может вернуть отклонённый магазин / черновик-или-отклонённый товар на повторную проверку; важные правки одобренного товара сбрасывают одобрение автоматически.
- Единый `AuditService` пишет `ip`/`requestId` в `audit_logs`; заглушки документов удалены, а не оставлены «визуально».

### Главные блокеры перед продом (P0)

1. ~~Self-approval через `PATCH /api/products/:id` и `PATCH /api/stores/:id`~~ — закрыто 21.11.2026: whitelist DTO + защита полей.
2. ~~Dev-auth может выпустить админский токен~~ — закрыто 21.11.2026: whitelist telegramId + prod fail-fast.
3. ~~Роль в JWT — снимок на 30 дней~~ — закрыто 21.11.2026: роль/статус читаются из БД на каждый запрос.
4. ~~Заблокированный/отклонённый магазин не скрывает свои товары~~ — закрыто 21.11.2026: публичные запросы фильтруют по статусу магазина.
5. ~~Жалобы могут одобрить товар/магазин и не транзакционны~~ — закрыто 21.11.2026: actions ограничены, смена статуса атомарна.
6. ~~Admin order status обходит логику отмены/возврата/рестора~~ — закрыто 21.11.2026: единый `changeOrderStatus`.
7. ~~Миграции готовы, но ещё не закоммичены~~ — закрыто 21.11.2026: обе миграции вошли в серверный коммит `9e1e249`.
8. ~~Публичные store endpoints отдают внутренние поля и данные владельца~~ — закрыто 21.11.2026: явный public DTO + preview только для владельца/админа.
9. ~~Нет production admin login~~ — закрыто 21.11.2026: отдельный `/api/auth/admin/telegram`, роль и статус проверяются сервером из БД.
10. ~~Нет rate limiting, CORS отражает любой origin, SVG в upload~~ — закрыто 21.11.2026: CORS-allowlist, throttler, magic-byte проверка + nosniff + квота.

### Оценка готовности

| Слой | Готовность | Комментарий |
|---|---:|---|
| Admin UI | ~85% | Прод-логин и все экраны есть; нет browser-smoke и admin unit-тестов |
| Admin API | ~95% | Роуты, аудит, бизнес-правила, public DTO и инфраструктура (CORS/throttle/upload) закрыты |
| Модерация | ~98% | Статусы, связь товар↔магазин, жалобы, order state machine и жёсткие таблицы переходов закрыты |
| Безопасность | ~95% | P0 закрыты, включая прод-логин; audit теперь с `ip`/`requestId`. Осталось DB-enforcement append-only |
| Тесты/QA | ~75% | 34 client-теста, admin unit-тестов нет; 11 server e2e (включая security/orders/phase-b), smoke ручной |
| Деплой/миграции | ~85% | 12 миграций, индексы и FK готовы и проверены на чистых БД; остался staging |

---

## 1. Легенда приоритетов

| Приоритет | Значение |
|---|---|
| **P0** | Блокер прода/безопасности/целостности данных. Делать первым. |
| **P1** | Важная логика, без которой админка работает «криво». |
| **P2** | UX, качество, оптимизации, технический долг. |
| **INFO** | Информация/решение, не задача. |

---

# Часть A. Что реализовано

## 2. Frontend админ-панели

### 2.1 Маршруты и доступ

Файл: `src/app/App.tsx:34-49, 68-82, 122-142`

| Путь | Компонент |
|---|---|
| `/admin/login` | `AdminLoginPage` (временный dev-вход) |
| `/admin` | `AdminOverviewPage` |
| `/admin/moderation` | `AdminModerationPage` |
| `/admin/moderation/:id` | `AdminProductDetailPage` |
| `/admin/catalog` | `AdminCatalogPage` |
| `/admin/catalog/:id` | `AdminProductDetailPage` |
| `/admin/sellers` | `AdminSellersPage` |
| `/admin/sellers/:id` | `AdminSellerDetailPage` |
| `/admin/complaints` | `AdminComplaintsPage` |
| `/admin/complaints/:id` | `AdminComplaintDetailPage` |
| `/admin/orders` | `AdminOrdersPage` |
| `/admin/users` | `AdminUsersPage` |
| `/admin/users/:id` | `AdminUserDetailPage` |
| `/admin/categories` | `AdminCategoriesPage` |
| `/admin/audit` | `AdminAuditPage` |
| `/admin/settings` | `AdminSettingsPage` |

Guard'ы:

- `RequireAdmin` — `src/shared/guards/RequireAdmin.tsx`: ждёт `accountStore.initialized`, неавторизованного → `/admin/login`, не-админа → экран «Доступ запрещён».
- `RequireRole` — `src/shared/guards/RequireRole.tsx`: используется для `/my-store` и `/role`.
- Dev-вход: `src/pages/admin/AdminLoginPage.tsx`, `accountStore.devLogin()`, `leroyApi.devAuth()`.

### 2.2 Разделы и действия

| Раздел | Что умеет |
|---|---|
| Overview | 8 метрик, выручка, последние аудит/жалобы/товары/магазины |
| Moderation / Catalog | Список товаров, поиск, фильтры статуса/категории/продавца/даты, серверная пагинация |
| Product detail | Галерея, характеристики, продавец, жалобы, история, 6 действий модерации с подтверждением и причиной |
| Sellers | Список + фильтр + пагинация; детали: товары, заказы, жалобы, история, 6 действий |
| Complaints | Список + фильтр + пагинация; детали, цель, история, 6 действий |
| Orders | Список + фильтр статуса, раскрывающиеся строки с товарами/адресом/доставкой, смена статуса |
| Users | Поиск, фильтры роли и статуса, блок/разблок, смена buyer↔seller, детали |
| Categories | Создание, редактирование, удаление, активность, sort order |
| Audit | Фильтры, пагинация, before→after, actor, причина |
| Settings | Информация об аккаунте, очереди, logout, статичные правила модерации |

Общие UI-примитивы: `src/shared/ui/admin/AdminUi.tsx` — `AdminCard`, `StatusBadge`, `AdminTable`, `Modal`, `ConfirmDialog`, `ReasonDialog`, `EmptyState`, `ErrorState`, `LoadingState`.

### 2.3 Связанные фичи вне `/admin`

- `src/features/complaints/ReportProductButton.tsx` — подача жалобы с товара.
- `src/shared/ui/store/StoreStatusBadge.tsx` — кликабельный статус магазина + модалка с объяснением правил публикации.
- `src/pages/storeEdit/StoreEditPage.tsx` — выбор файла + `ImageCropModal` + upload для аватарки/шапки.
- `src/pages/myStore/MyStorePage.tsx` — страница продавца, кнопка «Редактировать» восстановлена; кнопка «На проверку» для отклонённого магазина.
- `src/pages/myStore/TabComponents/Items/Items.tsx` — resubmit-кнопка у товаров в `draft`/`rejected`.

---

## 3. Backend админ-панели

### 3.1 Admin controller

Файл: `src/modules/admin/admin.controller.ts:32-215`.  
На **всех** роутах: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.ADMIN)`.

| Method | Path | Назначение |
|---|---|---|
| GET | `/api/admin/dashboard` | Метрики |
| GET | `/api/admin/sellers` | Список магазинов |
| GET | `/api/admin/sellers/:id` | Детали магазина |
| PATCH | `/api/admin/sellers/:id` | Модерация магазина |
| GET | `/api/admin/products` | Все товары |
| GET | `/api/admin/products/moderation/queue` | Очередь `pending_review + under_review` |
| GET | `/api/admin/products/:id` | Детали товара |
| GET | `/api/admin/products/:id/history` | История модерации |
| PATCH | `/api/admin/products/:id/moderate` | Решение по товару |
| GET | `/api/admin/orders` | Заказы |
| GET | `/api/admin/orders/:id` | Детали заказа + events |
| PATCH | `/api/admin/orders/:id/status` | Смена статуса |
| GET | `/api/admin/users` | Пользователи |
| GET | `/api/admin/users/:id` | Детали пользователя |
| PATCH | `/api/admin/users/:id/status` | Блок/разблок |
| PATCH | `/api/admin/users/:id/role` | Смена роли |
| GET | `/api/admin/complaints` | Жалобы |
| GET | `/api/admin/complaints/:id` | Детали жалобы |
| PATCH | `/api/admin/complaints/:id` | Решение + linked actions |
| GET | `/api/admin/audit` | Audit log |
| GET/POST | `/api/admin/categories` | Категории |
| PATCH/DELETE | `/api/admin/categories/:id` | Категории |

### 3.2 Публичные complaint endpoints

`src/modules/admin/complaints.controller.ts`:

- `POST /api/complaints` — авторизованный пользователь создаёт жалобу.
- `GET /api/complaints/mine` — свои жалобы.

### 3.3 Сущности и схема

- `src/entities/AuditLog.entity.ts` — append-only journal (в коде; на уровне БД не обеспечено), с 21.11 — `ip`/`requestId`.
- `src/entities/Complaint.entity.ts` — `targetType`, `reason`, `status`, `assigneeId`, `resolution`, `images`.
- `src/entities/ProductModerationStatus.ts`: `draft`, `pending_review`, `under_review`, `approved`, `rejected`, `blocked`, `archived`.
- `src/entities/StoreModerationStatus.ts`: `pending`, `under_review`, `verified`, `rejected`, `blocked`.
- `src/entities/UserStatus.ts`: `active`, `blocked`.
- `src/migrations/1795200000000-AddAdminModeration.ts` — enums, поля, бэкфилл, индексы, таблицы audit/complaints.
- `src/migrations/1795200000001-HardenAdminModeration.ts` — индексы и FK.
- `src/migrations/1795200000002-AddAuditRequestContext.ts` — `audit_logs.ip`, `audit_logs.requestId` + индекс.
- `src/modules/admin/moderation-transitions.ts` — жёсткие таблицы переходов магазина и товара.
- `src/common/audit/` — глобальный `AuditService`, единая append-only запись аудита с метаданными запроса.

---

## 4. Что уже проверено

### Команды

| Команда | Результат |
|---|---|
| Server `npx tsc -b` | OK |
| Server `npm run build` | OK |
| Server `npm run lint` | `eslint: command not found` — линтер не установлен |
| Client `npx tsc -b` | OK |
| Client `npm test` | 34/34 теста, 9 файлов |
| Client `npm run lint` | 0 errors, warnings only |
| Client `npm run build` | OK |
| `npm run migration:run` | Миграции применены локально |
| `npm run migration:show` / `migration:show:prod` | PASS (21.11.2026), все 12 applied на чистых БД (src и dist) |
| `npm run migration:revert` + `migration:run` | PASS (21.11.2026), hardening-миграция откатывается и применяется повторно |
| Server `npm run e2e:self-approval` | PASS (21.11.2026), self-approval → 400 |
| Server `npm run e2e:dev-auth` | PASS (21.11.2026), произвольный admin → 403, prod-флаг → fail-fast |
| Server `npm run e2e:role-status` | PASS (21.11.2026), старый токен видит новую роль/блок, self-demotion → 403 |
| Server `npm run e2e:store-visibility` | PASS (21.11.2026), pending/blocked скрыты, restore после verify |
| Server `npm run e2e:complaint` | PASS (21.11.2026), actions ограничены, состояние/аудит/уведомления откатываются вместе |
| Server `npm run e2e:admin-order` | PASS (21.11.2026), state machine, общий change, seller sync, refund/restock, event/audit/notification |
| Server `npm run e2e:orders` | PASS (21.11.2026), 53/53 после обновления фикстуры под 5.4 и отдельного dev-auth лимита |
| Server `npm run e2e:public-dto` | PASS (21.11.2026), store/product/category payloads очищены, owner preview сохранён |
| Server `npm run e2e:security` | PASS (21.11.2026), CORS allow/deny/без Origin, nosniff, magic bytes, 429 на burst, health без лимита, квота 3/3 |
| Server `npm run e2e:admin-login` | PASS (21.11.2026), 7/7: прод-вход админа, доступ к dashboard, отказ buyer/заблокированного/неизвестного аккаунта |
| Server `npm run e2e:phase-b` | PASS (21.11.2026), 6/6: жёсткие переходы и повторы → 409, resubmit только владельцем, `ip`/`requestId` в аудите, важные правки, уведомление владельца, unblock |

### Runtime smoke (backend, `ALLOW_DEV_AUTH=true`)

- `/api/admin/dashboard` без токена → `401`
- с токеном buyer → `403`
- все admin GET-роуты с токеном admin → `200`
- повторный `approve` товара → `409`
- жалоба на несуществующий товар → `404`
- `/api/complaints/mine` → `200`
- `/api/auth/dev` → `201` и через прямой backend, и через Vite proxy
- demotion/block в БД сразу виден старому токену: seller → buyer gives `403`, blocked → `403` (21.11.2026)

---

# Часть B. Что не сделано / сделано не так

## 5. P0 — блокеры

### 5.1 Self-approval и незащищённые PATCH

**Где:**

- `src/modules/products/products.controller.ts:60-68` — `@Body() data: Partial<Product>`
- `src/modules/products/products.service.ts:551-564` — `Object.assign` после сброса на `pending_review`
- `src/modules/stores/stores.controller.ts:50-58` — `@Body() data: Partial<Store>`
- `src/modules/stores/stores.service.ts:82-89` — `Object.assign`
- Неиспользуемые DTO: `src/modules/products/dto/product.dto.ts:103`, `src/modules/stores/dto/store.dto.ts:22`

**Проблема:** `Partial<Product>` / `Partial<Store>` стирается в JS, global `ValidationPipe` его не валидирует. Продавец может отправить:

```json
{ "moderationStatus": "approved", "isActive": true, "isVerified": true }
```

и получить одобрение без админа. Также можно менять `id`, `storeId`, `ownerId`, `rating`.

**Что сделать:**

- [x] Заменить на `UpdateProductDto` / `UpdateStoreDto` с whitelist полей.
- [x] Явно запретить поля `moderationStatus`, `moderationReason`, `moderatedById`, `moderatedAt`, `isActive`, `isVerified`, `ownerId`, `storeId`, `rating`, `reviewCount`, `orderCount`, `salesCount`.
- [x] В сервисе не использовать `Object.assign` для всего body — копировать только whitelist полей.
- [x] Добавить тест: seller не может self-approve через `PATCH`.

**Статус (21.11.2026):** закрыто. Добавлен `ForbidUnknownFieldsGuard` (проверяет сырой body до глобального ValidationPipe, который иначе молча срезает поля), DTO-списки `PRODUCT_UPDATE_FIELDS` / `STORE_UPDATE_FIELDS`, явное копирование полей в сервисах и e2e-скрипт `npm run e2e:self-approval`. Проверка проходит: self-approval → `400`, обычные правки → `200` без изменения moderation-флагов.

---

### 5.2 Dev auth может создать админа

**Где:** `src/modules/auth/auth.service.ts:160-203`, `dev-auth.dto.ts:8-11`, `dev-auth.guard.ts:21-27`.

**Проблема:**

- endpoint принимает `role: "admin"` и любой `telegramId`;
- при включённом флаге отключается проверка подписи Telegram initData (`auth.service.ts:39, 48-74`);
- локальный `.env` сейчас содержит `ALLOW_DEV_AUTH=true` (файл в `.gitignore`, но это факт);
- `.env.example` и `render.yaml` правильно выставляют `false`.

**Что сделать:**

- [x] В проде оставить `false` и добавить проверку на старте: `NODE_ENV=production && ALLOW_DEV_AUTH=true` → ошибка.
- [x] Ограничить dev-auth по localhost/IP (по умолчанию только loopback, optional `DEV_AUTH_ALLOWED_IPS`).
- [x] Запретить произвольный `role=admin`: админ разрешён только для ID из `DEV_ADMIN_TELEGRAM_IDS` (серверная whitelist, без секретов во фронте).
- [x] Не логировать токены/секреты; лог по-прежнему только `telegramId`, `role`, `isNew`.
- [x] Локальный `ALLOW_DEV_AUTH=true` оставлен только в `.env`; `.env.example` и Render — `false`.

**Статус (21.11.2026):** закрыто. Добавлен fail-fast в `configuration.ts`, IP-проверка в `DevAuthGuard`, whitelist админских Telegram ID в `AuthService.devLogin`, env `DEV_ADMIN_TELEGRAM_IDS` / `DEV_AUTH_ALLOWED_IPS`. Заодно исправлено: dev-логин без `role` больше не понижает существующего админа. Команда `npm run e2e:dev-auth`: prod-guard, 403 для чужого admin, 201 для whitelisted admin, buyer → 403 в admin API — всё проходит. Нагрузка на Leroy практически нулевая: проверки только на старте и на самом `/api/auth/dev`, новых зависимостей и запросов в админских роутах нет.

---

### 5.3 Роль в JWT — снимок, `UserStatus.BLOCKED` не работает

**Где:**

- `src/modules/auth/strategies/jwt.strategy.ts:23-24`
- `src/common/guards/roles.guard.ts:15-17`
- `src/config/configuration.ts:34-37` — `JWT_EXPIRES_IN=30d`
- `admin.service.ts:738-783` — смена статуса/роли не влияет на токены

**Проблема:** понижение роли, блокировка или удаление пользователя действуют только после истечения токена. `status = blocked` нигде не проверяется в guards.

**Что сделать (выбрать один подход):**

- [x] Быстро: `JwtStrategy.validate()` читает пользователя из БД, проверяет `status` и актуальную `role`, кладёт их в `req.user`.
- [ ] Лучше: хранить `tokenVersion` в User, инкрементить при смене роли/статуса, проверять в strategy (не понадобилось: БД-проверка уже даёт мгновенный эффект).
- [x] Guard для `status=blocked`: проверка в `JwtStrategy` + дубль в `RolesGuard` (403 на защищённых роутах).
- [x] Запретить админу понижать себя (`/admin/users/:id/role`, `/auth/role`, `/users/role`) и убирать последнего активного админа.

**Статус (21.11.2026):** закрыто по «быстрому» пути. `JwtStrategy` делает один индексированный `SELECT id, role, status` по PK на аутентифицированный запрос — без кэша и без окна устаревания. `RolesGuard` дополнительно режет `blocked`. Админские смены роли/статуса обёрнуты в транзакцию с pessimistic lock на активных админов, поэтому нельзя снять последнего активного админа даже параллельными запросами. Команда `npm run e2e:role-status`: демотированный seller сразу теряет доступ, заблокированный пользователь получает 403 на старом токене, self-demotion и `/users/role` escalation → 403.

---

### 5.4 Магазин заблокирован/отклонён, но товары видны

**Где:**

- `admin.service.ts:62-72, 369-395` — action→status и флаги
- `products.service.ts:239-242, 395-398, 459-465, 496-502` — фильтры только по товару
- `search.service.ts:87, 204, 234-245` — поиск тоже не учитывает статус магазина
- `stores.service.ts:40-47, 53-60, 62-71` — detail/list

**Проблема:** публичные запросы не проверяют `store.moderationStatus` / `store.isVerified` / `store.isActive`. Товар одобренного, но заблокированного магазина остаётся в каталоге. Admin `APPROVE` тоже не проверяет статус магазина.

**Что сделать:**

- [x] В базовый query товаров добавить `store.isActive = true AND store.moderationStatus = verified` (список, count, по магазину/категории, поиск, популярные категории).
- [x] В `moderateProduct(APPROVE)` проверять, что магазин `verified` и активен.
- [x] При `BLOCK` магазина автоматически `isActive=false` у его товаров; при повторном `VERIFY` — вернуть `isActive=true` только одобренным товарам.
- [x] `REJECT` выставляет `isActive=false`, `UNVERIFY` — `isVerified=false`.
- [x] `findBySlug`/`findById` для публичных роутов скрывают такие магазины; админ/владелец видят preview по токену.
- [x] Модалка статуса магазина уже говорит, что публикация недоступна — после правок backend это наконец правда, текст менять не потребовалось.

**Статус (21.11.2026):** закрыто. Единое условие публичности магазина вынесено в `src/common/store-visibility.ts` и применяется везде, где товар/магазин попадает в публичный каталог. `getProductById` тоже учитывает статус магазина, но admin/владелец по-прежнему видят preview. Действия модерации магазина теперь в одной транзакции с массовым `isActive` у товаров и аудитом. Команда `npm run e2e:store-visibility`: pending/blocked скрыты, verify+approve показывают товар, owner-preview сохранён, повторный verify восстанавливает одобренные товары.

---

### 5.5 Жалобы: linked actions и транзакции

**Где:** `admin.service.ts:1058+`, `admin.dto.ts:50-107`, `Complaint.entity.ts`.

**Проблемы:**

- `productAction` принимает весь `ModerateProductAction`, включая `APPROVE`.
- `storeAction` принимает весь `ModerateStoreAction`, включая `VERIFY`/`UNBLOCK`.
- Сначала сохраняется жалоба, потом выполняется linked action, потом audit/notification — без транзакции. Если action упадёт с `409`/`403`, жалоба уже изменена, а лога нет.
- `assigneeId` — `@IsString()`, а колонка `uuid` → 500 вместо 400.
- `RESOLVED`/`REJECTED` не требуют `resolution`.
- Переходы статусов ничем не ограничены, `resolvedAt` не очищается при реопене.
- Нет уведомления владельцу товара/магазина.

**Что сделать:**

- [x] Ограничить actions: `hide/block` для product, `block/unblock` для store; убрать `approve/verify`.
- [x] Обернуть update complaint + linked action + audit + notification в `DataSource.transaction`.
- [x] `assigneeId` → `@IsUUID()`.
- [x] State machine для complaint statuses.
- [x] Обязательный `resolution` для финальных статусов.
- [x] Уведомлять и автора жалобы, и владельца контента.

**Статус (21.11.2026):** закрыто. Добавлены отдельные `ComplaintProductAction`/`ComplaintStoreAction`: `hide` мапится в `ARCHIVE` товара (никогда не одобряет), `block` — в блокировку; `verify/approve` через жалобу теперь невозможны. Linked action проверяется на соответствие типу цели. `updateComplaint` целиком в транзакции с `pessimistic_write` на строку жалобы: смена статуса, linked action (`moderateProduct`/`moderateStore` с общим `EntityManager`), audit и уведомления коммитятся или откатываются вместе. Переходы статусов заданы таблицей, `resolvedAt` выставляется для финальных статусов и очищается при реопене; `resolution` обязателен для `RESOLVED`/`REJECTED`, `assigneeId` — `@IsUUID()`. Уведомляется автор жалобы и владелец контента (если не совпадает). `Complaint.resolvedAt` получил явный `timestamp` — без этого TypeORM не поднимал приложение. Фронт шлёт `productAction: "hide"` вместо `"archive"`. Команда `npm run e2e:complaint`: валидация, запрет эскалации/несоответствия цели, блок + audit + уведомление, state machine, rollback при повторном блоке и hide-архивация — всё проходит.

---

### 5.6 Admin order status обходит бизнес-логику

**Где:** `order-transitions.ts`, `orders.service.ts:changeOrderStatus/cancelOrderInternal`, `admin.service.ts:adminUpdateOrderStatus`, `AdminUpdateOrderStatusDto`, `AdminOrdersPage.tsx`.

**Проблема:** админ менял только `Order.status`, не трогая `SellerOrder`, restock/refund, timeline, notifications. Можно было перескочить `PAID → COMPLETED` или отменить уже доставленный заказ без возврата.

**Что сделать:**

- [x] Вынести общий `changeOrderStatus()` в `OrdersService` с state machine и транзакцией.
- [x] Admin controller должен вызывать его же, а не писать в репозиторий напрямую.
- [x] Передавать `reason`, писать `OrderEvent`, слать уведомления.
- [x] Запретить невалидные переходы.

**Статус (21.11.2026):** закрыто. `order-transitions.ts` получил строгую таблицу `ADMIN_NEXT_STATUS`: админ двигает заказ только на один шаг (`paid → accepted → … → completed`), `paid` выставляет только платёжный поток, `cancelled` разрешён только до `shipped`, повторная отмена даёт `409`. `OrdersService.changeOrderStatus()` блокирует строку заказа, синхронизирует незавершённые `SellerOrder`, проставляет `shippedAt`/`deliveredAt`, пишет `OrderEvent` с `actorRole: 'admin'`, шлёт уведомления покупателю и владельцам магазинов, а отмену проводит через общий `cancelOrderInternal` (рефанд, ресток, seller orders, таймлайн). Аудит админа передаётся колбэком `onAudit` и коммитится в той же транзакции. DTO требует `reason` для отмены; UI показывает только допустимые переходы и использует `ReasonDialog`. Команда `npm run e2e:admin-order`: валидация оплаты/пропуска/причины, общий change + seller sync + event/audit/notification, state machine и защита отправленного, отмена с refund/restock — всё проходит. Старый `npm run e2e:orders` тоже обновлён под 5.4 и проходит 53/53.

---

### 5.7 Миграция и деплой

**Где:** `src/migrations/1795200000000-AddAdminModeration.ts`, `src/migrations/1795200000001-HardenAdminModeration.ts`, `dist/migrations/`, `render.yaml:8`, `package.json`.

**Проблемы:**

- Файл миграции был **untracked**; pristine build из git поднял бы схему без moderation-полей.
- `up()` не была идемпотентной (`CREATE TYPE`, `ADD COLUMN` без проверок).
- `down()` была разрушительной: дропала `complaints`, `audit_logs` и все колонки без обратного backfill.
- Дрейф типов: в миграции `moderatedById`, `targetId`, `assigneeId` — `uuid`; в entities — обычные `string`/`varchar`.
- Не было FK на `moderatedById`, `assigneeId`, `audit_logs.actorId`.
- Не было индексов на `products.moderationStatus`, `stores.moderationStatus`, `isActive`, `audit_logs.action`.

**Что сделать:**

- [x] Пересобрать dist до деплоя: `dist/migrations/1795200000000-...js` и `1795200000001-...js` присутствуют.
- [x] Добавить smoke: `npm run migration:show` / `migration:show:prod` на чистой БД = все 11 applied.
- [x] Сделать базовую `up()` идемпотентной (проверки типов/колонок/таблиц/индексов + `IF EXISTS` в `down()`).
- [x] Добавить отдельную аддитивную миграцию с безопасным `down()`.
- [x] Привести entity-типы к `uuid`, добавить FK где уместно.
- [x] Добавить индексы под moderation queue и storefront filters.
- [x] Закоммитить обе миграции вместе с остальными изменениями (сервер `9e1e249`).

**Статус (21.11.2026):** закрыто, код закоммичен (`9e1e249`). Базовая миграция теперь проверяет типы/колонки/таблицы и не перезаписывает уже принятые moderation-решения backfill'ом. Новая `HardenAdminModeration1795200000001` добавляет индексы (`products.moderationStatus`, `(isActive, moderationStatus)`, `stores.moderationStatus`, `(isActive, moderationStatus)`, `audit_logs.action+createdAt`, `complaints.assigneeId+status`) и FK на `moderatedById`/`assigneeId`/`actorId` с `ON DELETE SET NULL`; `complaints.targetId` остаётся без FK, потому что это полиморфная ссылка. Перед FK висячие ссылки на удалённых пользователей очищаются. Entity-колонки получили явный `uuid` и relation-метаданные. Проверено: чистая локальная БД → `migration:run` и `migration:run:prod` применяют все 12 миграций, `migration:show`/`migration:show:prod` показывают `[X]` для всех; `migration:revert` + повторный `migration:run` hardening-миграции проходят. На рабочей локальной БД новая миграция применена. ВАЖНО: `down()` базовой миграции всё ещё удаляет moderation-данные — использовать только вместе с откатом кода; откат hardening-миграции безопасен.

---

### 5.8 Публичные endpoint'ы отдают лишнее

**Где:** `stores.service.ts`, `stores.controller.ts`, `store.dto.ts`, `categories.service.ts`, `products.service.ts`, `models.ts` (client).

**Проблема:** `GET /api/stores` и detail отдали целиком `Store` (+ `owner` relation): `moderationStatus`, `moderationReason`, `moderatedById`, `moderatedAt`, `isActive`, а через owner — `telegramId`, `role`, `status`. Публичный `GET /api/categories` показывал `isActive=false`, а detail товара — `moderationStatus`.

**Что сделать:**

- [x] Добавить `PublicStoreDto` / явный `select`.
- [x] Не отдавать `owner` целиком; `ownerId`/статус/причина приходят только владельцу или админу для preview.
- [x] Публичные categories не отдают `isActive=false` и внутренние поля.
- [x] Убрать `moderationStatus` из публичного detail товара (preview владельца/админа сохранён).

**Статус (21.11.2026):** закрыто. `StoresService` использует `STORE_PUBLIC_SELECT`, отдельный internal-loader для мутаций и `PublicStoreDto`; relation `owner` больше не загружается. `ownerId`, `moderationStatus`, `moderationReason` добавляются только если requester — владелец или админ. Для этого `GET /api/stores` получил `OptionalJwtAuthGuard`, что сохранило `myStore()` на клиенте. Клиентский `StoreDto.ownerId` стал опциональным. `CategoriesService.findAll()` фильтрует `isActive=true` и явно выбирает безопасные колонки. `ProductsService.findById()` по-прежнему читает внутренние поля для проверки видимости, но сериализует `moderationStatus` только internal/owner/admin. Команда `npm run e2e:public-dto`: публичные store/list/product/category не содержат внутренних полей, owner preview и активные категории работают, отключённая категория видна только в админке.

---

### 5.9 Upload / CORS / rate limiting

**Где:** `src/main.ts`, `src/app.module.ts`, `src/common/throttle.ts`, `src/health.controller.ts`, `src/config/configuration.ts`, `src/modules/upload/upload.controller.ts`, `src/modules/upload/upload.service.ts`, `src/modules/auth/auth.controller.ts`, `src/modules/admin/complaints.controller.ts`, `.env.example`, `render.yaml`, `dev-tests/security-check.js`.

**Проблема:** `cors: { origin: true, credentials: true }` отражал любой origin; не было throttler'а — login, dev-auth, complaint и upload не ограничивались; upload принимал клиентский mimetype и разрешал `svg` → Stored XSS при отдаче с того же origin; не было квот и проверки содержимого файла.

**Что сделать:**

- [x] Явно перечислить разрешённые origins (`CORS_ALLOWED_ORIGINS`), не отражать произвольный `Origin`; запросы без `Origin` (curl, вебхуки) продолжают работать.
- [x] Подключить `@nestjs/throttler`: глобальный лимит + короткий burst на логин/жалобу/upload; `/health` помечен `@SkipThrottle()`.
- [x] Убрать `svg`; определять тип по magic bytes, сохранять MIME/расширение из байтов, `originalName` санитизировать.
- [x] Ставить `X-Content-Type-Options: nosniff` глобально и на отдаче файла; принимать только сгенерированные UUID-имена строгим regex.
- [x] Per-user in-memory квота на час (`UPLOAD_QUOTA_FILES_PER_HOUR` / `UPLOAD_QUOTA_BYTES_PER_HOUR`), `TRUST_PROXY_HOPS` для корректного IP за прокси.
- [x] Разделить burst: `/auth/telegram` — строгие 10/10с, `/auth/dev` — 100/10с, чтобы локальные e2e могли создавать десятки тестовых пользователей (в проде роут всё равно 404 + fail-fast).

**Статус (21.11.2026):** закрыто. `main.ts` использует `origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin))` — неизвестный origin получает ответ без `Access-Control-Allow-Origin`, а не 500. Глобальный `ThrottlerGuard` (in-memory, `THROTTLE_TTL_MS=60000` / `THROTTLE_LIMIT=300`) не трогает `/health`. Sensitive-роуты имеют отдельный `BURST_THROTTLE` (10/10с); `/api/auth/dev` использует `DEV_AUTH_THROTTLE` (100/10с) — это устранённая регрессия: общий 10/10с лимит ломал `e2e:orders`, который за минуту логинит десятки временных юзеров, а реальный production-логин при этом защищён по-прежнему строго. `UploadService.detectImageType()` пускает только PNG/JPEG/GIF/WEBP по сигнатуре; SVG отклоняется даже при подменённом `.png` и `image/png`. Имя файла — `uuid + расширение из байтов`, `originalName` санитизируется, отдача идёт только по строгому regex с `nosniff` и пересчитанным `Content-Type`. Квота — in-memory `Map` на пользователя с окном 1 час, без БД-нагрузки; при ошибке upload'а зарезервированный слот возвращается. Env: `CORS_ALLOWED_ORIGINS`, `THROTTLE_TTL_MS`, `THROTTLE_LIMIT`, `TRUST_PROXY_HOPS`, `UPLOAD_QUOTA_FILES_PER_HOUR`, `UPLOAD_QUOTA_BYTES_PER_HOUR` — задокументированы в `.env.example` и выставлены в `render.yaml`. Команда `npm run e2e:security`: CORS allow/deny/без Origin, nosniff, отказ SVG и замаскированного SVG, валидный PNG + его байты/тип на отдаче, отказ path traversal, 429 на burst `/auth/telegram`, доступность `/health` — 14/14. Проверка квоты: после рестарта с `UPLOAD_QUOTA_FILES_PER_HOUR=1`, `SECURITY_MODE=quota npm run e2e:security` — первая загрузка 201, вторая 429 (3/3); после чего сервер возвращён к обычной конфигурации.

### 5.10 Production admin login

**Где:** `src/modules/auth/auth.controller.ts`, `src/modules/auth/auth.service.ts`, `dev-tests/admin-login-check.js`; клиент — `src/pages/admin/AdminLoginPage.tsx`, `src/shared/api/leroyApi.ts`, `src/shared/stores/accountStore.ts`.

**Решение:** отдельный пароль/2FA не вводится. Используется тот же Telegram Login Widget, но с отдельным роутом `POST /api/auth/admin/telegram`: он переиспользует проверенную подпись initData, находит аккаунт по `telegramId`, читает `role`/`status` из БД и **не выдаёт токен** не-админу или заблокированному аккаунту. Роль в токене — только подтверждённая БД; `JwtStrategy` всё равно перечитывает её на каждый запрос. Секретов и паролей в frontend нет; dev-кнопка вырезается из prod-бандла через `import.meta.env.DEV`.

**Статус (21.11.2026):** закрыто. `npm run e2e:admin-login` — 7 проверок: вход сидированного админа, доступ к `/admin/dashboard`, отказ покупателя (403), обычный логин не сломан, неизвестный аккаунт не регистрируется через админ-роут (401), отказ заблокированного админа (403), повторный вход после разблокировки. Все остальные 9 e2e и client build зелёные.

**Эксплуатационный нюанс:** админские аккаунты создаются сидом (`telegramId=111111111`) или назначением роли напрямую в БД — админка намеренно запрещает повышать до `admin` через UI. Для входа с веба домен фронтенда должен быть зарегистрирован в боте через BotFather (domain validation Telegram Login Widget); внутри Mini App авторизация уже идёт через `initData`.

---

## 6. P1 — модерация и бизнес-правила

### 6.1 Состояния магазина несогласованы — закрыто (Phase B, 21.11.2026)

**Статус:** закрыто коммитом сервера `b8f12ea`. Действия заданы жёсткой таблицей `STORE_MODERATION_TRANSITIONS` в `src/modules/admin/moderation-transitions.ts`: каждая пара «действие + текущий статус» явно определяет итоговые `moderationStatus`, `isVerified`, `isActive`. Невалидная комбинация → `400`, повтор действия, ведущего в тот же статус, → `409`.

| Действие | Разрешено из | Результат |
|---|---|---|
| `VERIFY` | `pending`, `under_review`, `rejected` | `verified`, виден в каталоге |
| `REJECT` | `pending`, `under_review`, `verified` | `rejected`, скрыт |
| `BLOCK` | `pending`, `under_review`, `verified`, `rejected` | `blocked`, скрыт |
| `UNBLOCK` | только `blocked` | `under_review`, активен |
| `REQUEST_DOCS` | `pending`, `verified`, `rejected` | `under_review`, скрыт |
| `UNVERIFY` | только `verified` | `pending`, скрыт |

Причина обязательна для `REJECT`/`BLOCK`/`REQUEST_DOCS`; при `VERIFY` старая причина очищается. Блокировка/отклонение в одной транзакции снимают `isActive` у товаров; повторная верификация возвращает в каталог только одобренные товары. Клиент дублирует таблицу в `canModerateStore()` (`src/shared/lib/admin.ts`) и дизейблит недоступные кнопки. Обратная совместимость с существующими сценариями (`pending → verify`, `verified → block`, `blocked → unblock`) сохранена.

### 6.2 Перемодерация товаров неполная — закрыто (Phase B, 21.11.2026)

**Статус:** закрыто коммитами `b8f12ea` / `3a73707`. В список важных полей добавлены `price`, `oldPrice`, `stock`, `weightG/lengthCm/widthCm/heightCm` и `variants` (с нормализованным сравнением). Правка любого из них у одобренного/отклонённого/чернового товара сбрасывает его в `pending_review + isActive=false` и пишет аудит `product.resubmit` с `trigger: edit`; нерелевантные правки (например `tags`) статус не трогают.

Добавлены явные эндпоинты `PATCH /api/products/:id/resubmit` (`draft|rejected → pending_review`) и `PATCH /api/stores/:id/resubmit` (`rejected → under_review`), только для владельца. Заблокированный контент самовозврату не поддаётся — нужен админский `UNBLOCK`. На странице «Мой магазин» появились кнопки «На проверку» у магазина и у товаров в `draft`/`rejected`; у админа кнопки теперь дизейблятся по тем же таблицам, что и на сервере.

Остатки: `requestedDocuments` по-прежнему живёт только в аудите (отдельной модели документов нет, см. 7.2). Запрет смены `storeId` закрыт ещё в 5.1 whitelist'ом DTO. `isFeatured` намеренно не входит в важные поля — это мерчендайзинг, а не содержание товара.

### 6.3 User role/status

- [ ] `updateUserRole` запрещает только назначение `ADMIN`, но разрешает снять последнего админа и себя.
- [ ] Смена роли/статуса не пишется в audit с причиной? (пишется, но без reason — см. 5.3 и 7.3).
- [ ] `PATCH /api/auth/role` (`auth.service.ts:230-248`) меняет роль без audit и без перевыпуска токена.
- [ ] `AuthService.updateRole` разрешает buyer↔seller без одобрения админом — возможно ок для продукта, но нужно решить и задокументировать.

### 6.4 Категории и заказы

- [ ] Дублирующий `POST /api/categories` (`categories.controller.ts:17-22`) не аудируется и не использует admin DTO.
- [ ] `Category.isActive` не влияет на публичный `GET /api/categories`.
- [ ] `updateCategory` не проверяет `parentId` на существование/циклы и не обновляет `slug` при смене имени.
- [ ] Dashboard `totalRevenue` суммирует все заказы, включая `pending` и `cancelled` (`admin.service.ts:250`).
- [ ] `activeSellers` считает `isActive=true` без учёта moderation; `pendingStores` не считает `under_review`.

---

## 7. P1/P2 — frontend админки

### 7.1 Нет production admin login — закрыто (5.10)

Было: `AdminLoginPage.tsx` в prod показывал только заглушку, а `LoginGate` прятал виджет на `/admin`.

Стало: на `/admin/login` рендерится штатный `TelegramLoginWidget`, который вызывает отдельный серверный роут с проверкой роли/статуса. Dev-кнопка осталась только в dev-сборке. Пароль и 2FA не потребовались: вход привязан к реальному Telegram-аккаунту, а роль берётся из БД. Варианты с отдельным ботом/SSO остаются возможными enhancements, но сейчас не блокируют релиз.

### 7.2 Мёртвые/недоиспользованные вещи

| Что | Где | Статус |
|---|---|---|
| `adminOrder()` (events) | `leroyApi.ts:249-251` | API есть, роута/страницы нет |
| `adminProductHistory()` | `leroyApi.ts:293-295` | Не вызывается |
| `myComplaints()` | `leroyApi.ts:385-387` | Не вызывается |
| `AdminComplaintDto.images` | `models.ts:755` | Не рендерится |
| `assigneeId` | `models.ts:757` | Не показывается, нет assign action |
| `Column.hideBelow` | `AdminUi.tsx:50,53-94` | Объявлен, таблица игнорирует |
| `accountStore.setRole()` | `accountStore.ts:179-181` | Публичный мутатор роли без сервера |
| ИНН в списке продавцов | `AdminSellersPage.tsx:84` | Хардкод `—` |
| «Сессия» в Settings | `AdminSettingsPage.tsx:88-90` | `new Date()`, не реальные данные |
| Документы товара/продавца | `AdminProductDetailPage.tsx`, `AdminSellerDetailPage.tsx` | Заглушки удалены (`3a73707`); запрос документов фиксируется в истории решений |

### 7.3 UX/логика

- [ ] Нет debounce на search в product list/sellers/users → запрос на каждую клавишу.
- [ ] Orders search фильтрует только загруженные 20 строк, а не серверную страницу (`AdminOrdersPage.tsx:75-82`).
- [ ] Есть `dateFrom`, нет `dateTo`, хотя backend его поддерживает.
- [ ] Audit filter передаёт `entity` как `search`, `action` как `status` (`AdminAuditPage.tsx:58-64`) — нужен отдельный DTO/params.
- [ ] Список ACTIONS в Audit — только 9 из ~20 известных (`admin.ts:126-149`).
- [ ] Recent-элементы Overview не кликабельны; метрики не несут фильтры.
- [ ] Product detail back-link всегда ведёт в `/admin/moderation`, даже если открыт из catalog.
- [ ] Category toggle/sort пишут сразу без подтверждения.
- [ ] Order status меняется без `reason`, хотя API его принимает.
- [ ] User detail history не показывает `reason`.
- [ ] Guards возвращают `null` пока `initialized=false` — белый экран вместо loader.
- [ ] Нет `/admin/*` catch-all: неизвестный admin-URL уходит в пользовательский layout.
- [ ] Hook warnings: missing deps в `AdminProductDetailPage`/`AdminSellerDetailPage`, `set-state-in-effect` на страницах списков.
- [ ] Брендинг смешанный: `Overview`, `Avilon Admin`, `v1.0` среди русских подписей.
- [ ] `ReportProductButton` дублирует причины вместо `COMPLAINT_REASONS`.

### 7.4 Тесты и браузерный smoke

- [ ] Нет ни одного admin unit/component test.
- [ ] Не проведён browser smoke: `/admin/login`, все разделы, loading/empty/error, responsive drawer/table.
- [ ] Не проверены реальные confirm/reason модалки в браузере.
- [ ] `npm run lint` client: 0 errors, 119 warnings — не блокер, но часть предупреждений стоит убрать.

---

## 8. Аудит и наблюдаемость

Пишется: store/product/order/user/complaint/category actions, а также seller `resubmit` — через единый `AuditService` (`src/common/audit/audit.service.ts`) с полями `ip`/`requestId`.

**Не пишется:**

- [ ] `POST /api/auth/dev` (выдача админской роли)
- [ ] `PATCH /api/auth/role`
- [ ] `POST /api/categories` (дублирующий роут)
- [ ] `PATCH /api/seller/payouts/:id/status`
- [ ] Admin wallet top-up confirm
- [ ] Отклонённые/неудачные admin-попытки

**Дополнительно:**

- [x] State change + audit + notification в одной транзакции — закрыто для модерации магазина/товара, жалоб и смены статуса заказа.
- [ ] `actorRole` по-прежнему берётся из JWT, но роль/статус перечитываются из БД на каждый запрос (5.3), поэтому устаревшим быть не может.
- [x] IP / request-id пишутся в `audit_logs` (`AuditContext`, миграция `1795200000002`). `requestId` берётся из `x-request-id` или генерируется заново, `ip` — из `req.ip` с учётом `TRUST_PROXY_HOPS`; заголовок `X-Forwarded-For` от клиента не доверяется. User-agent не пишется.
- [ ] «Append-only» — только комментарий в entity, нет DB trigger/GRANT REVOKE UPDATE/DELETE.
- [ ] Нет алертов на критичные действия (`ADMIN` role, block store, refund/cancel order).

---

## 9. Общий бэклог Leroy (не только админка)

Собрано из `docs/backend-roadmap.md` и текущего аудита. Что уже закрыто — помечено `[x]`.

### 9.1 Фундамент/безопасность

- [x] Миграции вместо `synchronize`, `DATABASE_SYNCHRONIZE=false`.
- [x] JWT_SECRET без fallback, min 32 chars.
- [x] TON удалён из клиента.
- [x] Отзывы только после покупки (`reviews.service.ts:51-62`).
- [ ] Mock-оплата: ввести `PAYMENTS_MOCK_ENABLED`, по умолчанию `false`.
- [ ] Провайдер Stars: клиент `"telegram_stars"` vs enum `"stars"` — согласовать.
- [x] Rate limiting / явный CORS / безопасный upload (см. 5.9).
- [ ] Вызвать `BotService.notifyNewOrder/notifyOrderStatusChanged/notifyNewReview` — методы есть, не используются.
- [ ] Reviews: проверять не только дубликат, но и статус заказа `delivered/completed`.

### 9.2 Заказы/деньги

- [ ] `OrderDetailPage` должен вызывать `GET /orders/:id`, а не искать в массиве всех заказов.
- [x] Admin status change через общий `OrdersService` (5.6).
- [ ] Endpoint статуса выплат: DTO + audit.
- [ ] Подтверждение пополнения кошелька: audit + роль из БД, а не только из JWT.

### 9.3 seller/витрина

- [x] Строгая связь товар↔магазин (5.4).
- [x] Документы продавца/товара: заглушки убраны из админки (3a73707), запрос документов остаётся в аудите.
- [x] Seller resubmit на модерацию (b8f12ea / 3a73707).
- [x] Public store DTO без внутренних полей (5.8).

### 9.4 UX/качество

- [x] Skeleton loading на ключевых страницах.
- [x] Cache-busting картинок.
- [x] Адреса из профиля.
- [x] Мгновенное создание магазина с файлами.
- [ ] Файл `stats.html` изменён build visualizer — решить, нужен ли в git.
- [ ] Server `npm run lint`: установить eslint + конфиг или удалить script.
- [x] Добавить e2e/smoke script'ы в `dev-tests/` (11 server e2e, включая security и phase-b).

---

# Часть C. План работ

## Фаза A — P0, до любого деплоя админки

**Цель:** нельзя подделать модерацию, роль или состояние заказа.

- [x] 5.1 Whitelist DTO для `PATCH /products/:id` и `/stores/:id` (21.11.2026).
- [x] 5.2 Запрет админской роли через dev-auth + prod guard на флаг (21.11.2026).
- [x] 5.3 Актуальная роль/статус из БД в `JwtStrategy`, защита последнего админа (21.11.2026).
- [x] 5.4 Связать видимость товаров со статусом магазина (21.11.2026).
- [x] 5.5 Complaint actions + транзакция (21.11.2026).
- [x] 5.6 Единый `changeOrderStatus` (21.11.2026).
- [x] 5.7 Миграции, `dist/migrations`, индексы/типы/FK готовы и проверены (21.11.2026).
- [x] Закоммитить миграции вместе с остальными изменениями (сервер `9e1e249`).
- [x] 5.8 Public DTO для магазинов/категорий (21.11.2026).
- [x] 5.9 CORS/throttler/upload (21.11.2026).

**Критерий готовности:** ни один тест/сценарий не может self-approve, поднять админа через dev endpoint в prod-конфиге, оставить товар заблокированного магазина в каталоге, одобрить/верифицировать контент через жалобу, сломать заказ админской сменой статуса, получить внутренние moderation/owner-поля из публичных endpoint'ов, обойти CORS-allowlist или залить SVG как изображение.

## Фаза B — P1, модерация как продукт — закрыта (21.11.2026)

- [x] State machine для store/product (complaint — закрыта в 5.5, order — в 5.6): `moderation-transitions.ts`.
- [x] Полная перемодерация товара + seller resubmit для товара и магазина.
- [x] Документы: честное удаление заглушек из админки (реальной модели нет).
- [x] Audit: единый `AuditService`, транзакционность, `ip`/`requestId` + аддитивная миграция.
- [x] Уведомления владельцу контента и автору жалобы (проверено в e2e).

**Критерий:** админ видит один и тот же статус везде, история полная, повторные действия запрещены, причины обязательны где нужно. Подтверждено `npm run e2e:phase-b` (6/6) и полным набором из 11 e2e. Коммиты: сервер `b8f12ea`, клиент `3a73707`.

## Фаза C — P1/P2, frontend админки

- [x] Production admin login (5.10).
- [ ] Разобрать мёртвые поля/методы (7.2).
- [ ] Debounce, `dateTo`, server-side orders search, правильные audit filters.
- [ ] Кликабельные recent-элементы, фильтрованные метрики, корректный back-link.
- [ ] Admin tests + browser smoke + проверка адаптивности.
- [ ] Почистить warnings в новых admin-компонентах.

**Критерий:** `/admin/login` работает в prod, все кнопки ведут к реальным действиям, нет заглушек без пометки, 0 admin-ошибок в консоли браузера.

## Фаза D — релиз

- [x] Коммит клиента (`1d818dd`, `5ca4fee`, `3a73707`) и сервера (`9e1e249`, `75ddfad`, `b8f12ea`) отдельно.
- [x] Phase B закоммичена отдельно от Phase A: сервер `b8f12ea`, клиент `3a73707`.
- [x] `npm run build` в обоих репозиториях.
- [ ] `migration:run:prod` на staging.
- [ ] Smoke из раздела 4 + browser smoke.
- [ ] Проверить `ALLOW_DEV_AUTH=false` в Render.
- [x] Снять галочку «все изменения uncommitted».

---

## 10. Чек-лист перед коммитом прямо сейчас

- [x] Пересобрать server `dist/` после миграции, `.js` миграции на месте.
- [x] Закоммитить миграции на сервере (`9e1e249`).
- [x] Закоммитить admin-страницы/guards/UI на клиенте (`1d818dd`).
- [ ] Решить судьбу `stats.html` — сгенерированный build visualizer'ом файл, пока оставлен изменённым вне коммита.
- [x] Явно зафиксировать в `.env.example`, что `ALLOW_DEV_AUTH` — local only.
- [x] Прогнать `npx tsc -b`, `npm test`, `npm run lint`, `npm run build` на клиенте.
- [x] Прогнать `npx tsc -b`, `npm run build` и 11 e2e-проверок на сервере (включая `e2e:admin-login` и `e2e:phase-b`). В общей сессии `e2e:admin-login` упёрся в 429 throttler'а и прошёл после короткой паузы.
- [ ] Остановить/оставить dev-серверы осознанно (сейчас backend на 4000, frontend на 5173).

---

## 11. Открытые вопросы

1. ~~Production admin login~~ — решён в 5.10 через Telegram + серверную проверку роли. При желании позже можно добавить TOTP вторым фактором; отдельный бот/SSO сейчас не нужны.
2. ~~Документы: делать реальную загрузку или убрать секции~~ — заглушки удалены (`3a73707`), запрос документов остаётся в аудите.
3. ~~Можно ли продавцу самому вернуть товар на модерацию после отказа?~~ — да, через `resubmit` (`b8f12ea` / `3a73707`).
4. **Нужен ли отдельный `StorePublicDto` или достаточно явного `select` в query?**
5. **Менять ли `JWT_EXPIRES_IN` с 30 дней на короткий + refresh token?**
6. **Оставлять ли `POST /api/categories` как duplicate или удалить в пользу `/api/admin/categories`?**
7. **Что делать с `AuthService.updateRole` — оставить self-service buyer↔seller или только админ?**

---

## Приложение A. Статусы

### Product

`draft` → `pending_review` → `under_review` → `approved`  
 Альтернативы: `rejected`, `blocked`, `archived`

### Store

`pending` → `under_review` → `verified`  
 Альтернативы: `rejected`, `blocked`

### Complaint

`new` → `under_review` → `resolved | rejected`

### User

`active | blocked`  
Роли: `buyer | seller | admin`

---

## Приложение B. Ключевые файлы

### Клиент

- `src/app/App.tsx`
- `src/pages/admin/**`
- `src/widgets/admin/**`
- `src/shared/ui/admin/**`
- `src/shared/ui/store/StoreStatusBadge.tsx`
- `src/shared/api/leroyApi.ts`
- `src/shared/api/models.ts`
- `src/shared/lib/admin.ts`
- `src/shared/guards/RequireAdmin.tsx`
- `src/shared/stores/accountStore.ts`
- `src/shared/stores/sellerStore.ts` (updateStore)
- `src/features/complaints/ReportProductButton.tsx`
- `src/pages/myStore/MyStorePage.tsx` (seller resubmit)

### Сервер

- `src/modules/admin/admin.controller.ts`
- `src/modules/admin/admin.service.ts`
- `src/modules/admin/dto/admin.dto.ts`
- `src/modules/admin/complaints.controller.ts`
- `src/modules/admin/moderation-transitions.ts`
- `src/common/audit/{audit.service.ts,audit.module.ts}`
- `src/common/decorators/audit-context.decorator.ts`
- `src/entities/{AuditLog,Complaint,Product,Store,User,Category}.entity.ts`
- `src/migrations/1795200000000-AddAdminModeration.ts`
- `src/migrations/1795200000002-AddAuditRequestContext.ts`
- `src/modules/products/products.service.ts`
- `src/modules/stores/stores.service.ts`
- `src/modules/search/search.service.ts`
- `src/modules/auth/{auth.service.ts,dev-auth.guard.ts,optional-jwt-auth.guard.ts,jwt.strategy.ts}`
- `src/common/guards/roles.guard.ts`
- `src/modules/orders/orders.service.ts`
- `src/modules/upload/upload.controller.ts`
- `src/main.ts`
- `src/config/configuration.ts`
- `.env.example`, `render.yaml`

---

**Конец аудита.** Документ нужно обновлять по мере закрытия пунктов: отмечать `[x]` и указывать дату/коммит.
