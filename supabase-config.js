// supabase-config.js
// Supabase Configuration and Helper Functions

// ============================================
// CONFIGURATION
// ============================================
// Replace these with your actual Supabase credentials
// Find these in: Supabase Dashboard > Settings > API
const SUPABASE_URL = 'https://ddlnphwpthvcqysscstc.supabase.co'; // e.g., 'https://xxxxx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbG5waHdwdGh2Y3F5c3Njc3RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjUyMDEsImV4cCI6MjA4NTY0MTIwMX0.Bdyz_60mX97oT06F76poUmHTVHcHU0MD-7XGh7rOH0M';

// Initialize Supabase client (using a different variable name to avoid conflict)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// FAMILY MEMBERS
// ============================================
async function getFamilyMembers() {
    const { data, error } = await supabaseClient
        .from('family_members')
        .select('*')
        .order('name');
    
    if (error) {
        console.error('Error fetching family members:', error);
        return [];
    }
    return data;
}

async function addFamilyMember(name, color, avatarUrl = null) {
    const { data, error } = await supabaseClient
        .from('family_members')
        .insert([{ name, color, avatar_url: avatarUrl }])
        .select()
        .single();
    
    if (error) {
        console.error('Error adding family member:', error);
        return null;
    }
    return data;
}

async function updateFamilyMember(id, updates) {
    const { data, error } = await supabaseClient
        .from('family_members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating family member:', error);
        return null;
    }
    return data;
}

async function deleteFamilyMember(id) {
    const { error } = await supabaseClient
        .from('family_members')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Error deleting family member:', error);
        return false;
    }
    return true;
}

// ============================================
// CALENDAR EVENTS
// ============================================
async function getCalendarEvents(startDate, endDate) {
    const { data, error } = await supabaseClient
        .from('calendar_events')
        .select('*, family_members(name, color)')
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .order('start_time');
    
    if (error) {
        console.error('Error fetching events:', error);
        return [];
    }
    return data;
}

async function addCalendarEvent(event) {
    const { data, error } = await supabaseClient
        .from('calendar_events')
        .insert([event])
        .select()
        .single();
    
    if (error) {
        console.error('Error adding event:', error);
        return null;
    }
    return data;
}

async function updateCalendarEvent(id, updates) {
    const { data, error } = await supabaseClient
        .from('calendar_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating event:', error);
        return null;
    }
    return data;
}

async function deleteCalendarEvent(id) {
    const { error } = await supabaseClient
        .from('calendar_events')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Error deleting event:', error);
        return false;
    }
    return true;
}

// ============================================
// TASKS/CHORES
// ============================================
async function getTasks(filters = {}) {
    let query = supabaseClient
        .from('tasks')
        .select('*, family_members(name, color)');
    
    if (filters.completed !== undefined) {
        query = query.eq('completed', filters.completed);
    }
    
    if (filters.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
    }
    
    if (filters.dueDate) {
        query = query.eq('due_date', filters.dueDate);
    }
    
    query = query.order('due_date', { ascending: true, nullsFirst: false });
    
    const { data, error } = await query;
    
    if (error) {
        console.error('Error fetching tasks:', error);
        return [];
    }
    return data;
}

async function addTask(task) {
    const { data, error } = await supabaseClient
        .from('tasks')
        .insert([task])
        .select()
        .single();
    
    if (error) {
        console.error('Error adding task:', error);
        return null;
    }
    return data;
}

async function updateTask(id, updates) {
    const { data, error } = await supabaseClient
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating task:', error);
        return null;
    }
    return data;
}

async function completeTask(id) {
    const { data, error } = await supabaseClient
        .from('tasks')
        .update({ 
            completed: true, 
            completed_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();
    
    if (error) {
        console.error('Error completing task:', error);
        return null;
    }
    return data;
}

async function deleteTask(id) {
    const { error } = await supabaseClient
        .from('tasks')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Error deleting task:', error);
        return false;
    }
    return true;
}

// ============================================
// RECIPES
// ============================================
async function getRecipes(filters = {}) {
    let query = supabaseClient.from('recipes').select('*');
    
    if (filters.category) {
        query = query.eq('category', filters.category);
    }
    
    if (filters.favorite) {
        query = query.eq('favorite', true);
    }
    
    query = query.order('title');
    
    const { data, error } = await query;
    
    if (error) {
        console.error('Error fetching recipes:', error);
        return [];
    }
    return data;
}

async function addRecipe(recipe) {
    const { data, error } = await supabaseClient
        .from('recipes')
        .insert([recipe])
        .select()
        .single();
    
    if (error) {
        console.error('Error adding recipe:', error);
        return null;
    }
    return data;
}

async function updateRecipe(id, updates) {
    const { data, error } = await supabaseClient
        .from('recipes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating recipe:', error);
        return null;
    }
    return data;
}

async function deleteRecipe(id) {
    const { error } = await supabaseClient
        .from('recipes')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Error deleting recipe:', error);
        return false;
    }
    return true;
}

// ============================================
// MEAL CATEGORIES
// ============================================
async function getMealCategories() {
    const { data, error } = await supabaseClient
        .from('meal_categories')
        .select('*')
        .order('display_order');
    
    if (error) {
        console.error('Error fetching meal categories:', error);
        return [];
    }
    return data;
}

// ============================================
// MEAL PLANS
// ============================================
async function getMealPlans(startDate, endDate) {
    const { data, error } = await supabaseClient
        .from('meal_plans')
        .select('*, recipes(title, image_url)')
        .gte('meal_date', startDate)
        .lte('meal_date', endDate)
        .order('meal_date');
    
    if (error) {
        console.error('Error fetching meal plans:', error);
        return [];
    }
    return data;
}

