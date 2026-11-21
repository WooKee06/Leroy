import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import type { AdminCategoryDto } from "@shared/api/models";
import { leroyApi } from "@shared/api/leroyApi";
import {
  ActionRow,
  AdminCard,
  AdminTable,
  ConfirmDialog,
  Modal,
  PageIntro,
  StateBlock,
  StatusBadge,
  type Column,
} from "@shared/ui/admin/AdminUi";
import styles from "./AdminCategoriesPage.module.scss";

type Editing = "new" | AdminCategoryDto | null;

function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<AdminCategoryDto | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [pendingToggle, setPendingToggle] = useState<AdminCategoryDto | null>(null);
  const [pendingSort, setPendingSort] = useState<{
    category: AdminCategoryDto;
    value: number;
  } | null>(null);

  const load = () => {
    let alive = true;
    setLoading(true);
    setError(null);
    leroyApi
      .adminCategories()
      .then((result) => {
        if (alive) setCategories(result);
      })
      .catch((err: Error) => {
        if (alive) setError(err.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  };

  useEffect(() => load(), []);

  const openEditor = (category: Editing) => {
    setEditing(category);
    setName(category && category !== "new" ? category.name : "");
    setIcon(category && category !== "new" ? (category.icon ?? "") : "");
    setSortOrder(category && category !== "new" ? (category.sortOrder ?? 0) : 0);
    setActionError(null);
  };

  const save = async () => {
    setActionError(null);
    try {
      if (editing === "new") {
        await leroyApi.adminCreateCategory({
          name,
          icon: icon || undefined,
          sortOrder,
        });
      } else if (editing) {
        await leroyApi.adminUpdateCategory(editing.id, {
          name,
          icon: icon || undefined,
          sortOrder,
        });
      }
      setEditing(null);
      await leroyApi.adminCategories().then(setCategories);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Не удалось сохранить категорию");
    }
  };

  const toggleActive = async (category: AdminCategoryDto) => {
    setPendingToggle(null);
    try {
      await leroyApi.adminUpdateCategory(category.id, { isActive: !category.isActive });
      setCategories((prev) =>
        prev.map((item) =>
          item.id === category.id ? { ...item, isActive: !item.isActive } : item,
        ),
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Не удалось изменить статус");
    }
  };

  const changeOrder = async (category: AdminCategoryDto, value: number) => {
    setPendingSort(null);
    try {
      await leroyApi.adminUpdateCategory(category.id, { sortOrder: value });
      setCategories((prev) =>
        prev.map((item) => (item.id === category.id ? { ...item, sortOrder: value } : item)),
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Не удалось изменить порядок");
    }
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      await leroyApi.adminDeleteCategory(deleting.id);
      setCategories((prev) => prev.filter((item) => item.id !== deleting.id));
      setDeleting(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Не удалось удалить категорию");
      setDeleting(null);
    }
  };

  const columns: Column<AdminCategoryDto>[] = [
    { key: "name", label: "Название", render: (category) => category.name },
    { key: "slug", label: "Slug", render: (category) => category.slug },
    {
      key: "order",
      label: "Порядок",
      render: (category) => (
        <SortOrderInput
          category={category}
          onCommit={(value) => setPendingSort({ category, value })}
        />
      ),
    },
    {
      key: "active",
      label: "Активна",
      render: (category) => (
        <StatusBadge
          label={category.isActive === false ? "Скрыта" : "Активна"}
          tone={category.isActive === false ? "neutral" : "good"}
        />
      ),
    },
    {
      key: "actions",
      label: "",
      render: (category) => (
        <div className={styles.rowActions}>
          <button type="button" onClick={() => setPendingToggle(category)}>
            {category.isActive === false ? "Включить" : "Скрыть"}
          </button>
          <button type="button" onClick={() => openEditor(category)}>
            Изменить
          </button>
          <button type="button" onClick={() => setDeleting(category)}>
            Удалить
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageIntro
        title="Категории"
        description="Структура каталога: создание, редактирование, порядок и активность."
        action={
          <button type="button" className={styles.addButton} onClick={() => openEditor("new")}>
            Добавить категорию
          </button>
        }
      />

      {actionError && <StateBlock kind="error" text={actionError} />}

      <AdminCard padded={false}>
        {error ? (
          <StateBlock kind="error" text={error} />
        ) : loading ? (
          <StateBlock kind="loading" text="Загружаем категории…" />
        ) : categories.length === 0 ? (
          <StateBlock kind="empty" text="Категорий пока нет" />
        ) : (
          <AdminTable columns={columns} rows={categories} />
        )}
      </AdminCard>

      {editing && (
        <Modal
          title={editing === "new" ? "Новая категория" : "Редактирование категории"}
          onClose={() => setEditing(null)}
        >
          <label className={styles.field}>
            Название
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className={styles.field}>
            Иконка (опционально)
            <input value={icon} onChange={(event) => setIcon(event.target.value)} />
          </label>
          <label className={styles.field}>
            Порядок
            <input
              type="number"
              value={sortOrder}
              onChange={(event) => setSortOrder(Number(event.target.value))}
            />
          </label>
          <ActionRow>
            <button
              type="button"
              className={styles.primary}
              disabled={!name.trim()}
              onClick={() => void save()}
            >
              Сохранить
            </button>
            <button type="button" className={styles.secondary} onClick={() => setEditing(null)}>
              Отмена
            </button>
          </ActionRow>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Удалить категорию"
          message={`Категория «${deleting.name}» будет удалена. Если в ней есть товары, сервер запретит удаление.`}
          confirmLabel="Удалить"
          danger
          onCancel={() => setDeleting(null)}
          onConfirm={() => void remove()}
        />
      )}

      {pendingToggle && (
        <ConfirmDialog
          title={pendingToggle.isActive === false ? "Включить категорию" : "Скрыть категорию"}
          message={
            pendingToggle.isActive === false
              ? `Категория «${pendingToggle.name}» снова появится в публичном каталоге.`
              : `Категория «${pendingToggle.name}» исчезнет из публичного каталога, но товары останутся в базе.`
          }
          confirmLabel={pendingToggle.isActive === false ? "Включить" : "Скрыть"}
          danger={pendingToggle.isActive !== false}
          onCancel={() => setPendingToggle(null)}
          onConfirm={() => void toggleActive(pendingToggle)}
        />
      )}

      {pendingSort && (
        <ConfirmDialog
          title="Изменить порядок"
          message={`Категория «${pendingSort.category.name}»: порядок ${pendingSort.category.sortOrder ?? 0} → ${pendingSort.value}.`}
          confirmLabel="Сохранить"
          onCancel={() => setPendingSort(null)}
          onConfirm={() => void changeOrder(pendingSort.category, pendingSort.value)}
        />
      )}
    </div>
  );
}

function SortOrderInput({
  category,
  onCommit,
}: {
  category: AdminCategoryDto;
  onCommit: (value: number) => void;
}) {
  const [value, setValue] = useState(category.sortOrder ?? 0);

  useEffect(() => setValue(category.sortOrder ?? 0), [category.sortOrder]);

  const commit = () => {
    const next = Number(value);
    if (!Number.isFinite(next) || next === (category.sortOrder ?? 0)) return;
    onCommit(next);
  };

  return (
    <input
      className={styles.orderInput}
      type="number"
      value={value}
      onChange={(event) => setValue(Number(event.target.value))}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") {
          setValue(category.sortOrder ?? 0);
          event.currentTarget.blur();
        }
      }}
    />
  );
}

export default observer(AdminCategoriesPage);
