export type VenueStructureType =
  | "restaurante"
  | "sala"
  | "auditorio"
  | "espaco"
  | "casa"
  | "apoio"
  | "palco"
  | "feira"
  | "lounge"
  | "estande"
  | "coworking";

export const VENUE_STRUCTURE_LABELS: Record<VenueStructureType, string> = {
  restaurante: "Restaurante",
  sala: "Sala",
  auditorio: "Auditório",
  espaco: "Espaço",
  casa: "Casa",
  apoio: "Apoio",
  palco: "Palco",
  feira: "Feira",
  lounge: "Lounge",
  estande: "Estande",
  coworking: "Coworking",
};

export type WeekDay =
  | "segunda"
  | "terca"
  | "quarta"
  | "quinta"
  | "sexta"
  | "sabado"
  | "domingo";

export const WEEKDAY_LABELS: Record<WeekDay, string> = {
  segunda: "Segunda-feira",
  terca: "Terça-feira",
  quarta: "Quarta-feira",
  quinta: "Quinta-feira",
  sexta: "Sexta-feira",
  sabado: "Sábado",
  domingo: "Domingo",
};

export const WEEKDAY_SHORT_LABELS: Record<WeekDay, string> = {
  segunda: "Seg",
  terca: "Ter",
  quarta: "Qua",
  quinta: "Qui",
  sexta: "Sex",
  sabado: "Sáb",
  domingo: "Dom",
};

export const WEEKDAYS_ORDER: WeekDay[] = [
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
  "domingo",
];

export type ActivityType = "musica" | "palestra" | "painel" | "workshop";

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  musica: "Música",
  palestra: "Palestra",
  painel: "Painel",
  workshop: "Workshop",
};

export interface VenueDayActivity {
  id: string;
  venueId: string;
  day: WeekDay;
  activityType: ActivityType;
}

export interface EventConfig {
  id: string;
  selectedDays: WeekDay[];
  startDate?: string; // Formato: YYYY-MM-DD
  endDate?: string; // Formato: YYYY-MM-DD
  updatedAt: Date;
}

export interface Venue {
  id: string;
  code: string;
  name: string;
  location: string;
  capacity: number;
  description?: string;
  nucleo?: string;
  structureType?: VenueStructureType;
}

export interface Activity {
  id: string;
  title: string;
  speaker: string;
  description?: string;
}

// Slot template - horário que pode ser replicado em dias específicos
export interface SlotTemplate {
  id: string;
  venueId: string;
  startTime: string;
  endTime: string;
  days?: WeekDay[]; // Se não definido, aplica a todos os dias selecionados
}

// Atividade vinculada a um slot específico em um dia específico
export interface DaySlotActivity {
  id?: number; // Optional for frontend, required from backend
  slotTemplateId: string;
  day: WeekDay;
  activityId?: string; // Used when creating/updating
  activity?: Activity; // Populated by backend with relations
}

// Alias for backwards compatibility
export type Talk = Activity;

// Computed types for display
export interface ComputedSlot {
  slotTemplateId: string;
  venueId: string;
  day: WeekDay;
  startTime: string;
  endTime: string;
  activity?: Activity;
}

export interface VenueWithSlots extends Venue {
  slots: ComputedSlot[];
}

export interface VenueInfrastructure {
  id: number;
  venueId: string;
  alvara: boolean;
  alvaraProvidenciado: boolean;
  avcb: boolean;
  avcbProvidenciado: boolean;
  revisao: boolean;
  revisaoProvidenciada: boolean;
  reforma: boolean;
  reformaProvidenciada: boolean;
  status?: string;
  venue?: {
    id: string;
    code: string;
    name: string;
    nucleo?: string;
    structureType?: string;
  };
}

export interface VenueAudiovisual {
  id: number;
  venueId: string;
  microfone: boolean;
  microfoneProvidenciado: boolean;
  projetor: boolean;
  projetorProvidenciado: boolean;
  caboHdmi: boolean;
  caboHdmiProvidenciado: boolean;
  passadorSlide: boolean;
  passadorSlideProvidenciado: boolean;
  caixaSom: boolean;
  caixaSomProvidenciada: boolean;
  tela: boolean;
  telaProvidenciada: boolean;
  status?: string;
  venue?: {
    id: string;
    code: string;
    name: string;
    nucleo?: string;
    structureType?: string;
  };
}

// ========== VOLUNTEERS & TEAMS ==========

