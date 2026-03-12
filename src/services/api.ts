import { apiClient } from "@/lib/api-client";
import {
  Venue,
  Activity,
  SlotTemplate,
  DaySlotActivity,
  WeekDay,
  EventConfig,
  VenueDayActivity,
  VenueInfrastructure,
  VenueAudiovisual,
  Volunteer,
  VolunteerStatus,
  Team,
  TeamMember,
  TeamVenueSlot,
  TeamType,
} from "@/types/hacktown";

// Event Config Service
export const eventConfigService = {
  async getConfig(): Promise<EventConfig> {
    return apiClient.get<EventConfig>("/event-config");
  },

  async updateConfig(
    selectedDays: WeekDay[],
    startDate?: string,
    endDate?: string,
  ): Promise<EventConfig> {
    return apiClient.put<EventConfig>("/event-config", {
      selectedDays,
      startDate,
      endDate,
    });
  },
};

// Venues Service
export const venuesService = {
  async getAll(): Promise<Venue[]> {
    return apiClient.get<Venue[]>("/venues");
  },

  async getById(id: string): Promise<Venue> {
    return apiClient.get<Venue>(`/venues/${id}`);
  },

  async create(venue: Omit<Venue, "id">): Promise<Venue> {
    return apiClient.post<Venue>("/venues", venue);
  },

  async bulkUpsert(venues: Omit<Venue, "id">[]): Promise<Venue[]> {
    return apiClient.post<Venue[]>("/venues/bulk", venues);
  },

  async update(id: string, venue: Omit<Venue, "id">): Promise<Venue> {
    return apiClient.put<Venue>(`/venues/${id}`, venue);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/venues/${id}`);
  },

  async getNextCode(structureType: string): Promise<{ code: string }> {
    return apiClient.get<{ code: string }>(
      `/venues/next-code/${structureType || "none"}`,
    );
  },

  async importExcel(
    file: File,
  ): Promise<{ success: number; errors: string[] }> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/venues/import-excel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erro ao importar arquivo");
    }

    return response.json();
  },

  async applyDefaultSlots(
    venueId: string,
  ): Promise<{ message: string; slotsCreated: number }> {
    return apiClient.post<{ message: string; slotsCreated: number }>(
      `/venues/${venueId}/apply-default-slots`,
      {},
    );
  },
};

// Activities Service
export const activitiesService = {
  async getAll(): Promise<Activity[]> {
    return apiClient.get<Activity[]>("/activities");
  },

  async getById(id: string): Promise<Activity> {
    return apiClient.get<Activity>(`/activities/${id}`);
  },

  async create(activity: Omit<Activity, "id">): Promise<Activity> {
    return apiClient.post<Activity>("/activities", activity);
  },

  async bulkUpsert(activities: Omit<Activity, "id">[]): Promise<Activity[]> {
    return apiClient.post<Activity[]>("/activities/bulk", activities);
  },

  async update(id: string, activity: Omit<Activity, "id">): Promise<Activity> {
    return apiClient.put<Activity>(`/activities/${id}`, activity);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/activities/${id}`);
  },
};

