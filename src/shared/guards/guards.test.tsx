import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RequireAdmin from "./RequireAdmin";
import RequireRole from "./RequireRole";

const { accountStore } = vi.hoisted(() => ({
  accountStore: {
    initialized: true,
    isAuthenticated: true,
    role: "admin" as "admin" | "buyer" | "seller",
  },
}));

vi.mock("@shared/stores/accountStore", () => ({ accountStore }));

function renderAdminGuard() {
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<div>Admin content</div>} />
        </Route>
        <Route path="/admin/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderSellerGuard() {
  return render(
    <MemoryRouter initialEntries={["/seller"]}>
      <Routes>
        <Route element={<RequireRole roles={["seller"]} />}>
          <Route path="/seller" element={<div>Seller content</div>} />
        </Route>
        <Route path="/" element={<div>Home page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("route guards", () => {
  beforeEach(() => {
    accountStore.initialized = true;
    accountStore.isAuthenticated = true;
    accountStore.role = "admin";
  });

  it("shows a loader instead of an empty screen while account is loading", () => {
    accountStore.initialized = false;
    renderAdminGuard();
    expect(screen.getByRole("status")).toHaveTextContent("Проверяем доступ…");
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
    expect(screen.queryByText("Login page")).not.toBeInTheDocument();
  });

  it("sends anonymous admin visitors to the admin login", () => {
    accountStore.isAuthenticated = false;
    renderAdminGuard();
    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
  });

  it("shows an explicit forbidden screen to non-admins", () => {
    accountStore.role = "buyer";
    renderAdminGuard();
    expect(screen.getByText("Доступ запрещён")).toBeInTheDocument();
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
  });

  it("lets admins through", () => {
    renderAdminGuard();
    expect(screen.getByText("Admin content")).toBeInTheDocument();
  });

  it("uses the same loader in the role guard", () => {
    accountStore.initialized = false;
    renderSellerGuard();
    expect(screen.getByRole("status")).toHaveTextContent("Проверяем доступ…");
    expect(screen.queryByText("Seller content")).not.toBeInTheDocument();
    expect(screen.queryByText("Home page")).not.toBeInTheDocument();
  });

  it("redirects wrong roles from the role guard", () => {
    accountStore.role = "buyer";
    renderSellerGuard();
    expect(screen.getByText("Home page")).toBeInTheDocument();
    expect(screen.queryByText("Seller content")).not.toBeInTheDocument();
  });

  it("lets allowed roles through", () => {
    accountStore.role = "seller";
    renderSellerGuard();
    expect(screen.getByText("Seller content")).toBeInTheDocument();
  });
});
