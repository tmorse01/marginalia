import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";
import type { MutationCtx } from "./_generated/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx: MutationCtx, { userId }) {
      const user = await ctx.db.get(userId);
      if (!user) return;

      const patches: {
        subscriptionTier?: string;
        createdAt?: number;
      } = {};

      if (user.subscriptionTier === undefined) {
        patches.subscriptionTier =
          user.email === "test@example.com" ? "premium" : "free";
      } else if (
        user.email === "test@example.com" &&
        user.subscriptionTier !== "premium"
      ) {
        patches.subscriptionTier = "premium";
      }

      if (user.createdAt === undefined) {
        patches.createdAt = Date.now();
      }

      if (Object.keys(patches).length > 0) {
        await ctx.db.patch(userId, patches);
      }
    },
  },
});
