"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// UI Components
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Icons
import {
  Home,
  Settings,
  Plus,
  GitBranch,
  Crown,
  Users,
  BookOpen,
  Menu,
  ChevronRight,
  LogOut,
  CreditCard,
  LayoutDashboard,
} from "lucide-react";
import { PDFIcon } from "@/components/icons/PDFIcon";

// Types
import { DashboardSidebarProps } from "@/types/user";

export function DashboardSidebar({
  activePage = "",
  onNavigate,
  userName = "User",
  userAvatar = "",
  rewardPoints = 0,
}: DashboardSidebarProps) {
  const { data: session } = useSession();
  const [isMounted, setIsMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const handleNavigation = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  // Organized navigation items with categories
  const navItems = [
    {
      category: "Main",
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        // { id: "familyTree", label: "Street Tree", icon: GitBranch },
      ]
    },
    {
      category: "Tools",
      items: [
        { id: "readPDF", label: "PDF Reader", icon: PDFIcon },
        // { id: "submit", label: "Crypto Submit", icon: Plus },
        // { id: "list", label: "Crypto List", icon: Users },
        { id: "resources", label: "Resources", icon: BookOpen },
      ]
    },
    {
      category: "Account",
      items: [
        // { id: "fundingPage", label: "Community Fund", icon: CreditCard },
        { id: "settings", label: "Settings", icon: Settings },
      ]
    }
  ];

  const SidebarContent = () => (
    <div className={cn(
      "flex h-full flex-col bg-white transition-all duration-300",
      isCollapsed ? "w-20" : "w-full"
    )}>
      {/* User Profile Section */}
      <div className={cn(
        "flex items-center border-b border-gray-100 transition-all duration-300",
        isCollapsed ? "justify-center py-6" : "flex-col py-8"
      )}>
        <Avatar className={cn(
          "border-2 border-[#2BAC3E]/10 transition-all duration-300",
          isCollapsed ? "h-12 w-12" : "h-20 w-20"
        )}>
          {userAvatar ? (
            <AvatarImage src={userAvatar} alt={userName} />
          ) : (
            <AvatarFallback className="bg-[#2BAC3E]/10 text-[#2BAC3E]">
              {userName?.split(" ").map((n) => n[0]).join("") || "U"}
            </AvatarFallback>
          )}
        </Avatar>
        
        {!isCollapsed && (
          <>
            <h2 className="mt-4 text-lg font-semibold text-gray-800">{userName}</h2>
            <div className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2BAC3E]/10">
              <Crown className="h-3.5 w-3.5 text-[#2BAC3E]" />
              <span className="text-sm font-medium text-[#2BAC3E]">{rewardPoints} points</span>
            </div>
          </>
        )}
      </div>

      {/* Toggle collapse button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-300"
      >
        <ChevronRight className={cn(
          "h-3 w-3 text-gray-500 transition-transform duration-300",
          isCollapsed ? "" : "rotate-180"
        )} />
      </button>
      
      {/* Navigation Items */}
      <ScrollArea className="flex-1 px-3 py-6">
        <div className="space-y-6">
          {navItems.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <h3 className="text-xs uppercase tracking-wider text-gray-500 font-medium ml-4 mb-2">
                  {section.category}
                </h3>
              )}
              
              {section.items.map((item) => (
                <TooltipProvider key={item.id} delayDuration={isCollapsed ? 300 : 999999}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size={isCollapsed ? "icon" : "default"}
                        className={cn(
                          "w-full justify-start rounded-lg transition-all duration-200",
                          activePage === item.id
                            ? "bg-[#2BAC3E]/10 text-[#2BAC3E] font-medium hover:bg-[#2BAC3E]/15"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        )}
                        onClick={() => handleNavigation(item.id)}
                      >
                        <item.icon className={cn(
                          "flex-shrink-0",
                          isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-3"
                        )} />
                        {!isCollapsed && <span>{item.label}</span>}
                      </Button>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right">
                        {item.label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
      
      {/* Logout Button */}
      <div className={cn(
        "border-t border-gray-100 p-3",
        isCollapsed ? "flex justify-center" : ""
      )}>
        <TooltipProvider delayDuration={isCollapsed ? 300 : 999999}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={isCollapsed ? "icon" : "default"}
                className="w-full justify-start text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                onClick={() => {}}
              >
                <LogOut className={cn(
                  "flex-shrink-0",
                  isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-3"
                )} />
                {!isCollapsed && <span>Logout</span>}
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                Logout
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div 
        initial={{ width: 256 }}
        animate={{ width: isCollapsed ? 80 : 256 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden md:block border-r border-gray-100 shadow-sm relative"
      >
        <SidebarContent />
      </motion.div>

      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Menu className="h-5 w-5 text-gray-700" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 max-w-[280px]">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
