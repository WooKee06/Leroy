import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { API_BASE } from "@shared/api/client";
import { leroyApi } from "@shared/api/leroyApi";
import { accountStore } from "@shared/stores/accountStore";
import { formatDateTime } from "@shared/lib/admin";
import {
  ActionRow,
  AdminCard,
  DetailGrid,
  DetailItem,
  PageIntro,
  StateBlock,
} from "@shared/ui/admin/AdminUi";
import styles from "./AdminSettingsPage.module.scss";

function AdminSettingsPage() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<number | null>(null);
  const [complaints, setComplaints] = useState<number | null>(null);

  useEffect(() => {
    leroyApi
      .adminModerationQueue({ limit: 1 })
      .then((result) => setQueue(result.total))
      .catch(() => setQueue(null));
    leroyApi
      .adminComplaints({ status: "new", limit: 1 })
      .then((result) => setComplaints(result.total))
      .catch(() => setComplaints(null));
  }, []);

  const logout = () => {
    accountStore.logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div>
      <PageIntro
        title="Настройки"
        description="Текущая конфигурация доступа и состояние очередей модерации."
      />

      <div className={styles.grid}>
        <AdminCard title="Аккаунт администратора">
          <DetailGrid>
            <DetailItem label="Имя">{accountStore.displayName}</DetailItem>
            <DetailItem label="Роль">{accountStore.roleLabel}</DetailItem>
            <DetailItem label="Telegram">
              {accountStore.username ? `@${accountStore.username}` : "—"}
            </DetailItem>
            <DetailItem label="User ID">{accountStore.userId ?? "—"}</DetailItem>
          </DetailGrid>
          <ActionRow>
            <button type="button" className={styles.button} onClick={logout}>
              Выйти из админ-панели
            </button>
          </ActionRow>
        </AdminCard>

        <AdminCard title="Очереди">
          <DetailGrid>
            <DetailItem label="Товары на проверке">
              {queue === null ? "—" : <Link to="/admin/moderation">{queue}</Link>}
            </DetailItem>
            <DetailItem label="Новые жалобы">
              {complaints === null ? "—" : <Link to="/admin/complaints">{complaints}</Link>}
            </DetailItem>
          </DetailGrid>
        </AdminCard>

        <AdminCard title="Правила модерации">
          <ul className={styles.rules}>
            <li>Товар становится видимым покупателям только после одобрения администратором.</li>
            <li>Изменение названия, описания, категории или изображений отправляет одобренный товар на повторную проверку.</li>
            <li>Продавец не может подтвердить свой магазин или одобрить свой товар самостоятельно.</li>
            <li>Все решения фиксируются в backend-журнале с причиной, состоянием и временем.</li>
            <li>Документы продавцов не доступны по публичным URL.</li>
          </ul>
        </AdminCard>

        <AdminCard title="Подключение">
          <DetailGrid>
            <DetailItem label="API">{API_BASE}</DetailItem>
            <DetailItem label="Режим">{import.meta.env.DEV ? "Разработка" : "Production"}</DetailItem>
            <DetailItem label="Сессия">
              {formatDateTime(new Date().toISOString())}
            </DetailItem>
          </DetailGrid>
          <p className={styles.note}>
            Временный тестовый вход будет заменён отдельным backend admin login.
            Права проверяются сервером на каждый запрос к /api/admin.
          </p>
        </AdminCard>
      </div>

      <StateBlock kind="empty" text="Настройки бизнес-правил определяются backend и не редактируются из браузера." />
    </div>
  );
}

export default observer(AdminSettingsPage);
