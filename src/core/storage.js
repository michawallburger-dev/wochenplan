/**
 * Storage Manager
 * Verwaltet IndexedDB (Rezepte, Fotos) und localStorage (Einstellungen, Cache)
 */

const DB_NAME = 'wochenplan_db';
const DB_VERSION = 1;

const STORES = {
    recipes: 'recipes',      // Rezepte
    photos: 'photos',        // Fotos (Blobs)
    weekplans: 'weekplans',  // Wochenpläne
    feedback: 'feedback'     // Feedback-Einträge
};

class Storage {
    constructor() {
        this.db = null;
        this.initialized = false;
    }

    /**
     * Initialisiere IndexedDB
     */
    async init() {
        if (this.initialized) return;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                this.initialized = true;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Rezepte Store
                if (!db.objectStoreNames.contains(STORES.recipes)) {
                    const recipeStore = db.createObjectStore(STORES.recipes, { keyPath: 'id' });
                    recipeStore.createIndex('title', 'title', { unique: false });
                    recipeStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
                }

                // Fotos Store
                if (!db.objectStoreNames.contains(STORES.photos)) {
                    db.createObjectStore(STORES.photos, { keyPath: 'id' });
                }

                // Wochenpläne Store
                if (!db.objectStoreNames.contains(STORES.weekplans)) {
                    db.createObjectStore(STORES.weekplans, { keyPath: 'id' });
                }

                // Feedback Store
                if (!db.objectStoreNames.contains(STORES.feedback)) {
                    db.createObjectStore(STORES.feedback, { keyPath: 'id' });
                }
            };
        });
    }

    /**
     * Speichere Rezept
     */
    async saveRecipe(recipe) {
        if (!this.initialized) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.recipes], 'readwrite');
            const store = transaction.objectStore(STORES.recipes);
            const request = store.put(recipe);

            request.onsuccess = () => resolve(recipe);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Hole Rezept nach ID
     */
    async getRecipe(id) {
        if (!this.initialized) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.recipes], 'readonly');
            const store = transaction.objectStore(STORES.recipes);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Hole alle Rezepte
     */
    async getAllRecipes() {
        if (!this.initialized) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.recipes], 'readonly');
            const store = transaction.objectStore(STORES.recipes);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Lösche Rezept
     */
    async deleteRecipe(id) {
        if (!this.initialized) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.recipes], 'readwrite');
            const store = transaction.objectStore(STORES.recipes);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Speichere Foto
     */
    async savePhoto(id, blob) {
        if (!this.initialized) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.photos], 'readwrite');
            const store = transaction.objectStore(STORES.photos);
            const request = store.put({ id, blob });

            request.onsuccess = () => resolve(id);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Hole Foto
     */
    async getPhoto(id) {
        if (!this.initialized) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.photos], 'readonly');
            const store = transaction.objectStore(STORES.photos);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result?.blob);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * localStorage Helper: Speichere Setting
     */
    setSetting(key, value) {
        localStorage.setItem(`wochenplan_${key}`, JSON.stringify(value));
    }

    /**
     * localStorage Helper: Hole Setting
     */
    getSetting(key, defaultValue = null) {
        const value = localStorage.getItem(`wochenplan_${key}`);
        return value ? JSON.parse(value) : defaultValue;
    }

    /**
     * Exportiere alle Daten (für Backup/Sync)
     */
    async exportData() {
        const recipes = await this.getAllRecipes();
        return {
            recipes,
            settings: {
                lastSyncTime: this.getSetting('lastSyncTime'),
                githubToken: this.getSetting('githubToken')
            }
        };
    }

    /**
     * Importiere Daten (von GitHub oder Backup)
     */
    async importData(data) {
        if (data.recipes) {
            for (const recipe of data.recipes) {
                await this.saveRecipe(recipe);
            }
        }

        if (data.settings) {
            Object.entries(data.settings).forEach(([key, value]) => {
                if (value) this.setSetting(key, value);
            });
        }
    }
}

// Singleton
export const storage = new Storage();
