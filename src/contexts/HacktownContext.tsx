import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Venue, 
  SlotTemplate, 
  DaySlotActivity, 
  Activity, 
  VenueWithSlots, 
  ComputedSlot,
  WeekDay,
  WEEKDAYS_ORDER
} from '@/types/hacktown';
import { 
  venuesService, 
  activitiesService, 
  slotTemplatesService, 
  daySlotActivitiesService,
  eventConfigService
} from '@/services/api';

interface HacktownContextType {
  // Loading state
  isLoading: boolean;
  
  // Event days
  selectedDays: WeekDay[];
  setSelectedDays: (days: WeekDay[]) => void;
  
  // Venues
  venues: Venue[];
  addVenue: (venue: Omit<Venue, 'id'>) => void;
  updateVenue: (id: string, venue: Omit<Venue, 'id'>) => void;
  deleteVenue: (id: string) => void;
  
  // Slot templates (replicated across all selected days)
  slotTemplates: SlotTemplate[];
  addSlotTemplate: (slot: Omit<SlotTemplate, 'id'>) => void;
  updateSlotTemplate: (id: string, slot: Omit<SlotTemplate, 'id'>) => void;
  deleteSlotTemplate: (id: string) => void;
  
  // Day-specific activities
  daySlotActivities: DaySlotActivity[];
  addActivityToSlot: (slotTemplateId: string, day: WeekDay, activity: Omit<Activity, 'id'>) => void;
  updateActivityInSlot: (slotTemplateId: string, day: WeekDay, activity: Omit<Activity, 'id'>) => void;
  removeActivityFromSlot: (slotTemplateId: string, day: WeekDay) => void;
  
  // Computed data
  getVenuesWithSlots: (filterDay?: WeekDay) => VenueWithSlots[];
  getSlotsByDay: (day: WeekDay) => ComputedSlot[];
  getAllComputedSlots: () => ComputedSlot[];
}

const HacktownContext = createContext<HacktownContextType | undefined>(undefined);


