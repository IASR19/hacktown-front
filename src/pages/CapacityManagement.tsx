import { useState, useMemo, useCallback } from "react";
import { useHacktown } from "@/contexts/HacktownContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Layers,
  CheckSquare,
} from "lucide-react";
import {
  WeekDay,
  WEEKDAY_LABELS,
  WEEKDAY_SHORT_LABELS,
  SlotTemplate,
} from "@/types/hacktown";
import { toast } from "sonner";

export default function CapacityManagement() {
  const { venues, selectedDays, slotTemplates, updateSlotTemplate } =
    useHacktown();

  const [filterVenue, setFilterVenue] = useState<string>("all");
  const [filterDay, setFilterDay] = useState<WeekDay | "all">("all");
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [selectedDaysForBatch, setSelectedDaysForBatch] = useState<
    Set<WeekDay>
  >(new Set());

  // Retornar os dias efetivos de um slot
  const getSlotDays = useCallback(
    (slot: SlotTemplate): WeekDay[] => {
      return slot.days && slot.days.length > 0 ? slot.days : selectedDays;
    },
    [selectedDays],
  );

  // Filtrar slots por venue e dia
  const filteredSlots = useMemo(() => {
    return slotTemplates.filter((slot) => {
      const matchVenue = filterVenue === "all" || slot.venueId === filterVenue;
      const slotDays = getSlotDays(slot);
      const matchDay = filterDay === "all" || slotDays.includes(filterDay);
      return matchVenue && matchDay;
    });
  }, [slotTemplates, filterVenue, filterDay, getSlotDays]);

  // Agrupar slots por venue
  const slotsByVenue = useMemo(() => {
    const grouped: Record<string, SlotTemplate[]> = {};
    filteredSlots.forEach((slot) => {
      if (!grouped[slot.venueId]) {
        grouped[slot.venueId] = [];
      }
      grouped[slot.venueId].push(slot);
    });
    return grouped;
  }, [filteredSlots]);

  const getVenue = (venueId: string) => venues.find((v) => v.id === venueId);

  const toggleSlotSelection = (slotId: string) => {
    const newSelected = new Set(selectedSlots);
    if (newSelected.has(slotId)) {
      newSelected.delete(slotId);
    } else {
      newSelected.add(slotId);
    }
    setSelectedSlots(newSelected);
  };

  const toggleDayForBatch = (day: WeekDay) => {
    const newDays = new Set(selectedDaysForBatch);
    if (newDays.has(day)) {
      newDays.delete(day);
    } else {
      newDays.add(day);
    }
    setSelectedDaysForBatch(newDays);
  };

  const selectAllVisible = () => {
    const allIds = filteredSlots.map((s) => s.id);
    setSelectedSlots(new Set(allIds));
  };

  const clearSelection = () => {
    setSelectedSlots(new Set());
    setSelectedDaysForBatch(new Set());
  };

  const applyBatchDays = () => {
    if (selectedSlots.size === 0) {
      toast.error("Selecione pelo menos um slot");
      return;
    }
    if (selectedDaysForBatch.size === 0) {
      toast.error("Selecione pelo menos um dia");
      return;
    }

    const daysArray = Array.from(selectedDaysForBatch);
    let updatedCount = 0;

    selectedSlots.forEach((slotId) => {
      const slot = slotTemplates.find((s) => s.id === slotId);
      if (slot) {
        updateSlotTemplate(slotId, {
          venueId: slot.venueId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          days: daysArray,
        });
        updatedCount++;
      }
    });

    toast.success(
      `${updatedCount} slot(s) atualizados para ${daysArray.map((d) => WEEKDAY_SHORT_LABELS[d]).join(", ")}`,
    );
    clearSelection();
  };

  const addDaysToBatch = () => {
    if (selectedSlots.size === 0) {
      toast.error("Selecione pelo menos um slot");
      return;
    }
    if (selectedDaysForBatch.size === 0) {
      toast.error("Selecione pelo menos um dia");
      return;
    }

    const daysToAdd = Array.from(selectedDaysForBatch);
    let updatedCount = 0;

    selectedSlots.forEach((slotId) => {
      const slot = slotTemplates.find((s) => s.id === slotId);
      if (slot) {
        const currentDays = getSlotDays(slot);
        const newDays = Array.from(new Set([...currentDays, ...daysToAdd]));
        updateSlotTemplate(slotId, {
          venueId: slot.venueId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          days: newDays,
        });
        updatedCount++;
      }
    });

    toast.success(`Dias adicionados a ${updatedCount} slot(s)`);
    clearSelection();
  };

  const removeDaysFromBatch = () => {
    if (selectedSlots.size === 0) {
      toast.error("Selecione pelo menos um slot");
      return;
    }
    if (selectedDaysForBatch.size === 0) {
      toast.error("Selecione pelo menos um dia");
      return;
    }

    const daysToRemove = Array.from(selectedDaysForBatch);
    let updatedCount = 0;

    selectedSlots.forEach((slotId) => {
      const slot = slotTemplates.find((s) => s.id === slotId);
      if (slot) {
        const currentDays = getSlotDays(slot);
        const newDays = currentDays.filter((d) => !daysToRemove.includes(d));
        if (newDays.length > 0) {
          updateSlotTemplate(slotId, {
            venueId: slot.venueId,
            startTime: slot.startTime,
            endTime: slot.endTime,
            days: newDays,
          });
          updatedCount++;
        }
      }
    });

    toast.success(`Dias removidos de ${updatedCount} slot(s)`);
    clearSelection();
  };

  if (selectedDays.length === 0) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold gradient-text">
            Ajuste de Capacidade
          </h1>
          <p className="text-muted-foreground text-lg">
            Alocação em batch de slots
          </p>
        </div>
        <Card className="glass border-dashed border-2 border-amber-500/30">
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-amber-400" />
            <p className="text-amber-400 text-lg">
              Selecione os dias do evento primeiro
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Acesse a aba "Dias" para configurar
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold gradient-text">
          Ajuste de Capacidade
        </h1>
        <p className="text-muted-foreground text-lg">
          Alocação em batch de slots para múltiplos dias
        </p>
      </div>

      {/* Filters */}
      <Card className="glass">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-hacktown-cyan" />
              <Label className="text-muted-foreground">Venue:</Label>
              <Select value={filterVenue} onValueChange={setFilterVenue}>
                <SelectTrigger className="w-[200px] bg-muted/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong border-border">
                  <SelectItem value="all">Todos os venues</SelectItem>
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-hacktown-pink" />
              <Label className="text-muted-foreground">Dia:</Label>
              <Select
                value={filterDay}
                onValueChange={(v) => setFilterDay(v as WeekDay | "all")}
              >
                <SelectTrigger className="w-[180px] bg-muted/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong border-border">
                  <SelectItem value="all">Todos os dias</SelectItem>
                  {selectedDays.map((day) => (
                    <SelectItem key={day} value={day}>
                      {WEEKDAY_LABELS[day]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Batch Actions Panel */}
      <Card className="glass border-hacktown-cyan/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5 text-hacktown-cyan" />
            Ações em Batch
            {selectedSlots.size > 0 && (
              <Badge className="ml-2 bg-hacktown-cyan/20 text-hacktown-cyan">
                {selectedSlots.size} slot(s) selecionado(s)
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Day Selection for Batch */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Dias para aplicar:</Label>
            <div className="flex flex-wrap gap-2">
              {selectedDays.map((day) => (
                <Badge
                  key={day}
                  variant="outline"
                  className={`cursor-pointer transition-all ${
                    selectedDaysForBatch.has(day)
                      ? "bg-hacktown-pink/20 text-hacktown-pink border-hacktown-pink/50"
                      : "bg-muted/30 text-muted-foreground border-border hover:border-hacktown-pink/30"
                  }`}
                  onClick={() => toggleDayForBatch(day)}
                >
                  {WEEKDAY_SHORT_LABELS[day]}
                </Badge>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAllVisible}
              className="border-hacktown-cyan/30 text-hacktown-cyan hover:bg-hacktown-cyan/10"
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Selecionar todos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
              className="border-muted-foreground/30"
            >
              Limpar seleção
            </Button>
            <div className="flex-1" />
            <Button
              size="sm"
              onClick={addDaysToBatch}
              disabled={
                selectedSlots.size === 0 || selectedDaysForBatch.size === 0
              }
              className="bg-hacktown-green/80 hover:bg-hacktown-green text-white"
            >
              Adicionar dias
            </Button>
            <Button
              size="sm"
              onClick={removeDaysFromBatch}
              disabled={
                selectedSlots.size === 0 || selectedDaysForBatch.size === 0
              }
              variant="destructive"
            >
              Remover dias
            </Button>
            <Button
              size="sm"
              onClick={applyBatchDays}
              disabled={
                selectedSlots.size === 0 || selectedDaysForBatch.size === 0
              }
              className="bg-hacktown-cyan hover:bg-hacktown-cyan/80 text-white"
            >
              Substituir dias
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Slots List */}
      {Object.keys(slotsByVenue).length === 0 ? (
        <Card className="glass border-dashed border-2">
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground text-lg">
              Nenhum slot encontrado
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Crie slots na aba "Slots"
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(slotsByVenue).map(([venueId, slots]) => {
            const venue = getVenue(venueId);
            if (!venue) return null;

            return (
              <Card key={venueId} className="glass overflow-hidden">
                <CardHeader className="border-b border-border/50 bg-gradient-to-r from-hacktown-cyan/10 via-hacktown-pink/5 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-hacktown-cyan/20">
                      <MapPin className="h-5 w-5 text-hacktown-cyan" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{venue.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {venue.nucleo}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-muted/50">
                      <Users className="h-4 w-4 text-hacktown-pink" />
                      <span className="font-mono text-hacktown-pink">
                        {venue.capacity}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {slots.map((slot) => {
                      const slotDays = getSlotDays(slot);
                      return (
                        <div
                          key={slot.id}
                          className={`flex items-center gap-4 p-3 rounded-lg border transition-all cursor-pointer ${
                            selectedSlots.has(slot.id)
                              ? "bg-hacktown-cyan/10 border-hacktown-cyan/40"
                              : "bg-muted/20 border-border/50 hover:border-hacktown-cyan/30"
                          }`}
                          onClick={() => toggleSlotSelection(slot.id)}
                        >
                          <Checkbox
                            checked={selectedSlots.has(slot.id)}
                            onCheckedChange={() => toggleSlotSelection(slot.id)}
                            className="data-[state=checked]:bg-hacktown-cyan data-[state=checked]:border-hacktown-cyan"
                          />
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <Clock className="h-4 w-4 text-hacktown-pink" />
                            <span className="font-mono text-sm">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 flex-1">
                            {slotDays.map((day) => (
                              <Badge
                                key={day}
                                className="bg-hacktown-purple/20 text-hacktown-purple border-hacktown-purple/30 text-xs"
                              >
                                {WEEKDAY_SHORT_LABELS[day]}
                              </Badge>
                            ))}
                            {!slot.days && (
                              <Badge
                                variant="outline"
                                className="text-xs text-muted-foreground border-muted-foreground/30"
                              >
                                Todos os dias
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
