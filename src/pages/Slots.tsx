import { useState, useMemo } from "react";
import { useHacktown } from "@/contexts/HacktownContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Clock,
  MapPin,
  Pencil,
  Trash2,
  Calendar,
  Layers,
  CheckCircle2,
  CircleDashed,
} from "lucide-react";
import { toast } from "sonner";
import { SlotTemplate, WEEKDAY_SHORT_LABELS, WeekDay } from "@/types/hacktown";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Slots() {
  const {
    venues,
    selectedDays,
    slotTemplates,
    daySlotActivities,
    addSlotTemplate,
    updateSlotTemplate,
    deleteSlotTemplate,
    getVenuesWithSlots,
  } = useHacktown();

  const [isOpen, setIsOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<SlotTemplate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<SlotTemplate | null>(null);
  const [selectedDaysForSlot, setSelectedDaysForSlot] = useState<WeekDay[]>([]);
  const [selectedVenueFilter, setSelectedVenueFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"venue" | "day">("day");
  const [selectedDayTab, setSelectedDayTab] = useState<WeekDay>(
    selectedDays[0] || "segunda",
  );
  const [formData, setFormData] = useState({
    venueId: "",
    startTime: "",
    endTime: "",
  });

  const venuesWithSlots = getVenuesWithSlots();

  // Calculate summary statistics
  const summary = useMemo(() => {
    // Calcular instâncias reais considerando os dias de cada slot
    let totalSlotInstances = 0;
    slotTemplates.forEach((template) => {
      const daysForTemplate =
        template.days && template.days.length > 0
          ? template.days.filter((d) => selectedDays.includes(d))
          : selectedDays;
      totalSlotInstances += daysForTemplate.length;
    });

    const scheduledActivities = daySlotActivities.length;
    const availableSlotInstances = totalSlotInstances - scheduledActivities;

    // Group by day
    const slotsByDay = selectedDays.map((day) => {
      // Contar quantos slots existem para este dia específico
      const slotsForDay = slotTemplates.filter((template) => {
        const daysForTemplate =
          template.days && template.days.length > 0
            ? template.days
            : selectedDays;
        return daysForTemplate.includes(day);
      }).length;

      const scheduled = daySlotActivities.filter(
        (dsa) => dsa.day === day,
      ).length;
      return {
        day,
        total: slotsForDay,
        available: slotsForDay - scheduled,
        scheduled,
      };
    });

    return {
      totalTemplates: slotTemplates.length,
      totalSlotInstances,
      availableSlotInstances,
      scheduledActivities,
      slotsByDay,
    };
  }, [slotTemplates, selectedDays, daySlotActivities]);

  const resetForm = () => {
    setFormData({ venueId: "", startTime: "", endTime: "" });
    setSelectedDaysForSlot(selectedDays); // Resetar para todos os dias
    setEditingSlot(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetForm();
    } else if (!editingSlot) {
      // Ao abrir para criar novo, inicializar com todos os dias
      setSelectedDaysForSlot(selectedDays);
    }
  };

  const handleEdit = (slot: SlotTemplate) => {
    setEditingSlot(slot);
    setFormData({
      venueId: slot.venueId,
      startTime: slot.startTime,
      endTime: slot.endTime,
    });
    // Ao editar, carregar os dias que o slot já tem
    setSelectedDaysForSlot(
      slot.days && slot.days.length > 0 ? slot.days : selectedDays,
    );
    setIsOpen(true);
  };

  const toggleDay = (day: WeekDay) => {
    setSelectedDaysForSlot((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.venueId || !formData.startTime || !formData.endTime) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (selectedDaysForSlot.length === 0) {
      toast.error("Selecione pelo menos um dia");
      return;
    }

    const slotData: {
      venueId: string;
      startTime: string;
      endTime: string;
      days: string[];
    } = {
      venueId: formData.venueId,
      startTime: formData.startTime,
      endTime: formData.endTime,
      days: selectedDaysForSlot, // Sempre enviar os dias selecionados
    };

    if (editingSlot) {
      await updateSlotTemplate(editingSlot.id, slotData);
      toast.success("Slot atualizado!");
    } else {
      await addSlotTemplate(slotData);
      toast.success(`Slot criado para ${selectedDaysForSlot.length} dia(s)!`);
    }

    handleOpenChange(false);
  };

  const handleDeleteRequest = async (slot: SlotTemplate) => {
    const activitiesCount = daySlotActivities.filter(
      (dsa) => dsa.slotTemplateId === slot.id,
    ).length;
    if (activitiesCount > 0) {
      setDeleteConfirm(slot);
    } else {
      await deleteSlotTemplate(slot.id);
      toast.success("Slot removido!");
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirm) {
      await deleteSlotTemplate(deleteConfirm.id);
      toast.success("Slot e atividades removidos!");
      setDeleteConfirm(null);
    }
  };

  const getVenueName = (venueId: string) => {
    return venues.find((v) => v.id === venueId)?.name || "Venue desconhecido";
  };

  const getActivitiesForSlot = (slotId: string) => {
    return daySlotActivities.filter((dsa) => dsa.slotTemplateId === slotId);
  };

  // Organizar slots por dia e horário
  const getSlotsByDayAndTime = (day: WeekDay) => {
    return slotTemplates
      .filter((slot) => {
        const slotDays =
          slot.days && slot.days.length > 0 ? slot.days : selectedDays;
        return slotDays.includes(day);
      })
      .sort((a, b) => {
        // Ordenar por horário de início
        const timeA = a.startTime.split(":").map(Number);
        const timeB = b.startTime.split(":").map(Number);
        const minutesA = timeA[0] * 60 + timeA[1];
        const minutesB = timeB[0] * 60 + timeB[1];
        return minutesA - minutesB;
      });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold gradient-text">Slots</h1>
          <p className="text-muted-foreground text-lg">
            Horários replicados em todos os dias selecionados
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button
              className="bg-hacktown-pink hover:bg-hacktown-pink/90 text-white font-semibold px-6 py-5 rounded-xl neon-glow-pink"
              disabled={venues.length === 0 || selectedDays.length === 0}
            >
              <Plus className="h-5 w-5 mr-2" />
              Novo Slot
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong border-hacktown-pink/20">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold gradient-text">
                {editingSlot ? "Editar Slot" : "Novo Slot"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-3">
                <Label className="text-muted-foreground">
                  Dias * {editingSlot && "(editar)"}
                </Label>
                <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-2">
                  <p className="text-sm text-muted-foreground mb-3">
                    {editingSlot
                      ? "Edite os dias para este slot:"
                      : "Selecione os dias para este slot (já pré-selecionados):"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDays.map((day) => (
                      <Button
                        key={day}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleDay(day)}
                        className={`transition-all ${
                          selectedDaysForSlot.includes(day)
                            ? "bg-hacktown-cyan text-hacktown-dark border-hacktown-cyan hover:bg-hacktown-cyan/80 font-semibold"
                            : "bg-muted/50 border-border hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {WEEKDAY_SHORT_LABELS[day]}
                      </Button>
                    ))}
                  </div>
                  {selectedDaysForSlot.length === 0 && (
                    <p className="text-xs text-red-400 mt-2">
                      Selecione pelo menos um dia
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue" className="text-muted-foreground">
                  Venue *
                </Label>
                <Select
                  value={formData.venueId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, venueId: value })
                  }
                >
                  <SelectTrigger className="bg-muted/50 border-border focus:border-hacktown-pink">
                    <SelectValue placeholder="Selecione o venue" />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-border">
                    {venues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-muted-foreground">
                    Início *
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    className="bg-muted/50 border-border focus:border-hacktown-pink font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime" className="text-muted-foreground">
                    Fim *
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    className="bg-muted/50 border-border focus:border-hacktown-pink font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  className="border-border hover:bg-muted"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-hacktown-cyan hover:bg-hacktown-cyan/90 text-hacktown-dark font-semibold px-6"
                >
                  {editingSlot ? "Salvar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Warnings */}
      {selectedDays.length === 0 && (
        <Card className="glass border-dashed border-2 border-amber-500/30">
          <CardContent className="py-6 text-center">
            <p className="text-amber-400">
              Selecione os dias do evento na aba "Dias" antes de criar slots.
            </p>
          </CardContent>
        </Card>
      )}

      {venues.length === 0 && (
        <Card className="glass border-dashed border-2">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg">
              Cadastre um venue primeiro
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Você precisa ter pelo menos um venue para criar slots
            </p>
          </CardContent>
        </Card>
      )}

      {venues.length > 0 &&
        selectedDays.length > 0 &&
        slotTemplates.length === 0 && (
          <Card className="glass border-dashed border-2">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg">
                Nenhum slot cadastrado ainda
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Clique em "Novo Slot" para começar
              </p>
            </CardContent>
          </Card>
        )}

      {slotTemplates.length > 0 && (
        <div className="space-y-6">
          {/* Summary Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold gradient-text">Visão Geral</h2>

            {/* General Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="glass border-hacktown-cyan/20">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-hacktown-cyan/10">
                    <Layers className="h-6 w-6 text-hacktown-cyan" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold font-mono text-hacktown-cyan">
                      {summary.totalSlotInstances}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Slots</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-green-400/20">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-green-400/10">
                    <CircleDashed className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold font-mono text-green-400">
                      {summary.availableSlotInstances}
                    </p>
                    <p className="text-sm text-muted-foreground">Disponíveis</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-hacktown-pink/20">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-hacktown-pink/10">
                    <CheckCircle2 className="h-6 w-6 text-hacktown-pink" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold font-mono text-hacktown-pink">
                      {summary.scheduledActivities}
                    </p>
                    <p className="text-sm text-muted-foreground">Programados</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary by Day */}
            {/* 
            {summary.slotsByDay.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Por Dia
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {summary.slotsByDay.map((day) => (
                    <Card key={day.day} className="glass border-border/50">
                      <CardContent className="p-3 text-center">
                        <p className="text-sm font-semibold text-foreground mb-1">
                          {WEEKDAY_SHORT_LABELS[day.day]}
                        </p>
                        <div className="flex justify-center gap-2 mt-2">
                          <Badge className="bg-green-400/20 text-green-400 border-green-400/30 text-xs font-mono">
                            {day.available}
                          </Badge>
                          <Badge className="bg-hacktown-pink/20 text-hacktown-pink border-hacktown-pink/30 text-xs font-mono">
                            {day.scheduled}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            */}
          </div>

          {/* Slots by Venue */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold gradient-text">
                {viewMode === "venue"
                  ? "Slots por Venue"
                  : "Slots por Dia e Horário"}
              </h2>
              <div className="flex gap-3">
                <Select
                  value={viewMode}
                  onValueChange={(value: "venue" | "day") => setViewMode(value)}
                >
                  <SelectTrigger className="w-[200px] bg-muted/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-border">
                    <SelectItem value="day">Por Dia e Horário</SelectItem>
                    <SelectItem value="venue">Por Venue</SelectItem>
                  </SelectContent>
                </Select>
                {viewMode === "venue" && (
                  <Select
                    value={selectedVenueFilter}
                    onValueChange={setSelectedVenueFilter}
                  >
                    <SelectTrigger className="w-[200px] bg-muted/50 border-border">
                      <SelectValue placeholder="Filtrar por venue" />
                    </SelectTrigger>
                    <SelectContent className="glass-strong border-border">
                      <SelectItem value="all">Todos os venues</SelectItem>
                      {venues
                        .filter((v) =>
                          slotTemplates.some((s) => s.venueId === v.id),
                        )
                        .map((venue) => (
                          <SelectItem key={venue.id} value={venue.id}>
                            {venue.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* View by Day */}
            {viewMode === "day" && (
              <Tabs
                value={selectedDayTab}
                onValueChange={(value) => setSelectedDayTab(value as WeekDay)}
                className="w-full"
              >
                <TabsList className="glass-strong border border-border w-full justify-start overflow-x-auto flex-nowrap">
                  {selectedDays.map((day) => {
                    const daySlots = getSlotsByDayAndTime(day);
                    return (
                      <TabsTrigger
                        key={day}
                        value={day}
                        className="data-[state=active]:bg-hacktown-cyan data-[state=active]:text-hacktown-dark"
                      >
                        {WEEKDAY_SHORT_LABELS[day]}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {daySlots.length}
                        </Badge>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {selectedDays.map((day) => {
                  const daySlots = getSlotsByDayAndTime(day);

                  return (
                    <TabsContent key={day} value={day} className="mt-4">
                      {daySlots.length === 0 ? (
                        <Card className="glass border-dashed border-2">
                          <CardContent className="py-16 text-center">
                            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground text-lg">
                              Nenhum slot para {WEEKDAY_SHORT_LABELS[day]}
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-3">
                          {daySlots.map((slot, index) => {
                            const venue = venues.find(
                              (v) => v.id === slot.venueId,
                            );
                            const activities = getActivitiesForSlot(slot.id);

                            return (
                              <Card
                                key={slot.id}
                                className="glass group hover:neon-glow-pink transition-all duration-300"
                                style={{ animationDelay: `${index * 50}ms` }}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-4">
                                    <div className="slot-badge text-center min-w-[90px] text-hacktown-pink">
                                      <div className="font-bold text-lg">
                                        {slot.startTime}
                                      </div>
                                      <div className="text-xs text-muted-foreground my-1">
                                        até
                                      </div>
                                      <div className="font-bold text-lg">
                                        {slot.endTime}
                                      </div>
                                    </div>

                                    <div className="h-12 w-px bg-border" />

                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <MapPin className="h-4 w-4 text-hacktown-cyan" />
                                        <p className="font-semibold text-lg">
                                          {venue?.name || "Venue desconhecido"}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Badge
                                          variant="outline"
                                          className="font-mono text-xs"
                                        >
                                          {venue?.code || "N/A"}
                                        </Badge>
                                        {venue?.nucleo && (
                                          <Badge className="bg-hacktown-cyan/20 text-hacktown-cyan border-hacktown-cyan/30 text-xs">
                                            {venue.nucleo}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <Badge className="bg-muted/50 text-muted-foreground border-border">
                                        Capacidade: {venue?.capacity || 0}
                                      </Badge>
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-9 w-9 hover:bg-hacktown-cyan/20 hover:text-hacktown-cyan"
                                          onClick={() => handleEdit(slot)}
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-9 w-9 hover:bg-destructive/20 text-destructive"
                                          onClick={() =>
                                            handleDeleteRequest(slot)
                                          }
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            )}

            {/* View by Venue */}
            {viewMode === "venue" &&
              venuesWithSlots
                .filter((v) => slotTemplates.some((s) => s.venueId === v.id))
                .filter(
                  (v) =>
                    selectedVenueFilter === "all" ||
                    v.id === selectedVenueFilter,
                )
                .map((venue, vIndex) => {
                  const venueSlotTemplates = slotTemplates
                    .filter((s) => s.venueId === venue.id)
                    .sort((a, b) => {
                      // Ordenar por horário de início
                      const timeA = a.startTime.split(":").map(Number);
                      const timeB = b.startTime.split(":").map(Number);
                      const minutesA = timeA[0] * 60 + timeA[1];
                      const minutesB = timeB[0] * 60 + timeB[1];
                      return minutesA - minutesB;
                    });

                  return (
                    <Card
                      key={venue.id}
                      className="glass overflow-hidden"
                      style={{ animationDelay: `${vIndex * 100}ms` }}
                    >
                      <CardHeader className="border-b border-border/50 bg-gradient-to-r from-hacktown-cyan/5 to-hacktown-pink/5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-hacktown-cyan/20">
                            <MapPin className="h-5 w-5 text-hacktown-cyan" />
                          </div>
                          <CardTitle className="text-xl">
                            {venue.name}
                          </CardTitle>
                          <Badge
                            variant="outline"
                            className="ml-auto border-border text-muted-foreground font-mono"
                          >
                            {venueSlotTemplates.length} slot(s)
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {venueSlotTemplates.map((slot, sIndex) => {
                            const activities = getActivitiesForSlot(slot.id);

                            return (
                              <div
                                key={slot.id}
                                className="group flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-hacktown-pink/40 transition-all duration-300"
                                style={{ animationDelay: `${sIndex * 50}ms` }}
                              >
                                <div className="slot-badge text-center min-w-[80px] text-hacktown-pink">
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
                                  <p className="text-sm text-muted-foreground">
                                    {slot.days && slot.days.length > 0
                                      ? slot.days.length
                                      : selectedDays.length}{" "}
                                    dia(s)
                                  </p>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 hover:bg-hacktown-cyan/20 hover:text-hacktown-cyan"
                                    onClick={() => handleEdit(slot)}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 hover:bg-destructive/20 text-destructive"
                                    onClick={() => handleDeleteRequest(slot)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
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
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent className="glass-strong">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Este slot possui atividades agendadas que também serão removidas.
              Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
