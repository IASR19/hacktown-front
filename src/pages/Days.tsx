import { useState, useEffect } from "react";
import { useHacktown } from "@/contexts/HacktownContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Check, Pencil, Save, X } from "lucide-react";
import { WeekDay, WEEKDAY_LABELS, WEEKDAYS_ORDER } from "@/types/hacktown";
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

// Helper para calcular dias da semana entre duas datas
const getWeekDaysBetweenDates = (
  startDate: string,
  endDate: string,
): WeekDay[] => {
  // Se não há datas definidas, retornar ordem tradicional da semana
  if (!startDate || !endDate) {
    return WEEKDAYS_ORDER;
  }

  // Usar UTC para evitar problemas de timezone
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  const weekDaysMap: Record<number, WeekDay> = {
    0: "domingo",
    1: "segunda",
    2: "terca",
    3: "quarta",
    4: "quinta",
    5: "sexta",
    6: "sabado",
  };
  const daysInOrder: WeekDay[] = [];
  const seen = new Set<WeekDay>();

  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    const weekDay = weekDaysMap[dayOfWeek];
    // Adicionar na ordem cronológica, sem repetir
    if (!seen.has(weekDay)) {
      daysInOrder.push(weekDay);
      seen.add(weekDay);
    }
    current.setDate(current.getDate() + 1);
  }

  // Retornar na ordem cronológica do período
  return daysInOrder;
};

// Helper para obter a data específica de um dia da semana no período
const getDateForWeekDay = (
  weekDay: WeekDay,
  startDate: string,
  endDate: string,
): string => {
  // Usar UTC para evitar problemas de timezone
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  const weekDaysMap: Record<number, WeekDay> = {
    0: "domingo",
    1: "segunda",
    2: "terca",
    3: "quarta",
    4: "quinta",
    5: "sexta",
    6: "sabado",
  };

  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (weekDaysMap[dayOfWeek] === weekDay) {
      return current.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
    }
    current.setDate(current.getDate() + 1);
  }

  return "";
};

