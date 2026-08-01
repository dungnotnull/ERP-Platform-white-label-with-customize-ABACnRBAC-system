import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext.tsx";
import { AppRouteNames, appRoutes } from "@/shared/constants/routes.constant";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import LanguageSelector from "@/components/patterns/LanguageSelector.tsx";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("auth.register.error.passwordMismatch"));
      return;
    }

    setSubmitting(true);
    try {
      const user = await register(name, email, password);
      if (!user) {
        throw new Error(t("auth.register.error.failed"));
      }
      toast.success(t("auth.register.success"));
      navigate(appRoutes[AppRouteNames.HOME], { replace: true });
    } catch (err) {
      const message =
        typeof err === "string"
          ? err
          : err instanceof Error
            ? err.message
            : t("auth.register.error.failed");
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 lg:p-8 bg-slate-100">
      <div className="absolute top-4 right-4 lg:top-8 lg:right-8 z-50">
        <LanguageSelector labelShowType="nativeName" />
      </div>

      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-2xl p-8 flex flex-col">
        <h1 className="text-2xl font-semibold text-center text-slate-900 mb-6">
          {t("auth.register.title")}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-medium text-slate-700">
              {t("auth.register.name")}
            </label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              {t("auth.register.email")}
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
              {t("auth.register.password")}
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-slate-700"
            >
              {t("auth.register.confirmPassword")}
            </label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting
              ? t("common.handling")
              : t("auth.register.registerButton")}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          {t("auth.register.haveAccount")}{" "}
          <button
            type="button"
            onClick={() => navigate(appRoutes[AppRouteNames.SIGN_IN])}
            className="text-primary font-medium hover:underline"
          >
            {t("auth.register.loginHere")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
