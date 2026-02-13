import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Search,
  Save,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  Mic,
  Projector,
  Cable,
  Presentation,
  Speaker,
  Monitor,
} from "lucide-react";
import { toast } from "sonner";
import { VenueAudiovisual, VENUE_STRUCTURE_LABELS } from "@/types/hacktown";
import { venueAudiovisualService } from "@/services/api";

type AudiovisualField =
  | "microfone"
  | "projetor"
  | "caboHdmi"
  | "passadorSlide"
  | "caixaSom"
  | "tela";

type ProvidenciadoField =
  | "microfoneProvidenciado"
  | "projetorProvidenciado"
  | "caboHdmiProvidenciado"
  | "passadorSlideProvidenciado"
  | "caixaSomProvidenciada"
  | "telaProvidenciada";

const AUDIOVISUAL_ITEMS: {
  field: AudiovisualField;
  providenciadoField: ProvidenciadoField;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  color: string;
  colorClass: string;
}[] = [
  {
    field: "microfone",
    providenciadoField: "microfoneProvidenciado",
    label: "Necessita Microfone",
    shortLabel: "Microfone",
    icon: Mic,
    color: "text-hacktown-cyan",
    colorClass: "border-hacktown-cyan/20",
  },
  {
    field: "projetor",
    providenciadoField: "projetorProvidenciado",
    label: "Necessita Projetor",
    shortLabel: "Projetor",
    icon: Projector,
    color: "text-hacktown-pink",
    colorClass: "border-hacktown-pink/20",
  },
  {
    field: "caboHdmi",
    providenciadoField: "caboHdmiProvidenciado",
    label: "Necessita Cabo HDMI",
    shortLabel: "HDMI",
    icon: Cable,
    color: "text-hacktown-purple",
    colorClass: "border-hacktown-purple/20",
  },
  {
    field: "passadorSlide",
    providenciadoField: "passadorSlideProvidenciado",
    label: "Necessita Passador de Slide",
    shortLabel: "Passador",
    icon: Presentation,
    color: "text-orange-400",
    colorClass: "border-orange-400/20",
  },
  {
    field: "caixaSom",
    providenciadoField: "caixaSomProvidenciada",
    label: "Necessita Caixa de Som",
    shortLabel: "Caixa de Som",
    icon: Speaker,
    color: "text-green-400",
    colorClass: "border-green-400/20",
  },
  {
    field: "tela",
    providenciadoField: "telaProvidenciada",
    label: "Necessita Tela/TV",
    shortLabel: "Tela/TV",
    icon: Monitor,
    color: "text-blue-400",
    colorClass: "border-blue-400/20",
  },
];

