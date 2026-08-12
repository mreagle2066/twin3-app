import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const { createCampaign, getActiveXAccessToken } = vi.hoisted(() => ({
  createCampaign: vi.fn(),
  getActiveXAccessToken: vi.fn(),
}));

vi.mock("./db", () => ({ createCampaign }));
vi.mock("./xOAuth", () => ({
  disconnectXAccount: vi.fn(),
  getActiveXAccessToken,
}));

import { appRouter } from "./routers";

function createContext(): TrpcContext {
  return {
    user: {
      id: 9,
      openId: "disconnected-workspace",
      name: "Disconnected user",
      email: null,
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("X-guarded growth procedures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getActiveXAccessToken.mockRejectedValue(new Error("Connect an X account before using X agent actions."));
  });

  it("blocks scheduling a campaign when the workspace has no connected X account", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.growth.campaigns.create({ name: "Qualified founder outreach", targetAudience: "SaaS founders who discuss outbound", dailyLimit: 20, status: "scheduled" }))
      .rejects.toThrow("Connect an X account");
    expect(getActiveXAccessToken).toHaveBeenCalledWith(9);
    expect(createCampaign).not.toHaveBeenCalled();
  });

  it("blocks launching an active campaign when the workspace has no connected X account", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.growth.campaigns.create({ name: "Active founder outreach", targetAudience: "SaaS founders who discuss outbound", dailyLimit: 20, status: "active" }))
      .rejects.toThrow("Connect an X account");
    expect(getActiveXAccessToken).toHaveBeenCalledWith(9);
    expect(createCampaign).not.toHaveBeenCalled();
  });

  it("blocks connected-account verification when the workspace has no X account", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.growth.xAccount.verifyAccess()).rejects.toThrow("Connect an X account");
    expect(getActiveXAccessToken).toHaveBeenCalledWith(9);
  });
});
