import { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import LoginGoogle from "@/features/auth/LoginGoogle";
import { useUserProfile } from "@/shared/hooks/useUserProfile.ts";
import { useAuth } from "@/context/AuthContext.tsx";
import { AppRouteNames, appRoutes } from "@/shared/constants/routes.constant";
import Loading from "@/pages/_layout/loading.tsx";
import LanguageSelector from "@/components/patterns/LanguageSelector.tsx";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

const Login = () => {
  const { isAuthenticated, isLoading } = useUserProfile();
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate(appRoutes[AppRouteNames.HOME], { replace: true });
    }
  }, [isAuthenticated, navigate, isLoading]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(email, password);
      if (!user) {
        setError(t("auth.login.error.invalidCredentials"));
      } else {
        toast.success(t("auth.login.loginButton"));
        navigate(appRoutes[AppRouteNames.HOME], { replace: true });
      }
    } catch (err) {
      const message =
        typeof err === "string"
          ? err
          : err instanceof Error
            ? err.message
            : t("auth.login.error.invalidCredentials");
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 lg:p-8 bg-slate-100">
      <div className="absolute top-4 right-4 lg:top-8 lg:right-8 z-50">
        <LanguageSelector labelShowType="nativeName" />
      </div>

      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-2xl p-8 flex flex-col">
        <h1 className="text-2xl font-semibold text-center text-slate-900 mb-6">
          {t("auth.login.title")}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              {t("auth.login.email")}
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              {t("auth.login.password")}
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? t("common.handling") : t("auth.login.loginButton")}
          </Button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-400">{t("auth.login.or")}</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <LoginGoogle />

        <div className="mt-6 text-center text-sm text-slate-600">
          {t("auth.login.noAccount")}{" "}
          <button
            type="button"
            onClick={() => navigate(appRoutes[AppRouteNames.SIGN_UP])}
            className="text-primary font-medium hover:underline"
          >
            {t("auth.login.registerHere")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
