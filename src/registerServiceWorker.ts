export const registerServiceWorker = () => {
  if (!import.meta.env.PROD) {
    return;
  }

  if (!('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    const serviceWorkerUrl = `${import.meta.env.BASE_URL}sw.js`;

    navigator.serviceWorker.register(serviceWorkerUrl).catch(() => {
      // Ignore registration failures and keep the app usable without offline support.
    });
  });
};
