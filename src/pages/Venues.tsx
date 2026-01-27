import { useState, useMemo, useEffect, useRef } from "react";
import { useHacktown } from "@/contexts/HacktownContext";
import { venuesService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  MapPin,
  Users,
  Pencil,
  Trash2,
  Search,
  Hash,
  Lock,
  Upload,
  Download,
  LayoutGrid,
  List,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  Venue,
  VenueStructureType,
  VENUE_STRUCTURE_LABELS,
} from "@/types/hacktown";

export default function Venues() {
  const {
    venues,
    addVenue,
    updateVenue,
    deleteVenue,
    slotTemplates,
    refetchAll,
  } = useHacktown();
  const [isOpen, setIsOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNucleo, setSelectedNucleo] = useState<string>("todos");
  const [selectedStructureType, setSelectedStructureType] =
    useState<string>("todos");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    location: "",
    capacity: "",
    description: "",
    nucleo: "",
    structureType: "" as VenueStructureType | "",
  });

  // Filter and sort venues alphabetically
  const filteredVenues = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const filtered = venues
      .filter((venue) => {
        const matchesSearch =
          venue.name.toLowerCase().includes(query) ||
          venue.code.toLowerCase().includes(query);
        const matchesNucleo =
          selectedNucleo === "todos" || venue.nucleo === selectedNucleo;
        const matchesStructureType =
          selectedStructureType === "todos" ||
          venue.structureType === selectedStructureType;
        return matchesSearch && matchesNucleo && matchesStructureType;
      })
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

    console.log(
      `📊 Total venues: ${venues.length}, Filtrados: ${filtered.length}, Query: "${query}", Núcleo: "${selectedNucleo}", Tipo: "${selectedStructureType}"`,
    );
    return filtered;
  }, [venues, searchQuery, selectedNucleo, selectedStructureType]);

  // Obter núcleos únicos disponíveis
  const availableNucleos = useMemo(() => {
    const nucleos = new Set<string>();
    venues.forEach((venue) => {
      if (venue.nucleo) nucleos.add(venue.nucleo);
    });
    return Array.from(nucleos).sort();
  }, [venues]);

  // Obter tipos de estrutura únicos disponíveis
  const availableStructureTypes = useMemo(() => {
    const types = new Set<string>();
    venues.forEach((venue) => {
      if (venue.structureType) types.add(venue.structureType);
    });
    return Array.from(types).sort();
  }, [venues]);

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      location: "",
      capacity: "",
      description: "",
      nucleo: "",
      structureType: "",
    });
    setEditingVenue(null);
  };

  // Fetch next code when structure type changes (only for new venues)
  useEffect(() => {
    if (!editingVenue && formData.structureType) {
      const fetchNextCode = async () => {
        try {
          const response = await venuesService.getNextCode(
            formData.structureType,
          );
          setFormData((prev) => ({ ...prev, code: response.code }));
        } catch (error) {
          console.error("Erro ao buscar próximo código:", error);
        }
      };
      fetchNextCode();
    }
  }, [formData.structureType, editingVenue]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) resetForm();
  };

  const handleEdit = (venue: Venue) => {
    setEditingVenue(venue);
    setFormData({
      code: venue.code,
      name: venue.name,
      location: venue.location,
      capacity: venue.capacity.toString(),
      description: venue.description || "",
      nucleo: venue.nucleo || "",
      structureType: venue.structureType || "",
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.capacity) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const venueData = {
      code: formData.code,
      name: formData.name,
      location: formData.location,
      capacity: parseInt(formData.capacity),
      description: formData.description || undefined,
      nucleo: formData.nucleo || undefined,
      structureType: formData.structureType || undefined,
    };

    if (editingVenue) {
      await updateVenue(editingVenue.id, venueData);
      toast.success("Venue atualizado!");
    } else {
      await addVenue(venueData);
      toast.success("Venue cadastrado!");
    }

    handleOpenChange(false);
  };

  const handleDelete = async (venue: Venue) => {
    const venueSlots = slotTemplates.filter((s) => s.venueId === venue.id);
    if (venueSlots.length > 0) {
      toast.error(
        `Este venue possui ${venueSlots.length} slot(s). Remova os slots primeiro.`,
      );
      return;
    }
    await deleteVenue(venue.id);
    toast.success("Venue removido!");
  };

  const handleApplyDefaultSlots = async (venueId: string) => {
    try {
      console.log("Aplicando slots padrão para venue:", venueId);
      const result = await venuesService.applyDefaultSlots(venueId);
      console.log("Resultado:", result);
      toast.success(result.message, {
        description: `${result.slotsCreated} slots criados`,
      });
      await refetchAll();
    } catch (error) {
      console.error("Erro ao aplicar slots:", error);
      toast.error("Erro ao aplicar horários padrão", {
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  };

  const getVenueSlotCount = (venueId: string) => {
    return slotTemplates.filter((s) => s.venueId === venueId).length;
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/)) {
      toast.error("Por favor, selecione um arquivo Excel (.xlsx ou .xls)");
      return;
    }

    setSelectedFile(file);
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/)) {
      toast.error("Por favor, selecione um arquivo Excel (.xlsx ou .xls)");
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleImportConfirm = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    try {
      const result = await venuesService.importExcel(selectedFile);

      if (result.errors.length > 0) {
        // Show detailed errors in a more visible way
        const errorMessage = result.errors.slice(0, 5).join("\n");
        const remainingErrors =
          result.errors.length > 5
            ? `\n... e mais ${result.errors.length - 5} erros`
            : "";

        toast.error(
          result.success > 0
            ? `${result.success} venues importados, mas ${result.errors.length} erro(s) encontrado(s)`
            : `Falha na importação: ${result.errors.length} erro(s) encontrado(s)`,
          {
            description: errorMessage + remainingErrors,
            duration: 10000,
          },
        );
      } else {
        toast.success(`${result.success} venues importados com sucesso!`);
      }

      // Reload venues if at least one was imported
      if (result.success > 0) {
        await refetchAll();
      }

      setIsImportDialogOpen(false);
      setSelectedFile(null);
    } catch (error) {
      toast.error(
        `Erro ao importar planilha: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        {
          duration: 8000,
        },
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Create empty template with just headers
    const templateData = [
      {
        nome: "",
        capacidade: "",
        tipo: "",
        localização: "",
        descrição: "",
        núcleo: "",
      },
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    ws["!cols"] = [
      { wch: 25 }, // nome
      { wch: 12 }, // capacidade
      { wch: 15 }, // tipo
      { wch: 30 }, // localização
      { wch: 30 }, // descrição
      { wch: 12 }, // núcleo
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Venues");

    // Generate and download file
    XLSX.writeFile(wb, "template_venues_hacktown.xlsx");
    toast.success("Template baixado com sucesso!");
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold gradient-text">
            Cadastro de Venues
          </h1>
          <p className="text-muted-foreground text-lg">
            Gerencie os pontos de atividade
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => setIsImportDialogOpen(true)}
            disabled={isImporting}
            variant="outline"
            className="border-hacktown-cyan/30 hover:bg-hacktown-cyan/10 px-6 py-5 rounded-xl"
          >
            <Upload className="h-5 w-5 mr-2" />
            Importar Excel
          </Button>
          <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button className="bg-hacktown-cyan hover:bg-hacktown-cyan/90 text-hacktown-dark font-semibold px-6 py-5 rounded-xl neon-glow">
                <Plus className="h-5 w-5 mr-2" />
                Novo Venue
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong border-hacktown-cyan/20">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold gradient-text">
                  {editingVenue ? "Editar Venue" : "Novo Venue"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-muted-foreground">
                      Código {editingVenue && "*"}
                    </Label>
                    <div className="relative">
                      <Input
                        id="code"
                        value={formData.code}
                        disabled={true}
                        onChange={(e) =>
                          setFormData({ ...formData, code: e.target.value })
                        }
                        placeholder=""
                        className="bg-muted/50 border-border focus:border-hacktown-cyan font-mono disabled:opacity-60 disabled:cursor-not-allowed pr-10"
                      />
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-muted-foreground">
                      Nome *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Ex: Auditório Principal"
                      className="bg-muted/50 border-border focus:border-hacktown-cyan"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-muted-foreground">
                    Endereço
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="Ex: Rua Principal, 123"
                    className="bg-muted/50 border-border focus:border-hacktown-cyan"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacity" className="text-muted-foreground">
                      Capacidade *
                    </Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) =>
                        setFormData({ ...formData, capacity: e.target.value })
                      }
                      placeholder="Ex: 100"
                      className="bg-muted/50 border-border focus:border-hacktown-cyan"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nucleo" className="text-muted-foreground">
                      Núcleo
                    </Label>
                    <Select
                      value={formData.nucleo}
                      onValueChange={(value) =>
                        setFormData({ ...formData, nucleo: value })
                      }
                    >
                      <SelectTrigger className="bg-muted/50 border-border focus:border-hacktown-cyan">
                        <SelectValue placeholder="Selecione o núcleo" />
                      </SelectTrigger>
                      <SelectContent className="glass-strong border-border">
                        <SelectItem value="ETE">ETE</SelectItem>
                        <SelectItem value="Inatel">Inatel</SelectItem>
                        <SelectItem value="Centro">Centro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="structureType"
                    className="text-muted-foreground"
                  >
                    Tipo de Estrutura
                  </Label>
                  <Select
                    value={formData.structureType}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        structureType: value as VenueStructureType,
                      })
                    }
                  >
                    <SelectTrigger className="bg-muted/50 border-border focus:border-hacktown-cyan">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="glass-strong border-border">
                      {Object.entries(VENUE_STRUCTURE_LABELS).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="description"
                    className="text-muted-foreground"
                  >
                    Observação
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Observações sobre o venue"
                    className="bg-muted/50 border-border focus:border-hacktown-cyan"
                  />
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
                    className="bg-hacktown-pink hover:bg-hacktown-pink/90 text-white font-semibold px-6"
                  >
                    {editingVenue ? "Salvar" : "Cadastrar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Import Excel Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="glass-strong border-hacktown-cyan/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold gradient-text">
              Importar Venues do Excel
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Drag and Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
                transition-all duration-200
                ${
                  isDragging
                    ? "border-hacktown-cyan bg-hacktown-cyan/10 scale-[1.02]"
                    : "border-border hover:border-hacktown-cyan/50 hover:bg-muted/50"
                }
              `}
            >
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div
                    className={`
                    p-4 rounded-full 
                    ${isDragging ? "bg-hacktown-cyan/20" : "bg-muted"}
                  `}
                  >
                    <Upload
                      className={`h-12 w-12 ${isDragging ? "text-hacktown-cyan" : "text-muted-foreground"}`}
                    />
                  </div>
                </div>

                {selectedFile ? (
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-hacktown-cyan">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Clique para selecionar outro arquivo
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-lg font-semibold">
                      {isDragging
                        ? "Solte o arquivo aqui"
                        : "Arraste e solte o arquivo Excel aqui"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ou clique para selecionar
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Formatos aceitos: .xlsx, .xls
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="glass-strong p-4 rounded-lg border border-border">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-sm">Colunas obrigatórias:</h4>
                <Button
                  onClick={handleDownloadTemplate}
                  variant="outline"
                  size="sm"
                  className="border-hacktown-cyan/30 hover:bg-hacktown-cyan/10 text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Baixar Template
                </Button>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                <li>
                  • <strong>nome</strong> - Nome do local
                </li>
                <li>
                  • <strong>capacidade</strong> - Número de pessoas
                </li>
                <li>
                  <strong>tipo</strong>: restaurante, sala, auditório, espaço,
                  casa, apoio, palco, feira, lounge, estande, ou coworking
                </li>
              </ul>
              <h4 className="font-semibold mt-3 mb-2 text-sm">
                Colunas opcionais:
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                <li>
                  • <strong>localização</strong> - Endereço
                </li>
                <li>
                  • <strong>descrição</strong> - Observações
                </li>
                <li>
                  • <strong>núcleo</strong> - ETE, Inatel ou Centro
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsImportDialogOpen(false);
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                className="border-border hover:bg-muted"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleImportConfirm}
                disabled={!selectedFile || isImporting}
                className="bg-hacktown-cyan hover:bg-hacktown-cyan/90 text-hacktown-dark font-semibold px-6"
              >
                {isImporting ? "Importando..." : "Importar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search and Filter */}
      {venues.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome ou código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-border focus:border-hacktown-cyan"
            />
          </div>
          <Select value={selectedNucleo} onValueChange={setSelectedNucleo}>
            <SelectTrigger className="w-full sm:w-[200px] bg-muted/50 border-border">
              <SelectValue placeholder="Filtrar por núcleo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>Todos os Núcleos</span>
                </div>
              </SelectItem>
              {availableNucleos.map((nucleo) => (
                <SelectItem key={nucleo} value={nucleo}>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-hacktown-cyan" />
                    <span>{nucleo}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedStructureType}
            onValueChange={setSelectedStructureType}
          >
            <SelectTrigger className="w-full sm:w-[200px] bg-muted/50 border-border">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span>Todos os Tipos</span>
                </div>
              </SelectItem>
              {availableStructureTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-hacktown-pink" />
                    <span>
                      {VENUE_STRUCTURE_LABELS[type as VenueStructureType]}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "cards" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("cards")}
              className={
                viewMode === "cards"
                  ? "bg-hacktown-cyan hover:bg-hacktown-cyan/80"
                  : ""
              }
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
              className={
                viewMode === "list"
                  ? "bg-hacktown-cyan hover:bg-hacktown-cyan/80"
                  : ""
              }
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {venues.length === 0 ? (
        <Card className="glass border-dashed border-2">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg">
              Nenhum venue cadastrado ainda
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Clique em "Novo Venue" para começar
            </p>
          </CardContent>
        </Card>
      ) : filteredVenues.length === 0 ? (
        <Card className="glass border-dashed border-2">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg">
              Nenhum venue encontrado
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Tente uma busca diferente
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVenues.map((venue, index) => {
            const slotCount = getVenueSlotCount(venue.id);
            return (
              <Card
                key={venue.id}
                className="glass group hover:neon-glow-pink transition-all duration-500 overflow-hidden"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader className="pb-3 relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-hacktown-pink/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                  <div className="flex items-start justify-between relative">
                    <div className="space-y-1">
                      <Badge
                        variant="outline"
                        className="border-hacktown-cyan/30 text-hacktown-cyan font-mono text-xs mb-1"
                      >
                        <Hash className="h-3 w-3 mr-1" />
                        {venue.code}
                      </Badge>
                      <CardTitle className="text-xl font-bold">
                        {venue.name}
                      </CardTitle>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 hover:bg-hacktown-pink/20 hover:text-hacktown-pink"
                        onClick={() => handleApplyDefaultSlots(venue.id)}
                        title="Aplicar Horários Padrão"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 hover:bg-hacktown-cyan/20 hover:text-hacktown-cyan"
                        onClick={() => handleEdit(venue)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 hover:bg-destructive/20 text-destructive"
                        onClick={() => handleDelete(venue)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-hacktown-pink" />
                    {venue.location}
                  </p>
                  {venue.nucleo && (
                    <p className="text-sm text-muted-foreground/80">
                      Núcleo: {venue.nucleo}
                    </p>
                  )}
                  {venue.description && (
                    <p className="text-sm text-muted-foreground/80">
                      {venue.description}
                    </p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Badge className="bg-hacktown-cyan/20 text-hacktown-cyan border-hacktown-cyan/30 font-mono">
                      <Users className="h-3 w-3 mr-1" />
                      {venue.capacity}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-border text-muted-foreground font-mono"
                    >
                      {slotCount} slot(s)
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Código
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Nome
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Local
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Núcleo
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Capacidade
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Slots
                  </th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredVenues.map((venue, index) => {
                  const slotCount = getVenueSlotCount(venue.id);
                  return (
                    <tr
                      key={venue.id}
                      className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <td className="p-4">
                        <Badge
                          variant="outline"
                          className="border-hacktown-cyan/30 text-hacktown-cyan font-mono text-xs"
                        >
                          <Hash className="h-3 w-3 mr-1" />
                          {venue.code}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{venue.name}</div>
                        {venue.description && (
                          <div className="text-sm text-muted-foreground/70 mt-1">
                            {venue.description}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 text-hacktown-pink flex-shrink-0" />
                          <span>{venue.location}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">
                          {venue.nucleo || "-"}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge className="bg-hacktown-cyan/20 text-hacktown-cyan border-hacktown-cyan/30 font-mono">
                          <Users className="h-3 w-3 mr-1" />
                          {venue.capacity}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant="outline"
                          className="border-border text-muted-foreground font-mono"
                        >
                          {slotCount} slot(s)
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 hover:bg-hacktown-pink/20 hover:text-hacktown-pink"
                            onClick={() => handleApplyDefaultSlots(venue.id)}
                            title="Aplicar Horários Padrão"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 hover:bg-hacktown-cyan/20 hover:text-hacktown-cyan"
                            onClick={() => handleEdit(venue)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 hover:bg-destructive/20 text-destructive"
                            onClick={() => handleDelete(venue)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
