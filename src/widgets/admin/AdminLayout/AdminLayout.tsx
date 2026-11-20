import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { FiLogOut, FiMenu, FiX } from "react-icons/fi";
import { accountStore } from "@shared/stores/accountStore";
import AdminSidebar from "@widgets/admin/AdminSidebar/AdminSidebar";
import styles from "./AdminLayout.module.scss";

function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const logout = () => {
    accountStore.logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className={styles.shell}>
      <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.brand}>
          <span className={styles.logo}>A</span>
          <div>
            <strong>Avilon</strong>
            <span>Админ-панель</span>
          </div>
          <button
            type="button"
            className={styles.closeMenu}
            onClick={() => setMenuOpen(false)}
            aria-label="Закрыть меню"
          >
            <FiX size={18} />
          </button>
        </div>
        <AdminSidebar onNavigate={() => setMenuOpen(false)} />
      </aside>

      {menuOpen && (
        <button
          type="button"
          className={styles.backdrop}
          onClick={() => setMenuOpen(false)}
          aria-label="Закрыть меню"
        />
      )}

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setMenuOpen(true)}
            aria-label="Открыть меню"
          >
            <FiMenu size={20} />
          </button>
          <div className={styles.topbarSpacer} />
          <div className={styles.admin}>
            <img className={styles.avatar} src={accountStore.avatar} alt="" />
            <div className={styles.adminText}>
              <strong>{accountStore.displayName}</strong>
              <span>{accountStore.roleLabel}</span>
            </div>
          </div>
          <button type="button" className={styles.logout} onClick={logout}>
            <FiLogOut size={16} />
            <span>Выйти</span>
          </button>
        </header>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default observer(AdminLayout);
