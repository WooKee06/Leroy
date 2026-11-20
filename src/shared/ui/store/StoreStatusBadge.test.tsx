import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { accountStore } from "@shared/stores/accountStore";
import StoreStatusBadge from "./StoreStatusBadge";

describe("StoreStatusBadge", () => {
  afterEach(() => {
    accountStore.userId = undefined;
  });

  it("opens the dialog with seller-specific copy for a pending own store", async () => {
    accountStore.userId = "u1";

    render(
      <StoreStatusBadge
        seller={{
          verified: false,
          moderationStatus: "pending",
          moderationReason: null,
          ownerId: "u1",
        }}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Статус магазина: Ожидает проверки/ }),
    );

    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Магазин ожидает проверки")).toBeTruthy();
    expect(
      screen.getByText(/публикация товаров в каталог недоступна/i),
    ).toBeTruthy();
  });

  it("shows a neutral explanation to non-owners and displays the rejection reason", async () => {
    accountStore.userId = "u2";

    render(
      <StoreStatusBadge
        seller={{
          verified: false,
          moderationStatus: "rejected",
          moderationReason: "Некорректное описание",
          ownerId: "u1",
        }}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Статус магазина: Отклонён/ }),
    );

    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Некорректное описание")).toBeTruthy();
    expect(
      screen.getByText(/Магазин не прошёл проверку администрации Avilon/),
    ).toBeTruthy();
  });
});
