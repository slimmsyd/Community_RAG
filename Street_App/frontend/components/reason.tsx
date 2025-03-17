"use client";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function Reason() {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: false,
    margin: "0px 0px -200px 0px",
  });

  const flowItems = [
    {
      type: "text",
      content: "Create an invoice or payment link for Jonas at price of $200",
    },
    { type: "connector" },
    { type: "arrow" },
    { type: "connector" },
    { type: "text", content: "Link Created At : https://buy.stripe.com/subtoapp" },
    { type: "connector" },
    { type: "text", content: 'Receive URL link at "indiehacking@gmail.com"' },
    { type: "connector" },
    { type: "decision", content: "Proposal Good?" },
    { type: "connector" },
    { type: "text", content: "send to client" },
  ];

  const itemVariants = {
    hidden: { opacity: 0.3 },
    visible: { opacity: 1 },
  };

  return (
    <section className=" text-white py-20">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {/* Card 1 */}

          <div className="flex flex-col">
            <div className="flex flex-col sm:flex-col  gap-4 w-full">
              <div className="flex-1 relative p-6 md:p-8 rounded-2xl border border-gray-800  hover:border-gray-700 transition-all group min-h-[200px] md:max-h-[276px]">
                <h3 className="text-xl md:text-2xl font-bold mb-4">Save Time</h3>
                <div className="space-y-2">
                  <p className="text-sm md:text-base text-gray-400">
                    Write, Type, submit. You invoice is made
                  </p>
                  <p className="text-sm md:text-base text-gray-400">Focus on what matters</p>
                </div>
                <button className="absolute bottom-6 md:bottom-8 right-6 md:right-8 w-8 md:w-10 h-8 md:h-10 rounded-full border border-gray-800 flex items-center justify-center group-hover:border-gray-700">
                  <span className="text-lg md:text-xl">+</span>
                </button>
              </div>
              <div className="flex-1 relative p-6 md:p-8 rounded-2xl border border-gray-800  hover:border-gray-700 transition-all group min-h-[200px] md:max-h-[276px]">
                <h3 className="text-xl md:text-2xl font-bold mb-4">
                  Generate profesional propals
                </h3>
                <div className="space-y-2">
                  <p className="text-sm md:text-base text-gray-400">
                    Easy, generate a professional proposals, for you to easily
                    export as PDFS, complete with signature options
                  </p>
                </div>
                <button className="absolute bottom-6 md:bottom-8 right-6 md:right-8 w-8 md:w-10 h-8 md:h-10 rounded-full border border-gray-800 flex items-center justify-center group-hover:border-gray-700">
                  <span className="text-lg md:text-xl">+</span>
                </button>
              </div>

            
            </div>
            <div className = "flex flex-col  mt-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Made to save time and get paid
              </h2>
              <p className="text-sm md:text-base text-gray-400">
                Focus on what matters, and let Invoicemagi handle the rest
                <br />
                Automate the admin.
              </p>
            </div>
          </div>

          {/* Flow Diagram */}
          <motion.div
            ref={ref}
            className="relative p-8 rounded-2xl border border-gray-800  hover:border-gray-700 transition-all"
          >
            <div className="flex flex-col items-center space-y-4">
              {flowItems.map((item, index) => {
                switch (item.type) {
                  case "connector":
                    return (
                      <motion.div
                        key={`connector-${index}`}
                        initial="hidden"
                        animate={isInView ? "visible" : "hidden"}
                        variants={itemVariants}
                        transition={{ delay: index * 0.5, duration: 0.5 }}
                        className="h-8 w-0.5 bg-gray-800 "
                      />



                      
                    );


                  case "arrow":
                    return (
                      <motion.div
                        key={`arrow-${index}`}
                        initial="hidden"
                        animate={isInView ? "visible" : "hidden"}
                        variants={itemVariants}
                        transition={{ delay: index * 0.5, duration: 0.5 }}
                        className="rotate-45 w-8 h-8 border border-gray-800"
                      >
                        <img 
                          src="/assets/Checker.svg" 
                          alt="Arrow"
                          className="w-[36px] h-[36px]"
                        />
                      </motion.div>
                    );

                  case "decision":
                    return (
                      <motion.div
                        key={`decision-${index}`}
                        initial="hidden"
                        animate={isInView ? "visible" : "hidden"}
                        variants={itemVariants}
                        transition={{ delay: index * 0.5, duration: 0.5 }}
                        className="relative "
                      >
                        <img 
                          src="/assets/Checker.svg" 
                          alt="Checker"
                          className="w-[36px] h-[36px]"
                        />
                        <span className="absolute whitespace-nowrap right-[-60px] text-gray-400">
                          {item.content}
                        </span>
                      </motion.div>
                    );

                  case "text":
                    return (
                      <motion.div
                        key={`text-${index}`}
                        initial="hidden"
                        animate={isInView ? "visible" : "hidden"}
                        variants={itemVariants}
                        transition={{ delay: index * 0.5, duration: 0.5 }}
                        className="text-center text-sm text-gray-400 p-4 border border-gray-800 rounded-lg w-full"
                      >
                        {item.content}
                      </motion.div>
                    );
                }
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
