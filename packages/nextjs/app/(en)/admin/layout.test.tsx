import { describe, expect, it } from "vitest";
import AdminLayout, { metadata } from "~~/app/(en)/admin/layout";
import { renderMarkup } from "~~/utils/testing/render";

describe("/admin layout", () => {
  it("keeps the owner console out of search results", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.title).toBe("Admin");
  });

  it("renders the admin page unchanged", () => {
    expect(renderMarkup(<AdminLayout>admin page</AdminLayout>)).toBe("admin page");
  });
});
