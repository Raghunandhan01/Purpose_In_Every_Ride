import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Receipt, Wallet, Star, Navigation, Activity, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';

const scooterDeliveryHero = new URL('../assets/images/scooter_on_road_fixed_1783530689993.jpg', import.meta.url).href;

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-32">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[600px] h-[600px] bg-accent/20 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-sm font-semibold tracking-wide mb-6">
              Purpose in Every Ride
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-text-primary mb-8 max-w-4xl mx-auto leading-tight">
              Track your earnings, <br />
              <span className="text-primary">maximize your profit.</span>
            </h1>
            <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
              The ultimate financial dashboard for delivery riders and gig partners. 
              Understand your real income, track expenses, and ride with purpose.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto group">
                  Start Tracking Free 
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                View Demo
              </Button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-20 relative max-w-5xl mx-auto px-4 sm:px-0"
          >
            {/* Ambient Background Glows */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 blur-3xl opacity-60 rounded-3xl -z-10"></div>
            
            <div className="relative rounded-2xl border border-border bg-surface-card/30 p-2 sm:p-4 backdrop-blur-xl shadow-2xl shadow-primary/10 overflow-visible group">
              
              {/* Floating Badge 1: Smart Route Processor */}
              <motion.div
                initial={{ y: 10, x: -5 }}
                animate={{ y: -10, x: 5 }}
                transition={{
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: 4,
                  ease: "easeInOut"
                }}
                className="absolute -top-6 -left-4 sm:-left-8 z-20 flex items-center gap-3 bg-surface/95 backdrop-blur border border-border/60 p-3 rounded-2xl shadow-lg shadow-primary/5 hover:border-primary/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Navigation className="w-5 h-5 animate-pulse" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-text-primary">Optimized Routing</p>
                  <p className="text-[10px] text-emerald-500 font-medium">99.2% Efficiency</p>
                </div>
              </motion.div>

              {/* Floating Badge 2: High-Speed Analytics Sync */}
              <motion.div
                initial={{ y: -12, x: 5 }}
                animate={{ y: 12, x: -5 }}
                transition={{
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: 5,
                  ease: "easeInOut"
                }}
                className="absolute -bottom-8 -right-4 sm:-right-8 z-20 flex items-center gap-3 bg-surface/95 backdrop-blur border border-border/60 p-3 rounded-2xl shadow-lg shadow-accent/5 hover:border-accent/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-text-primary">Instant Syncing</p>
                  <p className="text-[10px] text-text-secondary font-medium">&lt; 150ms Processing</p>
                </div>
              </motion.div>

              {/* Floating Badge 3: Fuel & Savings Booster */}
              <motion.div
                initial={{ y: -6, x: -8 }}
                animate={{ y: 6, x: 8 }}
                transition={{
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: 4.5,
                  ease: "easeInOut",
                  delay: 1
                }}
                className="absolute top-1/2 -right-8 sm:-right-12 -translate-y-1/2 z-20 hidden md:flex items-center gap-3 bg-surface/95 backdrop-blur border border-border/60 p-3 rounded-2xl shadow-lg shadow-primary/5 hover:border-primary/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-text-primary">Expense Reducer</p>
                  <p className="text-[10px] text-emerald-500 font-medium">+32% Net Profit</p>
                </div>
              </motion.div>

              {/* Inner glowing graphic with overlay effects */}
              <div className="relative overflow-hidden rounded-xl border border-border/30 shadow-sm bg-gradient-to-br from-primary/5 to-accent/5 aspect-[16/9]">
                <motion.img 
                  src={scooterDeliveryHero} 
                  alt="Delivery Partner on Scooter - High Efficiency Logistics Processing" 
                  className="w-full h-full object-cover opacity-95 transition-transform duration-700 group-hover:scale-[1.02]"
                  referrerPolicy="no-referrer"
                  initial={{ scale: 1.05, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.95 }}
                  transition={{ duration: 0.8 }}
                />
                
                {/* Visual Glass overlays & Gradient lines */}
                <div className="absolute inset-0 bg-gradient-to-t from-surface/20 via-transparent to-transparent pointer-events-none"></div>
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-surface-card/50 border-t border-b border-border/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text-primary">Everything you need to manage your rides</h2>
            <p className="text-text-secondary mt-4 max-w-2xl mx-auto">Stop guessing how much you actually make. Get clear insights into your daily, weekly, and monthly performance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-surface-card border border-border transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-3">Earnings Tracking</h3>
              <p className="text-text-secondary">Log your daily trips and earnings across multiple platforms like Uber, Swiggy, and Zomato in one place.</p>
            </div>
            
            <div className="p-8 rounded-2xl bg-surface-card border border-border transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Receipt className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-3">Expense Management</h3>
              <p className="text-text-secondary">Track fuel, maintenance, and food expenses to calculate your true net profit and prepare for taxes.</p>
            </div>

            <div className="p-8 rounded-2xl bg-surface-card border border-border transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-3">Smart Analytics</h3>
              <p className="text-text-secondary">Visualize your performance with beautiful charts. Discover which platform pays best and optimize your hours.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2.5 mb-4 md:mb-0">
            <Logo size={24} id="landing-footer-logo" />
            <span className="text-lg font-bold text-text-primary tracking-tight">Scooter</span>
          </div>
          <p className="text-sm text-text-secondary">© 2026 Scooter Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