async function addMealPlan(mealPlan) {
    const { data, error } = await supabaseClient
        .from('meal_plans')
        .insert([mealPlan])
        .select()
        .single();
    
    if (error) {
        console.error('Error adding meal plan:', error);
        return null;
    }
    return data;
}

async function updateMealPlan(id, updates) {
    const { data, error } = await supabaseClient
        .from('meal_plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating meal plan:', error);
        return null;
    }
    return data;
}

async function deleteMealPlan(id) {
    const { error } = await supabaseClient
        .from('meal_plans')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Error deleting meal plan:', error);
        return false;
    }
    return true;
}

// ============================================
// LISTS
// ============================================
async function getLists() {
    const { data, error } = await supabaseClient
        .from('lists')
        .select('*, list_items(*)')
        .order('name');
    
    if (error) {
        console.error('Error fetching lists:', error);
        return [];
    }
    return data;
}

async function addList(list) {
    const { data, error } = await supabaseClient
        .from('lists')
        .insert([list])
        .select()
        .single();
    
    if (error) {
        console.error('Error adding list:', error);
        return null;
    }
    return data;
}

async function updateList(id, updates) {
    const { data, error } = await supabaseClient
        .from('lists')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating list:', error);
        return null;
    }
    return data;
}

async function deleteList(id) {
    const { error } = await supabaseClient
        .from('lists')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Error deleting list:', error);
        return false;
    }
    return true;
}

// ============================================
// LIST ITEMS
// ============================================
async function addListItem(listId, text) {
    const { data, error } = await supabaseClient
        .from('list_items')
        .insert([{ list_id: listId, text }])
        .select()
        .single();
    
    if (error) {
        console.error('Error adding list item:', error);
        return null;
    }
    return data;
}

async function updateListItem(id, updates) {
    const { data, error } = await supabaseClient
        .from('list_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating list item:', error);
        return null;
    }
    return data;
}

async function deleteListItem(id) {
    const { error } = await supabaseClient
        .from('list_items')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Error deleting list item:', error);
        return false;
    }
    return true;
}

// ============================================
// REWARDS
// ============================================
async function getRewards() {
    const { data, error } = await supabaseClient
        .from('rewards')
        .select('*')
        .order('points_cost');
    
    if (error) {
        console.error('Error fetching rewards:', error);
        return [];
    }
    return data;
}

async function addReward(reward) {
    const { data, error} = await supabaseClient
        .from('rewards')
        .insert([reward])
        .select()
        .single();
    
    if (error) {
        console.error('Error adding reward:', error);
        return null;
    }
    return data;
}

async function updateReward(id, updates) {
    const { data, error } = await supabaseClient
        .from('rewards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating reward:', error);
        return null;
    }
    return data;
}

async function deleteReward(id) {
    const { error } = await supabaseClient
        .from('rewards')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Error deleting reward:', error);
        return false;
    }
    return true;
}

// ============================================
// ALLOWANCE/MONEY TRACKING
// ============================================
async function getAllowanceBalance(memberId) {
    const { data, error } = await supabaseClient
        .from('allowance_transactions')
        .select('amount, transaction_type')
        .eq('member_id', memberId);
    
    if (error) {
        console.error('Error fetching allowance:', error);
        return 0;
    }
    
    const balance = data.reduce((acc, transaction) => {
        return transaction.transaction_type === 'save' 
            ? acc + parseFloat(transaction.amount)
            : acc - parseFloat(transaction.amount);
    }, 0);
    
    return balance;
}

async function addAllowanceTransaction(transaction) {
    const { data, error } = await supabaseClient
        .from('allowance_transactions')
        .insert([transaction])
        .select()
        .single();
    
    if (error) {
        console.error('Error adding transaction:', error);
        return null;
    }
    return data;
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================
function subscribeToCalendarEvents(callback) {
    return supabaseClient
        .channel('calendar_events_changes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'calendar_events' }, 
            callback
        )
        .subscribe();
}

function subscribeToTasks(callback) {
    return supabaseClient
        .channel('tasks_changes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'tasks' }, 
            callback
        )
        .subscribe();
}

function subscribeToMealPlans(callback) {
    return supabaseClient
        .channel('meal_plans_changes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'meal_plans' }, 
            callback
        )
        .subscribe();
}

function subscribeToLists(callback) {
    return supabaseClient
        .channel('list_items_changes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'list_items' }, 
            callback
        )
        .subscribe();
}

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================
window.SupabaseAPI = {
    // Family Members
    getFamilyMembers,
    addFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,
    
    // Calendar Events
    getCalendarEvents,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    
    // Tasks
    getTasks,
    addTask,
    updateTask,
    completeTask,
    deleteTask,
    
    // Recipes
    getRecipes,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    
    // Meal Plans
    getMealPlans,
    addMealPlan,
    updateMealPlan,
    deleteMealPlan,
    
    // Meal Categories
    getMealCategories,
    
    // Lists
    getLists,
    addList,
    updateList,
    deleteList,
    
    // List Items
    addListItem,
    updateListItem,
    deleteListItem,
    
    // Rewards
    getRewards,
    addReward,
    updateReward,
    deleteReward,
    
    // Allowance
    getAllowanceBalance,
    addAllowanceTransaction,
    
    // Subscriptions
    subscribeToCalendarEvents,
    subscribeToTasks,
    subscribeToMealPlans,
    subscribeToLists
};