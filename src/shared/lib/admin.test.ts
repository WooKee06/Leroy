import { describe, expect, it } from "vitest";
import type { AdminAuditLogDto } from "@shared/api/models";
import {
  ACTION_LABELS,
  actionLabel,
  auditTargetHref,
  canAdminChangeOrderStatus,
  canModerateProduct,
  canModerateStore,
} from "./admin";

function log(overrides: Partial<AdminAuditLogDto> = {}): AdminAuditLogDto {
  return {
    id: "log-1",
    action: "product.approve",
    entityType: "product",
    entityId: "entity-1",
    createdAt: "2026-11-21T10:00:00.000Z",
    ...overrides,
  };
}

describe("auditTargetHref", () => {
  it("links every entity type that has an admin detail page", () => {
    expect(auditTargetHref(log({ entityType: "product" }))).toBe(
      "/admin/catalog/entity-1",
    );
    expect(auditTargetHref(log({ entityType: "store" }))).toBe(
      "/admin/sellers/entity-1",
    );
    expect(auditTargetHref(log({ entityType: "complaint" }))).toBe(
      "/admin/complaints/entity-1",
    );
    expect(auditTargetHref(log({ entityType: "user" }))).toBe(
      "/admin/users/entity-1",
    );
    expect(auditTargetHref(log({ entityType: "category" }))).toBe(
      "/admin/categories",
    );
  });

  it("does not link entries without a detail page or entity id", () => {
    expect(auditTargetHref(log({ entityType: "order" }))).toBeNull();
    expect(auditTargetHref(log({ entityId: null }))).toBeNull();
  });
});

describe("actionLabel", () => {
  it("uses the full shared action map", () => {
    for (const [action, label] of Object.entries(ACTION_LABELS)) {
      expect(actionLabel(action)).toBe(label);
    }
  });

  it("falls back to the raw action", () => {
    expect(actionLabel("unknown.action")).toBe("unknown.action");
  });
});

describe("admin transition mirrors", () => {
  it("allows only one order step forward and cancellable states", () => {
    expect(canAdminChangeOrderStatus("paid", "accepted")).toBe(true);
    expect(canAdminChangeOrderStatus("paid", "preparing")).toBe(false);
    expect(canAdminChangeOrderStatus("shipped", "cancelled")).toBe(false);
    expect(canAdminChangeOrderStatus("accepted", "cancelled")).toBe(true);
    expect(canAdminChangeOrderStatus("delivered", "paid")).toBe(false);
  });

  it("never allows self-approval actions through moderation", () => {
    expect(canModerateProduct("pending_review", "approve")).toBe(true);
    expect(canModerateProduct("blocked", "approve")).toBe(false);
    expect(canModerateStore("pending", "verify")).toBe(true);
    expect(canModerateStore("blocked", "verify")).toBe(false);
  });
});