// Slot Templates Service
export const slotTemplatesService = {
  async getAll(venueId?: string): Promise<SlotTemplate[]> {
    const query = venueId ? `?venueId=${venueId}` : "";
    return apiClient.get<SlotTemplate[]>(`/slot-templates${query}`);
  },

  async getById(id: string): Promise<SlotTemplate> {
    return apiClient.get<SlotTemplate>(`/slot-templates/${id}`);
  },

  async create(slotTemplate: Omit<SlotTemplate, "id">): Promise<SlotTemplate> {
    return apiClient.post<SlotTemplate>("/slot-templates", slotTemplate);
  },

  async bulkUpsert(
    slotTemplates: Omit<SlotTemplate, "id">[],
  ): Promise<SlotTemplate[]> {
    return apiClient.post<SlotTemplate[]>(
      "/slot-templates/bulk",
      slotTemplates,
    );
  },

  async update(
    id: string,
    slotTemplate: Omit<SlotTemplate, "id">,
  ): Promise<SlotTemplate> {
    return apiClient.put<SlotTemplate>(`/slot-templates/${id}`, slotTemplate);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/slot-templates/${id}`);
  },
};

// Day Slot Activities Service
export const daySlotActivitiesService = {
  async getAll(): Promise<DaySlotActivity[]> {
    return apiClient.get<DaySlotActivity[]>("/day-slot-activities");
  },

  async getBySlotAndDay(
    slotTemplateId: string,
    day: WeekDay,
  ): Promise<DaySlotActivity | null> {
    return apiClient.get<DaySlotActivity | null>(
      `/day-slot-activities/by-slot-day?slotTemplateId=${slotTemplateId}&day=${day}`,
    );
  },

  async getById(id: number): Promise<DaySlotActivity> {
    return apiClient.get<DaySlotActivity>(`/day-slot-activities/${id}`);
  },

  async create(data: {
    slotTemplateId: string;
    day: WeekDay;
    activityId: string;
  }): Promise<DaySlotActivity> {
    return apiClient.post<DaySlotActivity>("/day-slot-activities", data);
  },

  async bulkUpsert(
    daySlotActivities: Array<{
      slotTemplateId: string;
      day: WeekDay;
      activityId: string;
    }>,
  ): Promise<DaySlotActivity[]> {
    return apiClient.post<DaySlotActivity[]>(
      "/day-slot-activities/bulk",
      daySlotActivities,
    );
  },

  async update(
    id: number,
    data: { activityId: string },
  ): Promise<DaySlotActivity> {
    return apiClient.put<DaySlotActivity>(`/day-slot-activities/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/day-slot-activities/${id}`);
  },
};

// Venue Day Activities Service
export const venueDayActivitiesService = {
  async getAll(): Promise<VenueDayActivity[]> {
    return apiClient.get<VenueDayActivity[]>("/venue-day-activities");
  },

  async getByVenue(venueId: string): Promise<VenueDayActivity[]> {
    return apiClient.get<VenueDayActivity[]>(
      `/venue-day-activities/venue/${venueId}`,
    );
  },

  async updateByVenueAndDay(
    venueId: string,
    day: WeekDay,
    activityType: string,
  ): Promise<VenueDayActivity> {
    return apiClient.put<VenueDayActivity>(
      `/venue-day-activities/venue/${venueId}/day/${day}`,
      { activityType },
    );
  },
};

// Venue Infrastructure Service
export const venueInfrastructureService = {
  async getAll(): Promise<VenueInfrastructure[]> {
    return apiClient.get<VenueInfrastructure[]>("/venue-infrastructure");
  },

  async getByVenueId(venueId: string): Promise<VenueInfrastructure | null> {
    return apiClient.get<VenueInfrastructure | null>(
      `/venue-infrastructure/${venueId}`,
    );
  },

  async create(
    data: Omit<VenueInfrastructure, "id" | "venue">,
  ): Promise<VenueInfrastructure> {
    return apiClient.post<VenueInfrastructure>("/venue-infrastructure", data);
  },

  async update(
    venueId: string,
    data: Partial<Omit<VenueInfrastructure, "id" | "venueId" | "venue">>,
  ): Promise<VenueInfrastructure> {
    return apiClient.put<VenueInfrastructure>(
      `/venue-infrastructure/${venueId}`,
      data,
    );
  },

  async batchUpdate(
    updates: Array<{
      venueId: string;
      data: Partial<Omit<VenueInfrastructure, "id" | "venueId" | "venue">>;
    }>,
  ): Promise<VenueInfrastructure[]> {
    return apiClient.post<VenueInfrastructure[]>(
      "/venue-infrastructure/batch",
      { updates: updates.map((u) => ({ venueId: u.venueId, ...u.data })) },
    );
  },

  async delete(venueId: string): Promise<void> {
    return apiClient.delete<void>(`/venue-infrastructure/${venueId}`);
  },
};

// Venue Audiovisual Service
export const venueAudiovisualService = {
  async getAll(): Promise<VenueAudiovisual[]> {
    return apiClient.get<VenueAudiovisual[]>("/venue-audiovisual");
  },

  async getByVenueId(venueId: string): Promise<VenueAudiovisual | null> {
    return apiClient.get<VenueAudiovisual | null>(
      `/venue-audiovisual/${venueId}`,
    );
  },

  async create(
    data: Omit<VenueAudiovisual, "id" | "venue">,
  ): Promise<VenueAudiovisual> {
    return apiClient.post<VenueAudiovisual>("/venue-audiovisual", data);
  },

  async update(
    venueId: string,
    data: Partial<Omit<VenueAudiovisual, "id" | "venueId" | "venue">>,
  ): Promise<VenueAudiovisual> {
    return apiClient.put<VenueAudiovisual>(
      `/venue-audiovisual/${venueId}`,
      data,
    );
  },

  async batchUpdate(
    updates: Array<{
      venueId: string;
      data: Partial<Omit<VenueAudiovisual, "id" | "venueId" | "venue">>;
    }>,
  ): Promise<VenueAudiovisual[]> {
    return apiClient.post<VenueAudiovisual[]>("/venue-audiovisual/batch", {
      updates: updates.map((u) => ({ venueId: u.venueId, ...u.data })),
    });
  },

  async delete(venueId: string): Promise<void> {
    return apiClient.delete<void>(`/venue-audiovisual/${venueId}`);
  },
};

// Volunteers Service
export const volunteersService = {
  async getAll(status?: VolunteerStatus): Promise<Volunteer[]> {
    const query = status ? `?status=${status}` : "";
    return apiClient.get<Volunteer[]>(`/volunteers${query}`);
  },

  async getApproved(): Promise<Volunteer[]> {
    return apiClient.get<Volunteer[]>("/volunteers/approved");
  },

  async getById(id: string): Promise<Volunteer> {
    return apiClient.get<Volunteer>(`/volunteers/${id}`);
  },

  async create(
    data: Omit<Volunteer, "id" | "status" | "createdAt" | "updatedAt">,
  ): Promise<Volunteer> {
    return apiClient.post<Volunteer>("/volunteers", data);
  },

  async update(
    id: string,
    data: Partial<Omit<Volunteer, "id" | "createdAt" | "updatedAt">>,
  ): Promise<Volunteer> {
    return apiClient.put<Volunteer>(`/volunteers/${id}`, data);
  },

  async updateStatus(id: string, status: VolunteerStatus): Promise<Volunteer> {
    return apiClient.patch<Volunteer>(`/volunteers/${id}/status`, { status });
  },

  async cancel(id: string): Promise<Volunteer> {
    return apiClient.patch<Volunteer>(`/volunteers/${id}/cancel`, {});
  },

  async updateNotes(id: string, notes: string): Promise<Volunteer> {
    return apiClient.patch<Volunteer>(`/volunteers/${id}/notes`, { notes });
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/volunteers/${id}`);
  },
};

