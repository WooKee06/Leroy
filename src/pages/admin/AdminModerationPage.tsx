import { PageIntro } from "@shared/ui/admin/AdminUi";
import AdminProductList from "@widgets/admin/AdminProductList/AdminProductList";

export default function AdminModerationPage() {
  return (
    <div>
      <PageIntro
        title="Модерация товаров"
        description="Проверяйте новые и изменённые товары, принимайте решения и сохраняйте историю."
      />
      <AdminProductList mode="moderation" />
    </div>
  );
}
