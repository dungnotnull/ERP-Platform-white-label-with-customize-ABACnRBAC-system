import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { GOOGLE_AUTH_MESSAGE_TYPE } from "@/shared/constants/google-auth.constant.ts";
import i18n from "@/lib/i18n/i18n";
import CustomLoader from "@/components/ui/CustomLoader";

enum Status {
  PROCESSING = "processing",
  SUCCESS = "success",
  ERROR = "error"
}

interface AuthPopupPayload {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  };
  error?: string;
}

function readCallbackParams() {
  return new URLSearchParams(window.location.search);
}

const GoogleAuthCallback = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<Status>(Status.PROCESSING);
  const [message, setMessage] = useState(() =>
    i18n.t("auth.googleCallback.processing")
  );
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const notifyOpener = (payload: AuthPopupPayload) => {
      try {
        if (!window.opener || window.opener.closed) return;

        window.opener.postMessage(
          {
            type: GOOGLE_AUTH_MESSAGE_TYPE,
            payload
          },
          window.location.origin
        );
      } catch {
        // Cross-Origin-Opener-Policy có thể chặn truy cập opener
      }
    };

    const urlParams = readCallbackParams();
    const accessToken = urlParams.get("accessToken");
    const refreshToken = urlParams.get("refreshToken");
    const expiresIn = urlParams.get("expiresIn");
    const success = urlParams.get("success");
    const error = urlParams.get("error");
    const errorMessage = urlParams.get("message");

    if (!window.location.search) {
      setStatus(Status.ERROR);
      setMessage(i18n.t("auth.googleCallback.missingData"));
      return;
    }

    if (success === "false" || (!accessToken && error)) {
      const messageText =
        errorMessage ?? error ?? i18n.t("auth.googleCallback.authFailed");

      setStatus(Status.ERROR);
      setMessage(error ? `[${error}] ${messageText}` : messageText);
      notifyOpener({ success: false, error: messageText });
      window.setTimeout(() => window.close(), 800);
      return;
    }

    if (!accessToken) {
      setStatus(Status.ERROR);
      setMessage(i18n.t("auth.googleCallback.noToken"));
      notifyOpener({
        success: false,
        error: i18n.t("auth.googleCallback.noToken")
      });
      window.setTimeout(() => window.close(), 800);
      return;
    }

    const payload: AuthPopupPayload = {
      success: true,
      data: {
        accessToken,
        refreshToken: refreshToken ?? undefined,
        expiresIn: expiresIn ? Number(expiresIn) : undefined
      }
    };

    try {
      localStorage.setItem("google-auth-result", JSON.stringify(payload));
    } catch (storageError) {
      console.error("Error storing in localStorage:", storageError);
    }

    notifyOpener(payload);
    setStatus(Status.SUCCESS);
    setMessage(i18n.t("auth.googleCallback.success"));
    window.setTimeout(() => window.close(), 800);
  }, []);

  const handleCloseWindow = () => {
    window.close();
  };

  const title =
    status === Status.SUCCESS
      ? t("auth.googleCallback.successTitle")
      : status === Status.ERROR
        ? t("auth.googleCallback.errorTitle")
        : t("auth.googleCallback.processingTitle");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>

        <div className="my-4 text-gray-700">{message}</div>

        {status === Status.PROCESSING && (
          <div className="flex justify-center my-4">
            <CustomLoader />
          </div>
        )}

        {status === Status.ERROR && (
          <button onClick={handleCloseWindow} className="btn btn-primary mt-4">
            {t("auth.googleCallback.closeWindow")}
          </button>
        )}
      </div>
    </div>
  );
};

export default GoogleAuthCallback;
