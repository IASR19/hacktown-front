import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { formsService } from "@/services/api";
import { SpeakerFormField, SpeakerFormSection } from "@/types/hacktown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PublicConfig = {
  title: string;
  description?: string;
  submissionStartAt?: string;
  submissionEndAt?: string;
  sections: SpeakerFormSection[];
};

type UploadedFileAnswer = {
  dataUrl: string;
  mimeType: string;
  size: number;
  fileName: string;
  width?: number;
  height?: number;
};

async function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result);
    };
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo"));
    reader.readAsDataURL(file);
  });
}

async function adaptImageToSquare(
  file: File,
  targetSize: number,
  acceptedTypes?: string[],
): Promise<UploadedFileAnswer> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Não foi possível ler a imagem"));
      img.src = objectUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = targetSize;
    canvas.height = targetSize;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Não foi possível processar a imagem");
    }

    const scale = Math.max(targetSize / image.width, targetSize / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const offsetX = (targetSize - drawWidth) / 2;
    const offsetY = (targetSize - drawHeight) / 2;

    context.clearRect(0, 0, targetSize, targetSize);
    context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

    const imageTypes = (acceptedTypes || []).filter((type) =>
      type.startsWith("image/"),
    );

    const outputMimeType = imageTypes.includes(file.type)
      ? file.type
      : imageTypes[0] || "image/jpeg";

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (generatedBlob) => {
          if (!generatedBlob) {
            reject(new Error("Falha ao converter imagem"));
            return;
          }
          resolve(generatedBlob);
        },
        outputMimeType,
        0.92,
      );
    });

    const dataUrl = await fileToDataUrl(blob);

    return {
      dataUrl,
      mimeType: outputMimeType,
      size: blob.size,
      fileName: file.name,
      width: targetSize,
      height: targetSize,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function LocalDateInfo({ value }: { value?: string }) {
  if (!value) return null;

  const text = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(value));

  return <span className="text-xs text-muted-foreground">{text}</span>;
}

