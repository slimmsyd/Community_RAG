"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../lib/utils";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { BookOpenIcon, MailIcon, Menu, ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { useAccount, useDisconnect, useEnsAddress } from "wagmi";
import React, { FC, RefObject } from "react";
import { useWeb3Modal } from "@web3modal/wagmi/react";


// import { signIn, signOut } from "next-auth/react";

interface Route {
  href: string;
  label: string;
  icon?: () => JSX.Element;  // Make icon optional
}

const routes: Route[] = [
  {
    href: "#product",
    label: "",
  },
  // {
  //   href: "#reason", 
  //   label: "X(Twitter)",
  // },
  // {
  //   href: "#pricing",
  //   label: "Dashboard",
  // },
].map((route: Route) => ({
  ...route,
  icon: route.icon || undefined
}));




export default function Navbar() {
  // const { chain, address, connector } = useAccount();
  const [isModalOpen, setIsModalOpen] = useState(false);
  // const formatted_address = address ? `${address.slice(0, 7)}` : undefined;
  // const { open } = useWeb3Modal();

  const handleConnect = async () => {
    try {
      await open();
    } catch (error) {
      console.error('Failed to open Web3Modal:', error);
    }
  };



  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState({
    type: "",
    message: "",
  });
  const [formData, setFormData] = useState({
    email: "",
    location: "",
    phoneNumber: "",
    gender: "",
    age: "",
    name: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await axios.post("/api/newsletter", formData);

      if (result.data.success) {
        setNotificationMessage({
          type: "success",
          message: "Successfully joined the waitlist!",
        });
        setIsOpen(false);
        setFormData({ email: "", location: "", phoneNumber: "", gender: "", age: "", name: "" });
      } else {
        setNotificationMessage({
          type: "error",
          message: result.data.message || "Email already registered",
        });
      }
    } catch (error) {
      setNotificationMessage({
        type: "error",
        message: "Failed to join waitlist. Please try again.",
      });
    }
    setShowNotification(true);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    
    // Remove the # from the href
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    
    if (element) {
      const navbarHeight = 64; // This is your navbar height (h-16 = 64px)
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full transition-all duration-300 ease-in-out",
      isScrolled && "bg-white shadow-[0px_4px_20px_rgba(0,0,0,0.1)] "
    )}>
      <div className="flex h-16 items-center w-full md:px-[52px] px-8">
        <div className="mr-8 inline-flex items-center gap-2">
          <Link href="/" className="flex text-black items-center space-x-2">
            <Image src="/assets/SE_LOGO.png" alt="Product" width={68} height={68} />
            <span className="font-bold hidden md:inline !text-[12px]">Street Networks</span>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden ml-auto mr-4 hover:bg-gray-100 p-2 rounded-md text-black"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
     
        <NavigationMenu className="hidden md:flex text-black">
          <NavigationMenuList>
            {routes.map((route) => {
              const Icon = route.icon;
              return (
                <NavigationMenuItem key={route.href}>
                  <a onClick={(e) => handleScroll(e, route.href)}>
                    <NavigationMenuLink
                      className={cn(
                        " !text-[12px] group cursor-pointer inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-white hover:text-black focus:bg-white focus:text-black focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-white/50 data-[state=open]:bg-white/50",
                        pathname === route.href && "bg-white/50 text-black"
                      )}
                    >
                      {route.label}
                    </NavigationMenuLink>
                  </a>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute top-16 left-0 right-0 bg-white shadow-lg border-t md:hidden"
            >
              <nav className="flex flex-col p-4">
                {routes.map((route) => {
                  const Icon = route.icon;
                  return (
                    <a
                      key={route.href}
                      onClick={(e) => {
                        handleScroll(e, route.href);
                        setMobileMenuOpen(false);
                      }}
                      className={cn(
                        "flex items-center space-x-2 px-4 py-3 text-sm hover:bg-gray-100 rounded-md transition-colors duration-200 text-black",
                        pathname === route.href && "bg-gray-100"
                      )}
                    >
                      <span className="text-black">{route.label}</span>
                    </a>
                  );
                })}
                <div className="mt-4 pt-4 border-t text-black">
                  
                  <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                      <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-sm font-medium text-white transition-all duration-500 flex items-center justify-center gap-2 px-6 py-2.5 rounded-full relative overflow-hidden group w-full transform hover:scale-[1.02]"
                        style={{
                          background: 'linear-gradient(135deg, #2BAC3E, #1F8A2F)',
                          boxShadow: '0 2px 20px rgba(43, 172, 62, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(43,172,62,0.3),transparent_60%)]" />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_60%)]" />
                        <span className="
                        !text-[12px]
                        relative z-10 bg-gradient-to-b from-white to-[#FCFCFC] bg-clip-text text-transparent font-medium">
                          Build Ya Street
                        </span>
                        <ArrowRight className="h-4 w-4 relative z-10 text-white transition-transform duration-500 group-hover:translate-x-1" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">
                          Join the Beta Waitlist
                        </DialogTitle>
                        <DialogDescription className="text-gray-500 mt-2">
                          Be among the first to experience the future of family legacy
                          preservation. Get early access and help shape how future
                          generations connect with their roots.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                        <Input
                          type="email"
                          placeholder="Enter your email *"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          className="w-full h-12 px-4 rounded-lg border border-gray-200 focus:border-black focus:ring-0 transition-all"
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            type="text"
                            placeholder="Location (Optional)"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full h-12 px-4 rounded-lg border border-gray-200 focus:border-black focus:ring-0 transition-all"
                          />
                          
                          <Input
                            type="tel"
                            placeholder="Phone (Optional)"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            className="w-full h-12 px-4 rounded-lg border border-gray-200 focus:border-black focus:ring-0 transition-all"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full text-sm font-medium text-white transition-all duration-500 flex items-center justify-center gap-2 px-6 py-3 rounded-full relative overflow-hidden group transform hover:scale-[1.02]"
                          style={{
                            background: 'linear-gradient(135deg, #2BAC3E, #1F8A2F)',
                            boxShadow: '0 2px 20px rgba(43, 172, 62, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                          }}
                        >
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(43,172,62,0.3),transparent_60%)]" />
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_60%)]" />
                          <span className="relative z-10 bg-gradient-to-b from-white to-[#FCFCFC] bg-clip-text text-transparent font-medium">
                            Join Waitlist
                          </span>
                          <ArrowRight className="h-4 w-4 relative z-10 text-white transition-transform duration-500 group-hover:translate-x-1" />
                        </button>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Dialog
                    open={showNotification}
                    onOpenChange={setShowNotification}
                  >
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle
                          className={`text-xl ${
                            notificationMessage.type === "success"
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {notificationMessage.type === "success"
                            ? "Success!"
                            : "Error"}
                        </DialogTitle>
                        <DialogDescription className="text-gray-500 mt-2">
                          {notificationMessage.message}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-4">
                        <Button
                          onClick={() => setShowNotification(false)}
                          className="w-full"
                          variant={
                            notificationMessage.type === "success"
                              ? "default"
                              : "destructive"
                          }
                        >
                          Close
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex ml-auto items-center space-x-4">
          {/* <button
            onClick={address ? () => disconnect() : handleConnect}
            className="text-sm font-medium transition-all duration-500 flex items-center gap-2 px-6 py-2.5 rounded-full relative overflow-hidden group transform hover:scale-[1.02]"
            style={{
              border: '0.5px solid black',
            }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_60%)]" />
            <span className="!text-[12px] relative z-10 text-black font-medium">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect Wallet'}
            </span>
            <ArrowRight className="h-4 w-4 relative z-10 text-black transition-transform duration-500 group-hover:translate-x-1" />
          </button> */}
          <Dialog>
            <DialogTrigger asChild>
              <button
                className="text-sm font-medium text-white transition-all duration-500 flex items-center gap-2 px-6 py-2.5 rounded-full relative overflow-hidden group transform hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, #2BAC3E, #1F8A2F)',
                  boxShadow: '0 2px 20px rgba(43, 172, 62, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(43,172,62,0.3),transparent_60%)]" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_60%)]" />
                <span className="
                !text-[12px]
                relative z-10 bg-gradient-to-b from-white to-[#FCFCFC] bg-clip-text text-transparent font-medium">
                  Build Ya Street
                </span>
                <ArrowRight className="h-4 w-4 relative z-10 text-white transition-transform duration-500 group-hover:translate-x-1" />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  Join the Beta Waitlist
                </DialogTitle>
                <DialogDescription className="text-gray-500 mt-2">
                  Be among the first to experience the future of family legacy
                  preservation. Get early access and help shape how future
                  generations connect with their roots.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <Input
                  type="email"
                  placeholder="Enter your email *"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full h-12 px-4 rounded-lg border border-gray-200 focus:border-black focus:ring-0 transition-all"
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="text"
                    placeholder="Location (Optional)"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full h-12 px-4 rounded-lg border border-gray-200 focus:border-black focus:ring-0 transition-all"
                  />
                  
                  <Input
                    type="tel"
                    placeholder="Phone (Optional)"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full h-12 px-4 rounded-lg border border-gray-200 focus:border-black focus:ring-0 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full text-sm font-medium text-white transition-all duration-500 flex items-center justify-center gap-2 px-6 py-3 rounded-full relative overflow-hidden group transform hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, #2BAC3E, #1F8A2F)',
                    boxShadow: '0 2px 20px rgba(43, 172, 62, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(43,172,62,0.3),transparent_60%)]" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_60%)]" />
                  <span className="relative z-10 bg-gradient-to-b from-white to-[#FCFCFC] bg-clip-text text-transparent font-medium">
                    Join Waitlist
                  </span>
                  <ArrowRight className="h-4 w-4 relative z-10 text-white transition-transform duration-500 group-hover:translate-x-1" />
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}