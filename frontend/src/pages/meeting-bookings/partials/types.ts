export interface TaskItem {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  departmentId: string;
  participantIds: string[];
  meetingRoomIds: string[];
  memo?: string;
}
