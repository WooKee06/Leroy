import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RolePage from "./RolePage";

const { accountStore } = vi.hoisted(() => ({
  accountStore: {
    role: "buyer" as "buyer" | "seller" | "admin",
    updateRole: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@shared/stores/accountStore", () => ({ accountStore }));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/role"]}>
      <Routes>
        <Route path="/role" element={<RolePage />} />
        <Route path="/admin" element={<div>Admin panel</div>} />
        <Route path="/settings" element={<div>Settings</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RolePage", () => {
  beforeEach(() => {
    accountStore.role = "buyer";
    accountStore.updateRole.mockReset();
    accountStore.updateRole.mockResolvedValue(undefined);
  });

  it("offers only buyer and seller to a buyer", () => {
    renderPage();
    expect(screen.getByText("Покупатель")).toBeInTheDocument();
    expect(screen.getByText("Продавец")).toBeInTheDocument();
    expect(screen.queryByText("Администратор")).not.toBeInTheDocument();
    expect(screen.queryByText(/модерация/i)).not.toBeInTheDocument();
  });

  it("does not show a locked admin row to a seller", () => {
    accountStore.role = "seller";
    renderPage();
    expect(screen.getByText("Продавец")).toBeInTheDocument();
    expect(screen.queryByText("Администратор")).not.toBeInTheDocument();
  });

  it("still switches to seller", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Продавец/ }));
    await waitFor(() =>
      expect(accountStore.updateRole).toHaveBeenCalledWith("seller"),
    );
  });

  it("sends admins to the admin panel instead of the public switcher", () => {
    accountStore.role = "admin";
    renderPage();
    expect(screen.getByText("Admin panel")).toBeInTheDocument();
    expect(screen.queryByText("Администратор")).not.toBeInTheDocument();
  });
});
