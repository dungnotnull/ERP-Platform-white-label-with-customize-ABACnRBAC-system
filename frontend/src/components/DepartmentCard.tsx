import {
  Keyboard,
  LaptopMinimal,
  LucideIcon,
  TabletSmartphone
} from "lucide-react";

import { useRef } from "react";
import { useTranslation } from "react-i18next";

interface DepartmentCardProps {
  DepartmentName?: string;
  backgroundColor?: string;
  /** Phòng ban chưa có thiết bị — hiển thị mờ hơn */
  dimmed?: boolean;
  data?: {
    name: string;
    quantity: number | string;
    icon?: LucideIcon;
  }[];
  deviceDepartmentTotal?: number;
}

const ACCENT = "#2563EB";

const DepartmentCard = ({
  DepartmentName,
  backgroundColor = "#2563EB",
  dimmed = false,
  data = [
    { name: "PC / Máy tính", quantity: 235, icon: LaptopMinimal },
    { name: "Monitor", quantity: "052", icon: TabletSmartphone },
    { name: "Keyboard", quantity: "052", icon: Keyboard }
  ],
  deviceDepartmentTotal
}: DepartmentCardProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // const [isScrollEnd, setIsScrollEnd] = useState(false);
  const { t } = useTranslation();

  // const checkScrollPosition = () => {
  //   const container = scrollContainerRef.current;
  //   if (!container) return;

  //   const { scrollLeft, scrollWidth, clientWidth } = container;

  //   setIsScrollEnd(Math.abs(scrollWidth - clientWidth - scrollLeft) < 5);
  // };

  // useEffect(() => {
  //   const container = scrollContainerRef.current;
  //   if (!container) return;

  //   container.addEventListener("scroll", checkScrollPosition);

  //   checkScrollPosition();

  //   return () => {
  //     container?.removeEventListener("scroll", checkScrollPosition);
  //   };
  // }, []);

  // const handleScroll = () => {
  //   const container = scrollContainerRef.current;
  //   if (!container) return;

  //   const items = container.querySelectorAll(".card-item");
  //   if (!items.length) return;

  //   const itemWidth = items[0].getBoundingClientRect().width;
  //   const gapWidth = 40;
  //   const scrollAmount = itemWidth + gapWidth;

  //   const { scrollLeft, scrollWidth, clientWidth } = container;
  //   const maxScroll = scrollWidth - clientWidth;

  //   if (isScrollEnd) {
  //     container.scrollTo({ left: 0, behavior: "smooth" });
  //   } else {
  //     const newScrollPosition = Math.min(scrollLeft + scrollAmount, maxScroll);
  //     container.scrollTo({ left: newScrollPosition, behavior: "smooth" });
  //   }
  // };

  return (
    <div
      className={`grid grid-cols-[140px_1fr] md:grid-cols-[212px_1fr] items-start gap-3 w-full rounded-tl-[30px] rounded-bl-[30px] py-6 pl-5 md:p-10 mobile:before-gradient-white shadow-[0px_10px_20px_0px_rgba(0,_0,_0,_0.15)] transition-opacity duration-300 ${dimmed ? "opacity-80" : "opacity-100"}`}
      style={{ backgroundColor }}
    >
      <div className="flex flex-col gap-2 text-white">
        <h3 className="text-sm `md:text-base font-semibold">
          {t("dashboard.team")}
        </h3>
        <span className="text-xl md:text-[30px] font-extrabold uppercase leading-tight">
          {DepartmentName}
        </span>
        <span className="flex flex-col gap-2 text-white-200 font-semibold">
          {t("dashboard.totalAssets")} : {deviceDepartmentTotal}
        </span>
      </div>
      <div
        ref={scrollContainerRef}
        className="flex flex-wrap gap-5 md:gap-10 items-start content-start w-full min-w-0 max-h-[220px] md:max-h-[280px] overflow-y-auto overflow-x-hidden pr-2 md:pr-0 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        // onScroll={checkScrollPosition}
      >
        {data.map((item, index) => (
          <div
            key={index}
            className="flex flex-col px-5 md:px-8 py-3 md:py-5 bg-white rounded-[10px] items-center flex-shrink-0 md:gap-3 card-item"
          >
            <div className="flex gap-3 items-center">
              {item.icon && (
                <item.icon
                  size={35}
                  color={ACCENT}
                  className="hidden md:flex"
                />
              )}
              {item.icon && (
                <item.icon
                  size={20}
                  color={ACCENT}
                  className="flex md:hidden"
                />
              )}
              <span className="text-[#2563EB] text-xl md:text-[50px] font-semibold">
                {item.quantity}
              </span>
            </div>
            <div className="text-sm md:text-base text-[#2563EB]">
              {item.name}
            </div>
          </div>
        ))}
      </div>
      {/* <div className="hidden md:flex items-center">
        <Play
          color="#fff"
          fill="#fff"
          size={50}
          className="cursor-pointer hover:scale-110 transition-transform"
          onClick={handleScroll}
        />
      </div> */}
    </div>
  );
};

export default DepartmentCard;
