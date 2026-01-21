import { useState, useMemo } from "react";
import { useHacktown } from "@/contexts/HacktownContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Clock, Users, TrendingUp } from "lucide-react";

// Converter hora string "HH:MM" para minutos desde meia-noite
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

// Converter minutos desde meia-noite para hora string "HH:MM"
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

export default function CapacityAnalysis() {
  const { venues, slotTemplates, selectedDays } = useHacktown();

  // Estado dos sliders (em minutos desde meia-noite)
  const [startTime, setStartTime] = useState(600); // 10:00
  const [endTime, setEndTime] = useState(1080); // 18:00

  // Range de horários possíveis (6:00 até 23:59)
  const MIN_TIME = 360; // 6:00
  const MAX_TIME = 1439; // 23:59

  // Calcular capacidade no período selecionado
  const capacityData = useMemo(() => {
    const startMinutes = startTime;
    const endMinutes = endTime;

    // Encontrar todos os slots que se sobrepõem com o período selecionado
    const overlappingSlots = slotTemplates.filter((slot) => {
      const slotStart = timeToMinutes(slot.startTime);
      const slotEnd = timeToMinutes(slot.endTime);

      // Verifica se há sobreposição COMPLETA (slot inteiro dentro do período)
      return slotStart >= startMinutes && slotEnd <= endMinutes;
    });

    // Agrupar slots por horário e calcular capacidade
    const capacityByTime: Record<string, number> = {};
    const venuesByTime: Record<string, Set<string>> = {};
    const slotsGrouped: Record<string, typeof slotTemplates> = {};

    overlappingSlots.forEach((slot) => {
      const venue = venues.find((v) => v.id === slot.venueId);
      if (!venue) return;

      const timeKey = `${slot.startTime}-${slot.endTime}`;

      if (!capacityByTime[timeKey]) {
        capacityByTime[timeKey] = 0;
        venuesByTime[timeKey] = new Set();
        slotsGrouped[timeKey] = [];
      }

      capacityByTime[timeKey] += venue.capacity;
      venuesByTime[timeKey].add(venue.id);
      slotsGrouped[timeKey].push(slot);
    });

    // Calcular estatísticas
    const timeSlots = Object.keys(capacityByTime).sort();
    const capacityValues = Object.values(capacityByTime);

    // Capacidade TOTAL do período = soma de TODOS os slots (conta o mesmo venue múltiplas vezes)
    const totalPeriodCapacity = overlappingSlots.reduce((sum, slot) => {
      const venue = venues.find((v) => v.id === slot.venueId);
      return sum + (venue?.capacity || 0);
    }, 0);

    const avgCapacity =
      timeSlots.length > 0
        ? Math.round(totalPeriodCapacity / timeSlots.length)
        : 0;
    const maxCapacity =
      capacityValues.length > 0 ? Math.max(...capacityValues) : 0;
    const minCapacity =
      capacityValues.length > 0 ? Math.min(...capacityValues) : 0;

    return {
      capacityByTime,
      venuesByTime,
      totalSlots: overlappingSlots.length,
      avgCapacity,
      maxCapacity,
      minCapacity,
      totalPeriodCapacity,
      timeSlots,
    };
  }, [startTime, endTime, slotTemplates, venues]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold gradient-text">
          Análise de Capacidade
        </h1>
        <p className="text-muted-foreground text-lg">
          Ajuste o período para ver a capacidade disponível em tempo real
        </p>
      </div>

      {/* Controles de Período */}
      <Card className="glass border-hacktown-cyan/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-5 w-5 text-hacktown-cyan" />
            Período de Análise
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Horário de Início */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">
                Horário de Início
              </label>
              <Badge className="bg-hacktown-cyan/20 text-hacktown-cyan border-hacktown-cyan/30 font-mono">
                {minutesToTime(startTime)}
              </Badge>
            </div>
            <Slider
              value={[startTime]}
              onValueChange={([value]) => {
                if (value < endTime - 30) {
                  // Mínimo 30min de diferença
                  setStartTime(value);
                }
              }}
              min={MIN_TIME}
              max={MAX_TIME}
              step={15}
              className="w-full"
            />
          </div>

          {/* Horário de Término */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">
                Horário de Término
              </label>
              <Badge className="bg-hacktown-pink/20 text-hacktown-pink border-hacktown-pink/30 font-mono">
                {minutesToTime(endTime)}
              </Badge>
            </div>
            <Slider
              value={[endTime]}
              onValueChange={([value]) => {
                if (value > startTime + 30) {
                  // Mínimo 30min de diferença
                  setEndTime(value);
                }
              }}
              min={MIN_TIME}
              max={MAX_TIME}
              step={15}
              className="w-full"
            />
          </div>

          {/* Duração */}
          <div className="pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Duração do Período
              </span>
              <span className="text-lg font-semibold text-hacktown-cyan">
                {Math.round((endTime - startTime) / 60)}h{" "}
                {(endTime - startTime) % 60}min
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="glass border-hacktown-purple/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-hacktown-purple/10 border border-hacktown-purple/20">
                <Users className="h-6 w-6 text-hacktown-purple" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Capacidade do Período
                </p>
                <p className="text-2xl font-bold text-hacktown-purple">
                  {capacityData.totalPeriodCapacity.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-hacktown-cyan/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-hacktown-cyan/10 border border-hacktown-cyan/20">
                <Users className="h-6 w-6 text-hacktown-cyan" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Capacidade Média/Slot
                </p>
                <p className="text-2xl font-bold text-hacktown-cyan">
                  {capacityData.avgCapacity.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Capacidade Máxima
                </p>
                <p className="text-2xl font-bold text-green-400">
                  {capacityData.maxCapacity.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-orange-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <BarChart3 className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Capacidade Mínima
                </p>
                <p className="text-2xl font-bold text-orange-400">
                  {capacityData.minCapacity.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-hacktown-pink/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-hacktown-pink/10 border border-hacktown-pink/20">
                <Clock className="h-6 w-6 text-hacktown-pink" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Slots no Período
                </p>
                <p className="text-2xl font-bold text-hacktown-pink">
                  {capacityData.totalSlots}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visualização por Horário (Equalizer) */}
      <Card className="glass border-hacktown-purple/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <BarChart3 className="h-5 w-5 text-hacktown-purple" />
            Capacidade por Horário
          </CardTitle>
        </CardHeader>
        <CardContent>
          {capacityData.timeSlots.length > 0 ? (
            <div className="space-y-4">
              {capacityData.timeSlots.map((timeKey) => {
                const capacity = capacityData.capacityByTime[timeKey];
                const percentage = (capacity / capacityData.maxCapacity) * 100;
                const venueCount = capacityData.venuesByTime[timeKey].size;

                return (
                  <div key={timeKey} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono text-hacktown-cyan">
                        {timeKey}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">
                          {venueCount} venue{venueCount !== 1 ? "s" : ""}
                        </span>
                        <span className="font-semibold text-foreground">
                          {capacity.toLocaleString("pt-BR")} pessoas
                        </span>
                      </div>
                    </div>
                    <div className="relative h-8 bg-muted/30 rounded-lg overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-hacktown-cyan to-hacktown-purple rounded-lg transition-all duration-500 flex items-center justify-end pr-3"
                        style={{ width: `${percentage}%` }}
                      >
                        {percentage > 20 && (
                          <span className="text-xs font-semibold text-white">
                            {Math.round(percentage)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                Nenhum slot encontrado no período selecionado
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Ajuste os horários ou verifique se há slots cadastrados
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedDays.length === 0 && (
        <Card className="glass border-amber-500/20 bg-amber-500/5">
          <CardContent className="py-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="font-semibold text-amber-400 mb-1">
                  Configure os dias do evento
                </p>
                <p className="text-sm text-muted-foreground">
                  Acesse a aba "Dias" para selecionar os dias do evento e
                  visualizar a análise de capacidade completa.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