export default function SpeakerPublicFormPage() {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Hacktown - Inscrição do Speaker";

    return () => {
      document.title = previousTitle;
    };
  }, []);

  const isClosed = useMemo(() => {
    if (!config) return false;
    const now = new Date();

    if (config.submissionStartAt && now < new Date(config.submissionStartAt)) {
      return true;
    }

    if (config.submissionEndAt && now > new Date(config.submissionEndAt)) {
      return true;
    }

    return false;
  }, [config]);

  useEffect(() => {
    const loadPublicConfig = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const publicConfig = await formsService.getSpeakerPublicForm(token);
        setConfig(publicConfig);
      } catch (error) {
        console.error(error);
        toast.error("Formulário não encontrado ou indisponível");
      } finally {
        setLoading(false);
      }
    };

    void loadPublicConfig();
  }, [token]);

  const setAnswer = (key: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handlePhotoUpload = async (
    field: SpeakerFormField,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida");
      return;
    }

    try {
      const payload =
        field.imageSizeHint === "900x900"
          ? await adaptImageToSquare(file, 900, field.fileTypes)
          : {
              dataUrl: await fileToDataUrl(file),
              mimeType: file.type,
              size: file.size,
              fileName: file.name,
            };

      if (
        typeof field.maxFileSize === "number" &&
        payload.size > field.maxFileSize
      ) {
        const maxMb = (field.maxFileSize / (1024 * 1024)).toFixed(1);
        toast.error(`A imagem excede o limite de ${maxMb}MB`);
        return;
      }

      setAnswer(field.id, payload);

      if (field.imageSizeHint === "900x900") {
        toast.success("Imagem ajustada para 900x900 e anexada com sucesso");
      } else {
        toast.success("Foto anexada com sucesso");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível ler a imagem";
      toast.error(message);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!token) {
      toast.error("Link inválido");
      return;
    }

    for (const section of config.sections) {
      for (const field of section.fields) {
        if (field.conditionalVisibility) {
          const dependsValue = answers[field.conditionalVisibility.dependsOn];
          const target = field.conditionalVisibility.value;
          const shouldShow =
            field.conditionalVisibility.operator === "equals"
              ? dependsValue === target
              : field.conditionalVisibility.operator === "not_equals"
                ? dependsValue !== target
                : String(dependsValue ?? "").includes(String(target));

          if (!shouldShow) continue;
        }

        const required = Boolean(field.required || field.validation?.required);
        if (!required) continue;

        const value = answers[field.id];
        const isEmpty =
          value === undefined ||
          value === null ||
          (typeof value === "string" && value.trim() === "") ||
          (Array.isArray(value) && value.length === 0);

        if (isEmpty) {
          toast.error(`Preencha o campo obrigatório: ${field.label}`);
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      await formsService.submitSpeakerPublicForm(token, { answers });
      toast.success("Inscrição enviada com sucesso");
      setAnswers({});
      setSubmittedSuccessfully(true);
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível enviar sua inscrição";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-9 w-9 animate-spin text-hacktown-cyan" />
      </div>
    );
  }

  const toggleMultiOption = (
    fieldId: string,
    option: string,
    checked: boolean,
  ) => {
    const current = Array.isArray(answers[fieldId])
      ? (answers[fieldId] as string[])
      : [];

    const next = checked
      ? [...new Set([...current, option])]
      : current.filter((item) => item !== option);

    setAnswer(fieldId, next);
  };

  const renderField = (field: SpeakerFormField) => {
    const value = answers[field.id];
    const canonicalType =
      field.type === "text"
        ? "short_text"
        : field.type === "textarea"
          ? "long_text"
          : field.type;

    if (canonicalType === "long_text") {
      return (
        <Textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => setAnswer(field.id, e.target.value)}
          placeholder={field.placeholder}
          className="min-h-24"
        />
      );
    }

    if (
      canonicalType === "checkbox" &&
      (!field.options || field.options.length === 0)
    ) {
      return (
        <div className="flex items-center gap-3 pt-1">
          <Checkbox
            checked={Boolean(value)}
            onCheckedChange={(checked) => setAnswer(field.id, Boolean(checked))}
          />
          <span className="text-sm text-muted-foreground">Selecionar</span>
        </div>
      );
    }

    if (
      canonicalType === "multi_checkbox" ||
      (canonicalType === "checkbox" && Array.isArray(field.options))
    ) {
      const selected = Array.isArray(value) ? (value as string[]) : [];

      return (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(field.options || []).map((option) => (
            <label
              key={`${field.id}-${option}`}
              className="flex items-center gap-2 text-sm"
            >
              <Checkbox
                checked={selected.includes(option)}
                onCheckedChange={(checked) =>
                  toggleMultiOption(field.id, option, Boolean(checked))
                }
              />
              {option}
            </label>
          ))}
        </div>
      );
    }

    if (canonicalType === "radio") {
      const selected = typeof value === "string" ? value : "";
      return (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(field.options || []).map((option) => (
            <label
              key={`${field.id}-${option}`}
              className="flex items-center gap-2 text-sm"
            >
              <input
                type="radio"
                name={field.id}
                value={option}
                checked={selected === option}
                onChange={(e) => setAnswer(field.id, e.target.value)}
              />
              {option}
            </label>
          ))}
        </div>
      );
    }

    if (canonicalType === "dropdown") {
      return (
        <Select
          value={typeof value === "string" ? value : ""}
          onValueChange={(selectedValue) => setAnswer(field.id, selectedValue)}
        >
          <SelectTrigger>
            <SelectValue placeholder={field.placeholder || "Selecione"} />
          </SelectTrigger>
          <SelectContent>
            {(field.options || []).map((option) => (
              <SelectItem key={`${field.id}-${option}`} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (canonicalType === "file_upload" || canonicalType === "file_image") {
      const uploaded =
        value && typeof value === "object" && !Array.isArray(value)
          ? (value as UploadedFileAnswer)
          : null;
      const inputId = `upload-${field.id}`;

      return (
        <div className="space-y-2">
          <Input
            id={inputId}
            type="file"
            className="hidden"
            accept={
              field.fileTypes?.length
                ? field.fileTypes.join(",")
                : canonicalType === "file_image"
                  ? "image/*"
                  : undefined
            }
            onChange={(e) => void handlePhotoUpload(field, e)}
          />
          <label
            htmlFor={inputId}
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            {uploaded?.fileName ? "Trocar imagem" : "Selecionar imagem"}
          </label>
          <p className="text-xs text-muted-foreground">
            Envie uma foto em PNG ou JPG. Se necessário, ela será ajustada
            automaticamente para 900x900.
          </p>
          {uploaded?.fileName ? (
            <div className="space-y-2 rounded-md border border-border/60 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">
                Arquivo anexado: {uploaded.fileName}
              </p>
              {uploaded.dataUrl ? (
                <img
                  src={uploaded.dataUrl}
                  alt={`Pré-visualização de ${uploaded.fileName}`}
                  className="h-40 w-40 rounded-md border border-border/60 object-cover"
                />
              ) : null}
              <p className="text-xs text-muted-foreground">
                {uploaded.width && uploaded.height
                  ? `${uploaded.width}x${uploaded.height}px`
                  : "Imagem pronta para envio"}
              </p>
            </div>
          ) : null}
        </div>
      );
    }

    const inputTypeMap: Record<string, string> = {
      short_text: "text",
      text: "text",
      long_text: "text",
      email: "email",
      phone: "tel",
      cpf: "text",
      url: "url",
      date: "date",
      datetime: "datetime-local",
    };

    const inputType = inputTypeMap[field.type] || "text";

    return (
      <Input
        type={inputType}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => setAnswer(field.id, e.target.value)}
        placeholder={field.placeholder}
      />
    );
  };

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-xl glass-strong">
          <CardContent className="pt-6 text-center text-muted-foreground">
            Este formulário não está disponível no momento.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-80px] left-[8%] h-80 w-80 rounded-full bg-hacktown-cyan/20 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[10%] h-96 w-96 rounded-full bg-hacktown-pink/20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-10 md:py-14">
        <div className="mb-6 md:mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-hacktown-cyan/30 bg-hacktown-cyan/10 px-3 py-1 text-xs font-medium text-hacktown-cyan">
            <Sparkles className="h-3.5 w-3.5" />
            HackTown 2025 • Speaker Form
          </div>
          <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
            {config.title}
          </h1>
          {config.description ? (
            <p className="mt-2 text-muted-foreground max-w-2xl">
              {config.description}
            </p>
          ) : null}
          <div className="mt-4 flex flex-col gap-1">
            <LocalDateInfo value={config.submissionStartAt} />
            <LocalDateInfo value={config.submissionEndAt} />
          </div>
        </div>

        <Card className="glass-strong border-border/70 shadow-[0_10px_35px_rgba(0,0,0,0.25)]">
          <CardHeader>
            <CardTitle>Formulário do speaker</CardTitle>
          </CardHeader>
          <CardContent>
            {isClosed ? (
              <div className="rounded-xl border border-amber-300/40 bg-amber-200/10 p-4 text-sm text-amber-700 dark:text-amber-300">
                O período de submissão está fechado neste momento.
              </div>
            ) : submittedSuccessfully ? (
              <div className="rounded-xl border border-hacktown-cyan/40 bg-hacktown-cyan/10 p-5">
                <h3 className="text-lg font-semibold text-foreground">
                  Inscrição recebida com sucesso.
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Obrigado por se inscrever. Em breve a equipe irá retornar com
                  mais informações.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-6">
                  {config.sections.map((section, sectionIndex) => (
                    <div
                      key={section.id}
                      className={`rounded-xl border p-4 md:p-5 space-y-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] ${
                        sectionIndex % 2 === 0
                          ? "border-hacktown-cyan/25 bg-hacktown-cyan/5"
                          : "border-hacktown-pink/25 bg-hacktown-pink/5"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
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
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold tracking-tight">
                          {section.title}
                        </h3>
                        {section.description ? (
                          <p className="text-sm text-muted-foreground mt-1">
                            {section.description}
                          </p>
                        ) : null}
                      </div>

                      <div className="h-px w-full bg-border/60" />

                      <div className="grid gap-4 md:grid-cols-2">
                        {section.fields.map((field, fieldIndex) => {
                          if (field.conditionalVisibility) {
                            const dependsValue =
                              answers[field.conditionalVisibility.dependsOn];
                            const target = field.conditionalVisibility.value;
                            const shouldShow =
                              field.conditionalVisibility.operator === "equals"
                                ? dependsValue === target
                                : field.conditionalVisibility.operator ===
                                    "not_equals"
                                  ? dependsValue !== target
                                  : String(dependsValue ?? "").includes(
                                      String(target),
                                    );

                            if (!shouldShow) return null;
                          }

                          return (
                            <div
                              key={`${section.id}-${field.id}`}
                              className={`space-y-2 rounded-lg border p-3 ${
                                fieldIndex % 2 === 0
                                  ? "border-background/70 bg-background/60"
                                  : "border-background/60 bg-background/80"
                              } ${field.type === "textarea" || field.type === "long_text" || field.type === "multi_checkbox" ? "md:col-span-2" : ""}`}
                            >
                              <Label className="text-sm font-medium leading-snug">
                                {field.label}
                                {field.required ? " *" : ""}
                              </Label>
                              {renderField(field)}
                              {field.helpText ? (
                                <p className="text-xs text-muted-foreground">
                                  {field.helpText}
                                </p>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type="submit"
                  className="w-full md:w-auto"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando inscrição...
                    </>
                  ) : (
                    "Enviar inscrição"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
