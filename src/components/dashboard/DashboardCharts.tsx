import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  VenueWithSlots,
  VENUE_STRUCTURE_LABELS,
  VenueStructureType,
  WEEKDAY_SHORT_LABELS,
  WeekDay,
} from "@/types/hacktown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useHacktown } from "@/contexts/HacktownContext";
import { BarChart3 } from "lucide-react";

interface DashboardChartsProps {
  venuesWithSlots: VenueWithSlots[];
}

const COLORS = {
  cyan: "hsl(187, 100%, 50%)",
  pink: "hsl(330, 100%, 60%)",
  purple: "hsl(270, 100%, 65%)",
  green: "hsl(142, 76%, 45%)",
  orange: "hsl(25, 95%, 53%)",
  yellow: "hsl(48, 96%, 53%)",
};

const CHART_COLORS = [
  COLORS.cyan,
  COLORS.pink,
  COLORS.purple,
  COLORS.green,
  COLORS.orange,
  COLORS.yellow,
];

type ChartType =
  | "capacityPerSlot"
  | "capacityByDay"
  | "slotsByDay"
  | "slotsByTime"
  | "slotsByStatus"
  | "slotsByNucleo"
  | "venuesByPorte"
  | "venuesByDay"
  | "venuesByTime"
  | "venuesByNucleo"
  | "venuesByStructure";

const CHART_OPTIONS: { value: ChartType; label: string }[] = [
  { value: "capacityPerSlot", label: "Capacidade por Slot" },
  { value: "capacityByDay", label: "Capacidade por Dia" },
  { value: "slotsByDay", label: "Slots por Dia" },
  { value: "slotsByTime", label: "Slots por Horário" },
  { value: "slotsByStatus", label: "Slots por Status" },
  { value: "slotsByNucleo", label: "Slots por Núcleo" },
  { value: "venuesByPorte", label: "Venues por Porte" },
  { value: "venuesByDay", label: "Venues por Dia" },
  { value: "venuesByTime", label: "Venues por Horário" },
  { value: "venuesByNucleo", label: "Venues por Núcleo" },
  { value: "venuesByStructure", label: "Venues por Tipo de Estrutura" },
];

