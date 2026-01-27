import {
  LayoutDashboard,
  MapPin,
  Clock,
  Mic2,
  Calendar,
  BarChart3,
  TrendingUp,
  Lock,
  LogOut,
  User,
  ChevronRight,
  Layers,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    color: "text-hacktown-cyan",
  },
  {
    title: "Gestão de Capacidade",
    icon: Layers,
    color: "text-hacktown-green",
    subItems: [
      {
        title: "Dias",
        url: "/days",
        icon: Calendar,
        color: "text-hacktown-purple",
      },
      {
        title: "Slots",
        url: "/slots",
        icon: Clock,
        color: "text-hacktown-cyan",
      },
      {
        title: "Ajuste de Capacidade",
        url: "/capacity",
        icon: BarChart3,
        color: "text-hacktown-green",
      },
      {
        title: "Análise de Capacidade",
        url: "/capacity-analysis",
        icon: TrendingUp,
        color: "text-hacktown-purple",
      },
    ],
  },
  {
    title: "Gestão de Venues",
    icon: MapPin,
    color: "text-hacktown-pink",
    subItems: [
      {
        title: "Cadastro de Venues",
        url: "/venues",
        icon: MapPin,
        color: "text-hacktown-pink",
      },
    ],
  },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

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
                <SidebarMenuItem
                  key={item.title}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className="animate-slide-in"
                >
                  {item.subItems ? (
                    <Popover open={hoveredItem === item.title}>
                      <PopoverTrigger asChild>
                        <div
                          onMouseEnter={() => setHoveredItem(item.title)}
                          onMouseLeave={() => setHoveredItem(null)}
                        >
                          <SidebarMenuButton className="flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200 group w-full cursor-pointer">
                            <item.icon
                              className={`h-5 w-5 flex-shrink-0 ${item.color} group-hover:scale-110 transition-transform`}
                            />
                            <span className="font-medium flex-1 text-left whitespace-nowrap">
                              {item.title}
                            </span>
                            <ChevronRight className="h-4 w-4 flex-shrink-0" />
                          </SidebarMenuButton>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent
                        side="right"
                        align="start"
                        className="w-64 p-2 glass border-sidebar-border/50"
                        onMouseEnter={() => setHoveredItem(item.title)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        <div className="space-y-1">
                          {item.subItems.map((subItem) => (
                            <NavLink
                              key={subItem.title}
                              to={subItem.url}
                              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200 group"
                              activeClassName="bg-gradient-to-r from-hacktown-cyan/20 to-hacktown-pink/10 text-sidebar-foreground border border-hacktown-cyan/30 neon-glow"
                              onClick={() => setHoveredItem(null)}
                            >
                              <subItem.icon
                                className={`h-4 w-4 ${subItem.color} group-hover:scale-110 transition-transform`}
                              />
                              <span className="font-medium text-sm">
                                {subItem.title}
                              </span>
                            </NavLink>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <SidebarMenuButton>
                      <NavLink
                        to={item.url}
                        end={item.url === "/dashboard"}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200 group"
                        activeClassName="bg-gradient-to-r from-hacktown-cyan/20 to-hacktown-pink/10 text-sidebar-foreground border border-hacktown-cyan/30 neon-glow"
                      >
                        <item.icon
                          className={`h-5 w-5 ${item.color} group-hover:scale-110 transition-transform`}
                        />
                        <span className="font-medium flex-1 text-left whitespace-nowrap">
                          {item.title}
                        </span>
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/50 p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-hacktown-cyan to-hacktown-pink flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.name || "Usuário"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email || ""}
              </p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
