import { LayoutDashboard, MapPin, Clock, Mic2, Calendar, BarChart3, Lock } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';

const menuItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard, color: 'text-hacktown-cyan' },
  { title: 'Dias', url: '/days', icon: Calendar, color: 'text-hacktown-purple' },
  { title: 'Venues', url: '/venues', icon: MapPin, color: 'text-hacktown-pink' },
  { title: 'Slots', url: '/slots', icon: Clock, color: 'text-hacktown-cyan' },
  { title: 'Gestão de Capacidade', url: '/capacity', icon: BarChart3, color: 'text-hacktown-green' },
  { title: 'Atividades', url: '/talks', icon: Mic2, color: 'text-hacktown-pink', disabled: true },
];

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-sidebar-border/50 glass">
      <SidebarContent className="pt-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/70 uppercase text-xs tracking-widest mb-4 px-4">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              {menuItems.map((item, index) => (
                <SidebarMenuItem key={item.title} style={{ animationDelay: `${index * 50}ms` }} className="animate-slide-in">
                  <SidebarMenuButton asChild={!item.disabled} disabled={item.disabled}>
                    {item.disabled ? (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground/40 cursor-not-allowed">
                        <item.icon className="h-5 w-5 text-muted-foreground/40" />
                        <span className="font-medium">{item.title}</span>
                        <Badge variant="outline" className="ml-auto text-[10px] py-0 px-1.5 border-amber-500/30 text-amber-500/70">
                          <Lock className="h-2.5 w-2.5 mr-1" />
                          Em breve
                        </Badge>
                      </div>
                    ) : (
                      <NavLink 
                        to={item.url} 
                        end={item.url === '/'} 
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200 group"
                        activeClassName="bg-gradient-to-r from-hacktown-cyan/20 to-hacktown-pink/10 text-sidebar-foreground border border-hacktown-cyan/30 neon-glow"
                      >
                        <item.icon className={`h-5 w-5 ${item.color} group-hover:scale-110 transition-transform`} />
                        <span className="font-medium">{item.title}</span>
                      </NavLink>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
