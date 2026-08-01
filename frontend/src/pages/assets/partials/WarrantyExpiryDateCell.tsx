import { useTranslation } from "react-i18next";

interface WarrantyExpiryDateCellProps {
  dateValue?: string | null;
}

export const WarrantyExpiryDateCell = ({
  dateValue
}: WarrantyExpiryDateCellProps) => {
  const { t } = useTranslation();

  if (!dateValue) {
    return <span className="text-gray-400">{t("assets.warranty.noDate")}</span>;
  }

  const warrantyExpiryDate = new Date(dateValue);

  if (isNaN(warrantyExpiryDate.getTime())) {
    return (
      <span className="text-gray-400">{t("assets.warranty.invalidDate")}</span>
    );
  }

  const currentDate = new Date();
  const timeRemaining = warrantyExpiryDate.getTime() - currentDate.getTime();

  const getStatusStyles = (): string => {
    return "text-gray-500 font-medium";
  };

  const formattedDate = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(warrantyExpiryDate);

  const tooltipKey =
    timeRemaining > 0
      ? "assets.warranty.expiresOn"
      : "assets.warranty.expiredOn";

  return (
    <span
      className={getStatusStyles()}
      title={t(tooltipKey, {
        date: warrantyExpiryDate.toLocaleDateString()
      })}
    >
      {formattedDate}
    </span>
  );
};
