import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { MongooseUser, MongoosePlatform, MongooseWorkLog } from '../models/mongooseSchemas.js';
import { DEFAULT_PLATFORMS } from '../constants/platforms.js';

dotenv.config();

// Function to generate ~150 realistic Indian gig worker work logs
export const seedDatabase = async (mongoURI: string) => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoURI);
    }

    // 1. Clear existing collection data
    await MongooseWorkLog.deleteMany({});
    await MongoosePlatform.deleteMany({});
    console.log('🧹 Cleaned existing work logs and platforms.');

    // 2. Seed Platforms
    const platforms = await MongoosePlatform.insertMany(DEFAULT_PLATFORMS);
    console.log(`🎮 Seeded ${platforms.length} platforms.`);

    // 3. Find or Create Default User
    let user = await MongooseUser.findOne({ email: 'raghu@gmail.com' });
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('qwertyuiop', salt);
      
      user = await MongooseUser.create({
        fullName: 'Raghu',
        email: 'raghu@gmail.com',
        password: hashedPassword,
        phoneNumber: '+91 98765 43210',
        vehicleType: 'Honda Activa 6G',
        preferredPlatform: 'swiggy',
      });
      console.log('👤 Created default seed user.');
    } else {
      console.log('👤 Default seed user already exists.');
    }

    // 4. Generate ~150-180 realistic work logs for the last 30 days
    const platformIds = ['swiggy', 'zomato', 'rapido', 'blinkit', 'zepto', 'instamart'];
    const today = new Date();
    const workLogsToInsert = [];

    console.log('📅 Generating 30 days of realistic platform logs...');
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      for (const platformId of platformIds) {
        // Randomly skip about 40% of shifts to mimic real schedules and multi-apping
        if (Math.random() > 0.6) continue;

        // Custom realistic parameters per platform in Indian Rupees (INR)
        let basePayPerOrder = 45;
        let avgOrders = 8;
        if (platformId === 'swiggy') { basePayPerOrder = 60; avgOrders = 10; }
        else if (platformId === 'zomato') { basePayPerOrder = 65; avgOrders = 10; }
        else if (platformId === 'rapido') { basePayPerOrder = 35; avgOrders = 14; }
        else if (platformId === 'blinkit') { basePayPerOrder = 50; avgOrders = 12; }
        else if (platformId === 'zepto') { basePayPerOrder = 45; avgOrders = 13; }
        else if (platformId === 'instamart') { basePayPerOrder = 55; avgOrders = 11; }

        const orders = Math.floor(Math.random() * 8) + (avgOrders - 3); // deviation
        const hours = Number((Math.random() * 3 + (platformId === 'rapido' ? 6 : 5)).toFixed(1));
        const gross = orders * basePayPerOrder + Math.floor(Math.random() * 150); // base + distance/surge
        const tips = Math.random() > 0.4 ? Math.floor(Math.random() * 120) + 20 : 0;
        const incentives = orders >= avgOrders ? (Math.random() > 0.5 ? 150 : 100) : 0;
        const fuel = Math.floor(Math.random() * 80) + (platformId === 'rapido' ? 120 : 80); // fuel cost
        const parking = Math.random() > 0.3 ? 20 : 0;
        const food = Math.random() > 0.5 ? 60 : 0;
        const otherExpenses = Math.random() > 0.8 ? Math.floor(Math.random() * 50) : 0;

        const totalEarnings = gross + tips + incentives;
        const totalExpenses = fuel + parking + food + otherExpenses;
        const netProfit = totalEarnings - totalExpenses;

        const avgEarningsPerHour = hours > 0 ? Number((totalEarnings / hours).toFixed(2)) : totalEarnings;
        const avgEarningsPerOrder = orders > 0 ? Number((totalEarnings / orders).toFixed(2)) : totalEarnings;

        workLogsToInsert.push({
          userId: user._id,
          platform: platformId,
          date: dateString,
          loginTime: '08:30',
          logoutTime: `${(8 + Math.floor(hours))}:${Math.random() > 0.5 ? '30' : '00'}`,
          hoursWorked: hours,
          ordersCompleted: orders,
          distanceTravelled: Math.floor(orders * (platformId === 'rapido' ? 5.2 : 3.8)),
          grossEarnings: gross,
          tips: tips,
          bonusIncentives: incentives,
          fuelCost: fuel,
          parkingCost: parking,
          foodExpense: food,
          otherExpenses: otherExpenses,
          totalEarnings,
          totalExpenses,
          netProfit,
          avgEarningsPerHour,
          avgEarningsPerOrder,
          notes: Math.random() > 0.7 ? 'Heavy rain during shift' : 'Smooth shift, good tips',
          status: 'Completed',
        });
      }
    }

    const seededLogs = await MongooseWorkLog.insertMany(workLogsToInsert);
    console.log(`✅ Seeding complete! Successfully seeded ${seededLogs.length} work logs.`);
    return seededLogs.length;
  } catch (error: any) {
    console.error(`❌ Seeding failed: ${error.message}`);
    throw error;
  }
};

// If run directly
if (process.argv[2] === '--run') {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ Cannot run seeder: MONGODB_URI is not set in environment.');
    process.exit(1);
  }
  seedDatabase(uri)
    .then(() => {
      console.log('🎉 Seeding script completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Seeding process error:', err);
      process.exit(1);
    });
}
