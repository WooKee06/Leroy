import { PageIntro } from "@shared/ui/admin/AdminUi";
import AdminProductList from "@widgets/admin/AdminProductList/AdminProductList";

export default function AdminCatalogPage() {
  return (
    <div>
      <PageIntro
        title="Каталог товаров"
        description="Все товары маркетплейса с поиском, фильтрами и доступом к истории модерации."
      />
      <AdminProductList mode="catalog" />
    </div>
  );
}
