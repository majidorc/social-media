export const GENERATION_HISTORY_UPDATED_EVENT = "generation-history-updated";

export function notifyGenerationHistoryUpdated() {
  window.dispatchEvent(new CustomEvent(GENERATION_HISTORY_UPDATED_EVENT));
}
