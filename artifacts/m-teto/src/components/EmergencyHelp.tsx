import { useState } from "react";
import { AlertCircle, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

export function EmergencyHelp() {
  const [isOpen, setIsOpen] = useState(false);

  const hotlines = [
    { name: "SAPS (Police)", number: "10111", desc: "Nationwide Emergency Response" },
    { name: "GBV Hotline", number: "0800 428 428", desc: "Gender-Based Violence Command Centre" },
    { name: "Childline", number: "116", desc: "Crisis line for children" },
    { name: "Ambulance", number: "10177", desc: "Medical Emergencies" }
  ];

  return (
    <>
      <motion.div 
        whileHover={{ scale: 1.02 }} 
        whileTap={{ scale: 0.98 }}
        className="px-4 mt-2 mb-6"
      >
        <Button 
          onClick={() => setIsOpen(true)}
          className="w-full bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground font-display font-bold shadow-xl shadow-destructive/25 hover:shadow-destructive/40 py-8 text-xl rounded-2xl animate-pulse group overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          <AlertCircle className="mr-3 h-8 w-8" /> 
          EMERGENCY HELP
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-[400px] w-[90vw] rounded-3xl p-0 overflow-hidden border-destructive/20 shadow-2xl shadow-destructive/10">
              <div className="bg-destructive p-6 text-destructive-foreground relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-4 top-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
                <DialogHeader className="text-left space-y-2">
                  <DialogTitle className="font-display text-2xl font-bold flex items-center gap-2 text-white">
                    <AlertCircle className="w-7 h-7" /> Emergency Contacts
                  </DialogTitle>
                  <DialogDescription className="text-destructive-foreground/90 text-sm">
                    Tap any number below to call immediately. These services are available 24/7 in South Africa.
                  </DialogDescription>
                </DialogHeader>
              </div>
              
              <div className="p-4 flex flex-col gap-3 bg-background">
                {hotlines.map((hotline, idx) => (
                  <motion.a
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    href={`tel:${hotline.number.replace(/\s/g, '')}`}
                    className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border hover:border-destructive/50 hover:bg-destructive/5 transition-all shadow-sm active:scale-[0.98]"
                  >
                    <div>
                      <h4 className="font-bold text-foreground">{hotline.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{hotline.desc}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-3 py-1.5 rounded-full font-bold">
                      <Phone className="w-4 h-4" />
                      {hotline.number}
                    </div>
                  </motion.a>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
}
