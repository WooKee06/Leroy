import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSave } from "react-icons/fi";
import { leroyApi } from "@shared/api/leroyApi";
import { accountStore } from "@shared/stores/accountStore";
import {
  DEFAULT_STORE_AVATAR,
  DEFAULT_STORE_COVER,
} from "@shared/lib/placeholders";
import PageContainer from "@shared/ui/PageContainer";
import styles from "./StoreEditPage.module.scss";

export default function StoreEditPage() {
  const navigate = useNavigate();
  const [storeId, setStoreId] = useState<string | undefined>(undefined);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void leroyApi.myStore(accountStore.userId).then((store) => {
      if (!alive || !store) return;
      setStoreId(store.id);
      setName(store.name ?? "");
      setDescription(store.description ?? "");
      setLogoUrl(store.logoUrl ?? "");
      setCoverUrl(store.coverUrl ?? "");
    });
    return () => {
      alive = false;
    };
  }, []);

  const save = async () => {
    if (!storeId || saving) return;
    if (!name.trim()) {
      setError("Укажите название магазина");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await leroyApi.updateStore(storeId, {
        name: name.trim(),
        description: description.trim(),
        logoUrl: logoUrl.trim() || undefined,
        coverUrl: coverUrl.trim() || undefined,
      });
      navigate("/my-store");
    } catch {
      setError("Не удалось сохранить. Попробуйте ещё раз");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`page-wrapper ${styles.page}`}>
      <PageContainer>
        <h1 className={styles.title}>Редактирование магазина</h1>

        <div className={styles.preview}>
          <img
            className={styles.cover}
            src={coverUrl.trim() || DEFAULT_STORE_COVER}
            alt=""
          />
          <img
            className={styles.avatar}
            src={logoUrl.trim() || DEFAULT_STORE_AVATAR}
            alt=""
          />
        </div>

        <div className={styles.form}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Название</span>
            <input
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Название магазина"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Описание</span>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Коротко о магазине"
              rows={4}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Обложка (URL)</span>
            <input
              className={styles.input}
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://…"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Логотип (URL)</span>
            <input
              className={styles.input}
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://…"
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button
            className={styles.saveBtn}
            onClick={() => void save()}
            disabled={saving}
          >
            <FiSave size={18} /> {saving ? "Сохраняем…" : "Сохранить"}
          </button>
        </div>
      </PageContainer>
    </div>
  );
}