export type VolunteerStatus = "pending" | "approved" | "rejected" | "cancelled";

export const VOLUNTEER_STATUS_LABELS: Record<VolunteerStatus, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  cancelled: "Cancelado",
};

export interface Volunteer {
  id: string;
  fullName: string;
  whatsapp: string;
  email: string;
  cpf: string;
  city: string;
  street: string;
  neighborhood: string;
  houseNumber: string;
  complement?: string;
  birthDate: string;
  status: VolunteerStatus;
  notes?: string;
  isLeader?: boolean;
  createdAt: string;
  updatedAt: string;
  teamMembers?: TeamMember[];
}

export type TeamType = "staff" | "credenciamento" | "posso_ajudar";

export const TEAM_TYPE_LABELS: Record<TeamType, string> = {
  staff: "Staff",
  credenciamento: "Credenciamento",
  posso_ajudar: "Posso Ajudar?",
};

export interface Team {
  id: string;
  name: string;
  types: string; // Comma-separated TeamType values
  notes?: string;
  createdAt: string;
  updatedAt: string;
  members?: TeamMember[];
  venueSlots?: TeamVenueSlot[];
}

export interface TeamMember {
  id: string;
  teamId: string;
  volunteerId: string;
  isLeader: boolean;
  team?: Team;
  volunteer?: Volunteer;
  createdAt: string;
}

export interface TeamVenueSlot {
  id: string;
  teamId: string;
  venueId: string;
  slotTemplateId?: string;
  isDefaultVenue: boolean;
  team?: Team;
  venue?: Venue;
  slotTemplate?: SlotTemplate;
  createdAt: string;
}

// ========== FORMS ==========

export type SpeakerFormFieldType =
  | "short_text"
  | "long_text"
  | "email"
  | "phone"
  | "cpf"
  | "url"
  | "dropdown"
  | "checkbox"
  | "radio"
  | "multi_checkbox"
  | "file_upload"
  | "file_image"
  | "date"
  | "datetime"
  | "text"
  | "textarea";

export interface SpeakerFieldValidation {
  required?: boolean;
  regex?: string;
  regexMessage?: string;
  minLength?: number;
  maxLength?: number;
  validEmail?: boolean;
  validUrl?: boolean;
  validCpf?: boolean;
  phoneFormat?: "BR" | "INTL";
}

export interface SpeakerFieldConditionalVisibility {
  dependsOn: string;
  operator: "equals" | "not_equals" | "contains";
  value: string | boolean;
}

export interface SpeakerFormField {
  id: string;
  label: string;
  type: SpeakerFormFieldType;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
  minLength?: number;
  maxLength?: number;
  fileTypes?: string[];
  maxFileSize?: number;
  validation?: SpeakerFieldValidation;
  conditionalVisibility?: SpeakerFieldConditionalVisibility;
  imageSizeHint?: string;
}

export interface SpeakerFormSection {
  id: string;
  title: string;
  description?: string;
  fields: SpeakerFormField[];
}

export interface SpeakerFormConfig {
  id: string;
  formType: string;
  title: string;
  description?: string;
  publicToken: string;
  isPublished: boolean;
  submissionStartAt?: string;
  submissionEndAt?: string;
  schemaJson: SpeakerFormSection[];
  createdAt: string;
  updatedAt: string;
}

export interface SpeakerFormSubmission {
  id: string;
  configId: string;
  fullName: string;
  cpf: string;
  email: string;
  whatsapp: string;
  preferredName?: string;
  roleSummary?: string;
  companyProject?: string;
  miniBio?: string;
  state?: string;
  city?: string;
  linkedin?: string;
  photoData?: string;
  alreadyParticipatedBefore?: boolean;
  invitedBy?: string;
  availableThursday: boolean;
  availableFriday: boolean;
  availableSaturday: boolean;
  availableSunday: boolean;
  contentTrack?: string;
  activityFormats?: string;
  relevantLinks?: string;
  allowImageDisclosure: boolean;
  addedEmailId?: string;
  hasDefinedTitleAndDescription?: boolean;
  activityDescription?: string;
  activityTitle?: string;
  answersJson?: Record<string, unknown>;
  submittedAt: string;
}

export interface CreateSpeakerFormSubmissionPayload {
  answers: Record<string, unknown>;
}

// Helper to parse team types from comma-separated string
export function parseTeamTypes(types: string): TeamType[] {
  if (!types) return [];
  return types.split(",").filter(Boolean) as TeamType[];
}