export function HacktownProvider({ children }: { children: ReactNode }) {
  const [selectedDays, setSelectedDaysState] = useState<WeekDay[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [slotTemplates, setSlotTemplates] = useState<SlotTemplate[]>([]);
  const [daySlotActivities, setDaySlotActivities] = useState<DaySlotActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from API on mount
  useEffect(() => {
    const loadData = async () => {
      // Não carregar se não houver token (usuário não autenticado)
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔄 Carregando dados da API...');
        setIsLoading(true);
        
        console.log('📡 Fazendo requisição para event-config...');
        const configData = await eventConfigService.getConfig();
        console.log('✅ Event config recebido:', configData);
        
        const [venuesData, templatesData, activitiesData] = await Promise.all([
          venuesService.getAll(),
          slotTemplatesService.getAll(),
          daySlotActivitiesService.getAll(),
        ]);
        
        console.log('✅ Dados carregados:', {
          venues: venuesData.length,
          templates: templatesData.length,
          activities: activitiesData.length,
          selectedDays: configData.selectedDays
        });
        
        setVenues(venuesData);
        setSlotTemplates(templatesData);
        setDaySlotActivities(activitiesData);
        setSelectedDaysState(configData.selectedDays || []);
        
        console.log('🎯 Estado atualizado com dias:', configData.selectedDays);
      } catch (error) {
        console.error('❌ Falha ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save selected days to backend
  useEffect(() => {
    if (!isLoading && selectedDays.length > 0) {
      const saveDays = async () => {
        try {
          await eventConfigService.updateConfig(selectedDays);
          console.log('💾 Dias salvos no backend:', selectedDays);
        } catch (error) {
          console.error('❌ Erro ao salvar dias:', error);
        }
      };
      saveDays();
    }
  }, [selectedDays, isLoading]);

  const setSelectedDays = (days: WeekDay[]) => {
    console.log('💾 Salvando dias selecionados:', days);
    
    // Sort days according to week order
    const sortedDays = [...days].sort((a, b) => 
      WEEKDAYS_ORDER.indexOf(a) - WEEKDAYS_ORDER.indexOf(b)
    );
    setSelectedDaysState(sortedDays);
    
    // Remove activities from days that are no longer selected
    setDaySlotActivities(prev => prev.filter(dsa => sortedDays.includes(dsa.day)));
  };

  // Venues
  const addVenue = async (venue: Omit<Venue, 'id'>) => {
    try {
      const newVenue = await venuesService.create(venue);
      setVenues(prev => [...prev, newVenue]);
    } catch (error) {
      console.error('Failed to create venue:', error);
      throw error;
    }
  };

  const updateVenue = async (id: string, venue: Omit<Venue, 'id'>) => {
    try {
      const updatedVenue = await venuesService.update(id, venue);
      setVenues(prev => prev.map(v => v.id === id ? updatedVenue : v));
    } catch (error) {
      console.error('Failed to update venue:', error);
      throw error;
    }
  };

  const deleteVenue = async (id: string) => {
    try {
      await venuesService.delete(id);
      setVenues(prev => prev.filter(v => v.id !== id));
      
      // Delete all slot templates for this venue
      const templateIds = slotTemplates.filter(s => s.venueId === id).map(s => s.id);
      for (const templateId of templateIds) {
        await slotTemplatesService.delete(templateId);
      }
      setSlotTemplates(prev => prev.filter(s => s.venueId !== id));
      
      // Activities will be cascade deleted by backend
      setDaySlotActivities(prev => prev.filter(dsa => !templateIds.includes(dsa.slotTemplateId)));
    } catch (error) {
      console.error('Failed to delete venue:', error);
      throw error;
    }
  };

  // Slot Templates
  const addSlotTemplate = async (slot: Omit<SlotTemplate, 'id'>) => {
    try {
      const newSlot = await slotTemplatesService.create(slot);
      setSlotTemplates(prev => [...prev, newSlot]);
    } catch (error) {
      console.error('Failed to create slot template:', error);
      throw error;
    }
  };

  const updateSlotTemplate = async (id: string, slot: Omit<SlotTemplate, 'id'>) => {
    try {
      const updatedSlot = await slotTemplatesService.update(id, slot);
      setSlotTemplates(prev => prev.map(s => s.id === id ? updatedSlot : s));
    } catch (error) {
      console.error('Failed to update slot template:', error);
      throw error;
    }
  };

  const deleteSlotTemplate = async (id: string) => {
    try {
      await slotTemplatesService.delete(id);
      setSlotTemplates(prev => prev.filter(s => s.id !== id));
      
      // Activities will be cascade deleted by backend
      setDaySlotActivities(prev => prev.filter(dsa => dsa.slotTemplateId !== id));
    } catch (error) {
      console.error('Failed to delete slot template:', error);
      throw error;
    }
  };

  // Day-specific activities
  const addActivityToSlot = async (slotTemplateId: string, day: WeekDay, activity: Omit<Activity, 'id'>) => {
    try {
      // First, create the activity
      const newActivity = await activitiesService.create(activity);
      
      // Check if there's already a day slot activity for this slot and day
      const existing = daySlotActivities.find(
        dsa => dsa.slotTemplateId === slotTemplateId && dsa.day === day
      );

      if (existing?.id) {
        // Update existing
        const updated = await daySlotActivitiesService.update(existing.id, {
          activityId: newActivity.id,
        });
        setDaySlotActivities(prev => prev.map(dsa => 
          dsa.id === existing.id ? updated : dsa
        ));
      } else {
        // Create new
        const newDaySlot = await daySlotActivitiesService.create({
          slotTemplateId,
          day,
          activityId: newActivity.id,
        });
        setDaySlotActivities(prev => [
          ...prev.filter(dsa => !(dsa.slotTemplateId === slotTemplateId && dsa.day === day)),
          newDaySlot
        ]);
      }
    } catch (error) {
      console.error('Failed to add activity to slot:', error);
      throw error;
    }
  };

  const updateActivityInSlot = async (slotTemplateId: string, day: WeekDay, activity: Omit<Activity, 'id'>) => {
    try {
      const existing = daySlotActivities.find(
        dsa => dsa.slotTemplateId === slotTemplateId && dsa.day === day
      );

      if (existing?.activity?.id) {
        // Update the activity itself
        await activitiesService.update(existing.activity.id, activity);
        
        setDaySlotActivities(prev => prev.map(dsa => {
          if (dsa.slotTemplateId === slotTemplateId && dsa.day === day && dsa.activity) {
            return { ...dsa, activity: { ...activity, id: dsa.activity.id } };
          }
          return dsa;
        }));
      }
    } catch (error) {
      console.error('Failed to update activity in slot:', error);
      throw error;
    }
  };

  const removeActivityFromSlot = async (slotTemplateId: string, day: WeekDay) => {
    try {
      const existing = daySlotActivities.find(
        dsa => dsa.slotTemplateId === slotTemplateId && dsa.day === day
      );

      if (existing?.id) {
        await daySlotActivitiesService.delete(existing.id);
        setDaySlotActivities(prev => prev.filter(
          dsa => !(dsa.slotTemplateId === slotTemplateId && dsa.day === day)
        ));
      }
    } catch (error) {
      console.error('Failed to remove activity from slot:', error);
      throw error;
    }
  };

  // Computed data
  const getAllComputedSlots = (): ComputedSlot[] => {
    const slots: ComputedSlot[] = [];
    
    slotTemplates.forEach(template => {
      // Se o template tem dias específicos, usa esses; senão usa todos os dias selecionados
      const daysToUse = template.days && template.days.length > 0 
        ? template.days.filter(d => selectedDays.includes(d))
        : selectedDays;
      
      daysToUse.forEach(day => {
        const dayActivity = daySlotActivities.find(
          dsa => dsa.slotTemplateId === template.id && dsa.day === day
        );
        
        slots.push({
          slotTemplateId: template.id,
          venueId: template.venueId,
          day,
          startTime: template.startTime,
          endTime: template.endTime,
          activity: dayActivity?.activity,
        });
      });
    });
    
    return slots;
  };

  const getSlotsByDay = (day: WeekDay): ComputedSlot[] => {
    return getAllComputedSlots().filter(slot => slot.day === day);
  };

  const getVenuesWithSlots = (filterDay?: WeekDay): VenueWithSlots[] => {
    const allSlots = filterDay ? getSlotsByDay(filterDay) : getAllComputedSlots();
    
    return venues.map(venue => ({
      ...venue,
      slots: allSlots
        .filter(s => s.venueId === venue.id)
        .sort((a, b) => {
          const dayCompare = WEEKDAYS_ORDER.indexOf(a.day) - WEEKDAYS_ORDER.indexOf(b.day);
          if (dayCompare !== 0) return dayCompare;
          return a.startTime.localeCompare(b.startTime);
        })
    }));
  };

  return (
    <HacktownContext.Provider value={{
      isLoading,
      selectedDays,
      setSelectedDays,
      venues,
      addVenue,
      updateVenue,
      deleteVenue,
      slotTemplates,
      addSlotTemplate,
      updateSlotTemplate,
      deleteSlotTemplate,
      daySlotActivities,
      addActivityToSlot,
      updateActivityInSlot,
      removeActivityFromSlot,
      getVenuesWithSlots,
      getSlotsByDay,
      getAllComputedSlots,
    }}>
      {children}
    </HacktownContext.Provider>
  );
}

export function useHacktown() {
  const context = useContext(HacktownContext);
  if (!context) {
    throw new Error('useHacktown must be used within a HacktownProvider');
  }
  return context;
}
