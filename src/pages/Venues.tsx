import { useState, useMemo } from 'react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, MapPin, Users, Pencil, Trash2, Search, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { Venue, VenueStructureType, VENUE_STRUCTURE_LABELS } from '@/types/hacktown';

export default function Venues() {
  const { venues, addVenue, updateVenue, deleteVenue, slotTemplates } = useHacktown();
  const [isOpen, setIsOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    location: '',
    capacity: '',
    description: '',
    nucleo: '',
    structureType: '' as VenueStructureType | '',
  });

  // Filter and sort venues alphabetically
  const filteredVenues = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return venues
      .filter(venue => 
        venue.name.toLowerCase().includes(query) || 
        venue.code.toLowerCase().includes(query)
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [venues, searchQuery]);

  const resetForm = () => {
    setFormData({ code: '', name: '', location: '', capacity: '', description: '', nucleo: '', structureType: '' });
    setEditingVenue(null);
  };

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
      description: venue.description || '',
      nucleo: venue.nucleo || '',
      structureType: venue.structureType || '',
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.name || !formData.location || !formData.capacity) {
      toast.error('Preencha todos os campos obrigatórios');
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
      toast.success('Venue atualizado!');
    } else {
      await addVenue(venueData);
      toast.success('Venue cadastrado!');
    }

    handleOpenChange(false);
  };

  const handleDelete = async (venue: Venue) => {
    const venueSlots = slotTemplates.filter(s => s.venueId === venue.id);
    if (venueSlots.length > 0) {
      toast.error(`Este venue possui ${venueSlots.length} slot(s). Remova os slots primeiro.`);
      return;
    }
    await deleteVenue(venue.id);
    toast.success('Venue removido!');
  };

  const getVenueSlotCount = (venueId: string) => {
    return slotTemplates.filter(s => s.venueId === venueId).length;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold gradient-text">Venues</h1>
          <p className="text-muted-foreground text-lg">Gerencie os pontos de atividade</p>
        </div>
        
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
                {editingVenue ? 'Editar Venue' : 'Novo Venue'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-muted-foreground">Código *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Ex: VN001"
                    className="bg-muted/50 border-border focus:border-hacktown-cyan font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-muted-foreground">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Auditório Principal"
                    className="bg-muted/50 border-border focus:border-hacktown-cyan"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location" className="text-muted-foreground">Endereço *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ex: Rua Principal, 123"
                  className="bg-muted/50 border-border focus:border-hacktown-cyan"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity" className="text-muted-foreground">Capacidade *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="Ex: 100"
                    className="bg-muted/50 border-border focus:border-hacktown-cyan"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nucleo" className="text-muted-foreground">Núcleo</Label>
                  <Input
                    id="nucleo"
                    value={formData.nucleo}
                    onChange={(e) => setFormData({ ...formData, nucleo: e.target.value })}
                    placeholder="Ex: Centro"
                    className="bg-muted/50 border-border focus:border-hacktown-cyan"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="structureType" className="text-muted-foreground">Tipo de Estrutura</Label>
                <Select
                  value={formData.structureType}
                  onValueChange={(value) => setFormData({ ...formData, structureType: value as VenueStructureType })}
                >
                  <SelectTrigger className="bg-muted/50 border-border focus:border-hacktown-cyan">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-border">
                    {Object.entries(VENUE_STRUCTURE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-muted-foreground">Observação</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Observações sobre o venue"
                  className="bg-muted/50 border-border focus:border-hacktown-cyan"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="border-border hover:bg-muted">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-hacktown-pink hover:bg-hacktown-pink/90 text-white font-semibold px-6">
                  {editingVenue ? 'Salvar' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Filter */}
      {venues.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome ou código..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50 border-border focus:border-hacktown-cyan"
          />
        </div>
      )}

      {venues.length === 0 ? (
        <Card className="glass border-dashed border-2">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg">Nenhum venue cadastrado ainda</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Clique em "Novo Venue" para começar</p>
          </CardContent>
        </Card>
      ) : filteredVenues.length === 0 ? (
        <Card className="glass border-dashed border-2">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg">Nenhum venue encontrado</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Tente uma busca diferente</p>
          </CardContent>
        </Card>
      ) : (
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
                      <Badge variant="outline" className="border-hacktown-cyan/30 text-hacktown-cyan font-mono text-xs mb-1">
                        <Hash className="h-3 w-3 mr-1" />
                        {venue.code}
                      </Badge>
                      <CardTitle className="text-xl font-bold">{venue.name}</CardTitle>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
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
                    <p className="text-sm text-muted-foreground/80">Núcleo: {venue.nucleo}</p>
                  )}
                  {venue.description && (
                    <p className="text-sm text-muted-foreground/80">{venue.description}</p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Badge className="bg-hacktown-cyan/20 text-hacktown-cyan border-hacktown-cyan/30 font-mono">
                      <Users className="h-3 w-3 mr-1" />
                      {venue.capacity}
                    </Badge>
                    <Badge variant="outline" className="border-border text-muted-foreground font-mono">
                      {slotCount} slot(s)
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
