export const GENERATION_HISTORY_UPDATED_EVENT = "generation-history-updated";
export const GENERATION_HISTORY_DELETED_EVENT = "generation-history-deleted";

export interface GenerationHistoryDeletedDetail {
  workspaceId?: string;
  clearedAll?: boolean;
}

export function notifyGenerationHistoryUpdated() {
  window.dispatchEvent(new CustomEvent(GENERATION_HISTORY_UPDATED_EVENT));
}

export function notifyGenerationHistoryDeleted(
  detail: GenerationHistoryDeletedDetail,
) {
  window.dispatchEvent(
    new CustomEvent(GENERATION_HISTORY_DELETED_EVENT, { detail }),
  );
}
