/**
 * Wochenplan App - Haupteinstiegspunkt
 */

import { storage } from './core/storage.js';
import { recipeManager } from './core/recipe.js';
import { generateUUID, formatDate } from './utils/helpers.js';

class WochenplanApp {
    constructor() {
        this.currentView = 'recipes';
        this.recipes = [];
    }

    /**
     * Initialisiere App
     */
    async init() {
        console.log('🍽️ Wochenplan App startet...');

        // Storage initialisieren
        await storage.init();
        console.log('✅ Storage initialisiert');

        // PWA registrieren (Service Worker)
        this.registerServiceWorker();

        // Event Listener
        this.setupEventListeners();

        // Rezepte laden
        await this.loadRecipes();

        // Initial View rendern
        this.renderRecipesView();

        console.log('✅ App bereit!');
    }

    /**
     * Registriere Service Worker (PWA)
     */
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(err => {
                console.warn('Service Worker Registration failed:', err);
            });
        }
    }

    /**
     * Setup Event Listener
     */
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });

        // Rezept-Form
        document.getElementById('recipe-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRecipeFormSubmit();
        });
    }

    /**
     * Wechsle View
     */
    switchView(viewName) {
        // Update nav
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewName);
        });

        // Update containers
        document.querySelectorAll('.container').forEach(container => {
            container.classList.remove('active');
        });

        // Zeige neue View
        const viewId = `${viewName}-view`;
        const viewElement = document.getElementById(viewId);
        if (viewElement) {
            viewElement.classList.add('active');
        }

        this.currentView = viewName;

        // View-spezifische Aktionen
        if (viewName === 'recipes') {
            this.renderRecipesView();
        } else if (viewName === 'add-recipe') {
            this.resetRecipeForm();
        }
    }

    /**
     * Lade Rezepte aus Storage
     */
    async loadRecipes() {
        this.recipes = await recipeManager.getAllRecipes();
        console.log(`📚 ${this.recipes.length} Rezepte geladen`);
    }

    /**
     * Render Rezepte-Übersicht
     */
    renderRecipesView() {
        const grid = document.getElementById('recipe-grid');
        const emptyState = document.getElementById('recipes-empty');

        grid.innerHTML = '';

        if (this.recipes.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        this.recipes.forEach(recipe => {
            grid.appendChild(this.createRecipeCard(recipe));
        });
    }

    /**
     * Erstelle Rezept-Karte
     */
    createRecipeCard(recipe) {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.innerHTML = `
            <h3>${this.escapeHtml(recipe.title)}</h3>
            <div class="meta">
                <span>⏱️ ${recipe.cookTime ? recipe.cookTime + ' min' : 'N/A'}</span>
                <span>📊 ${this.getDifficultyEmoji(recipe.difficulty)}</span>
                ${recipe.feedback.childrenRating ?
                    `<span>👧👦 ${this.getRatingStars(recipe.feedback.childrenRating)}</span>`
                    : ''}
            </div>
            <div class="tags">
                ${recipe.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                <button class="btn-secondary" onclick="app.viewRecipe('${recipe.id}')">👁️ Ansehen</button>
                <button class="btn-danger" onclick="app.deleteRecipe('${recipe.id}')">🗑️ Löschen</button>
            </div>
        `;

        return card;
    }

    /**
     * Hole Rezept-Detail (für später: Modal/neue Seite)
     */
    async viewRecipe(id) {
        const recipe = await recipeManager.getRecipe(id);
        console.log('Recipe:', recipe);

        // TODO: Modal oder Detail-Page öffnen
        alert(`Rezept: ${recipe.title}\n\nOeffnen Sie die Browser-Console für Details.`);
    }

    /**
     * Lösche Rezept
     */
    async deleteRecipe(id) {
        if (!confirm('Rezept wirklich löschen?')) return;

        await recipeManager.deleteRecipe(id);
        await this.loadRecipes();
        this.renderRecipesView();
        alert('✅ Rezept gelöscht');
    }

    /**
     * Verarbeite Rezept-Form Submit
     */
    async handleRecipeFormSubmit() {
        const title = document.getElementById('recipe-title').value.trim();
        const source = document.getElementById('recipe-source').value.trim();
        const cookTime = document.getElementById('recipe-cooktime').value;
        const difficulty = document.getElementById('recipe-difficulty').value;
        const ingredients = document.getElementById('recipe-ingredients').value.trim();
        const instructions = document.getElementById('recipe-instructions').value.trim();
        const tags = document.getElementById('recipe-tags').value.trim();
        const childrenNotes = document.getElementById('recipe-children-notes').value.trim();

        if (!title) {
            alert('❌ Rezept-Name erforderlich');
            return;
        }

        try {
            const recipe = await recipeManager.createRecipe({
                title,
                source,
                cookTime,
                difficulty,
                ingredients,
                instructions,
                tags,
                childrenNotes,
                photos: []
            });

            console.log('✅ Rezept erstellt:', recipe);

            // Foto-Upload (falls vorhanden)
            const photoInput = document.getElementById('recipe-photos');
            if (photoInput.files.length > 0) {
                await this.handlePhotoUpload(recipe.id, photoInput.files);
            }

            // Reset Form
            this.resetRecipeForm();

            // Zurück zu Rezepte-View
            await this.loadRecipes();
            this.switchView('recipes');

            alert('✅ Rezept gespeichert!');
        } catch (error) {
            console.error('Fehler beim Erstellen des Rezepts:', error);
            alert('❌ Fehler: ' + error.message);
        }
    }

    /**
     * Verarbeite Foto-Upload
     */
    async handlePhotoUpload(recipeId, files) {
        const recipe = await recipeManager.getRecipe(recipeId);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const photoId = generateUUID();

            try {
                await storage.savePhoto(photoId, file);
                recipe.photos.push(photoId);
                console.log(`✅ Foto ${i + 1} gespeichert`);
            } catch (error) {
                console.error(`Fehler beim Speichern von Foto ${i + 1}:`, error);
            }
        }

        await storage.saveRecipe(recipe);
    }

    /**
     * Reset Rezept-Form
     */
    resetRecipeForm() {
        document.getElementById('recipe-form').reset();
    }

    /**
     * Hilfsfunktionen UI
     */

    getDifficultyEmoji(difficulty) {
        const emojis = {
            easy: '🟢',
            medium: '🟡',
            hard: '🔴'
        };
        return emojis[difficulty] || '⚪';
    }

    getRatingStars(rating) {
        return '⭐'.repeat(Math.round(rating));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialisiere App
const app = new WochenplanApp();
app.init().catch(err => {
    console.error('❌ App Init Error:', err);
});

// Expose global für onclick Attribute
window.app = app;