export default function Days() {
  const {
    selectedDays,
    setSelectedDays,
    eventStartDate,
    eventEndDate,
    setEventDates,
    slotTemplates,
    daySlotActivities,
    isLoading,
  } = useHacktown();

  const [isEditing, setIsEditing] = useState(false);
  const [tempSelectedDays, setTempSelectedDays] =
    useState<WeekDay[]>(selectedDays);
  const [tempStartDate, setTempStartDate] = useState(eventStartDate || "");
  const [tempEndDate, setTempEndDate] = useState(eventEndDate || "");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    day: WeekDay | null;
  }>({
    open: false,
    day: null,
  });

  // Initialize editing mode only after data loads
  useEffect(() => {
    if (!isLoading && selectedDays.length === 0) {
      setIsEditing(true);
    }
  }, [isLoading, selectedDays.length]);

  // Update tempSelectedDays when selectedDays changes (e.g., after load)
  useEffect(() => {
    setTempSelectedDays(selectedDays);
    setTempStartDate(eventStartDate || "");
    setTempEndDate(eventEndDate || "");
  }, [selectedDays, eventStartDate, eventEndDate]);

  // Calcular dias automaticamente quando mudar as datas
  useEffect(() => {
    if (isEditing && tempStartDate && tempEndDate) {
      const calculatedDays = getWeekDaysBetweenDates(
        tempStartDate,
        tempEndDate,
      );
      setTempSelectedDays(calculatedDays);
    }
  }, [tempStartDate, tempEndDate, isEditing]);

  console.log("📱 Days Component - selectedDays:", selectedDays);
  console.log("📱 Days Component - tempSelectedDays:", tempSelectedDays);

  const getActivityCountForDay = (day: WeekDay) => {
    return daySlotActivities.filter((dsa) => dsa.day === day).length;
  };

  const toggleDay = (day: WeekDay) => {
    if (!isEditing) return;

    const isCurrentlySelected = tempSelectedDays.includes(day);
    const activityCount = getActivityCountForDay(day);

    // If trying to deselect a day with activities, ask for confirmation
    if (isCurrentlySelected && activityCount > 0) {
      setConfirmDialog({ open: true, day });
      return;
    }

    if (isCurrentlySelected) {
      setTempSelectedDays(tempSelectedDays.filter((d) => d !== day));
    } else {
      setTempSelectedDays([...tempSelectedDays, day]);
    }
  };

  const confirmRemoveDay = () => {
    if (confirmDialog.day) {
      setTempSelectedDays(
        tempSelectedDays.filter((d) => d !== confirmDialog.day),
      );
    }
    setConfirmDialog({ open: false, day: null });
  };

  const handleSave = async () => {
    console.log("💾 Salvando dias:", tempSelectedDays);
    console.log("💾 Salvando datas:", tempStartDate, tempEndDate);
    setSelectedDays(tempSelectedDays);
    if (tempStartDate && tempEndDate) {
      await setEventDates(tempStartDate, tempEndDate);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempSelectedDays(selectedDays);
    setTempStartDate(eventStartDate || "");
    setTempEndDate(eventEndDate || "");
    setIsEditing(false);
  };

  const handleEdit = () => {
    setTempSelectedDays(selectedDays);
    setTempStartDate(eventStartDate || "");
    setTempEndDate(eventEndDate || "");
    setIsEditing(true);
  };

  const displayDays = isEditing ? tempSelectedDays : selectedDays;

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold gradient-text">Dias do Evento</h1>
          <p className="text-muted-foreground text-lg">
            Carregando configurações...
          </p>
        </div>
        <Card className="glass border-hacktown-cyan/20">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center animate-pulse">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Carregando dias do evento...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold gradient-text">Dias do Evento</h1>
          <p className="text-muted-foreground text-lg">
            {isEditing
              ? "Selecione os dias da semana em que o evento acontecerá"
              : "Dias configurados para o evento"}
          </p>
        </div>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                className="gap-2"
                disabled={selectedDays.length === 0}
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="gap-2 bg-hacktown-cyan text-hacktown-dark hover:bg-hacktown-cyan/90"
                disabled={tempSelectedDays.length === 0}
              >
                <Save className="h-4 w-4" />
                Salvar
              </Button>
            </>
          ) : (
            <Button
              onClick={handleEdit}
              variant="outline"
              className="gap-2 border-hacktown-cyan/50 text-hacktown-cyan hover:bg-hacktown-cyan/10"
            >
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* Campos de Data do Evento */}
      {isEditing && (
        <Card className="glass border-hacktown-pink/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-5 w-5 text-hacktown-pink" />
              Período do Evento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-muted-foreground">
                  Data de Início *
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  className="bg-muted/50 border-border focus:border-hacktown-pink"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-muted-foreground">
                  Data de Término *
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={tempEndDate}
                  min={tempStartDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  className="bg-muted/50 border-border focus:border-hacktown-pink"
                />
              </div>
            </div>
            {tempStartDate && tempEndDate && (
              <p className="text-sm text-muted-foreground mt-4">
                Os dias da semana serão calculados automaticamente baseado no
                período selecionado.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="glass border-hacktown-cyan/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-5 w-5 text-hacktown-cyan" />
            Dias Selecionados: {displayDays.length}
            {isEditing && (
              <Badge className="ml-2 bg-hacktown-pink/20 text-hacktown-pink border-hacktown-pink/30">
                Modo Edição
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {WEEKDAYS_ORDER.map((day, index) => {
              const isSelected = displayDays.includes(day);
              const activityCount = getActivityCountForDay(day);
              const slotCount = slotTemplates.filter((slot) =>
                slot.days?.includes(day),
              ).length;
              const dateLabel =
                eventStartDate && eventEndDate
                  ? getDateForWeekDay(day, eventStartDate, eventEndDate)
                  : "";

              return (
                <div
                  key={day}
                  className={`
                    relative p-5 rounded-xl transition-all duration-300
                    border-2 group
                    ${isEditing ? "cursor-pointer" : "cursor-default"}
                    ${
                      isSelected
                        ? "bg-gradient-to-br from-hacktown-cyan/20 to-hacktown-pink/10 border-hacktown-cyan/50 neon-glow"
                        : "bg-muted/30 border-border/50"
                    }
                    ${isEditing && !isSelected ? "hover:border-hacktown-cyan/30 hover:bg-muted/50" : ""}
                    ${!isEditing ? "opacity-90" : ""}
                  `}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => toggleDay(day)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`
                      w-6 h-6 rounded-md flex items-center justify-center transition-all
                      ${
                        isSelected
                          ? "bg-hacktown-cyan text-hacktown-dark"
                          : "bg-muted border border-border"
                      }
                    `}
                    >
                      {isSelected && <Check className="h-4 w-4" />}
                    </div>
                  </div>

                  <h3
                    className={`
                    text-lg font-semibold transition-colors
                    ${isSelected ? "text-foreground" : "text-muted-foreground"}
                  `}
                  >
                    {WEEKDAY_LABELS[day]}
                    {dateLabel && (
                      <span
                        className={`ml-2 text-sm ${isSelected ? "text-hacktown-cyan" : "text-muted-foreground"}`}
                      >
                        ({dateLabel})
                      </span>
                    )}
                  </h3>

                  {isSelected && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {slotCount} slot{slotCount !== 1 ? "s" : ""} disponíve
                      {slotCount !== 1 ? "is" : "l"}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {displayDays.length > 0 && (
        <Card className="glass">
          <CardContent className="py-6">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-muted-foreground mr-2">Dias ativos:</span>
              {displayDays.map((day) => (
                <Badge
                  key={day}
                  className="bg-hacktown-cyan/20 text-hacktown-cyan border-hacktown-cyan/30 font-medium"
                >
                  {WEEKDAY_LABELS[day]}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {displayDays.length === 0 && (
        <Card className="glass border-dashed border-2">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg">
              Nenhum dia selecionado
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Selecione os dias acima para começar a configurar o evento
            </p>
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ open, day: null })}
      >
        <AlertDialogContent className="glass border-hacktown-pink/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-hacktown-pink">
              Confirmar remoção
            </AlertDialogTitle>
            <AlertDialogDescription>
              O dia{" "}
              <strong>
                {confirmDialog.day ? WEEKDAY_LABELS[confirmDialog.day] : ""}
              </strong>{" "}
              possui{" "}
              <strong>
                {confirmDialog.day
                  ? getActivityCountForDay(confirmDialog.day)
                  : 0}
              </strong>{" "}
              atividade(s) agendada(s). Deseja realmente remover este dia?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveDay}
              className="bg-hacktown-pink hover:bg-hacktown-pink/90"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
