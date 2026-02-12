import { useState, useMemo, useEffect } from "react";
import { useHacktown } from "@/contexts/HacktownContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Clock,
  Mic2,
  Users,
  Sparkles,
  Building2,
  Filter,
  Music,
  Presentation,
  PanelTop,
  Wrench,
} from "lucide-react";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import {
  WEEKDAY_SHORT_LABELS,
  VENUE_STRUCTURE_LABELS,
  WeekDay,
  VenueStructureType,
  ACTIVITY_TYPE_LABELS,
  ActivityType,
} from "@/types/hacktown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Feature flags
const SHOW_VENUE_PROGRAMMING = false; // Desabilitado até Atividades estar ativo

export default function Dashboard() {
  const {
    getVenuesWithSlots,
    venues,
    selectedDays,
    eventStartDate,
    eventEndDate,
    isLoading,
    venueDayActivities,
  } = useHacktown();
  const venuesWithSlots = getVenuesWithSlots();

  // Filters
  const [filterDay, setFilterDay] = useState<string>("all");
  const [filterNucleo, setFilterNucleo] = useState<string>("all");
  const [filterStructure, setFilterStructure] = useState<string>("all");

  // Modal for activity type details
  const [selectedActivityType, setSelectedActivityType] =
    useState<ActivityType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Expanded days per venue in modal
  const [expandedDays, setExpandedDays] = useState<
    Record<string, Set<WeekDay>>
  >({});

  const toggleDay = (venueId: string, day: WeekDay) => {
    setExpandedDays((prev) => {
      const newExpanded = { ...prev };
      if (!newExpanded[venueId]) {
        newExpanded[venueId] = new Set();
      }
      const venueExpanded = new Set(newExpanded[venueId]);
      if (venueExpanded.has(day)) {
        venueExpanded.delete(day);
      } else {
        venueExpanded.add(day);
      }
      newExpanded[venueId] = venueExpanded;
      return newExpanded;
    });
  };

  // Função para formatar dia com data
  const getDayWithDate = (day: WeekDay): string => {
    const dayLabel = WEEKDAY_SHORT_LABELS[day];

    if (!eventStartDate || !eventEndDate) {
      return dayLabel;
    }

    try {
      const startDate = new Date(eventStartDate + "T00:00:00");
      const endDate = new Date(eventEndDate + "T00:00:00");

      const weekDayMap: Record<WeekDay, number> = {
        domingo: 0,
        segunda: 1,
        terca: 2,
        quarta: 3,
        quinta: 4,
        sexta: 5,
        sabado: 6,
      };

      const targetDayNumber = weekDayMap[day];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        if (currentDate.getDay() === targetDayNumber) {
          const dateStr = currentDate.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          });
          return `${dayLabel} - ${dateStr}`;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return dayLabel;
    } catch {
      return dayLabel;
    }
  };

  // Função para ordenar dias por data do mês
  const getSortedDays = (): WeekDay[] => {
    if (!eventStartDate || !eventEndDate) {
      return selectedDays;
    }

    try {
      const startDate = new Date(eventStartDate + "T00:00:00");
      const endDate = new Date(eventEndDate + "T00:00:00");

      const weekDayMap: Record<WeekDay, number> = {
        domingo: 0,
        segunda: 1,
        terca: 2,
        quarta: 3,
        quinta: 4,
        sexta: 5,
        sabado: 6,
      };

      const daysWithDates = selectedDays.map((day) => {
        const targetDayNumber = weekDayMap[day];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
          if (currentDate.getDay() === targetDayNumber) {
            return { day, date: new Date(currentDate) };
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }

        return { day, date: new Date("9999-12-31") };
      });

      daysWithDates.sort((a, b) => a.date.getTime() - b.date.getTime());
      return daysWithDates.map((d) => d.day);
    } catch {
      return selectedDays;
    }
  };

  // Auto-reload no primeiro acesso após login para carregar dados
  useEffect(() => {
    const firstAccess = localStorage.getItem("firstAccess");
    if (firstAccess === "true") {
      localStorage.removeItem("firstAccess");
      // Pequeno delay para garantir que a página carregou
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  }, []);

  // Get unique nucleos and structures for filter options
  const filterOptions = useMemo(() => {
    const nucleos = new Set<string>();
    const structures = new Set<string>();

    venuesWithSlots.forEach((venue) => {
      if (venue.nucleo) nucleos.add(venue.nucleo);
      if (venue.structureType) structures.add(venue.structureType);
    });

    return {
      nucleos: Array.from(nucleos).sort(),
      structures: Array.from(structures).sort(),
    };
  }, [venuesWithSlots]);

  // Apply filters
  const filteredVenuesWithSlots = useMemo(() => {
    return venuesWithSlots
      .filter((venue) => {
        // Filter by nucleo
        if (filterNucleo !== "all" && venue.nucleo !== filterNucleo)
          return false;
        // Filter by structure
        if (
          filterStructure !== "all" &&
          venue.structureType !== filterStructure
        )
          return false;
        return true;
      })
      .map((venue) => ({
        ...venue,
        slots: venue.slots.filter((slot) => {
          // Filter by day
          if (filterDay !== "all" && slot.day !== filterDay) return false;
          return true;
        }),
      }));
  }, [venuesWithSlots, filterDay, filterNucleo, filterStructure]);

  const hasActiveFilters =
    filterDay !== "all" || filterNucleo !== "all" || filterStructure !== "all";

  // Group venues by activity type with day information (with filters applied)
  const venuesByActivityType = useMemo(() => {
    const groupedByType: Record<
      ActivityType,
      Array<(typeof venues)[number] & { days: WeekDay[] }>
    > = {
      musica: [],
      palestra: [],
      painel: [],
      workshop: [],
    };

    venues.forEach((venue) => {
      // Apply nucleo and structure filters
      if (filterNucleo !== "all" && venue.nucleo !== filterNucleo) return;
      if (filterStructure !== "all" && venue.structureType !== filterStructure)
        return;

      const venueWithDays = { ...venue, days: [] as WeekDay[] };

      selectedDays.forEach((day) => {
        // Apply day filter
        if (filterDay !== "all" && day !== filterDay) return;

        const vda = venueDayActivities.find(
          (v) => v.venueId === venue.id && v.day === day,
        );
        const activityType = vda?.activityType || "palestra";

        // Add day to venue
        const existingVenue = groupedByType[activityType].find(
          (v) => v.id === venue.id,
        );
        if (existingVenue) {
          existingVenue.days.push(day);
        } else {
          venueWithDays.days.push(day);
          groupedByType[activityType].push({ ...venueWithDays, days: [day] });
        }
      });
    });

    // Remove venues with no days (after filtering)
    Object.keys(groupedByType).forEach((key) => {
      const activityType = key as ActivityType;
      groupedByType[activityType] = groupedByType[activityType].filter(
        (v) => v.days.length > 0,
      );
    });

    return groupedByType;
  }, [
    venues,
    selectedDays,
    venueDayActivities,
    filterDay,
    filterNucleo,
    filterStructure,
  ]);

  // Get icon for activity type
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "musica":
        return Music;
      case "palestra":
        return Presentation;
      case "painel":
        return PanelTop;
      case "workshop":
        return Wrench;
      default:
        return Mic2;
    }
  };

  // Get color for activity type
  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case "musica":
        return "text-purple-400";
      case "palestra":
        return "text-hacktown-cyan";
      case "painel":
        return "text-hacktown-pink";
      case "workshop":
        return "text-orange-400";
      default:
        return "text-hacktown-purple";
    }
  };

  // Get bg color for activity type
  const getActivityBgColor = (type: ActivityType) => {
    switch (type) {
      case "musica":
        return "bg-purple-400/10";
      case "palestra":
        return "bg-hacktown-cyan/10";
      case "painel":
        return "bg-hacktown-pink/10";
      case "workshop":
        return "bg-orange-400/10";
      default:
        return "bg-hacktown-purple/10";
    }
  };

  // Get border color for activity type
  const getActivityBorderColor = (type: ActivityType) => {
    switch (type) {
      case "musica":
        return "border-purple-400/20";
      case "palestra":
        return "border-hacktown-cyan/20";
      case "painel":
        return "border-hacktown-pink/20";
      case "workshop":
        return "border-orange-400/20";
      default:
        return "border-hacktown-purple/20";
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hacktown-cyan mx-auto"></div>
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-hacktown-pink animate-glow-pulse" />
          <h1 className="text-4xl font-bold gradient-text">Dashboard</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Programação do HackTown por venue
        </p>
      </div>

      {/* Venues List */}
      {venues.length === 0 ? (
        <Card className="glass border-dashed border-2">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg">
              Nenhum venue cadastrado ainda
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Comece adicionando venues na aba Venues!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Overview Section (Fixed - always shows full data) */}
          <DashboardOverview venuesWithSlots={venuesWithSlots} />

          {/* Filters Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-hacktown-pink" />
              <h2 className="text-xl font-bold gradient-text">Filtros</h2>
              {hasActiveFilters && (
                <Badge
                  variant="outline"
                  className="border-hacktown-pink/30 text-hacktown-pink cursor-pointer hover:bg-hacktown-pink/10"
                  onClick={() => {
                    setFilterDay("all");
                    setFilterNucleo("all");
                    setFilterStructure("all");
                  }}
                >
                  Limpar filtros
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={filterDay} onValueChange={setFilterDay}>
                <SelectTrigger className="w-[180px] bg-muted/50 border-border">
                  <SelectValue placeholder="Dia" />
                </SelectTrigger>
                <SelectContent className="glass-strong border-border">
                  <SelectItem value="all">Todos os dias</SelectItem>
                  {getSortedDays().map((day) => (
                    <SelectItem key={day} value={day}>
                      {getDayWithDate(day)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterNucleo} onValueChange={setFilterNucleo}>
                <SelectTrigger className="w-[180px] bg-muted/50 border-border">
                  <SelectValue placeholder="Núcleo" />
                </SelectTrigger>
                <SelectContent className="glass-strong border-border">
                  <SelectItem value="all">Todos os núcleos</SelectItem>
                  {filterOptions.nucleos.map((nucleo) => (
                    <SelectItem key={nucleo} value={nucleo}>
                      {nucleo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filterStructure}
                onValueChange={setFilterStructure}
              >
                <SelectTrigger className="w-[200px] bg-muted/50 border-border">
                  <SelectValue placeholder="Tipo de estrutura" />
                </SelectTrigger>
                <SelectContent className="glass-strong border-border">
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {filterOptions.structures.map((structure) => (
                    <SelectItem key={structure} value={structure}>
                      {VENUE_STRUCTURE_LABELS[structure as VenueStructureType]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Venues by Activity Type Section - Compact with Modal */}
          {selectedDays.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mic2 className="h-4 w-4 text-hacktown-purple" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Venues por Tipo de Atividade
                </h3>
              </div>

              {/* Compact Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[]).map(
                  (activityType) => {
                    const venuesForType = venuesByActivityType[activityType];
                    const Icon = getActivityIcon(activityType);
                    const color = getActivityColor(activityType);
                    const bgColor = getActivityBgColor(activityType);
                    const borderColor = getActivityBorderColor(activityType);

                    return (
                      <Card
                        key={activityType}
                        className={`glass hover:neon-glow transition-all duration-300 border ${borderColor} cursor-pointer group`}
                        onClick={() => {
                          setSelectedActivityType(activityType);
                          setIsModalOpen(true);
                        }}
                      >
                        <CardContent className="p-3 flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${bgColor} group-hover:scale-110 transition-transform`}
                          >
                            <Icon className={`h-4 w-4 ${color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground truncate">
                              {ACTIVITY_TYPE_LABELS[activityType]}
                            </p>
                            <p
                              className={`text-lg font-bold font-mono ${color}`}
                            >
                              {venuesForType.length}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  },
                )}
              </div>

              {/* Modal with Venue Details */}
              <Dialog
                open={isModalOpen}
                onOpenChange={(open) => {
                  setIsModalOpen(open);
                  if (!open) {
                    setExpandedDays({});
                  }
                }}
              >
                <DialogContent className="glass-strong border-hacktown-cyan/20 max-w-4xl max-h-[80vh] overflow-y-auto">
                  {selectedActivityType && (
                    <>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-2xl gradient-text">
                          {(() => {
                            const Icon = getActivityIcon(selectedActivityType);
                            const color =
                              getActivityColor(selectedActivityType);
                            return <Icon className={`h-6 w-6 ${color}`} />;
                          })()}
                          {ACTIVITY_TYPE_LABELS[selectedActivityType]}
                          <Badge variant="outline" className="ml-2">
                            {venuesByActivityType[selectedActivityType].length}{" "}
                            venue(s)
                          </Badge>
                        </DialogTitle>
                      </DialogHeader>

                      <div className="space-y-4 mt-4">
                        {venuesByActivityType[selectedActivityType].map(
                          (venue) => {
                            const venueWithSlots = venuesWithSlots.find(
                              (v) => v.id === venue.id,
                            );
                            const sortedDays = [...venue.days].sort(
                              (a, b) =>
                                selectedDays.indexOf(a) -
                                selectedDays.indexOf(b),
                            );

                            return (
                              <div
                                key={venue.id}
                                className="p-4 rounded-xl border border-border/50 bg-muted/20"
                              >
                                {/* Venue Header */}
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-hacktown-cyan/20">
                                      <MapPin className="h-5 w-5 text-hacktown-cyan" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-lg">
                                        {venue.name}
                                      </h4>
                                      <p className="text-sm text-muted-foreground">
                                        {venue.location}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Badge
                                      variant="outline"
                                      className="border-hacktown-cyan/30"
                                    >
                                      <Users className="h-3 w-3 mr-1" />
                                      {venue.capacity}
                                    </Badge>
                                    {venue.nucleo && (
                                      <Badge
                                        variant="outline"
                                        className="border-hacktown-pink/30"
                                      >
                                        {venue.nucleo}
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                {/* Days - Clickable */}
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    Dias e Horários
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {sortedDays.map((day) => {
                                      const daySlots =
                                        venueWithSlots?.slots.filter(
                                          (s) => s.day === day,
                                        ) || [];
                                      const dayWithDate = getDayWithDate(day);
                                      const isExpanded =
                                        expandedDays[venue.id]?.has(day);

                                      return (
                                        <div
                                          key={day}
                                          className="flex-1 min-w-[200px]"
                                        >
                                          <Badge
                                            className={`w-full justify-between cursor-pointer transition-all ${
                                              isExpanded
                                                ? "bg-hacktown-purple text-white border-hacktown-purple"
                                                : "bg-hacktown-purple/20 text-hacktown-purple border-hacktown-purple/30 hover:bg-hacktown-purple/30"
                                            }`}
                                            onClick={() =>
                                              toggleDay(venue.id, day)
                                            }
                                          >
                                            <span>{dayWithDate}</span>
                                            <span className="text-xs ml-2">
                                              {daySlots.length} slot(s)
                                            </span>
                                          </Badge>

                                          {/* Expanded Slots */}
                                          {isExpanded &&
                                            daySlots.length > 0 && (
                                              <div className="mt-2 space-y-1.5 pl-2">
                                                {daySlots.map((slot, idx) => (
                                                  <div
                                                    key={idx}
                                                    className="flex items-center gap-2 text-sm p-2 rounded bg-background/50 border border-border/30"
                                                  >
                                                    <Clock className="h-3 w-3 text-hacktown-cyan" />
                                                    <span className="font-mono font-semibold">
                                                      {slot.startTime} -{" "}
                                                      {slot.endTime}
                                                    </span>
                                                    {slot.activity && (
                                                      <span className="text-muted-foreground ml-2">
                                                        • {slot.activity.title}
                                                      </span>
                                                    )}
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Charts Section (Filtered) */}
          <DashboardCharts venuesWithSlots={filteredVenuesWithSlots} />

          {/* Venues List (Filtered) - Feature flagged */}
          {SHOW_VENUE_PROGRAMMING && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold gradient-text">
                  Programação por Venue
                </h2>
                {hasActiveFilters && (
                  <Badge
                    variant="outline"
                    className="border-border text-muted-foreground"
                  >
                    {filteredVenuesWithSlots.length} venue(s)
                  </Badge>
                )}
              </div>
              {filteredVenuesWithSlots
                .filter((v) => v.slots.length > 0 || !hasActiveFilters)
                .map((venue, vIndex) => {
                  const activitiesCount = venue.slots.filter(
                    (s) => s.activity,
                  ).length;

                  return (
                    <Card
                      key={venue.id}
                      className="glass overflow-hidden hover:neon-glow transition-all duration-500"
                      style={{ animationDelay: `${vIndex * 100}ms` }}
                    >
                      {/* Venue Header */}
                      <CardHeader className="border-b border-border/50 bg-gradient-to-r from-hacktown-cyan/10 via-hacktown-pink/5 to-transparent">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="p-3 rounded-xl bg-hacktown-cyan/20">
                              <MapPin className="h-6 w-6 text-hacktown-cyan" />
                            </div>
                            <div>
                              <CardTitle className="text-2xl font-bold">
                                {venue.name}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {venue.location}
                              </p>
                            </div>
                          </div>

                          {/* Venue Stats */}
                          <div className="flex gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-hacktown-cyan/10 border border-hacktown-cyan/20">
                              <Users className="h-4 w-4 text-hacktown-cyan" />
                              <span className="font-mono font-bold text-hacktown-cyan">
                                {venue.capacity}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                pessoas
                              </span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-hacktown-pink/10 border border-hacktown-pink/20">
                              <Clock className="h-4 w-4 text-hacktown-pink" />
                              <span className="font-mono font-bold text-hacktown-pink">
                                {venue.slots.length}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                slots
                              </span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-hacktown-purple/10 border border-hacktown-purple/20">
                              <Mic2 className="h-4 w-4 text-hacktown-purple" />
                              <span className="font-mono font-bold text-hacktown-purple">
                                {activitiesCount}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                atividades
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      {/* Venue Slots */}
                      <CardContent className="p-5">
                        {venue.slots.length === 0 ? (
                          <div className="text-center py-8 border border-dashed border-border rounded-xl">
                            <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                            <p className="text-muted-foreground">
                              {hasActiveFilters
                                ? "Nenhum slot para este filtro"
                                : "Nenhum slot cadastrado"}
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                              {hasActiveFilters
                                ? "Tente ajustar os filtros"
                                : "Adicione slots na aba Slots"}
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {venue.slots.map((slot, sIndex) => (
                              <div
                                key={`${slot.slotTemplateId}-${slot.day}`}
                                className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
                                  slot.activity
                                    ? "bg-muted/30 border-border/50 hover:border-hacktown-pink/40"
                                    : "bg-hacktown-cyan/5 border-dashed border-hacktown-cyan/30"
                                }`}
                                style={{ animationDelay: `${sIndex * 50}ms` }}
                              >
                                <div
                                  className={`slot-badge text-center min-w-[80px] ${slot.activity ? "text-hacktown-pink" : "text-hacktown-cyan"}`}
                                >
                                  <div className="text-[9px] text-muted-foreground mb-1">
                                    {WEEKDAY_SHORT_LABELS[slot.day]}
                                  </div>
                                  <div className="font-semibold">
                                    {slot.startTime}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground my-0.5">
                                    até
                                  </div>
                                  <div className="font-semibold">
                                    {slot.endTime}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  {slot.activity ? (
                                    <>
                                      <p className="font-semibold text-foreground truncate">
                                        {slot.activity.title}
                                      </p>
                                      <p className="text-sm text-hacktown-pink font-medium">
                                        {slot.activity.speaker}
                                      </p>
                                      {slot.activity.description && (
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                          {slot.activity.description}
                                        </p>
                                      )}
                                    </>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-hacktown-cyan animate-pulse" />
                                      <p className="text-sm text-muted-foreground">
                                        Slot disponível
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
