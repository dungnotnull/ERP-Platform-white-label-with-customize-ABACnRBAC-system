import { apiClient } from "@/services/api/apiClient.service";
import { BERoom, BEBookingEvent } from "../types";

export interface TimelineQueryParams {
  startDate: string;
  endDate: string;
  roomIds?: string;
  departmentIds?: string;
  participantIds?: string;
  conflictedUsers?: string;
  creatorId?: string;
  status?: string;
  search?: string;
  [key: string]: unknown;
}

export interface RoomQueryParams {
  search?: string;
}

class MeetingBookingsApiService {
  private static instance: MeetingBookingsApiService;

  private constructor() {}

  static getInstance(): MeetingBookingsApiService {
    if (!MeetingBookingsApiService.instance) {
      MeetingBookingsApiService.instance = new MeetingBookingsApiService();
    }
    return MeetingBookingsApiService.instance;
  }

  async getTimeline(params: TimelineQueryParams): Promise<BEBookingEvent[]> {
    return apiClient.get<BEBookingEvent[]>("/bookings/timeline", { params });
  }

  async getRooms(params?: RoomQueryParams): Promise<BERoom[]> {
    return apiClient.get<BERoom[]>("/rooms", { params });
  }
}

export default MeetingBookingsApiService.getInstance();
