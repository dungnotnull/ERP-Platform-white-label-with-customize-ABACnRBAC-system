import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button, type ButtonProps } from "@/components/ui/Button";

interface BackButtonProps extends Omit<ButtonProps, "children"> {
  label?: string;
}

export default function BackButton({
  label,
  onClick,
  variant = "outline",
  size = "sm",
  className,
  ...props
}: BackButtonProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={onClick ?? (() => navigate(-1))}
      {...props}
    >
      <ArrowLeft size={18} />
      {label ?? t("common.back")}
    </Button>
  );
}
