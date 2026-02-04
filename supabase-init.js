// supabase-init.js
// Initialize Supabase sync when page loads

(function() {
    console.log('🚀 Starting Supabase initialization...');
    
    // Wait for DOM and other scripts to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSupabase);
    } else {
        initSupabase();
    }
    
    async function initSupabase() {
        // Make sure SupabaseSync is available
        if (typeof SupabaseSync === 'undefined') {
            console.warn('⚠️ SupabaseSync not loaded. Skipping initialization.');
            return;
        }
        
        try {
            // Initialize Supabase sync (loads all data from cloud)
            await SupabaseSync.initialize();
            
            // Reload chores from localStorage (Supabase just updated it)
            if (typeof window.chores !== 'undefined') {
                window.chores = JSON.parse(localStorage.getItem('chores') || '[]');
                console.log('✅ Reloaded', window.chores.length, 'chores into window.chores');
            }
            
            // Reload other data arrays too
            if (typeof window.tasks !== 'undefined') {
                window.tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            }
            if (typeof window.lists !== 'undefined') {
                window.lists = JSON.parse(localStorage.getItem('lists') || '[]');
            }
            if (typeof window.recipes !== 'undefined') {
                window.recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
            }
            if (typeof window.mealPlan !== 'undefined') {
                window.mealPlan = JSON.parse(localStorage.getItem('mealPlan') || '[]');
            }
            
            // After loading, render the current section to show updated data
            if (typeof renderSection === 'function' && typeof currentSection !== 'undefined') {
                console.log('🔄 Refreshing UI with Supabase data...');
                renderSection(currentSection);
            } else if (typeof renderChoresView === 'function') {
                console.log('🔄 Refreshing chores view...');
                renderChoresView();
            }
            
            console.log('✅ Supabase initialization complete!');
        } catch (error) {
            console.error('❌ Supabase initialization error:', error);
            console.log('📴 Continuing in offline mode...');
        }
    }
})();