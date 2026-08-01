import { AuthResponse } from "@/shared/@types/authentication.type";
import { GOOGLE_AUTH_MESSAGE_TYPE } from "@/shared/constants/google-auth.constant.ts";
import i18n from "@/lib/i18n/i18n";

interface PopupResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const POPUP_NAME = "googleAuthPopup";

let activePopup: Window | null = null;

function getPopupPosition() {
  const width = 500;
  const height = 600;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2.5;
  return `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`;
}

/**
 * Must be called synchronously inside a user click handler,
 * before any await/setState, or browsers will block the popup.
 */
export function startGoogleAuthPopup(): Window | null {
  if (activePopup && !activePopup.closed) {
    try {
      activePopup.close();
    } catch {
      // ignore
    }
  }

  try {
    localStorage.removeItem("google-auth-result");
  } catch {
    // ignore
  }

  const popup = window.open("about:blank", POPUP_NAME, getPopupPosition());
  activePopup = popup;

  if (!popup) {
    return null;
  }

  try {
    const title = i18n.t("auth.googleCallback.processingTitle", "Google Sign In");
    const message = i18n.t("auth.googleCallback.processing", "Redirecting to Google...");

    popup.document.title = title;
    popup.document.body.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:Inter,system-ui,sans-serif;background-color:#f8fafc;color:#334155;text-align:center;">
        <div style="width:40px;height:40px;border:3px solid #e2e8f0;border-top-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite;margin-bottom:24px;"></div>
        <p style="font-size:16px;font-weight:500;margin:0;">${message}</p>
        <style>
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          body { margin: 0; overflow: hidden; }
        </style>
      </div>
    `;
  } catch {
    // ignore cross-origin errors if the browser already navigated
  }

  return popup;
}

export function isPopupBlocked(popup: Window | null): popup is null {
  if (!popup) return true;
  try {
    return popup.closed;
  } catch {
    // Cross-Origin-Opener-Policy có thể chặn đọc popup.closed — coi như còn mở.
    return false;
  }
}

export async function completeGoogleAuthPopup(
  popup: Window,
  authUrl: string
): Promise<PopupResult<AuthResponse>> {
  popup.location.href = authUrl;
  return waitForGoogleAuthPopupResult(popup);
}

function waitForGoogleAuthPopupResult(
  popup: Window
): Promise<PopupResult<AuthResponse>> {
  return new Promise(resolve => {
    let settled = false;
    let closedFallbackTimeout: ReturnType<typeof setTimeout> | undefined;

    const finish = (result: PopupResult<AuthResponse>) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", onMessage);
      clearInterval(popupCheckInterval);
      clearTimeout(closedFallbackTimeout);
      clearTimeout(timeoutId);
      activePopup = null;
      resolve(result);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== GOOGLE_AUTH_MESSAGE_TYPE) return;

      try {
        if (!popup.closed) {
          popup.close();
        }
      } catch {
        // ignore COOP / close errors
      }

      finish(event.data.payload as PopupResult<AuthResponse>);
    };

    window.addEventListener("message", onMessage);

    const popupCheckInterval = setInterval(() => {
      let isClosed = false;
      try {
        isClosed = popup.closed;
      } catch {
        // Cross-Origin-Opener-Policy chặn đọc closed — bỏ qua lần poll này
        return;
      }

      if (isClosed && !settled) {
        clearInterval(popupCheckInterval);

        closedFallbackTimeout = setTimeout(() => {
          if (settled) return;

          try {
            const storedResult = localStorage.getItem("google-auth-result");
            if (storedResult) {
              localStorage.removeItem("google-auth-result");
              const parsed = JSON.parse(storedResult);
              if (parsed?.success) {
                finish(parsed);
                return;
              }
            }
          } catch {
            // ignore
          }

          finish({
            success: false,
            error: "Authentication cancelled"
          });
        }, 1000);
      }

      if (settled) return;

      try {
        const currentUrl = popup.location.href;
        if (
          !currentUrl.startsWith(window.location.origin) ||
          !currentUrl.includes("/auth/callback")
        ) {
          return;
        }

        const urlParams = new URLSearchParams(new URL(currentUrl).search);
        const accessToken =
          urlParams.get("accessToken") || urlParams.get("token");
        const refreshToken =
          urlParams.get("refreshToken") || urlParams.get("refresh");

        if (accessToken) {
          if (!popup.closed) {
            try {
              popup.close();
            } catch {
              // ignore
            }
          }

          finish({
            success: true,
            data: {
              accessToken,
              refreshToken: refreshToken ?? "",
              expiresIn: Number(urlParams.get("expiresIn") ?? 0)
            }
          });
        }
      } catch (error) {
        if (
          !(error instanceof DOMException && error.name === "SecurityError")
        ) {
          console.error("Error polling popup:", error);
        }
      }
    }, 500);

    const timeoutId = setTimeout(() => {
      if (!popup.closed) {
        try {
          popup.close();
        } catch {
          // ignore
        }
      }

      finish({
        success: false,
        error: "Authentication timed out"
      });
    }, 120000);
  });
}

/** @deprecated Use startGoogleAuthPopup + completeGoogleAuthPopup instead */
export async function openGoogleAuthPopup(
  authUrl: string
): Promise<PopupResult<AuthResponse>> {
  const popup = startGoogleAuthPopup();
  if (isPopupBlocked(popup)) {
    return {
      success: false,
      error: "Popup blocked by browser. Please allow popups for this site."
    };
  }

  return completeGoogleAuthPopup(popup, authUrl);
}
