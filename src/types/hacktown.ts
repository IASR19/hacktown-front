export type VenueStructureType = 'auditorio' | 'casa' | 'espaco' | 'restaurante_bar' | 'sala';

export const VENUE_STRUCTURE_LABELS: Record<VenueStructureType, string> = {
  auditorio: 'Auditório',
  casa: 'Casa',
  espaco: 'Espaço',
  restaurante_bar: 'Restaurante/Bar',
  sala: 'Sala',
};

export type WeekDay = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo';

export const WEEKDAY_LABELS: Record<WeekDay, string> = {
  segunda: 'Segunda-feira',
  terca: 'Terça-feira',
  quarta: 'Quarta-feira',
  quinta: 'Quinta-feira',
  sexta: 'Sexta-feira',
  sabado: 'Sábado',
  domingo: 'Domingo',
};

export const WEEKDAY_SHORT_LABELS: Record<WeekDay, string> = {
  segunda: 'Seg',
  terca: 'Ter',
  quarta: 'Qua',
  quinta: 'Qui',
  sexta: 'Sex',
  sabado: 'Sáb',
  domingo: 'Dom',
};

export const WEEKDAYS_ORDER: WeekDay[] = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];

export interface EventConfig {
  id: string;
  selectedDays: WeekDay[];
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
