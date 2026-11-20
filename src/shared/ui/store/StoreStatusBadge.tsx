import { useEffect, useState, type ReactNode } from "react";
import { observer } from "mobx-react-lite";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiCheck,
  FiClock,
  FiInfo,
  FiSlash,
  FiX,
  FiXCircle,
} from "react-icons/fi";

import type { Seller, StoreModerationStatus } from "@shared/api/models";
import { STORE_STATUSES, statusMeta } from "@shared/lib/admin";
import { accountStore } from "@shared/stores/accountStore";
import styles from "./StoreStatusBadge.module.scss";

const STATUS_ICONS: Record<StoreModerationStatus, ReactNode> = {
  pending: <FiClock size={14} />,
  under_review: <FiClock size={14} />,
  verified: <FiCheck size={14} />,
  rejected: <FiXCircle size={14} />,
  blocked: <FiSlash size={14} />,
};

interface StatusCopy {
  title: string;
  ownerLead: string;
  publicLead: string;
  ownerPoints: string[];
  publicPoints: string[];
}

const STATUS_COPY: Record<StoreModerationStatus, StatusCopy> = {
  pending: {
    title: "Магазин ожидает проверки",
    ownerLead:
      "Спасибо, что создали магазин в Avilon. Сейчас администрация проверяет ваши данные — это займёт немного времени.",
    ownerPoints: [
      "Пока статус не станет «Проверен», публикация товаров в каталог недоступна.",
      "Можно заполнить витрину и подготовить товары заранее.",
      "Покупатели увидят их только после подтверждения магазина и модерации товара.",
    ],
    publicLead: "Этот магазин ещё не прошёл проверку администрации Avilon.",
    publicPoints: [
      "Галочка проверенного продавца появится после подтверждения.",
      "Каждый товар проходит отдельную модерацию перед публикацией.",
    ],
  },
  under_review: {
    title: "Магазин на проверке",
    ownerLead:
      "Ваш магазин передан администрации на повторную проверку. Ожидайте решения — это займёт немного времени.",
    ownerPoints: [
      "До подтверждения магазина публикация товаров в каталог недоступна.",
      "Подготовленные товары можно оставить в черновиках.",
      "После решения администрации статус магазина обновится.",
    ],
    publicLead: "Магазин находится на проверке администрации Avilon.",
    publicPoints: [
      "Окончательное решение по магазину ещё не принято.",
      "Галочка проверенного появится после подтверждения.",
    ],
  },
  verified: {
    title: "Магазин подтверждён",
    ownerLead:
      "Готово! Ваш магазин прошёл проверку администрации Avilon. Теперь можно добавлять товары.",
    ownerPoints: [
      "Каждый новый товар отправляется на модерацию.",
      "После одобрения товара он сразу появляется в каталоге.",
      "Покупатели видят галочку проверенного продавца.",
    ],
    publicLead: "Магазин прошёл проверку администрации Avilon.",
    publicPoints: [
      "У продавца есть галочка проверенного магазина.",
      "Товары всё равно проходят модерацию перед публикацией.",
    ],
  },
  rejected: {
    title: "Магазин отклонён",
    ownerLead:
      "Администрация не подтвердила магазин. Публикация товаров сейчас недоступна.",
    ownerPoints: [
      "Проверьте название, описание и оформление магазина.",
      "Если вы считаете решение ошибкой, обратитесь в поддержку Avilon.",
      "После повторной проверки статус магазина изменится.",
    ],
    publicLead: "Магазин не прошёл проверку администрации Avilon.",
    publicPoints: [
      "Статус «Отклонён» означает, что продавец не подтверждён.",
      "Учитывайте это при выборе продавца.",
    ],
  },
  blocked: {
    title: "Магазин заблокирован",
    ownerLead:
      "Магазин заблокирован администрацией. Публикация товаров и продажи недоступны.",
    ownerPoints: [
      "Если причина решения сохранена, вы увидите её ниже.",
      "Для уточнения ситуации обратитесь в поддержку Avilon.",
    ],
    publicLead: "Магазин заблокирован администрацией Avilon.",
    publicPoints: [
      "Продавец не подтверждён и ограничен в публикации товаров.",
      "Покупателям стоит с осторожностью относиться к таким магазинам.",
    ],
  },
};

interface Props {
  seller: Pick<
    Seller,
    "verified" | "moderationStatus" | "moderationReason" | "ownerId"
  >;
}

const StoreStatusBadge = observer(function StoreStatusBadge({ seller }: Props) {
  const [open, setOpen] = useState(false);

  const status: StoreModerationStatus =
    seller.moderationStatus ?? (seller.verified ? "verified" : "pending");
  const meta = statusMeta(STORE_STATUSES, status);
  const copy = STATUS_COPY[status] ?? STATUS_COPY.pending;

  const isOwner =
    !!seller.ownerId &&
    !!accountStore.userId &&
    seller.ownerId === accountStore.userId;

  const points = isOwner ? copy.ownerPoints : copy.publicPoints;
  const lead = isOwner ? copy.ownerLead : copy.publicLead;
  const showReason =
    !!seller.moderationReason &&
    (status === "rejected" || status === "blocked" || status === "under_review");

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={`${styles.badge} ${styles[meta.tone]}`}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Статус магазина: ${meta.label}. Подробнее`}
      >
        <span className={styles.badgeIcon}>{STATUS_ICONS[status]}</span>
        <span>{meta.label}</span>
        <FiInfo size={12} className={styles.badgeInfo} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div className={styles.layer}>
              <motion.div
                className={styles.dialog}
                role="dialog"
                aria-modal="true"
                aria-labelledby="store-status-title"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className={styles.hero}>
                  <div className={`${styles.heroIcon} ${styles[meta.tone]}`}>
                    {STATUS_ICONS[status]}
                  </div>
                  <div className={styles.heroText}>
                    <span className={styles.eyebrow}>Статус магазина</span>
                    <h2 id="store-status-title" className={styles.title}>
                      {copy.title}
                    </h2>
                  </div>
                  <button
                    type="button"
                    className={styles.close}
                    onClick={() => setOpen(false)}
                    aria-label="Закрыть"
                  >
                    <FiX size={18} />
                  </button>
                </div>

                <div className={styles.body}>
                  <p className={styles.lead}>{lead}</p>

                  {showReason && (
                    <div className={styles.reason}>
                      <span className={styles.reasonLabel}>
                        Причина решения администрации
                      </span>
                      <p className={styles.reasonText}>{seller.moderationReason}</p>
                    </div>
                  )}

                  <ul className={styles.list}>
                    {points.map((point) => (
                      <li key={point} className={styles.listItem}>
                        <span className={styles.listIcon}>
                          <FiCheck size={13} />
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={styles.footer}>
                  <button
                    type="button"
                    className={styles.okButton}
                    onClick={() => setOpen(false)}
                  >
                    Понятно
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
});

export default StoreStatusBadge;
