import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { VenueWithSlots } from '@/types/hacktown';
import { Building2, Clock, Users, MapPin, Calendar, Layers } from 'lucide-react';
import { useHacktown } from '@/contexts/HacktownContext';

interface DashboardOverviewProps {
  venuesWithSlots: VenueWithSlots[];
}

export function DashboardOverview({ venuesWithSlots }: DashboardOverviewProps) {
  const { selectedDays } = useHacktown();
  
  const stats = useMemo(() => {
    let totalVenues = venuesWithSlots.length;
    let totalSlots = 0;
    let totalCapacity = 0;
    let capacityPerSlot = 0;
    const uniqueNucleos = new Set<string>();
    const uniqueStructures = new Set<string>();

    venuesWithSlots.forEach(venue => {
      totalCapacity += venue.capacity;
      if (venue.nucleo) uniqueNucleos.add(venue.nucleo);
      if (venue.structureType) uniqueStructures.add(venue.structureType);
      totalSlots += venue.slots.length;
    });

    // Capacidade total considerando todos os slots (cada slot representa uma oportunidade de uso)
    capacityPerSlot = totalSlots > 0 ? Math.round(totalCapacity / venuesWithSlots.length) : 0;

    return {
      totalVenues,
      totalSlots,
      totalCapacity,
      capacityPerSlot,
      uniqueDays: selectedDays.length,
      uniqueNucleos: uniqueNucleos.size,
      uniqueStructures: uniqueStructures.size,
    };
  }, [venuesWithSlots, selectedDays]);

  const overviewCards = [
    {
      label: 'Total Venues',
      value: stats.totalVenues,
      icon: Building2,
      color: 'text-hacktown-cyan',
      bgColor: 'bg-hacktown-cyan/10',
      borderColor: 'border-hacktown-cyan/20',
    },
    {
      label: 'Capacidade Total',
      value: stats.totalCapacity.toLocaleString('pt-BR'),
      icon: Users,
      color: 'text-hacktown-pink',
      bgColor: 'bg-hacktown-pink/10',
      borderColor: 'border-hacktown-pink/20',
    },
    {
      label: 'Total Slots',
      value: stats.totalSlots,
      icon: Clock,
      color: 'text-hacktown-purple',
      bgColor: 'bg-hacktown-purple/10',
      borderColor: 'border-hacktown-purple/20',
    },
    {
      label: 'Capacidade Média',
      value: stats.capacityPerSlot.toLocaleString('pt-BR'),
      icon: Layers,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
      borderColor: 'border-green-400/20',
    },
    {
      label: 'Dias de Evento',
      value: stats.uniqueDays,
      icon: Calendar,
      color: 'text-hacktown-cyan',
      bgColor: 'bg-hacktown-cyan/10',
      borderColor: 'border-hacktown-cyan/20',
    },
    {
      label: 'Núcleos',
      value: stats.uniqueNucleos,
      icon: MapPin,
      color: 'text-hacktown-purple',
      bgColor: 'bg-hacktown-purple/10',
      borderColor: 'border-hacktown-purple/20',
    },
    {
      label: 'Tipos de Estrutura',
      value: stats.uniqueStructures,
      icon: Building2,
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
      borderColor: 'border-orange-400/20',
    },
  ];

  // Mostrar aviso se não houver dados
  if (venuesWithSlots.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold gradient-text">Visão Geral</h2>
        <Card className="glass border-yellow-500/20">
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <Building2 className="h-12 w-12 text-yellow-500/60" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-yellow-500">
                  Sistema sem dados
                </p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Comece cadastrando locais (venues) e configurando os dias do evento para visualizar as estatísticas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedDays.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold gradient-text">Visão Geral</h2>
        <Card className="glass border-yellow-500/20">
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <Calendar className="h-12 w-12 text-yellow-500/60" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-yellow-500">
                  Dias do evento não configurados
                </p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Acesse a página "Dias" para selecionar os dias do evento e criar slots.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stats.totalSlots === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold gradient-text">Visão Geral</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {overviewCards.slice(0, 2).map((card, index) => (
            <Card 
              key={card.label} 
              className={`glass hover:neon-glow transition-all duration-300 border ${card.borderColor}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div className="space-y-1">
                  <p className={`text-2xl font-bold font-mono ${card.color}`}>
                    {card.value}
                  </p>
                  <p className="text-xs text-muted-foreground leading-tight">
                    {card.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="glass border-yellow-500/20">
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <Clock className="h-12 w-12 text-yellow-500/60" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-yellow-500">
                  Nenhum slot criado
                </p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Acesse a página "Slots" para criar horários disponíveis para os venues cadastrados.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold gradient-text">Visão Geral</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {overviewCards.map((card, index) => (
          <Card 
            key={card.label} 
            className={`glass hover:neon-glow transition-all duration-300 border ${card.borderColor}`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div className="space-y-1">
                <p className={`text-2xl font-bold font-mono ${card.color}`}>
                  {card.value}
                </p>
                <p className="text-xs text-muted-foreground leading-tight">
                  {card.label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
