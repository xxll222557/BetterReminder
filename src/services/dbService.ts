import Cookies from 'js-cookie';
import { v4 as uuidv4 } from 'uuid';
import { Task } from '../types';

const DB_NAME = 'taskAnalyzerDB';
const STORE_NAME = 'tasks';
const DB_VERSION = 1;
const USER_ID_COOKIE = 'taskAnalyzerUserId';
const COOKIE_EXPIRY_DAYS = 7; // Set cookie to expire in 1 year

export class DbService {
  private db: IDBDatabase | null = null;
  private userId: string;
  private dbReady: Promise<void>;

  constructor() {
    this.userId = this.getUserId();
    this.dbReady = this.initDb();
  }

  private getUserId(): string {
    let userId = Cookies.get(USER_ID_COOKIE);
    if (!userId) {
      userId = uuidv4();
      Cookies.set(USER_ID_COOKIE, userId, {
        expires: COOKIE_EXPIRY_DAYS,
        secure: true,
        sameSite: 'strict',
        path: '/'
      });
    }
    return userId;
  }

  private async initDb(): Promise<void> {
    if (this.db) return;

    try {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
          console.error('Failed to open database:', request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          this.db = request.result;
          
          // Add error handler for database
          this.db.onerror = (event) => {
            console.error('Database error:', (event.target as IDBDatabase).error);
          };

          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          // Create object store if it doesn't exist
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('userId', 'userId', { unique: false });
            store.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
      });
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    await this.dbReady;
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const tasksWithMetadata = tasks.map(task => ({
      ...task,
      userId: this.userId,
      timestamp: Date.now()
    }));

    const transaction = this.db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();

      // Clear old tasks first
      const clearRequest = store.index('userId').openKeyCursor(IDBKeyRange.only(this.userId));
      
      clearRequest.onsuccess = () => {
        const cursor = clearRequest.result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        } else {
          // Add new tasks
          tasksWithMetadata.forEach(task => {
            try {
              store.add(task);
            } catch (error) {
              console.error('Failed to add task:', error);
            }
          });
        }
      };
    });
  }

  async loadTasks(): Promise<Task[]> {
    await this.dbReady;

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.index('userId').getAll(this.userId);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const tasks = request.result;
        // Sort tasks by timestamp if available
        resolve(tasks.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
      };
    });
  }
}

export const dbService = new DbService();