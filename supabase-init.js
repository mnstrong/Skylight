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
            
            // Reload all data arrays from localStorage (Supabase just updated them)
            if (typeof window.chores !== 'undefined') {
                window.chores = JSON.parse(localStorage.getItem('chores') || '[]');
                console.log('✅ Reloaded', window.chores.length, 'chores into window.chores');
                // Tell script.js to resync its local chores variable and re-render
                document.dispatchEvent(new CustomEvent('supabaseChoresLoaded'));
            }
            
            if (typeof window.tasks !== 'undefined') {
                window.tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            }
            
            if (typeof window.routines !== 'undefined') {
                window.routines = JSON.parse(localStorage.getItem('routines') || '[]');
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
            
            // Always reload events - critical for tablet/Android where Google auth may not be active
            window.events = JSON.parse(localStorage.getItem('events') || '[]');
            console.log('✅ Reloaded', window.events.length, 'events into window.events');
            
            // After loading, render the current section to show updated data
            // Only render if we're actually on that page
            if (typeof renderSection === 'function' && typeof currentSection !== 'undefined') {
                console.log('🔄 Refreshing UI for section:', currentSection);
                try {
                    renderSection(currentSection);
                } catch (e) {
                    console.log('⚠️ Could not render section (page may not be ready yet)');
                }
            }
            
            console.log('✅ Supabase initialization complete!');
        } catch (error) {
            console.error('❌ Supabase initialization error:', error);
            console.log('📴 Continuing in offline mode...');
        }
    }
})();