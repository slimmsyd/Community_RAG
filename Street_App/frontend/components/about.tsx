"use client"
import { motion } from "framer-motion";
import { Button } from "./ui/button";

export default function About() {
  return (
    <section className="relative w-full py-12 md:py-24 lg:py-32 xl:py-20 max-w-[500px] m-auto  text-white">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-left mb-8"
        >
          <p className="text-gray-300">
            Our life is frittered away by detail... simplify, simplify. - Henry David Thoreau,
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="text-lg text-[#9F9F9F] ">
              Many <span className="font-semibold text-white">Small Business</span> owners waste time on tedious 
              billing processes that distract them from growth. 
              With our tool, simply say, <span className="font-semibold text-white ">"Create an invoice for Jerry"</span>, 
              and watch the magic happen.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <p className="text-lg text-[#9F9F9F] ">
              <span className="font-semibold text-white">Automated Invoices</span> and payments plans at your 
              fingertips. Its not just about invoicing; you can also 
              generate professional proposals ready for signature, 
              all in one place saving your mortals your finite time
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <p className="text-lg text-[#9F9F9F] ">
              We are <span className="font-semibold text-white">backed by Stripe</span>, all you have to do is just tell 
              it who to bill and what for, and it handles the rest - 
              drafting invoices, sending them for your approval, and 
              even emailing them to clients. <span className="font-semibold text-white">    
                No more juggling 
              complex payment systems or wasting time on admin 
              task.
              </span>
            </p>
          </motion.div>

          <div className="flex justify-center flex-row gap-4  ">
            <Button>Get Started</Button> 
            <Button variant="outline">Learn More</Button> 

          </div>
        </div>
      </div>
    </section>
  );
}