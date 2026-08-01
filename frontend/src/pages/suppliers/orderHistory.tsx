import PageTopBar from "@/components/PageTopBar";
import OrderHistoryDataList from "./partial/OrderHistoryDataList";
import { ListOrderedIcon, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";

export default function OrderHistory() {
  const { t } = useTranslation();
  const params = useParams();
  const supplierId = params.id as string;
  const navigate = useNavigate();

  return (
    <>
      <div className="pr-5 md:pr-[50px] md:pl-0">
        <PageTopBar
          title={t("purchase.order.orderHistory")}
          description={t("purchase.description")}
          Icon={ListOrderedIcon}
        />

        {/* ⭐ Nút Quay lại */}
        <Button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-lg border hover:bg-blue-900"
          size="sm"
        >
          <ArrowLeft size={18} />
          {t("common.back") ?? "Quay lại"}
        </Button>
      </div>

      <OrderHistoryDataList id={supplierId} />
    </>
  );
}
