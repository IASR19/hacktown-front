import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Download,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { formsService } from "@/services/api";
import {
  SpeakerFormConfig,
  SpeakerFormField,
  SpeakerFormFieldType,
  SpeakerFormSection,
  SpeakerFormSubmission,
} from "@/types/hacktown";

const FIELD_TYPES: Array<{ value: SpeakerFormFieldType; label: string }> = [
  { value: "short_text", label: "Texto curto" },
  { value: "long_text", label: "Texto longo" },
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Telefone" },
  { value: "cpf", label: "CPF" },
  { value: "url", label: "Link/URL" },
  { value: "dropdown", label: "Seleção única (dropdown)" },
  { value: "radio", label: "Seleção única (radio)" },
  { value: "checkbox", label: "Checkbox" },
  { value: "file_upload", label: "Upload de arquivo" },
  { value: "multi_checkbox", label: "Múltipla escolha" },
  { value: "date", label: "Data" },
  { value: "datetime", label: "Data e hora" },
  { value: "file_image", label: "Upload de imagem" },
  { value: "text", label: "Texto curto (legado)" },
  { value: "textarea", label: "Texto longo (legado)" },
];

function toDateTimeLocal(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function slugifyId(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}

function parseLocalDateTime(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getSubmissionAnswer(
  submission: SpeakerFormSubmission,
  key: string,
): string {
  const answer = submission.answersJson?.[key];
  if (typeof answer === "string") return answer;
  if (Array.isArray(answer))
    return answer.map((item) => String(item)).join(", ");
  if (typeof answer === "boolean") return answer ? "Sim" : "Não";
  return "";
}

function getSubmissionImagePreview(
  submission: SpeakerFormSubmission,
): string | null {
  if (submission.photoData && submission.photoData.trim().length > 0) {
    return submission.photoData;
  }

  const answer = submission.answersJson?.photoData;
  if (typeof answer === "string" && answer.trim().length > 0) {
    return answer;
  }

  if (answer && typeof answer === "object" && !Array.isArray(answer)) {
    const maybeFile = answer as Record<string, unknown>;
    const dataUrl =
      typeof maybeFile.dataUrl === "string" ? maybeFile.dataUrl : "";
    if (dataUrl) {
      return dataUrl;
    }
  }

  return null;
}

function formatAnswerForSpreadsheet(value: unknown): string {
  if (value === null || value === undefined) return "";

  if (typeof value === "string") return value;

  if (typeof value === "number") return String(value);

  if (typeof value === "boolean") return value ? "Sim" : "Não";

  if (Array.isArray(value))
    return value.map((item) => String(item)).join(" | ");

  if (typeof value === "object") {
    const maybeFile = value as Record<string, unknown>;
    const fileName =
      typeof maybeFile.fileName === "string" ? maybeFile.fileName : "";
    if (fileName) return `[arquivo] ${fileName}`;
    return "[objeto]";
  }

  return String(value);
}

function parseOptionsText(input: string): string[] {
  return input
    .split(/[\n,]/)
    .map((option) => option.trim())
    .filter(Boolean);
}

export default function FormsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SpeakerFormConfig | null>(null);
  const [submissions, setSubmissions] = useState<SpeakerFormSubmission[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submissionStartAt, setSubmissionStartAt] = useState("");
  const [submissionEndAt, setSubmissionEndAt] = useState("");
  const [sections, setSections] = useState<SpeakerFormSection[]>([]);
  const [optionsDraft, setOptionsDraft] = useState<Record<string, string>>({});
  const [selectedImagePreview, setSelectedImagePreview] = useState<
    string | null
  >(null);

  const publicLink = useMemo(() => {
    if (!config?.publicToken) return "";
    return `${window.location.origin}/forms/speaker/${config.publicToken}`;
  }, [config?.publicToken]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [configData, submissionsData] = await Promise.all([
        formsService.getSpeakerConfig(),
        formsService.listSpeakerSubmissions(),
      ]);

      setConfig(configData);
      setSubmissions(submissionsData);
      setTitle(configData.title || "");
      setDescription(configData.description || "");
      setSubmissionStartAt(toDateTimeLocal(configData.submissionStartAt));
      setSubmissionEndAt(toDateTimeLocal(configData.submissionEndAt));
      setSections(configData.schemaJson || []);
      setOptionsDraft({});
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar dados do formulário");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await formsService.updateSpeakerConfig({
        title,
        description,
        submissionStartAt: submissionStartAt
          ? new Date(submissionStartAt).toISOString()
          : null,
        submissionEndAt: submissionEndAt
          ? new Date(submissionEndAt).toISOString()
          : null,
        sections,
      });
      setConfig(updated);
      toast.success("Configuração salva");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar configuração");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublished = async () => {
    if (!config) return;

    const isPublishing = !config.isPublished;
    if (isPublishing) {
      const start = parseLocalDateTime(submissionStartAt);
      const end = parseLocalDateTime(submissionEndAt);
      const now = new Date();

      if (!start || !end) {
        toast.error(
          "Defina início e fim das submissões para publicar o link público",
        );
        return;
      }

      if (start > end) {
        toast.error(
          "A data de início não pode ser maior que a de encerramento",
        );
        return;
      }

      if (now < start || now > end) {
        toast.error(
          "Só é possível publicar o link público dentro da vigência estipulada",
        );
        return;
      }
    }

    try {
      setSaving(true);
      const updated = await formsService.updateSpeakerConfig({
        isPublished: !config.isPublished,
      });
      setConfig(updated);
      toast.success(
        updated.isPublished
          ? "Formulário publicado com sucesso"
          : "Formulário despublicado",
      );
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível alterar a publicação");
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateLink = async () => {
    const start = parseLocalDateTime(submissionStartAt);
    const end = parseLocalDateTime(submissionEndAt);
    const now = new Date();

    if (!start || !end) {
      toast.error(
        "Defina início e fim das submissões para gerar o link público",
      );
      return;
    }

    if (start > end) {
      toast.error("A data de início não pode ser maior que a de encerramento");
      return;
    }

    if (now < start || now > end) {
      toast.error(
        "Só é possível gerar o link público dentro da vigência estipulada",
      );
      return;
    }

    try {
      setSaving(true);
      const updated = await formsService.regenerateSpeakerPublicLink();
      setConfig(updated);
      toast.success("Link público regenerado");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao regenerar link");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefault = async () => {
    try {
      setSaving(true);
      const updated = await formsService.resetSpeakerDefault();
      setConfig(updated);
      setTitle(updated.title || "");
      setDescription(updated.description || "");
      setSubmissionStartAt(toDateTimeLocal(updated.submissionStartAt));
      setSubmissionEndAt(toDateTimeLocal(updated.submissionEndAt));
      setSections(updated.schemaJson || []);
      setOptionsDraft({});
      toast.success("Formulário padrão restaurado");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao restaurar formulário padrão");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = async () => {
    if (!publicLink) return;
    try {
      await navigator.clipboard.writeText(publicLink);
      toast.success("Link copiado");
    } catch {
      toast.error("Não foi possível copiar o link");
    }
  };

  const addSection = () => {
    const newSection: SpeakerFormSection = {
      id: `sec-${Date.now()}`,
      title: "Nova seção",
      description: "",
      fields: [],
    };

    setSections((prev) => [...prev, newSection]);
  };

  const updateSection = (
    sectionId: string,
    patch: Partial<SpeakerFormSection>,
  ) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section,
      ),
    );
  };

  const removeSection = (sectionId: string) => {
    setSections((prev) => prev.filter((section) => section.id !== sectionId));
  };

  const moveSection = (sectionId: string, direction: -1 | 1) => {
    setSections((prev) => {
      const index = prev.findIndex((section) => section.id === sectionId);
      const target = index + direction;

      if (index < 0 || target < 0 || target >= prev.length) return prev;

      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  };

  const addField = (sectionId: string) => {
    const newField: SpeakerFormField = {
      id: `field-${Date.now()}`,
      label: "Novo campo",
      type: "short_text",
      required: false,
      placeholder: "",
      helpText: "",
      options: [],
    };

    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? { ...section, fields: [...section.fields, newField] }
          : section,
      ),
    );
  };

  const updateField = (
    sectionId: string,
    fieldId: string,
    patch: Partial<SpeakerFormField>,
  ) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;

        return {
          ...section,
          fields: section.fields.map((field) =>
            field.id === fieldId ? { ...field, ...patch } : field,
          ),
        };
      }),
    );
  };

  const removeField = (sectionId: string, fieldId: string) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;

        return {
          ...section,
          fields: section.fields.filter((field) => field.id !== fieldId),
        };
      }),
    );
  };

  const moveField = (sectionId: string, fieldId: string, direction: -1 | 1) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;

        const index = section.fields.findIndex((field) => field.id === fieldId);
        const target = index + direction;

        if (index < 0 || target < 0 || target >= section.fields.length) {
          return section;
        }

        const fields = [...section.fields];
        [fields[index], fields[target]] = [fields[target], fields[index]];

        return {
          ...section,
          fields,
        };
      }),
    );
  };

  const handleExportExcel = async () => {
    try {
      const dynamicFields = (config?.schemaJson || []).flatMap((section) =>
        (section.fields || []).map((field) => ({
          id: field.id,
          label: field.label,
        })),
      );

      const rows = submissions.map((submission) => {
        const row: Record<string, string> = {
          "Data/Hora": formatDateTime(submission.submittedAt),
          Nome:
            submission.fullName ||
            getSubmissionAnswer(submission, "fullName") ||
            "",
          "E-mail":
            submission.email || getSubmissionAnswer(submission, "email") || "",
          WhatsApp:
            submission.whatsapp ||
            getSubmissionAnswer(submission, "whatsapp") ||
            "",
          "Título da atividade":
            submission.activityTitle ||
            getSubmissionAnswer(submission, "activityTitle") ||
            "",
        };

        for (const field of dynamicFields) {
          const answerValue = submission.answersJson?.[field.id];
          row[field.label] = formatAnswerForSpreadsheet(answerValue);
        }

        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Submissoes");

      const filename = `speaker-submissoes-${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, filename);

      toast.success("Exportação em Excel concluída");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao exportar para Excel");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-hacktown-cyan" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Formulários</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crie e gerencie formulários públicos para coleta de inscrições.
          </p>
        </div>
      </div>

      <Tabs defaultValue="speaker-form" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2 glass-strong border border-border/70">
          <TabsTrigger value="speaker-form">Formulário do speaker</TabsTrigger>
          <TabsTrigger value="speaker-submissions">
            <span className="flex items-center gap-2">
              Submissões recebidas
              <span className="inline-flex min-w-6 items-center justify-center rounded-full border border-border/70 px-2 py-0.5 text-xs font-medium">
                {submissions.length}
              </span>
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="speaker-form" className="space-y-4">
          <Card className="glass border-border/60 shadow-[0_10px_35px_rgba(0,0,0,0.22)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Configuração do Formulário
                <Badge
                  variant={config?.isPublished ? "default" : "secondary"}
                  className={config?.isPublished ? "bg-hacktown-green/90" : ""}
                >
                  {config?.isPublished ? "Publicado" : "Rascunho"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-border/70 bg-background/35 p-4 space-y-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Dados gerais
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="speaker-title">Título</Label>
                    <Input
                      id="speaker-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="speaker-description">Descrição</Label>
                    <Textarea
                      id="speaker-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-24"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-background/35 p-4 space-y-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Vigência de submissão
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="start-at">Início das submissões</Label>
                    <Input
                      id="start-at"
                      type="datetime-local"
                      value={submissionStartAt}
                      onChange={(e) => setSubmissionStartAt(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end-at">Fim das submissões</Label>
                    <Input
                      id="end-at"
                      type="datetime-local"
                      value={submissionEndAt}
                      onChange={(e) => setSubmissionEndAt(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-border/70 bg-background/35 p-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Estrutura do formulário</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSection}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Seção
                  </Button>
                </div>

                {sections.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                    Nenhuma seção criada. Clique em "Seção" para começar.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sections.map((section, sectionIndex) => (
                      <div
                        key={section.id}
                        className={`rounded-xl border p-4 space-y-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] ${
                          sectionIndex % 2 === 0
                            ? "border-hacktown-cyan/25 bg-hacktown-cyan/5"
                            : "border-hacktown-pink/25 bg-hacktown-pink/5"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                              sectionIndex % 2 === 0
                                ? "border border-hacktown-cyan/30 bg-hacktown-cyan/10 text-hacktown-cyan"
                                : "border border-hacktown-pink/30 bg-hacktown-pink/10 text-hacktown-pink"
                            }`}
                          >
                            Seção {sectionIndex + 1}
                          </span>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Título da seção</Label>
                            <Input
                              value={section.title}
                              onChange={(e) => {
                                const titleValue = e.target.value;
                                updateSection(section.id, {
                                  title: titleValue,
                                  id: section.id.startsWith("sec-")
                                    ? `sec-${slugifyId(titleValue) || sectionIndex + 1}`
                                    : section.id,
                                });
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>ID da seção</Label>
                            <Input
                              value={section.id}
                              onChange={(e) =>
                                updateSection(section.id, {
                                  id: slugifyId(e.target.value) || section.id,
                                })
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Descrição da seção</Label>
                          <Textarea
                            value={section.description || ""}
                            onChange={(e) =>
                              updateSection(section.id, {
                                description: e.target.value,
                              })
                            }
                            className="min-h-16"
                          />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => moveSection(section.id, -1)}
                          >
                            <ArrowUp className="h-4 w-4 mr-1" /> Subir seção
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => moveSection(section.id, 1)}
                          >
                            <ArrowDown className="h-4 w-4 mr-1" /> Descer seção
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => addField(section.id)}
                          >
                            <Plus className="h-4 w-4 mr-1" /> Campo
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => removeSection(section.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Remover seção
                          </Button>
                        </div>

                        <div className="space-y-3">
                          {section.fields.map((field, fieldIndex) => (
                            <div
                              key={`${section.id}-${field.id}-${fieldIndex}`}
                              className={`rounded-lg border p-3 space-y-3 ${
                                fieldIndex % 2 === 0
                                  ? "border-background/70 bg-background/55"
                                  : "border-background/60 bg-background/75"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                  Campo {fieldIndex + 1}
                                </span>
                              </div>

                              <div className="grid gap-3 md:grid-cols-2">
                                <div className="space-y-2 md:col-span-2">
                                  <Label>Pergunta</Label>
                                  <Input
                                    value={field.label}
                                    onChange={(e) =>
                                      updateField(section.id, field.id, {
                                        label: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>ID do campo</Label>
                                  <Input
                                    value={field.id}
                                    onChange={(e) =>
                                      updateField(section.id, field.id, {
                                        id:
                                          slugifyId(e.target.value) || field.id,
                                      })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Tipo</Label>
                                  <Select
                                    value={field.type}
                                    onValueChange={(value) =>
                                      updateField(section.id, field.id, {
                                        type: value as SpeakerFormFieldType,
                                      })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {FIELD_TYPES.map((type) => (
                                        <SelectItem
                                          key={type.value}
                                          value={type.value}
                                        >
                                          {type.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                  <Label>Placeholder</Label>
                                  <Input
                                    value={field.placeholder || ""}
                                    onChange={(e) =>
                                      updateField(section.id, field.id, {
                                        placeholder: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                  <Label>Ajuda</Label>
                                  <Input
                                    value={field.helpText || ""}
                                    onChange={(e) =>
                                      updateField(section.id, field.id, {
                                        helpText: e.target.value,
                                      })
                                    }
                                  />
                                </div>

                                {(field.type === "multi_checkbox" ||
                                  field.type === "dropdown" ||
                                  field.type === "radio" ||
                                  field.type === "checkbox") && (
                                  <div className="space-y-2 md:col-span-2">
                                    <Label>
                                      Opções (separe por vírgula ou Enter)
                                    </Label>
                                    <Textarea
                                      value={
                                        optionsDraft[
                                          `${section.id}:${field.id}`
                                        ] ?? (field.options || []).join("\n")
                                      }
                                      onChange={(e) => {
                                        const nextRaw = e.target.value;
                                        const draftKey = `${section.id}:${field.id}`;

                                        setOptionsDraft((prev) => ({
                                          ...prev,
                                          [draftKey]: nextRaw,
                                        }));

                                        updateField(section.id, field.id, {
                                          options: parseOptionsText(nextRaw),
                                        });
                                      }}
                                      className="min-h-16"
                                    />
                                  </div>
                                )}

                                {field.type === "file_image" && (
                                  <div className="space-y-2 md:col-span-2">
                                    <Label>Tamanho sugerido da imagem</Label>
                                    <Input
                                      value={field.imageSizeHint || ""}
                                      onChange={(e) =>
                                        updateField(section.id, field.id, {
                                          imageSizeHint: e.target.value,
                                        })
                                      }
                                      placeholder="Ex.: 900x900"
                                    />
                                  </div>
                                )}

                                {(field.type === "file_upload" ||
                                  field.type === "file_image") && (
                                  <>
                                    <div className="space-y-2">
                                      <Label>Tipos de arquivo (vírgula)</Label>
                                      <Input
                                        value={(field.fileTypes || []).join(
                                          ", ",
                                        )}
                                        onChange={(e) =>
                                          updateField(section.id, field.id, {
                                            fileTypes: e.target.value
                                              .split(",")
                                              .map((value) => value.trim())
                                              .filter(Boolean),
                                          })
                                        }
                                        placeholder="image/jpeg, image/png"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Tamanho máximo (bytes)</Label>
                                      <Input
                                        type="number"
                                        value={field.maxFileSize ?? ""}
                                        onChange={(e) =>
                                          updateField(section.id, field.id, {
                                            maxFileSize: e.target.value
                                              ? Number(e.target.value)
                                              : undefined,
                                          })
                                        }
                                      />
                                    </div>
                                  </>
                                )}

                                <div className="space-y-2">
                                  <Label>Min caracteres</Label>
                                  <Input
                                    type="number"
                                    value={field.minLength ?? ""}
                                    onChange={(e) =>
                                      updateField(section.id, field.id, {
                                        minLength: e.target.value
                                          ? Number(e.target.value)
                                          : undefined,
                                      })
                                    }
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Max caracteres</Label>
                                  <Input
                                    type="number"
                                    value={field.maxLength ?? ""}
                                    onChange={(e) =>
                                      updateField(section.id, field.id, {
                                        maxLength: e.target.value
                                          ? Number(e.target.value)
                                          : undefined,
                                      })
                                    }
                                  />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                  <Label>Regex de validação (opcional)</Label>
                                  <Input
                                    value={field.validation?.regex || ""}
                                    onChange={(e) =>
                                      updateField(section.id, field.id, {
                                        validation: {
                                          ...(field.validation || {}),
                                          regex: e.target.value || undefined,
                                        },
                                      })
                                    }
                                  />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                  <Label>Mensagem de erro regex</Label>
                                  <Input
                                    value={field.validation?.regexMessage || ""}
                                    onChange={(e) =>
                                      updateField(section.id, field.id, {
                                        validation: {
                                          ...(field.validation || {}),
                                          regexMessage:
                                            e.target.value || undefined,
                                        },
                                      })
                                    }
                                  />
                                </div>

                                <div className="flex items-center gap-2 md:col-span-2">
                                  <Checkbox
                                    checked={Boolean(field.required)}
                                    onCheckedChange={(checked) =>
                                      updateField(section.id, field.id, {
                                        required: Boolean(checked),
                                      })
                                    }
                                  />
                                  <span className="text-sm text-muted-foreground">
                                    Campo obrigatório
                                  </span>
                                </div>
                              </div>

                              <div className="h-px w-full bg-border/60" />

                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    moveField(section.id, field.id, -1)
                                  }
                                >
                                  <ArrowUp className="h-4 w-4 mr-1" /> Subir
                                </Button>

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    moveField(section.id, field.id, 1)
                                  }
                                >
                                  <ArrowDown className="h-4 w-4 mr-1" />
                                  Descer
                                </Button>

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    removeField(section.id, field.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4 mr-1" /> Remover
                                  campo
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-border/70 bg-background/35 p-4">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Link público
                </Label>
                <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
                  <div className="flex-1 rounded-lg bg-background/60 p-2 text-xs md:text-sm break-all">
                    {publicLink}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                    >
                      <Copy className="h-4 w-4 mr-1" /> Copiar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerateLink}
                      disabled={saving}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" /> Regenerar
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 rounded-xl border border-border/70 bg-background/35 p-3">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" /> Salvar configuração
                </Button>
                <Button
                  variant="outline"
                  onClick={handleResetDefault}
                  disabled={saving}
                >
                  <RotateCcw className="h-4 w-4 mr-2" /> Restaurar padrão
                </Button>
                <Button
                  variant={config?.isPublished ? "outline" : "default"}
                  onClick={handleTogglePublished}
                  disabled={saving}
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  {config?.isPublished ? "Despublicar" : "Publicar formulário"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="speaker-submissions" className="space-y-4">
          <Card className="glass border-border/60">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>
                  Submissões recebidas ({submissions.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={loadData}>
                    <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportExcel}
                  >
                    <Download className="h-4 w-4 mr-1" /> Exportar Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border border-border/60">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Imagem anexada</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>Título da atividade</TableHead>
                      <TableHead>Data/Hora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-muted-foreground"
                        >
                          Nenhuma submissão até o momento.
                        </TableCell>
                      </TableRow>
                    ) : (
                      submissions.map((submission) => {
                        const imagePreview =
                          getSubmissionImagePreview(submission);

                        return (
                          <TableRow key={submission.id}>
                            <TableCell>
                              {imagePreview ? (
                                <button
                                  type="button"
                                  className="rounded-md border border-border/60 p-0.5 transition hover:border-hacktown-cyan/60"
                                  onClick={() =>
                                    setSelectedImagePreview(imagePreview)
                                  }
                                >
                                  <img
                                    src={imagePreview}
                                    alt="Imagem anexada"
                                    className="h-12 w-12 rounded object-cover"
                                  />
                                </button>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell>
                              {submission.fullName ||
                                getSubmissionAnswer(submission, "fullName") ||
                                "-"}
                            </TableCell>
                            <TableCell>
                              {submission.email ||
                                getSubmissionAnswer(submission, "email") ||
                                "-"}
                            </TableCell>
                            <TableCell>
                              {submission.whatsapp ||
                                getSubmissionAnswer(submission, "whatsapp") ||
                                "-"}
                            </TableCell>
                            <TableCell>
                              {submission.activityTitle ||
                                getSubmissionAnswer(
                                  submission,
                                  "activityTitle",
                                ) ||
                                "-"}
                            </TableCell>
                            <TableCell>
                              {formatDateTime(submission.submittedAt)}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={Boolean(selectedImagePreview)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedImagePreview(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl border border-border/70 bg-background/95">
          <DialogHeader>
            <DialogTitle>Imagem anexada</DialogTitle>
          </DialogHeader>
          {selectedImagePreview ? (
            <div className="flex items-center justify-center rounded-lg border border-border/60 bg-background/70 p-3">
              <img
                src={selectedImagePreview}
                alt="Visualização ampliada"
                className="max-h-[70vh] w-auto max-w-full rounded-md object-contain"
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
