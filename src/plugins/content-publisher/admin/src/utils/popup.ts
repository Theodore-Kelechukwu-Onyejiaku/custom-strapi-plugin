// utils/popup.ts
//
// Resolves once the sign-in popup is closed. While the popup is on linkedin.com or
// facebook.com its document cannot be read, so the check below throws and is ignored. Once
// the provider sends it back to this server's callback page it becomes readable: a success
// page is closed for the editor, a failure page is left open so its message can be read.

const CHECK_EVERY_MS = 500;

export const waitForPopup = (popup: Window) =>
  new Promise<void>((resolve) => {
    const timer = window.setInterval(() => {
      if (popup.closed) {
        window.clearInterval(timer);
        resolve();
        return;
      }

      try {
        // the title is set by resultPage in server/src/controllers/connection.ts
        if (popup.document.title === 'Connected') popup.close();
      } catch {
        // still on the provider's site
      }
    }, CHECK_EVERY_MS);
  });
