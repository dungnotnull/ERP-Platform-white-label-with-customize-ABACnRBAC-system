import { Room } from "../types";
import { TIME_COL_WIDTH, ROOM_COL_WIDTH } from "../constants";
import { cn } from "@/lib/utils";

interface RoomHeaderProps {
  rooms: Room[];
}

export default function RoomHeader({ rooms }: RoomHeaderProps) {
  const contentWidth = TIME_COL_WIDTH + (ROOM_COL_WIDTH * rooms.length);

  return (
    <div
      className={cn("sticky z-20 self-start flex items-center bg-white py-8", rooms?.length === 1 ? "top-[-1px]" : "top-[-1px]")}
      style={{ height: 56, minWidth: contentWidth }}
    >
      <div
        className="sticky left-0 z-30 shrink-0 border-b border-r border-transparent bg-white"
        style={{ width: TIME_COL_WIDTH }}
      />
      {rooms.map(room => (
        <div
          key={room.id}
          className={rooms.length === 1
            ? "flex flex-1 flex-col items-center justify-center gap-0.5 border-b border-r border-gray-100 px-2 text-center"
            : "flex w-[140px] shrink-0 flex-col items-center justify-center gap-0.5 border-b border-r border-transparent px-2 text-center md:w-auto md:flex-1 md:min-w-0"
          }
        >
          <span className="text-sm font-semibold text-[#5A5A5E] md:text-lg">
            {room.name}
          </span>
          <span className="text-[11px] text-[#575757] md:text-[14px]">
            {room.capacity}
          </span>
        </div>
      ))}
    </div>
  );
}
