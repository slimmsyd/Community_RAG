import Image from 'next/image'
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useSession, signIn } from "next-auth/react";
import router from 'next/router';
import { Session } from 'next-auth';


const PricingCard = ({ 
  title, 
  price, 
  features, 
  isBestValue = false,
  session
}: {
  title: string
  price: string
  features: string[]
  isBestValue?: boolean
  session: Session | null
}) => {


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

  const handleSignUp = () => {
    if (session) {
      router.push('/dashboard');
    } else {
      signIn('google');
    }
  }

  return (



    <div className="relative rounded-2xl border border-gray-800 p-8 flex flex-col ">
      {isBestValue && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div className="bg-yellow-400 text-black px-6 py-1 rounded-full text-sm font-medium shadow-[0_0_25px_rgba(250,204,21,0.7)]">
            Best Value
          </div>
        </div>
      )}
      
      <h3 className="text-green-500 text-xl text-center font-medium mb-4">{title}</h3>
      <p className="text-white text-2xl text-center     font-bold mb-8">{price} per /month</p>


      <div className="w-full h-[0.5px] bg-gray-800 mb-8"></div>
      
      <div className="flex-1 space-y-4">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-3">
            <Image 
              src="/assets/Checker.svg"
              alt="Check"
              width={40}
              height={40}
              className="text-green-500"
            />
            <span className="text-white">{feature}</span>
          </div>
        ))}
      </div>

      <Button
        className="mt-8 max-w-xs mx-auto cursor-pointer"
        asChild
        onClick={handleSignUp}
      >
        <span  >
          Time To Automate Bro
        </span>
      </Button>
    </div>
  )
}

export default function Pricing() {
  const { data: session } = useSession();
  const plans = [
    {
      title: "Standard",
      price: "$19.99",
      features: [
        "Auto-Create Payment Link",
        "Auto-Create Invoice",
        "Send Link To Client",
        "Send Link To You",
        "50 Proposal Sends",
      ],
      isBestValue: true
    },
    {
      title: "Premium",
      price: "$25.99",
      features: [
        "Auto-Create Payment Link",
        "Auto-Create Invoice",
        "Send Link To Client",
        "Send Link To You",
        "Unlimited Proposal Sends",
        "Auto-Generate Proposal, with timeline, objectives , and pricing"
      ]
    }
  ]

  return (
    <div className="relative grid md:grid-cols-2 gap-8 max-w-5xl mx-auto p-4">
      {/* Premium card with hover effect */}
      <div className="hidden md:block md:absolute md:right-0 md:top-4 md:w-[calc(50%-1rem)] md:h-[calc(100%-2rem)] md:opacity-70 md:blur-[2px] hover:opacity-100 hover:blur-none hover:z-20 transition-all duration-300">
        <PricingCard {...plans[1]} session={session} />
      </div>
      
      {/* Standard card that changes on Premium hover */}
      <div className="md:relative md:z-10 group-hover:blur-[2px] group-hover:z-0 transition-all duration-300">
        <PricingCard {...plans[0]} session={session} />
      </div>
      <div className="md:hidden">
        <PricingCard {...plans[1]} session={session} />
      </div>
    </div>
  )
}
