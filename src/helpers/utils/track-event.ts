/**
 * Analytics shim for the paywall showcases.
 *
 * The screens these paywalls came from report to a real analytics provider.
 * This app ships no provider, so the call sites are kept as documentation of
 * where the events fire and only log in development.
 */
export const trackEvent = (
  event: string,
  properties?: Record<string, unknown>
) => {
  if (__DEV__) {
    console.log(`[track] ${event}`, properties ?? {});
  }
};