export default function VenueAudiovisualPage() {
  const [audiovisuals, setAudiovisuals] = useState<VenueAudiovisual[]>([]);
  const [originalAudiovisuals, setOriginalAudiovisuals] = useState<
    VenueAudiovisual[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNucleo, setSelectedNucleo] = useState<string>("todos");
  const [selectedStructureType, setSelectedStructureType] =
    useState<string>("todos");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogFilter, setDialogFilter] = useState<{
    type: AudiovisualField;
    label: string;
  } | null>(null);
  const [pendingChanges, setPendingChanges] = useState<
    Map<string, Partial<VenueAudiovisual>>
  >(new Map());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchAudiovisuals();
  }, []);

  const fetchAudiovisuals = async () => {
    try {
      const data = await venueAudiovisualService.getAll();
      setAudiovisuals(data);
      setOriginalAudiovisuals(JSON.parse(JSON.stringify(data)));
    } catch (error) {
      console.error("Erro ao carregar audiovisual:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (
    venueId: string,
    field: keyof VenueAudiovisual,
    value: boolean | string,
  ) => {
    const originalAv = originalAudiovisuals.find((i) => i.venueId === venueId);
    const updatedAvs = audiovisuals.map((av) =>
      av.venueId === venueId ? { ...av, [field]: value } : av,
    );
    setAudiovisuals(updatedAvs);

    setPendingChanges((prev) => {
      const newChanges = new Map(prev);
      const existingChanges = newChanges.get(venueId) || {};

      if (originalAv && originalAv[field] === value) {
        const updatedVenueChanges = { ...existingChanges };
        delete updatedVenueChanges[field];

        if (Object.keys(updatedVenueChanges).length === 0) {
          newChanges.delete(venueId);
        } else {
          newChanges.set(venueId, updatedVenueChanges);
        }
      } else {
        newChanges.set(venueId, {
          ...existingChanges,
          [field]: value,
        });
      }

      return newChanges;
    });
  };

  const handleSave = async (venueId: string) => {
    setSavingIds((prev) => new Set(prev).add(venueId));
    try {
      const av = audiovisuals.find((i) => i.venueId === venueId);
      if (!av) return;

      await venueAudiovisualService.update(venueId, {
        microfone: av.microfone,
        projetor: av.projetor,
        caboHdmi: av.caboHdmi,
        passadorSlide: av.passadorSlide,
        caixaSom: av.caixaSom,
        tela: av.tela,
        microfoneProvidenciado: av.microfoneProvidenciado,
        projetorProvidenciado: av.projetorProvidenciado,
        caboHdmiProvidenciado: av.caboHdmiProvidenciado,
        passadorSlideProvidenciado: av.passadorSlideProvidenciado,
        caixaSomProvidenciada: av.caixaSomProvidenciada,
        telaProvidenciada: av.telaProvidenciada,
        status: av.status || "",
      });

      setPendingChanges((prev) => {
        const newChanges = new Map(prev);
        newChanges.delete(venueId);
        return newChanges;
      });

      setOriginalAudiovisuals((prev) =>
        prev.map((i) => (i.venueId === venueId ? { ...av } : i)),
      );

      toast.success("Salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar");
    } finally {
      setSavingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(venueId);
        return newSet;
      });
    }
  };

  const handleToggleProvidenciado = (
    venueId: string,
    field: ProvidenciadoField,
  ) => {
    const originalAv = originalAudiovisuals.find((i) => i.venueId === venueId);
    const av = audiovisuals.find((i) => i.venueId === venueId);
    if (!av) return;

    const newValue = !av[field];

    const updatedAvs = audiovisuals.map((i) =>
      i.venueId === venueId ? { ...i, [field]: newValue } : i,
    );
    setAudiovisuals(updatedAvs);

    setPendingChanges((prev) => {
      const newChanges = new Map(prev);
      const existingChanges = newChanges.get(venueId) || {};

      if (originalAv && originalAv[field] === newValue) {
        const updatedVenueChanges = { ...existingChanges };
        delete updatedVenueChanges[field];

        if (Object.keys(updatedVenueChanges).length === 0) {
          newChanges.delete(venueId);
        } else {
          newChanges.set(venueId, updatedVenueChanges);
        }
      } else {
        newChanges.set(venueId, {
          ...existingChanges,
          [field]: newValue,
        });
      }

      return newChanges;
    });
  };

  const handleBatchSave = async () => {
    if (pendingChanges.size === 0) return;

    setIsSaving(true);
    try {
      const updates = Array.from(pendingChanges.entries()).map(
        ([venueId, changes]) => {
          const av = audiovisuals.find((i) => i.venueId === venueId);
          return {
            venueId,
            data: {
              microfone: av?.microfone ?? false,
              projetor: av?.projetor ?? false,
              caboHdmi: av?.caboHdmi ?? false,
              passadorSlide: av?.passadorSlide ?? false,
              caixaSom: av?.caixaSom ?? false,
              tela: av?.tela ?? false,
              microfoneProvidenciado: av?.microfoneProvidenciado ?? false,
              projetorProvidenciado: av?.projetorProvidenciado ?? false,
              caboHdmiProvidenciado: av?.caboHdmiProvidenciado ?? false,
              passadorSlideProvidenciado:
                av?.passadorSlideProvidenciado ?? false,
              caixaSomProvidenciada: av?.caixaSomProvidenciada ?? false,
              telaProvidenciada: av?.telaProvidenciada ?? false,
              status: av?.status ?? "",
              ...changes,
            },
          };
        },
      );

      await venueAudiovisualService.batchUpdate(updates);

      setOriginalAudiovisuals((prev) =>
        prev.map((original) => {
          const updated = audiovisuals.find(
            (i) => i.venueId === original.venueId,
          );
          return updated || original;
        }),
      );

      setPendingChanges(new Map());
      toast.success(
        `${updates.length} ${updates.length === 1 ? "alteração salva" : "alterações salvas"} com sucesso!`,
      );
    } catch (error) {
      console.error("Erro ao salvar alterações:", error);
      toast.error("Erro ao salvar alterações");
      fetchAudiovisuals();
    } finally {
      setIsSaving(false);
    }
  };

  const filteredAudiovisuals = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return audiovisuals
      .filter((av) => {
        if (!av.venue) return false;

        const matchesSearch =
          av.venue.code.toLowerCase().includes(query) ||
          av.venue.name.toLowerCase().includes(query);

        const matchesNucleo =
          selectedNucleo === "todos" || av.venue.nucleo === selectedNucleo;

        const matchesStructureType =
          selectedStructureType === "todos" ||
          av.venue.structureType === selectedStructureType;

        return matchesSearch && matchesNucleo && matchesStructureType;
      })
      .sort((a, b) => {
        if (!a.venue || !b.venue) return 0;
        if (sortDirection === "asc") {
          return a.venue.name.localeCompare(b.venue.name, "pt-BR");
        } else {
          return b.venue.name.localeCompare(a.venue.name, "pt-BR");
        }
      });
  }, [
    audiovisuals,
    searchQuery,
    selectedNucleo,
    selectedStructureType,
    sortDirection,
  ]);

  const openDialog = (type: AudiovisualField, label: string) => {
    setDialogFilter({ type, label });
    setDialogOpen(true);
  };

  const dialogVenues = useMemo(() => {
    if (!dialogFilter) return [];
    return audiovisuals.filter((av) => av[dialogFilter.type]);
  }, [audiovisuals, dialogFilter]);

  const nucleos = useMemo(() => {
    const nucleoSet = new Set<string>();
    audiovisuals.forEach((av) => {
      if (av.venue?.nucleo) nucleoSet.add(av.venue.nucleo);
    });
    return Array.from(nucleoSet).sort();
  }, [audiovisuals]);

  const structureTypes = useMemo(() => {
    const typeSet = new Set<string>();
    audiovisuals.forEach((av) => {
      if (av.venue?.structureType) typeSet.add(av.venue.structureType);
    });
    return Array.from(typeSet).sort();
  }, [audiovisuals]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold gradient-text">
            Audiovisual Necessário
          </h1>
          <p className="text-muted-foreground text-lg">
            Carregando configurações...
          </p>
        </div>
        <Card className="glass border-hacktown-cyan/20">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center animate-pulse">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Carregando audiovisual dos venues...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold gradient-text">
          Audiovisual Necessário
        </h1>
        <p className="text-muted-foreground text-lg">
          Gerencie equipamentos audiovisuais necessários para os venues
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {AUDIOVISUAL_ITEMS.map((item) => {
          const Icon = item.icon;
          const count = audiovisuals.filter((av) => av[item.field]).length;
          return (
            <Card
              key={item.field}
              onClick={() => openDialog(item.field, item.label)}
              className={`glass hover:neon-glow transition-all duration-300 border ${item.colorClass} cursor-pointer`}
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div
                  className={`p-2 rounded-lg bg-${item.color.replace("text-", "")}/10`}
                >
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div className="space-y-1">
                  <p className={`text-2xl font-bold font-mono ${item.color}`}>
                    {count}
                  </p>
                  <p className="text-xs text-muted-foreground leading-tight">
                    {item.shortLabel}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="glass border-sidebar-border/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código ou nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedNucleo} onValueChange={setSelectedNucleo}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por núcleo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os núcleos</SelectItem>
                {nucleos.map((nucleo) => (
                  <SelectItem key={nucleo} value={nucleo}>
                    {nucleo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedStructureType}
              onValueChange={setSelectedStructureType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                {structureTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {VENUE_STRUCTURE_LABELS[
                      type as keyof typeof VENUE_STRUCTURE_LABELS
                    ] || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Batch Save Button */}
      {pendingChanges.size > 0 && (
        <div className="flex items-center justify-center">
          <button
            onClick={handleBatchSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-hacktown-pink to-hacktown-cyan text-white font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-lg animate-pulse disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5" />
            {isSaving
              ? "Salvando..."
              : `Salvar ${pendingChanges.size} ${pendingChanges.size === 1 ? "Alteração" : "Alterações"}`}
          </button>
        </div>
      )}

      {/* Table */}
      <Card className="glass border-sidebar-border/50">
        <CardHeader>
          <CardTitle>Venues ({filteredAudiovisuals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Código</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      Nome
                      <button
                        onClick={() => {
                          setSortDirection((prev) =>
                            prev === "asc" ? "desc" : "asc",
                          );
                        }}
                        className="p-1 hover:bg-hacktown-cyan/20 rounded transition-colors"
                        title={`Ordenar por nome (${
                          sortDirection === "asc" ? "A-Z" : "Z-A"
                        })`}
                      >
                        <ArrowUpDown className="h-4 w-4 text-hacktown-cyan" />
                      </button>
                    </div>
                  </TableHead>
                  <TableHead className="w-[120px]">Núcleo</TableHead>
                  <TableHead className="w-[120px]">Tipo</TableHead>
                  {AUDIOVISUAL_ITEMS.map((item) => (
                    <TableHead
                      key={item.field}
                      className="text-center w-[80px]"
                    >
                      {item.shortLabel}
                    </TableHead>
                  ))}
                  <TableHead className="min-w-[200px]">
                    Status/Observação
                  </TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAudiovisuals.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4 + AUDIOVISUAL_ITEMS.length + 2}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Nenhum venue encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAudiovisuals.map((av) => (
                    <TableRow key={av.venueId}>
                      <TableCell className="font-mono text-sm">
                        {av.venue?.code}
                      </TableCell>
                      <TableCell className="font-medium">
                        {av.venue?.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {av.venue?.nucleo || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {av.venue?.structureType
                            ? VENUE_STRUCTURE_LABELS[
                                av.venue
                                  .structureType as keyof typeof VENUE_STRUCTURE_LABELS
                              ] || av.venue.structureType
                            : "-"}
                        </Badge>
                      </TableCell>
                      {AUDIOVISUAL_ITEMS.map((item) => (
                        <TableCell key={item.field} className="text-center">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={av[item.field]}
                              onCheckedChange={(checked) =>
                                handleUpdate(av.venueId, item.field, checked)
                              }
                            />
                          </div>
                        </TableCell>
                      ))}
                      <TableCell>
                        <Input
                          value={av.status || ""}
                          onChange={(e) =>
                            handleUpdate(av.venueId, "status", e.target.value)
                          }
                          placeholder="Observações..."
                          className="min-w-[200px]"
                        />
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleSave(av.venueId)}
                          disabled={savingIds.has(av.venueId)}
                          className="p-2 hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
                          title="Salvar"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog for filtered venues */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl gradient-text">
              {dialogFilter?.label}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {dialogVenues.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum venue encontrado
              </p>
            ) : (
              <div className="space-y-2">
                {dialogVenues.map((av) => {
                  const currentItem = AUDIOVISUAL_ITEMS.find(
                    (i) => i.field === dialogFilter?.type,
                  );
                  const providenciadoField = currentItem?.providenciadoField;
                  const isProvidenciado = providenciadoField
                    ? av[providenciadoField]
                    : false;

                  return (
                    <Card
                      key={av.venueId}
                      className="glass border-sidebar-border/50 hover:border-hacktown-cyan/30 transition-colors"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono">
                                {av.venue?.code}
                              </Badge>
                              <span className="font-medium">
                                {av.venue?.name}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              {av.venue?.nucleo && (
                                <Badge variant="secondary" className="text-xs">
                                  {av.venue.nucleo}
                                </Badge>
                              )}
                              {av.venue?.structureType && (
                                <Badge variant="secondary" className="text-xs">
                                  {VENUE_STRUCTURE_LABELS[
                                    av.venue
                                      .structureType as keyof typeof VENUE_STRUCTURE_LABELS
                                  ] || av.venue.structureType}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {providenciadoField && (
                            <button
                              onClick={() =>
                                handleToggleProvidenciado(
                                  av.venueId,
                                  providenciadoField,
                                )
                              }
                              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors hover:bg-accent"
                              title={
                                isProvidenciado
                                  ? "Marcar como não providenciado"
                                  : "Marcar como providenciado"
                              }
                            >
                              {isProvidenciado ? (
                                <>
                                  <CheckCircle className="h-6 w-6 text-green-500" />
                                  <span className="text-sm text-green-500 font-medium">
                                    Providenciado
                                  </span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-6 w-6 text-red-500" />
                                  <span className="text-sm text-red-500 font-medium">
                                    Pendente
                                  </span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        {av.status && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {av.status}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
