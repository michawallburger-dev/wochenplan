/**
 * Recipe Manager
 * CRUD-Operationen für Rezepte
 */

import { storage } from './storage.js';
import { generateUUID } from '../utils/helpers.js';

class RecipeManager {
    /**
     * Erstelle neues Rezept
     */
    async createRecipe(data) {
        const recipe = {
            id: generateUUID(),
            title: data.title,
            source: data.source || null,
            cookTime: parseInt(data.cookTime) || null,
            difficulty: data.difficulty || 'medium',
            ingredients: this.parseIngredients(data.ingredients),
            instructions: data.instructions || '',
            tags: this.parseTags(data.tags),
            photos: data.photos || [],

            variants: {
                children: {
                    ingredients: data.childrenIngredients || [],
                    instructions: data.childrenInstructions || '',
                    notes: data.childrenNotes || ''
                }
            },

            feedback: {
                childrenRating: null,
                adultsRating: null,
                lastUsed: null,
                timeTaken: null,
                notes: [],
                occurrences: 0
            },

            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await storage.saveRecipe(recipe);
        return recipe;
    }

    /**
     * Bearbeite Rezept
     */
    async updateRecipe(id, updates) {
        const recipe = await storage.getRecipe(id);
        if (!recipe) throw new Error(`Rezept ${id} nicht gefunden`);

        const updated = {
            ...recipe,
            ...updates,
            ingredients: updates.ingredients ? this.parseIngredients(updates.ingredients) : recipe.ingredients,
            tags: updates.tags ? this.parseTags(updates.tags) : recipe.tags,
            updatedAt: new Date().toISOString()
        };

        await storage.saveRecipe(updated);
        return updated;
    }

    /**
     * Hole Rezept
     */
    async getRecipe(id) {
        return await storage.getRecipe(id);
    }

    /**
     * Hole alle Rezepte
     */
    async getAllRecipes() {
        return await storage.getAllRecipes();
    }

    /**
     * Lösche Rezept
     */
    async deleteRecipe(id) {
        await storage.deleteRecipe(id);
    }

    /**
     * Speichere Feedback zu Rezept
     */
    async addFeedback(recipeId, feedback) {
        const recipe = await storage.getRecipe(recipeId);
        if (!recipe) throw new Error(`Rezept ${recipeId} nicht gefunden`);

        recipe.feedback.childrenRating = feedback.childrenRating || recipe.feedback.childrenRating;
        recipe.feedback.adultsRating = feedback.adultsRating || recipe.feedback.adultsRating;
        recipe.feedback.lastUsed = new Date().toISOString();
        recipe.feedback.timeTaken = feedback.timeTaken || null;

        if (feedback.notes) {
            recipe.feedback.notes.push({
                text: feedback.notes,
                date: new Date().toISOString()
            });
        }

        recipe.feedback.occurrences++;
        recipe.updatedAt = new Date().toISOString();

        await storage.saveRecipe(recipe);
        return recipe;
    }

    /**
     * Suche Rezepte nach Tag
     */
    async searchByTag(tag) {
        const all = await storage.getAllRecipes();
        return all.filter(r => r.tags.includes(tag.toLowerCase()));
    }

    /**
     * Suche Rezepte nach Text
     */
    async search(query) {
        const all = await storage.getAllRecipes();
        const q = query.toLowerCase();

        return all.filter(r =>
            r.title.toLowerCase().includes(q) ||
            r.ingredients.some(i => i.name.toLowerCase().includes(q)) ||
            r.tags.some(t => t.toLowerCase().includes(q))
        );
    }

    /**
     * Hole Top-bewertete Rezepte
     */
    async getTopRated(limit = 10) {
        const all = await storage.getAllRecipes();

        return all
            .filter(r => r.feedback.childrenRating !== null)
            .sort((a, b) => (b.feedback.childrenRating || 0) - (a.feedback.childrenRating || 0))
            .slice(0, limit);
    }

    /**
     * Hole oft gekochte Rezepte
     */
    async getMostCooked(limit = 10) {
        const all = await storage.getAllRecipes();

        return all
            .sort((a, b) => b.feedback.occurrences - a.feedback.occurrences)
            .slice(0, limit);
    }

    /**
     * Parse Zutaten-String (eine pro Zeile) in Array
     */
    parseIngredients(ingredientString) {
        if (Array.isArray(ingredientString)) return ingredientString;

        return ingredientString
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => {
                // Versuche zu parsen: "500g Hackfleisch" -> {amount: 500, unit: 'g', name: 'Hackfleisch'}
                const match = line.match(/^([\d.]+)\s*([a-zA-Z]*)\s+(.+)$/);

                if (match) {
                    return {
                        amount: parseFloat(match[1]),
                        unit: match[2] || '',
                        name: match[3]
                    };
                }

                // Fallback: nur Zutat ohne Menge
                return {
                    amount: null,
                    unit: '',
                    name: line
                };
            });
    }

    /**
     * Parse Tags-String (komma-getrennt)
     */
    parseTags(tagString) {
        if (Array.isArray(tagString)) return tagString;

        return tagString
            .split(',')
            .map(tag => tag.trim().toLowerCase())
            .filter(tag => tag.length > 0);
    }
}

export const recipeManager = new RecipeManager();