export function DashboardCharts({ venuesWithSlots }: DashboardChartsProps) {
  const { selectedDays } = useHacktown();
  const [selectedChart, setSelectedChart] =
    useState<ChartType>("capacityPerSlot");

  // 1. Capacidade por slot (somatório das capacidades por faixa de horário)
  const capacityPerSlotData = useMemo(() => {
    const timeSlotCapacities: Record<string, number> = {};

    venuesWithSlots.forEach((venue) => {
      venue.slots.forEach((slot) => {
        const timeKey = `${slot.startTime}-${slot.endTime}`;
        timeSlotCapacities[timeKey] =
          (timeSlotCapacities[timeKey] || 0) + venue.capacity;
      });
    });

    // Converter para array e ordenar por horário
    return Object.entries(timeSlotCapacities)
      .map(([name, capacidade]) => ({ name, capacidade }))
      .sort((a, b) => {
        const timeA = a.name.split("-")[0].split(":").map(Number);
        const timeB = b.name.split("-")[0].split(":").map(Number);
        const minutesA = timeA[0] * 60 + timeA[1];
        const minutesB = timeB[0] * 60 + timeB[1];
        return minutesA - minutesB;
      });
  }, [venuesWithSlots]);

  // 2. Slots por dia da semana
  const slotsByDayData = useMemo(() => {
    const dayCount: Record<WeekDay, number> = {} as Record<WeekDay, number>;
    selectedDays.forEach((day) => {
      dayCount[day] = 0;
    });

    venuesWithSlots.forEach((venue) => {
      venue.slots.forEach((slot) => {
        if (dayCount[slot.day] !== undefined) {
          dayCount[slot.day]++;
        }
      });
    });

    return selectedDays.map((day) => ({
      name: WEEKDAY_SHORT_LABELS[day],
      slots: dayCount[day] || 0,
    }));
  }, [venuesWithSlots, selectedDays]);

  // Capacidade total por dia
  const capacityByDayData = useMemo(() => {
    const dayCapacity: Record<WeekDay, number> = {} as Record<WeekDay, number>;
    selectedDays.forEach((day) => {
      dayCapacity[day] = 0;
    });

    venuesWithSlots.forEach((venue) => {
      venue.slots.forEach((slot) => {
        if (dayCapacity[slot.day] !== undefined) {
          dayCapacity[slot.day] += venue.capacity;
        }
      });
    });

    return selectedDays.map((day) => ({
      name: WEEKDAY_SHORT_LABELS[day],
      capacidade: dayCapacity[day] || 0,
    }));
  }, [venuesWithSlots, selectedDays]);

  // 3. Slots por status (disponível, programado)
  const slotsByStatusData = useMemo(() => {
    let disponivel = 0;
    let programado = 0;
    venuesWithSlots.forEach((venue) => {
      venue.slots.forEach((slot) => {
        if (slot.activity) {
          programado++;
        } else {
          disponivel++;
        }
      });
    });
    return [
      { name: "Disponível", value: disponivel },
      { name: "Programado", value: programado },
    ];
  }, [venuesWithSlots]);

  // 4. Slots por horário (agrupado por hora de início)
  const slotsByTimeData = useMemo(() => {
    const timeCount: Record<string, number> = {};
    venuesWithSlots.forEach((venue) => {
      venue.slots.forEach((slot) => {
        const hour = slot.startTime?.split(":")[0] || "N/A";
        timeCount[hour] = (timeCount[hour] || 0) + 1;
      });
    });
    return Object.entries(timeCount)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, slots]) => ({ name: `${name}h`, slots }));
  }, [venuesWithSlots]);

  // 5. Slots por núcleo
  const slotsByNucleoData = useMemo(() => {
    const nucleoCount: Record<string, number> = {};
    venuesWithSlots.forEach((venue) => {
      const nucleo = venue.nucleo ? venue.nucleo.toUpperCase() : "SEM NÚCLEO";
      nucleoCount[nucleo] = (nucleoCount[nucleo] || 0) + venue.slots.length;
    });
    return Object.entries(nucleoCount).map(([name, value]) => ({
      name,
      value,
    }));
  }, [venuesWithSlots]);

  // 6. Venues por porte
  const venuesByPorteData = useMemo(() => {
    let grande = 0;
    let medio = 0;
    let pequeno = 0;
    venuesWithSlots.forEach((venue) => {
      if (venue.capacity > 400) grande++;
      else if (venue.capacity > 100) medio++;
      else pequeno++;
    });
    return [
      { name: "Grande (>400)", value: grande },
      { name: "Médio (101-400)", value: medio },
      { name: "Pequeno (≤100)", value: pequeno },
    ];
  }, [venuesWithSlots]);

  // 7. Venues por tipo de estrutura
  const venuesByStructureData = useMemo(() => {
    const structureCount: Record<string, number> = {};
    venuesWithSlots.forEach((venue) => {
      const type = venue.structureType
        ? VENUE_STRUCTURE_LABELS[venue.structureType as VenueStructureType]
        : "Não definido";
      structureCount[type] = (structureCount[type] || 0) + 1;
    });
    return Object.entries(structureCount).map(([name, value]) => ({
      name,
      value,
    }));
  }, [venuesWithSlots]);

  // 8. Venues por núcleo
  const venuesByNucleoData = useMemo(() => {
    const nucleoCount: Record<string, number> = {};
    venuesWithSlots.forEach((venue) => {
      const nucleo = venue.nucleo ? venue.nucleo.toUpperCase() : "SEM NÚCLEO";
      nucleoCount[nucleo] = (nucleoCount[nucleo] || 0) + 1;
    });
    return Object.entries(nucleoCount).map(([name, value]) => ({
      name,
      value,
    }));
  }, [venuesWithSlots]);

  // 9. Venues por dia (quantos venues têm slots em cada dia)
  const venuesByDayData = useMemo(() => {
    const dayVenues: Record<WeekDay, Set<string>> = {} as Record<
      WeekDay,
      Set<string>
    >;
    selectedDays.forEach((day) => {
      dayVenues[day] = new Set();
    });

    venuesWithSlots.forEach((venue) => {
      venue.slots.forEach((slot) => {
        if (dayVenues[slot.day]) {
          dayVenues[slot.day].add(venue.id);
        }
      });
    });

    return selectedDays.map((day) => ({
      name: WEEKDAY_SHORT_LABELS[day],
      venues: dayVenues[day]?.size || 0,
    }));
  }, [venuesWithSlots, selectedDays]);

  // 10. Venues por horário (quantos venues têm slots em cada hora)
  const venuesByTimeData = useMemo(() => {
    const timeVenues: Record<string, Set<string>> = {};
    venuesWithSlots.forEach((venue) => {
      venue.slots.forEach((slot) => {
        const hour = slot.startTime?.split(":")[0] || "N/A";
        if (!timeVenues[hour]) timeVenues[hour] = new Set();
        timeVenues[hour].add(venue.id);
      });
    });
    return Object.entries(timeVenues)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, venues]) => ({ name: `${name}h`, venues: venues.size }));
  }, [venuesWithSlots]);

  const renderBarChart = (
    data: { name: string; [key: string]: string | number }[],
    dataKey: string,
    color: string,
  ) => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
        <XAxis
          dataKey="name"
          tick={{ fill: "hsl(220, 15%, 55%)", fontSize: 12 }}
        />
        <YAxis tick={{ fill: "hsl(220, 15%, 55%)", fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(220, 25%, 12%)",
            border: "1px solid hsl(220, 20%, 18%)",
            borderRadius: "8px",
            color: "hsl(210, 20%, 95%)",
          }}
          labelStyle={{ color: "hsl(210, 20%, 95%)" }}
          itemStyle={{ color: "hsl(210, 20%, 95%)" }}
        />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderPieChart = (data: { name: string; value: number }[]) => (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) =>
            `${name} (${(percent * 100).toFixed(0)}%)`
          }
          labelLine={false}
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(220, 25%, 12%)",
            border: "1px solid hsl(220, 20%, 18%)",
            borderRadius: "8px",
            color: "hsl(210, 20%, 95%)",
          }}
          itemStyle={{ color: "hsl(210, 20%, 95%)" }}
        />
        <Legend
          wrapperStyle={{ fontSize: "12px" }}
          formatter={(value) => (
            <span style={{ color: "hsl(220, 15%, 55%)" }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  const getCurrentChartData = () => {
    switch (selectedChart) {
      case "capacityPerSlot":
        return capacityPerSlotData;
      case "capacityByDay":
        return capacityByDayData;
      case "slotsByDay":
        return slotsByDayData;
      case "slotsByTime":
        return slotsByTimeData;
      case "slotsByStatus":
        return slotsByStatusData;
      case "slotsByNucleo":
        return slotsByNucleoData;
      case "venuesByPorte":
        return venuesByPorteData;
      case "venuesByDay":
        return venuesByDayData;
      case "venuesByTime":
        return venuesByTimeData;
      case "venuesByNucleo":
        return venuesByNucleoData;
      case "venuesByStructure":
        return venuesByStructureData;
      default:
        return [];
    }
  };

  const hasData = getCurrentChartData().length > 0;
  const totalSlots = venuesWithSlots.reduce(
    (sum, v) => sum + v.slots.length,
    0,
  );

  const renderSelectedChart = () => {
    if (!hasData) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
          <BarChart3 className="h-16 w-16 text-muted-foreground/40" />
          <div className="space-y-2">
            <p className="text-lg font-medium text-muted-foreground">
              Sem dados para exibir
            </p>
            <p className="text-sm text-muted-foreground/70 max-w-md">
              {totalSlots === 0
                ? "Configure os dias do evento e crie slots para visualizar os gráficos."
                : "Não há dados disponíveis para este gráfico. Verifique os filtros aplicados."}
            </p>
          </div>
        </div>
      );
    }

    switch (selectedChart) {
      case "capacityPerSlot":
        return renderBarChart(capacityPerSlotData, "capacidade", COLORS.cyan);
      case "capacityByDay":
        return renderBarChart(capacityByDayData, "capacidade", COLORS.pink);
      case "slotsByDay":
        return renderBarChart(slotsByDayData, "slots", COLORS.pink);
      case "slotsByTime":
        return renderBarChart(slotsByTimeData, "slots", COLORS.purple);
      case "slotsByStatus":
        return renderPieChart(slotsByStatusData);
      case "slotsByNucleo":
        return renderPieChart(slotsByNucleoData);
      case "venuesByPorte":
        return renderPieChart(venuesByPorteData);
      case "venuesByDay":
        return renderBarChart(venuesByDayData, "venues", COLORS.green);
      case "venuesByTime":
        return renderBarChart(venuesByTimeData, "venues", COLORS.orange);
      case "venuesByNucleo":
        return renderPieChart(venuesByNucleoData);
      case "venuesByStructure":
        return renderPieChart(venuesByStructureData);
      default:
        return null;
    }
  };

  if (venuesWithSlots.length === 0) {
    return (
      <Card className="glass hover:neon-glow transition-all duration-500">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <BarChart3 className="h-16 w-16 text-muted-foreground/40" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-muted-foreground">
                Nenhum local cadastrado
              </p>
              <p className="text-sm text-muted-foreground/70 max-w-md">
                Comece cadastrando venues na página "Venues" para visualizar
                estatísticas e gráficos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (selectedDays.length === 0) {
    return (
      <Card className="glass hover:neon-glow transition-all duration-500">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <BarChart3 className="h-16 w-16 text-muted-foreground/40" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-muted-foreground">
                Nenhum dia selecionado
              </p>
              <p className="text-sm text-muted-foreground/70 max-w-md">
                Configure os dias do evento na página "Dias" para visualizar os
                gráficos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-hacktown-cyan" />
          <h2 className="text-xl font-bold gradient-text">Gráficos</h2>
        </div>
        <Select
          value={selectedChart}
          onValueChange={(v) => setSelectedChart(v as ChartType)}
        >
          <SelectTrigger className="w-[280px] bg-muted/50 border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass-strong border-border">
            {CHART_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="glass hover:neon-glow transition-all duration-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">
            {CHART_OPTIONS.find((o) => o.value === selectedChart)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[350px]">{renderSelectedChart()}</CardContent>
      </Card>
    </div>
  );
}
