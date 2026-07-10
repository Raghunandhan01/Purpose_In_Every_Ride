// In-memory Database simulating MongoDB
import { v4 as uuidv4 } from 'uuid';

export const db = {
  users: [] as any[],
  platforms: [
    { id: 'swiggy', name: 'Swiggy', logo: 'S', active: true },
    { id: 'zomato', name: 'Zomato', logo: 'Z', active: true },
    { id: 'rapido', name: 'Rapido', logo: 'R', active: true },
    { id: 'blinkit', name: 'Blinkit', logo: 'B', active: true },
    { id: 'zepto', name: 'Zepto', logo: 'Z', active: true },
    { id: 'instamart', name: 'Instamart', logo: 'I', active: true },
    { id: 'uber', name: 'Uber', logo: 'U', active: true },
    { id: 'bigbasket', name: 'BigBasket', logo: 'BB', active: true },
  ],
  workLogs: [] as any[],
  weeklyReports: [] as any[],
  emergencyFunds: [] as any[],
  emergencyFundTransactions: [] as any[],
};

// Seed mock data for realistic Indian gig worker data
export function seedData() {
  if (db.users.length === 0) {
    db.users.push({
      _id: 'user1',
      fullName: 'Raghu',
      email: 'raghu@gmail.com',
      password: 'hashedpassword',
      phoneNumber: '+91 98765 43210',
      vehicleType: 'Honda Activa 6G',
      preferredPlatform: 'swiggy',
      createdAt: new Date().toISOString()
    });
  }

  if (db.workLogs.length === 0) {
    const platforms = ['swiggy', 'zomato', 'rapido', 'blinkit', 'zepto', 'instamart', 'uber', 'bigbasket'];
    const today = new Date();
    
    // Generate last 30 days of data
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      platforms.forEach(platform => {
        // Randomly skip some days to make it realistic
        if (Math.random() > 0.65) return;

        // Custom realistic parameters per platform in Indian Rupees
        let basePayPerOrder = 45;
        let avgOrders = 8;
        if (platform === 'swiggy') { basePayPerOrder = 60; avgOrders = 10; }
        else if (platform === 'zomato') { basePayPerOrder = 65; avgOrders = 10; }
        else if (platform === 'rapido') { basePayPerOrder = 35; avgOrders = 14; }
        else if (platform === 'blinkit') { basePayPerOrder = 50; avgOrders = 12; }
        else if (platform === 'zepto') { basePayPerOrder = 45; avgOrders = 13; }
        else if (platform === 'instamart') { basePayPerOrder = 55; avgOrders = 11; }
        else if (platform === 'uber') { basePayPerOrder = 95; avgOrders = 6; } // higher pay, fewer orders (rides/long deliveries)
        else if (platform === 'bigbasket') { basePayPerOrder = 75; avgOrders = 7; }

        const orders = Math.floor(Math.random() * 6) + (avgOrders - 2); // realistic deviation
        const hours = (Math.random() * 3 + (platform === 'rapido' || platform === 'uber' ? 6 : 5)).toFixed(1); 
        const gross = orders * basePayPerOrder + Math.floor(Math.random() * 150); // base + distance pay + surge
        const tips = Math.random() > 0.4 ? Math.floor(Math.random() * 120) + 20 : 0;
        const incentives = orders >= avgOrders ? (Math.random() > 0.5 ? 150 : 100) : 0;
        const fuel = Math.floor(Math.random() * 80) + (platform === 'rapido' || platform === 'uber' ? 140 : 80); // higher fuel for bike-taxi / Uber
        const otherExpenses = Math.random() > 0.8 ? Math.floor(Math.random() * 50) : 0;
        const net = gross + tips + incentives - fuel - otherExpenses;

        db.workLogs.push({
          _id: uuidv4(),
          userId: 'user1',
          platform: platform,
          date: dateString,
          loginTime: '08:30',
          logoutTime: `${(8 + Math.floor(Number(hours)))}:00`,
          hoursWorked: Number(hours),
          ordersCompleted: orders,
          distanceTravelled: Math.floor(orders * (platform === 'rapido' ? 5.2 : 3.8)),
          grossEarnings: gross,
          tips: tips,
          bonusIncentives: incentives,
          fuelCost: fuel,
          otherExpenses: otherExpenses,
          totalEarnings: gross + tips + incentives,
          netProfit: net,
          status: 'Completed',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });
    }
  }

  if (db.emergencyFunds.length === 0) {
    const fund1Id = 'fund-vehicle';
    const fund2Id = 'fund-medical';
    const today = new Date();
    
    // Vehicle Repair Fund
    db.emergencyFunds.push({
      _id: fund1Id,
      userId: 'user1',
      name: 'Scooter Engine Maintenance',
      category: 'Vehicle Repair',
      targetAmount: 15000,
      currentSavings: 8500,
      preferredCompletionDate: new Date(today.getFullYear(), today.getMonth() + 2, 15).toISOString().split('T')[0],
      monthlyExpenseEstimate: 4000,
      status: 'Active',
      allocationRule: 'Percentage',
      allocationPercentage: 10,
      createdAt: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Medical Emergency Fund
    db.emergencyFunds.push({
      _id: fund2Id,
      userId: 'user1',
      name: 'Family Health Cover',
      category: 'Medical Emergency',
      targetAmount: 30000,
      currentSavings: 15000,
      preferredCompletionDate: new Date(today.getFullYear(), today.getMonth() + 4, 1).toISOString().split('T')[0],
      monthlyExpenseEstimate: 10000,
      status: 'Active',
      allocationRule: 'Surplus',
      allocationPercentage: 15,
      createdAt: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Seed some transactions for Vehicle Repair Fund
    db.emergencyFundTransactions.push(
      {
        _id: uuidv4(),
        userId: 'user1',
        fundId: fund1Id,
        type: 'Contribution',
        amount: 3000,
        source: 'Manual',
        date: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Initial deposit',
        createdAt: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: uuidv4(),
        userId: 'user1',
        fundId: fund1Id,
        type: 'Contribution',
        amount: 2500,
        source: 'Auto-allocation',
        date: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: '10% Weekly earnings allocation',
        createdAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: uuidv4(),
        userId: 'user1',
        fundId: fund1Id,
        type: 'Contribution',
        amount: 3000,
        source: 'Earnings Surplus',
        date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Weekend surplus bonus transfer',
        createdAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    );

    // Seed some transactions for Medical Fund
    db.emergencyFundTransactions.push(
      {
        _id: uuidv4(),
        userId: 'user1',
        fundId: fund2Id,
        type: 'Contribution',
        amount: 5000,
        source: 'Manual',
        date: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Starting fund allocation',
        createdAt: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: uuidv4(),
        userId: 'user1',
        fundId: fund2Id,
        type: 'Contribution',
        amount: 5000,
        source: 'System Recommendation',
        date: new Date(today.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'AI Recommended surplus sweep',
        createdAt: new Date(today.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: uuidv4(),
        userId: 'user1',
        fundId: fund2Id,
        type: 'Contribution',
        amount: 5000,
        source: 'Manual',
        date: new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Monthly savings goal deposit',
        createdAt: new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString()
      }
    );
  }
}

seedData();

// Mock Mongoose Model Wrapper
export class MockModel {
  collection: string;
  constructor(collection: string) {
    this.collection = collection;
  }

  async find(query: any = {}): Promise<any[]> {
    let data = (db as any)[this.collection];
    
    if (query.userId) {
      data = data.filter((d: any) => d.userId === query.userId);
    }
    if (query.platform) {
      data = data.filter((d: any) => d.platform === query.platform);
    }
    
    // Hacky mock query handling for date ranges
    if (query.date && query.date.$gte && query.date.$lte) {
       data = data.filter((d: any) => d.date >= query.date.$gte && d.date <= query.date.$lte);
    }
    
    // Monkeypatch sort to array for simple chaining in mock
    const result: any[] = [...data];
    (result as any).sort = (sortObj: any) => {
      if (typeof sortObj === 'function') {
        return Array.prototype.sort.call(result, sortObj);
      }
      const key = Object.keys(sortObj)[0];
      const dir = sortObj[key];
      return Array.prototype.sort.call(result, (a: any, b: any) => {
        if (a[key] < b[key]) return dir === -1 ? 1 : -1;
        if (a[key] > b[key]) return dir === -1 ? -1 : 1;
        return 0;
      });
    };
    
    return result;
  }

  async findOne(query: any) {
    const data = (db as any)[this.collection];
    return data.find((d: any) => {
      let match = true;
      for (const key in query) {
        if (d[key] !== query[key]) match = false;
      }
      return match;
    });
  }

  async findById(id: string) {
    const data = (db as any)[this.collection];
    return data.find((d: any) => d._id === id || d.id === id);
  }

  async create(data: any) {
    const newItem = {
      _id: uuidv4(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    (db as any)[this.collection].push(newItem);
    return newItem;
  }

  async findByIdAndUpdate(id: string, data: any, options: any) {
    const index = (db as any)[this.collection].findIndex((d: any) => d._id === id || d.id === id);
    if (index === -1) return null;
    
    const updated = {
      ...(db as any)[this.collection][index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    (db as any)[this.collection][index] = updated;
    return updated;
  }

  async findByIdAndDelete(id: string) {
    const index = (db as any)[this.collection].findIndex((d: any) => d._id === id || d.id === id);
    if (index === -1) return null;
    
    const deleted = (db as any)[this.collection][index];
    (db as any)[this.collection].splice(index, 1);
    return deleted;
  }
}
