import React, { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
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

  // Drag state
  const [draggedVolunteer, setDraggedVolunteer] = useState<Volunteer | null>(
    null,
  );
  const [dragSource, setDragSource] = useState<string | null>(null);

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
      const [teamsData, unassignedData] = await Promise.all([
        teamsService.getAll(),
        teamsService.getUnassignedVolunteers(),
      ]);
      setTeams(teamsData);
      setUnassignedVolunteers(unassignedData);
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
      return matchesSearch;
    });
  }, [volunteers, searchQuery]);

  // Filter teams by venue and type
  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
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
  }, [teams, filterVenue, filterTeamType]);

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
    } catch (error) {
      console.error("Erro ao mover membro:", error);
      toast.error("Erro ao mover membro");
    }

    setShowMoveModal(false);
    setMovingMember(null);
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

  // Get slots for a venue
  const getVenueSlots = (venueId: string) => {
    return slotTemplates.filter((s) => s.venueId === venueId);
  };

  // Toggle venue slot selection
  const toggleVenueSlot = (venueId: string, slotId: string) => {
    setSelectedVenueSlots((prev) => {
      const existing = prev.find((vs) => vs.venueId === venueId);
      if (existing) {
        const hasSlot = existing.slotTemplateIds.includes(slotId);
        if (hasSlot) {
          const newSlots = existing.slotTemplateIds.filter((s) => s !== slotId);
          if (newSlots.length === 0) {
            return prev.filter((vs) => vs.venueId !== venueId);
          }
          return prev.map((vs) =>
            vs.venueId === venueId ? { ...vs, slotTemplateIds: newSlots } : vs,
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
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome, email ou CPF..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Endereço</TableHead>
                      <TableHead>Data Nasc.</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Aprovar?</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVolunteers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Nenhum voluntário encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredVolunteers.map((volunteer) => (
                        <TableRow key={volunteer.id}>
                          <TableCell className="font-medium">
                            {volunteer.fullName}
                          </TableCell>
                          <TableCell>{volunteer.whatsapp}</TableCell>
                          <TableCell>{volunteer.email}</TableCell>
                          <TableCell>{volunteer.cpf}</TableCell>
                          <TableCell>{volunteer.city}</TableCell>
                          <TableCell>
                            {volunteer.street}, {volunteer.houseNumber}
                            {volunteer.complement &&
                              ` - ${volunteer.complement}`}
                            , {volunteer.neighborhood}
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
                                    : "secondary"
                              }
                            >
                              {VOLUNTEER_STATUS_LABELS[volunteer.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                                onClick={() =>
                                  handleApproval(volunteer.id, true)
                                }
                                disabled={volunteer.status === "approved"}
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
                                disabled={volunteer.status === "rejected"}
                              >
                                <X className="h-5 w-5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Gestão de Equipes */}
        <TabsContent value="teams" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
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

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Não Atribuídos */}
            <Card className="lg:col-span-1" onDragOver={handleDragOver}>
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

            {/* Equipes */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteTeam(team.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
                        team.members.map((member) => (
                          <div
                            key={member.id}
                            draggable
                            onDragStart={() =>
                              member.volunteer &&
                              handleDragStart(member.volunteer, team.id)
                            }
                            className="p-3 bg-muted rounded-lg cursor-move hover:bg-muted/80 transition-colors flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {member.volunteer?.fullName}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() =>
                                handleRemoveMember(team.id, member.volunteerId)
                              }
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
