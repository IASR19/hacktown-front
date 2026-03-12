import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Search,
  Check,
  X,
  Users,
  UserPlus,
  Plus,
  Trash2,
  GripVertical,
  Building2,
  Clock,
  Pencil,
  Crown,
  ArrowRightLeft,
  Copy,
  Ban,
  RotateCcw,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Volunteer,
  Team,
  TeamType,
  TEAM_TYPE_LABELS,
  VOLUNTEER_STATUS_LABELS,
  parseTeamTypes,
  Venue,
  SlotTemplate,
} from "@/types/hacktown";
import {
  volunteersService,
  teamsService,
  venuesService,
  slotTemplatesService,
} from "@/services/api";

// Inline editable notes cell
function NotesCell({
  value,
  onSave,
}: {
  value: string;
  onSave: (notes: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  const cancelEdit = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="space-y-1">
        <Textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              cancelEdit();
            }
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              commit();
            }
          }}
          className="min-h-[60px] text-xs"
          placeholder="Adicionar observação..."
        />
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={cancelEdit}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="text-xs font-medium text-hacktown-cyan hover:text-hacktown-cyan/80"
            onClick={commit}
          >
            Salvar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className="cursor-pointer text-xs text-muted-foreground hover:text-foreground min-h-[32px] rounded px-1 py-1 hover:bg-muted/50 transition-colors whitespace-normal"
    >
      {value || (
        <span className="italic opacity-50">Clique para adicionar...</span>
      )}
    </div>
  );
}

