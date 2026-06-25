export const USER_CREDITS_UPDATED_EVENT = "canvasai:credits-updated";

export type UserCreditsUpdatedDetail = {
  credits: number;
};

export function dispatchUserCreditsUpdated(credits: number) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<UserCreditsUpdatedDetail>(USER_CREDITS_UPDATED_EVENT, {
      detail: { credits },
    }),
  );
}
