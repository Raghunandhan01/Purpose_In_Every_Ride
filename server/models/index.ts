import { isUsingRealMongoDB } from '../config/db.js';
import { MongooseUser, MongoosePlatform, MongooseWorkLog, MongooseWeeklyReport, MongooseEmergencyFund, MongooseEmergencyFundTransaction } from './mongooseSchemas.js';
import { db } from '../mockDB.js';
import { v4 as uuidv4 } from 'uuid';

// Helper to match Mongoose query operators
function matchesQuery(item: any, query: any): boolean {
  if (!query) return true;
  for (const key in query) {
    const queryVal = query[key];
    const itemVal = item[key];
    
    if (queryVal && typeof queryVal === 'object' && !Array.isArray(queryVal)) {
      if ('$gte' in queryVal && '$lte' in queryVal) {
        if (!(itemVal >= queryVal.$gte && itemVal <= queryVal.$lte)) return false;
      } else if ('$gte' in queryVal) {
        if (!(itemVal >= queryVal.$gte)) return false;
      } else if ('$lte' in queryVal) {
        if (!(itemVal <= queryVal.$lte)) return false;
      } else if ('$regex' in queryVal) {
        const flags = queryVal.$options || '';
        const regex = new RegExp(queryVal.$regex, flags);
        if (!regex.test(itemVal || '')) return false;
      } else if ('$ne' in queryVal) {
        if (itemVal === queryVal.$ne) return false;
      } else if ('$in' in queryVal) {
        if (!Array.isArray(queryVal.$in) || !queryVal.$in.includes(itemVal)) return false;
      }
    } else {
      // Direct comparison. Note: convert _id / id or mongoose ObjectIds to strings for safe comparison
      const strVal = (val: any) => val?.toString ? val.toString() : val;
      if (key === '_id' || key === 'userId') {
        if (strVal(itemVal) !== strVal(queryVal)) return false;
      } else {
        if (itemVal !== queryVal) return false;
      }
    }
  }
  return true;
}

// Chainable query helper
class MockQuery<T> implements PromiseLike<T[]> {
  private items: T[];
  constructor(items: T[]) {
    this.items = items;
  }
  sort(sortObj: any) {
    if (!sortObj) return this;
    const key = Object.keys(sortObj)[0];
    const dir = sortObj[key];
    this.items.sort((a: any, b: any) => {
      let valA = a[key];
      let valB = b[key];
      if (typeof valA === 'string' && typeof valB === 'string') {
        return dir === -1 ? valB.localeCompare(valA) : valA.localeCompare(valB);
      }
      if (valA < valB) return dir === -1 ? 1 : -1;
      if (valA > valB) return dir === -1 ? -1 : 1;
      return 0;
    });
    return this;
  }
  skip(n: number) {
    this.items = this.items.slice(n);
    return this;
  }
  limit(n: number) {
    this.items = this.items.slice(0, n);
    return this;
  }
  populate(path: string) {
    return this;
  }
  lean() {
    return this;
  }
  async exec() {
    return this.items;
  }
  then<TResult1 = T[], TResult2 = never>(
    onfulfilled?: ((value: T[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.items).then(onfulfilled, onrejected);
  }
}

// Custom wrapper class
class ModelWrapper {
  private collectionName: 'users' | 'platforms' | 'workLogs' | 'weeklyReports' | 'emergencyFunds' | 'emergencyFundTransactions';
  private mongooseModel: any;

  constructor(collectionName: 'users' | 'platforms' | 'workLogs' | 'weeklyReports' | 'emergencyFunds' | 'emergencyFundTransactions', mongooseModel: any) {
    this.collectionName = collectionName;
    this.mongooseModel = mongooseModel;
  }

  find(query: any = {}) {
    if (isUsingRealMongoDB()) {
      return this.mongooseModel.find(query);
    }
    const filtered = db[this.collectionName].filter(item => matchesQuery(item, query));
    // Create a copy of the list so modifications to list copies don't mess up the cache
    return new MockQuery(JSON.parse(JSON.stringify(filtered)));
  }

  async findOne(query: any) {
    if (isUsingRealMongoDB()) {
      return await this.mongooseModel.findOne(query);
    }
    const item = db[this.collectionName].find(item => matchesQuery(item, query));
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  async findById(id: any) {
    if (isUsingRealMongoDB()) {
      return await this.mongooseModel.findById(id);
    }
    const strId = id?.toString ? id.toString() : id;
    const item = db[this.collectionName].find((item: any) => item._id === strId || item.id === strId);
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  async create(data: any) {
    if (isUsingRealMongoDB()) {
      return await this.mongooseModel.create(data);
    }
    const nowStr = new Date().toISOString();
    const newItem = {
      _id: uuidv4(),
      ...data,
      createdAt: nowStr,
      updatedAt: nowStr,
    };
    db[this.collectionName].push(newItem);
    return JSON.parse(JSON.stringify(newItem));
  }

  async findByIdAndUpdate(id: any, data: any, options: any = {}) {
    if (isUsingRealMongoDB()) {
      return await this.mongooseModel.findByIdAndUpdate(id, data, options);
    }
    const strId = id?.toString ? id.toString() : id;
    const index = db[this.collectionName].findIndex((item: any) => item._id === strId || item.id === strId);
    if (index === -1) return null;

    // Handle Mongoose-style update commands (like $set) if any, else direct merge
    const updatePayload = data.$set ? { ...data, ...data.$set } : data;
    delete updatePayload.$set;

    const updatedItem = {
      ...db[this.collectionName][index],
      ...updatePayload,
      updatedAt: new Date().toISOString(),
    };
    db[this.collectionName][index] = updatedItem;
    return JSON.parse(JSON.stringify(updatedItem));
  }

  async findByIdAndDelete(id: any) {
    if (isUsingRealMongoDB()) {
      return await this.mongooseModel.findByIdAndDelete(id);
    }
    const strId = id?.toString ? id.toString() : id;
    const index = db[this.collectionName].findIndex((item: any) => item._id === strId || item.id === strId);
    if (index === -1) return null;
    const deleted = db[this.collectionName][index];
    db[this.collectionName].splice(index, 1);
    return JSON.parse(JSON.stringify(deleted));
  }

  async countDocuments(query: any = {}) {
    if (isUsingRealMongoDB()) {
      return await this.mongooseModel.countDocuments(query);
    }
    const filtered = db[this.collectionName].filter(item => matchesQuery(item, query));
    return filtered.length;
  }

  // Support for custom aggregations
  async aggregate(pipeline: any[]) {
    if (isUsingRealMongoDB()) {
      return await this.mongooseModel.aggregate(pipeline);
    }
    // Aggregate fallback is handled gracefully in service layers or here
    return [];
  }
}

export const User = new ModelWrapper('users', MongooseUser);
export const Platform = new ModelWrapper('platforms', MongoosePlatform);
export const WorkLog = new ModelWrapper('workLogs', MongooseWorkLog);
export const WeeklyReport = new ModelWrapper('weeklyReports', MongooseWeeklyReport);
export const EmergencyFund = new ModelWrapper('emergencyFunds', MongooseEmergencyFund);
export const EmergencyFundTransaction = new ModelWrapper('emergencyFundTransactions', MongooseEmergencyFundTransaction);
