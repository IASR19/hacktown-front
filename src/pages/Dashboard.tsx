import { useState, useMemo, useEffect } from 'react';
import { useHacktown } from '@/contexts/HacktownContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Mic2, Users, Sparkles, Building2, Filter } from 'lucide-react';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { WEEKDAY_SHORT_LABELS, VENUE_STRUCTURE_LABELS, WeekDay, VenueStructureType } from '@/types/hacktown';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Feature flags
const SHOW_VENUE_PROGRAMMING = false; // Desabilitado até Atividades estar ativo

export default function Dashboard() {
  const { getVenuesWithSlots, venues, selectedDays, eventStartDate, eventEndDate, isLoading } = useHacktown();
  const venuesWithSlots = getVenuesWithSlots();

  // Filters
  const [filterDay, setFilterDay] = useState<string>('all');
  const [filterNucleo, setFilterNucleo] = useState<string>('all');
  const [filterStructure, setFilterStructure] = useState<string>('all');

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
      return daysWithDates.map(d => d.day);
    } catch {
      return selectedDays;
    }
  };

  // Auto-reload no primeiro acesso após login para carregar dados
  useEffect(() => {
    const firstAccess = localStorage.getItem('firstAccess');
    if (firstAccess === 'true') {
      localStorage.removeItem('firstAccess');
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
    
    venuesWithSlots.forEach(venue => {
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
      .filter(venue => {
        // Filter by nucleo
        if (filterNucleo !== 'all' && venue.nucleo !== filterNucleo) return false;
        // Filter by structure
        if (filterStructure !== 'all' && venue.structureType !== filterStructure) return false;
        return true;
      })
      .map(venue => ({
        ...venue,
        slots: venue.slots.filter(slot => {
          // Filter by day
          if (filterDay !== 'all' && slot.day !== filterDay) return false;
          return true;
        }),
      }));
  }, [venuesWithSlots, filterDay, filterNucleo, filterStructure]);

  const hasActiveFilters = filterDay !== 'all' || filterNucleo !== 'all' || filterStructure !== 'all';

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
        <p className="text-muted-foreground text-lg">Programação do HackTown por venue</p>
      </div>

      {/* Venues List */}
      {venues.length === 0 ? (
        <Card className="glass border-dashed border-2">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg">Nenhum venue cadastrado ainda</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Comece adicionando venues na aba Venues!</p>
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
                    setFilterDay('all');
                    setFilterNucleo('all');
                    setFilterStructure('all');
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

              <Select value={filterStructure} onValueChange={setFilterStructure}>
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

          {/* Charts Section (Filtered) */}
          <DashboardCharts venuesWithSlots={filteredVenuesWithSlots} />

          {/* Venues List (Filtered) - Feature flagged */}
          {SHOW_VENUE_PROGRAMMING && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold gradient-text">Programação por Venue</h2>
                {hasActiveFilters && (
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    {filteredVenuesWithSlots.length} venue(s)
                  </Badge>
                )}
              </div>
              {filteredVenuesWithSlots.filter(v => v.slots.length > 0 || !hasActiveFilters).map((venue, vIndex) => {
                const activitiesCount = venue.slots.filter(s => s.activity).length;
                
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
                            <CardTitle className="text-2xl font-bold">{venue.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{venue.location}</p>
                          </div>
                        </div>
                        
                        {/* Venue Stats */}
                        <div className="flex gap-3">
                          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-hacktown-cyan/10 border border-hacktown-cyan/20">
                            <Users className="h-4 w-4 text-hacktown-cyan" />
                            <span className="font-mono font-bold text-hacktown-cyan">{venue.capacity}</span>
                            <span className="text-xs text-muted-foreground">pessoas</span>
                          </div>
                          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-hacktown-pink/10 border border-hacktown-pink/20">
                            <Clock className="h-4 w-4 text-hacktown-pink" />
                            <span className="font-mono font-bold text-hacktown-pink">{venue.slots.length}</span>
                            <span className="text-xs text-muted-foreground">slots</span>
                          </div>
                          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-hacktown-purple/10 border border-hacktown-purple/20">
                            <Mic2 className="h-4 w-4 text-hacktown-purple" />
                            <span className="font-mono font-bold text-hacktown-purple">{activitiesCount}</span>
                            <span className="text-xs text-muted-foreground">atividades</span>
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
                            {hasActiveFilters ? 'Nenhum slot para este filtro' : 'Nenhum slot cadastrado'}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {hasActiveFilters ? 'Tente ajustar os filtros' : 'Adicione slots na aba Slots'}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {venue.slots.map((slot, sIndex) => (
                            <div 
                              key={`${slot.slotTemplateId}-${slot.day}`}
                              className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
                                slot.activity 
                                  ? 'bg-muted/30 border-border/50 hover:border-hacktown-pink/40' 
                                  : 'bg-hacktown-cyan/5 border-dashed border-hacktown-cyan/30'
                              }`}
                              style={{ animationDelay: `${sIndex * 50}ms` }}
                            >
                              <div className={`slot-badge text-center min-w-[80px] ${slot.activity ? 'text-hacktown-pink' : 'text-hacktown-cyan'}`}>
                                <div className="text-[9px] text-muted-foreground mb-1">
                                  {WEEKDAY_SHORT_LABELS[slot.day]}
                                </div>
                                <div className="font-semibold">{slot.startTime}</div>
                                <div className="text-[10px] text-muted-foreground my-0.5">até</div>
                                <div className="font-semibold">{slot.endTime}</div>
                              </div>
                              <div className="flex-1 min-w-0">
                                {slot.activity ? (
                                  <>
                                    <p className="font-semibold text-foreground truncate">
                                      {slot.activity.title}
                                    </p>
                                    <p className="text-sm text-hacktown-pink font-medium">{slot.activity.speaker}</p>
                                    {slot.activity.description && (
                                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{slot.activity.description}</p>
                                    )}
                                  </>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-hacktown-cyan animate-pulse" />
                                    <p className="text-sm text-muted-foreground">Slot disponível</p>
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
