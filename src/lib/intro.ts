// Coordination between the homepage arrival intro overlay and the hero section.
// The intro dispatches INTRO_DONE_EVENT as it starts lifting so the hero can
// play its entrance animation exactly as the site is revealed.
export const INTRO_DONE_EVENT = "alqibla:intro-done";

declare global {
  interface Window {
    // Set synchronously (before hydration) on the homepage so the hero knows
    // to wait for the intro to finish before animating in.
    __alqiblaIntroPlaying?: boolean;
  }
}
