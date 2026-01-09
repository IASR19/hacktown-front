import { useState } from 'react';
import { useHacktown } from '@/contexts/HacktownContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mic2, Clock, MapPin, Plus, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { WeekDay, WEEKDAY_LABELS, WEEKDAY_SHORT_LABELS, ComputedSlot } from '@/types/hacktown';

export default function Talks() {
  const { 
    venues, 
    selectedDays,
    slotTemplates,
    daySlotActivities,
    addActivityToSlot, 
    removeActivityFromSlot, 
    getAllComputedSlots 
  } = useHacktown();
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ComputedSlot | null>(null);
  const [filterDay, setFilterDay] = useState<WeekDay | 'all'>('all');
  const [formData, setFormData] = useState({
    title: '',
    speaker: '',
    description: '',
  });

  const allSlots = getAllComputedSlots();
  const filteredSlots = filterDay === 'all' 
    ? allSlots 
    : allSlots.filter(s => s.day === filterDay);
  
  const availableSlots = filteredSlots.filter(s => !s.activity);
  const slotsWithActivities = filteredSlots.filter(s => s.activity);

  const getVenueName = (venueId: string) => {
    return venues.find(v => v.id === venueId)?.name || 'Venue desconhecido';
  };

  const resetForm = () => {
    setFormData({ title: '', speaker: '', description: '' });
    setSelectedSlot(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) resetForm();
  };

  const handleAddActivity = (slot: ComputedSlot) => {
    setSelectedSlot(slot);
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.speaker || !selectedSlot) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    addActivityToSlot(selectedSlot.slotTemplateId, selectedSlot.day, {
      title: formData.title,
      speaker: formData.speaker,
      description: formData.description || undefined,
    });

    toast.success('Atividade adicionada!');
    handleOpenChange(false);
  };

  const handleRemoveActivity = (slot: ComputedSlot) => {
    removeActivityFromSlot(slot.slotTemplateId, slot.day);
    toast.success('Atividade removida!');
  };

  if (selectedDays.length === 0) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold gradient-text">Atividades</h1>
          <p className="text-muted-foreground text-lg">Adicione atividades aos slots disponíveis</p>
        </div>
        <Card className="glass border-dashed border-2 border-amber-500/30">
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-amber-400" />
            <p className="text-amber-400 text-lg">Selecione os dias do evento primeiro</p>
            <p className="text-sm text-muted-foreground mt-1">Acesse a aba "Dias" para configurar</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold gradient-text">Atividades</h1>
          <p className="text-muted-foreground text-lg">Adicione atividades aos slots disponíveis</p>
        </div>
        
        {/* Day Filter */}
        <div className="flex items-center gap-2">
          <Label className="text-muted-foreground">Filtrar por dia:</Label>
          <Select value={filterDay} onValueChange={(v) => setFilterDay(v as WeekDay | 'all')}>
            <SelectTrigger className="w-[180px] bg-muted/50 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-strong border-border">
              <SelectItem value="all">Todos os dias</SelectItem>
              {selectedDays.map(day => (
                <SelectItem key={day} value={day}>{WEEKDAY_LABELS[day]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Available Slots */}
      <Card className="glass overflow-hidden">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-hacktown-cyan/20">
              <Clock className="h-5 w-5 text-hacktown-cyan" />
            </div>
            Slots Disponíveis
            <Badge className="ml-2 bg-hacktown-cyan/20 text-hacktown-cyan border-hacktown-cyan/30 font-mono">
              {availableSlots.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          {availableSlots.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-border rounded-xl">
              <p className="text-muted-foreground">
                {slotTemplates.length === 0 
                  ? 'Nenhum slot cadastrado. Crie slots primeiro.' 
                  : 'Todos os slots já têm atividades atribuídas!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableSlots.map((slot, index) => (
                <div
                  key={`${slot.slotTemplateId}-${slot.day}`}
                  className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-hacktown-cyan/40 bg-hacktown-cyan/5 hover:bg-hacktown-cyan/10 transition-all group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="slot-badge text-center min-w-[80px] text-hacktown-cyan">
                    <div className="text-[9px] text-muted-foreground mb-1">
                      {WEEKDAY_SHORT_LABELS[slot.day]}
                    </div>
                    <div className="font-semibold">{slot.startTime}</div>
                    <div className="text-[10px] text-muted-foreground my-0.5">até</div>
                    <div className="font-semibold">{slot.endTime}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{getVenueName(slot.venueId)}</p>
                    <p className="text-xs text-muted-foreground">Disponível</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddActivity(slot)}
                    className="bg-hacktown-pink hover:bg-hacktown-pink/90 text-white rounded-lg px-4"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scheduled Activities */}
      <Card className="glass overflow-hidden">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-hacktown-pink/20">
              <Mic2 className="h-5 w-5 text-hacktown-pink" />
            </div>
            Atividades Agendadas
            <Badge className="ml-2 bg-hacktown-pink/20 text-hacktown-pink border-hacktown-pink/30 font-mono">
              {slotsWithActivities.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          {slotsWithActivities.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-border rounded-xl">
              <p className="text-muted-foreground">Nenhuma atividade agendada ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {slotsWithActivities.map((slot, index) => (
                <div
                  key={`${slot.slotTemplateId}-${slot.day}`}
                  className="group flex items-start gap-5 p-5 rounded-xl bg-muted/30 border border-border/50 hover:border-hacktown-pink/40 transition-all"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="slot-badge text-center min-w-[80px] text-hacktown-pink">
                    <div className="text-[9px] text-muted-foreground mb-1">
                      {WEEKDAY_SHORT_LABELS[slot.day]}
                    </div>
                    <div className="font-semibold">{slot.startTime}</div>
                    <div className="text-[10px] text-muted-foreground my-0.5">até</div>
                    <div className="font-semibold">{slot.endTime}</div>
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="font-bold text-lg text-foreground">{slot.activity?.title}</p>
                    <p className="text-hacktown-pink font-semibold">{slot.activity?.speaker}</p>
                    {slot.activity?.description && (
                      <p className="text-sm text-muted-foreground">{slot.activity.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center gap-2 pt-1">
                      <MapPin className="h-3 w-3 text-hacktown-cyan" />
                      {getVenueName(slot.venueId)}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/20 text-destructive h-10 w-10"
                    onClick={() => handleRemoveActivity(slot)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Activity Dialog */}
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="glass-strong border-hacktown-cyan/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold gradient-text">Adicionar Atividade</DialogTitle>
          </DialogHeader>
          {selectedSlot && (
            <div className="mb-4 p-4 rounded-xl bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground mb-1">Slot selecionado:</p>
              <p className="font-semibold text-foreground">
                <Badge className="mr-2 bg-hacktown-purple/20 text-hacktown-purple border-hacktown-purple/30">
                  {WEEKDAY_SHORT_LABELS[selectedSlot.day]}
                </Badge>
                {getVenueName(selectedSlot.venueId)}
                <span className="mx-2 text-muted-foreground">•</span>
                <span className="font-mono text-hacktown-cyan">{selectedSlot.startTime}</span>
                <span className="text-muted-foreground mx-1">às</span>
                <span className="font-mono text-hacktown-cyan">{selectedSlot.endTime}</span>
              </p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-muted-foreground">Título da Atividade *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Introdução ao React"
                className="bg-muted/50 border-border focus:border-hacktown-cyan"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="speaker" className="text-muted-foreground">Responsável *</Label>
              <Input
                id="speaker"
                value={formData.speaker}
                onChange={(e) => setFormData({ ...formData, speaker: e.target.value })}
                placeholder="Ex: João Silva"
                className="bg-muted/50 border-border focus:border-hacktown-cyan"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-muted-foreground">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição opcional da atividade"
                className="bg-muted/50 border-border focus:border-hacktown-cyan"
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="border-border hover:bg-muted">
                Cancelar
              </Button>
              <Button type="submit" className="bg-hacktown-cyan hover:bg-hacktown-cyan/90 text-hacktown-dark font-semibold px-6">
                Adicionar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