// Teams Service
export const teamsService = {
  async getAll(): Promise<Team[]> {
    return apiClient.get<Team[]>("/teams");
  },

  async getById(id: string): Promise<Team> {
    return apiClient.get<Team>(`/teams/${id}`);
  },

  async getUnassignedVolunteers(): Promise<Volunteer[]> {
    return apiClient.get<Volunteer[]>("/teams/unassigned-volunteers");
  },

  async create(data: { name: string; types: TeamType[] }): Promise<Team> {
    return apiClient.post<Team>("/teams", data);
  },

  async update(
    id: string,
    data: { name?: string; types?: TeamType[] },
  ): Promise<Team> {
    return apiClient.put<Team>(`/teams/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/teams/${id}`);
  },

  // Team Members
  async addMember(teamId: string, volunteerId: string): Promise<TeamMember> {
    return apiClient.post<TeamMember>(`/teams/${teamId}/members`, {
      volunteerId,
    });
  },

  async removeMember(teamId: string, volunteerId: string): Promise<void> {
    return apiClient.delete<void>(`/teams/${teamId}/members/${volunteerId}`);
  },

  async moveMember(
    volunteerId: string,
    fromTeamId: string,
    toTeamId: string,
    duplicate: boolean,
  ): Promise<{ added: TeamMember; removed: boolean }> {
    return apiClient.post<{ added: TeamMember; removed: boolean }>(
      "/teams/move-member",
      { volunteerId, fromTeamId, toTeamId, duplicate },
    );
  },

  async setLeader(teamId: string, volunteerId: string): Promise<TeamMember> {
    return apiClient.post<TeamMember>(
      `/teams/${teamId}/leader/${volunteerId}`,
      {},
    );
  },

  async removeLeader(teamId: string): Promise<void> {
    return apiClient.delete<void>(`/teams/${teamId}/leader`);
  },

  // Team Venue Slots
  async setVenueSlots(
    teamId: string,
    venueSlots: Array<{
      venueId: string;
      slotTemplateId?: string;
      isDefaultVenue?: boolean;
    }>,
  ): Promise<TeamVenueSlot[]> {
    return apiClient.post<TeamVenueSlot[]>(`/teams/${teamId}/venue-slots`, {
      venueSlots,
    });
  },

  async addVenueSlot(
    teamId: string,
    data: {
      venueId: string;
      slotTemplateId?: string;
      isDefaultVenue?: boolean;
    },
  ): Promise<TeamVenueSlot> {
    return apiClient.post<TeamVenueSlot>(`/teams/${teamId}/venue-slot`, data);
  },

  async removeVenueSlot(teamId: string, venueSlotId: string): Promise<void> {
    return apiClient.delete<void>(
      `/teams/${teamId}/venue-slots/${venueSlotId}`,
    );
  },
};
