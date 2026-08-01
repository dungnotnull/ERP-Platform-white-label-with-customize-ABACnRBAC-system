// BE API types
export type BERoom = {
  id: string;
  name: string;
  jpName: string;
  capacity: number;
  description: string;
  isActive: boolean;
};

export type BEBookingEvent = {
  id: string;
  roomIds: string[];
  title: string;
  departmentIds: string[];
  participantIds: string[];
  conflictedUsers: string[];
  creatorId: string;
  startTime: string;
  endTime: string;
  note: string;
  jpTitle: string;
  jpNote: string;
  status: string;
  isDeleted: boolean;
  deletedAt: string | null;
  history: unknown[];
  version: number;
};

// UI types for the components
export type Room = {
  id: string;
  name: string;
  capacity: string;
};

export type BookingEvent = {
  id: string;
  roomId: string;
  title: string;
  start: string;
  end: string;
  tag?: string;
  date?: string;
  departmentId?: string;
  departments?:[
    {
        id: string,
        nameVi: string,
        nameJa?: string
    }
  ];
  participantIds?: string[];
  memo?: string;
  conflictedUsers?: string[];
};
