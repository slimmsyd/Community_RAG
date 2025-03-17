"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import axios from "axios";

export default function GetStarted() {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState({ type: '', message: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const result = await axios.post("/api/newsletter", { email }); 
            
            if (result.data.success) {
                setNotificationMessage({ 
                    type: 'success', 
                    message: 'Successfully joined the waitlist!' 
                });
                setIsOpen(false);
                setEmail("");
            } else {
                setNotificationMessage({ 
                    type: 'error', 
                    message: result.data.message || 'Email already registered' 
                });
            }
        } catch (error) {
            setNotificationMessage({ 
                type: 'error', 
                message: 'Failed to join waitlist. Please try again.' 
            });
        }
        setShowNotification(true);
    };

    return (
        <div className="relative h-screen flex flex-col items-center justify-center text-center"
             style={{
                 backgroundImage: 'url("/assets/Bg_Footer.png")',
                 backgroundSize: 'cover',
                 backgroundPosition: 'center',
             }}>
            <h1 className="text-5xl font-bold text-white mb-12 max-w-3xl">
                Less time On Paperwork,<br />
                more on Passions
            </h1>
            
            <div className="flex flex-col sm:flex-row gap-6">
                {/* <Button size="lg">
                    Start automating now 
                </Button>
                 */}
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="lg">
                            Sign Up To Newsletter Bro
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                                <path d="M5 12h14m-7-7 7 7-7 7"/>
                            </svg>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">Join the Beta Waitlist</DialogTitle>
                            <DialogDescription className="text-gray-500 mt-2">
                                Be among the first to experience the future of Stripe payment automation. Get early access and shape the future of InvoiceMagi.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                            <Input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full"
                            />
                            <Button type="submit" className="w-full">
                                Join Waitlist
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={showNotification} onOpenChange={setShowNotification}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className={`text-xl ${
                                notificationMessage.type === 'success' ? 'text-green-500' : 'text-red-500'
                            }`}>
                                {notificationMessage.type === 'success' ? 'Success!' : 'Error'}
                            </DialogTitle>
                            <DialogDescription className="text-gray-500 mt-2">
                                {notificationMessage.message}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4">
                            <Button 
                                onClick={() => setShowNotification(false)}
                                className="w-full"
                                variant={notificationMessage.type === 'success' ? 'default' : 'destructive'}
                            >
                                Close
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}   