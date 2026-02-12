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
  FileCheck,
  Shield,
  Wrench,
  HardHat,
} from "lucide-react";
import { toast } from "sonner";
import { VenueInfrastructure, VENUE_STRUCTURE_LABELS } from "@/types/hacktown";
import { venueInfrastructureService } from "@/services/api";

export default function VenueInfrastructurePage() {
  const [infrastructures, setInfrastructures] = useState<VenueInfrastructure[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNucleo, setSelectedNucleo] = useState<string>("todos");
  const [selectedStructureType, setSelectedStructureType] =
    useState<string>("todos");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogFilter, setDialogFilter] = useState<{
    type: "alvara" | "avcb" | "revisao" | "reforma";
    label: string;
  } | null>(null);

  useEffect(() => {
    fetchInfrastructures();
  }, []);

  const fetchInfrastructures = async () => {
    try {
      const data = await venueInfrastructureService.getAll();
      setInfrastructures(data);
    } catch (error) {
      console.error("Erro ao carregar infraestrutura:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (
    venueId: string,
    field: keyof VenueInfrastructure,
    value: boolean | string,
  ) => {
    const updatedInfras = infrastructures.map((infra) =>
      infra.venueId === venueId ? { ...infra, [field]: value } : infra,
    );
    setInfrastructures(updatedInfras);
  };

  const handleSave = async (venueId: string) => {
    setSavingIds((prev) => new Set(prev).add(venueId));
    try {
      const infra = infrastructures.find((i) => i.venueId === venueId);

      if (!infra) return;

      await venueInfrastructureService.update(venueId, {
        alvara: infra.alvara,
        avcb: infra.avcb,
        revisao: infra.revisao,
        reforma: infra.reforma,
        alvaraProvidenciado: infra.alvaraProvidenciado,
        avcbProvidenciado: infra.avcbProvidenciado,
        revisaoProvidenciada: infra.revisaoProvidenciada,
        reformaProvidenciada: infra.reformaProvidenciada,
        status: infra.status || "",
      });

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

  const handleToggleProvidenciado = async (
    venueId: string,
    field:
      | "alvaraProvidenciado"
      | "avcbProvidenciado"
      | "revisaoProvidenciada"
      | "reformaProvidenciada",
  ) => {
    try {
      const infra = infrastructures.find((i) => i.venueId === venueId);
      if (!infra) return;

      const newValue = !infra[field];

      // Update local state immediately
      const updatedInfras = infrastructures.map((i) =>
        i.venueId === venueId ? { ...i, [field]: newValue } : i,
      );
      setInfrastructures(updatedInfras);

      // Save to backend
      await venueInfrastructureService.update(venueId, {
        alvara: infra.alvara,
        avcb: infra.avcb,
        revisao: infra.revisao,
        reforma: infra.reforma,
        alvaraProvidenciado:
          field === "alvaraProvidenciado"
            ? newValue
            : infra.alvaraProvidenciado,
        avcbProvidenciado:
          field === "avcbProvidenciado" ? newValue : infra.avcbProvidenciado,
        revisaoProvidenciada:
          field === "revisaoProvidenciada"
            ? newValue
            : infra.revisaoProvidenciada,
        reformaProvidenciada:
          field === "reformaProvidenciada"
            ? newValue
            : infra.reformaProvidenciada,
        status: infra.status || "",
      });

      toast.success("Status atualizado!");
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      toast.error("Erro ao atualizar status");
      // Revert on error
      fetchInfrastructures();
    }
  };

  const filteredInfrastructures = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return infrastructures
      .filter((infra) => {
        if (!infra.venue) return false;

        const matchesSearch =
          infra.venue.code.toLowerCase().includes(query) ||
          infra.venue.name.toLowerCase().includes(query);

        const matchesNucleo =
          selectedNucleo === "todos" || infra.venue.nucleo === selectedNucleo;

        const matchesStructureType =
          selectedStructureType === "todos" ||
          infra.venue.structureType === selectedStructureType;

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
    infrastructures,
    searchQuery,
    selectedNucleo,
    selectedStructureType,
    sortDirection,
  ]);

  const openDialog = (
    type: "alvara" | "avcb" | "revisao" | "reforma",
    label: string,
  ) => {
    setDialogFilter({ type, label });
    setDialogOpen(true);
  };

  const dialogVenues = useMemo(() => {
    if (!dialogFilter) return [];

    return infrastructures.filter((infra) => {
      if (dialogFilter.type === "alvara") return infra.alvara;
      if (dialogFilter.type === "avcb") return infra.avcb;
      if (dialogFilter.type === "revisao") return infra.revisao;
      if (dialogFilter.type === "reforma") return infra.reforma;
      return false;
    });
  }, [infrastructures, dialogFilter]);

  const nucleos = useMemo(() => {
    const nucleoSet = new Set<string>();
    infrastructures.forEach((infra) => {
      if (infra.venue?.nucleo) nucleoSet.add(infra.venue.nucleo);
    });
    return Array.from(nucleoSet).sort();
  }, [infrastructures]);

  const structureTypes = useMemo(() => {
    const typeSet = new Set<string>();
    infrastructures.forEach((infra) => {
      if (infra.venue?.structureType) typeSet.add(infra.venue.structureType);
    });
    return Array.from(typeSet).sort();
  }, [infrastructures]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold gradient-text">
            Estrutura Necessária
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
              Carregando infraestrutura dos venues...
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
          Estrutura Necessária
        </h1>
        <p className="text-muted-foreground text-lg">
          Gerencie requisitos burocráticos e de infraestrutura dos venues
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card
          onClick={() => openDialog("alvara", "Necessita Alvará")}
          className="glass hover:neon-glow transition-all duration-300 border border-hacktown-cyan/20 cursor-pointer"
        >
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <div className="p-2 rounded-lg bg-hacktown-cyan/10">
              <FileCheck className="h-5 w-5 text-hacktown-cyan" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold font-mono text-hacktown-cyan">
                {infrastructures.filter((i) => i.alvara).length}
              </p>
              <p className="text-xs text-muted-foreground leading-tight">
                Necessita Alvará
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => openDialog("avcb", "Necessita AVCB")}
          className="glass hover:neon-glow transition-all duration-300 border border-hacktown-pink/20 cursor-pointer"
        >
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <div className="p-2 rounded-lg bg-hacktown-pink/10">
              <Shield className="h-5 w-5 text-hacktown-pink" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold font-mono text-hacktown-pink">
                {infrastructures.filter((i) => i.avcb).length}
              </p>
              <p className="text-xs text-muted-foreground leading-tight">
                Necessita AVCB
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => openDialog("revisao", "Necessita Revisão")}
          className="glass hover:neon-glow transition-all duration-300 border border-hacktown-purple/20 cursor-pointer"
        >
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <div className="p-2 rounded-lg bg-hacktown-purple/10">
              <Wrench className="h-5 w-5 text-hacktown-purple" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold font-mono text-hacktown-purple">
                {infrastructures.filter((i) => i.revisao).length}
              </p>
              <p className="text-xs text-muted-foreground leading-tight">
                Necessita Revisão
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => openDialog("reforma", "Necessita Reforma")}
          className="glass hover:neon-glow transition-all duration-300 border border-orange-400/20 cursor-pointer"
        >
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <div className="p-2 rounded-lg bg-orange-400/10">
              <HardHat className="h-5 w-5 text-orange-400" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold font-mono text-orange-400">
                {infrastructures.filter((i) => i.reforma).length}
              </p>
              <p className="text-xs text-muted-foreground leading-tight">
                Necessita Reforma
              </p>
            </div>
          </CardContent>
        </Card>
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

      {/* Table */}
      <Card className="glass border-sidebar-border/50">
        <CardHeader>
          <CardTitle>Venues ({filteredInfrastructures.length})</CardTitle>
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
                  <TableHead className="text-center w-[80px]">Alvará</TableHead>
                  <TableHead className="text-center w-[80px]">AVCB</TableHead>
                  <TableHead className="text-center w-[80px]">
                    Revisão
                  </TableHead>
                  <TableHead className="text-center w-[80px]">
                    Reforma
                  </TableHead>
                  <TableHead className="min-w-[200px]">
                    Status/Observação
                  </TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInfrastructures.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Nenhum venue encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInfrastructures.map((infra) => (
                    <TableRow key={infra.venueId}>
                      <TableCell className="font-mono text-sm">
                        {infra.venue?.code}
                      </TableCell>
                      <TableCell className="font-medium">
                        {infra.venue?.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {infra.venue?.nucleo || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {infra.venue?.structureType
                            ? VENUE_STRUCTURE_LABELS[
                                infra.venue
                                  .structureType as keyof typeof VENUE_STRUCTURE_LABELS
                              ] || infra.venue.structureType
                            : "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={infra.alvara}
                            onCheckedChange={(checked) =>
                              handleUpdate(infra.venueId, "alvara", checked)
                            }
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={infra.avcb}
                            onCheckedChange={(checked) =>
                              handleUpdate(infra.venueId, "avcb", checked)
                            }
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={infra.revisao}
                            onCheckedChange={(checked) =>
                              handleUpdate(infra.venueId, "revisao", checked)
                            }
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={infra.reforma}
                            onCheckedChange={(checked) =>
                              handleUpdate(infra.venueId, "reforma", checked)
                            }
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={infra.status || ""}
                          onChange={(e) =>
                            handleUpdate(
                              infra.venueId,
                              "status",
                              e.target.value,
                            )
                          }
                          placeholder="Observações..."
                          className="min-w-[200px]"
                        />
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleSave(infra.venueId)}
                          disabled={savingIds.has(infra.venueId)}
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
                {dialogVenues.map((infra) => {
                  const getProvidenciadoField = () => {
                    if (dialogFilter?.type === "alvara")
                      return infra.alvaraProvidenciado;
                    if (dialogFilter?.type === "avcb")
                      return infra.avcbProvidenciado;
                    if (dialogFilter?.type === "revisao")
                      return infra.revisaoProvidenciada;
                    if (dialogFilter?.type === "reforma")
                      return infra.reformaProvidenciada;
                    return false;
                  };

                  const getFieldName = ():
                    | "alvaraProvidenciado"
                    | "avcbProvidenciado"
                    | "revisaoProvidenciada"
                    | "reformaProvidenciada" => {
                    if (dialogFilter?.type === "alvara")
                      return "alvaraProvidenciado";
                    if (dialogFilter?.type === "avcb")
                      return "avcbProvidenciado";
                    if (dialogFilter?.type === "revisao")
                      return "revisaoProvidenciada";
                    return "reformaProvidenciada";
                  };

                  const isProvidenciado = getProvidenciadoField();

                  return (
                    <Card
                      key={infra.venueId}
                      className="glass border-sidebar-border/50 hover:border-hacktown-cyan/30 transition-colors"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono">
                                {infra.venue?.code}
                              </Badge>
                              <span className="font-medium">
                                {infra.venue?.name}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              {infra.venue?.nucleo && (
                                <Badge variant="secondary" className="text-xs">
                                  {infra.venue.nucleo}
                                </Badge>
                              )}
                              {infra.venue?.structureType && (
                                <Badge variant="secondary" className="text-xs">
                                  {VENUE_STRUCTURE_LABELS[
                                    infra.venue
                                      .structureType as keyof typeof VENUE_STRUCTURE_LABELS
                                  ] || infra.venue.structureType}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              handleToggleProvidenciado(
                                infra.venueId,
                                getFieldName(),
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
                        </div>
                        {infra.status && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {infra.status}
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
