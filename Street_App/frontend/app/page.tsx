"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  Link as LucideLink,
  Rocket,
  Shield,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
// Add these new imports
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import axios from "axios";
import GetStarted from "@/components/getstarted";
import Pricing from "@/components/pricing";
import Reason from "@/components/reason";
import About from "@/components/about";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import { gsap } from "gsap";
import Lenis from "@studio-freight/lenis";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import Image from "next/image";
import FooterWrapper from "@/components/footer-wrapper";
import SalesVideo from "@/components/salesVideo";
import { useSession } from "next-auth/react";

export default function Home() {
  // Add state for dialog
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  // Add new state for notification dialog
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState({
    type: "",
    message: "",
  });
  const [activeTab, setActiveTab] = useState("Valut");
  const [formData, setFormData] = useState({
    email: email,
    location: "",
    phoneNumber: "",
    gender: "",
    age: "",
    name: "",
  });
  const [activeSlide, setActiveSlide] = useState(0);

  // Add session check
  const { data: session } = useSession();
  const [showCradleToGravePopup, setShowCradleToGravePopup] = useState(false);

  // Add new state for beta signup
  const [betaSignupOpen, setBetaSignupOpen] = useState(false);
  const [betaFormData, setBetaFormData] = useState({
    email: "",
    name: "",
    phoneNumber: "",
  });

  const slides = [
    {
      title: "Family Legacy",
      description:
        "Preserve your family's legacy with our secure digital platform. Create lasting memories that can be shared across generations.",
      image: "/home/FamilyLed.png",
      bgColor: "bg-[#F8F7FF]",
    },
    {
      title: "Organized Memories",
      description:
        "Keep your family memories organized and accessible. Create a structured archive that makes it easy to find and relive precious moments.",
      image: "/home/Arc.png",
      bgColor: "bg-[#F0FFF4]",
    },
    {
      title: "Immutable Archives",
      description:
        "Preserve your family history with blockchain technology, ensuring your memories are securely stored and accessible for generations to come.",
      image: "/home/DigitalLed.png",
      bgColor: "bg-[#FFF5F5]",
    },
  ];

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // useEffect(() => {
  //   const lenis = new Lenis({
  //     duration: 1.2,
  //     easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  //     direction: "vertical",
  //     gestureDirection: "vertical",
  //     smooth: true,
  //     smoothTouch: false,
  //     touchMultiplier: 2,
  //     infinite: false,
  //   } as any);

  //   // Create the animation frame
  //   function raf(time: number) {
  //     lenis.raf(time);
  //     requestAnimationFrame(raf);
  //   }

  //   // Start the animation
  //   requestAnimationFrame(raf);

  //   // Register lenis as the scroll source for ScrollTrigger
  //   gsap.registerPlugin(ScrollTrigger);
  //   ScrollTrigger.defaults({ scroller: document.documentElement });

  //   // Cleanup
  //   return () => {
  //     lenis.destroy();
  //     ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  //   };
  // }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await axios.post("/api/newsletter", formData);

      console.log(result.data);

      if (result.data.success) {
        setNotificationMessage({
          type: "success",
          message: "Successfully joined the waitlist!",
        });
        setIsOpen(false);
        setFormData({
          email: "",
          location: "",
          phoneNumber: "",
          gender: "",
          age: "",
          name: "",
        });
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

  // Add this content mapping object at the component level (before the return statement)
  const tabContent = {
    "Community Wallet": {
      text: "Pool resources and track collective spending within your community. Our platform enables neighborhoods to visualize their economic power, set spending goals, and measure the impact of redirected dollars to community-owned businesses.",
    },
    "Economic Analytics": {
      text: "Gain powerful insights into your community's economic patterns with our advanced analytics tools. Track spending flows, identify leakage points, and discover opportunities to strengthen your local economy through data-driven decision making.",
    },
    "Impact Tracking": {
      text: "Measure the real-world impact of your economic decisions with our comprehensive tracking tools. See how redirected spending creates jobs, builds wealth, and strengthens community infrastructure through visual reports and impact metrics.",
    },
    "Campaign Management": {
      text: "Organize and manage targeted buycott campaigns that align with your community's values. Set goals, track participation, and measure outcomes with our intuitive campaign management system designed for maximum community engagement.",
    },
  };

  // Add beta signup handler
  const handleBetaSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await axios.post("/api/newsletter", betaFormData);

      if (result.data.success) {
        setNotificationMessage({
          type: "success",
          message: "Successfully joined the beta waitlist!",
        });
        setBetaSignupOpen(false);
        setBetaFormData({ email: "", name: "", phoneNumber: "" });
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

  return (
    <>
      <div className="flex flex-col items-center justify-center overflow-x-hidden">
        <div className="w-full h-full flex items-center justify-center py-10"></div>
        {/* Hero Section */}
        <section className="relative w-full py-8 md:py-24 lg:py-32 xl:py-20 h-full overflow-x-hidden">
          {/* <div className="w-full h-[150px] sm:h-[200px] md:h-[300px] relative mb-6 md:mb-8 overflow-hidden">
            <video
              src="https://teal-artistic-bonobo-612.mypinata.cloud/ipfs/bafybeie4peqsnsy34w3fbnynwagqabwqltrvdaahu4y3mv3e66pcb74sfi"
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
              style={{
                borderBottom: '0.5px solid #E5E5E5',
              }}
              onError={(e) => {
                console.error('Video failed to load:', e);
                const target = e.target as HTMLVideoElement;
                target.style.display = 'none';
                const img = document.createElement('img');
                img.src = '/home/EconomicEmpowerment.png';
                img.className = 'w-full h-full object-cover';
                img.style.borderBottom = '0.5px solid #E5E5E5';
                target.parentNode?.appendChild(img);
              }}
            >
              <source src="https://teal-artistic-bonobo-612.mypinata.cloud/ipfs/bafybeie4peqsnsy34w3fbnynwagqabwqltrvdaahu4y3mv3e66pcb74sfi" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div> */}

          {/* <div className="absolute bottom-0 left-0 z-0 w-[600px] h-[600px] hidden md:block opacity-30">
            <Image
              src="/home/family.png"
              alt="Family background"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 600px) 100vw, 600px"
              style={{
                opacity: 1, 
              }}
            />
          </div> */}

          <div className="relative z-10 flex flex-col items-start space-y-4 w-full max-w-[1400px] mx-auto px-4">
            <div className="flex flex-col items-start space-y-4 w-full max-w-[950px] mx-auto px-2 sm:px-4">
              <span
                style={{
                  background: "linear-gradient(to left, #FFFFFF, #F8F7FF)",
                  color: "black",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "6px",
                  border: "0.5px solid #D2D1D1",
                  fontSize: "0.875rem",
                }}
              >
                Empowering Communities Through Economic Action
                <span className="bg-white rounded-md p-1 text-black flex items-center">
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </span>
              </span>
              <div className="space-y-2 text-left w-full">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tighter text-black max-w-[800px]">
                  Street Economics <br className="hidden sm:block" />
                  Buycott Movement
                </h1>
                <p className="max-w-[600px] text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-4">
                  Join the movement to transform our communities through
                  strategic economic action. Track, organize, and amplify our
                  collective buying power for lasting change.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-6 w-full">
                <Link href="/app/readPDF">
                  <button
                    className="text-sm font-medium text-white transition-all duration-500 flex items-center justify-center gap-2 px-6 py-3 rounded-full relative overflow-hidden group w-full sm:w-auto transform hover:scale-[1.02]"
                    style={{
                      background: "linear-gradient(135deg, #2BAC3E, #1F8A2F)",
                      boxShadow:
                        "0 2px 20px rgba(43, 172, 62, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                    }}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(43,172,62,0.3),transparent_60%)]" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_60%)]" />
                    <span className="relative z-10 bg-gradient-to-b from-white to-[#FCFCFC] bg-clip-text text-transparent font-medium">
                      Read PDF
                    </span>
                    <ArrowRight className="h-4 w-4 relative z-10 text-white transition-transform duration-500 group-hover:translate-x-1" />
                  </button>
                </Link>

                <Dialog open={betaSignupOpen} onOpenChange={setBetaSignupOpen}>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Sign up for Beta Access</DialogTitle>
                      <DialogDescription>
                        Join our waitlist to be among the first to experience
                        Kinnected.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleBetaSignup} className="space-y-4">
                      <div className="space-y-2">
                        <label
                          htmlFor="name"
                          className="text-sm font-medium text-gray-700"
                        >
                          Name
                        </label>
                        <Input
                          id="name"
                          value={betaFormData.name}
                          onChange={(e) =>
                            setBetaFormData((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          placeholder="Enter your name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="email"
                          className="text-sm font-medium text-gray-700"
                        >
                          Email
                        </label>
                        <Input
                          id="email"
                          type="email"
                          value={betaFormData.email}
                          onChange={(e) =>
                            setBetaFormData((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="phone"
                          className="text-sm font-medium text-gray-700"
                        >
                          Phone Number
                        </label>
                        <Input
                          id="phone"
                          type="tel"
                          value={betaFormData.phoneNumber}
                          onChange={(e) =>
                            setBetaFormData((prev) => ({
                              ...prev,
                              phoneNumber: e.target.value,
                            }))
                          }
                          placeholder="Enter your phone number"
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Join Waitlist
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <button
                  onClick={() => {
                    setShowCradleToGravePopup(true);
                  }}
                  className="text-sm font-medium transition-all duration-500 flex items-center justify-center gap-2 px-6 py-3 rounded-full relative overflow-hidden group w-full sm:w-auto hover:bg-gray-50 border border-gray-200"
                >
                  <span className="relative z-10 text-gray-700">
                    View Impact Dashboard
                  </span>
                  <LucideLink className="h-4 w-4 relative z-10 text-gray-700" />
                </button>
              </div>

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

            {/* <div className="flex flex-col items-center justify-center w-full py-16">

<div className="relative  w-full h-[425px] sm:h-[500px] flex items-center justify-center">
              <video
                autoPlay
                muted
                loop
                playsInline
                controls
                preload="metadata"
                className="w-full h-full object-contain rounded-lg"
                style={{
                  boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
                  maxHeight: "700px",
                  backgroundColor: "rgba(0, 0, 0, 0.05)",
                }}
                onError={(e) => {
                  console.error("Video failed to load:", e);
                  const target = e.target as HTMLVideoElement;
                  target.style.display = 'none';
                  const fallback = document.getElementById('video-fallback');
                  if (fallback) fallback.style.display = 'flex';
                }}
                poster="/home/video-thumbnail.png"
              >
                <source 
                  src="https://red-broken-ferret-951.mypinata.cloud/ipfs/bafybeigeqwgkvd5ditu6ceufkvl3mree7vwvwdwmbmsil57kmligvavamu" 
                  type="video/mp4" 
                />
                <p>Your browser doesn't support HTML5 video. Here is a <a href="https://red-broken-ferret-951.mypinata.cloud/ipfs/bafybeigeqwgkvd5ditu6ceufkvl3mree7vwvwdwmbmsil57kmligvavamu">link to the video</a> instead.</p>
              </video>
              <div 
                id="video-fallback"
                className="absolute inset-0 bg-gray-100 rounded-lg flex flex-col items-center justify-center"
                style={{ display: "none" }}
              >
                <p className="text-gray-600 mb-2">Video preview unavailable</p>
                <p className="text-sm text-gray-500">Please check your internet connection</p>
              </div>
            </div>
</div> */}
          </div>
        </section>

        <hr className="w-full max-w-[850px] mx-auto border-t border-gray-200 my-8" />

        <div className="max-w-[900px] mx-auto mt-20 px-4">
          <div className="text-center mb-10">
            <h3 className="text-3xl font-bold text-black mb-3">
              Movement Leaders
            </h3>
            <p className="text-gray-500 max-w-[600px] mx-auto">
              Join these community champions who are driving economic change
              through collective action
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="bg-[#F0FFF0] p-4 border-b border-gray-200 flex items-center justify-between">
              <h4 className="font-semibold text-[#2BAC3E]">Top Contributors</h4>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Updated daily</span>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {/* User 1 - Top Contributor */}
              <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold">
                      1
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-xs">👑</span>
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">Maya Johnson</h5>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>@maya_builds</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                        $12.5k impact
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">
                    32 campaigns
                  </span>
                  <button className="text-[#2BAC3E] hover:text-green-700">
                    <LucideLink className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* User 2 */}
              <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-300 to-green-500 flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">
                      Marcus Williams
                    </h5>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>@community_wealth</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                        $9.8k impact
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">
                    28 campaigns
                  </span>
                  <button className="text-[#2BAC3E] hover:text-green-700">
                    <LucideLink className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* User 3 */}
              <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-200 to-green-400 flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">
                      Aisha Thompson
                    </h5>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>@economic_freedom</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                        $7.3k impact
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">
                    24 campaigns
                  </span>
                  <button className="text-[#2BAC3E] hover:text-green-700">
                    <LucideLink className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* User 4 */}
              <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold">
                    4
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">
                      David Rodriguez
                    </h5>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>@community_first</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                        $5.9k impact
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">
                    19 campaigns
                  </span>
                  <button className="text-[#2BAC3E] hover:text-green-700">
                    <LucideLink className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* User 5 */}
              <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold">
                    5
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">
                      Jasmine Carter
                    </h5>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>@buy_black_owned</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                        $4.2k impact
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">
                    15 campaigns
                  </span>
                  <button className="text-[#2BAC3E] hover:text-green-700">
                    <LucideLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer with Join CTA */}
            <div className="bg-[#F0FFF0] p-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium">1,248 community members</span>{" "}
                driving economic change
              </div>
              <Dialog open={betaSignupOpen} onOpenChange={setBetaSignupOpen}>
                <DialogTrigger asChild>
                  <button className="text-sm font-medium text-white bg-[#2BAC3E] hover:bg-[#259A37] px-4 py-2 rounded-full transition-colors flex items-center gap-2">
                    Join Leaderboard
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <div className="text-sm text-gray-500 mb-1">
                Total Economic Impact
              </div>
              <div className="text-2xl font-bold text-gray-900">$1.2M+</div>
              <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <ArrowRight className="h-3 w-3 rotate-45" />
                <span>+12% this month</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <div className="text-sm text-gray-500 mb-1">Active Campaigns</div>
              <div className="text-2xl font-bold text-gray-900">48</div>
              <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <ArrowRight className="h-3 w-3 rotate-45" />
                <span>+3 new this week</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <div className="text-sm text-gray-500 mb-1">Community Growth</div>
              <div className="text-2xl font-bold text-gray-900">+127</div>
              <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <ArrowRight className="h-3 w-3 rotate-45" />
                <span>New members this week</span>
              </div>
            </div>
          </div>
        </div>

        {/* <section className="w-full bg-white py-24 overflow-x-hidden">
          <div className="max-w-[1400px] mx-auto px-4">
        
            <div className="hidden md:grid md:grid-cols-2 gap-4 mb-8">
              <div className="bg-[#E3F2FD] p-8 rounded-3xl">
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="max-w-md mb-8 md:mb-0">
                    <h3 className="text-3xl font-bold text-black mb-4">
                      Economic Analytics
                    </h3>
                    <p className="text-gray-600 !text-[16px] mb-6">
                      Track spending patterns, measure community impact, and identify opportunities for economic growth and development in your area.
                    </p>
                    <Dialog open={betaSignupOpen} onOpenChange={setBetaSignupOpen}>
                      <DialogTrigger asChild>
                        <button
                          className="text-sm font-medium text-white transition-all duration-500 flex items-center justify-center gap-2 px-6 py-3 rounded-full relative overflow-hidden group w-full sm:w-auto transform hover:scale-[1.02]"
                          style={{
                            background: 'linear-gradient(135deg, #2BAC3E, #1F8A2F)',
                            boxShadow: '0 2px 20px rgba(43, 172, 62, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                          }}
                        >
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(43,172,62,0.3),transparent_60%)]" />
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_60%)]" />
                          <span className="relative z-10 bg-gradient-to-b from-white to-[#FCFCFC] bg-clip-text text-transparent font-medium">
                            View Analytics
                          </span>
                          <ArrowRight className="h-4 w-4 relative z-10 text-white transition-transform duration-500 group-hover:translate-x-1" />
                        </button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                  <div className="flex justify-center">
                    <img
                      src="/home/Analytics.png"
                      alt="Economic Analytics"
                      className="w-auto h-48 md:h-[300px] object-contain"
                      style={{
                        maxWidth: '400px',
                        pointerEvents: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>



              

              <div className="bg-[#FFF3E0] p-8 rounded-3xl">
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="max-w-md mb-8 md:mb-0">
                    <h3 className="text-3xl font-bold text-black mb-4">
                      Impact Tracking
                    </h3>
                    <p className="text-gray-600 !text-[16px] mb-6">
                      Monitor the real-world impact of your economic decisions. See how your community's spending choices create positive change.
                    </p>
                    <Dialog open={betaSignupOpen} onOpenChange={setBetaSignupOpen}>
                      <DialogTrigger asChild>
                        <button
                          className="text-sm font-medium text-white transition-all duration-500 flex items-center justify-center gap-2 px-6 py-3 rounded-full relative overflow-hidden group w-full sm:w-auto transform hover:scale-[1.02]"
                          style={{
                            background: 'linear-gradient(135deg, #2BAC3E, #1F8A2F)',
                            boxShadow: '0 2px 20px rgba(43, 172, 62, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                          }}
                        >
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(43,172,62,0.3),transparent_60%)]" />
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_60%)]" />
                          <span className="relative z-10 bg-gradient-to-b from-white to-[#FCFCFC] bg-clip-text text-transparent font-medium">
                            Track Impact
                          </span>
                          <ArrowRight className="h-4 w-4 relative z-10 text-white transition-transform duration-500 group-hover:translate-x-1" />
                        </button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                  <div className="flex justify-center">
                    <img
                      src="/home/ImpactTracking.png"
                      alt="Impact Tracking"
                      className="w-auto h-48 md:h-[300px] object-contain"
                      style={{
                        maxWidth: '400px',
                        pointerEvents: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section> */}
      </div>

      {/* Features Section */}

      <section id="reason" className="w-full mx-auto px-4 py-16 bg-[#F5F5F5]">
        {/* <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 text-black"
        >
          <h2 className="text-7xl font-bold mb-2">Economic Power</h2>
          <p className="text-gray-500 text-sm">
            "Economic power is not just about money - it's about building and sustaining our communities."
          </p>
          <p className="text-gray-400 text-2xl mt-2">Track. Analyze. Impact.</p>
        </motion.div> */}

        {/* Main Content Area */}
        {/* <div className="flex min-h-[400px] sm:min-h-[600px] gap-4 w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.8,
              delay: 0.2,
              ease: "easeOut",
            }}
            className="flex-1 w-full max-w-[1400px] mx-auto p-2 sm:p-4"
          >
            <div className="relative w-full h-[300px] sm:h-[500px] flex items-center justify-center">
            <div className="w-full !mt-[120px]">
              <img
                src="/home/Dashboard.png"
                alt="Economic Impact Dashboard"
                className="w-full rounded-lg h-[300px] sm:h-[500px]"
                style={{
                  boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)", 
                  border: "0.5px solid #1F1F1F",
                  borderRadius: "8px",
                }}
              />
            </div>
            </div>
          </motion.div>
          </div> */}

        <div className="mt-6 md:mt-8 w-full overflow-x-hidden">
          {/* <div className="flex flex-wrap justify-between items-center w-full max-w-[800px] mx-auto text-black relative px-3">
            {[
              "Community Wallet",
              "Economic Analytics",
              "Impact Tracking",
              "Campaign Management",
            ].map((tab) => (
              <div
                key={tab}
                className="text-center cursor-pointer relative w-[48%] sm:w-auto mb-4 sm:mb-0 px-2"
                onClick={() => setActiveTab(tab)}
              >
                <h3 className="font-semibold text-sm sm:text-base truncate">{tab}</h3>
                {activeTab === tab && (
                  <div className="absolute bottom-[-4px] left-0 w-full h-[2px] bg-black" />
                )}
              </div>
            ))}
            <div className="absolute bottom-[-4px] left-0 w-full h-[2px] bg-gray-300 opacity-30" />
          </div> */}

          {/* <p className="text-gray-500 text-sm text-left mt-6 md:mt-8 max-w-[800px] mx-auto px-3">
            {tabContent[activeTab as keyof typeof tabContent]?.text || 
             "Track your community's economic impact through our comprehensive dashboard. Monitor spending patterns, organize campaigns, and measure real-world results."}
          </p> */}
          {/* 
          <div className="flex justify-start mt-8 max-w-[800px] mx-auto">
            <Link href="/signup">
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
                <span className="relative z-10 bg-gradient-to-b from-white to-[#FCFCFC] bg-clip-text text-transparent font-medium">
                  Join Movement
                </span>
                <ArrowRight className="h-4 w-4 relative z-10 text-white transition-transform duration-500 group-hover:translate-x-1" />
              </button>
            </Link>
          </div> */}

          <footer className="max-w-[900px] mx-auto px-4 py-12 mt-12">
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 text-white">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">
                    Transform Your Community's Economic Future
                  </h3>
                  <p className="text-green-100">
                    Join the movement to build sustainable economic power.
                  </p>
                </div>
                <Link href="/app/readPDF">
                  <button className="bg-white text-green-600 px-8 py-3 rounded-xl font-semibold hover:bg-green-50 transition-colors">
                    Read PDF
                  </button>
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </section>

      {/* Articles Section - Mobile Optimization */}
      {/* <section id="articles" className="w-full py-16 md:py-24 px-3 md:px-4 overflow-x-hidden">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-left mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-3">
              Stay up to date
            </h2>
            <p className="text-gray-500 text-sm md:text-base">The Future depends on the past</p>
            </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            <div className="flex-1">
              <div className="group relative overflow-hidden rounded-xl md:rounded-2xl border border-gray-200 bg-white p-1 transition-all hover:shadow-lg mb-4">
                <div className="aspect-[4/3] overflow-hidden rounded-lg md:rounded-xl">
                  <img
                    src="/home/WomenSave.png"
                    alt="Memories That Last for Generations"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              </div>
              <div className="p-3 md:p-4">
                <h3 className="text-lg md:text-xl font-semibold text-black mb-2 md:mb-3">
                  Memories That Last for Generations
                </h3>
                <p className="text-gray-600 text-sm md:text-base mb-4">
                  Secure your cherished moments on the blockchain for future
                  generations to cherish.
                </p>
                <Link
                  href="/NewPillars.png"
                  className="text-sm max-w-[145px] font-medium text-white transition-all duration-500 flex items-center gap-2 px-4 py-2 rounded-full relative overflow-hidden group transform hover:scale-[1.02]"
                style={{
                    background: 'linear-gradient(135deg, rgba(88, 82, 245, 0.95), rgba(123, 97, 255, 0.95))',
                    boxShadow: '0 2px 20px rgba(123, 97, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),transparent_60%)]" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_60%)]" />
                  <span className="relative z-10 bg-gradient-to-b from-white to-[#FCFCFC] bg-clip-text text-transparent font-medium">
                    Read More
                  </span>
                  <ArrowRight className="h-3 w-3 md:h-4 md:w-4 relative z-10 text-white transition-transform duration-500 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

        
            <div className="flex-1">
              <div className="group relative overflow-hidden rounded-xl md:rounded-2xl border border-gray-200 bg-white p-1 transition-all hover:shadow-lg mb-4">
                <div className="aspect-[4/3] overflow-hidden rounded-lg md:rounded-xl">
                  <img
                    src="/home/NewPillars.png"
                    alt="Digital Family Archives"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              </div>
              <div className="p-3 md:p-4">
                <h3 className="text-lg md:text-xl font-semibold text-black mb-2 md:mb-3">
                  Digital Family Archives
                </h3>
                <p className="text-gray-600 text-sm md:text-base mb-4">
                  Create and maintain digital archives that preserve your family's legacy
                  for future generations.
                </p>
                <Link
                  href="/buildingANewWorldOrder"
                  className="text-sm max-w-[145px] font-medium text-white transition-all duration-500 flex items-center gap-2 px-4 py-2 rounded-full relative overflow-hidden group transform hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, rgba(88, 82, 245, 0.95), rgba(123, 97, 255, 0.95))',
                    boxShadow: '0 2px 20px rgba(123, 97, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),transparent_60%)]" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_60%)]" />
                  <span className="relative z-10 bg-gradient-to-b from-white to-[#FCFCFC] bg-clip-text text-transparent font-medium">
                    Read More
                  </span>
                  <ArrowRight className="h-3 w-3 md:h-4 md:w-4 relative z-10 text-white transition-transform duration-500 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
            </div>
          </div>
        </section> */}

      {/* FAQ Section */}

      {/* Timeline Section */}
      <section className="w-full py-32 bg-gradient-to-b from-white via-[#F8F7FF] to-white overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
            className="text-center mb-24"
          >
            <span className="inline-block text-[#2BAC3E] font-medium mb-4 px-4 py-2 bg-[#E8F5E9] rounded-full text-sm">
              Movement Roadmap
            </span>
            <h2 className="text-4xl md:text-6xl font-bold text-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-black to-gray-600">
              Building Economic Power
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              Transforming communities through strategic economic action and
              collective power
            </p>
          </motion.div>

          <div className="relative">
            {/* Center line with gradient and glow */}
            <div
              className="absolute left-1/2 transform -translate-x-1/2 h-full w-[2px] bg-gradient-to-b from-[#2BAC3E] via-[#2BAC3E]/50 to-transparent"
              style={{ boxShadow: "0 0 20px rgba(43, 172, 62, 0.2)" }}
            />

            {/* Timeline Items */}
            <div className="space-y-40">
              {/* Phase 1 */}
              <motion.div
                initial={{ opacity: 0, x: -100, filter: "blur(10px)" }}
                whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                className="relative flex items-center group"
              >
                <div className="w-1/2 pr-16 text-right">
                  <span className="inline-block text-[#2BAC3E] font-medium mb-2 px-3 py-1 bg-[#E8F5E9] rounded-full text-sm">
                    Current Phase
                  </span>
                  <h3 className="text-3xl font-bold text-black mt-2 mb-4">
                    Community Wallet Launch
                  </h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Launch of our core platform featuring community wallet
                    tracking, spending analytics, and campaign organization
                    tools.
                  </p>
                </div>
                <div
                  className="absolute left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full border-4 border-[#2BAC3E] bg-white shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                  style={{ boxShadow: "0 0 20px rgba(43, 172, 62, 0.2)" }}
                >
                  <div className="w-4 h-4 rounded-full bg-[#2BAC3E]" />
                </div>
                <div className="w-1/2 pl-16" />
              </motion.div>

              {/* Phase 2 */}
              <motion.div
                initial={{ opacity: 0, x: 100, filter: "blur(10px)" }}
                whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                className="relative flex items-center group"
              >
                <div className="w-1/2 pr-16" />
                <div
                  className="absolute left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full border-4 border-[#2BAC3E]/60 bg-white shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                  style={{ boxShadow: "0 0 20px rgba(43, 172, 62, 0.1)" }}
                >
                  <div className="w-4 h-4 rounded-full bg-[#2BAC3E]/60" />
                </div>
                <div className="w-1/2 pl-16">
                  <span className="inline-block text-[#2BAC3E]/80 font-medium mb-2 px-3 py-1 bg-[#E8F5E9]/80 rounded-full text-sm">
                    Coming Soon
                  </span>
                  <h3 className="text-3xl font-bold text-black mt-2 mb-4">
                    Campaign Management
                  </h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Advanced tools for organizing and managing buycott
                    campaigns, including real-time impact tracking and community
                    engagement features.
                  </p>
                </div>
              </motion.div>

              {/* Phase 3 */}
              <motion.div
                initial={{ opacity: 0, x: -100, filter: "blur(10px)" }}
                whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                className="relative flex items-center group"
              >
                <div className="w-1/2 pr-16 text-right">
                  <span className="inline-block text-[#2BAC3E]/60 font-medium mb-2 px-3 py-1 bg-[#E8F5E9]/60 rounded-full text-sm">
                    Future Phase
                  </span>
                  <h3 className="text-3xl font-bold text-black mt-2 mb-4">
                    Economic Intelligence
                  </h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    AI-powered insights into community spending patterns, impact
                    prediction, and strategic recommendations for maximum
                    economic effect.
                  </p>
                </div>
                <div
                  className="absolute left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full border-4 border-[#2BAC3E]/40 bg-white shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                  style={{ boxShadow: "0 0 20px rgba(43, 172, 62, 0.05)" }}
                >
                  <div className="w-4 h-4 rounded-full bg-[#2BAC3E]/40" />
                </div>
                <div className="w-1/2 pl-16" />
              </motion.div>

              {/* Phase 4 */}
              <motion.div
                initial={{ opacity: 0, x: 100, filter: "blur(10px)" }}
                whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                className="relative flex items-center group"
              >
                <div className="w-1/2 pr-16" />
                <div
                  className="absolute left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full border-4 border-[#2BAC3E]/20 bg-white shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                  style={{ boxShadow: "0 0 20px rgba(43, 172, 62, 0.025)" }}
                >
                  <div className="w-4 h-4 rounded-full bg-[#2BAC3E]/20" />
                </div>
                <div className="w-1/2 pl-16">
                  <span className="inline-block text-[#2BAC3E]/40 font-medium mb-2 px-3 py-1 bg-[#E8F5E9]/40 rounded-full text-sm">
                    Future Phase
                  </span>
                  <h3 className="text-3xl font-bold text-black mt-2 mb-4">
                    Community Marketplace
                  </h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Launch of integrated marketplace features to directly
                    connect community members with local businesses and service
                    providers.
                  </p>
                </div>
              </motion.div>

              {/* Phase 5 */}
              <motion.div
                initial={{ opacity: 0, x: -100, filter: "blur(10px)" }}
                whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                className="relative flex items-center group"
              >
                <div className="w-1/2 pr-16 text-right">
                  <span className="inline-block text-[#2BAC3E]/20 font-medium mb-2 px-3 py-1 bg-[#E8F5E9]/20 rounded-full text-sm">
                    Future Phase
                  </span>
                  <h3 className="text-3xl font-bold text-black mt-2 mb-4">
                    Economic Network
                  </h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Connect communities nationwide to create a powerful network
                    of economic action and shared resources for greater impact.
                  </p>
                </div>
                <div
                  className="absolute left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full border-4 border-[#2BAC3E]/10 bg-white shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                  style={{ boxShadow: "0 0 20px rgba(43, 172, 62, 0.01)" }}
                >
                  <div className="w-4 h-4 rounded-full bg-[#2BAC3E]/10" />
                </div>
                <div className="w-1/2 pl-16" />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <FooterWrapper />
    </>
  );
}
