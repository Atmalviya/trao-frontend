import type { Kit, KitDetail } from "@/lib/types";
import type { QueryClient } from "@tanstack/react-query";

export function syncKitCache(
  queryClient: QueryClient,
  kitId: string,
  patch: Partial<Kit> | Kit,
) {
  queryClient.setQueryData<KitDetail>(["kit", kitId], (old) => {
    if (!old?.kit) return old;
    return {
      ...old,
      kit: { ...old.kit, ...patch },
    };
  });
}

/** Keep schedule/coverage in sync when question mutations reschedule on the server. */
export function syncKitFromQuestionMutation(
  queryClient: QueryClient,
  kitId: string,
  kit: Pick<Kit, "questions" | "schedule" | "coverage">,
) {
  syncKitCache(queryClient, kitId, {
    questions: kit.questions,
    schedule: kit.schedule,
    coverage: kit.coverage,
  });
}