export default function TeamsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialTab =
    location.pathname === "/volunteers" ? "volunteers" : "teams";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);

  // Volunteers state
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Teams state
  const [teams, setTeams] = useState<Team[]>([]);
  const [unassignedVolunteers, setUnassignedVolunteers] = useState<Volunteer[]>(
    [],
  );
  const [venues, setVenues] = useState<Venue[]>([]);
  const [slotTemplates, setSlotTemplates] = useState<SlotTemplate[]>([]);

  // Team creation modal
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamTypes, setNewTeamTypes] = useState<TeamType[]>([]);
  const [venueMode, setVenueMode] = useState<"default" | "by-slot">("default");
  const [selectedDefaultVenue, setSelectedDefaultVenue] = useState<string>("");
  const [selectedVenueSlots, setSelectedVenueSlots] = useState<
    { venueId: string; slotTemplateIds: string[] }[]
  >([]);

  // Move member modal
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [movingMember, setMovingMember] = useState<{
    volunteerId: string;
    volunteerName: string;
    fromTeamId: string;
    toTeamId: string;
  } | null>(null);

  // Assign volunteer modal (click to assign)
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedVolunteerToAssign, setSelectedVolunteerToAssign] =
    useState<Volunteer | null>(null);
  const [selectedTeamToAssign, setSelectedTeamToAssign] = useState<string>("");

  // Filters for teams
  const [filterVenue, setFilterVenue] = useState<string>("all");
  const [filterTeamType, setFilterTeamType] = useState<string>("all");
  const [teamsSearchQuery, setTeamsSearchQuery] = useState<string>("");

  // Edit team modal
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamTypes, setEditTeamTypes] = useState<TeamType[]>([]);
  const [editVenueMode, setEditVenueMode] = useState<"default" | "by-slot">(
    "default",
  );
  const [editSelectedDefaultVenue, setEditSelectedDefaultVenue] =
    useState<string>("");
  const [editSelectedVenueSlots, setEditSelectedVenueSlots] = useState<
    { venueId: string; slotTemplateIds: string[] }[]
  >([]);

  // Drag state
  const [draggedVolunteer, setDraggedVolunteer] = useState<Volunteer | null>(
    null,
  );
  const [dragSource, setDragSource] = useState<string | null>(null);

  // Move/Copy member modal
  const [showMemberActionModal, setShowMemberActionModal] = useState(false);
  const [memberActionType, setMemberActionType] = useState<
    "transfer" | "duplicate"
  >("transfer");
  const [selectedMemberForAction, setSelectedMemberForAction] = useState<{
    teamId: string;
    volunteerId: string;
    volunteerName: string;
  } | null>(null);
  const [targetTeamId, setTargetTeamId] = useState<string>("");

  // Partial availability state
  const [showPartialAvailabilityModal, setShowPartialAvailabilityModal] =
    useState(false);
  const [selectedPartialVolunteer, setSelectedPartialVolunteer] =
    useState<Volunteer | null>(null);

  // Sync activeTab with URL on browser navigation (back/forward)
  useEffect(() => {
    const newTab = location.pathname === "/volunteers" ? "volunteers" : "teams";
    setActiveTab(newTab);
  }, [location.pathname]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [volunteersData, teamsData, unassignedData, venuesData, slotsData] =
        await Promise.all([
          volunteersService.getAll(),
          teamsService.getAll(),
          teamsService.getUnassignedVolunteers(),
          venuesService.getAll(),
          slotTemplatesService.getAll(),
        ]);

      setVolunteers(volunteersData);
      setTeams(teamsData);
      setUnassignedVolunteers(unassignedData);
      setVenues(venuesData);
      setSlotTemplates(slotsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const refreshTeamsData = async () => {
    try {
      const [teamsData, unassignedData, volunteersData] = await Promise.all([
        teamsService.getAll(),
        teamsService.getUnassignedVolunteers(),
        volunteersService.getAll(),
      ]);
      setTeams(teamsData);
      setUnassignedVolunteers(unassignedData);
      setVolunteers(volunteersData);
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
    }
  };

  // Filter volunteers for table
  const filteredVolunteers = useMemo(() => {
    return volunteers.filter((v) => {
      const matchesSearch =
        v.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.cpf.includes(searchQuery);
      const matchesStatus = statusFilter === "all" || v.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [volunteers, searchQuery, statusFilter]);

  // Dual scrollbar sync
  const tableScrollRef = React.useRef<HTMLDivElement>(null);
  const topScrollRef = React.useRef<HTMLDivElement>(null);
  const tableContentRef = React.useRef<HTMLDivElement>(null);
  const [tableScrollWidth, setTableScrollWidth] = React.useState(0);
  const syncingRef = React.useRef(false);

  React.useEffect(() => {
    const updateWidths = () => {
      if (tableContentRef.current) {
        setTableScrollWidth(tableContentRef.current.scrollWidth);
      }
      if (tableScrollRef.current && topScrollRef.current) {
        topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
      }
    };

    updateWidths();

    const observer = new ResizeObserver(updateWidths);
    if (tableContentRef.current) observer.observe(tableContentRef.current);
    if (tableScrollRef.current) observer.observe(tableScrollRef.current);

    window.addEventListener("resize", updateWidths);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateWidths);
    };
  }, [filteredVolunteers.length, activeTab]);

  const handleTopScroll = () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    if (tableScrollRef.current && topScrollRef.current)
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    syncingRef.current = false;
  };
  const handleBottomScroll = () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    if (tableScrollRef.current && topScrollRef.current)
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    syncingRef.current = false;
  };

  // Helper: Check if two time ranges conflict (memoized to avoid recreating on every render)
  const timesConflict = useCallback(
    (start1: string, end1: string, start2: string, end2: string): boolean => {
      const toMinutes = (time: string) => {
        const [h, m] = time.split(":").map(Number);
        return h * 60 + m;
      };
      const s1 = toMinutes(start1);
      const e1 = toMinutes(end1);
      const s2 = toMinutes(start2);
      const e2 = toMinutes(end2);
      return !(e1 <= s2 || e2 <= s1);
    },
    [],
  );

  // Helper: Resolve effective slot times from a TeamVenueSlot
  // If isDefaultVenue=true, returns ALL slots of that venue; otherwise the specific slot.
  const resolveSlotTimes = useCallback(
    (venueSlot: {
      venueId: string;
      slotTemplateId?: string;
      isDefaultVenue: boolean;
    }) =>
      venueSlot.isDefaultVenue
        ? slotTemplates
            .filter((s) => s.venueId === venueSlot.venueId)
            .map((s) => ({ startTime: s.startTime, endTime: s.endTime }))
        : venueSlot.slotTemplateId
          ? slotTemplates
              .filter((s) => s.id === venueSlot.slotTemplateId)
              .map((s) => ({ startTime: s.startTime, endTime: s.endTime }))
          : [],
    [slotTemplates],
  );

  // Helper: Get occupied slot times for a volunteer, optionally excluding a team
  const getOccupiedTimes = useCallback(
    (
      volunteerId: string,
      excludeTeamId?: string,
    ): Array<{ startTime: string; endTime: string }> => {
      const volunteer = volunteers.find((v) => v.id === volunteerId);
      if (!volunteer) return [];
      const occupied: Array<{ startTime: string; endTime: string }> = [];
      volunteer.teamMembers?.forEach((member) => {
        if (excludeTeamId && member.teamId === excludeTeamId) return;
        const team = teams.find((t) => t.id === member.teamId);
        team?.venueSlots?.forEach((slot) => {
          resolveSlotTimes(slot).forEach((t) => occupied.push(t));
        });
      });
      return occupied;
    },
    [volunteers, teams, resolveSlotTimes],
  );

  // Helper: Check if a volunteer's occupied times conflict with a target team's slots
  const hasConflictWithTeam = useCallback(
    (
      occupiedTimes: Array<{ startTime: string; endTime: string }>,
      targetTeamId: string,
    ): boolean => {
      const targetTeam = teams.find((t) => t.id === targetTeamId);
      const targetSlots = (targetTeam?.venueSlots ?? []).flatMap((vs) =>
        resolveSlotTimes(vs),
      );

      if (targetSlots.length === 0) return false;

      return targetSlots.some((targetSlot) =>
        occupiedTimes.some((occupied) =>
          timesConflict(
            occupied.startTime,
            occupied.endTime,
            targetSlot.startTime,
            targetSlot.endTime,
          ),
        ),
      );
    },
    [teams, resolveSlotTimes, timesConflict],
  );

  // Calculate volunteers with partial availability (assigned but with available non-conflicting slots)
  const partiallyAssignedVolunteers = useMemo(() => {
    return volunteers.filter((volunteer) => {
      // Must have at least one team assignment
      if (!volunteer.teamMembers || volunteer.teamMembers.length === 0) {
        return false;
      }

      const occupiedTimes = getOccupiedTimes(volunteer.id);

      // Check if there's any slot without time conflict
      return slotTemplates.some((slot) => {
        return !occupiedTimes.some((occupied) =>
          timesConflict(
            occupied.startTime,
            occupied.endTime,
            slot.startTime,
            slot.endTime,
          ),
        );
      });
    });
  }, [volunteers, slotTemplates, timesConflict, getOccupiedTimes]);

  // Get occupied slots for a volunteer (for display in modal)
  const getVolunteerOccupiedSlots = (volunteer: Volunteer) => {
    const occupied: Array<{
      teamName: string;
      venueName: string;
      slotTime?: string;
    }> = [];

    volunteer.teamMembers?.forEach((member) => {
      const team = teams.find((t) => t.id === member.teamId);
      if (team?.venueSlots) {
        team.venueSlots.forEach((slot) => {
          const venue = venues.find((v) => v.id === slot.venueId);
          if (slot.isDefaultVenue) {
            occupied.push({
              teamName: team.name,
              venueName: venue?.name || "Venue desconhecido",
              slotTime: "Todos os horários (venue padrão)",
            });
          } else {
            const slotTemplate = slot.slotTemplateId
              ? slotTemplates.find((s) => s.id === slot.slotTemplateId)
              : null;
            const slotTime = slotTemplate
              ? `${slotTemplate.startTime.substring(0, 5)} - ${slotTemplate.endTime.substring(0, 5)}`
              : undefined;
            occupied.push({
              teamName: team.name,
              venueName: venue?.name || "Venue desconhecido",
              slotTime,
            });
          }
        });
      }
    });

    return occupied;
  };

  // Filter teams by venue and type
  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      // Filter by search query (team name or member name)
      if (teamsSearchQuery.trim()) {
        const query = teamsSearchQuery.toLowerCase();
        const matchesTeamName = team.name.toLowerCase().includes(query);
        const matchesMemberName = team.members?.some((m) =>
          m.volunteer?.fullName?.toLowerCase().includes(query),
        );
        if (!matchesTeamName && !matchesMemberName) {
          return false;
        }
      }

      // Filter by team type
      if (filterTeamType !== "all") {
        const teamTypes = team.types ? team.types.split(",") : [];
        if (!teamTypes.includes(filterTeamType)) {
          return false;
        }
      }

      // Filter by venue
      if (filterVenue !== "all") {
        const hasVenue = team.venueSlots?.some(
          (vs) => vs.venue?.id === filterVenue,
        );
        if (!hasVenue) {
          return false;
        }
      }

      return true;
    });
  }, [teams, filterVenue, filterTeamType, teamsSearchQuery]);

  // Handle volunteer approval
  const handleApproval = async (volunteerId: string, approved: boolean) => {
    try {
      await volunteersService.updateStatus(
        volunteerId,
        approved ? "approved" : "rejected",
      );
      setVolunteers((prev) =>
        prev.map((v) =>
          v.id === volunteerId
            ? { ...v, status: approved ? "approved" : "rejected" }
            : v,
        ),
      );
      toast.success(approved ? "Voluntário aprovado!" : "Voluntário rejeitado");
      await refreshTeamsData();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const handleCancel = async (
    volunteerId: string,
    volunteerName: string,
    isCancelled: boolean,
  ) => {
    if (isCancelled) {
      if (
        !confirm(
          `Reativar ${volunteerName}? O status voltará para Pendente e ele não será adicionado de volta às equipes automaticamente.`,
        )
      )
        return;
      try {
        await volunteersService.reactivate(volunteerId);
        setVolunteers((prev) =>
          prev.map((v) =>
            v.id === volunteerId ? { ...v, status: "pending" } : v,
          ),
        );
        toast.success(`${volunteerName} reativado — status: Pendente`);
        await refreshTeamsData();
      } catch (error) {
        console.error("Erro ao reativar voluntário:", error);
        toast.error("Erro ao reativar voluntário");
      }
    } else {
      if (
        !confirm(
          `Cancelar ${volunteerName}? Ele será removido de todas as equipes imediatamente.`,
        )
      )
        return;
      try {
        await volunteersService.cancel(volunteerId);
        setVolunteers((prev) =>
          prev.map((v) =>
            v.id === volunteerId
              ? { ...v, status: "cancelled", teamMembers: [] }
              : v,
          ),
        );
        toast.success(`${volunteerName} cancelado e removido das equipes`);
        await refreshTeamsData();
      } catch (error) {
        console.error("Erro ao cancelar voluntário:", error);
        toast.error("Erro ao cancelar voluntário");
      }
    }
  };

  const handleSaveNotes = async (volunteerId: string, notes: string) => {
    try {
      await volunteersService.updateNotes(volunteerId, notes);
      setVolunteers((prev) =>
        prev.map((v) => (v.id === volunteerId ? { ...v, notes } : v)),
      );
    } catch (error) {
      console.error("Erro ao salvar observação:", error);
      toast.error("Erro ao salvar observação");
    }
  };

  // Create team
  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast.error("Nome da equipe é obrigatório");
      return;
    }
    if (newTeamTypes.length === 0) {
      toast.error("Selecione pelo menos um tipo de equipe");
      return;
    }

    try {
      const team = await teamsService.create({
        name: newTeamName,
        types: newTeamTypes,
      });

      // Set venue slots based on mode
      if (venueMode === "default" && selectedDefaultVenue) {
        await teamsService.setVenueSlots(team.id, [
          { venueId: selectedDefaultVenue, isDefaultVenue: true },
        ]);
      } else if (venueMode === "by-slot" && selectedVenueSlots.length > 0) {
        const venueSlots = selectedVenueSlots.flatMap((vs) =>
          vs.slotTemplateIds.map((slotId) => ({
            venueId: vs.venueId,
            slotTemplateId: slotId,
            isDefaultVenue: false,
          })),
        );
        await teamsService.setVenueSlots(team.id, venueSlots);
      }

      toast.success("Equipe criada com sucesso!");
      setShowCreateTeamModal(false);
      resetTeamForm();
      await refreshTeamsData();
    } catch (error: unknown) {
      console.error("Erro ao criar equipe:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao criar equipe";
      toast.error(errorMessage);
    }
  };

  const resetTeamForm = () => {
    setNewTeamName("");
    setNewTeamTypes([]);
    setVenueMode("default");
    setSelectedDefaultVenue("");
    setSelectedVenueSlots([]);
  };

  // Edit team
  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setEditTeamName(team.name);
    setEditTeamTypes(parseTeamTypes(team.types));

    // Determine venue mode and populate data
    if (team.venueSlots && team.venueSlots.length > 0) {
      const hasDefaultVenue = team.venueSlots.some((vs) => vs.isDefaultVenue);
      if (hasDefaultVenue) {
        setEditVenueMode("default");
        const defaultVenueSlot = team.venueSlots.find(
          (vs) => vs.isDefaultVenue,
        );
        setEditSelectedDefaultVenue(defaultVenueSlot?.venue?.id || "");
        setEditSelectedVenueSlots([]);
      } else {
        setEditVenueMode("by-slot");
        setEditSelectedDefaultVenue("");
        // Group by venue
        const groupedSlots: { [venueId: string]: string[] } = {};
        team.venueSlots.forEach((vs) => {
          if (vs.venue?.id && vs.slotTemplate?.id) {
            if (!groupedSlots[vs.venue.id]) {
              groupedSlots[vs.venue.id] = [];
            }
            groupedSlots[vs.venue.id].push(vs.slotTemplate.id);
          }
        });
        setEditSelectedVenueSlots(
          Object.entries(groupedSlots).map(([venueId, slotTemplateIds]) => ({
            venueId,
            slotTemplateIds,
          })),
        );
      }
    } else {
      setEditVenueMode("default");
      setEditSelectedDefaultVenue("");
      setEditSelectedVenueSlots([]);
    }

    setShowEditTeamModal(true);
  };

  const handleSaveEditTeam = async () => {
    if (!editingTeam || !editTeamName.trim() || editTeamTypes.length === 0) {
      toast.error("Preencha o nome e selecione pelo menos um tipo");
      return;
    }

    try {
      // Update team name and types
      await teamsService.update(editingTeam.id, {
        name: editTeamName,
        types: editTeamTypes,
      });

      // Update venue slots
      if (editVenueMode === "default" && editSelectedDefaultVenue) {
        await teamsService.setVenueSlots(editingTeam.id, [
          { venueId: editSelectedDefaultVenue, isDefaultVenue: true },
        ]);
      } else if (
        editVenueMode === "by-slot" &&
        editSelectedVenueSlots.length > 0
      ) {
        const venueSlots = editSelectedVenueSlots.flatMap((vs) =>
          vs.slotTemplateIds.map((slotId) => ({
            venueId: vs.venueId,
            slotTemplateId: slotId,
            isDefaultVenue: false,
          })),
        );
        await teamsService.setVenueSlots(editingTeam.id, venueSlots);
      } else {
        // Clear venue slots if none selected
        await teamsService.setVenueSlots(editingTeam.id, []);
      }

      toast.success("Equipe atualizada com sucesso!");
      setShowEditTeamModal(false);
      setEditingTeam(null);
      await refreshTeamsData();
    } catch (error: unknown) {
      console.error("Erro ao atualizar equipe:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao atualizar equipe";
      toast.error(errorMessage);
    }
  };

  // Delete team
  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta equipe?")) return;

    try {
      await teamsService.delete(teamId);
      toast.success("Equipe excluída!");
      await refreshTeamsData();
    } catch (error) {
      console.error("Erro ao excluir equipe:", error);
      toast.error("Erro ao excluir equipe");
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (volunteer: Volunteer, source: string) => {
    setDraggedVolunteer(volunteer);
    setDragSource(source);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnTeam = async (teamId: string) => {
    if (!draggedVolunteer) return;

    try {
      if (dragSource === "unassigned") {
        // Add to team from unassigned
        await teamsService.addMember(teamId, draggedVolunteer.id);
        toast.success(`${draggedVolunteer.fullName} adicionado à equipe`);
      } else if (dragSource === "partial") {
        // Check for time conflicts before adding from partial availability
        const occupiedTimes = getOccupiedTimes(draggedVolunteer.id);
        if (hasConflictWithTeam(occupiedTimes, teamId)) {
          toast.error(
            `${draggedVolunteer.fullName} já possui compromissos em horários conflitantes com esta equipe`,
          );
          setDraggedVolunteer(null);
          setDragSource(null);
          return;
        }

        // Add to team if no conflict
        await teamsService.addMember(teamId, draggedVolunteer.id);
        toast.success(`${draggedVolunteer.fullName} adicionado à equipe`);
      } else if (dragSource && dragSource !== teamId) {
        // Moving from another team - show modal
        setMovingMember({
          volunteerId: draggedVolunteer.id,
          volunteerName: draggedVolunteer.fullName,
          fromTeamId: dragSource,
          toTeamId: teamId,
        });
        setShowMoveModal(true);
        setDraggedVolunteer(null);
        setDragSource(null);
        return;
      }

      await refreshTeamsData();
    } catch (error) {
      console.error("Erro ao adicionar membro:", error);
      toast.error("Erro ao adicionar membro à equipe");
    }

    setDraggedVolunteer(null);
    setDragSource(null);
  };

  // Handle click to assign volunteer
  const handleVolunteerClick = (volunteer: Volunteer) => {
    if (teams.length === 0) {
      toast.error("Crie uma equipe primeiro");
      return;
    }
    setSelectedVolunteerToAssign(volunteer);
    setSelectedTeamToAssign("");
    setShowAssignModal(true);
  };

  const handleAssignConfirm = async () => {
    if (!selectedVolunteerToAssign || !selectedTeamToAssign) return;

    // Check for time conflicts if the volunteer already has team assignments
    if (selectedVolunteerToAssign.teamMembers?.length) {
      const occupiedTimes = getOccupiedTimes(selectedVolunteerToAssign.id);
      if (hasConflictWithTeam(occupiedTimes, selectedTeamToAssign)) {
        toast.error(
          `${selectedVolunteerToAssign.fullName} já possui compromissos em horários conflitantes com a equipe selecionada`,
        );
        return;
      }
    }

    try {
      await teamsService.addMember(
        selectedTeamToAssign,
        selectedVolunteerToAssign.id,
      );
      toast.success(
        `${selectedVolunteerToAssign.fullName} adicionado à equipe`,
      );
      await refreshTeamsData();
      setShowAssignModal(false);
      setSelectedVolunteerToAssign(null);
      setSelectedTeamToAssign("");
    } catch (error) {
      console.error("Erro ao adicionar membro:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro ao adicionar membro à equipe";
      toast.error(errorMessage);
    }
  };

  const handleMoveConfirm = async (duplicate: boolean) => {
    if (!movingMember) return;

    // For duplicate: check all occupied times. For transfer: exclude fromTeam (they'll leave it)
    const occupiedTimes = getOccupiedTimes(
      movingMember.volunteerId,
      duplicate ? undefined : movingMember.fromTeamId,
    );

    if (hasConflictWithTeam(occupiedTimes, movingMember.toTeamId)) {
      toast.error(
        `${movingMember.volunteerName} já possui compromissos em horários conflitantes com a equipe de destino`,
      );
      return;
    }

    try {
      await teamsService.moveMember(
        movingMember.volunteerId,
        movingMember.fromTeamId,
        movingMember.toTeamId,
        duplicate,
      );
      toast.success(
        duplicate
          ? `${movingMember.volunteerName} duplicado para a equipe`
          : `${movingMember.volunteerName} movido para a equipe`,
      );
      await refreshTeamsData();
      setShowMoveModal(false);
      setMovingMember(null);
    } catch (error) {
      console.error("Erro ao mover membro:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao mover membro";
      toast.error(errorMessage);
    }
  };

  // Remove member from team
  const handleRemoveMember = async (teamId: string, volunteerId: string) => {
    try {
      await teamsService.removeMember(teamId, volunteerId);
      toast.success("Membro removido da equipe");
      await refreshTeamsData();
    } catch (error) {
      console.error("Erro ao remover membro:", error);
      toast.error("Erro ao remover membro");
    }
  };

  // Set member as leader
  const handleSetLeader = async (
    teamId: string,
    volunteerId: string,
    volunteerName: string,
  ) => {
    try {
      await teamsService.setLeader(teamId, volunteerId);
      toast.success(`${volunteerName} definido como líder da equipe`);
      await refreshTeamsData();
    } catch (error) {
      console.error("Erro ao definir líder:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao definir líder";
      toast.error(errorMessage);
    }
  };

  // Open modal for transfer/duplicate member
  const openMemberActionModal = (
    actionType: "transfer" | "duplicate",
    teamId: string,
    volunteerId: string,
    volunteerName: string,
  ) => {
    setMemberActionType(actionType);
    setSelectedMemberForAction({ teamId, volunteerId, volunteerName });
    setTargetTeamId("");
    setShowMemberActionModal(true);
  };

  // Handle transfer/duplicate member
  const handleMemberAction = async () => {
    if (!selectedMemberForAction || !targetTeamId) return;

    const isDuplicate = memberActionType === "duplicate";

    // For duplicate: check all occupied times. For transfer: exclude fromTeam (they'll leave it)
    const occupiedTimes = getOccupiedTimes(
      selectedMemberForAction.volunteerId,
      isDuplicate ? undefined : selectedMemberForAction.teamId,
    );

    if (hasConflictWithTeam(occupiedTimes, targetTeamId)) {
      toast.error(
        `${selectedMemberForAction.volunteerName} já possui compromissos em horários conflitantes com a equipe selecionada`,
      );
      return;
    }

    try {
      // Use atomic moveMember operation with duplicate flag
      await teamsService.moveMember(
        selectedMemberForAction.volunteerId,
        selectedMemberForAction.teamId,
        targetTeamId,
        isDuplicate,
      );
      toast.success(
        isDuplicate
          ? `${selectedMemberForAction.volunteerName} duplicado para outra equipe`
          : `${selectedMemberForAction.volunteerName} transferido com sucesso`,
      );
      await refreshTeamsData();
      setShowMemberActionModal(false);
      setSelectedMemberForAction(null);
      setTargetTeamId("");
    } catch (error) {
      console.error("Erro na ação:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao processar ação";
      toast.error(errorMessage);
    }
  };

  // Get slots for a venue
  const getVenueSlots = (venueId: string) => {
    return slotTemplates.filter((s) => s.venueId === venueId);
  };

  // Generic toggle venue slot function
  const createToggleVenueSlot =
    (
      setter: React.Dispatch<
        React.SetStateAction<{ venueId: string; slotTemplateIds: string[] }[]>
      >,
    ) =>
    (venueId: string, slotId: string) => {
      setter((prev) => {
        const existing = prev.find((vs) => vs.venueId === venueId);
        if (existing) {
          const hasSlot = existing.slotTemplateIds.includes(slotId);
          if (hasSlot) {
            const newSlots = existing.slotTemplateIds.filter(
              (s) => s !== slotId,
            );
            if (newSlots.length === 0) {
              return prev.filter((vs) => vs.venueId !== venueId);
            }
            return prev.map((vs) =>
              vs.venueId === venueId
                ? { ...vs, slotTemplateIds: newSlots }
                : vs,
            );
          } else {
            return prev.map((vs) =>
              vs.venueId === venueId
                ? { ...vs, slotTemplateIds: [...vs.slotTemplateIds, slotId] }
                : vs,
            );
          }
        } else {
          return [...prev, { venueId, slotTemplateIds: [slotId] }];
        }
      });
    };

  // Toggle venue slot selection
  const toggleVenueSlot = createToggleVenueSlot(setSelectedVenueSlots);

  // Toggle venue slot selection for editing
  const toggleEditVenueSlot = createToggleVenueSlot(setEditSelectedVenueSlots);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(value === "volunteers" ? "/volunteers" : "/teams");
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold gradient-text">
          {activeTab === "volunteers" ? "Voluntários" : "Equipes"}
        </h1>
        <p className="text-muted-foreground text-lg">
          {activeTab === "volunteers"
            ? "Gerencie os voluntários do evento"
            : "Gerencie as equipes e alocação de voluntários"}
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="volunteers">Voluntários</TabsTrigger>
          <TabsTrigger value="teams">Equipes</TabsTrigger>
        </TabsList>

        {/* Tab: Voluntários */}
        <TabsContent value="volunteers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Lista de Voluntários</span>
                <div className="flex items-center gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="approved">Aprovado</SelectItem>
                      <SelectItem value="rejected">Rejeitado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar por nome, email ou CPF..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Scrollbar superior sincronizada */}
              <div
                ref={topScrollRef}
                onScroll={handleTopScroll}
                className="overflow-x-scroll mb-1"
                style={{ height: 14 }}
              >
                <div style={{ width: Math.max(tableScrollWidth, 1), height: 1 }} />
              </div>
              <div
                ref={tableScrollRef}
                onScroll={handleBottomScroll}
                className="rounded-md border overflow-x-auto"
              >
                <div ref={tableContentRef} className="min-w-max">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Nome</TableHead>
                      <TableHead className="min-w-[110px]">WhatsApp</TableHead>
                      <TableHead className="min-w-[150px]">E-mail</TableHead>
                      <TableHead className="min-w-[90px]">Cidade</TableHead>
                      <TableHead className="min-w-[90px]">Data Nasc.</TableHead>
                      <TableHead className="min-w-[90px]">Status</TableHead>
                      <TableHead className="min-w-[90px] text-center">
                        Ações
                      </TableHead>
                      <TableHead className="min-w-[220px]">Obs</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVolunteers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Nenhum voluntário encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredVolunteers.map((volunteer) => (
                        <TableRow key={volunteer.id}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {volunteer.fullName}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {volunteer.whatsapp}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {volunteer.email}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {volunteer.city}
                          </TableCell>
                          <TableCell>
                            {new Date(volunteer.birthDate).toLocaleDateString(
                              "pt-BR",
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                volunteer.status === "approved"
                                  ? "default"
                                  : volunteer.status === "rejected"
                                    ? "destructive"
                                    : volunteer.status === "cancelled"
                                      ? "secondary"
                                      : "secondary"
                              }
                              className={
                                volunteer.status === "cancelled"
                                  ? "bg-orange-500 text-white hover:bg-orange-600"
                                  : undefined
                              }
                            >
                              {VOLUNTEER_STATUS_LABELS[volunteer.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                                onClick={() =>
                                  handleApproval(volunteer.id, true)
                                }
                                disabled={
                                  volunteer.status === "approved" ||
                                  volunteer.status === "cancelled"
                                }
                                title="Aprovar"
                              >
                                <Check className="h-5 w-5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                                onClick={() =>
                                  handleApproval(volunteer.id, false)
                                }
                                disabled={
                                  volunteer.status === "rejected" ||
                                  volunteer.status === "cancelled"
                                }
                                title="Rejeitar"
                              >
                                <X className="h-5 w-5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={
                                  volunteer.status === "cancelled"
                                    ? "h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                                    : "h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-100"
                                }
                                onClick={() =>
                                  handleCancel(
                                    volunteer.id,
                                    volunteer.fullName,
                                    volunteer.status === "cancelled",
                                  )
                                }
                                title={
                                  volunteer.status === "cancelled"
                                    ? "Reativar (volta para Pendente)"
                                    : "Cancelar (remove das equipes)"
                                }
                              >
                                {volunteer.status === "cancelled" ? (
                                  <RotateCcw className="h-5 w-5" />
                                ) : (
                                  <Ban className="h-5 w-5" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[220px]">
                            <NotesCell
                              value={volunteer.notes ?? ""}
                              onSave={(notes) =>
                                handleSaveNotes(volunteer.id, notes)
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Gestão de Equipes */}
        <TabsContent value="teams" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar equipe ou voluntário..."
                  value={teamsSearchQuery}
                  onChange={(e) => setTeamsSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterVenue} onValueChange={setFilterVenue}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por venue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os venues</SelectItem>
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.code} - {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterTeamType} onValueChange={setFilterTeamType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="credenciamento">Credenciamento</SelectItem>
                  <SelectItem value="posso_ajudar">Posso Ajudar?</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => setShowCreateTeamModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Equipe
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            {/* Faixa superior: Não Atribuídos + Disponibilidade Parcial */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Não Atribuídos */}
              <Card className="" onDragOver={handleDragOver}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Não Atribuídos
                    <Badge variant="secondary" className="ml-auto">
                      {unassignedVolunteers.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                  {unassignedVolunteers.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      Todos os voluntários aprovados estão em equipes
                    </p>
                  ) : (
                    unassignedVolunteers.map((volunteer) => (
                      <div
                        key={volunteer.id}
                        draggable
                        onDragStart={() =>
                          handleDragStart(volunteer, "unassigned")
                        }
                        onClick={() => handleVolunteerClick(volunteer)}
                        className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors flex items-center gap-2"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {volunteer.fullName}
                        </span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Disponibilidade Parcial */}
              <Card className="lg:col-span-1" onDragOver={handleDragOver}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Disponibilidade Parcial
                    <Badge variant="secondary" className="ml-auto">
                      {partiallyAssignedVolunteers.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                  {partiallyAssignedVolunteers.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      Nenhum voluntário com disponibilidade parcial
                    </p>
                  ) : (
                    partiallyAssignedVolunteers.map((volunteer) => (
                      <div
                        key={volunteer.id}
                        draggable
                        onDragStart={() =>
                          handleDragStart(volunteer, "partial")
                        }
                        onClick={() => {
                          setSelectedPartialVolunteer(volunteer);
                          setShowPartialAvailabilityModal(true);
                        }}
                        className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg cursor-pointer hover:bg-amber-500/20 transition-colors flex items-center gap-2"
                      >
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium">
                          {volunteer.fullName}
                        </span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
            {/* fim grid faixa superior */}

            {/* Equipes — quebra linha automaticamente, sem scroll horizontal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTeams.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>
                      {teams.length === 0
                        ? "Nenhuma equipe criada ainda"
                        : "Nenhuma equipe encontrada com os filtros selecionados"}
                    </p>
                    <p className="text-sm">
                      {teams.length === 0
                        ? 'Clique em "Nova Equipe" para começar'
                        : "Tente alterar os filtros"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredTeams.map((team) => (
                  <Card
                    key={team.id}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDropOnTeam(team.id)}
                    className="border-2 border-dashed border-transparent hover:border-primary/50 transition-colors"
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{team.name}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => handleEditTeam(team)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteTeam(team.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardTitle>
                      <div className="flex flex-wrap gap-1">
                        {parseTeamTypes(team.types).map((type) => (
                          <Badge
                            key={type}
                            variant="outline"
                            className="text-xs"
                          >
                            {TEAM_TYPE_LABELS[type]}
                          </Badge>
                        ))}
                      </div>
                      {team.venueSlots && team.venueSlots.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {team.venueSlots.map((vs) => (
                            <Badge
                              key={vs.id}
                              variant="secondary"
                              className="text-xs flex items-center gap-1"
                            >
                              <Building2 className="h-3 w-3" />
                              {vs.venue?.name}
                              {vs.slotTemplate && (
                                <>
                                  <Clock className="h-3 w-3 ml-1" />
                                  {vs.slotTemplate.startTime}
                                </>
                              )}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
                      {!team.members || team.members.length === 0 ? (
                        <p className="text-muted-foreground text-sm text-center py-4">
                          Arraste voluntários para cá
                        </p>
                      ) : (
                        [...team.members]
                          .sort(
                            (a, b) =>
                              (b.isLeader ? 1 : 0) - (a.isLeader ? 1 : 0),
                          )
                          .map((member) => (
                            <div
                              key={member.id}
                              draggable
                              onDragStart={() =>
                                member.volunteer &&
                                handleDragStart(member.volunteer, team.id)
                              }
                              className={`p-3 rounded-lg hover:bg-muted/80 transition-colors flex items-center justify-between gap-2 ${
                                member.isLeader
                                  ? "bg-yellow-500/20 border border-yellow-500/50"
                                  : "bg-muted"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {member.isLeader ? (
                                  <Crown className="h-4 w-4 text-yellow-500" />
                                ) : (
                                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <span
                                      className={`text-sm font-medium cursor-pointer hover:underline ${member.isLeader ? "text-yellow-500" : ""}`}
                                    >
                                      {member.volunteer?.fullName}
                                      {member.isLeader && (
                                        <span className="ml-2 text-xs">
                                          (Líder)
                                        </span>
                                      )}
                                    </span>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start">
                                    {!member.isLeader && (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          member.volunteer &&
                                          handleSetLeader(
                                            team.id,
                                            member.volunteerId,
                                            member.volunteer.fullName,
                                          )
                                        }
                                      >
                                        <Crown className="h-4 w-4 mr-2 text-yellow-500" />
                                        Nomear como líder
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onClick={() =>
                                        member.volunteer &&
                                        openMemberActionModal(
                                          "transfer",
                                          team.id,
                                          member.volunteerId,
                                          member.volunteer.fullName,
                                        )
                                      }
                                    >
                                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                                      Transferir para outra equipe
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        member.volunteer &&
                                        openMemberActionModal(
                                          "duplicate",
                                          team.id,
                                          member.volunteerId,
                                          member.volunteer.fullName,
                                        )
                                      }
                                    >
                                      <Copy className="h-4 w-4 mr-2" />
                                      Duplicar para outra equipe
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveMember(
                                    team.id,
                                    member.volunteerId,
                                  );
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal: Criar Equipe */}
      <Dialog open={showCreateTeamModal} onOpenChange={setShowCreateTeamModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Equipe</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="teamName">Nome da Equipe</Label>
              <Input
                id="teamName"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Digite o nome da equipe"
              />
            </div>

            <div>
              <Label>Tipo(s) de Equipe</Label>
              <div className="flex gap-4 mt-2">
                {(
                  ["staff", "credenciamento", "posso_ajudar"] as TeamType[]
                ).map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={newTeamTypes.includes(type)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNewTeamTypes([...newTeamTypes, type]);
                        } else {
                          setNewTeamTypes(
                            newTeamTypes.filter((t) => t !== type),
                          );
                        }
                      }}
                    />
                    <span>{TEAM_TYPE_LABELS[type]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label>Venues</Label>
              <Select
                value={venueMode}
                onValueChange={(v) => setVenueMode(v as "default" | "by-slot")}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">
                    Preencher com venue padrão
                  </SelectItem>
                  <SelectItem value="by-slot">
                    Adotar venues por slot
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {venueMode === "default" && (
              <div>
                <Label>Venue Padrão</Label>
                <Select
                  value={selectedDefaultVenue}
                  onValueChange={setSelectedDefaultVenue}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Selecione um venue" />
                  </SelectTrigger>
                  <SelectContent>
                    {venues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.code} - {venue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Todos os slots deste venue serão atribuídos a esta equipe
                </p>
              </div>
            )}

            {venueMode === "by-slot" && (
              <div className="space-y-4">
                <Label>Selecione venues e slots</Label>
                <div className="max-h-64 overflow-y-auto space-y-4 border rounded-lg p-4">
                  {venues.map((venue) => {
                    const venueSlots = getVenueSlots(venue.id);
                    if (venueSlots.length === 0) return null;

                    return (
                      <div key={venue.id} className="space-y-2">
                        <div className="font-medium flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {venue.code} - {venue.name}
                        </div>
                        <div className="pl-6 space-y-1">
                          {venueSlots.map((slot) => {
                            const isSelected = selectedVenueSlots.some(
                              (vs) =>
                                vs.venueId === venue.id &&
                                vs.slotTemplateIds.includes(slot.id),
                            );
                            return (
                              <label
                                key={slot.id}
                                className="flex items-center gap-2 cursor-pointer text-sm"
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() =>
                                    toggleVenueSlot(venue.id, slot.id)
                                  }
                                />
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                {slot.startTime} - {slot.endTime}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateTeamModal(false);
                resetTeamForm();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateTeam}>Criar Equipe</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Transferir/Duplicar Membro */}
      <Dialog
        open={showMemberActionModal}
        onOpenChange={setShowMemberActionModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {memberActionType === "transfer" ? "Transferir" : "Duplicar"}{" "}
              Membro
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {memberActionType === "transfer"
                ? `Transferir ${selectedMemberForAction?.volunteerName} para outra equipe. O membro será removido da equipe atual.`
                : `Duplicar ${selectedMemberForAction?.volunteerName} para outra equipe. O membro continuará na equipe atual.`}
            </p>

            <div className="space-y-2">
              <Label>Equipe de destino</Label>
              <Select value={targetTeamId} onValueChange={setTargetTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a equipe..." />
                </SelectTrigger>
                <SelectContent>
                  {teams
                    .filter((t) => t.id !== selectedMemberForAction?.teamId)
                    .map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowMemberActionModal(false);
                setSelectedMemberForAction(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleMemberAction} disabled={!targetTeamId}>
              {memberActionType === "transfer" ? "Transferir" : "Duplicar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Disponibilidade Parcial */}
      <Dialog
        open={showPartialAvailabilityModal}
        onOpenChange={setShowPartialAvailabilityModal}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Disponibilidade Parcial: {selectedPartialVolunteer?.fullName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <p className="text-sm text-amber-900">
                Este voluntário está alocado em algumas equipes/slots e pode ser
                adicionado em outras.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Slots já Ocupados:</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {selectedPartialVolunteer &&
                getVolunteerOccupiedSlots(selectedPartialVolunteer).length >
                  0 ? (
                  getVolunteerOccupiedSlots(selectedPartialVolunteer).map(
                    (slot, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2 bg-muted rounded"
                      >
                        <div className="flex-1 text-sm">
                          <p className="font-medium">{slot.teamName}</p>
                          <p className="text-muted-foreground text-xs">
                            {slot.venueName}
                            {slot.slotTime && ` • ${slot.slotTime}`}
                          </p>
                        </div>
                      </div>
                    ),
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum slot encontrado
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPartialAvailabilityModal(false)}
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                setShowPartialAvailabilityModal(false);
                if (selectedPartialVolunteer) {
                  setSelectedVolunteerToAssign(selectedPartialVolunteer);
                  setSelectedTeamToAssign("");
                  setShowAssignModal(true);
                }
              }}
            >
              Associar com equipe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Equipe */}
      <Dialog open={showEditTeamModal} onOpenChange={setShowEditTeamModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Equipe</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="editTeamName">Nome da Equipe</Label>
              <Input
                id="editTeamName"
                value={editTeamName}
                onChange={(e) => setEditTeamName(e.target.value)}
                placeholder="Digite o nome da equipe"
              />
            </div>

            <div>
              <Label>Tipo(s) de Equipe</Label>
              <div className="flex gap-4 mt-2">
                {(
                  ["staff", "credenciamento", "posso_ajudar"] as TeamType[]
                ).map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={editTeamTypes.includes(type)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setEditTeamTypes([...editTeamTypes, type]);
                        } else {
                          setEditTeamTypes(
                            editTeamTypes.filter((t) => t !== type),
                          );
                        }
                      }}
                    />
                    <span>{TEAM_TYPE_LABELS[type]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label>Venues</Label>
              <Select
                value={editVenueMode}
                onValueChange={(v) =>
                  setEditVenueMode(v as "default" | "by-slot")
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">
                    Preencher com venue padrão
                  </SelectItem>
                  <SelectItem value="by-slot">
                    Adotar venues por slot
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editVenueMode === "default" && (
              <div>
                <Label>Venue Padrão</Label>
                <Select
                  value={editSelectedDefaultVenue}
                  onValueChange={setEditSelectedDefaultVenue}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Selecione um venue" />
                  </SelectTrigger>
                  <SelectContent>
                    {venues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.code} - {venue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Todos os slots deste venue serão atribuídos a esta equipe
                </p>
              </div>
            )}

            {editVenueMode === "by-slot" && (
              <div className="space-y-4">
                <Label>Selecione venues e slots</Label>
                <div className="max-h-64 overflow-y-auto space-y-4 border rounded-lg p-4">
                  {venues.map((venue) => {
                    const venueSlots = getVenueSlots(venue.id);
                    if (venueSlots.length === 0) return null;

                    return (
                      <div key={venue.id} className="space-y-2">
                        <div className="font-medium flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {venue.code} - {venue.name}
                        </div>
                        <div className="pl-6 space-y-1">
                          {venueSlots.map((slot) => {
                            const isSelected = editSelectedVenueSlots.some(
                              (vs) =>
                                vs.venueId === venue.id &&
                                vs.slotTemplateIds.includes(slot.id),
                            );
                            return (
                              <label
                                key={slot.id}
                                className="flex items-center gap-2 cursor-pointer text-sm"
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() =>
                                    toggleEditVenueSlot(venue.id, slot.id)
                                  }
                                />
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                {slot.startTime} - {slot.endTime}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditTeamModal(false);
                setEditingTeam(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveEditTeam}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Mover Membro */}
      <Dialog open={showMoveModal} onOpenChange={setShowMoveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover Voluntário</DialogTitle>
          </DialogHeader>

          <p className="text-muted-foreground">
            O voluntário <strong>{movingMember?.volunteerName}</strong> já está
            em outra equipe. O que deseja fazer?
          </p>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowMoveModal(false)}>
              Cancelar
            </Button>
            <Button variant="secondary" onClick={() => handleMoveConfirm(true)}>
              Duplicar
            </Button>
            <Button onClick={() => handleMoveConfirm(false)}>
              Substituir Equipe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Atribuir Voluntário à Equipe */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir à Equipe</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-muted-foreground">
              Selecione a equipe para{" "}
              <strong>{selectedVolunteerToAssign?.fullName}</strong>:
            </p>

            <Select
              value={selectedTeamToAssign}
              onValueChange={setSelectedTeamToAssign}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma equipe" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAssignConfirm}
              disabled={!selectedTeamToAssign}
            >
              Atribuir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
