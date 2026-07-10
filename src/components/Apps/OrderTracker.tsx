import React, { useState, useEffect, useRef } from 'react';
import { Navigation, Bike, Compass, Play, MapPin, CheckCircle, Package, RefreshCw, Star, Trophy, Sparkles } from 'lucide-react';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/formatCurrency';
import api from '../../lib/api';

interface ActiveOrder {
  id: string;
  platform: string;
  platformName: string;
  customerName: string;
  address: string;
  items: string;
  status: 'Accepted' | 'Arrived at Store' | 'Order Picked Up' | 'Arrived at Customer' | 'Delivered';
  earnings: number;
  tip: number;
  distance: number; // km
  progress: number; // 0 to 100
  elapsedSeconds: number;
}

interface OrderTrackerProps {
  connectedPlatforms: string[];
  platformsList: any[];
  onOrderCompleted: () => void;
}

export default function OrderTracker({ connectedPlatforms, platformsList, onOrderCompleted }: OrderTrackerProps) {
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // List of mock details for order generator
  const customers = ['Aditi Sharma', 'Rohan Verma', 'Karan Johar', 'Neha Gupta', 'Ananya Roy', 'Priya Patel', 'Suresh Kumar'];
  const addresses = ['Sector 4, HSR Layout', 'Koramangala 5th Block', 'Indiranagar 100ft Road', 'Whitefield Prestige Palms', 'Jayanagar 4th T Block', 'Gachibowli DLF Road', 'Bandra West Link Road'];
  const foodItems = [
    '2x Veg Paneer Biryani + Coke',
    '1x Farmhouse Pizza (Medium) + Garlic Bread',
    '3x Butter Naan + 1x Kadhai Chicken',
    '1x Masala Dosa + Filter Coffee',
    '2x Premium Chocolate Ice Cream Tub',
    'Weekly Grocery Ingestion: Milk, Bread, Eggs, Bananas',
    '1x Iced Americano + Blueberry Muffin'
  ];

  // Simulator loop
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveOrders((prevOrders) => {
        if (prevOrders.length === 0) return prevOrders;

        let needsCompletionCallback = false;

        const updated = prevOrders.map((order) => {
          const nextProgress = order.progress + 8; // Advance progress
          let nextStatus = order.status;

          if (nextProgress >= 100) {
            nextStatus = 'Delivered';
          } else if (nextProgress >= 80) {
            nextStatus = 'Arrived at Customer';
          } else if (nextProgress >= 50) {
            nextStatus = 'Order Picked Up';
          } else if (nextProgress >= 25) {
            nextStatus = 'Arrived at Store';
          }

          return {
            ...order,
            progress: Math.min(nextProgress, 100),
            status: nextStatus
          };
        });

        // Check if any order just delivered and remove it, while adding it to database work log!
        const deliveredOrders = updated.filter(o => o.progress >= 100);
        if (deliveredOrders.length > 0) {
          deliveredOrders.forEach(async (completedOrder) => {
            toast.success(`🎉 Simulated Order #${completedOrder.id} Delivered! Earned ${formatCurrency(completedOrder.earnings + completedOrder.tip)}`, { duration: 5000 });
            
            // Post work log to db
            try {
              const todayStr = new Date().toISOString().split('T')[0];
              await api.post('/worklogs', {
                platform: completedOrder.platform,
                date: todayStr,
                loginTime: '12:00',
                logoutTime: '12:45',
                ordersCompleted: 1,
                distanceTravelled: completedOrder.distance,
                grossEarnings: completedOrder.earnings,
                tips: completedOrder.tip,
                bonusIncentives: 0,
                fuelCost: Math.floor(completedOrder.distance * 5), // ₹5/km fuel cost
                notes: `Automatically synchronized from completed Live Tracker trip #${completedOrder.id}`
              });
              
              needsCompletionCallback = true;
            } catch (err) {
              console.error('Failed to post completed order log', err);
            }
          });
        }

        const remaining = updated.filter(o => o.progress < 100);

        if (needsCompletionCallback) {
          setTimeout(() => onOrderCompleted(), 500);
        }

        return remaining;
      });
    }, 4000); // Progress tick every 4 seconds

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [onOrderCompleted]);

  const handleSimulateOrder = () => {
    // Pick a connected platform
    if (connectedPlatforms.length === 0) {
      toast.error('Connect at least one delivery platform to receive active orders!');
      return;
    }

    const randomConnectedPlatform = connectedPlatforms[Math.floor(Math.random() * connectedPlatforms.length)];
    const platformDetails = platformsList.find(p => p.id === randomConnectedPlatform) || { name: randomConnectedPlatform };

    const orderId = Math.floor(Math.random() * 9000 + 1000).toString();
    const customerName = customers[Math.floor(Math.random() * customers.length)];
    const address = addresses[Math.floor(Math.random() * addresses.length)];
    const items = foodItems[Math.floor(Math.random() * foodItems.length)];
    const distance = parseFloat((Math.random() * 5 + 1.5).toFixed(1)); // 1.5 - 6.5 km
    const earnings = Math.floor(distance * 12 + 40); // Base + distance rate
    const tip = Math.random() > 0.5 ? Math.floor(Math.random() * 40) + 10 : 0;

    const newOrder: ActiveOrder = {
      id: orderId,
      platform: randomConnectedPlatform,
      platformName: platformDetails.name,
      customerName,
      address,
      items,
      status: 'Accepted',
      earnings,
      tip,
      distance,
      progress: 0,
      elapsedSeconds: 0
    };

    setActiveOrders(prev => [...prev, newOrder]);
    toast.success(`🛵 New Active Order from ${platformDetails.name} dispatched!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary animate-spin-slow" />
            Active Real-time Order Tracking
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Monitor and track live delivery assignments on a route visualization.
          </p>
        </div>
        
        <Button onClick={handleSimulateOrder} className="font-semibold shadow-sm bg-primary text-white hover:bg-primary-dark">
          <Play className="w-4 h-4 mr-2" />
          Simulate New Order
        </Button>
      </div>

      {activeOrders.length === 0 ? (
        <div className="border border-border border-dashed rounded-2xl p-12 text-center bg-surface/20">
          <Bike className="w-12 h-12 text-text-secondary/40 mx-auto mb-4" />
          <h4 className="font-bold text-text-primary">No Active Orders</h4>
          <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
            Your delivery partner queues are currently quiet. Click "Simulate New Order" to dispatch an interactive delivery run.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Active Orders List */}
          <div className="xl:col-span-5 space-y-4">
            {activeOrders.map((order) => (
              <div key={order.id} className="bg-surface border border-border p-5 rounded-2xl space-y-4 shadow-sm hover:shadow transition-all relative overflow-hidden">
                {/* Platform Badge Overlay */}
                <div className="absolute top-0 right-0 left-0 h-1 bg-primary" style={{ width: `${order.progress}%` }} />
                
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-primary tracking-wider">{order.platformName} ORDER</span>
                    <h4 className="font-bold text-text-primary text-sm mt-0.5">Order #{order.id}</h4>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                    {order.status}
                  </span>
                </div>

                <div className="text-xs text-text-secondary space-y-2">
                  <div className="flex items-start gap-2">
                    <Package className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-text-primary block">Cargo Items</span>
                      {order.items}
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-error shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-text-primary block">Customer Address ({order.customerName})</span>
                      {order.address}
                    </div>
                  </div>
                </div>

                {/* Progress bar info */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] font-medium text-text-secondary">
                    <span>Restaurant Pickup</span>
                    <span>Customer Doorstep</span>
                  </div>
                  <div className="w-full bg-surface-card h-2 rounded-full overflow-hidden border border-border/60">
                    <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${order.progress}%` }} />
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="pt-3 border-t border-border flex justify-between items-center">
                  <div className="text-[10px] text-text-secondary">
                    Distance: <strong className="text-text-primary text-xs">{order.distance} km</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-text-secondary block">Est. Payout</span>
                    <strong className="text-success text-sm">{formatCurrency(order.earnings + order.tip)}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Simulated Map Visualization */}
          <div className="xl:col-span-7 bg-surface border border-border rounded-2xl p-6 flex flex-col justify-between min-h-[400px]">
            <div>
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">Live Trip Map Router</h4>
              <p className="text-[11px] text-text-secondary">Visual routing of your current active runs using visual overlay paths.</p>
            </div>

            {/* Simulated Canvas Map */}
            <div className="relative flex-1 bg-surface-card rounded-xl border border-border/60 my-4 overflow-hidden flex items-center justify-center p-4">
              {/* Dynamic Path Visualization */}
              <svg className="absolute inset-0 w-full h-full p-4" viewBox="0 0 400 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6F4E37" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#6F4E37" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
                {/* Simulated Street Grid Backdrops */}
                <path d="M 0 50 Q 150 20 200 80 T 400 40" stroke="#E7DED5" strokeWidth="4" fill="none" strokeDasharray="6,6" />
                <path d="M 50 200 L 120 0" stroke="#E7DED5" strokeWidth="3" fill="none" />
                <path d="M 280 200 L 330 0" stroke="#E7DED5" strokeWidth="3" fill="none" />
                
                {/* Active Route Draw */}
                {activeOrders.map((order, idx) => {
                  const xPos = 50 + (300 * (order.progress / 100));
                  const yPos = 120 - (50 * Math.sin((order.progress / 100) * Math.PI));
                  
                  return (
                    <g key={order.id}>
                      {/* Active Path */}
                      <path d={`M 50 120 Q 200 70 350 120`} stroke="url(#routeGrad)" strokeWidth="5" fill="none" />
                      
                      {/* Restaurant Hub Node */}
                      <circle cx="50" cy="120" r="10" fill="#6F4E37" className="animate-pulse" />
                      <text x="35" y="142" fill="#6B5B53" fontSize="10" fontWeight="bold">Store</text>

                      {/* Moving Scooter Marker */}
                      <g transform={`translate(${xPos}, ${yPos})`}>
                        <circle cx="0" cy="0" r="15" fill="#A67B5B" className="shadow-lg" />
                        <circle cx="0" cy="0" r="12" fill="#6F4E37" />
                        <g transform="translate(-6, -6) scale(0.6)">
                          <polygon points="5,5 15,10 5,15" fill="white" transform={`rotate(${order.progress > 80 ? 25 : -15}, 10, 10)`} />
                        </g>
                      </g>

                      {/* Customer Drop Node */}
                      <circle cx="350" cy="120" r="10" fill="#ef4444" />
                      <text x="325" y="142" fill="#6B5B53" fontSize="10" fontWeight="bold">Delivery</text>
                    </g>
                  );
                })}
              </svg>

              {/* Float Card Overlay */}
              <div className="absolute bottom-3 right-3 left-3 bg-surface border border-border/80 rounded-xl p-3 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Bike className="w-4 h-4 animate-bounce" />
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-text-primary block">Automatic Tracking</strong>
                    <span className="text-[10px] text-text-secondary block">Simulating GPS coordinate stream</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-text-secondary block">Ping Status</span>
                  <span className="text-[10px] font-bold text-success flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
                    LIVE COORDINATES
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-text-secondary flex gap-1.5 items-center bg-surface-card p-3 rounded-xl border border-border/60">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
              <span>Orders simulated here represent active, live delivery runs. Upon delivery completion, they are automatically consolidated and written to your earnings logs!</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
