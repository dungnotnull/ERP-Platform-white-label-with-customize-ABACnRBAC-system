import { START_HOUR, END_HOUR, HOUR_HEIGHT } from "../constants";

interface NowLineProps {
  gridHeight: number;
}

export default function NowLine({ gridHeight }: NowLineProps) {
  const now = new Date();
  const minutesFromStart =
    now.getHours() * 60 + now.getMinutes() - START_HOUR * 60;
  if (minutesFromStart < 0 || minutesFromStart > (END_HOUR - START_HOUR) * 60)
    return null;
  const top = (minutesFromStart / 60) * HOUR_HEIGHT;
  return (
    <div
      className="pointer-events-none absolute left-0 right-0 z-10 h-px bg-rose-400"
      style={{ top, maxHeight: gridHeight }}
    >
      <span className="absolute -left-1 -top-[3px] h-[7px] w-[7px] rounded-full bg-rose-400" />
    </div>
  );
}
