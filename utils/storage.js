import fs from 'fs';
import path from 'path';

// Stockage simple en fichier JSON
class Storage {
  constructor() {
    this.fallbackStoragePath = './data/users.json';
    this.ensureFallbackStorage();
  }

  ensureFallbackStorage() {
    const dataDir = path.dirname(this.fallbackStoragePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.fallbackStoragePath)) {
      fs.writeFileSync(this.fallbackStoragePath, JSON.stringify({}), 'utf8');
    }
  }

  readFallbackStorage() {
    try {
      const data = fs.readFileSync(this.fallbackStoragePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading storage:', error);
      return {};
    }
  }

  writeFallbackStorage(data) {
    try {
      fs.writeFileSync(this.fallbackStoragePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Error writing storage:', error);
      return false;
    }
  }

  async findUser(phoneNumber) {
    const users = this.readFallbackStorage();
    const user = users[phoneNumber];
    return user ? { phoneNumber, ...user } : null;
  }

  async createUser(phoneNumber, userData) {
    const users = this.readFallbackStorage();
    const userToCreate = {
      phoneNumber,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    users[phoneNumber] = userToCreate;
    this.writeFallbackStorage(users);
    return userToCreate;
  }

  async updateUser(phoneNumber, updates) {
    const users = this.readFallbackStorage();
    if (users[phoneNumber]) {
      users[phoneNumber] = { ...users[phoneNumber], ...updates, updatedAt: new Date() };
      this.writeFallbackStorage(users);
      return users[phoneNumber];
    }
    return null;
  }

  async findAllUsers() {
    const users = this.readFallbackStorage();
    return Object.keys(users).map(phoneNumber => ({
      phoneNumber,
      ...users[phoneNumber]
    }));
  }

  async getUserWithDefaults(phoneNumber) {
    const user = await this.findUser(phoneNumber);
    if (!user) {
      return {
        phoneNumber,
        prefix: '.',
        statusReadEnabled: true,
        autoReactEnabled: false
      };
    }
    return user;
  }

  getStorageStatus() {
    return {
      storageType: 'file',
      status: 'active'
    };
  }
}

export const storage = new Storage();
