import { beforeEach, describe, expect, it, vi } from "vitest";

import { listStores, updateStore } from "@/api/admin/stores";
import { listAllTryOnJobs, retryTryOnJob } from "@/api/admin/tryon-jobs";
import { listUsers, updateUser } from "@/api/admin/users";

const { getMock, patchMock, postMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  patchMock: vi.fn(),
  postMock: vi.fn(),
}));

vi.mock("@/api/client", () => ({
  apiClient: { get: getMock, patch: patchMock, post: postMock },
}));

const apiUser = {
  id: "u-1",
  email: "ada@example.com",
  full_name: "Ada",
  role: "shopper",
  is_active: true,
  created_at: "2026-11-01T10:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("admin users API", () => {
  it("lists users from /admin/users and fills the untracked last_login_at", async () => {
    getMock.mockResolvedValueOnce({ data: [apiUser] });

    const users = await listUsers();

    expect(getMock).toHaveBeenCalledWith("/admin/users", { params: { limit: 200 } });
    expect(users).toEqual([{ ...apiUser, last_login_at: null }]);
  });

  it("sends role and activation changes as a PATCH", async () => {
    patchMock.mockResolvedValueOnce({ data: { ...apiUser, role: "brand_admin" } });

    const updated = await updateUser("u-1", { role: "brand_admin" });

    expect(patchMock).toHaveBeenCalledWith("/admin/users/u-1", { role: "brand_admin" });
    expect(updated.role).toBe("brand_admin");
  });
});

describe("admin stores API", () => {
  it("lists from /admin/stores and patches verify/suspend", async () => {
    getMock.mockResolvedValueOnce({ data: [] });
    patchMock.mockResolvedValueOnce({ data: { id: "s-1", is_suspended: true } });

    await listStores();
    await updateStore("s-1", { is_suspended: true });

    expect(getMock).toHaveBeenCalledWith("/admin/stores", { params: { limit: 200 } });
    expect(patchMock).toHaveBeenCalledWith("/admin/stores/s-1", { is_suspended: true });
  });
});

describe("admin try-on jobs API", () => {
  it("lists from /admin/tryon-jobs and retries via POST", async () => {
    getMock.mockResolvedValueOnce({ data: [] });
    postMock.mockResolvedValueOnce({ data: { id: "j-1", status: "pending" } });

    await listAllTryOnJobs();
    const retried = await retryTryOnJob("j-1");

    expect(getMock).toHaveBeenCalledWith("/admin/tryon-jobs", { params: { limit: 200 } });
    expect(postMock).toHaveBeenCalledWith("/admin/tryon-jobs/j-1/retry");
    expect(retried.status).toBe("pending");
  });
});
