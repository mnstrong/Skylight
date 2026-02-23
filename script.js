// Polyfills for Android 8 compatibility
if (!String.prototype.padStart) {
    String.prototype.padStart = function padStart(targetLength, padString) {
        targetLength = targetLength >> 0;
        padString = String(typeof padString !== 'undefined' ? padString : ' ');
        if (this.length >= targetLength) {
            return String(this);
        } else {
            targetLength = targetLength - this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength / padString.length);
            }
            return padString.slice(0, targetLength) + String(this);
        }
    };
}

if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement, fromIndex) {
        if (this == null) {
            throw new TypeError('"this" is null or not defined');
        }
        var o = Object(this);
        var len = o.length >>> 0;
        if (len === 0) {
            return false;
        }
        var n = fromIndex | 0;
        var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
        while (k < len) {
            if (o[k] === searchElement) {
                return true;
            }
            k++;
        }
        return false;
    };
}

if (!String.prototype.includes) {
    String.prototype.includes = function(search, start) {
        if (typeof start !== 'number') {
            start = 0;
        }
        if (start + search.length > this.length) {
            return false;
        } else {
            return this.indexOf(search, start) !== -1;
        }
    };
}

if (!Object.assign) {
    Object.assign = function(target) {
        if (target == null) {
            throw new TypeError('Cannot convert undefined or null to object');
        }
        var to = Object(target);
        for (var index = 1; index < arguments.length; index++) {
            var nextSource = arguments[index];
            if (nextSource != null) {
                for (var nextKey in nextSource) {
                    if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
        }
        return to;
    };
}

console.log('Script started loading...');
        let currentDate = new Date();
        window.currentDate = currentDate;
        let currentView = 'month';
        let currentSection = 'calendar';
        let showCompletedChores = false;
        window.showCompletedListItems = false;
        let scheduleDaysToShow = 14;
        let familyMembers = window.familyMembers = JSON.parse(localStorage.getItem('familyMembers')) || [
            { name: 'Family', color: '#9B59B6', isGoogleCalendar: true, calendarId: 'family' },
            { name: 'Mary', color: '#54eef3' },
            { name: 'Bret', color: '#43AEDE' },
            { name: 'Levi', color: '#f2c342' },
            { name: 'Elsie', color: '#d9aafa' }
        ];
        
        // Deduplicate family members by name (keep first occurrence)
        const seenNames = new Set();
        familyMembers = familyMembers.filter(member => {
            if (seenNames.has(member.name)) {
                return false;
            }
            seenNames.add(member.name);
            return true;
        });
        
        // Ensure all family members have IDs (migration for existing data)
        let needsUpdate = false;
        familyMembers.forEach((member, index) => {
            if (!member.id) {
                member.id = index + 1;
                needsUpdate = true;
            }
        });
        if (needsUpdate) {
            localStorage.setItem('familyMembers', JSON.stringify(familyMembers)); window.familyMembers = familyMembers;
        }
        
        // Save deduplicated array if we removed duplicates
        if (seenNames.size !== JSON.parse(localStorage.getItem('familyMembers') || '[]').length) {
            localStorage.setItem('familyMembers', JSON.stringify(familyMembers)); window.familyMembers = familyMembers;
            console.log('Removed duplicate family members');
        }
        
        // Events data
        let events = JSON.parse(localStorage.getItem('events')) || [];
        window.events = events; // Expose globally so supabase-init can refresh it
        
        // Add sample events if none exist (for testing)
        if (events.length === 0) {
            console.log('📅 No events found, adding sample events for testing...');
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            
            // Get dates for this week
            const getDateStr = (daysOffset) => {
                const d = new Date(today);
                d.setDate(today.getDate() + daysOffset);
                return d.toISOString().split('T')[0];
            };
            
            events = [
                { id: Date.now() + 1, title: 'Payday', date: getDateStr(0), member: 'Family', time: null },
                { id: Date.now() + 2, title: 'Transfer half of mortgage', date: getDateStr(0), member: 'Bret', time: null },
                { id: Date.now() + 3, title: 'Study', date: getDateStr(0), member: 'Family', time: '09:00' },
                { id: Date.now() + 4, title: 'Check Levi 5 A Day - Math & ELA', date: getDateStr(0), member: 'Family', time: '16:00' },
                { id: Date.now() + 5, title: 'Josh', date: getDateStr(0), member: 'Family', time: '16:00' },
                { id: Date.now() + 6, title: 'Levi Soccer', date: getDateStr(1), member: 'Levi', time: '20:30' },
                { id: Date.now() + 7, title: 'Rotate Bed-So much fun!!!', date: getDateStr(2), member: 'Family', time: null },
                { id: Date.now() + 8, title: 'Santa Fe oil change', date: getDateStr(2), member: 'Bret', time: '10:00' },
                { id: Date.now() + 9, title: 'Hortons DnD', date: getDateStr(2), member: 'Family', time: '18:00' }
            ];
            
            localStorage.setItem('events', JSON.stringify(events));
            console.log('✅ Added', events.length, 'sample events');
        }
        
        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        let chores = JSON.parse(localStorage.getItem('chores')) || [];
        let routines = JSON.parse(localStorage.getItem('routines')) || [];
let visiblePeriods = {
    'Mary-Morning': true, 'Mary-Afternoon': true, 'Mary-Evening': true,
    'Bret-Morning': true, 'Bret-Afternoon': true, 'Bret-Evening': true,
    'Levi-Morning': true, 'Levi-Afternoon': true, 'Levi-Evening': true,
    'Elsie-Morning': true, 'Elsie-Afternoon': true, 'Elsie-Evening': true
};        
        // Initialize sortOrder for all routines if not set
        let needsSave = false;
        routines.forEach((routine, index) => {
            if (routine.sortOrder === undefined) {
                routine.sortOrder = index;
                needsSave = true;
            }
        });
        if (needsSave) {
            localStorage.setItem('routines', JSON.stringify(routines));
        }
        let meals = JSON.parse(localStorage.getItem('meals')) || [];
        let allowances = JSON.parse(localStorage.getItem('allowances')) || [];
        let rewards = JSON.parse(localStorage.getItem('rewards')) || [];
        
        // Meal planning data
        let recipes = JSON.parse(localStorage.getItem('recipes')) || [];
        let mealPlan = JSON.parse(localStorage.getItem('mealPlan')) || [];
        let mealCategories = JSON.parse(localStorage.getItem('mealCategories')) || [
            { name: 'Breakfast', color: '#FFB3B3', visible: true },
            { name: 'Lunch', color: '#B3E5D9', visible: true },
            { name: 'Dinner', color: '#FFD9A3', visible: true },
            { name: 'Snack', color: '#E5D4B3', visible: true }
        ];
        
        // Save meal categories to localStorage
        function saveMealCategories() {
            localStorage.setItem('mealCategories', JSON.stringify(mealCategories));
        }
        
        let currentMealWeekStart = new Date();
        currentMealWeekStart.setHours(0, 0, 0, 0); // Start on today
        
        // Lists data
        let lists = JSON.parse(localStorage.getItem('lists')) || [];
        let currentListId = null;
        
        // Google Calendar - Using Cloudflare Worker (keeps private key secure!)
        const CALENDAR_WORKER_URL = 'https://skylight-calendar.mary-n-strong.workers.dev';

        
        // Meal Planning Functions
        let mealHoldTimer = null;
        let mealHoldTarget = null;
        
        function renderMealPlanGrid() {
            const grid = document.getElementById('mealPlanGrid');
            const weekDays = [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Get 7 days starting from currentMealWeekStart
            for (let i = 0; i < 7; i++) {
                const day = new Date(currentMealWeekStart);
                day.setDate(currentMealWeekStart.getDate() + i);
                weekDays.push(day);
            }
            
            let html = '<div class="meal-grid-container">';
            
            // Empty corner cell
            html += '<div></div>';
            
            // Day headers
            weekDays.forEach(day => {
                const isToday = day.getTime() === today.getTime();
                const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = day.getDate();
                html += `<div class="meal-day-header ${isToday ? 'today' : ''}">
                    <div class="week-day-name">${dayName}</div>
                    <div class="week-day-number">${dayNum}</div>
                </div>`;
            });
            
            // Rows for each meal type (only show visible ones)
            mealCategories.filter(cat => cat.visible !== false).forEach(category => {
                // Row label
                html += `<div class="meal-row-label">${category.name}</div>`;
                
                // Cells for each day
                weekDays.forEach(day => {
                    const dateStr = day.toISOString().split('T')[0];
                    const meals = mealPlan.filter(m => m.date === dateStr && m.mealType === category.name);
                    const mealTypeClass = category.name.toLowerCase();
                    
                    html += `<div class="meal-cell">`;
                    
                    if (meals.length === 0) {
                        // Show single empty box
                        html += `<div class="meal-box empty-box ${mealTypeClass}" onclick="toggleMealBoxSelection(event, '${dateStr}', '${category.name}'); openMealSelector('${dateStr}', '${category.name}')"></div>`;
                    } else {
                        // Show existing meals
                        meals.forEach(meal => {
                            const recipe = recipes.find(r => r.id === meal.recipeId);
                            if (recipe) {
                                html += `<div class="meal-box" 
                                              style="background: ${category.color};" 
                                              onmousedown="startMealHold(event, '${meal.id}', '${dateStr}', '${category.name}')"
                                              onmouseup="endMealHold(event, '${meal.id}')"
                                              onmouseleave="cancelMealHold()"
                                              ontouchstart="startMealHold(event, '${meal.id}', '${dateStr}', '${category.name}')"
                                              ontouchend="endMealHold(event, '${meal.id}')"
                                              ontouchcancel="cancelMealHold()">${recipe.name}</div>`;
                            }
                        });
                    }
                    
                    html += `</div>`;
                });
            });
            
            html += '</div>';
            grid.innerHTML = html;
        }
        
        function startMealHold(event, mealId, dateStr, mealType) {
            event.preventDefault();
            mealHoldTarget = { mealId, dateStr, mealType };
            mealHoldTimer = setTimeout(() => {
                // Hold detected - open meal selector to add another
                openMealSelector(dateStr, mealType);
                mealHoldTimer = null;
            }, 500); // 500ms hold time
        }
        
        function endMealHold(event, mealId) {
            event.preventDefault();
            if (mealHoldTimer) {
                // Quick click - show meal details
                clearTimeout(mealHoldTimer);
                mealHoldTimer = null;
                showMealDetail(mealId);
            }
        }
        
        function cancelMealHold() {
            if (mealHoldTimer) {
                clearTimeout(mealHoldTimer);
                mealHoldTimer = null;
            }
        }
        
        // Meal Filter Modal Functions
        function openMealFilterModal() {
            renderMealFilterBody();
            document.getElementById('mealFilterOverlay').classList.add('active');
            document.getElementById('mealFilterModal').classList.add('active');
        }
        
        function closeMealFilterModal() {
            document.getElementById('mealFilterOverlay').classList.remove('active');
            document.getElementById('mealFilterModal').classList.remove('active');
        }
        
        function renderMealFilterBody() {
            const container = document.getElementById('mealFilterBody');
            let html = '';
            
            mealCategories.forEach((category, index) => {
                const isVisible = category.visible !== false;
                html += `
                    <div class="meal-filter-item">
                        <div class="meal-filter-item-left">
                            <div class="meal-filter-color-dot" style="background: ${category.color}"></div>
                            <span class="meal-filter-category-name">${category.name}</span>
                        </div>
                        <div class="meal-filter-item-right">
                            <button class="meal-filter-edit-btn" onclick="openEditMealCategory(${index})">✏️</button>
                            <label class="meal-filter-toggle">
                                <input type="checkbox" ${isVisible ? 'checked' : ''} onchange="toggleMealCategoryVisibility(${index})">
                                <span class="meal-filter-toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
        }
        
        function toggleMealCategoryVisibility(index) {
            mealCategories[index].visible = !mealCategories[index].visible;
            saveMealCategories();
            renderMealPlanGrid();
            renderMealFilterBody();
        }
        
        function openEditMealCategory(index) {
            const category = mealCategories[index];
            document.getElementById('editCategoryIndex').value = index;
            document.getElementById('editCategoryName').value = category.name;
            document.getElementById('editCategoryColor').value = category.color;
            
            // Render color picker
            renderEditCategoryColorPicker(category.color);
            
            document.getElementById('editCategoryOverlay').classList.add('active');
            document.getElementById('editCategoryModal').classList.add('active');
        }
        
        function closeEditMealCategory() {
            document.getElementById('editCategoryOverlay').classList.remove('active');
            document.getElementById('editCategoryModal').classList.remove('active');
        }
        
        function renderEditCategoryColorPicker(currentColor) {
            const grid = document.getElementById('editCategoryColorGrid');
            const colors = [
                '#FFB3B3', '#FFD9A3', '#FFFFB3', '#B3FFB3', '#B3E5D9', 
                '#B3D9FF', '#D9B3FF', '#FFB3E5', '#E5D4B3', '#D4B3E5'
            ];
            
            let html = '';
            colors.forEach(color => {
                const isActive = color === currentColor;
                html += `<div class="color-picker-option ${isActive ? 'active' : ''}" 
                              style="background: ${color}" 
                              onclick="selectEditCategoryColor('${color}')"></div>`;
            });
            
            grid.innerHTML = html;
        }
        
        function selectEditCategoryColor(color) {
            document.getElementById('editCategoryColor').value = color;
            renderEditCategoryColorPicker(color);
        }
        
        function saveEditMealCategory() {
            const index = parseInt(document.getElementById('editCategoryIndex').value);
            const newName = document.getElementById('editCategoryName').value.trim();
            const newColor = document.getElementById('editCategoryColor').value;
            
            if (!newName) {
                alert('Please enter a category name');
                return;
            }
            
            mealCategories[index].name = newName;
            mealCategories[index].color = newColor;
            saveMealCategories();
            
            closeEditMealCategory();
            renderMealFilterBody();
            renderMealPlanGrid();
        }
        
        let currentMealType = '';
        let currentMealDate = '';
        
        function openMealSelector(date, mealType) {
            currentMealDate = date;
            currentMealType = mealType;
            
            const panel = document.getElementById('mealSelectorPanel');
            const overlay = document.getElementById('mealSelectorOverlay');
            const title = document.getElementById('mealSelectorTitle');
            
            title.textContent = `Select ${mealType}`;
            
            renderMealSelectorList();
            
            overlay.classList.add('active');
            panel.classList.add('active');
        }
        
        function toggleMealBoxSelection(event, date, mealType) {
            const box = event.target;
            box.classList.toggle('selected');
        }
        
        function closeMealSelector() {
            document.getElementById('mealSelectorPanel').classList.remove('active');
            document.getElementById('mealSelectorOverlay').classList.remove('active');
        }
        
        function renderMealSelectorList() {
            const list = document.getElementById('mealSelectorList');
            const categoryRecipes = recipes.filter(r => r.mealType === currentMealType);
            
            let html = `<div style="padding: 0 20px;">`;
            
            // Repeat controls
            html += `
                <div class="edit-form-group" style="margin-top: 20px;">
                    <div class="edit-toggle-row">
                        <span>Repeats</span>
                        <input type="checkbox" id="mealRepeatEnabled" onchange="toggleMealRepeatOptions()">
                    </div>
                </div>
                
                <div id="mealRepeatOptions" style="display: none;">
                    <div class="edit-form-group">
                        <label class="edit-form-label">Repeat Every</label>
                        <div style="display: flex; gap: 10px;">
                            <input type="number" class="edit-form-input" id="mealRepeatEvery" value="1" min="1" style="flex: 1;">
                            <select class="edit-form-input" id="mealRepeatUnit" style="flex: 1;">
                                <option value="day">Day(s)</option>
                                <option value="week" selected>Week(s)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="edit-form-group">
                        <label class="edit-form-label">Repeats Until (Optional)</label>
                        <input type="date" class="edit-form-input" id="mealRepeatUntil">
                    </div>
                </div>
                
                <div style="border-top: 1px solid #e0e0e0; margin: 20px 0;"></div>
            `;
            
            html += `<div class="add-recipe-btn" onclick="openAddRecipePanel()">+ Add recipe</div>`;
            
            categoryRecipes.forEach(recipe => {
                html += `
                    <div class="recipe-list-item" onclick="selectRecipe(${recipe.id})">
                        <span class="recipe-list-item-name">${recipe.name}</span>
                        <span class="recipe-list-item-menu">⋯</span>
                    </div>
                `;
            });
            
            if (categoryRecipes.length === 0) {
                html += '<div style="padding: 40px; text-align: center; color: #999;">No recipes yet. Add one!</div>';
            }
            
            html += `</div>`;
            
            list.innerHTML = html;
        }
        
        function toggleMealRepeatOptions() {
            const enabled = document.getElementById('mealRepeatEnabled').checked;
            document.getElementById('mealRepeatOptions').style.display = enabled ? 'block' : 'none';
        }
        
        function selectRecipe(recipeId) {
            const mealRepeatEnabledEl = document.getElementById('mealRepeatEnabled');
            const repeatEnabled = mealRepeatEnabledEl ? mealRepeatEnabledEl.checked : false;
            const mealRepeatEveryEl = document.getElementById('mealRepeatEvery');
            const repeatEvery = repeatEnabled ? parseInt((mealRepeatEveryEl ? mealRepeatEveryEl.value : null) || 1) : null;
            const mealRepeatUnitEl = document.getElementById('mealRepeatUnit');
            const repeatUnit = repeatEnabled ? ((mealRepeatUnitEl ? mealRepeatUnitEl.value : null) || 'week') : null;
            const mealRepeatUntilEl = document.getElementById('mealRepeatUntil');
            const repeatUntil = repeatEnabled ? ((mealRepeatUntilEl ? mealRepeatUntilEl.value : null) || null) : null;
            
            // Create the meal
            const newMeal = {
                id: Date.now() + Math.random(),
                date: currentMealDate,
                mealType: currentMealType,
                recipeId: recipeId
            };
            
            // Add repeat data if enabled
            if (repeatEnabled && repeatEvery && repeatUnit) {
                newMeal.repeat = {
                    every: repeatEvery,
                    unit: repeatUnit,
                    until: repeatUntil
                };
            }
            
            // Always add a new meal (allow multiple meals per day/type)
            mealPlan.push(newMeal);
            
            localStorage.setItem('mealPlan', JSON.stringify(mealPlan));
            closeMealSelector();
            renderMealPlanGrid();
        }
        
        function showMealDetail(mealId) {
            const meal = mealPlan.find(m => m.id == mealId);
            if (!meal) return;
            
            const recipe = recipes.find(r => r.id === meal.recipeId);
            if (!recipe) return;
            
            const modal = document.getElementById('mealDetailModal');
            const category = mealCategories.find(c => c.name === meal.mealType);
            
            // Format date
            const date = new Date(meal.date);
            const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            
            document.getElementById('mealDetailTitle').textContent = recipe.name;
            document.getElementById('mealDetailDate').textContent = dateStr;
            document.getElementById('mealDetailCategory').textContent = meal.mealType;
            document.getElementById('mealDetailCategoryDot').style.background = category ? category.color : '#999';
            document.getElementById('mealDetailIngredients').textContent = recipe.ingredients || 'No ingredients listed';
            document.getElementById('mealDetailInstructions').textContent = recipe.instructions || 'No instructions provided';
            
            // Store current meal ID for edit/delete
            modal.dataset.mealId = mealId;
            
            modal.classList.add('active');
        }
        
        function closeMealDetail() {
            document.getElementById('mealDetailModal').classList.remove('active');
        }
        
        function editMealFromDetail() {
            const mealId = document.getElementById('mealDetailModal').dataset.mealId;
            const meal = mealPlan.find(m => m.id == mealId);
            if (meal) {
                closeMealDetail();
                // For now, just open the meal selector to replace
                // In future, could open edit panel with pre-filled data
                currentMealDate = meal.date;
                currentMealType = meal.mealType;
                openMealSelector(meal.date, meal.mealType);
            }
        }
        
        function deleteMealFromDetail() {
            const mealId = document.getElementById('mealDetailModal').dataset.mealId;
            if (confirm('Remove this meal?')) {
                const index = mealPlan.findIndex(m => m.id == mealId);
                if (index > -1) {
                    mealPlan.splice(index, 1);
                    localStorage.setItem('mealPlan', JSON.stringify(mealPlan));
                    closeMealDetail();
                    renderMealPlanGrid();
                }
            }
        }
        
        function editMeal(mealId) {
            // This is the old function - now replaced by showMealDetail
            showMealDetail(mealId);
        }
        
        // Allowance Functions
        function renderAllowanceGrid() {
            const grid = document.getElementById('allowanceGrid');
            // Only show Levi and Elsie
            const allowanceMembers = familyMembers.filter(m => m.name === 'Levi' || m.name === 'Elsie');
            
            let html = '';
            allowanceMembers.forEach(member => {
                const memberAllowance = allowances.find(a => a.member === member.name) || {
                    member: member.name,
                    spending: 0,
                    saving: 0,
                    transactions: []
                };
                
                // Calculate spending and saving from transactions
                let spending = 0;
                let saving = 0;
                (memberAllowance.transactions || []).forEach(t => {
                    if (t.type === 'spend') {
                        spending += Math.abs(t.amount);
                    } else if (t.type === 'save') {
                        saving += t.amount;
                    }
                });
                
                const initial = member.name.charAt(0).toUpperCase();
                // Show ALL transactions in reverse chronological order (newest first)
                const allTransactions = (memberAllowance.transactions || []).slice().reverse();
                
                // Create gradient background like chores
                const columnBg = hexToRgba(member.color, 0.2);
                
                html += `
                    <div class="allowance-card" style="background: ${columnBg};">
                        <div class="allowance-header">
                            <div class="allowance-avatar" style="background: ${member.color}">
                                ${initial}
                            </div>
                            <div class="allowance-info">
                                <div class="allowance-name">${member.name}</div>
                            </div>
                        </div>
                        
                        <div class="allowance-sections">
                            <div class="allowance-section">
                                <div class="allowance-section-label">Spending</div>
                                <div class="allowance-section-amount">$${spending.toFixed(2)}</div>
                            </div>
                            <div class="allowance-section">
                                <div class="allowance-section-label">Saving</div>
                                <div class="allowance-section-amount">$${saving.toFixed(2)}</div>
                            </div>
                        </div>
                        
                        <button class="allowance-transaction-btn" onclick="openAllowanceTransaction('${member.name}')">
                            Add Transaction
                        </button>
                        
                        ${allTransactions.length > 0 ? `
                            <div class="allowance-history">
                                <div class="allowance-history-title">Transaction History</div>
                                ${allTransactions.map(t => `
                                    <div class="allowance-transaction">
                                        <div class="allowance-transaction-info">
                                            <div class="allowance-transaction-date">${new Date(t.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</div>
                                            <div class="allowance-transaction-description">${t.description || 'No description'}</div>
                                        </div>
                                        <span class="allowance-transaction-amount ${t.type === 'save' ? 'positive' : 'negative'}">
                                            ${t.type === 'save' ? '+' : '-'}$${Math.abs(t.amount).toFixed(2)}
                                        </span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                `;
            });
            
            grid.innerHTML = html;
        }
        
        let currentAllowanceMember = '';
        let currentAllowanceType = 'save'; // Default to save
        
        function openAllowanceTransaction(memberName) {
            currentAllowanceMember = memberName;
            currentAllowanceType = 'save';
            
            // Reset toggle buttons
            document.getElementById('saveTypeBtn').classList.add('active');
            document.getElementById('spendTypeBtn').classList.remove('active');
            
            // Clear form
            document.getElementById('allowanceAmount').value = '';
            document.getElementById('allowanceDescription').value = '';
            
            // Open modal
            document.getElementById('allowancePanelOverlay').classList.add('active');
            document.getElementById('allowanceModal').classList.add('active');
            
            // Focus on amount field
            setTimeout(() => document.getElementById('allowanceAmount').focus(), 100);
        }
        
        function setTransactionType(type) {
            currentAllowanceType = type;
            document.getElementById('saveTypeBtn').classList.toggle('active', type === 'save');
            document.getElementById('spendTypeBtn').classList.toggle('active', type === 'spend');
        }
        
        function closeAllowanceModal() {
            document.getElementById('allowancePanelOverlay').classList.remove('active');
            document.getElementById('allowanceModal').classList.remove('active');
            currentAllowanceMember = '';
            currentAllowanceType = 'save';
        }
        
        function saveAllowanceTransaction() {
            const amountStr = document.getElementById('allowanceAmount').value;
            const description = document.getElementById('allowanceDescription').value.trim();
            
            if (!amountStr) {
                alert('Please enter an amount');
                return;
            }
            
            const amount = parseFloat(amountStr);
            if (isNaN(amount) || amount <= 0) {
                alert('Please enter a valid amount');
                return;
            }
            
            if (!description) {
                alert('Please enter a description');
                return;
            }
            
            // Find or create allowance for member
            let memberAllowance = allowances.find(a => a.member === currentAllowanceMember);
            if (!memberAllowance) {
                memberAllowance = {
                    member: currentAllowanceMember,
                    spending: 0,
                    saving: 0,
                    transactions: []
                };
                allowances.push(memberAllowance);
            }
            
            // Add transaction
            memberAllowance.transactions = memberAllowance.transactions || [];
            memberAllowance.transactions.push({
                date: new Date().toISOString(),
                amount: amount,
                type: currentAllowanceType,
                description: description
            });
            
            // Save
            localStorage.setItem('allowances', JSON.stringify(allowances));
            
            // Close modal
            closeAllowanceModal();
            
            // Re-render
            renderAllowanceGrid();
        }
        
        function openAddRecipePanel() {
            closeMealSelector();
            document.getElementById('addRecipePanelOverlay').classList.add('active');
            document.getElementById('addRecipePanel').classList.add('active');
            document.getElementById('addRecipeMealType').value = currentMealType;
        }
        
        function closeAddRecipePanel() {
            document.getElementById('addRecipePanel').classList.remove('active');
            document.getElementById('addRecipePanelOverlay').classList.remove('active');
            // Clear form
            document.getElementById('addRecipeName').value = '';
            document.getElementById('addRecipeIngredients').value = '';
            document.getElementById('addRecipeInstructions').value = '';
            // Clear editing flag
            delete document.getElementById('addRecipePanel').dataset.editingId;
        }
        
        async function importRecipeFromURL() {
            const url = document.getElementById('addRecipeURL').value.trim();
            const statusDiv = document.getElementById('importStatus');
            
            if (!url) {
                statusDiv.textContent = 'Please enter a URL';
                statusDiv.style.color = '#dc3545';
                return;
            }
            
            statusDiv.textContent = '⏳ Importing recipe...';
            statusDiv.style.color = '#4A90E2';
            
            try {
                // Use a CORS proxy to fetch the recipe page
                const proxyUrl = 'https://api.allorigins.win/raw?url=';
                const response = await fetch(proxyUrl + encodeURIComponent(url));
                
                if (!response.ok) {
                    throw new Error('Failed to fetch recipe');
                }
                
                const html = await response.text();
                
                // Try to extract recipe data from JSON-LD schema
                const recipe = extractRecipeFromHTML(html);
                
                if (recipe) {
                    // Populate the form with extracted data
                    document.getElementById('addRecipeName').value = recipe.name || '';
                    document.getElementById('addRecipeIngredients').value = recipe.ingredients || '';
                    document.getElementById('addRecipeInstructions').value = recipe.instructions || '';
                    
                    // Try to guess meal type from recipe name or category
                    const mealType = guessMealType(recipe.name, recipe.category);
                    document.getElementById('addRecipeMealType').value = mealType;
                    
                    statusDiv.textContent = '✅ Recipe imported! Review and save.';
                    statusDiv.style.color = '#4CAF50';
                } else {
                    throw new Error('Could not extract recipe data from this URL');
                }
            } catch (error) {
                console.error('Import error:', error);
                statusDiv.textContent = '❌ Could not import recipe. Please enter manually.';
                statusDiv.style.color = '#dc3545';
            }
        }
        
        function extractRecipeFromHTML(html) {
            try {
                // Look for JSON-LD recipe schema
                const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
                
                if (jsonLdMatch) {
                    for (let script of jsonLdMatch) {
                        const jsonText = script.replace(/<script[^>]*>|<\/script>/gi, '');
                        try {
                            const data = JSON.parse(jsonText);
                            const recipe = Array.isArray(data) ? data.find(d => d['@type'] === 'Recipe') : 
                                          (data['@type'] === 'Recipe' ? data : (data['@graph'] && data['@graph'].find(d => d['@type'] === 'Recipe')));
                            
                            if (recipe) {
                                return {
                                    name: recipe.name || '',
                                    ingredients: Array.isArray(recipe.recipeIngredient) ? 
                                                recipe.recipeIngredient.join('\n') : 
                                                (recipe.recipeIngredient || ''),
                                    instructions: extractInstructions(recipe.recipeInstructions),
                                    category: recipe.recipeCategory || ''
                                };
                            }
                        } catch (e) {
                            continue;
                        }
                    }
                }
                
                return null;
            } catch (error) {
                console.error('Extraction error:', error);
                return null;
            }
        }
        
        function extractInstructions(instructions) {
            if (!instructions) return '';
            
            if (typeof instructions === 'string') return instructions;
            
            if (Array.isArray(instructions)) {
                return instructions.map((step, i) => {
                    if (typeof step === 'string') return step;
                    if (step.text) return step.text;
                    if (step.name) return step.name;
                    return '';
                }).filter(Boolean).join('\n');
            }
            
            if (instructions.text) return instructions.text;
            
            return '';
        }
        
        function guessMealType(name, category) {
            const text = (name + ' ' + category).toLowerCase();
            
            if (text.includes('breakfast') || text.includes('pancake') || text.includes('waffle') || 
                text.includes('eggs') || text.includes('oatmeal')) {
                return 'Breakfast';
            }
            if (text.includes('lunch') || text.includes('sandwich') || text.includes('salad')) {
                return 'Lunch';
            }
            if (text.includes('dinner') || text.includes('pasta') || text.includes('chicken') || 
                text.includes('beef') || text.includes('fish')) {
                return 'Dinner';
            }
            if (text.includes('snack') || text.includes('cookie') || text.includes('dessert')) {
                return 'Snack';
            }
            
            return 'Dinner'; // Default
        }
        
        function saveNewRecipe() {
            const name = document.getElementById('addRecipeName').value.trim();
            const mealType = document.getElementById('addRecipeMealType').value;
            const ingredients = document.getElementById('addRecipeIngredients').value.trim();
            const instructions = document.getElementById('addRecipeInstructions').value.trim();
            
            if (!name) {
                alert('Please enter a recipe name');
                return;
            }
            
            const editingId = document.getElementById('addRecipePanel').dataset.editingId;
            
            if (editingId) {
                // Editing existing recipe
                const recipe = recipes.find(r => r.id == editingId);
                if (recipe) {
                    recipe.name = name;
                    recipe.mealType = mealType;
                    recipe.ingredients = ingredients;
                    recipe.instructions = instructions;
                    localStorage.setItem('recipes', JSON.stringify(recipes));
                    
                    delete document.getElementById('addRecipePanel').dataset.editingId;
                    closeAddRecipePanel();
                    
                    // Refresh recipe view if we're in recipes section
                    if (currentSection === 'recipes') {
                        renderRecipesView();
                        if (selectedRecipeId == editingId) {
                            renderRecipeDetail(selectedRecipeId);
                        }
                    }
                }
            } else {
                // Creating new recipe
                const newRecipe = {
                    id: Date.now(),
                    name: name,
                    mealType: mealType,
                    ingredients: ingredients,
                    instructions: instructions,
                    category: 'Uncategorized'
                };
                
                recipes.push(newRecipe);
                localStorage.setItem('recipes', JSON.stringify(recipes));
                
                closeAddRecipePanel();
                
                // If in meal selector, add to meal plan
                if (currentMealDate && currentMealType) {
                    selectRecipe(newRecipe.id);
                }
                
                // If in recipes view, refresh
                if (currentSection === 'recipes') {
                    renderRecipesView();
                }
            }
        }
        
        function navigateMealWeek(direction) {
            currentMealWeekStart.setDate(currentMealWeekStart.getDate() + (direction * 7));
            renderMealPlanGrid();
        }
        
        function goToMealToday() {
            const today = new Date();
            currentMealWeekStart = new Date(today);
            currentMealWeekStart.setHours(0, 0, 0, 0); // Start on today
            renderMealPlanGrid();
        }
        
        // Recipes View Functions
        let selectedRecipeFilter = 'all';
        let selectedRecipeId = null;
        
        function renderRecipesView() {
            renderRecipeFilterButtons();
            renderRecipesList();
        }
        
        function renderRecipeFilterButtons() {
            const container = document.getElementById('recipesFilterButtons');
            const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack'];
            
            let html = '';
            categories.forEach(cat => {
                const catLower = cat.toLowerCase();
                const isActive = selectedRecipeFilter === catLower;
                html += `<button class="recipe-filter-btn ${isActive ? 'active' : ''}" onclick="filterRecipes('${catLower}')">${cat}</button>`;
            });
            
            container.innerHTML = html;
        }
        
        function filterRecipes(category) {
            selectedRecipeFilter = category;
            renderRecipeFilterButtons();
            renderRecipesList();
        }
        
        function renderRecipesList() {
            const container = document.getElementById('recipesList');
            
            // Filter recipes
            let filteredRecipes = recipes;
            if (selectedRecipeFilter !== 'all') {
                filteredRecipes = recipes.filter(r => r.mealType.toLowerCase() === selectedRecipeFilter);
            }
            
            let html = '';
            if (filteredRecipes.length === 0) {
                html = '<div style="padding: 40px; text-align: center; color: #999;">No recipes yet. Add one!</div>';
            } else {
                filteredRecipes.forEach(recipe => {
                    const isActive = recipe.id === selectedRecipeId;
                    html += `
                        <div class="recipe-list-item ${isActive ? 'active' : ''}" onclick="selectRecipeView(${recipe.id})">
                            <span class="recipe-list-item-name">${recipe.name}</span>
                            <span class="recipe-list-item-menu">⋯</span>
                        </div>
                    `;
                });
            }
            
            container.innerHTML = html;
        }
        
        function selectRecipeView(recipeId) {
            selectedRecipeId = recipeId;
            renderRecipesList();
            renderRecipeDetail(recipeId);
        }
        
        function renderRecipeDetail(recipeId) {
            const recipe = recipes.find(r => r.id === recipeId);
            if (!recipe) return;
            
            const container = document.getElementById('recipesRightPanel');
            const category = mealCategories.find(c => c.name === recipe.mealType);
            const categoryColor = category ? category.color : '#999';
            
            let html = `
                <div class="recipe-view-header">
                    <div>
                        <div class="recipe-view-title">${recipe.name}</div>
                        <div class="recipe-view-category" style="background: ${categoryColor}; color: #000;">${recipe.mealType}</div>
                    </div>
                    <div class="recipe-view-actions">
                        <button class="recipe-action-btn recipe-plan-btn" onclick="planMealFromRecipe(${recipe.id})">Plan Meal</button>
                        <button class="recipe-action-btn recipe-edit-btn" onclick="editRecipeFromView(${recipe.id})">✏️</button>
                        <button class="recipe-action-btn recipe-delete-btn" onclick="deleteRecipeFromView(${recipe.id})">🗑️</button>
                    </div>
                </div>
            `;
            
            if (recipe.ingredients) {
                html += `
                    <div class="recipe-section">
                        <div class="recipe-section-title">INGREDIENTS</div>
                        <div class="recipe-section-content">${recipe.ingredients}</div>
                        <button class="recipe-grocery-btn" onclick="addRecipeToGroceryList(${recipe.id})">
                            🛒 Add to Grocery List
                        </button>
                    </div>
                `;
            }
            
            if (recipe.instructions) {
                html += `
                    <div class="recipe-section">
                        <div class="recipe-section-title">INSTRUCTIONS</div>
                        <div class="recipe-section-content">${recipe.instructions}</div>
                    </div>
                `;
            }
            
            container.innerHTML = html;
        }
        
        function planMealFromRecipe(recipeId) {
            // Open a modal to select date and meal type
            const recipe = recipes.find(r => r.id === recipeId);
            if (!recipe) return;
            
            // For now, use current meal selector flow
            const today = new Date().toISOString().split('T')[0];
            currentMealDate = today;
            currentMealType = recipe.mealType;
            
            // Add directly to meal plan
            selectRecipe(recipeId);
        }
        
        function editRecipeFromView(recipeId) {
            const recipe = recipes.find(r => r.id === recipeId);
            if (!recipe) return;
            
            // Populate edit panel
            document.getElementById('addRecipeName').value = recipe.name || '';
            document.getElementById('addRecipeMealType').value = recipe.mealType || 'Dinner';
            document.getElementById('addRecipeIngredients').value = recipe.ingredients || '';
            document.getElementById('addRecipeInstructions').value = recipe.instructions || '';
            
            // Set a flag that we're editing
            document.getElementById('addRecipePanel').dataset.editingId = recipeId;
            
            // Open panel
            openAddRecipePanel();
        }
        
        function deleteRecipeFromView(recipeId) {
            if (!confirm('Delete this recipe? This cannot be undone.')) return;
            
            const index = recipes.findIndex(r => r.id === recipeId);
            if (index > -1) {
                recipes.splice(index, 1);
                localStorage.setItem('recipes', JSON.stringify(recipes));
                selectedRecipeId = null;
                renderRecipesView();
                
                // Show empty state
                document.getElementById('recipesRightPanel').innerHTML = `
                    <div class="recipes-empty-state">
                        <div class="recipes-empty-icon">📖</div>
                        <div class="recipes-empty-text">Select a recipe to view details</div>
                    </div>
                `;
            }
        }
        
        function addRecipeToGroceryList(recipeId) {
            const recipe = recipes.find(r => r.id === recipeId);
            if (!recipe || !recipe.ingredients) return;
            
            // Find or create grocery list
            let groceryList = lists.find(l => l.name === 'Grocery List');
            if (!groceryList) {
                // Create grocery list if it doesn't exist
                const member = familyMembers.find(m => !m.isGoogleCalendar);
                if (!member) return;
                
                groceryList = {
                    id: Date.now(),
                    name: 'Grocery List',
                    assignedTo: member.id,
                    items: []
                };
                lists.push(groceryList);
            }
            
            // Parse ingredients (split by newlines)
            const ingredientLines = recipe.ingredients.split('\n').filter(line => line.trim());
            
            ingredientLines.forEach(ingredient => {
                if (ingredient.trim()) {
                    groceryList.items.push({
                        id: Date.now() + Math.random(),
                        text: ingredient.trim(),
                        completed: false,
                        section: 'Items'
                    });
                }
            });
            
            localStorage.setItem('lists', JSON.stringify(lists));
            alert('Ingredients added to Grocery List!');
        }
        
        function initializeSampleRecipes() {
            if (recipes.length === 0) {
                recipes = [
                    { id: 1, name: 'Scrambled Eggs', mealType: 'Breakfast', category: 'Quick', ingredients: 'Eggs, butter, salt, pepper', instructions: 'Beat eggs, cook in butter until fluffy.' },
                    { id: 2, name: 'Pancakes', mealType: 'Breakfast', category: 'Weekend', ingredients: 'Flour, eggs, milk, sugar, baking powder', instructions: 'Mix ingredients, cook on griddle.' },
                    { id: 3, name: 'Oatmeal', mealType: 'Breakfast', category: 'Healthy', ingredients: 'Oats, milk, berries, honey', instructions: 'Cook oats with milk, top with berries.' },
                    { id: 4, name: 'Caesar Salad', mealType: 'Lunch', category: 'Salads', ingredients: 'Romaine, croutons, parmesan, Caesar dressing', instructions: 'Toss ingredients together.' },
                    { id: 5, name: 'Grilled Cheese', mealType: 'Lunch', category: 'Quick', ingredients: 'Bread, cheese, butter', instructions: 'Grill sandwich until golden.' },
                    { id: 6, name: 'Chicken Soup', mealType: 'Lunch', category: 'Comfort', ingredients: 'Chicken, vegetables, broth, noodles', instructions: 'Simmer all ingredients.' },
                    { id: 7, name: 'Spaghetti', mealType: 'Dinner', category: 'Italian', ingredients: 'Pasta, marinara sauce, ground beef, parmesan', instructions: 'Cook pasta, heat sauce with beef, combine.' },
                    { id: 8, name: 'Tacos', mealType: 'Dinner', category: 'Mexican', ingredients: 'Tortillas, ground beef, lettuce, cheese, salsa', instructions: 'Cook beef, assemble tacos.' },
                    { id: 9, name: 'Pizza', mealType: 'Dinner', category: 'Easy', ingredients: 'Pizza dough, sauce, mozzarella, toppings', instructions: 'Top pizza, bake at 450°F.' },
                    { id: 10, name: 'Yogurt & Granola', mealType: 'Snack', category: 'Healthy', ingredients: 'Greek yogurt, granola, berries', instructions: 'Layer yogurt, granola, and berries.' },
                    { id: 11, name: 'Fruit Bowl', mealType: 'Snack', category: 'Healthy', ingredients: 'Mixed fruits', instructions: 'Cut and combine fresh fruits.' },
                    { id: 12, name: 'Crackers & Cheese', mealType: 'Snack', category: 'Quick', ingredients: 'Crackers, cheese slices', instructions: 'Arrange on plate.' }
                ];
                localStorage.setItem('recipes', JSON.stringify(recipes));
            }
        }
        
        // Lists Functions
        function initializeSampleLists() {
            if (lists.length === 0) {
                lists = [
                    {
                        id: 1,
                        name: 'Grocery List',
                        color: familyMembers[0].color,
                        assignedTo: familyMembers[0].id,
                        items: [
                            { id: 1, text: '🥚 Eggs', completed: false },
                            { id: 2, text: '🥛 Milk', completed: false },
                            { id: 3, text: '🍞 Bread', completed: false },
                            { id: 4, text: '🍎 Apples', completed: false },
                            { id: 5, text: '🥬 Lettuce', completed: false }
                        ]
                    },
                    {
                        id: 2,
                        name: 'Packing List',
                        color: familyMembers[1].color,
                        assignedTo: familyMembers[1].id,
                        items: [
                            { id: 1, text: '👕 Shirts x5', completed: false },
                            { id: 2, text: '👖 Jeans x2', completed: false },
                            { id: 3, text: '🩲 Undies x7', completed: false }
                        ]
                    },
                    {
                        id: 3,
                        name: 'To-Do',
                        color: familyMembers[2].color,
                        assignedTo: familyMembers[2].id,
                        items: [
                            { id: 1, text: 'Pack for trip', completed: false },
                            { id: 2, text: 'Pet sitter (Allie?)', completed: false },
                            { id: 3, text: 'Stop mail', completed: false }
                        ]
                    },
                    {
                        id: 4,
                        name: 'Travel Bucket List',
                        color: familyMembers[3].color,
                        assignedTo: familyMembers[3].id,
                        items: [
                            { id: 1, text: '🗾 Japan', completed: false },
                            { id: 2, text: '🇮🇪 Ireland', completed: false },
                            { id: 3, text: '🇭🇷 Croatia', completed: false }
                        ]
                    }
                ];
                localStorage.setItem('lists', JSON.stringify(lists));
            }
        }
        
        let selectedListsPerson = 'all';
        
        function renderFamilyPillsLists() {
            const container = document.getElementById('familyPillsLists');
            if (!container) return;
            
            let html = `<button class="family-pill ${selectedListsPerson === 'all' ? 'active' : ''}" onclick="filterListsByPerson('all')">All</button>`;
            
            familyMembers.forEach(member => {
                const activeClass = selectedListsPerson === member.id ? 'active' : '';
                html += `
                    <button class="family-pill ${activeClass}" 
                            style="background: ${member.color}; color: white;" 
                            onclick="filterListsByPerson(${member.id})">
                        ${member.emoji} ${member.name}
                    </button>
                `;
            });
            
            container.innerHTML = html;
        }
        
        function filterListsByPerson(personId) {
            // Convert to number if it's not 'all', to match member.id type
            selectedListsPerson = personId === 'all' ? 'all' : Number(personId);
            renderFamilyPillsLists();
            renderListsColumns();
        }
        
        function renderListsColumns() {
            const container = document.getElementById('listsColumnsContainer');
            if (!container) return;
            
            // Filter lists by selected person
            let filteredLists = lists;
            if (selectedListsPerson !== 'all') {
                filteredLists = lists.filter(list => list.assignedTo === selectedListsPerson);
            }
            
            let html = '';
            
            filteredLists.forEach(list => {
                const member = familyMembers.find(m => m.id === list.assignedTo);
                if (!member) return;
                
                // Convert hex color to rgba with 20% opacity for column background
                const columnBg = hexToRgba(member.color, 0.2);
                
                html += `<div class="chore-column" style="background: ${columnBg}">`;
                
                // Show list card with title and assigned person avatar
                html += `
                    <div class="list-card">
                        <div class="list-card-header" onclick="openEditListPanel(${list.id})" style="cursor: pointer;">
                            <div class="list-card-title">${list.name}</div>
                            <div class="list-card-initial" style="background: ${member.color};">${member.name.charAt(0).toUpperCase()}</div>
                        </div>
                `;
                
                // Group items by section
                const sections = [];
                const itemsBySection = {};
                
                list.items.forEach(item => {
                    const sectionName = item.section || 'Items';
                    if (!itemsBySection[sectionName]) {
                        itemsBySection[sectionName] = [];
                        sections.push(sectionName);
                    }
                    itemsBySection[sectionName].push(item);
                });
                
                // If no sections exist, create default "Items" section
                if (sections.length === 0) {
                    sections.push('Items');
                    itemsBySection['Items'] = [];
                }
                
                // Render each section
                sections.forEach(sectionName => {
                    const sectionItems = itemsBySection[sectionName] || [];
                    const sectionId = sectionName.replace(/\s+/g, '-').toLowerCase();
                    
                    html += `
                        <div class="list-section">
                            <div class="list-section-header" onclick="toggleSection('${list.id}', '${sectionId}')">
                                <span class="list-section-title">${sectionName}</span>
                                <span class="list-section-count">${sectionItems.length}</span>
                                <span class="list-section-arrow">^</span>
                            </div>
                            <div class="list-section-items" 
                                 id="section-${list.id}-${sectionId}"
                                 data-list-id="${list.id}"
                                 data-section="${sectionName}"
                                 ondragover="handleSectionDragOver(event)"
                                 ondrop="handleSectionDrop(event)">
                    `;
                    
                    sectionItems.forEach((item, index) => {
                        // Skip empty items (section placeholders)
                        if (!item.text) return;
                        
                        // Skip completed items if filter is off
                        if (item.completed && !window.showCompletedListItems) return;
                        
                        const checkedClass = item.completed ? 'checked' : '';
                        const textClass = item.completed ? 'completed' : '';
                        const itemBg = hexToRgba(member.color, 0.4);
                        
                        // Get assigned member for this item
                        const assignedMember = item.assignedTo ? familyMembers.find(m => m.name === item.assignedTo) : null;
                        const assignedInitial = assignedMember ? assignedMember.name.charAt(0).toUpperCase() : '';
                        const assignedColor = assignedMember ? assignedMember.color : '#ccc';
                        
                        html += `
                            <div class="list-item" 
                                 draggable="true"
                                 data-item-id="${item.id}"
                                 data-list-id="${list.id}"
                                 data-section="${sectionName}"
                                 data-index="${index}"
                                 ondragstart="handleListItemDragStart(event)"
                                 ondragover="handleListItemDragOver(event)"
                                 ondrop="handleListItemDrop(event)"
                                 ondragend="handleListItemDragEnd(event)"
                                 ontouchstart="handleListItemTouchStart(event, ${list.id}, ${item.id})"
                                 ontouchmove="handleListItemTouchMove(event, ${list.id}, ${item.id})"
                                 ontouchend="handleListItemTouchEnd(event, ${list.id}, ${item.id})"
                                 style="background: ${itemBg}; cursor: move; transition: transform 0.3s ease;">
                                <div class="list-item-text ${textClass}" onclick="openListItemDetail(${list.id}, ${item.id})">${item.text}</div>
                                ${assignedMember ? `<div class="list-item-avatar" style="background: ${assignedColor}" onclick="event.stopPropagation(); openListItemDetail(${list.id}, ${item.id})">${assignedInitial}</div>` : ''}
                                <div class="list-item-checkbox ${checkedClass}" onclick="event.stopPropagation(); toggleListItem(${list.id}, ${item.id})"></div>
                            </div>
                        `;
                    });
                    
                    html += `
                                <input type="text" class="add-item-input" placeholder="Add an item..." onkeypress="if(event.key==='Enter') addListItemToSection(${list.id}, '${sectionName}', this)">
                            </div>
                        </div>
                    `;
                });
                
                html += `
                        <div class="list-add-section-btn" onclick="addNewSection(${list.id})">
                            Add section
                        </div>
                    </div>
                </div>`;
            });
            
            container.innerHTML = html;
        }
        
        function addListItemToList(listId, inputElement) {
            const text = inputElement.value.trim();
            if (!text) return;
            
            const list = lists.find(l => l.id === listId);
            if (!list) return;
            
            const newItem = {
                id: Date.now(),
                text: text,
                completed: false
            };
            
            list.items.push(newItem);
            localStorage.setItem('lists', JSON.stringify(lists));
            inputElement.value = '';
            renderListsColumns();
        }
        
        function addListItemToSection(listId, sectionName, inputElement) {
            const text = inputElement.value.trim();
            if (!text) return;
            
            const list = lists.find(l => l.id === listId);
            if (!list) return;
            
            const newItem = {
                id: Date.now(),
                text: text,
                completed: false,
                section: sectionName
            };
            
            list.items.push(newItem);
            localStorage.setItem('lists', JSON.stringify(lists));
            inputElement.value = '';
            renderListsColumns();
        }
        
        function addNewSection(listId) {
            // Store the list ID and open modal
            document.getElementById('sectionListId').value = listId;
            document.getElementById('sectionNameInput').value = '';
            document.getElementById('addSectionModal').classList.add('active');
            // Focus on input after modal opens
            setTimeout(() => {
                document.getElementById('sectionNameInput').focus();
            }, 100);
        }
        
        function saveNewSection() {
            const sectionName = document.getElementById('sectionNameInput').value.trim();
            const listId = Number(document.getElementById('sectionListId').value);
            
            if (!sectionName) {
                alert('Please enter a section name');
                return;
            }
            
            const list = lists.find(l => l.id === listId);
            if (!list) return;
            
            // Check if section already exists
            const existingSection = list.items.find(i => i.section === sectionName);
            if (existingSection) {
                alert('A section with this name already exists');
                return;
            }
            
            // Create an empty item to establish the section
            const newItem = {
                id: Date.now(),
                text: '',
                completed: false,
                section: sectionName
            };
            
            list.items.push(newItem);
            localStorage.setItem('lists', JSON.stringify(lists));
            
            closeModal('addSectionModal');
            renderListsColumns();
        }
        
        function toggleSection(listId, sectionId) {
            const sectionElement = document.getElementById(`section-${listId}-${sectionId}`);
            const headerElement = sectionElement.previousElementSibling;
            
            if (sectionElement.classList.contains('collapsed')) {
                sectionElement.classList.remove('collapsed');
                headerElement.classList.remove('collapsed');
            } else {
                sectionElement.classList.add('collapsed');
                headerElement.classList.add('collapsed');
            }
        }
        
        function toggleListItem(listId, itemId) {
            const list = lists.find(l => l.id === listId);
            if (!list) return;
            
            const item = list.items.find(i => i.id === itemId);
            if (item) {
                // Mark as completed instead of deleting
                item.completed = true;
                item.completedDate = new Date().toISOString().split('T')[0];
                localStorage.setItem('lists', JSON.stringify(lists));
                renderListsColumns();
            }
        }
        
        // Swipe to delete for list items
        let touchStartX = 0;
        let touchStartY = 0;
        let currentSwipeItem = null;
        let isDragging = false;
        let longPressTimer = null;
        let draggedElement = null;
        let draggedItemData = null;
        let touchMoveY = 0;
        
        function handleListItemTouchStart(event, listId, itemId) {
            const touch = event.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchMoveY = touch.clientY;
            currentSwipeItem = event.currentTarget;
            isDragging = false;
            
            // Start long press timer for drag
            longPressTimer = setTimeout(() => {
                isDragging = true;
                startDragging(event.currentTarget, listId, itemId);
            }, 500); // 500ms long press
        }
        
        function startDragging(element, listId, itemId) {
            draggedElement = element;
            draggedItemData = { listId, itemId };
            
            // Visual feedback
            element.style.opacity = '0.5';
            element.style.transform = 'scale(1.05)';
            element.style.zIndex = '1000';
            navigator.vibrate && navigator.vibrate(50); // Haptic feedback if available
        }
        
        function handleListItemTouchMove(event, listId, itemId) {
            if (!currentSwipeItem) return;
            
            const touch = event.touches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;
            touchMoveY = touch.clientY;
            
            // Cancel long press if finger moves too much
            if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
                clearTimeout(longPressTimer);
            }
            
            if (isDragging) {
                // Drag mode - move element with finger
                event.preventDefault();
                currentSwipeItem.style.transform = `translateY(${deltaY}px) scale(1.05)`;
                currentSwipeItem.style.transition = 'none';
                
                // Find element under touch point
                currentSwipeItem.style.pointerEvents = 'none';
                const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
                currentSwipeItem.style.pointerEvents = 'auto';
                
                // Clear all highlights
                document.querySelectorAll('.list-item').forEach(item => {
                    item.style.borderTop = '';
                    item.style.borderBottom = '';
                });
                
                // Highlight drop target
                if (elementBelow && elementBelow.classList.contains('list-item')) {
                    const rect = elementBelow.getBoundingClientRect();
                    const midpoint = rect.top + rect.height / 2;
                    
                    if (touch.clientY < midpoint) {
                        elementBelow.style.borderTop = '3px solid #4A90E2';
                    } else {
                        elementBelow.style.borderBottom = '3px solid #4A90E2';
                    }
                }
            } else {
                // Swipe mode - only allow left swipe
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    event.preventDefault();
                    
                    if (deltaX < 0) {
                        currentSwipeItem.style.transform = `translateX(${deltaX}px)`;
                        currentSwipeItem.style.transition = 'none';
                    }
                }
            }
        }
        
        function handleListItemTouchEnd(event, listId, itemId) {
            clearTimeout(longPressTimer);
            
            if (!currentSwipeItem) return;
            
            const touch = event.changedTouches[0];
            const deltaX = touch.clientX - touchStartX;
            
            if (isDragging) {
                // Handle drop
                event.preventDefault();
                
                // Find element at drop position
                currentSwipeItem.style.pointerEvents = 'none';
                const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
                currentSwipeItem.style.pointerEvents = 'auto';
                
                if (elementBelow && elementBelow.classList.contains('list-item')) {
                    const targetListId = parseInt(elementBelow.dataset.listId);
                    const targetItemId = parseInt(elementBelow.dataset.itemId);
                    
                    // Only reorder within same list
                    if (targetListId === listId && targetItemId !== itemId) {
                        const list = lists.find(l => l.id === listId);
                        if (list) {
                            const draggedIndex = list.items.findIndex(i => i.id === itemId);
                            const targetIndex = list.items.findIndex(i => i.id === targetItemId);
                            
                            if (draggedIndex !== -1 && targetIndex !== -1) {
                                // Reorder
                                const [movedItem] = list.items.splice(draggedIndex, 1);
                                list.items.splice(targetIndex, 0, movedItem);
                                
                                localStorage.setItem('lists', JSON.stringify(lists));
                            }
                        }
                    }
                }
                
                // Clear highlights
                document.querySelectorAll('.list-item').forEach(item => {
                    item.style.borderTop = '';
                    item.style.borderBottom = '';
                });
                
                // Reset and re-render
                currentSwipeItem.style.opacity = '1';
                currentSwipeItem.style.transform = '';
                currentSwipeItem.style.transition = '';
                currentSwipeItem.style.zIndex = '';
                
                isDragging = false;
                draggedElement = null;
                draggedItemData = null;
                
                renderListsColumns();
            } else {
                // Handle swipe to delete
                if (deltaX < -100) {
                    currentSwipeItem.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                    currentSwipeItem.style.transform = 'translateX(-100%)';
                    currentSwipeItem.style.opacity = '0';
                    
                    setTimeout(() => {
                        toggleListItem(listId, itemId);
                    }, 300);
                } else {
                    // Snap back
                    currentSwipeItem.style.transition = 'transform 0.3s ease';
                    currentSwipeItem.style.transform = 'translateX(0)';
                }
            }
            
            currentSwipeItem = null;
        }
        
        // Expose globally
        window.handleListItemTouchStart = handleListItemTouchStart;
        window.handleListItemTouchMove = handleListItemTouchMove;
        window.handleListItemTouchEnd = handleListItemTouchEnd;
        
        // Drag and drop for list items
        let draggedListItem = null;
        let draggedFromList = null;
        let draggedFromSection = null;
        
        function handleListItemDragStart(event) {
            event.stopPropagation();
            draggedListItem = event.currentTarget;
            draggedFromList = parseInt(draggedListItem.dataset.listId);
            draggedFromSection = draggedListItem.dataset.section;
            
            draggedListItem.style.opacity = '0.4';
            event.dataTransfer.effectAllowed = 'move';
        }
        
        function handleListItemDragOver(event) {
            if (event.preventDefault) {
                event.preventDefault();
            }
            event.dataTransfer.dropEffect = 'move';
            
            const target = event.currentTarget;
            const targetList = parseInt(target.dataset.listId);
            const targetSection = target.dataset.section;
            
            // Allow moving within same list (even to different sections)
            if (targetList === draggedFromList) {
                const rect = target.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                
                if (event.clientY < midpoint) {
                    target.style.borderTop = '3px solid #4A90E2';
                    target.style.borderBottom = '';
                } else {
                    target.style.borderBottom = '3px solid #4A90E2';
                    target.style.borderTop = '';
                }
            }
            
            return false;
        }
        
        function handleListItemDrop(event) {
            if (event.stopPropagation) {
                event.stopPropagation();
            }
            
            const target = event.currentTarget;
            const targetList = parseInt(target.dataset.listId);
            const targetSection = target.dataset.section;
            
            // Allow moving within same list (even to different sections)
            if (draggedListItem && targetList === draggedFromList) {
                const draggedId = parseFloat(draggedListItem.dataset.itemId);
                const targetId = parseFloat(target.dataset.itemId);
                
                const list = lists.find(l => l.id === targetList);
                if (list) {
                    // Find the dragged item
                    const draggedItem = list.items.find(i => i.id === draggedId);
                    
                    if (draggedItem) {
                        // If moving to a different section, update the item's section
                        if (targetSection !== draggedFromSection) {
                            draggedItem.section = targetSection;
                        }
                        
                        // If dropping on a different item (reordering)
                        if (draggedId !== targetId) {
                            // Get all items for the target section
                            const targetSectionItems = list.items.filter(i => (i.section || 'Items') === targetSection);
                            
                            // Find indices
                            const draggedIndex = targetSectionItems.findIndex(i => i.id === draggedId);
                            const targetIndex = targetSectionItems.findIndex(i => i.id === targetId);
                            
                            // If dragged item is already in target section, reorder
                            if (draggedIndex !== -1 && targetIndex !== -1) {
                                const [movedItem] = targetSectionItems.splice(draggedIndex, 1);
                                targetSectionItems.splice(targetIndex, 0, movedItem);
                            } else if (draggedIndex === -1 && targetIndex !== -1) {
                                // Item is from different section, insert at target position
                                targetSectionItems.splice(targetIndex, 0, draggedItem);
                            }
                            
                            // Rebuild the list.items array
                            const otherItems = list.items.filter(i => (i.section || 'Items') !== targetSection && i.id !== draggedId);
                            list.items = [...otherItems, ...targetSectionItems];
                        }
                        
                        localStorage.setItem('lists', JSON.stringify(lists));
                        renderListsColumns();
                    }
                }
            }
            
            return false;
        }
        
        function handleListItemDragEnd(event) {
            event.currentTarget.style.opacity = '1';
            
            // Remove all drop indicators
            document.querySelectorAll('.list-item').forEach(item => {
                item.style.borderTop = '';
                item.style.borderBottom = '';
            });
            
            // Remove section drop indicators
            document.querySelectorAll('.list-section-items').forEach(section => {
                section.style.background = '';
                section.style.border = '';
            });
            
            draggedListItem = null;
            draggedFromList = null;
            draggedFromSection = null;
        }
        
        // Expose list drag functions globally
        window.handleListItemDragStart = handleListItemDragStart;
        window.handleListItemDragOver = handleListItemDragOver;
        window.handleListItemDrop = handleListItemDrop;
        window.handleListItemDragEnd = handleListItemDragEnd;
        
        // Handle dropping on a section (when section is empty or dropping at end)
        function handleSectionDragOver(event) {
            if (event.preventDefault) {
                event.preventDefault();
            }
            event.dataTransfer.dropEffect = 'move';
            
            const target = event.currentTarget;
            const targetList = parseInt(target.dataset.listId);
            
            // Allow moving within same list
            if (targetList === draggedFromList) {
                target.style.background = 'rgba(74, 144, 226, 0.1)';
                target.style.border = '2px dashed #4A90E2';
            }
            
            return false;
        }
        
        function handleSectionDrop(event) {
            if (event.stopPropagation) {
                event.stopPropagation();
            }
            
            const target = event.currentTarget;
            const targetList = parseInt(target.dataset.listId);
            const targetSection = target.dataset.section;
            
            // Allow moving within same list
            if (draggedListItem && targetList === draggedFromList) {
                const draggedId = parseFloat(draggedListItem.dataset.itemId);
                
                const list = lists.find(l => l.id === targetList);
                if (list) {
                    // Find the dragged item
                    const draggedItem = list.items.find(i => i.id === draggedId);
                    
                    if (draggedItem) {
                        // Update the item's section
                        draggedItem.section = targetSection;
                        
                        // Remove from old position and add to end of target section
                        const otherItems = list.items.filter(i => i.id !== draggedId);
                        const targetSectionItems = otherItems.filter(i => (i.section || 'Items') === targetSection);
                        const nonTargetItems = otherItems.filter(i => (i.section || 'Items') !== targetSection);
                        
                        // Rebuild array with dragged item at end of target section
                        list.items = [...nonTargetItems, ...targetSectionItems, draggedItem];
                        
                        localStorage.setItem('lists', JSON.stringify(lists));
                        renderListsColumns();
                    }
                }
            }
            
            return false;
        }
        
        function addListItem() {
            // Legacy function - now replaced by addListItemToList
        }
        
        function openAddListPanel() {
            // Render profile grid
            renderAddListProfileGrid();
            
            document.getElementById('addListPanelOverlay').classList.add('active');
            document.getElementById('addListPanel').classList.add('active');
        }
        
        function closeAddListPanel() {
            document.getElementById('addListPanel').classList.remove('active');
            document.getElementById('addListPanelOverlay').classList.remove('active');
            // Clear form and selection
            document.getElementById('addListName').value = '';
            selectedAddListProfile = null;
        }
        
        function saveNewList() {
            const name = document.getElementById('addListName').value.trim();
            
            if (!name) {
                alert('Please enter a list name');
                return;
            }
            
            if (!selectedAddListProfile) {
                alert('Please select a family member');
                return;
            }
            
            const member = familyMembers.find(m => m.id === selectedAddListProfile);
            
            const newList = {
                id: Date.now(),
                name: name,
                color: member ? member.color : '#4A90E2',
                assignedTo: selectedAddListProfile,
                items: []
            };
            
            lists.push(newList);
            localStorage.setItem('lists', JSON.stringify(lists));
            
            // Reset
            selectedAddListProfile = null;
            document.getElementById('addListName').value = '';
            
            closeAddListPanel();
            renderListsColumns();
        }
        
        // Add List Profile Selection
        let selectedAddListProfile = null;
        
        function renderAddListProfileGrid() {
            const grid = document.getElementById('addListProfileGrid');
            const listMembers = familyMembers.filter(m => !m.isGoogleCalendar);
            
            let html = '';
            listMembers.forEach(member => {
                html += `<div class="task-profile-item" onclick="selectAddListProfile(${member.id})">
                    <div class="task-profile-avatar" id="add-list-avatar-${member.id}" style="background: ${member.color}; box-shadow: 0 0 0 5px ${member.color}80">
                        ${member.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="task-profile-name">${member.name}</div>
                </div>`;
            });
            
            grid.innerHTML = html;
        }
        
        function selectAddListProfile(profileId) {
            selectedAddListProfile = profileId;
            // Update visual selection
            document.querySelectorAll('#addListProfileGrid .task-profile-avatar').forEach(avatar => {
                avatar.classList.remove('selected');
            });
            document.getElementById(`add-list-avatar-${profileId}`).classList.add('selected');
        }
        
        // List Item Detail and Edit Functions
        let currentEditListId = null;
        let currentEditListItemId = null;
        
        function openListItemDetail(listId, itemId) {
            currentEditListId = listId;
            currentEditListItemId = itemId;
            
            const list = lists.find(l => l.id === listId);
            if (!list) return;
            
            const item = list.items.find(i => i.id === itemId);
            if (!item) return;
            
            const member = familyMembers.find(m => m.id === list.assignedTo);
            
            // Populate detail modal
            document.getElementById('listItemDetailTitle').textContent = item.text;
            document.getElementById('listItemDetailListName').textContent = list.name;
            
            // Show assigned member
            const assignedHtml = member ? 
                `<div class="task-detail-avatar" style="background: ${member.color}">${member.name.charAt(0).toUpperCase()}</div>
                 <span>${member.name}</span>` : 
                '<span>Unassigned</span>';
            document.getElementById('listItemDetailAssignedTo').innerHTML = assignedHtml;
            
            document.getElementById('listItemDetailModal').classList.add('active');
        }
        
        function closeListItemDetail() {
            document.getElementById('listItemDetailModal').classList.remove('active');
        }
        
        function editListItemFromDetail() {
            closeListItemDetail();
            openEditListItemPanel();
        }
        
        function deleteListItemFromDetail() {
            if (!confirm('Are you sure you want to delete this item?')) return;
            
            const list = lists.find(l => l.id === currentEditListId);
            if (!list) return;
            
            const itemIndex = list.items.findIndex(i => i.id === currentEditListItemId);
            if (itemIndex > -1) {
                list.items.splice(itemIndex, 1);
                localStorage.setItem('lists', JSON.stringify(lists));
                closeListItemDetail();
                renderListsColumns();
            }
        }
        
        function openEditListItemPanel() {
            const list = lists.find(l => l.id === currentEditListId);
            if (!list) return;
            
            const item = list.items.find(i => i.id === currentEditListItemId);
            if (!item) return;
            
            document.getElementById('editListItemText').value = item.text || '';
            
            // Render member selection grid
            renderEditListItemMemberGrid(item.assignedTo);
            
            document.getElementById('editListItemPanelOverlay').classList.add('active');
            document.getElementById('editListItemPanel').classList.add('active');
        }
        
        function closeEditListItemPanel() {
            document.getElementById('editListItemPanel').classList.remove('active');
            document.getElementById('editListItemPanelOverlay').classList.remove('active');
        }
        
        // Add List Item Panel Functions
        let selectedListItemProfile = null;
        let currentListItemEmoji = '';
        
        function openAddListItemPanel() {
            // Check if elements exist
            const titleInput = document.getElementById('listItemTitle');
            const emojiInput = document.getElementById('listItemEmoji');
            const emojiDisplay = document.getElementById('listItemEmojiDisplay');
            
            if (!titleInput) {
                console.error('listItemTitle element not found');
                return;
            }
            if (!emojiInput) {
                console.error('listItemEmoji element not found');
                return;
            }
            if (!emojiDisplay) {
                console.error('listItemEmojiDisplay element not found');
                return;
            }
            
            // Reset form
            titleInput.value = '';
            emojiInput.value = '';
            emojiDisplay.textContent = '';
            currentListItemEmoji = '';
            selectedListItemProfile = null;
            
            // Populate list dropdown
            populateListDropdown();
            
            // Render profile grid
            renderListItemProfileGrid();
            
            // Initialize emoji picker
            initializeListItemEmojiPicker();
            
            const overlay = document.getElementById('addListItemPanelOverlay');
            const panel = document.getElementById('addListItemPanel');
            
            if (overlay) overlay.classList.add('active');
            if (panel) panel.classList.add('active');
        }
        
        function closeAddListItemPanel() {
            document.getElementById('addListItemPanel').classList.remove('active');
            document.getElementById('addListItemPanelOverlay').classList.remove('active');
        }
        
        function populateListDropdown() {
            const select = document.getElementById('listItemListSelect');
            let html = '<option value="">Select a list...</option>';
            
            lists.forEach(list => {
                const member = familyMembers.find(m => m.id === list.assignedTo);
                html += `<option value="${list.id}">${list.name}${member ? ' (' + member.name + ')' : ''}</option>`;
            });
            
            select.innerHTML = html;
        }
        
        function renderListItemProfileGrid() {
            const grid = document.getElementById('listItemProfileGrid');
            const listMembers = familyMembers.filter(m => !m.isGoogleCalendar);
            
            let html = '';
            listMembers.forEach(member => {
                html += `<div class="task-profile-item" onclick="selectListItemProfile('${member.name}')">
                    <div class="task-profile-avatar" id="list-item-avatar-${member.name}" style="background: ${member.color}; box-shadow: 0 0 0 5px ${member.color}80">
                        ${member.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="task-profile-name">${member.name}</div>
                </div>`;
            });
            
            // Add "None" option
            html += `<div class="task-profile-item" onclick="selectListItemProfile(null)">
                <div class="task-profile-avatar" id="list-item-avatar-none" style="background: #ccc; box-shadow: 0 0 0 5px #ccc80">
                    ✕
                </div>
                <div class="task-profile-name">None</div>
            </div>`;
            
            grid.innerHTML = html;
        }
        
        function selectListItemProfile(profileName) {
            selectedListItemProfile = profileName;
            // Update visual selection
            document.querySelectorAll('#listItemProfileGrid .task-profile-avatar').forEach(avatar => {
                avatar.classList.remove('selected');
            });
            if (profileName) {
                document.getElementById(`list-item-avatar-${profileName}`).classList.add('selected');
            } else {
                document.getElementById('list-item-avatar-none').classList.add('selected');
            }
        }
        
        function initializeListItemEmojiPicker() {
            const emojis = ['😊', '😁', '😎', '🤗', '😴', '🤔', '😋', '🥳', '🎉', '🎈', '🎁', '🎂', '🎮', '🎯', '🎨', '🎭', '🎪', '🎬', '🎤', '🎧', '🎼', '🎹', '🎸', '🎺', '🎷', '📱', '💻', '🖥️', '⌨️', '🖱️', '🖨️', '📷', '📹', '📺', '📻', '☎️', '📞', '📟', '📠', '🔋', '🔌', '💡', '🔦', '🕯️', '🗑️', '🛒', '🎒', '👔', '👗', '👠', '👟', '🥾', '🧦', '🧤', '🧣', '🎩', '👑', '💍', '💎', '🔨', '🔧', '🔩', '🧰', '🧲', '⚙️', '🧪', '🧫', '🧬', '🔬', '🔭', '📡', '💉', '💊', '🩹', '🩺', '🌡️', '🧯', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '⚱️', '🏺', '🔮', '📿', '💈', '⚗️', '🔭', '🩸', '🦠', '🧬', '🔬'];
            
            const grid = document.getElementById('listItemEmojiPickerGrid');
            let html = '';
            emojis.forEach(emoji => {
                html += `<div class="emoji-item" onclick="selectListItemEmoji('${emoji}')">${emoji}</div>`;
            });
            grid.innerHTML = html;
        }
        
        function toggleListItemEmojiPicker(event) {
            event.stopPropagation();
            const dropdown = document.getElementById('listItemEmojiPickerDropdown');
            const isVisible = dropdown.style.display === 'block';
            
            // Close all emoji pickers first
            document.querySelectorAll('.emoji-picker-dropdown').forEach(picker => {
                picker.style.display = 'none';
            });
            
            if (!isVisible) {
                dropdown.style.display = 'block';
                document.getElementById('listItemEmojiSearchInput').value = '';
                document.getElementById('listItemEmojiSearchInput').focus();
                
                // Add click listener to close when clicking outside
                setTimeout(() => {
                    document.addEventListener('click', closeListItemEmojiPicker);
                }, 10);
            }
        }
        
        function closeListItemEmojiPicker() {
            document.getElementById('listItemEmojiPickerDropdown').style.display = 'none';
            document.removeEventListener('click', closeListItemEmojiPicker);
        }
        
        function selectListItemEmoji(emoji) {
            currentListItemEmoji = emoji;
            document.getElementById('listItemEmoji').value = emoji;
            document.getElementById('listItemEmojiDisplay').textContent = emoji;
            closeListItemEmojiPicker();
        }
        
        function filterListItemEmojis() {
            const searchTerm = document.getElementById('listItemEmojiSearchInput').value.toLowerCase();
            const emojiItems = document.querySelectorAll('#listItemEmojiPickerGrid .emoji-item');
            
            emojiItems.forEach(item => {
                // Simple filter - you could enhance this with emoji names
                item.style.display = 'flex';
            });
        }
        
        function saveNewListItem() {
            const title = document.getElementById('listItemTitle').value.trim();
            const listId = parseInt(document.getElementById('listItemListSelect').value);
            
            if (!title) {
                alert('Please enter an item name');
                return;
            }
            
            if (!listId) {
                alert('Please select a list');
                return;
            }
            
            const list = lists.find(l => l.id === listId);
            if (!list) {
                alert('List not found');
                return;
            }
            
            // Create new item
            const newItem = {
                id: Date.now(),
                text: title,
                emoji: currentListItemEmoji || '',
                assignedTo: selectedListItemProfile,
                completed: false,
                section: 'Items' // Default section
            };
            
            list.items.push(newItem);
            localStorage.setItem('lists', JSON.stringify(lists));
            
            closeAddListItemPanel();
            renderListsColumns();
        }
        
        function openEditListPanel(listId) {
            currentEditListId = listId;
            
            const list = lists.find(l => l.id === listId);
            if (!list) return;
            
            // Populate form
            document.getElementById('editListName').value = list.name || '';
            
            // Populate assigned to dropdown
            const select = document.getElementById('editListAssignedTo');
            select.innerHTML = familyMembers.map(m => 
                `<option value="${m.id}" ${m.id === list.assignedTo ? 'selected' : ''}>${m.name}</option>`
            ).join('');
            
            document.getElementById('editListPanelOverlay').classList.add('active');
            document.getElementById('editListPanel').classList.add('active');
        }
        
        function closeEditListPanel() {
            document.getElementById('editListPanel').classList.remove('active');
            document.getElementById('editListPanelOverlay').classList.remove('active');
        }
        
        function saveEditedList() {
            const newName = document.getElementById('editListName').value.trim();
            const newAssignedTo = Number(document.getElementById('editListAssignedTo').value);
            
            if (!newName) {
                alert('Please enter a list name');
                return;
            }
            
            const list = lists.find(l => l.id === currentEditListId);
            if (!list) return;
            
            list.name = newName;
            list.assignedTo = newAssignedTo;
            localStorage.setItem('lists', JSON.stringify(lists));
            
            closeEditListPanel();
            // Reset filter to 'all' so the list doesn't disappear after changing owner
            selectedListsPerson = 'all';
            renderFamilyPillsLists();
            renderListsColumns();
        }
        
        function deleteList() {
            if (!confirm('Are you sure you want to delete this list and all its items?')) return;
            
            const index = lists.findIndex(l => l.id === currentEditListId);
            if (index > -1) {
                lists.splice(index, 1);
                localStorage.setItem('lists', JSON.stringify(lists));
                closeEditListPanel();
                renderListsColumns();
            }
        }
        
        let selectedListItemMember = null;
        
        function renderEditListItemMemberGrid(currentAssignment) {
            const grid = document.getElementById('editListItemMemberGrid');
            const listMembers = familyMembers.filter(m => !m.isGoogleCalendar);
            
            selectedListItemMember = currentAssignment || null;
            
            let html = '';
            // Add "None" option
            html += `<div class="task-profile-item ${!selectedListItemMember ? 'active' : ''}" onclick="selectListItemMember(null)">
                <div class="task-profile-avatar" style="background: #ccc;">—</div>
                <div class="task-profile-name">None</div>
            </div>`;
            
            listMembers.forEach(member => {
                const isActive = selectedListItemMember === member.name;
                html += `<div class="task-profile-item ${isActive ? 'active' : ''}" onclick="selectListItemMember('${member.name}')">
                    <div class="task-profile-avatar" style="background: ${member.color}; box-shadow: 0 0 0 5px ${member.color}80">
                        ${member.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="task-profile-name">${member.name}</div>
                </div>`;
            });
            
            grid.innerHTML = html;
        }
        
        function selectListItemMember(memberName) {
            selectedListItemMember = memberName;
            renderEditListItemMemberGrid(memberName);
        }
        
        function saveEditedListItem() {
            const newText = document.getElementById('editListItemText').value.trim();
            
            if (!newText) {
                alert('Please enter item text');
                return;
            }
            
            const list = lists.find(l => l.id === currentEditListId);
            if (!list) return;
            
            const item = list.items.find(i => i.id === currentEditListItemId);
            if (!item) return;
            
            item.text = newText;
            item.assignedTo = selectedListItemMember;
            localStorage.setItem('lists', JSON.stringify(lists));
            
            closeEditListItemPanel();
            renderListsColumns();
        }
        
        // Calendar Filter State
        let calendarFilterActive = [];
        
        function initCalendarFilter() {
            // Initialize all members as active (visible)
            calendarFilterActive = familyMembers.map(m => m.name);
            renderCalendarFilterList();
        }
        
        function renderCalendarFilterList() {
            const list = document.getElementById('calendarFilterList');
            if (!list) return;
            
            let html = '';
            familyMembers.forEach(member => {
                const isActive = calendarFilterActive.includes(member.name);
                html += `
                    <div class="calendar-filter-item">
                        <div class="calendar-filter-avatar" style="background: ${member.color}" onclick="toggleCalendarFilterMember('${member.name}')">
                            ${member.name.charAt(0).toUpperCase()}
                        </div>
                        <div class="calendar-filter-info" onclick="toggleCalendarFilterMember('${member.name}')">
                            <div class="calendar-filter-name">${member.name}</div>
                        </div>
                        <button class="calendar-filter-edit-btn" onclick="event.stopPropagation(); openEditProfileModal('${member.name}')" title="Edit profile">
                            ✏️
                        </button>
                        <div class="calendar-filter-toggle ${isActive ? 'active' : ''}" onclick="toggleCalendarFilterMember('${member.name}')"></div>
                    </div>
                `;
            });
            list.innerHTML = html;
            
            // Update filter button state
            updateFilterButtonState();
        }
        
        function toggleCalendarFilter() {
            // If in meals section, open meal filter modal instead
            if (currentSection === 'meals') {
                openMealFilterModal();
                return;
            }
            
            // If in lists section, show lists filter
            if (currentSection === 'lists') {
                const dropdown = document.getElementById('calendarFilterDropdown');
                
                // Update the dropdown content for lists
                const filterList = document.getElementById('calendarFilterList');
                const choresFilterSection = document.getElementById('choresFilterSection');
                
                if (filterList) filterList.style.display = 'none'; // Hide member filters
                if (choresFilterSection) {
                    choresFilterSection.style.display = 'block';
                    
                    // Update checkbox for lists completed items
                    const checkbox = document.getElementById('showCompletedChores');
                    if (checkbox) {
                        checkbox.checked = window.showCompletedListItems || false;
                        // Update the label
                        const label = choresFilterSection.querySelector('span');
                        if (label) label.textContent = 'Show Completed';
                    }
                }
                
                dropdown.classList.toggle('active');
                return;
            }
            
            // Otherwise show calendar filter dropdown
            const dropdown = document.getElementById('calendarFilterDropdown');
            
            // Reset to calendar view (show member filters, hide completed toggle for calendar)
            const filterList = document.getElementById('calendarFilterList');
            const choresFilterSection = document.getElementById('choresFilterSection');
            
            if (filterList) filterList.style.display = 'block';
            if (choresFilterSection) choresFilterSection.style.display = 'none';
            
            dropdown.classList.toggle('active');
        }
        
        function toggleCalendarFilterMember(memberName) {
            const index = calendarFilterActive.indexOf(memberName);
            if (index > -1) {
                calendarFilterActive.splice(index, 1);
            } else {
                calendarFilterActive.push(memberName);
            }
            
            renderCalendarFilterList();
            
            // Re-render current view
            if (currentView === 'month') renderCalendar();
            else if (currentView === 'week') renderWeekView();
            else if (currentView === 'schedule') renderScheduleView();
            else if (currentView === 'day') renderDayView();
        }
        
        function toggleShowCompletedChores() {
            var checkbox = document.getElementById('showCompletedChores');
            
            if (currentSection === 'lists') {
                // For lists section
                window.showCompletedListItems = checkbox ? checkbox.checked : false;
                renderListsColumns();
            } else {
                // For chores section
                showCompletedChores = checkbox ? checkbox.checked : false;
                renderChoresView();
            }
        }
        
        // Expose globally
        window.toggleShowCompletedChores = toggleShowCompletedChores;
        
        function updateFilterButtonState() {
            const btn = document.getElementById('calendarFilterBtn');
            const allActive = calendarFilterActive.length === familyMembers.length;
            
            if (allActive) {
                btn.classList.remove('active');
            } else {
                btn.classList.add('active');
            }
        }
        
        // Edit Profile Functions
        let currentEditProfileName = null;
        const skylightColors = [
            '#FF6B6B', '#FF8E53', '#FFA07A', '#FFB6C1', '#DDA0DD',
            '#DA70D6', '#BA55D3', '#9370DB', '#8A7FD3', '#6495ED',
            '#4A90E2', '#5DADE2', '#48C9B0', '#45B39D', '#52BE80',
            '#58D68D', '#82E0AA', '#F4D03F', '#F7DC6F', '#F8B739',
            '#E67E22', '#DC7633', '#CA6F1E', '#AF7AC5', '#85929E'
        ];
        
        function openEditProfileModal(memberName) {
            currentEditProfileName = memberName;
            const member = familyMembers.find(m => m.name === memberName);
            
            if (!member) return;
            
            document.getElementById('editProfileName').value = member.name;
            renderColorPicker(member.color);
            
            document.getElementById('editProfileModal').classList.add('active');
        }
        
        function closeEditProfileModal() {
            document.getElementById('editProfileModal').classList.remove('active');
            currentEditProfileName = null;
        }
        
        function renderColorPicker(selectedColor) {
            const grid = document.getElementById('colorPickerGrid');
            
            let html = '';
            skylightColors.forEach(color => {
                const isSelected = color === selectedColor;
                html += `
                    <div class="color-picker-item ${isSelected ? 'selected' : ''}" 
                         style="background: ${color}" 
                         data-color="${color}"
                         onclick="selectProfileColor('${color}')">
                    </div>
                `;
            });
            
            grid.innerHTML = html;
        }
        
        function selectProfileColor(color) {
            const items = document.querySelectorAll('.color-picker-item');
            items.forEach(item => {
                if (item.dataset.color === color) {
                    item.classList.add('selected');
                } else {
                    item.classList.remove('selected');
                }
            });
        }
        
        function scrollColorPicker(direction) {
            const scroll = document.getElementById('colorPickerScroll');
            const scrollAmount = 200;
            scroll.scrollLeft += direction * scrollAmount;
        }
        
        function saveEditedProfile() {
            const newName = document.getElementById('editProfileName').value.trim();
            const selectedColorItem = document.querySelector('.color-picker-item.selected');
            const newColor = selectedColorItem ? selectedColorItem.dataset.color : null;
            
            if (!newName) {
                alert('Please enter a profile name');
                return;
            }
            
            if (!newColor) {
                alert('Please select a color');
                return;
            }
            
            const member = familyMembers.find(m => m.name === currentEditProfileName);
            if (!member) return;
            
            const oldName = member.name;
            
            // Update member
            member.name = newName;
            member.color = newColor;
            
            // Update localStorage
            localStorage.setItem('familyMembers', JSON.stringify(familyMembers)); window.familyMembers = familyMembers;
            
            // Update all references in other data
            updateMemberReferences(oldName, newName);
            
            // Update calendar filter
            const filterIndex = calendarFilterActive.indexOf(oldName);
            if (filterIndex > -1) {
                calendarFilterActive[filterIndex] = newName;
            }
            
            closeEditProfileModal();
            renderCalendarFilterList();
            
            // Re-render current view
            if (currentView === 'month') renderCalendar();
            else if (currentView === 'week') renderWeekView();
            else if (currentView === 'schedule') renderScheduleView();
            else if (currentView === 'day') renderDayView();
        }
        
        function updateMemberReferences(oldName, newName) {
            // Update events
            events.forEach(event => {
                if (event.member === oldName) {
                    event.member = newName;
                }
            });
            localStorage.setItem('events', JSON.stringify(events));
            
            // Update tasks
            tasks.forEach(task => {
                if (task.member === oldName) {
                    task.member = newName;
                }
            });
            localStorage.setItem('tasks', JSON.stringify(tasks));
            
            // Update chores
            chores.forEach(chore => {
                if (chore.member === oldName) {
                    chore.member = newName;
                }
            });
            localStorage.setItem('chores', JSON.stringify(chores));
            
            // Update routines
            routines.forEach(routine => {
                if (routine.member === oldName) {
                    routine.member = newName;
                }
            });
            localStorage.setItem('routines', JSON.stringify(routines));
            
            // Update rewards
            rewards.forEach(reward => {
                if (reward.member === oldName) {
                    reward.member = newName;
                }
            });
            localStorage.setItem('rewards', JSON.stringify(rewards));
            
            // Update lists
            lists.forEach(list => {
                if (familyMembers.find(m => m.id === list.assignedTo && m.name === oldName)) {
                    const member = familyMembers.find(m => m.name === newName);
                    if (member) list.assignedTo = member.id;
                }
            });
            localStorage.setItem('lists', JSON.stringify(lists));
        }
        
        function isEventVisible(event) {
            // Check if event's assigned member is in active filter
            if (event.member && calendarFilterActive.includes(event.member)) return true;
            
            // If no assigned member, show unless a filter is narrowing to specific people
            if (!event.member) {
                // If all members are active (no filtering), show unassigned events
                const allActive = calendarFilterActive.length === familyMembers.length;
                if (allActive) return true;
                // If filtering, check if any active member's name appears in notes
                if (event.notes) {
                    return calendarFilterActive.some(function(name) {
                        return event.notes.toLowerCase().indexOf(name.toLowerCase()) !== -1;
                    });
                }
                return false;
            }

            // Event has an assigned member not in filter — still show if notes mention an active member
            if (event.notes) {
                return calendarFilterActive.some(function(name) {
                    return event.notes.toLowerCase().indexOf(name.toLowerCase()) !== -1;
                });
            }

            return false;
        }
        
        // Close filter dropdown when clicking outside
        document.addEventListener('click', function(e) {
            const dropdown = document.getElementById('calendarFilterDropdown');
            const btn = document.getElementById('calendarFilterBtn');
            if (dropdown && btn && !btn.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
        
        // Utility function to convert hex color to rgba
        const _rgbaCache = {};
        function hexToRgba(hex, alpha) {
            // Check cache first
            const cacheKey = hex + '|' + alpha;
            if (_rgbaCache[cacheKey]) return _rgbaCache[cacheKey];
            
            // Handle null/undefined/empty
            if (!hex || hex === '') {
                return `rgba(155, 89, 182, ${alpha})`; // Default to Family purple
            }
            
            // Remove # if present
            hex = hex.replace('#', '');
            
            // Validate hex format
            if (hex.length !== 6) {
                return `rgba(155, 89, 182, ${alpha})`; // Default to Family purple
            }
            
            // Convert to RGB
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            
            // Validate RGB values
            if (isNaN(r) || isNaN(g) || isNaN(b)) {
                return `rgba(155, 89, 182, ${alpha})`; // Default to Family purple
            }
            
            const result = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            _rgbaCache[cacheKey] = result;
            return result;
        }
        
        function init() {
            updateDateTime();
            updateWeather();
            renderFamilyMembers();
            initCalendarFilter();
            
            // Initialize sample chores if none exist
            if (chores.length === 0) {
                initializeSampleChores();
            }
            
            // Initialize sample routines if none exist
            if (routines.length === 0) {
                initializeSampleRoutines();
            }
            
            // Initialize sample recipes
            initializeSampleRecipes();
            
            // Initialize sample lists
            initializeSampleLists();
            
            // Initialize sample rewards if none exist
            if (rewards.length === 0) {
                initializeSampleRewards();
            }
            
            // Handle hash-based routing on desktop
            if (window.innerWidth > 768) {
                const hash = window.location.hash;
                if (hash && hash.startsWith('#/')) {
                    const section = hash.substring(2);
                    switchSection(section);
                } else {
                    // Default to calendar
                    window.location.hash = '#/calendar';
                    switchSection('calendar');
                }
            } else {
                // Mobile: don't set a default hash, let mobile home show
                // The initMobile() function will handle routing
                const hash = window.location.hash;
                if (hash && hash.startsWith('#/') && hash !== '#/home') {
                    // If there's a hash for a section, initialize that section
                    switchSection(hash.substring(2));
                }
                // Otherwise mobile home will be shown by initMobile()
            }
            
            setInterval(updateDateTime, 15000); // Update every 15s (only shows hours:minutes)
            setInterval(updateWeather, 1800000); // Update every 30 minutes
            
            // Google Calendar auth is handled by GoogleCalendar.init() above
        }
        
        function initializeSampleRoutines() {
            const sampleRoutines = [
                // Mary routines - Morning
                { id: Date.now() + 100, member: 'Mary', period: 'Morning', title: 'Brush teeth', icon: '🪥', completed: false, stars: 10 },
                { id: Date.now() + 101, member: 'Mary', period: 'Morning', title: 'Get dressed', icon: '👕', completed: false },
                { id: Date.now() + 102, member: 'Mary', period: 'Morning', title: 'Make bed', icon: '🛏️', completed: false },
                { id: Date.now() + 103, member: 'Mary', period: 'Morning', title: 'Wash face', icon: '🧼', completed: false },
                
                // Bret routines - Morning
                { id: Date.now() + 110, member: 'Bret', period: 'Morning', title: 'Brush teeth', icon: '🪥', completed: false },
                { id: Date.now() + 111, member: 'Bret', period: 'Morning', title: 'Get dressed', icon: '👕', completed: false },
                { id: Date.now() + 112, member: 'Bret', period: 'Morning', title: 'Make bed', icon: '🛏️', completed: false },
                
                // Levi routines - Morning
                { id: Date.now() + 120, member: 'Levi', period: 'Morning', title: 'Brush teeth', icon: '🪥', completed: false },
                { id: Date.now() + 121, member: 'Levi', period: 'Morning', title: 'Get dressed', icon: '👕', completed: false },
                { id: Date.now() + 122, member: 'Levi', period: 'Morning', title: 'Make bed', icon: '🛏️', completed: false },
                { id: Date.now() + 123, member: 'Levi', period: 'Morning', title: 'Wash face', icon: '🧼', completed: false },
                
                // Elsie routines - Morning
                { id: Date.now() + 130, member: 'Elsie', period: 'Morning', title: 'Brush teeth', icon: '🪥', completed: false },
                { id: Date.now() + 131, member: 'Elsie', period: 'Morning', title: 'Get dressed', icon: '👕', completed: false },
                { id: Date.now() + 132, member: 'Elsie', period: 'Morning', title: 'Make bed', icon: '🛏️', completed: false },
            ];
            
            routines = sampleRoutines;
            localStorage.setItem('routines', JSON.stringify(routines));
        }
        
        function initializeSampleChores() {
            const sampleChores = [
                // Mary chores
                { id: Date.now() + 1, member: 'Mary', title: 'Water plants', frequency: 'Daily', icon: '💧', completed: false, stars: 5 },
                { id: Date.now() + 2, member: 'Mary', title: 'Pack lunches', frequency: 'Daily', icon: '🍱', completed: false, stars: 5 },
                { id: Date.now() + 3, member: 'Mary', title: 'Load dishwasher', frequency: 'Daily', completed: false, stars: 5 },
                { id: Date.now() + 4, member: 'Mary', title: 'Grocery Run', frequency: 'Weekly', icon: '🛒', completed: false, stars: 5 },
                { id: Date.now() + 5, member: 'Mary', title: 'Sweep kitchen', frequency: 'Daily', icon: '🧹', completed: false, stars: 5 },
                { id: Date.now() + 6, member: 'Mary', title: 'Laundry', frequency: 'Daily', icon: '🧺', completed: false, stars: 5 },
                
                // Bret chores
                { id: Date.now() + 7, member: 'Bret', title: 'Laundry', frequency: 'Weekly', icon: '🧺', completed: false, stars: 250 },
                { id: Date.now() + 8, member: 'Bret', title: 'Sign Permission Slip', frequency: 'Daily', icon: '⭐', completed: false, stars: 5 },
                { id: Date.now() + 9, member: 'Bret', title: 'Mow lawn', frequency: 'Weekly', icon: '🌱', completed: false, stars: 5 },
                { id: Date.now() + 10, member: 'Bret', title: 'Litter box', frequency: 'Daily', icon: '💩', completed: false, stars: 5 },
                { id: Date.now() + 11, member: 'Bret', title: 'Clean Bathrooms', frequency: 'Weekly', icon: '🚿', completed: false, stars: 10 },
                { id: Date.now() + 12, member: 'Bret', title: 'Unload dishwasher', frequency: 'Daily', completed: true, stars: 5 },
                
                // Levi chores
                { id: Date.now() + 13, member: 'Levi', title: 'Feed Cleo', frequency: 'Daily', icon: '⭐', completed: false, stars: 5 },
                { id: Date.now() + 14, member: 'Levi', title: 'Get the mail', frequency: 'Daily', icon: '📬', completed: false, stars: 10 },
                { id: Date.now() + 15, member: 'Levi', title: 'Make Bed', frequency: 'Daily', icon: '🛏️', completed: false, stars: 5 },
                { id: Date.now() + 16, member: 'Levi', title: 'Brush Teeth', frequency: 'Daily', icon: '🪥', completed: false, stars: 5 },
                
                // Elsie chores
                { id: Date.now() + 17, member: 'Elsie', title: 'Feed Cleo', frequency: 'Daily', icon: '⭐', completed: false, stars: 5 },
                { id: Date.now() + 18, member: 'Elsie', title: 'Water plants', frequency: 'Daily', icon: '💧', completed: false, stars: 5 },
                { id: Date.now() + 19, member: 'Elsie', title: 'Make Bed', frequency: 'Daily', icon: '🛏️', completed: false, stars: 5 },
            ];
            
            chores = sampleChores;
            localStorage.setItem('chores', JSON.stringify(chores));
        }
        
        function initializeSampleRewards() {
            const sampleRewards = [
                // Mary rewards
                { id: Date.now() + 1, member: 'Mary', title: 'Bagel run', emoji: '🥯', starsNeeded: 20, redeemed: false },
                { id: Date.now() + 2, member: 'Mary', title: 'New purse', emoji: '👜', starsNeeded: 300, redeemed: false },
                
                // Bret rewards
                { id: Date.now() + 3, member: 'Bret', title: 'Mini golf with Dad', emoji: '⛳', starsNeeded: 30, redeemed: false },
                { id: Date.now() + 4, member: 'Bret', title: 'New video game', emoji: '🎮', starsNeeded: 100, redeemed: false },
                
                // Levi rewards
                { id: Date.now() + 5, member: 'Levi', title: 'Gummy worms', emoji: '🪱', starsNeeded: 25, redeemed: false },
                { id: Date.now() + 6, member: 'Levi', title: 'Pick out a new toy', emoji: '🧸', starsNeeded: 30, redeemed: false },
                
                // Elsie rewards
                { id: Date.now() + 7, member: 'Elsie', title: 'Girls movie night', emoji: '🍿', starsNeeded: 20, redeemed: false },
                { id: Date.now() + 8, member: 'Elsie', title: 'Beach day', emoji: '🏖️', starsNeeded: 40, redeemed: false },
            ];
            
            rewards = sampleRewards;
            localStorage.setItem('rewards', JSON.stringify(rewards));
        }
        
        // Auth check and session restore is now handled by GoogleCalendar.init()
        // in google-calendar-oauth.js (redirect-based flow, no gapi needed)

        // Initialize Google Calendar OAuth IMMEDIATELY (must run before hash routing
        // so we can catch the OAuth redirect token in the URL hash)
        if (typeof GoogleCalendar !== 'undefined') {
            console.log('Initializing Google Calendar OAuth...');
            GoogleCalendar.init();
        } else {
            console.warn('Google Calendar OAuth module not loaded');
        }

        function connectGoogleCalendar() {
            GoogleCalendar.connect();
        }

        async function loadGoogleCalendarEvents() {
            // This function is now handled by GoogleCalendar.init() and GoogleCalendar.loadEvents()
            // Events are automatically loaded when connected
            if (typeof GoogleCalendar !== 'undefined' && GoogleCalendar.isConnected()) {
                await GoogleCalendar.loadEvents();
                
                // Re-render calendar
                if (currentView === 'month') renderCalendar();
                else if (currentView === 'week') renderWeekView();
                else if (currentView === 'schedule') renderScheduleView();
                else if (currentView === 'day') renderDayView();
            }
        }

        function getAllEvents() {
            // Always read from window.events (kept in sync) so Supabase/tab reloads are reflected
            const localEvents = window.events || events;
            
            // Get events from Google Calendar if available
            let googleEvents = [];
            if (typeof GoogleCalendar !== 'undefined') {
                googleEvents = GoogleCalendar.getEvents();
            }
            
            return [...localEvents, ...googleEvents];
        }
        
        function isEventOnDate(event, dateStr) {
            // Check if event occurs on the given date
            // For multi-day events, check if date falls within range
            const eventStart = event.date;
            const eventEnd = event.endDate || event.date; // Use start date if no end date
            
            return dateStr >= eventStart && dateStr <= eventEnd;
        }
        
        function getFamilyColor() {
            // Get the Family profile color as the default for unassigned events
            const familyProfile = familyMembers.find(m => m.name === 'Family');
            return familyProfile ? familyProfile.color : '#9B59B6';
        }

        function getEventMember(event) {
            // Returns the resolved member object for an event (assigned or from notes)
            if (event.member) {
                const m = familyMembers.find(m => m.name === event.member);
                if (m) return m;
            }
            if (event.notes) {
                const notesLower = event.notes.toLowerCase();
                const match = familyMembers.find(m => !m.isGoogleCalendar && m.name !== 'Family' && notesLower.indexOf(m.name.toLowerCase()) !== -1);
                if (match) return match;
            }
            return null;
        }

        function getEventColor(event) {
            const m = getEventMember(event);
            return m ? m.color : getFamilyColor();
        }

        function updateDateTime() {
            const now = new Date();
            const dateOptions = { month: 'long', day: 'numeric' };
            document.getElementById('dateDisplay').textContent = now.toLocaleDateString('en-US', dateOptions);
            document.getElementById('timeDisplay').textContent = now.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit' 
            });
        }

        async function updateWeather() {
            try {
                const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=33.4484&longitude=-112.0740&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=America/Phoenix');
                const data = await response.json();
                const temp = Math.round(data.current.temperature_2m);
                const weatherCode = data.current.weather_code;
                const weatherEmoji = getWeatherEmoji(weatherCode);
                document.getElementById('weatherDisplay').textContent = `${weatherEmoji} ${temp}°F`;
            } catch (error) {
                document.getElementById('weatherDisplay').textContent = 'Weather unavailable';
            }
        }

        function getWeatherEmoji(code) {
            if (code === 0) return '☀️';
            if (code <= 3) return '⛅';
            if (code <= 67) return '🌧️';
            if (code <= 77) return '🌨️';
            return '🌤️';
        }

        function renderFamilyMembers() {
            const container = document.getElementById('familyMembers');
            container.innerHTML = familyMembers.map(member => 
                `<div class="member" style="background-color: ${hexToRgba(member.color, 0.125)}; border-left: 4px solid ${member.color}">
                    <strong>${member.name}</strong>
                </div>`
            ).join('');

            // Update dropdowns
            const selects = document.querySelectorAll('#eventMember, #taskMember');
            selects.forEach(select => {
                select.innerHTML = '<option value="">Select Family Member</option>' +
                    familyMembers.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
            });
        }

        function addFamilyMember() {
            const name = prompt('Enter family member name:');
            if (name) {
                const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA'];
                const color = colors[familyMembers.length % colors.length];
                familyMembers.push({ name, color });
                localStorage.setItem('familyMembers', JSON.stringify(familyMembers)); window.familyMembers = familyMembers;
                if (currentSection === 'calendar') {
                    renderFamilyPills();
                }
                renderPersonAvatars();
                
                // Update dropdowns
                const selects = document.querySelectorAll('#eventMember, #taskMember');
                selects.forEach(select => {
                    select.innerHTML = '<option value="">Select Family Member</option>' +
                        familyMembers.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
                });
            }
        }

        function renderPersonAvatars() {
            const container = document.getElementById('personAvatars');
            if (!container) return;
            
            container.innerHTML = familyMembers.filter(m => !m.isGoogleCalendar).map(member => {
                const initial = member.name.charAt(0).toUpperCase();
                return `<div class="person-avatar" style="background: ${member.color}" onclick="viewPersonTasks('${member.name}')">
                    ${initial}
                </div>`;
            }).join('');
        }

        function viewPersonTasks(memberName) {
            // Switch to tasks section and filter by person
            switchSection('tasks');
            // You can add filtering logic here if desired
        }

        function renderCalendar() {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            
            document.getElementById('monthYear').textContent = 
                new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const daysInPrevMonth = new Date(year, month, 0).getDate();

            const grid = document.getElementById('calendarGrid');
            let html = `
                <div class="day-header">Sun</div>
                <div class="day-header">Mon</div>
                <div class="day-header">Tue</div>
                <div class="day-header">Wed</div>
                <div class="day-header">Thu</div>
                <div class="day-header">Fri</div>
                <div class="day-header">Sat</div>
            `;

            for (let i = firstDay - 1; i >= 0; i--) {
                const day = daysInPrevMonth - i;
                html += `<div class="day-cell other-month"><div class="day-number">${day}</div></div>`;
            }

            const today = new Date();
            const allEvents = getAllEvents();
            
            for (let day = 1; day <= daysInMonth; day++) {
                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayEvents = allEvents.filter(e => isEventOnDate(e, dateStr) && isEventVisible(e)).sort((a, b) => {
                    if (!a.time) return -1;
                    if (!b.time) return 1;
                    return a.time.localeCompare(b.time);
                });

                let eventsHtml = '';
                dayEvents.slice(0, 3).forEach(event => {
                    const member = getEventMember(event);
                    const color = getEventColor(event);
                    const bgColor = hexToRgba(color, 0.25);
                    
                    // Format time to 12-hour format
                    let timeStr = '';
                    if (event.time) {
                        const [hours, minutes] = event.time.split(':').map(Number);
                        const period = hours >= 12 ? 'PM' : 'AM';
                        const displayHours = hours % 12 || 12;
                        timeStr = `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
                    } else {
                        timeStr = 'All day';
                    }
                    
                    eventsHtml += `
                        <div class="day-event-item" style="background-color: ${bgColor}; color: #000;" onclick="event.stopPropagation(); showEventDetails('${event.id}')">
                            <span class="day-event-time">${timeStr}</span>
                            <span class="day-event-title">${event.title}</span>
                        </div>
                    `;
                });

                if (dayEvents.length > 3) {
                    eventsHtml += `<div class="day-event-item" style="color: #999;">${dayEvents.length - 3} More...</div>`;
                }

                html += `
                    <div class="day-cell ${isToday ? 'today' : ''}" onclick="showDayEvents('${dateStr}')">
                        <div class="day-number">${day}</div>
                        <div class="day-events">${eventsHtml}</div>
                    </div>
                `;
            }

            const remainingCells = 42 - (firstDay + daysInMonth);
            for (let day = 1; day <= remainingCells; day++) {
                html += `<div class="day-cell other-month"><div class="day-number">${day}</div></div>`;
            }
            grid.innerHTML = html;
        }

        function navigateMonth(direction) {
            currentDate.setMonth(currentDate.getMonth() + direction);
            renderCalendar();
        }

        function navigateView(direction) {
            if (currentSection === 'meals') {
                navigateMealWeek(direction);
            } else if (currentView === 'month') {
                currentDate.setMonth(currentDate.getMonth() + direction);
                renderCalendar();
            } else if (currentView === 'week') {
                currentDate.setDate(currentDate.getDate() + (direction * 7));
                renderWeekView();
            } else if (currentView === 'schedule') {
                currentDate.setDate(currentDate.getDate() + (direction * scheduleDaysToShow));
                renderScheduleView();
            } else if (currentView === 'day') {
                currentDate.setDate(currentDate.getDate() + direction);
                renderDayView();
            }
            updateViewHeader();
        }

        function updateViewHeader() {
            const todayNav = document.getElementById('todayNav');
            const monthNav = document.getElementById('monthNav');
            const weekNav = document.getElementById('weekNav');
            const monthDisplay = document.getElementById('monthDisplay');
            const weekDisplay = document.getElementById('weekDisplay');
            
            // Hide all navs first
            todayNav.classList.remove('active');
            monthNav.classList.remove('active');
            weekNav.classList.remove('active');
            
            if (currentSection === 'meals') {
                // Meals section: show only today nav
                todayNav.classList.add('active');
            } else if (currentView === 'month') {
                // Month view: show view dropdown + month nav
                monthNav.classList.add('active');
                monthDisplay.textContent = currentDate.toLocaleDateString('en-US', { month: 'long' });
                
            } else if (currentView === 'week') {
                // Week view: show week nav with date range
                weekNav.classList.add('active');
                const weekStart = getWeekStart(currentDate);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                
                const startDay = weekStart.toLocaleDateString('en-US', { weekday: 'short' });
                const startDate = weekStart.getDate();
                const endDate = weekEnd.getDate();
                
                weekDisplay.textContent = `${startDay} ${startDate}-${endDate}`;
                
            } else if (currentView === 'day') {
                // Day view: show view dropdown + today nav
                todayNav.classList.add('active');
                
            } else if (currentView === 'schedule') {
                // Schedule view: show only view dropdown (no additional nav)
            }
        }

        function getWeekStart(date) {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day;
            return new Date(d.setDate(diff));
        }

        function renderWeekView() {
            const container = document.getElementById('weekView');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const weekStart = new Date(currentDate);
            const weekDays = [];
            
            // Get 7 days starting from currentDate
            for (let i = 0; i < 7; i++) {
                const day = new Date(weekStart);
                day.setDate(weekStart.getDate() + i);
                weekDays.push(day);
            }
            
            // Get all events
            const allEvents = getAllEvents();
            
            let html = '<div class="simple-week-grid">';
            
            // Render 7 day boxes with events
            weekDays.forEach(day => {
                const isToday = day.getTime() === today.getTime();
                const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = day.getDate();
                const dateStr = day.toISOString().split('T')[0];
                
                // Get events for this day
                const dayEvents = allEvents.filter(e => isEventOnDate(e, dateStr) && isEventVisible(e)).sort((a, b) => {
                    if (!a.time) return -1;
                    if (!b.time) return 1;
                    return a.time.localeCompare(b.time);
                });
                
                html += `<div class="simple-week-day">
                    <div class="simple-week-day-header ${isToday ? 'today' : ''}">
                        <div class="week-day-name">${dayName}</div>
                        <div class="week-day-number">${dayNum}</div>
                    </div>
                    <div class="simple-week-events-count">${dayEvents.length} event${dayEvents.length !== 1 ? 's' : ''}</div>`;
                
                // Display events
                dayEvents.forEach(event => {
                    const member = getEventMember(event);
                    const color = getEventColor(event);
                    const bgColor = hexToRgba(color, 0.25);
                    
                    // Format time
                    let timeStr = '';
                    if (event.time) {
                        const [hours, minutes] = event.time.split(':').map(Number);
                        const period = hours >= 12 ? 'PM' : 'AM';
                        const displayHours = hours % 12 || 12;
                        timeStr = `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
                    } else {
                        timeStr = 'All day';
                    }
                    
                    const initial = member ? member.name.charAt(0).toUpperCase() : '';
                    
                    html += `<div class="schedule-event" style="background-color: ${bgColor}; border-left-color: ${color}; margin-bottom: 8px;" onclick="event.stopPropagation(); showEventDetails('${event.id}')">
                        <div class="schedule-event-content">
                            <div class="schedule-event-time" style="color: ${color}">${timeStr}</div>
                            <div class="schedule-event-title">${event.title}</div>
                            ${event.member ? `<div class="schedule-event-member">${event.member}</div>` : ''}
                        </div>
                        ${initial ? `<div class="schedule-event-dot" style="background: ${color}">${initial}</div>` : ''}
                    </div>`;
                });
                
                html += `<div class="simple-week-add-btn" onclick="openEventModalForDate('${dateStr}')">+ Add Event</div>
                </div>`;
            });
            
            // Add "Next Week" box
            const nextWeekDate = new Date(weekStart);
            nextWeekDate.setDate(nextWeekDate.getDate() + 7);
            const nextWeekEnd = new Date(nextWeekDate);
            nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);
            
            const startMonth = nextWeekDate.toLocaleDateString('en-US', { month: 'short' });
            const endMonth = nextWeekEnd.toLocaleDateString('en-US', { month: 'short' });
            const dateRange = startMonth === endMonth 
                ? `${startMonth} ${nextWeekDate.getDate()}-${nextWeekEnd.getDate()}`
                : `${startMonth} ${nextWeekDate.getDate()} - ${endMonth} ${nextWeekEnd.getDate()}`;
            
            html += `<div class="simple-week-day simple-week-next-week" onclick="navigateView(1)">
                <div class="simple-week-next-label">Next Week</div>
                <div class="simple-week-next-date">${dateRange}</div>
            </div>`;
            
            html += '</div>';
            container.innerHTML = html;
        }
        
        function renderDayView() {
            const container = document.getElementById('dayView');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const viewDate = new Date(currentDate);
            viewDate.setHours(0, 0, 0, 0);
            const dateStr = viewDate.toISOString().split('T')[0];
            const isToday = viewDate.getTime() === today.getTime();
            
            const dayName = viewDate.toLocaleDateString('en-US', { weekday: 'long' });
            const dayNum = viewDate.getDate();
            const monthName = viewDate.toLocaleDateString('en-US', { month: 'long' });
            
            const allEvents = getAllEvents();
            const dayEvents = allEvents.filter(e => isEventOnDate(e, dateStr) && isEventVisible(e)).sort((a, b) => {
                if (!a.time) return -1;
                if (!b.time) return 1;
                return a.time.localeCompare(b.time);
            });
            
            let html = '<div class="day-view-container">';
            
            // Add mini calendar
            html += '<div class="day-view-mini-calendar">';
            html += renderMiniCalendar();
            html += '</div>';
            
            // Main content area (header + events)
            html += '<div class="day-view-main">';
            
            // Day header
            html += `<div class="day-view-header">
                <div class="day-view-title ${isToday ? 'today' : ''}">
                    <div class="week-day-name">${dayName}</div>
                    <div class="week-day-number">${dayNum}</div>
                </div>
                <div class="day-view-month">${monthName}</div>
            </div>`;
            
            // Events list
            if (dayEvents.length === 0) {
                html += `<div style="text-align: center; color: #999; padding: 40px; font-style: italic;">No events for this day</div>`;
            } else {
                html += '<div class="day-view-events">';
                dayEvents.forEach(event => {
                    const member = getEventMember(event);
                    const color = getEventColor(event);
                    const initial = member ? member.name.charAt(0).toUpperCase() : '';
                    
                    html += `<div class="day-view-event" style="background-color: ${hexToRgba(color, 0.25)}; border-left-color: ${color}" onclick="showEventDetails('${event.id}')">
                        <div class="day-view-event-time">${event.time || 'All day'}</div>
                        <div class="day-view-event-title">${event.title}</div>
                        ${event.member ? `<div class="day-view-event-member">${event.member}</div>` : ''}
                        ${initial ? `<div class="day-view-event-dot" style="background: ${color}">${initial}</div>` : ''}
                    </div>`;
                });
                html += '</div>';
            }
            
            html += '</div>'; // Close day-view-main
            html += '</div>'; // Close day-view-container
            container.innerHTML = html;
        }
        
        function renderMiniCalendar() {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const today = new Date();
            const viewDate = new Date(currentDate);
            viewDate.setHours(0, 0, 0, 0);
            
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            
            let html = `
                <div class="mini-calendar-header">
                    <button class="mini-calendar-nav" onclick="changeMiniMonth(-1)">‹</button>
                    <div class="mini-calendar-title">${monthName}</div>
                    <button class="mini-calendar-nav" onclick="changeMiniMonth(1)">›</button>
                </div>
                <div class="mini-calendar-grid">
                    <div class="mini-calendar-day-header">S</div>
                    <div class="mini-calendar-day-header">M</div>
                    <div class="mini-calendar-day-header">T</div>
                    <div class="mini-calendar-day-header">W</div>
                    <div class="mini-calendar-day-header">T</div>
                    <div class="mini-calendar-day-header">F</div>
                    <div class="mini-calendar-day-header">S</div>
            `;
            
            // Empty cells before first day
            for (let i = 0; i < firstDay; i++) {
                html += '<div class="mini-calendar-day"></div>';
            }
            
            // Days of month
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                date.setHours(0, 0, 0, 0);
                const isToday = date.getTime() === today.getTime();
                const isSelected = date.getTime() === viewDate.getTime();
                
                html += `<div class="mini-calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" 
                              onclick="selectDayViewDate(${year}, ${month}, ${day})">
                    ${day}
                </div>`;
            }
            
            html += '</div>';
            return html;
        }
        
        function changeMiniMonth(delta) {
            currentDate.setMonth(currentDate.getMonth() + delta);
            renderDayView();
        }
        
        function selectDayViewDate(year, month, day) {
            currentDate = new Date(year, month, day);
            window.currentDate = currentDate;
            renderDayView();
        }
        
        function formatTime(time) {
            if (!time) return '';
            const [hours, minutes] = time.split(':').map(Number);
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
        }

        function renderScheduleView() {
            const container = document.getElementById('scheduleContainer');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // On mobile, start from the current week, on desktop use currentDate
            let startDate;
            if (window.innerWidth <= 768) {
                startDate = getWeekStart(today);
            } else {
                startDate = new Date(currentDate);
            }
            
            // Get the week start to calculate next week's dates
            const weekStart = getWeekStart(startDate);
            const nextWeekStart = new Date(weekStart);
            nextWeekStart.setDate(nextWeekStart.getDate() + 7);
            const nextWeekEnd = new Date(nextWeekStart);
            nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);
            
            const nextWeekStartStr = nextWeekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
            const nextWeekEndStr = nextWeekEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
            
            let html = '';
            
            // On mobile show only 7 days (current week), on desktop show scheduleDaysToShow
            const daysToShow = window.innerWidth <= 768 ? 7 : scheduleDaysToShow;
            
            // Get all events ONCE outside the loop
            const allEvents = getAllEvents();
            
            for (let i = 0; i < daysToShow; i++) {
                const day = new Date(startDate);
                day.setDate(startDate.getDate() + i);
                day.setHours(0, 0, 0, 0);
                
                const dateStr = day.toISOString().split('T')[0];
                const isToday = day.getTime() === today.getTime();
                const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = day.getDate();
                
                const dayEvents = allEvents.filter(e => isEventOnDate(e, dateStr) && isEventVisible(e)).sort((a, b) => {
                    if (!a.time) return -1;
                    if (!b.time) return 1;
                    return a.time.localeCompare(b.time);
                });

                html += `<div class="schedule-day-column">`;
                
                // Header with day title and add button
                html += `<div class="schedule-day-header">
                    <div class="schedule-day-title ${isToday ? 'today' : ''}">
                        <div class="week-day-name">${dayName}</div>
                        <div class="week-day-number">${dayNum}</div>
                    </div>
                    <button class="schedule-add-btn" onclick="openEventModalForDate('${dateStr}')">+ Add Event</button>
                </div>`;
                
                if (dayEvents.length === 0) {
                    html += `<div style="text-align: center; color: #999; padding: 20px; font-style: italic;">No events</div>`;
                } else {
                    html += '<div class="schedule-event-list">';
                    dayEvents.forEach(event => {
                        const member = getEventMember(event);
                        const color = getEventColor(event);
                        const initial = member ? member.name.charAt(0).toUpperCase() : '';
                        
                        const todayClass = isToday ? 'today' : '';
                        html += `<div class="schedule-event ${todayClass}" data-day-num="${dayNum}" style="background-color: ${hexToRgba(color, 0.25)}; border-left-color: ${color}" onclick="showEventDetails('${event.id}')">
                            <div class="schedule-event-content">
                                <div class="schedule-event-time" style="color: ${color}">${event.time || 'All day'}</div>
                                <div class="schedule-event-title">${event.title}</div>
                                ${event.member ? `<div class="schedule-event-member">${event.member}</div>` : ''}
                            </div>
                            ${initial ? `<div class="schedule-event-dot" style="background: ${color}">${initial}</div>` : ''}
                        </div>`;
                    });
                    html += '</div>';
                }
                
                html += '</div>';
            }
            
            container.innerHTML = html;
        }

        function switchSection(section) {
            currentSection = section;
            
            // Update URL hash
            if (window.location.hash !== '#/' + section) {
                window.history.replaceState(null, null, '#/' + section);
            }
            
            // Update nav highlighting
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
                // Check if the nav item's href matches the current section
                const href = item.getAttribute('href');
                if (href === '#/' + section) {
                    item.classList.add('active');
                }
            });
            
            var contentArea = document.getElementById('contentArea');
            
            // Hide all floating buttons
            document.getElementById('floatingAddBtn').classList.remove('active');
            document.getElementById('floatingAddTaskBtn').classList.remove('active');
            
            // Show/hide chores filter section based on current section
            var choresFilterSection = document.getElementById('choresFilterSection');
            var filterList = document.getElementById('calendarFilterList');
            var filterHeader = document.querySelector('.calendar-filter-header');
            
            if (section === 'chores') {
                if (choresFilterSection) choresFilterSection.style.display = 'block';
                if (filterList) filterList.style.display = 'none';
                if (filterHeader) filterHeader.textContent = 'Filter Chores';
            } else if (section === 'lists') {
                if (choresFilterSection) choresFilterSection.style.display = 'block';
                if (filterList) filterList.style.display = 'none';
                if (filterHeader) filterHeader.textContent = 'Filter Lists';
            } else {
                if (choresFilterSection) choresFilterSection.style.display = 'none';
                if (filterList) filterList.style.display = 'block';
                if (filterHeader) filterHeader.textContent = 'Filter Calendar';
            }
            
            // Show relevant sections based on navigation
            if (section === 'calendar') {
                // Reset display styles that may have been set by other sections
                document.getElementById('monthNav').style.display = '';
                document.getElementById('todayNav').style.display = '';
                document.getElementById('mainViewSelector').style.display = '';
                
                contentArea.innerHTML = `
                    <div class="family-pills" id="familyPills"></div>
                    
                    <div class="calendar-grid" id="calendarGrid"></div>
                    
                    <div class="week-view" id="weekView"></div>
                    
                    <div class="schedule-view" id="scheduleView">
                        <div class="schedule-container" id="scheduleContainer"></div>
                    </div>
                    
                    <div class="day-view" id="dayView"></div>
                `;
                renderFamilyPills();
                renderCalendarFilterList();
                
                // On mobile, default to schedule view, on desktop use current view
                if (window.innerWidth <= 768) {
                    // Use setTimeout to ensure DOM is ready
                    setTimeout(() => {
                        switchView('schedule');
                    }, 10);
                } else {
                    renderCalendar();
                }
                
                updateViewHeader();
                // Show floating add event button
                document.getElementById('floatingAddBtn').classList.add('active');
                
                // Refresh Google Calendar events whenever user navigates to calendar
                if (typeof GoogleCalendar !== 'undefined' && GoogleCalendar.isConnected()) {
                    GoogleCalendar.load().then(function() {
                        if (currentView === 'month') renderCalendar();
                        else if (currentView === 'week') renderWeekView();
                        else if (currentView === 'schedule') renderScheduleView();
                        else if (currentView === 'day') renderDayView();
                    });
                }
            } else if (section === 'chores') {
                // Hide calendar navigation
                document.getElementById('monthNav').style.display = 'none';
                document.getElementById('todayNav').style.display = 'none';
                document.getElementById('mainViewSelector').style.display = 'none';
                
                contentArea.innerHTML = `
                    <div class="chores-container" id="choresContainer"></div>
                `;
                renderChoresView();
                // Show floating add task button
                document.getElementById('floatingAddTaskBtn').classList.add('active');
            } else if (section === 'rewards') {
                // Hide calendar navigation
                document.getElementById('monthNav').style.display = 'none';
                document.getElementById('todayNav').style.display = 'none';
                document.getElementById('mainViewSelector').style.display = 'none';
                
                contentArea.innerHTML = `
                    <div class="rewards-container" id="rewardsContainer"></div>
                `;
                renderRewardsView();
                // Show floating add task button for adding rewards
                document.getElementById('floatingAddTaskBtn').classList.add('active');
            } else if (section === 'meals') {
                // Show Today navigation in the existing header
                document.getElementById('monthNav').style.display = 'none';
                document.getElementById('todayNav').style.display = 'flex';
                document.getElementById('mainViewSelector').style.display = 'none';
                
                contentArea.innerHTML = `<div id="mealPlanGrid"></div>`;
                renderMealPlanGrid();
                updateViewHeader();
            } else if (section === 'allowance') {
                // Show allowance section
                document.getElementById('monthNav').style.display = 'none';
                document.getElementById('todayNav').style.display = 'none';
                document.getElementById('mainViewSelector').style.display = 'none';
                
                contentArea.innerHTML = `
                    <div class="allowance-container">
                        <div id="allowanceGrid" class="allowance-grid"></div>
                    </div>
                `;
                renderAllowanceGrid();
            } else if (section === 'recipes') {
                document.getElementById('monthNav').style.display = 'none';
                document.getElementById('todayNav').style.display = 'none';
                document.getElementById('mainViewSelector').style.display = 'none';
                document.getElementById('floatingAddTaskBtn').classList.add('active');
                
                contentArea.innerHTML = `
                    <div class="recipes-container">
                        <div class="recipes-left-panel">
                            <div class="recipes-filter-buttons" id="recipesFilterButtons"></div>
                            <div class="recipes-list" id="recipesList"></div>
                        </div>
                        <div class="recipes-right-panel" id="recipesRightPanel">
                            <div class="recipes-empty-state">
                                <div class="recipes-empty-icon">📖</div>
                                <div class="recipes-empty-text">Select a recipe to view details</div>
                            </div>
                        </div>
                    </div>
                `;
                renderRecipesView();
            } else if (section === 'lists') {
                document.getElementById('monthNav').style.display = 'none';
                document.getElementById('todayNav').style.display = 'none';
                document.getElementById('mainViewSelector').style.display = 'none';
                document.getElementById('floatingAddTaskBtn').classList.add('active');
                
                contentArea.innerHTML = `
                    <div id="listsColumnsContainer" class="chores-columns"></div>
                `;
                renderListsColumns();
            } else if (section === 'habits') {
                document.getElementById('monthNav').style.display = 'none';
                document.getElementById('todayNav').style.display = 'none';
                document.getElementById('mainViewSelector').style.display = 'none';
                document.getElementById('floatingAddTaskBtn').classList.add('active');
                
                contentArea.innerHTML = '<div class="habits-container" id="habitsContainer"></div>';
                if (typeof renderHabitsView === 'function') renderHabitsView();
                
                var fab = document.getElementById('floatingAddTaskBtn');
                if (fab) fab.onclick = function() {
                    if (currentSection === 'habits') openAddHabitModal(null);
                    else handleFloatingAdd();
                };
            } else if (section === 'timer') {
                document.getElementById('monthNav').style.display = 'none';
                document.getElementById('todayNav').style.display = 'none';
                document.getElementById('mainViewSelector').style.display = 'none';
                
                contentArea.innerHTML = `
                    <div class="timer-section active">
                        <div class="timers-container">
                            <div class="timer-card" id="timer1">
                                <div class="timer-display" onclick="openTimerSetModal(1)" style="cursor: pointer;">
                                    <div class="timer-digit-group">
                                        <div class="timer-digits" id="timer1-hours">00</div>
                                        <div class="timer-label">hours</div>
                                    </div>
                                    <div class="timer-colon">:</div>
                                    <div class="timer-digit-group">
                                        <div class="timer-digits" id="timer1-minutes">00</div>
                                        <div class="timer-label">minutes</div>
                                    </div>
                                    <div class="timer-colon">:</div>
                                    <div class="timer-digit-group">
                                        <div class="timer-digits" id="timer1-seconds">00</div>
                                        <div class="timer-label">seconds</div>
                                    </div>
                                </div>
                                <div class="timer-controls">
                                    <button class="timer-btn timer-btn-reset" onclick="resetTimer(1)">🔄 Reset</button>
                                    <button class="timer-btn timer-btn-start" id="timer1-start-btn" onclick="startTimer(1)">▶ Start</button>
                                </div>
                            </div>
                            
                            <div class="timer-card" id="timer2">
                                <div class="timer-display" onclick="openTimerSetModal(2)" style="cursor: pointer;">
                                    <div class="timer-digit-group">
                                        <div class="timer-digits" id="timer2-hours">00</div>
                                        <div class="timer-label">hours</div>
                                    </div>
                                    <div class="timer-colon">:</div>
                                    <div class="timer-digit-group">
                                        <div class="timer-digits" id="timer2-minutes">00</div>
                                        <div class="timer-label">minutes</div>
                                    </div>
                                    <div class="timer-colon">:</div>
                                    <div class="timer-digit-group">
                                        <div class="timer-digits" id="timer2-seconds">00</div>
                                        <div class="timer-label">seconds</div>
                                    </div>
                                </div>
                                <div class="timer-controls">
                                    <button class="timer-btn timer-btn-reset" onclick="resetTimer(2)">🔄 Reset</button>
                                    <button class="timer-btn timer-btn-start" id="timer2-start-btn" onclick="startTimer(2)">▶ Start</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Timer Set Modal -->
                    <div class="edit-panel-overlay" id="timerSetOverlay" onclick="closeTimerSetModal()"></div>
                    <div class="edit-side-panel" id="timerSetModal">
                        <div class="edit-panel-header">
                            <button class="edit-panel-back" onclick="closeTimerSetModal()">←</button>
                            <div class="edit-panel-title">Set Timer</div>
                        </div>
                        
                        <div class="edit-panel-body">
                            <div class="edit-form-group">
                                <label class="edit-form-label">Hours</label>
                                <input type="number" class="edit-form-input" id="timerSetHours" min="0" max="23" value="0">
                            </div>
                            
                            <div class="edit-form-group">
                                <label class="edit-form-label">Minutes</label>
                                <input type="number" class="edit-form-input" id="timerSetMinutes" min="0" max="59" value="0">
                            </div>
                            
                            <button class="edit-save-btn" onclick="saveTimerSet()">Set Timer</button>
                        </div>
                    </div>
                `;
                
                initializeTimers();
            }
        }

        // Timer functionality
        let timer1State = { interval: null, totalSeconds: 0, running: false, alarmInterval: null };
        let timer2State = { interval: null, totalSeconds: 0, running: false, alarmInterval: null };
        let currentTimerBeingSet = null;
        
        function initializeTimers() {
            // Timers are now clickable via onclick in HTML
        }
        
        function openTimerSetModal(timerNum) {
            const timerState = timerNum === 1 ? timer1State : timer2State;
            if (timerState.running) return; // Can't edit while running
            
            currentTimerBeingSet = timerNum;
            
            // Pre-fill with current values
            const hours = Math.floor(timerState.totalSeconds / 3600);
            const minutes = Math.floor((timerState.totalSeconds % 3600) / 60);
            
            document.getElementById('timerSetHours').value = hours;
            document.getElementById('timerSetMinutes').value = minutes;
            
            document.getElementById('timerSetOverlay').classList.add('active');
            document.getElementById('timerSetModal').classList.add('active');
        }
        
        function closeTimerSetModal() {
            document.getElementById('timerSetOverlay').classList.remove('active');
            document.getElementById('timerSetModal').classList.remove('active');
            currentTimerBeingSet = null;
        }
        
        function saveTimerSet() {
            if (!currentTimerBeingSet) return;
            
            const hours = parseInt(document.getElementById('timerSetHours').value) || 0;
            const minutes = parseInt(document.getElementById('timerSetMinutes').value) || 0;
            
            updateTimerDisplay(currentTimerBeingSet, hours, minutes, 0);
            closeTimerSetModal();
        }
        
        function makeTimerEditable(timerNum) {
            // No longer needed - using modal instead
        }
        
        function updateTimerDisplay(timerNum, hours, minutes, seconds) {
            document.getElementById(`timer${timerNum}-hours`).textContent = String(hours).padStart(2, '0');
            document.getElementById(`timer${timerNum}-minutes`).textContent = String(minutes).padStart(2, '0');
            document.getElementById(`timer${timerNum}-seconds`).textContent = String(seconds).padStart(2, '0');
            
            const timerState = timerNum === 1 ? timer1State : timer2State;
            timerState.totalSeconds = hours * 3600 + minutes * 60 + seconds;
        }
        
        function startTimer(timerNum) {
            const timerState = timerNum === 1 ? timer1State : timer2State;
            const card = document.getElementById(`timer${timerNum}`);
            const startBtn = document.getElementById(`timer${timerNum}-start-btn`);
            
            if (timerState.running) {
                // Stop timer
                clearInterval(timerState.interval);
                if (timerState.alarmInterval) {
                    clearInterval(timerState.alarmInterval);
                    timerState.alarmInterval = null;
                }
                timerState.running = false;
                card.classList.remove('running', 'alarm');
                startBtn.innerHTML = '▶ Start';
                startBtn.className = 'timer-btn timer-btn-start';
            } else {
                // Start timer
                if (timerState.totalSeconds === 0) {
                    alert('Please set a time first by clicking on the timer');
                    return;
                }
                
                timerState.running = true;
                card.classList.add('running');
                startBtn.innerHTML = '■ Stop';
                startBtn.className = 'timer-btn timer-btn-stop';
                
                timerState.interval = setInterval(() => {
                    timerState.totalSeconds--;
                    
                    const hours = Math.floor(timerState.totalSeconds / 3600);
                    const minutes = Math.floor((timerState.totalSeconds % 3600) / 60);
                    const seconds = timerState.totalSeconds % 60;
                    
                    document.getElementById(`timer${timerNum}-hours`).textContent = String(hours).padStart(2, '0');
                    document.getElementById(`timer${timerNum}-minutes`).textContent = String(minutes).padStart(2, '0');
                    document.getElementById(`timer${timerNum}-seconds`).textContent = String(seconds).padStart(2, '0');
                    
                    if (timerState.totalSeconds <= 0) {
                        clearInterval(timerState.interval);
                        timerState.running = false;
                        card.classList.remove('running');
                        card.classList.add('alarm');
                        startBtn.innerHTML = '▶ Start';
                        startBtn.className = 'timer-btn timer-btn-start';
                        
                        // Start repeating alarm
                        startRepeatingAlarm(timerNum);
                    }
                }, 1000);
            }
        }
        
        function startRepeatingAlarm(timerNum) {
            const timerState = timerNum === 1 ? timer1State : timer2State;
            
            // Play alarm immediately
            playAlarmSound();
            
            // Then repeat every 2 seconds
            timerState.alarmInterval = setInterval(() => {
                playAlarmSound();
            }, 2000);
        }
        
        function resetTimer(timerNum) {
            const timerState = timerNum === 1 ? timer1State : timer2State;
            const card = document.getElementById(`timer${timerNum}`);
            const startBtn = document.getElementById(`timer${timerNum}-start-btn`);
            
            clearInterval(timerState.interval);
            if (timerState.alarmInterval) {
                clearInterval(timerState.alarmInterval);
                timerState.alarmInterval = null;
            }
            timerState.running = false;
            timerState.totalSeconds = 0;
            card.classList.remove('running', 'alarm');
            startBtn.innerHTML = '▶ Start';
            startBtn.className = 'timer-btn timer-btn-start';
            
            updateTimerDisplay(timerNum, 0, 0, 0);
        }
        
        function playAlarmSound() {
            // Create an audio context and play a beep sound
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
            
            // Play multiple beeps
            setTimeout(() => playBeep(audioContext), 600);
            setTimeout(() => playBeep(audioContext), 1200);
        }
        
        function playBeep(audioContext) {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        }

        function renderFamilyPills() {
            const container = document.getElementById('familyPills');
            if (!container) return;
            
            container.innerHTML = familyMembers.map(member => {
                const initial = member.name.charAt(0).toUpperCase();
                
                // Get today's date
                const today = new Date().toISOString().split('T')[0];
                
                // For Google Calendar members, don't show task count
                if (member.isGoogleCalendar) {
                    return `
                        <div class="family-pill" style="background-color: ${hexToRgba(member.color, 0.125)}; color: ${member.color}">
                            <div class="family-pill-content">
                                <div class="family-pill-avatar" style="background: ${member.color}">
                                    ${initial}
                                </div>
                                <div class="family-pill-info">
                                    <div class="family-pill-name">${member.name}</div>
                                </div>
                            </div>
                        </div>
                    `;
                }
                
                // Count tasks for this member today
                const memberTasks = tasks.filter(t => t.member === member.name && t.date === today);
                const completedTasks = memberTasks.filter(t => t.completed).length;
                const totalTasks = memberTasks.length;
                
                // Calculate progress percentage
                const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
                
                return `
                    <div class="family-pill" style="background-color: ${hexToRgba(member.color, 0.125)}; color: ${member.color}; cursor: pointer;" onclick="openProfileDashboard('${member.name}')">
                        <div class="family-pill-progress" style="background: ${member.color}; width: ${progressPercent}%"></div>
                        <div class="family-pill-content">
                            <div class="family-pill-avatar" style="background: ${member.color}">
                                ${initial}
                            </div>
                            <div class="family-pill-info">
                                <div class="family-pill-name">${member.name}</div>
                                <div class="family-pill-tasks">${completedTasks}/${totalTasks}</div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            container.innerHTML += `
                <div class="family-pill" style="background: #f0f0f0; color: #667eea; min-width: auto;" onclick="addFamilyMember()">
                    <div class="family-pill-content">
                        + Add Member
                    </div>
                </div>
            `;
        }

        function renderAllTasks() {
            const allTasks = tasks.sort((a, b) => a.date.localeCompare(b.date));
            const container = document.getElementById('allTasksList');
            
            if (allTasks.length === 0) {
                container.innerHTML = '<p style="color: #999; padding: 20px; text-align: center;">No tasks yet</p>';
                return;
            }

            let html = '<ul class="task-list">';
            allTasks.forEach(task => {
                const member = familyMembers.find(m => m.name === task.member);
                const taskDate = new Date(task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                html += `
                    <li class="task-item ${task.completed ? 'completed' : ''}" style="border-left: 4px solid ${(member && member.color) || getFamilyColor()}">
                        <input type="checkbox" ${task.completed ? 'checked' : ''} 
                               onchange="toggleTask(${task.id})">
                        <span>${task.title} - ${taskDate} ${task.member ? `(${task.member})` : ''}</span>
                    </li>
                `;
            });
            html += '</ul>';
            container.innerHTML = html;
        }

        function renderAllMeals() {
            const allMeals = meals.sort((a, b) => a.date.localeCompare(b.date));
            const container = document.getElementById('allMealsList');
            
            if (allMeals.length === 0) {
                container.innerHTML = '<p style="color: #999; padding: 20px; text-align: center;">No meals planned yet</p>';
                return;
            }

            let html = '<div class="meal-plan">';
            allMeals.forEach(meal => {
                const mealDate = new Date(meal.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
                html += `
                    <div class="meal-day">
                        <div class="meal-day-name">${mealDate}</div>
                        <div>${meal.name}</div>
                    </div>
                `;
            });
            html += '</div>';
            container.innerHTML = html;
        }
        
        function renderRewardsView() {
            const container = document.getElementById('rewardsContainer');
            let html = '';
            
            // Filter out Google Calendar members
            const rewardMembers = familyMembers.filter(m => !m.isGoogleCalendar);
            
            rewardMembers.forEach(member => {
                // Get member's rewards
                const memberRewards = rewards.filter(r => r.member === member.name);
                
                // Calculate total stars earned from completed chores and routines
                const memberChores = chores.filter(c => c.member === member.name && c.completed && c.stars);
                const memberRoutines = routines.filter(r => r.member === member.name && r.completed && r.stars);
                const totalStarsEarned = 
                    memberChores.reduce((sum, c) => sum + c.stars, 0) +
                    memberRoutines.reduce((sum, r) => sum + r.stars, 0);
                
                const columnBg = hexToRgba(member.color, 0.2);
                
                html += `<div class="rewards-person-column" style="background: ${columnBg};">
                    <div class="rewards-person-header">
                        <div class="rewards-person-avatar" style="background: ${member.color}">
                            ${member.name.charAt(0).toUpperCase()}
                        </div>
                        <div class="rewards-person-info">
                            <div class="rewards-person-name">${member.name}</div>
                            <div class="rewards-person-total-stars">
                                <span>⭐</span>
                                <span>${totalStarsEarned}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="rewards-list">`;
                
                if (memberRewards.length === 0) {
                    html += `<p style="color: #999; text-align: center; padding: 20px;">No rewards yet. Click + to add!</p>`;
                } else {
                    memberRewards.forEach(reward => {
                        const starsRequired = reward.starsNeeded || reward.stars || 25;
                        const progressPercent = Math.min(100, (totalStarsEarned / starsRequired) * 100);
                        const canRedeem = totalStarsEarned >= starsRequired && !reward.redeemed;
                        
                        html += `<div class="reward-card" onclick="openRewardDetail(${reward.id})" style="cursor: pointer;">
                            <div class="reward-icon">${reward.emoji || reward.icon || '🎁'}</div>
                            <div class="reward-title">${reward.title}</div>
                            <div class="reward-progress-container">
                                <div class="reward-progress-bar">
                                    <div class="reward-progress-fill" style="width: ${progressPercent}%; background: ${member.color}">
                                    </div>
                                </div>
                                <div class="reward-stars-text">
                                    <span>⭐</span>
                                    <span>${Math.min(totalStarsEarned, reward.starsNeeded || reward.stars)}/${reward.starsNeeded || reward.stars}</span>
                                </div>
                            </div>`;
                        
                        if (reward.redeemed) {
                            html += `<div style="text-align: center; color: #666; font-style: italic; padding: 10px;">Redeemed! 🎉</div>`;
                        } else if (canRedeem) {
                            html += `<button class="reward-redeem-btn" style="background: ${member.color}" onclick="event.stopPropagation(); redeemReward(${reward.id}, '${member.name}')">
                                Redeem <span>⭐</span> ${starsRequired}
                            </button>`;
                        } else {
                            html += `<button class="reward-redeem-btn" style="background: ${member.color}" disabled>
                                <span>⭐</span> ${starsRequired}
                            </button>`;
                        }
                        
                        html += `</div>`;
                    });
                }
                
                html += `</div>
                </div>`;
            });
            
            container.innerHTML = html;
        }
        
        function redeemReward(rewardId, memberName) {
            const reward = rewards.find(r => r.id === rewardId);
            if (!reward) return;
            
            // Get member's total stars
            const memberChores = chores.filter(c => c.member === memberName && c.completed && c.stars);
            const memberRoutines = routines.filter(r => r.member === memberName && r.completed && r.stars);
            const totalStarsEarned = 
                memberChores.reduce((sum, c) => sum + c.stars, 0) +
                memberRoutines.reduce((sum, r) => sum + r.stars, 0);
            
            if (totalStarsEarned >= reward.stars) {
                reward.redeemed = true;
                reward.redeemedDate = new Date().toISOString();
                localStorage.setItem('rewards', JSON.stringify(rewards));
                
                // Trigger confetti!
                triggerConfetti();
                
                // Re-render
                renderRewardsView();
            }
        }
        
        function renderChoresView() {
            const container = document.getElementById('choresContainer');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Determine current time period
            const currentHour = new Date().getHours();
            let currentPeriod = 'Morning';
            if (currentHour >= 12 && currentHour < 18) {
                currentPeriod = 'Afternoon';
            } else if (currentHour >= 18) {
                currentPeriod = 'Evening';
            }
            
            let html = '';
            
            // Filter out Google Calendar members
            const choreMembers = familyMembers.filter(m => !m.isGoogleCalendar);
            
            choreMembers.forEach(member => {
                const memberChores = chores.filter(c => c.member === member.name);
                const memberRoutines = routines.filter(r => r.member === member.name);
                
                const completedCount = memberChores.filter(c => c.completed).length;
                const totalCount = memberChores.length;
                const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
                
                // Calculate total stars earned
                const starsEarned = memberChores.filter(c => c.completed && c.stars).reduce((sum, c) => sum + c.stars, 0);
                
                const columnBg = hexToRgba(member.color, 0.2);
                
                html += `<div class="chore-person-card" style="background: ${columnBg};">
                    <div class="chore-person-header">
                        <div class="chore-person-avatar" style="background: ${member.color}; cursor: pointer;" onclick="openProfileDashboard('${member.name}')" title="View ${member.name}'s dashboard">
                            ${member.name.charAt(0).toUpperCase()}
                        </div>
                        <div class="chore-person-info">
                            <div class="chore-person-name">${member.name}</div>
                            <div class="chore-person-stats">
                                <span class="chore-person-progress-text">${completedCount}/${totalCount}</span>
                                ${starsEarned > 0 ? `<span class="chore-person-stars">⭐ ${starsEarned}</span>` : ''}
                            </div>
                            <div class="chore-progress-bar">
                                <div class="chore-progress-fill" style="width: ${progressPercent}%; background: ${member.color}"></div>
                            </div>
                        </div>
                    </div>`;
                
                // Show routine indicators if person has routines
                if (memberRoutines.length > 0) {
                    html += '<div class="routine-indicators">';
                    
                    ['Morning', 'Afternoon', 'Evening', 'Chores'].forEach(function(period) {
                        var periodTasks;
                        var completedTasks;
                        var totalTasks;
                        
                        if (period === 'Chores') {
                            periodTasks = memberChores;
                            completedTasks = memberChores.filter(function(c) { return c.completed; }).length;
                            totalTasks = memberChores.length;
                        } else {
                            periodTasks = memberRoutines.filter(function(r) { return r.period === period; });
                            completedTasks = periodTasks.filter(function(r) { return r.completed; }).length;
                            totalTasks = periodTasks.length;
                        }
                        
                        var hasRoutine = totalTasks > 0;
                        var isActive = period === currentPeriod;
                        var isVisible = visiblePeriods[member.name + '-' + period] === true;
                        var isComplete = totalTasks > 0 && completedTasks === totalTasks;
                        
                        var icon;
                        if (isComplete) {
                            icon = '✓';
                        } else if (period === 'Morning') {
                            icon = '⛅';
                        } else if (period === 'Afternoon') {
                            icon = '☀️';
                        } else if (period === 'Evening') {
                            icon = '🌙';
                        } else {
                            icon = '🧹';
                        }
                        
                        var progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
                        var circumference = 2 * 3.14159 * 20;
                        var dashOffset = circumference * (1 - progressPercent / 100);
                        
                        var classes = 'routine-indicator';
                        if (isActive) classes += ' active';
                        if (isVisible) classes += ' visible';
                        if (hasRoutine) classes += ' has-routine';
                        if (isComplete) classes += ' complete';
                        
                        var iconClass = '';
                        var onclickAttr = hasRoutine ? ('togglePeriodVisibility(\'' + member.name + '\', \'' + period + '\')') : '';
                        
                        html += '<div class="' + classes + '" data-period-id="' + member.name + '-' + period + '" onclick="' + onclickAttr + '" style="position: relative;">';
                        html += '<svg class="routine-indicator-progress" viewBox="0 0 50 50" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; transform: rotate(-90deg);">';
                        html += '<circle cx="25" cy="25" r="20" fill="none" stroke="rgba(0,0,0,0.1)" stroke-width="3"></circle>';
                        html += '<circle cx="25" cy="25" r="20" fill="none" stroke="' + member.color + '" stroke-width="3" stroke-dasharray="' + circumference + '" stroke-dashoffset="' + dashOffset + '" data-final-offset="' + dashOffset + '" data-period-id="' + member.name + '-' + period + '" class="progress-circle"></circle>';
                        html += '</svg>';
                        html += '<div class="routine-indicator-icon' + iconClass + '">' + icon + '</div>';
                        html += '<div class="routine-indicator-label">' + period + '</div>';
                        html += '</div>';
                    });
                    
                    html += '</div>';
                }
                
                // Show routines for current period and manually visible periods
                ['Morning', 'Afternoon', 'Evening', 'Chores'].forEach(function(period) {
                    var isCurrentPeriod = period === currentPeriod;
                    var isManuallyVisible = visiblePeriods[member.name + '-' + period] === true;
                    
                    // Show if it's the current period OR manually toggled visible
                    if (isCurrentPeriod || isManuallyVisible) {
                        if (period === 'Chores') {
                            // For Chores period, show only actual chores (not routines)
                            // Filter out completed chores unless showCompletedChores is true
                            var visibleChores = showCompletedChores ? memberChores : memberChores.filter(function(c) { return !c.completed; });
                            
                            if (visibleChores.length > 0) {
                                // Sort chores: incomplete first, then completed
                                var sortedChores = visibleChores.slice().sort(function(a, b) {
                                    if (a.completed !== b.completed) {
                                        return a.completed ? 1 : -1;
                                    }
                                    return 0;
                                });
                                
                                html += '<div class="routine-section">';
                                html += '<div class="routine-section-title">' + period + '</div>';
                                html += '<div class="chore-items">';
                                
                                sortedChores.forEach(function(chore) {
                                    var isLate = chore.dueDate && new Date(chore.dueDate) < today && !chore.completed;
                                    var daysLate = isLate ? Math.floor((today - new Date(chore.dueDate)) / (1000 * 60 * 60 * 24)) : 0;
                                    var lateText = isLate ? (daysLate === 0 ? 'Due today' : daysLate + ' day' + (daysLate > 1 ? 's' : '') + ' late') : '';
                                    
                                    var bgOpacity = chore.completed ? 0.5 : 0.19;
                                    var choreBg = hexToRgba(member.color, bgOpacity);
                                    
                                    html += '<div class="chore-item' + (chore.completed ? ' completed' : '') + '" style="background: ' + choreBg + '; cursor: pointer;" onclick="openTaskDetail(\'' + chore.id + '\', \'chore\', event)">';                                    if (chore.icon) {
                                        html += '<div class="chore-item-icon">' + chore.icon + '</div>';
                                    }
                                    html += '<div class="chore-item-content">';
                                    html += '<div class="chore-item-title">' + chore.title + '</div>';
                                    if (chore.frequency || isLate) {
                                        html += '<div class="chore-item-subtitle' + (isLate ? ' late' : '') + '">' + (isLate ? lateText : chore.frequency) + '</div>';
                                    }
                                    html += '</div>';
                                    if (chore.stars) {
                                        html += '<div class="chore-item-stars">⭐ ' + chore.stars + '</div>';
                                    }
                                    html += '<div class="chore-item-checkbox' + (chore.completed ? ' checked' : '') + '" style="' + (chore.completed ? 'background: ' + member.color + '; border-color: ' + member.color + ';' : '') + '" onclick="event.stopPropagation(); toggleChore(\'' + chore.id + '\')">';
                                    html += chore.completed ? '✓' : '';
                                    html += '</div>';
                                    html += '</div>';
                                });
                                
                                html += '</div></div>';
                            }
                        } else {
                            // For other periods, show only routines
                            var periodRoutines = memberRoutines
                                .filter(function(r) { return r.period === period; })
                                .sort(function(a, b) {
                                    // First sort by completion status (incomplete first)
                                    if (a.completed !== b.completed) {
                                        return a.completed ? 1 : -1;
                                    }
                                    // Then by sort order
                                    return (a.sortOrder || 0) - (b.sortOrder || 0);
                                });
                            
                            if (periodRoutines.length > 0) {
                                html += '<div class="routine-section">';
                                html += '<div class="routine-section-title">' + period + '</div>';
                                html += '<div class="routine-tasks" id="routine-tasks-' + member.name + '-' + period + '">';
                                
                                periodRoutines.forEach(function(task, index) {
                                    var bgOpacity = task.completed ? 0.5 : 0.19;
                                    var taskBg = hexToRgba(member.color, bgOpacity);
                                    
                                    html += '<div class="routine-task' + (task.completed ? ' completed' : '') + '" draggable="true" data-task-id="' + task.id + '" data-member="' + member.name + '" data-period="' + period + '" data-index="' + index + '" ondragstart="handleRoutineDragStart(event)" ondragover="handleRoutineDragOver(event)" ondrop="handleRoutineDrop(event)" ondragend="handleRoutineDragEnd(event)" style="background: ' + taskBg + '; cursor: move;">';
                                    html += '<div class="routine-task-icon" onclick="openTaskDetail(\'' + task.id + '\', \'routine\', event)">' + (task.icon || '✓') + '</div>';
                                    html += '<div class="routine-task-content" onclick="openTaskDetail(\'' + task.id + '\', \'routine\', event)">';
                                    html += '<div class="routine-task-title">' + task.title + '</div>';
                                    html += '</div>';
                                    html += '<div class="routine-emoji-container">';
                                    if (task.stars) {
                                        html += '<div class="routine-task-stars">⭐ ' + task.stars + '</div>';
                                    }
                                    html += '<div class="chore-item-checkbox' + (task.completed ? ' checked' : '') + '" style="' + (task.completed ? 'background: ' + member.color + '; border-color: ' + member.color + ';' : '') + '" onclick="event.stopPropagation(); toggleRoutine(\'' + task.id + '\')">';
                                    html += task.completed ? '✓' : '';
                                    html += '</div>';
                                    html += '</div>';
                                    html += '</div>';
                                });
                                
                                html += '</div></div>';
                            }
                        }
                    }
                });
                
                html += '</div>';
            });
            
            container.innerHTML = html;
            
            // Update progress circles smoothly without re-rendering
            setTimeout(function() {
                var progressCircles = document.querySelectorAll('.progress-circle');
                progressCircles.forEach(function(circle) {
                    var finalOffset = circle.getAttribute('data-final-offset');
                    var currentOffset = circle.getAttribute('stroke-dashoffset');
                    
                    // Only update if value actually changed
                    if (finalOffset && finalOffset !== currentOffset) {
                        circle.setAttribute('stroke-dashoffset', finalOffset);
                    }
                });
            }, 10);
        }
        
        function renderRewardsView() {
            const container = document.getElementById('rewardsContainer');
            const choreMembers = familyMembers.filter(m => !m.isGoogleCalendar);
            
            let html = '';
            
            choreMembers.forEach(member => {
                // Calculate total stars earned from completed chores and routines
                const memberChores = chores.filter(c => c.member === member.name && c.completed && c.stars);
                const memberRoutines = routines.filter(r => r.member === member.name && r.completed && r.stars);
                const totalStarsEarned = 
                    memberChores.reduce((sum, c) => sum + c.stars, 0) +
                    memberRoutines.reduce((sum, r) => sum + r.stars, 0);
                
                // Get rewards for this member
                const memberRewards = rewards.filter(r => r.member === member.name);
                
                const columnBg = hexToRgba(member.color, 0.2);
                
                html += `<div class="rewards-person-column" style="background: ${columnBg};">
                    <div class="rewards-person-header">
                        <div class="rewards-person-avatar" style="background: ${member.color}">
                            ${member.name.charAt(0).toUpperCase()}
                        </div>
                        <div class="rewards-person-info">
                            <div class="rewards-person-name">${member.name}</div>
                            <div class="rewards-person-total-stars">
                                <span>⭐</span>
                                <span>${totalStarsEarned}</span>
                            </div>
                        </div>
                    </div>`;
                
                // Render reward cards
                memberRewards.forEach(reward => {
                    const currentStars = Math.min(totalStarsEarned, reward.starsNeeded);
                    const progressPercent = (currentStars / reward.starsNeeded) * 100;
                    const canRedeem = totalStarsEarned >= reward.starsNeeded && !reward.redeemed;
                    
                    html += `<div class="reward-card" onclick="openRewardDetail(${reward.id})" style="cursor: pointer;">
                        <div class="reward-emoji">${reward.emoji}</div>
                        <div class="reward-title">${reward.title}</div>
                        <div class="reward-progress-container">
                            <div class="reward-progress-bar">
                                <div class="reward-progress-fill" style="width: ${progressPercent}%; background: ${member.color}80;"></div>
                                <div class="reward-progress-text">
                                    <span>⭐</span>
                                    <span>${currentStars}/${reward.starsNeeded}</span>
                                </div>
                            </div>
                        </div>
                        ${canRedeem ? 
                            `<button class="reward-redeem-btn" style="background: ${member.color};" onclick="event.stopPropagation(); redeemReward(${reward.id})">
                                Redeem ⭐ ${reward.starsNeeded}
                            </button>` :
                            reward.redeemed ?
                            `<button class="reward-redeem-btn" style="background: #999;" disabled>
                                Redeemed ✓
                            </button>` :
                            ''
                        }
                    </div>`;
                });
                
                html += `</div>`;
            });
            
            container.innerHTML = html;
        }
        
        let currentRedeemedRewardId = null;
        
        function redeemReward(rewardId) {
            const reward = rewards.find(r => r.id === rewardId);
            if (!reward) return;
            
            // Get member's total stars
            const memberChores = chores.filter(c => c.member === reward.member && c.completed && c.stars);
            const memberRoutines = routines.filter(r => r.member === reward.member && r.completed && r.stars);
            const totalStarsEarned = 
                memberChores.reduce((sum, c) => sum + c.stars, 0) +
                memberRoutines.reduce((sum, r) => sum + r.stars, 0);
            
            if (totalStarsEarned >= reward.starsNeeded && !reward.redeemed) {
                reward.redeemed = true;
                reward.redeemedDate = new Date().toISOString().split('T')[0];
                localStorage.setItem('rewards', JSON.stringify(rewards));
                currentRedeemedRewardId = rewardId;
                
                // Show celebration modal
                showRewardRedemptionModal(reward);
                
                // Trigger star confetti after a short delay
                setTimeout(() => {
                    triggerStarConfetti();
                }, 400);
                
                // Re-render rewards view
                renderRewardsView();
            }
        }
        
        function showRewardRedemptionModal(reward) {
            const modal = document.getElementById('rewardRedemptionModal');
            const member = familyMembers.find(m => m.name === reward.member);
            
            // Populate modal
            document.getElementById('redemptionEmoji').textContent = reward.emoji || '🎁';
            document.getElementById('redemptionTitle').textContent = `Great work! ${reward.title} redeemed`;
            
            const redeemedDate = reward.redeemedDate ? new Date(reward.redeemedDate).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
            }) : new Date().toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
            });
            
            document.getElementById('redemptionSubtitle').textContent = 
                `By ${reward.member} for ${reward.starsNeeded} stars on ${redeemedDate}.`;
            
            // Show modal
            modal.classList.add('active');
        }
        
        function closeRewardRedemptionModal() {
            const modal = document.getElementById('rewardRedemptionModal');
            modal.classList.remove('active');
            currentRedeemedRewardId = null;
        }
        
        function unredeemCurrentReward() {
            if (!currentRedeemedRewardId) return;
            
            const reward = rewards.find(r => r.id === currentRedeemedRewardId);
            if (reward) {
                reward.redeemed = false;
                delete reward.redeemedDate;
                localStorage.setItem('rewards', JSON.stringify(rewards));
                closeRewardRedemptionModal();
                renderRewardsView();
            }
        }
        
        // Reward Edit Functions
        let currentEditRewardId = null;
        
        function openRewardDetail(rewardId) {
            currentEditRewardId = rewardId;
            const reward = rewards.find(r => r.id === rewardId);
            
            if (!reward) {
                return;
            }
            
            // Populate edit form
            const titleInput = document.getElementById('editRewardTitle');
            const emojiInput = document.getElementById('editRewardEmoji');
            const starsInput = document.getElementById('editRewardStars');
            
            if (!titleInput || !emojiInput || !starsInput) {
                return;
            }
            
            titleInput.value = reward.title || '';
            emojiInput.value = reward.emoji || reward.icon || '🎁';
            starsInput.value = reward.starsNeeded || reward.stars || 25;
            
            // Initialize emoji picker
            initializeEditRewardEmojiPicker();
            
            // Show panel
            const overlay = document.getElementById('editRewardPanelOverlay');
            const panel = document.getElementById('editRewardPanel');
            
            if (!overlay || !panel) {
                return;
            }
            
            overlay.classList.add('active');
            panel.classList.add('active');
        }
        
        function closeEditRewardPanel() {
            document.getElementById('editRewardPanel').classList.remove('active');
            document.getElementById('editRewardPanelOverlay').classList.remove('active');
            currentEditRewardId = null;
        }
        
        function saveEditedReward() {
            const reward = rewards.find(r => r.id === currentEditRewardId);
            if (!reward) return;
            
            const title = document.getElementById('editRewardTitle').value.trim();
            const emoji = document.getElementById('editRewardEmoji').value.trim();
            const stars = parseInt(document.getElementById('editRewardStars').value) || 25;
            
            if (!title) {
                alert('Please enter a reward title');
                return;
            }
            
            reward.title = title;
            reward.emoji = emoji || '🎁';
            reward.icon = emoji || '🎁'; // Keep both for compatibility
            reward.starsNeeded = stars;
            reward.stars = stars; // Keep both for compatibility
            
            localStorage.setItem('rewards', JSON.stringify(rewards));
            closeEditRewardPanel();
            renderRewardsView();
        }
        
        function deleteCurrentReward() {
            if (!confirm('Are you sure you want to delete this reward?')) return;
            
            const index = rewards.findIndex(r => r.id === currentEditRewardId);
            if (index > -1) {
                rewards.splice(index, 1);
                localStorage.setItem('rewards', JSON.stringify(rewards));
                closeEditRewardPanel();
                renderRewardsView();
            }
        }
        
        function initializeEditRewardEmojiPicker() {
            const grid = document.getElementById('editRewardEmojiPickerGrid');
            if (grid.innerHTML) return; // Already initialized
            
            const emojiData = document.getElementById('emojiPickerGrid').innerHTML;
            grid.innerHTML = emojiData.replace(/onclick="selectEmoji/g, 'onclick="selectEditRewardEmoji');
            
            // Parse emojis with Twemoji after populating
            if (typeof twemoji !== 'undefined') {
                twemoji.parse(grid, {
                    folder: 'svg',
                    ext: '.svg'
                });
            }
        }
        
        function toggleEditRewardEmojiPicker(event) {
            event.stopPropagation();
            const dropdown = document.getElementById('editRewardEmojiPickerDropdown');
            dropdown.classList.toggle('active');
        }
        
        function selectEditRewardEmoji(emoji) {
            document.getElementById('editRewardEmoji').value = emoji;
            document.getElementById('editRewardEmojiPickerDropdown').classList.remove('active');
        }
        
        function filterEditRewardEmojis() {
            const searchTerm = document.getElementById('editRewardEmojiSearchInput').value.toLowerCase();
            const emojiItems = document.querySelectorAll('#editRewardEmojiPickerGrid .emoji-picker-item');
            
            emojiItems.forEach(item => {
                const emoji = item.textContent;
                const match = emoji.toLowerCase().includes(searchTerm);
                item.classList.toggle('hidden', !match);
            });
        }
        
        window.toggleRoutine = function toggleRoutine(routineId) {
            console.log('toggleRoutine called with ID:', routineId);
            console.log('toggleRoutine function type:', typeof toggleRoutine);
            // Convert to number since IDs are timestamps
            const numericId = typeof routineId === 'string' ? parseInt(routineId) : routineId;
            const routine = routines.find(r => r.id === numericId);
            console.log('Found routine:', routine);
            if (routine) {
                const wasCompleted = routine.completed;
                routine.completed = !routine.completed;
                if (routine.completed) {
                    routine.completedDate = new Date().toISOString().split('T')[0];
                } else {
                    delete routine.completedDate;
                }
                localStorage.setItem('routines', JSON.stringify(routines));
                
                // Check if member completed all their tasks
                if (!wasCompleted && routine.completed) {
                    checkAllTasksComplete(routine.member);
                }
                
                renderChoresView();
            }
        };
        
        console.log('window.toggleRoutine exposed:', typeof window.toggleRoutine);
        
        // Drag and drop variables
        let draggedRoutine = null;
        let draggedFromMember = null;
        let draggedFromPeriod = null;
        
        function handleRoutineDragStart(event) {
            event.stopPropagation();
            draggedRoutine = event.currentTarget;
            draggedFromMember = draggedRoutine.dataset.member;
            draggedFromPeriod = draggedRoutine.dataset.period;
            
            draggedRoutine.style.opacity = '0.4';
            event.dataTransfer.effectAllowed = 'move';
        }
        
        function handleRoutineDragOver(event) {
            if (event.preventDefault) {
                event.preventDefault();
            }
            event.dataTransfer.dropEffect = 'move';
            
            const target = event.currentTarget;
            const targetMember = target.dataset.member;
            const targetPeriod = target.dataset.period;
            
            // Only allow reordering within same member and same period
            if (targetMember === draggedFromMember && targetPeriod === draggedFromPeriod) {
                const rect = target.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                
                if (event.clientY < midpoint) {
                    target.style.borderTop = '3px solid #4A90E2';
                    target.style.borderBottom = '';
                } else {
                    target.style.borderBottom = '3px solid #4A90E2';
                    target.style.borderTop = '';
                }
            }
            
            return false;
        }
        
        function handleRoutineDrop(event) {
            if (event.stopPropagation) {
                event.stopPropagation();
            }
            
            const target = event.currentTarget;
            const targetMember = target.dataset.member;
            const targetPeriod = target.dataset.period;
            
            // Only allow reordering within same member and same period
            if (draggedRoutine && targetMember === draggedFromMember && targetPeriod === draggedFromPeriod) {
                const draggedId = parseFloat(draggedRoutine.dataset.taskId);
                const targetId = parseFloat(target.dataset.taskId);
                
                if (draggedId !== targetId) {
                    // Get all routines for this specific member and period
                    const allMemberRoutines = routines.filter(r => r.member === targetMember && r.period === targetPeriod);
                    
                    // Sort by current sortOrder
                    allMemberRoutines.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
                    
                    // Find positions
                    const oldIndex = allMemberRoutines.findIndex(r => r.id === draggedId);
                    const newIndex = allMemberRoutines.findIndex(r => r.id === targetId);
                    
                    if (oldIndex !== -1 && newIndex !== -1) {
                        // Move the item
                        const [movedItem] = allMemberRoutines.splice(oldIndex, 1);
                        allMemberRoutines.splice(newIndex, 0, movedItem);
                        
                        // Reassign sortOrder to all
                        allMemberRoutines.forEach((r, idx) => {
                            r.sortOrder = idx;
                            // Update in main routines array
                            const mainIndex = routines.findIndex(routine => routine.id === r.id);
                            if (mainIndex !== -1) {
                                routines[mainIndex].sortOrder = idx;
                            }
                        });
                        
                        localStorage.setItem('routines', JSON.stringify(routines));
                        renderChoresView();
                    }
                }
            }
            
            return false;
        }
        
        function handleRoutineDragEnd(event) {
            event.currentTarget.style.opacity = '1';
            
            // Remove all drop indicators
            document.querySelectorAll('.routine-task').forEach(task => {
                task.style.borderTop = '';
                task.style.borderBottom = '';
            });
            
            draggedRoutine = null;
            draggedFromMember = null;
            draggedFromPeriod = null;
        }
        
        function togglePeriodVisibility(memberName, period) {
            const key = memberName + '-' + period;
            // Toggle the visibility state
            visiblePeriods[key] = !visiblePeriods[key];
            
            // Re-render the view to reflect the change
            renderChoresView();
        }
        
        // Expose globally so onclick can access it
        window.togglePeriodVisibility = togglePeriodVisibility;
        
        let currentTaskType = 'chore';
        let selectedProfiles = [];
        let selectedEventProfile = ''; // For event modal (single selection)
        let selectedEventProfiles = []; // For event modal (multiple selections)
        
        function openTaskChoreModal() {
            document.getElementById('taskChorePanelOverlay').classList.add('active');
            document.getElementById('taskChoreModal').classList.add('active');
            renderProfileGrid();
            initializeEmojiPicker();
            
            // Initialize defaults for routine (default type)
            currentTaskType = 'routine';
            selectedRepeatUnit = 'week';
            selectedDays = [4]; // Thursday by default
            selectedTimeOfDay = 'evening';
            selectedChoreDays = [];
            selectedChoreRepeatUnit = 'day';
            
            // Show/hide appropriate fields (routine by default)
            document.getElementById('choreFields').style.display = 'none';
            document.getElementById('routineFields').style.display = 'block';
            
            // Set button states
            document.getElementById('choreTypeBtn').classList.remove('active');
            document.getElementById('routineTypeBtn').classList.add('active');
            document.getElementById('repeatDay').classList.remove('active');
            document.getElementById('repeatWeek').classList.add('active');
            
            // Set time of day button states
            document.getElementById('timeOfDayMorning').classList.remove('active');
            document.getElementById('timeOfDayAfternoon').classList.remove('active');
            document.getElementById('timeOfDayEvening').classList.add('active');
            
            // Set day button state for routine
            document.querySelectorAll('#taskRepeatDays .day-btn-new').forEach(btn => {
                btn.classList.remove('active');
            });
            const thursdayBtn = document.querySelector('.day-btn-new[data-day="4"]');
            if (thursdayBtn) {
                thursdayBtn.classList.add('active');
            }
            
            // Show days section by default
            const daysSection = document.getElementById('taskRepeatDays');
            if (daysSection) {
                daysSection.style.display = 'block';
            }
        }
        
        function updateAddDateVisibility() {
            const checked = document.getElementById('taskChoreDateToggle').checked;
            const section = document.getElementById('taskChoreDateSection');
            if (section) {
                section.style.display = checked ? 'block' : 'none';
            }
        }
        
        function updateAddTimeVisibility() {
            const checked = document.getElementById('taskChoreTimeToggle').checked;
            const section = document.getElementById('taskChoreTimeSection');
            if (section) {
                section.style.display = checked ? 'block' : 'none';
            }
        }
        
        function updateRepeatVisibility() {
            const checked = document.getElementById('taskChoreRepeatToggle').checked;
            document.getElementById('taskRepeatDetails').style.display = checked ? 'block' : 'none';
            if (checked) {
                updateRepeatDaysVisibility();
            }
        }
        
        let selectedDays = [];
        
        function updateRepeatDaysVisibility() {
            const unit = document.getElementById('taskRepeatUnit').value;
            const daysSection = document.getElementById('taskRepeatDays');
            daysSection.style.display = unit === 'week' ? 'block' : 'none';
        }
        
        function updateRepeatUntilVisibility() {
            const checked = document.getElementById('taskRepeatUntilToggle').checked;
            const section = document.getElementById('taskRepeatUntilSection');
            if (section) {
                section.style.display = checked ? 'block' : 'none';
            }
        }
        
        function toggleDay(dayIndex) {
            const index = selectedDays.indexOf(dayIndex);
            if (index > -1) {
                selectedDays.splice(index, 1);
            } else {
                selectedDays.push(dayIndex);
            }
            
            // Update button visual state
            const btn = document.querySelector(`.day-btn[data-day="${dayIndex}"]`);
            btn.classList.toggle('active');
        }
        
        function updateRepeatUntilVisibility() {
            const checked = document.getElementById('taskRepeatUntilToggle').checked;
            document.getElementById('taskRepeatUntil').style.display = checked ? 'block' : 'none';
        }
        
        function initializeEmojiPicker() {
            const emojiData = [
                // Smileys & Emotion
                { emoji: '😀', keywords: 'smile happy grin face' },
                { emoji: '😃', keywords: 'smile happy grin big face' },
                { emoji: '😄', keywords: 'smile happy grin eyes face' },
                { emoji: '😁', keywords: 'smile happy grin beam face' },
                { emoji: '😆', keywords: 'laugh smile happy face' },
                { emoji: '😅', keywords: 'laugh smile sweat face' },
                { emoji: '😂', keywords: 'laugh cry tears joy face' },
                { emoji: '🤣', keywords: 'laugh rolling floor face' },
                { emoji: '😊', keywords: 'smile blush happy face' },
                { emoji: '😇', keywords: 'smile angel halo innocent face' },
                { emoji: '🙂', keywords: 'smile slight happy face' },
                { emoji: '🙃', keywords: 'smile upside down face' },
                { emoji: '😉', keywords: 'wink smile face' },
                { emoji: '😌', keywords: 'relieved smile peaceful face' },
                { emoji: '😍', keywords: 'love heart eyes smile face' },
                { emoji: '🥰', keywords: 'love smile hearts face' },
                { emoji: '😘', keywords: 'kiss love smile face' },
                { emoji: '😗', keywords: 'kiss smile face' },
                { emoji: '😙', keywords: 'kiss smile eyes face' },
                { emoji: '😚', keywords: 'kiss smile closed eyes face' },
                { emoji: '😋', keywords: 'yum delicious tongue face' },
                { emoji: '😛', keywords: 'tongue out playful face' },
                { emoji: '😝', keywords: 'tongue wink playful face' },
                { emoji: '😜', keywords: 'tongue wink one eye face' },
                { emoji: '🤪', keywords: 'crazy zany wild face' },
                { emoji: '🤨', keywords: 'raised eyebrow suspicious face' },
                { emoji: '🧐', keywords: 'monocle smart thinking face' },
                { emoji: '🤓', keywords: 'nerd glasses smart face' },
                { emoji: '😎', keywords: 'cool sunglasses face' },
                { emoji: '🤩', keywords: 'star struck excited face' },
                { emoji: '🥳', keywords: 'party celebrate hat face' },
                { emoji: '😏', keywords: 'smirk smile face' },
                { emoji: '😒', keywords: 'unamused unhappy face' },
                { emoji: '😞', keywords: 'disappointed sad face' },
                { emoji: '😔', keywords: 'pensive sad thoughtful face' },
                { emoji: '😟', keywords: 'worried anxious face' },
                { emoji: '😕', keywords: 'confused puzzled face' },
                { emoji: '🙁', keywords: 'frown sad face' },
                { emoji: '😣', keywords: 'persevere struggling face' },
                { emoji: '😖', keywords: 'confounded frustrated face' },
                { emoji: '😫', keywords: 'tired exhausted face' },
                { emoji: '😩', keywords: 'weary tired face' },
                { emoji: '🥺', keywords: 'pleading puppy eyes face' },
                { emoji: '😢', keywords: 'cry sad tears face' },
                { emoji: '😭', keywords: 'cry sobbing loudly face' },
                { emoji: '😤', keywords: 'triumph huff steam face' },
                { emoji: '😠', keywords: 'angry mad face' },
                { emoji: '😡', keywords: 'angry rage pouting face' },
                { emoji: '🤬', keywords: 'curse swear symbols face' },
                { emoji: '🤯', keywords: 'exploding mind blown face' },
                { emoji: '😳', keywords: 'flushed embarrassed face' },
                { emoji: '🥵', keywords: 'hot sweating face' },
                { emoji: '🥶', keywords: 'cold freezing face' },
                { emoji: '😱', keywords: 'scream fear shocked face' },
                { emoji: '😨', keywords: 'fearful scared face' },
                { emoji: '😰', keywords: 'anxious worried sweat face' },
                { emoji: '😥', keywords: 'sad relieved disappointed face' },
                { emoji: '😓', keywords: 'downcast sweat face' },
                { emoji: '🤗', keywords: 'hugging hug face' },
                { emoji: '🤔', keywords: 'thinking hmm wonder face' },
                { emoji: '🤭', keywords: 'hand mouth giggle oops face' },
                { emoji: '🤫', keywords: 'shush quiet silence face' },
                { emoji: '🤥', keywords: 'lying pinocchio nose face' },
                { emoji: '😶', keywords: 'no mouth silent face' },
                { emoji: '😐', keywords: 'neutral meh face' },
                { emoji: '😑', keywords: 'expressionless blank face' },
                { emoji: '😬', keywords: 'grimace awkward face' },
                { emoji: '🙄', keywords: 'eye roll annoyed face' },
                { emoji: '😯', keywords: 'hushed surprised face' },
                { emoji: '😦', keywords: 'frown open mouth face' },
                { emoji: '😧', keywords: 'anguish worried face' },
                { emoji: '😮', keywords: 'surprised open mouth face' },
                { emoji: '😲', keywords: 'astonished shocked face' },
                { emoji: '🥱', keywords: 'yawn tired sleepy face' },
                { emoji: '😴', keywords: 'sleeping zzz face' },
                { emoji: '🤤', keywords: 'drooling sleeping face' },
                { emoji: '😪', keywords: 'sleepy tired face' },
                { emoji: '😵', keywords: 'dizzy face' },
                { emoji: '🤐', keywords: 'zipper mouth quiet face' },
                { emoji: '🥴', keywords: 'woozy drunk dizzy face' },
                { emoji: '🤢', keywords: 'nauseated sick face' },
                { emoji: '🤮', keywords: 'vomit sick face' },
                { emoji: '🤧', keywords: 'sneeze sick face' },
                { emoji: '😷', keywords: 'mask sick medical face' },
                { emoji: '🤒', keywords: 'thermometer sick face' },
                { emoji: '🤕', keywords: 'bandage hurt injured face' },
                
                // Hearts & Love
                { emoji: '❤️', keywords: 'heart love red favorite' },
                { emoji: '🧡', keywords: 'heart love orange favorite' },
                { emoji: '💛', keywords: 'heart love yellow favorite' },
                { emoji: '💚', keywords: 'heart love green favorite' },
                { emoji: '💙', keywords: 'heart love blue favorite' },
                { emoji: '💜', keywords: 'heart love purple favorite' },
                { emoji: '🖤', keywords: 'heart love black favorite' },
                { emoji: '🤍', keywords: 'heart love white favorite' },
                { emoji: '🤎', keywords: 'heart love brown favorite' },
                { emoji: '💔', keywords: 'broken heart sad' },
                { emoji: '❤️‍🔥', keywords: 'heart fire love passion' },
                { emoji: '❤️‍🩹', keywords: 'heart bandage healing' },
                { emoji: '💕', keywords: 'two hearts love' },
                { emoji: '💞', keywords: 'revolving hearts love' },
                { emoji: '💓', keywords: 'beating heart love' },
                { emoji: '💗', keywords: 'growing heart love' },
                { emoji: '💖', keywords: 'sparkle heart love favorite' },
                { emoji: '💘', keywords: 'arrow heart love cupid' },
                { emoji: '💝', keywords: 'heart box gift love favorite' },
                
                // Hand Gestures
                { emoji: '👍', keywords: 'thumbs up good yes like' },
                { emoji: '👎', keywords: 'thumbs down bad no dislike' },
                { emoji: '👊', keywords: 'fist bump punch' },
                { emoji: '✊', keywords: 'raised fist power' },
                { emoji: '🤛', keywords: 'left fist bump' },
                { emoji: '🤜', keywords: 'right fist bump' },
                { emoji: '🤞', keywords: 'crossed fingers luck hope' },
                { emoji: '✌️', keywords: 'victory peace two fingers' },
                { emoji: '🤟', keywords: 'love you sign hand' },
                { emoji: '🤘', keywords: 'rock on horns hand' },
                { emoji: '👌', keywords: 'ok okay perfect hand' },
                { emoji: '🤌', keywords: 'pinched fingers italian hand' },
                { emoji: '🤏', keywords: 'pinch small tiny hand' },
                { emoji: '👈', keywords: 'point left finger hand' },
                { emoji: '👉', keywords: 'point right finger hand' },
                { emoji: '👆', keywords: 'point up finger hand' },
                { emoji: '👇', keywords: 'point down finger hand' },
                { emoji: '☝️', keywords: 'point up index finger hand' },
                { emoji: '✋', keywords: 'raised hand stop palm' },
                { emoji: '🤚', keywords: 'raised back hand' },
                { emoji: '🖐️', keywords: 'hand fingers spread' },
                { emoji: '🖖', keywords: 'vulcan salute spock hand' },
                { emoji: '👋', keywords: 'wave hello goodbye hand' },
                { emoji: '🤙', keywords: 'call me hand shaka' },
                { emoji: '💪', keywords: 'muscle strong flex arm' },
                { emoji: '🙏', keywords: 'pray please thank you hands' },
                { emoji: '✍️', keywords: 'write writing hand' },
                { emoji: '👏', keywords: 'clap applause hands' },
                { emoji: '🙌', keywords: 'raising hands celebrate' },
                { emoji: '👐', keywords: 'open hands hug' },
                { emoji: '🤲', keywords: 'palms together prayer' },
                { emoji: '🤝', keywords: 'handshake deal agreement' },
                
                // Animals & Nature
                { emoji: '🐶', keywords: 'dog puppy pet animal' },
                { emoji: '🐕', keywords: 'dog pet animal walk feed' },
                { emoji: '🐩', keywords: 'poodle dog pet animal' },
                { emoji: '🐺', keywords: 'wolf animal wild' },
                { emoji: '🦊', keywords: 'fox animal' },
                { emoji: '🦝', keywords: 'raccoon animal' },
                { emoji: '🐱', keywords: 'cat kitty pet animal' },
                { emoji: '🐈', keywords: 'cat pet animal feed' },
                { emoji: '🐈‍⬛', keywords: 'black cat pet animal' },
                { emoji: '🦁', keywords: 'lion animal wild' },
                { emoji: '🐯', keywords: 'tiger animal wild' },
                { emoji: '🐅', keywords: 'tiger animal wild' },
                { emoji: '🐆', keywords: 'leopard animal wild' },
                { emoji: '🐴', keywords: 'horse animal' },
                { emoji: '🐎', keywords: 'horse racing animal' },
                { emoji: '🦄', keywords: 'unicorn fantasy animal' },
                { emoji: '🦓', keywords: 'zebra animal' },
                { emoji: '🦌', keywords: 'deer animal' },
                { emoji: '🦬', keywords: 'bison animal' },
                { emoji: '🐮', keywords: 'cow animal farm' },
                { emoji: '🐂', keywords: 'ox animal' },
                { emoji: '🐃', keywords: 'water buffalo animal' },
                { emoji: '🐄', keywords: 'cow animal farm' },
                { emoji: '🐷', keywords: 'pig animal farm' },
                { emoji: '🐖', keywords: 'pig animal farm' },
                { emoji: '🐗', keywords: 'boar pig animal' },
                { emoji: '🐽', keywords: 'pig nose animal' },
                { emoji: '🐏', keywords: 'ram sheep animal' },
                { emoji: '🐑', keywords: 'sheep animal farm' },
                { emoji: '🐐', keywords: 'goat animal' },
                { emoji: '🐪', keywords: 'camel animal desert' },
                { emoji: '🐫', keywords: 'camel two hump animal' },
                { emoji: '🦙', keywords: 'llama alpaca animal' },
                { emoji: '🦒', keywords: 'giraffe animal' },
                { emoji: '🐘', keywords: 'elephant animal' },
                { emoji: '🦣', keywords: 'mammoth elephant animal' },
                { emoji: '🦏', keywords: 'rhino animal' },
                { emoji: '🦛', keywords: 'hippo animal' },
                { emoji: '🐭', keywords: 'mouse animal pet' },
                { emoji: '🐁', keywords: 'mouse animal' },
                { emoji: '🐀', keywords: 'rat animal' },
                { emoji: '🐹', keywords: 'hamster pet animal' },
                { emoji: '🐰', keywords: 'rabbit bunny animal' },
                { emoji: '🐇', keywords: 'rabbit bunny pet animal' },
                { emoji: '🐿️', keywords: 'squirrel chipmunk animal' },
                { emoji: '🦫', keywords: 'beaver animal' },
                { emoji: '🦔', keywords: 'hedgehog pet animal' },
                { emoji: '🦇', keywords: 'bat animal night' },
                { emoji: '🐻', keywords: 'bear animal' },
                { emoji: '🐻‍❄️', keywords: 'polar bear animal' },
                { emoji: '🐨', keywords: 'koala animal' },
                { emoji: '🐼', keywords: 'panda animal' },
                { emoji: '🦥', keywords: 'sloth animal slow' },
                { emoji: '🦦', keywords: 'otter animal' },
                { emoji: '🦨', keywords: 'skunk animal' },
                { emoji: '🦘', keywords: 'kangaroo animal' },
                { emoji: '🦡', keywords: 'badger animal' },
                { emoji: '🐾', keywords: 'paw prints animal' },
                { emoji: '🦃', keywords: 'turkey bird animal' },
                { emoji: '🐔', keywords: 'chicken bird animal farm' },
                { emoji: '🐓', keywords: 'rooster chicken bird' },
                { emoji: '🐣', keywords: 'hatching chick bird' },
                { emoji: '🐤', keywords: 'baby chick bird' },
                { emoji: '🐥', keywords: 'chick bird' },
                { emoji: '🐦', keywords: 'bird pet animal' },
                { emoji: '🐧', keywords: 'penguin bird animal' },
                { emoji: '🕊️', keywords: 'dove peace bird' },
                { emoji: '🦅', keywords: 'eagle bird animal' },
                { emoji: '🦆', keywords: 'duck bird animal' },
                { emoji: '🦢', keywords: 'swan bird animal' },
                { emoji: '🦉', keywords: 'owl bird animal night' },
                { emoji: '🦤', keywords: 'dodo bird extinct' },
                { emoji: '🦩', keywords: 'flamingo bird pink animal' },
                { emoji: '🦚', keywords: 'peacock bird animal' },
                { emoji: '🦜', keywords: 'parrot bird pet animal' },
                { emoji: '🐸', keywords: 'frog animal' },
                { emoji: '🐊', keywords: 'crocodile animal' },
                { emoji: '🐢', keywords: 'turtle pet animal slow' },
                { emoji: '🦎', keywords: 'lizard animal' },
                { emoji: '🐍', keywords: 'snake animal' },
                { emoji: '🐲', keywords: 'dragon face fantasy' },
                { emoji: '🐉', keywords: 'dragon fantasy' },
                { emoji: '🦕', keywords: 'dinosaur sauropod animal' },
                { emoji: '🦖', keywords: 'dinosaur t-rex animal' },
                { emoji: '🐳', keywords: 'whale animal ocean' },
                { emoji: '🐋', keywords: 'whale animal ocean' },
                { emoji: '🐬', keywords: 'dolphin animal ocean' },
                { emoji: '🦭', keywords: 'seal animal ocean' },
                { emoji: '🐟', keywords: 'fish animal ocean' },
                { emoji: '🐠', keywords: 'fish pet animal aquarium' },
                { emoji: '🐡', keywords: 'blowfish puffer fish animal' },
                { emoji: '🦈', keywords: 'shark fish animal ocean' },
                { emoji: '🐙', keywords: 'octopus animal ocean' },
                { emoji: '🐚', keywords: 'shell ocean beach' },
                { emoji: '🐌', keywords: 'snail slow animal' },
                { emoji: '🦋', keywords: 'butterfly insect animal' },
                { emoji: '🐛', keywords: 'bug caterpillar insect' },
                { emoji: '🐜', keywords: 'ant insect animal' },
                { emoji: '🐝', keywords: 'bee honey insect' },
                { emoji: '🪲', keywords: 'beetle insect animal' },
                { emoji: '🐞', keywords: 'ladybug insect animal' },
                { emoji: '🦗', keywords: 'cricket insect animal' },
                { emoji: '🪳', keywords: 'cockroach insect' },
                { emoji: '🕷️', keywords: 'spider insect animal' },
                { emoji: '🕸️', keywords: 'spider web' },
                { emoji: '🦂', keywords: 'scorpion animal' },
                { emoji: '🦟', keywords: 'mosquito insect' },
                { emoji: '🪰', keywords: 'fly insect' },
                { emoji: '🪱', keywords: 'worm animal' },
                
                // Food & Drink
                { emoji: '🍎', keywords: 'apple fruit food healthy' },
                { emoji: '🍏', keywords: 'green apple fruit food' },
                { emoji: '🍊', keywords: 'orange fruit food' },
                { emoji: '🍋', keywords: 'lemon fruit food' },
                { emoji: '🍌', keywords: 'banana fruit food' },
                { emoji: '🍉', keywords: 'watermelon fruit food' },
                { emoji: '🍇', keywords: 'grapes fruit food' },
                { emoji: '🍓', keywords: 'strawberry fruit food' },
                { emoji: '🫐', keywords: 'blueberries fruit food' },
                { emoji: '🍈', keywords: 'melon fruit food' },
                { emoji: '🍒', keywords: 'cherries fruit food' },
                { emoji: '🍑', keywords: 'peach fruit food' },
                { emoji: '🥭', keywords: 'mango fruit food' },
                { emoji: '🍍', keywords: 'pineapple fruit food' },
                { emoji: '🥥', keywords: 'coconut fruit food' },
                { emoji: '🥝', keywords: 'kiwi fruit food' },
                { emoji: '🍅', keywords: 'tomato vegetable food' },
                { emoji: '🍆', keywords: 'eggplant vegetable food' },
                { emoji: '🥑', keywords: 'avocado food' },
                { emoji: '🥦', keywords: 'broccoli vegetable food' },
                { emoji: '🥬', keywords: 'leafy greens vegetable food' },
                { emoji: '🥒', keywords: 'cucumber vegetable food' },
                { emoji: '🌶️', keywords: 'hot pepper spicy food' },
                { emoji: '🫑', keywords: 'bell pepper vegetable food' },
                { emoji: '🌽', keywords: 'corn vegetable food' },
                { emoji: '🥕', keywords: 'carrot vegetable food' },
                { emoji: '🫒', keywords: 'olive food' },
                { emoji: '🧄', keywords: 'garlic food cooking' },
                { emoji: '🧅', keywords: 'onion food cooking' },
                { emoji: '🥔', keywords: 'potato vegetable food' },
                { emoji: '🍠', keywords: 'sweet potato food' },
                { emoji: '🥐', keywords: 'croissant bread pastry food' },
                { emoji: '🥯', keywords: 'bagel bread food breakfast' },
                { emoji: '🍞', keywords: 'bread food' },
                { emoji: '🥖', keywords: 'baguette bread food' },
                { emoji: '🥨', keywords: 'pretzel food snack' },
                { emoji: '🧀', keywords: 'cheese food' },
                { emoji: '🥚', keywords: 'egg food breakfast' },
                { emoji: '🍳', keywords: 'pan cook breakfast kitchen egg' },
                { emoji: '🧈', keywords: 'butter food' },
                { emoji: '🥞', keywords: 'pancakes breakfast food' },
                { emoji: '🧇', keywords: 'waffle breakfast food' },
                { emoji: '🥓', keywords: 'bacon breakfast food' },
                { emoji: '🥩', keywords: 'meat steak food' },
                { emoji: '🍗', keywords: 'poultry leg chicken food' },
                { emoji: '🍖', keywords: 'meat bone food' },
                { emoji: '🌭', keywords: 'hot dog food' },
                { emoji: '🍔', keywords: 'hamburger burger food' },
                { emoji: '🍟', keywords: 'fries french fries food' },
                { emoji: '🍕', keywords: 'pizza food' },
                { emoji: '🫓', keywords: 'flatbread food' },
                { emoji: '🥪', keywords: 'sandwich food' },
                { emoji: '🥙', keywords: 'stuffed flatbread food' },
                { emoji: '🧆', keywords: 'falafel food' },
                { emoji: '🌮', keywords: 'taco food mexican' },
                { emoji: '🌯', keywords: 'burrito food mexican' },
                { emoji: '🫔', keywords: 'tamale food' },
                { emoji: '🥗', keywords: 'salad food healthy meal' },
                { emoji: '🥘', keywords: 'pan cook dinner kitchen shallow' },
                { emoji: '🫕', keywords: 'fondue food' },
                { emoji: '🥫', keywords: 'canned food' },
                { emoji: '🍝', keywords: 'spaghetti pasta food italian' },
                { emoji: '🍜', keywords: 'ramen noodles food' },
                { emoji: '🍲', keywords: 'pot cook soup kitchen stew' },
                { emoji: '🍛', keywords: 'curry rice food' },
                { emoji: '🍣', keywords: 'sushi food japanese' },
                { emoji: '🍱', keywords: 'lunch bento meal food box' },
                { emoji: '🥟', keywords: 'dumpling food' },
                { emoji: '🦪', keywords: 'oyster seafood food' },
                { emoji: '🍤', keywords: 'fried shrimp food' },
                { emoji: '🍙', keywords: 'rice ball food japanese' },
                { emoji: '🍚', keywords: 'cooked rice food' },
                { emoji: '🍘', keywords: 'rice cracker food' },
                { emoji: '🍥', keywords: 'fish cake food' },
                { emoji: '🥠', keywords: 'fortune cookie food' },
                { emoji: '🥮', keywords: 'moon cake food' },
                { emoji: '🍢', keywords: 'oden food' },
                { emoji: '🍡', keywords: 'dango food sweet' },
                { emoji: '🍧', keywords: 'shaved ice dessert food' },
                { emoji: '🍨', keywords: 'ice cream dessert food' },
                { emoji: '🍦', keywords: 'soft ice cream dessert food' },
                { emoji: '🥧', keywords: 'pie dessert food' },
                { emoji: '🧁', keywords: 'cupcake cake dessert food' },
                { emoji: '🍰', keywords: 'cake dessert food' },
                { emoji: '🎂', keywords: 'birthday cake celebration food' },
                { emoji: '🍮', keywords: 'custard pudding dessert food' },
                { emoji: '🍭', keywords: 'lollipop candy sweet food' },
                { emoji: '🍬', keywords: 'candy sweet food' },
                { emoji: '🍫', keywords: 'chocolate bar sweet food' },
                { emoji: '🍿', keywords: 'popcorn movie snack food' },
                { emoji: '🍩', keywords: 'doughnut donut sweet food' },
                { emoji: '🍪', keywords: 'cookie sweet food' },
                { emoji: '🌰', keywords: 'chestnut nut food' },
                { emoji: '🥜', keywords: 'peanuts nuts food' },
                { emoji: '🍯', keywords: 'honey pot sweet food' },
                { emoji: '🥛', keywords: 'milk glass drink' },
                { emoji: '🍼', keywords: 'baby bottle milk' },
                { emoji: '🫖', keywords: 'teapot tea drink' },
                { emoji: '☕', keywords: 'coffee hot drink' },
                { emoji: '🍵', keywords: 'tea cup drink' },
                { emoji: '🧃', keywords: 'juice box drink' },
                { emoji: '🥤', keywords: 'cup straw drink soda' },
                { emoji: '🧋', keywords: 'bubble tea drink' },
                { emoji: '🍶', keywords: 'sake bottle drink' },
                { emoji: '🍺', keywords: 'beer mug drink' },
                { emoji: '🍻', keywords: 'beers clinking drink cheers' },
                { emoji: '🥂', keywords: 'glasses clinking toast drink' },
                { emoji: '🍷', keywords: 'wine glass drink' },
                { emoji: '🥃', keywords: 'whiskey glass drink' },
                { emoji: '🍸', keywords: 'cocktail glass drink' },
                { emoji: '🍹', keywords: 'tropical drink cocktail' },
                { emoji: '🧉', keywords: 'mate drink' },
                { emoji: '🍾', keywords: 'champagne bottle celebrate' },
                { emoji: '🧊', keywords: 'ice cube cold' },
                
                // Activities & Sports
                { emoji: '⚽', keywords: 'soccer ball sport football' },
                { emoji: '🏀', keywords: 'basketball ball sport' },
                { emoji: '🏈', keywords: 'football american sport' },
                { emoji: '⚾', keywords: 'baseball ball sport' },
                { emoji: '🥎', keywords: 'softball ball sport' },
                { emoji: '🎾', keywords: 'tennis ball sport' },
                { emoji: '🏐', keywords: 'volleyball ball sport' },
                { emoji: '🏉', keywords: 'rugby football ball sport' },
                { emoji: '🥏', keywords: 'frisbee flying disc sport' },
                { emoji: '🎱', keywords: 'pool billiards 8 ball' },
                { emoji: '🪀', keywords: 'yo-yo toy' },
                { emoji: '🏓', keywords: 'ping pong table tennis sport' },
                { emoji: '🏸', keywords: 'badminton racket sport' },
                { emoji: '🏒', keywords: 'ice hockey stick sport' },
                { emoji: '🏑', keywords: 'field hockey stick sport' },
                { emoji: '🥍', keywords: 'lacrosse stick sport' },
                { emoji: '🏏', keywords: 'cricket game sport' },
                { emoji: '🪃', keywords: 'boomerang sport' },
                { emoji: '🥅', keywords: 'goal net sport' },
                { emoji: '⛳', keywords: 'flag hole golf sport' },
                { emoji: '🪁', keywords: 'kite flying toy' },
                { emoji: '🏹', keywords: 'bow arrow archery sport' },
                { emoji: '🎣', keywords: 'fishing pole rod' },
                { emoji: '🤿', keywords: 'diving mask snorkel' },
                { emoji: '🥊', keywords: 'boxing glove sport' },
                { emoji: '🥋', keywords: 'martial arts uniform karate' },
                { emoji: '🎽', keywords: 'running shirt sport' },
                { emoji: '🛹', keywords: 'skateboard sport' },
                { emoji: '🛼', keywords: 'roller skate sport' },
                { emoji: '🛷', keywords: 'sled snow sport' },
                { emoji: '⛸️', keywords: 'ice skate sport' },
                { emoji: '🥌', keywords: 'curling stone sport' },
                { emoji: '🎿', keywords: 'skis snow sport' },
                { emoji: '⛷️', keywords: 'skier snow sport' },
                { emoji: '🏂', keywords: 'snowboarder snow sport' },
                { emoji: '🪂', keywords: 'parachute skydiving' },
                { emoji: '🏋️', keywords: 'weight lifting gym exercise' },
                { emoji: '🤼', keywords: 'wrestling sport' },
                { emoji: '🤸', keywords: 'cartwheel gymnastics' },
                { emoji: '⛹️', keywords: 'basketball person sport' },
                { emoji: '🤺', keywords: 'fencing sport' },
                { emoji: '🤾', keywords: 'handball sport' },
                { emoji: '🏌️', keywords: 'golf person sport' },
                { emoji: '🏇', keywords: 'horse racing jockey' },
                { emoji: '🧘', keywords: 'yoga meditation lotus' },
                { emoji: '🏊', keywords: 'swimming person sport' },
                { emoji: '🏄', keywords: 'surfing person sport' },
                { emoji: '🚣', keywords: 'rowing boat person' },
                { emoji: '🧗', keywords: 'climbing person sport' },
                { emoji: '🚴', keywords: 'biking cycling person' },
                { emoji: '🚵', keywords: 'mountain biking person sport' },
                { emoji: '🤹', keywords: 'juggling person' },
                
                // Travel & Places
                { emoji: '🚗', keywords: 'car automobile vehicle' },
                { emoji: '🚕', keywords: 'taxi cab vehicle' },
                { emoji: '🚙', keywords: 'suv vehicle car' },
                { emoji: '🚌', keywords: 'bus vehicle' },
                { emoji: '🚎', keywords: 'trolleybus vehicle' },
                { emoji: '🏎️', keywords: 'race car fast vehicle' },
                { emoji: '🚓', keywords: 'police car vehicle' },
                { emoji: '🚑', keywords: 'ambulance vehicle emergency' },
                { emoji: '🚒', keywords: 'fire truck engine vehicle' },
                { emoji: '🚐', keywords: 'minibus vehicle' },
                { emoji: '🛻', keywords: 'pickup truck vehicle' },
                { emoji: '🚚', keywords: 'delivery truck vehicle' },
                { emoji: '🚛', keywords: 'articulated lorry truck vehicle' },
                { emoji: '🚜', keywords: 'tractor vehicle farm' },
                { emoji: '🏍️', keywords: 'motorcycle bike vehicle' },
                { emoji: '🛵', keywords: 'motor scooter vehicle' },
                { emoji: '🦽', keywords: 'wheelchair manual' },
                { emoji: '🦼', keywords: 'wheelchair motorized' },
                { emoji: '🛴', keywords: 'scooter kick' },
                { emoji: '🚲', keywords: 'bicycle bike' },
                { emoji: '🛺', keywords: 'auto rickshaw vehicle' },
                { emoji: '🚁', keywords: 'helicopter vehicle' },
                { emoji: '🛩️', keywords: 'small airplane plane' },
                { emoji: '✈️', keywords: 'airplane plane travel' },
                { emoji: '🛫', keywords: 'airplane departure takeoff' },
                { emoji: '🛬', keywords: 'airplane arrival landing' },
                { emoji: '🪂', keywords: 'parachute skydiving' },
                { emoji: '💺', keywords: 'seat airplane' },
                { emoji: '🚀', keywords: 'rocket space launch' },
                { emoji: '🛸', keywords: 'ufo flying saucer alien' },
                { emoji: '🚉', keywords: 'station train' },
                { emoji: '🚊', keywords: 'tram vehicle' },
                { emoji: '🚝', keywords: 'monorail vehicle' },
                { emoji: '🚞', keywords: 'mountain railway' },
                { emoji: '🚋', keywords: 'tram car vehicle' },
                { emoji: '🚃', keywords: 'railway car train' },
                { emoji: '🚄', keywords: 'high speed train bullet' },
                { emoji: '🚅', keywords: 'bullet train high speed' },
                { emoji: '🚆', keywords: 'train vehicle' },
                { emoji: '🚇', keywords: 'metro subway train' },
                { emoji: '🚈', keywords: 'light rail train' },
                { emoji: '🚂', keywords: 'locomotive steam train' },
                { emoji: '🚝', keywords: 'monorail vehicle' },
                { emoji: '🚄', keywords: 'high speed train' },
                { emoji: '🚢', keywords: 'ship boat cruise' },
                { emoji: '⛴️', keywords: 'ferry boat' },
                { emoji: '🛳️', keywords: 'passenger ship cruise' },
                { emoji: '⛵', keywords: 'sailboat boat' },
                { emoji: '🚤', keywords: 'speedboat boat' },
                { emoji: '🛥️', keywords: 'motor boat' },
                { emoji: '🛶', keywords: 'canoe boat' },
                { emoji: '⚓', keywords: 'anchor ship' },
                { emoji: '⛽', keywords: 'fuel pump gas station' },
                { emoji: '🚏', keywords: 'bus stop' },
                { emoji: '🚦', keywords: 'traffic light signal' },
                { emoji: '🚥', keywords: 'horizontal traffic light' },
                { emoji: '🏗️', keywords: 'construction building' },
                { emoji: '🗼', keywords: 'tokyo tower landmark' },
                { emoji: '🗽', keywords: 'statue liberty landmark' },
                { emoji: '⛪', keywords: 'church building religion' },
                { emoji: '🕌', keywords: 'mosque building religion' },
                { emoji: '🛕', keywords: 'hindu temple building religion' },
                { emoji: '🕍', keywords: 'synagogue building religion' },
                { emoji: '⛩️', keywords: 'shinto shrine torii' },
                { emoji: '🕋', keywords: 'kaaba mecca religion' },
                { emoji: '⛲', keywords: 'fountain water' },
                { emoji: '⛺', keywords: 'tent camping' },
                { emoji: '🌁', keywords: 'foggy fog weather' },
                { emoji: '🌃', keywords: 'night stars city' },
                { emoji: '🏙️', keywords: 'cityscape buildings' },
                { emoji: '🌄', keywords: 'sunrise mountains' },
                { emoji: '🌅', keywords: 'sunrise ocean' },
                { emoji: '🌆', keywords: 'cityscape dusk' },
                { emoji: '🌇', keywords: 'sunset city' },
                { emoji: '🌉', keywords: 'bridge night' },
                { emoji: '🎠', keywords: 'carousel horse ride' },
                { emoji: '🎡', keywords: 'ferris wheel fair' },
                { emoji: '🎢', keywords: 'roller coaster ride' },
                { emoji: '🎪', keywords: 'circus tent fun event' },
                
                // Objects
                { emoji: '⌚', keywords: 'watch time clock' },
                { emoji: '📱', keywords: 'phone mobile smartphone' },
                { emoji: '📲', keywords: 'phone arrow mobile' },
                { emoji: '💻', keywords: 'laptop computer' },
                { emoji: '⌨️', keywords: 'keyboard computer' },
                { emoji: '🖥️', keywords: 'desktop computer' },
                { emoji: '🖨️', keywords: 'printer computer' },
                { emoji: '🖱️', keywords: 'computer mouse' },
                { emoji: '🖲️', keywords: 'trackball mouse' },
                { emoji: '🕹️', keywords: 'joystick game controller' },
                { emoji: '🗜️', keywords: 'clamp compression tool' },
                { emoji: '💾', keywords: 'floppy disk save' },
                { emoji: '💿', keywords: 'optical disc cd' },
                { emoji: '📀', keywords: 'dvd disc' },
                { emoji: '📼', keywords: 'videocassette vhs tape' },
                { emoji: '📷', keywords: 'camera photo' },
                { emoji: '📸', keywords: 'camera flash photo' },
                { emoji: '📹', keywords: 'video camera' },
                { emoji: '🎥', keywords: 'movie camera film' },
                { emoji: '📽️', keywords: 'film projector movie' },
                { emoji: '🎞️', keywords: 'film frames movie' },
                { emoji: '📞', keywords: 'telephone receiver phone' },
                { emoji: '☎️', keywords: 'telephone phone' },
                { emoji: '📟', keywords: 'pager beeper' },
                { emoji: '📠', keywords: 'fax machine' },
                { emoji: '📺', keywords: 'television tv' },
                { emoji: '📻', keywords: 'radio music' },
                { emoji: '🎙️', keywords: 'microphone studio' },
                { emoji: '🎚️', keywords: 'level slider music' },
                { emoji: '🎛️', keywords: 'control knobs music' },
                { emoji: '🧭', keywords: 'compass navigation direction' },
                { emoji: '⏱️', keywords: 'stopwatch timer' },
                { emoji: '⏲️', keywords: 'timer clock alarm' },
                { emoji: '⏰', keywords: 'alarm clock time' },
                { emoji: '🕰️', keywords: 'mantelpiece clock time' },
                { emoji: '⏳', keywords: 'hourglass time flowing' },
                { emoji: '⌛', keywords: 'hourglass done time' },
                { emoji: '📡', keywords: 'satellite antenna' },
                { emoji: '🔋', keywords: 'battery power' },
                { emoji: '🔌', keywords: 'electric plug power' },
                { emoji: '💡', keywords: 'light bulb idea electricity' },
                { emoji: '🔦', keywords: 'flashlight torch' },
                { emoji: '🕯️', keywords: 'candle light fire' },
                { emoji: '🪔', keywords: 'diya lamp light' },
                { emoji: '🧯', keywords: 'fire extinguisher safety' },
                { emoji: '🛢️', keywords: 'oil drum barrel' },
                { emoji: '💸', keywords: 'money wings flying cash' },
                { emoji: '💵', keywords: 'dollar banknote money' },
                { emoji: '💴', keywords: 'yen banknote money' },
                { emoji: '💶', keywords: 'euro banknote money' },
                { emoji: '💷', keywords: 'pound banknote money' },
                { emoji: '🪙', keywords: 'coin money' },
                { emoji: '💰', keywords: 'money bag cash' },
                { emoji: '💳', keywords: 'credit card payment' },
                { emoji: '🧾', keywords: 'receipt bill' },
                { emoji: '💎', keywords: 'gem stone diamond' },
                { emoji: '⚖️', keywords: 'balance scale justice' },
                { emoji: '🪜', keywords: 'ladder climb high' },
                { emoji: '🧰', keywords: 'toolbox tools' },
                { emoji: '🪛', keywords: 'screwdriver tool' },
                { emoji: '🔧', keywords: 'wrench tool fix repair' },
                { emoji: '🔨', keywords: 'hammer tool' },
                { emoji: '⚒️', keywords: 'hammer pick tools' },
                { emoji: '🛠️', keywords: 'hammer wrench tools' },
                { emoji: '⛏️', keywords: 'pick tool mining' },
                { emoji: '🪚', keywords: 'saw tool carpentry' },
                { emoji: '🔩', keywords: 'nut bolt tool' },
                { emoji: '⚙️', keywords: 'gear settings mechanical' },
                { emoji: '🪤', keywords: 'mouse trap' },
                { emoji: '🧱', keywords: 'brick wall building' },
                { emoji: '⛓️', keywords: 'chains links' },
                { emoji: '🧲', keywords: 'magnet magnetic' },
                { emoji: '🔫', keywords: 'water gun pistol toy' },
                { emoji: '💣', keywords: 'bomb explosive' },
                { emoji: '🧨', keywords: 'firecracker dynamite' },
                { emoji: '🪓', keywords: 'axe tool chop' },
                { emoji: '🔪', keywords: 'knife cook kitchen cut' },
                { emoji: '🗡️', keywords: 'dagger sword weapon' },
                { emoji: '⚔️', keywords: 'crossed swords fight' },
                { emoji: '🛡️', keywords: 'shield protection' },
                { emoji: '🚬', keywords: 'cigarette smoking' },
                { emoji: '⚰️', keywords: 'coffin funeral' },
                { emoji: '🪦', keywords: 'headstone grave cemetery' },
                { emoji: '⚱️', keywords: 'funeral urn ashes' },
                { emoji: '🏺', keywords: 'amphora vase jar' },
                { emoji: '🔮', keywords: 'crystal ball fortune' },
                { emoji: '📿', keywords: 'prayer beads rosary' },
                { emoji: '🧿', keywords: 'nazar amulet evil eye' },
                { emoji: '💈', keywords: 'barber pole haircut' },
                { emoji: '⚗️', keywords: 'alembic chemistry science' },
                { emoji: '🔭', keywords: 'telescope astronomy space' },
                { emoji: '🔬', keywords: 'microscope science lab' },
                { emoji: '🕳️', keywords: 'hole' },
                { emoji: '🩹', keywords: 'adhesive bandage medical' },
                { emoji: '🩺', keywords: 'stethoscope medical doctor' },
                { emoji: '💊', keywords: 'pill medicine medical' },
                { emoji: '💉', keywords: 'syringe needle medical' },
                { emoji: '🩸', keywords: 'drop blood medical' },
                { emoji: '🧬', keywords: 'dna genetics science' },
                { emoji: '🦠', keywords: 'microbe virus bacteria' },
                { emoji: '🧫', keywords: 'petri dish science lab' },
                { emoji: '🧪', keywords: 'test tube science lab' },
                { emoji: '🌡️', keywords: 'thermometer temperature sick' },
                { emoji: '🧹', keywords: 'broom sweep clean chore' },
                { emoji: '🧺', keywords: 'basket laundry clean chore' },
                { emoji: '🧻', keywords: 'toilet paper bathroom roll' },
                { emoji: '🪣', keywords: 'bucket water clean mop chore' },
                { emoji: '🧼', keywords: 'soap clean wash bathroom bar' },
                { emoji: '🪥', keywords: 'toothbrush teeth brush dental' },
                { emoji: '🧽', keywords: 'sponge clean wash dish chore' },
                { emoji: '🧴', keywords: 'lotion soap bottle bathroom pump' },
                { emoji: '🛁', keywords: 'bath bathtub bathroom clean tub' },
                { emoji: '🪒', keywords: 'razor shave bathroom blade' },
                { emoji: '🪮', keywords: 'hair pick comb' },
                { emoji: '🚿', keywords: 'shower bathroom clean water' },
                { emoji: '🚽', keywords: 'toilet bathroom' },
                { emoji: '🪠', keywords: 'plunger toilet bathroom' },
                { emoji: '🚰', keywords: 'potable water tap drink' },
                { emoji: '🚿', keywords: 'shower head bathroom' },
                { emoji: '🛀', keywords: 'bath person bathtub' },
                { emoji: '🧖', keywords: 'person steamy room sauna spa' },
                { emoji: '🧴', keywords: 'lotion bottle' },
                { emoji: '💅', keywords: 'nail polish beauty' },
                { emoji: '💄', keywords: 'lipstick makeup beauty' },
                { emoji: '💍', keywords: 'ring diamond wedding' },
                { emoji: '💎', keywords: 'gem diamond jewel' },
                
                // School & Office
                { emoji: '🎒', keywords: 'backpack bag school book' },
                { emoji: '📚', keywords: 'books read study school homework pile' },
                { emoji: '📖', keywords: 'book read study school open' },
                { emoji: '📕', keywords: 'closed book red' },
                { emoji: '📗', keywords: 'green book closed' },
                { emoji: '📘', keywords: 'blue book closed' },
                { emoji: '📙', keywords: 'orange book closed' },
                { emoji: '📓', keywords: 'notebook school' },
                { emoji: '📔', keywords: 'notebook decorative cover' },
                { emoji: '📒', keywords: 'ledger notebook' },
                { emoji: '📃', keywords: 'page curl paper' },
                { emoji: '📜', keywords: 'scroll paper' },
                { emoji: '📄', keywords: 'page document paper' },
                { emoji: '📰', keywords: 'newspaper news paper' },
                { emoji: '🗞️', keywords: 'rolled newspaper news' },
                { emoji: '📑', keywords: 'bookmark tabs paper' },
                { emoji: '🔖', keywords: 'bookmark tag' },
                { emoji: '🏷️', keywords: 'label tag price' },
                { emoji: '💰', keywords: 'money bag dollar' },
                { emoji: '🪙', keywords: 'coin money' },
                { emoji: '💴', keywords: 'yen money' },
                { emoji: '💵', keywords: 'dollar money' },
                { emoji: '💶', keywords: 'euro money' },
                { emoji: '💷', keywords: 'pound money' },
                { emoji: '💸', keywords: 'money flying wings' },
                { emoji: '💳', keywords: 'credit card payment' },
                { emoji: '🧾', keywords: 'receipt bill invoice' },
                { emoji: '✉️', keywords: 'envelope mail letter' },
                { emoji: '📧', keywords: 'email mail letter' },
                { emoji: '📨', keywords: 'incoming envelope mail' },
                { emoji: '📩', keywords: 'envelope arrow mail' },
                { emoji: '📤', keywords: 'outbox tray mail' },
                { emoji: '📥', keywords: 'inbox tray mail' },
                { emoji: '📦', keywords: 'package box delivery' },
                { emoji: '📫', keywords: 'mailbox closed flag up' },
                { emoji: '📪', keywords: 'mailbox closed flag down' },
                { emoji: '📬', keywords: 'mailbox open flag up' },
                { emoji: '📭', keywords: 'mailbox open flag down' },
                { emoji: '📮', keywords: 'postbox mail' },
                { emoji: '🗳️', keywords: 'ballot box vote' },
                { emoji: '✏️', keywords: 'pencil write school homework draw' },
                { emoji: '✒️', keywords: 'pen nib write' },
                { emoji: '🖋️', keywords: 'fountain pen write' },
                { emoji: '🖊️', keywords: 'pen write school ballpoint' },
                { emoji: '🖌️', keywords: 'paintbrush art paint' },
                { emoji: '🖍️', keywords: 'crayon draw color' },
                { emoji: '📝', keywords: 'memo note write school paper' },
                { emoji: '📁', keywords: 'file folder documents' },
                { emoji: '📂', keywords: 'open file folder' },
                { emoji: '🗂️', keywords: 'card index dividers' },
                { emoji: '📅', keywords: 'calendar date' },
                { emoji: '📆', keywords: 'tear off calendar' },
                { emoji: '🗒️', keywords: 'spiral notepad paper' },
                { emoji: '🗓️', keywords: 'spiral calendar' },
                { emoji: '📇', keywords: 'card index rolodex' },
                { emoji: '📈', keywords: 'chart increasing graph' },
                { emoji: '📉', keywords: 'chart decreasing graph' },
                { emoji: '📊', keywords: 'bar chart graph' },
                { emoji: '📋', keywords: 'clipboard list checklist paper' },
                { emoji: '📌', keywords: 'pushpin pin note tack' },
                { emoji: '📍', keywords: 'round pushpin pin location' },
                { emoji: '📎', keywords: 'paperclip attach school clip' },
                { emoji: '🖇️', keywords: 'linked paperclips' },
                { emoji: '📏', keywords: 'straight ruler measure' },
                { emoji: '📐', keywords: 'triangular ruler triangle math school angle' },
                { emoji: '✂️', keywords: 'scissors cut craft snip' },
                { emoji: '🗃️', keywords: 'card file box storage' },
                { emoji: '🗄️', keywords: 'file cabinet storage' },
                { emoji: '🗑️', keywords: 'wastebasket trash bin' },
                
                // Symbols & Misc
                { emoji: '🔒', keywords: 'locked lock secure' },
                { emoji: '🔓', keywords: 'unlocked open lock' },
                { emoji: '🔏', keywords: 'locked pen key' },
                { emoji: '🔐', keywords: 'locked key secure' },
                { emoji: '🔑', keywords: 'key lock unlock' },
                { emoji: '🗝️', keywords: 'old key vintage' },
                { emoji: '🔨', keywords: 'hammer tool' },
                { emoji: '🪓', keywords: 'axe tool' },
                { emoji: '⛏️', keywords: 'pick tool' },
                { emoji: '⚒️', keywords: 'hammer pick tools' },
                { emoji: '🛠️', keywords: 'hammer wrench tools' },
                { emoji: '🗡️', keywords: 'dagger sword' },
                { emoji: '⚔️', keywords: 'crossed swords' },
                { emoji: '💣', keywords: 'bomb explosive' },
                { emoji: '🏹', keywords: 'bow arrow' },
                { emoji: '🛡️', keywords: 'shield protect' },
                { emoji: '🔧', keywords: 'wrench spanner tool' },
                { emoji: '🔩', keywords: 'nut bolt screw' },
                { emoji: '⚙️', keywords: 'gear cog settings' },
                { emoji: '⚗️', keywords: 'alembic chemistry' },
                { emoji: '⚖️', keywords: 'balance scale justice' },
                { emoji: '🔗', keywords: 'link chain connection' },
                { emoji: '⛓️', keywords: 'chains links' },
                { emoji: '💉', keywords: 'syringe medical needle' },
                { emoji: '💊', keywords: 'pill capsule medicine' },
                { emoji: '🩹', keywords: 'bandage adhesive medical' },
                { emoji: '🩺', keywords: 'stethoscope medical' },
                { emoji: '🚪', keywords: 'door entrance room exit' },
                { emoji: '🪟', keywords: 'window clean glass pane' },
                { emoji: '🛏️', keywords: 'bed bedroom sleep make furniture' },
                { emoji: '🛋️', keywords: 'couch sofa furniture living room lamp' },
                { emoji: '🪑', keywords: 'chair furniture room seat' },
                { emoji: '🚽', keywords: 'toilet bathroom' },
                { emoji: '🚿', keywords: 'shower bathroom' },
                { emoji: '🛁', keywords: 'bathtub bath bathroom' },
                { emoji: '🪒', keywords: 'razor shave' },
                { emoji: '🧴', keywords: 'lotion bottle' },
                { emoji: '🧷', keywords: 'safety pin' },
                { emoji: '🧹', keywords: 'broom sweep clean' },
                { emoji: '🧺', keywords: 'basket laundry' },
                { emoji: '🧻', keywords: 'roll paper toilet' },
                { emoji: '🧼', keywords: 'soap bar wash' },
                { emoji: '🧽', keywords: 'sponge clean' },
                { emoji: '🧯', keywords: 'fire extinguisher' },
                { emoji: '🛒', keywords: 'shopping cart trolley' },
                
                // Star and Achievement
                { emoji: '⭐', keywords: 'star reward achievement white' },
                { emoji: '🌟', keywords: 'glowing star shine' },
                { emoji: '💫', keywords: 'dizzy star spinning' },
                { emoji: '✨', keywords: 'sparkles sparkle shine clean star' },
                { emoji: '🎯', keywords: 'target goal achievement bullseye direct hit' },
                { emoji: '🎖️', keywords: 'military medal achievement' },
                { emoji: '🏆', keywords: 'trophy win achievement' },
                { emoji: '🥇', keywords: 'first place medal gold' },
                { emoji: '🥈', keywords: 'second place medal silver' },
                { emoji: '🥉', keywords: 'third place medal bronze' },
                { emoji: '🏅', keywords: 'sports medal achievement' },
                { emoji: '🎗️', keywords: 'reminder ribbon' },
                { emoji: '🎫', keywords: 'ticket admission' },
            ];
            
            // Store globally for use by other emoji pickers
            window.emojiData = emojiData;
            
            const grid = document.getElementById('emojiPickerGrid');
            if (grid) {
                grid.innerHTML = emojiData.map(item => 
                    `<div class="emoji-picker-item" data-keywords="${item.keywords}" onclick="selectEmoji('${item.emoji}')">${item.emoji}</div>`
                ).join('');
                
                // Parse emojis with Twemoji after populating
                if (typeof twemoji !== 'undefined') {
                    twemoji.parse(grid, {
                        folder: 'svg',
                        ext: '.svg'
                    });
                }
            }
            
            // Also initialize the task emoji picker
            initializeTaskEmojiPicker();
        }
        
        function filterEmojis() {
            const searchTerm = document.getElementById('emojiSearchInput').value.toLowerCase();
            const emojiItems = document.querySelectorAll('.emoji-picker-item');
            
            emojiItems.forEach(item => {
                const keywords = item.getAttribute('data-keywords');
                if (keywords.includes(searchTerm) || searchTerm === '') {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        }
        
        function toggleEmojiPicker(event) {
            event.stopPropagation();
            const dropdown = document.getElementById('emojiPickerDropdown');
            const searchInput = document.getElementById('emojiSearchInput');
            
            dropdown.classList.toggle('active');
            
            // Clear search and reset view when opening
            if (dropdown.classList.contains('active')) {
                searchInput.value = '';
                filterEmojis();
                setTimeout(() => searchInput.focus(), 100);
                
                // Close dropdown when clicking outside
                setTimeout(() => {
                    document.addEventListener('click', closeEmojiPicker);
                }, 0);
            }
        }
        
        function closeEmojiPicker() {
            const dropdown = document.getElementById('emojiPickerDropdown');
            dropdown.classList.remove('active');
            document.removeEventListener('click', closeEmojiPicker);
        }
        
        function selectEmoji(emoji) {
            document.getElementById('taskChoreEmoji').value = emoji;
            closeEmojiPicker();
        }
        
        function toggleTaskEmojiPicker(event) {
            event.stopPropagation();
            const dropdown = document.getElementById('taskEmojiPickerDropdown');
            const searchInput = document.getElementById('taskEmojiSearchInput');
            
            dropdown.classList.toggle('active');
            
            if (dropdown.classList.contains('active')) {
                searchInput.value = '';
                filterTaskEmojis();
                setTimeout(() => searchInput.focus(), 100);
                
                setTimeout(() => {
                    document.addEventListener('click', closeTaskEmojiPicker);
                }, 0);
            }
        }
        
        function closeTaskEmojiPicker() {
            const dropdown = document.getElementById('taskEmojiPickerDropdown');
            dropdown.classList.remove('active');
            document.removeEventListener('click', closeTaskEmojiPicker);
        }
        
        function selectTaskEmoji(emoji) {
            document.getElementById('taskChoreEmoji').value = emoji;
            const display = document.getElementById('taskChoreEmojiDisplay');
            display.textContent = emoji;
            closeTaskEmojiPicker();
            
            // Parse the emoji with Twemoji
            if (typeof twemoji !== 'undefined') {
                twemoji.parse(display, {
                    folder: 'svg',
                    ext: '.svg'
                });
            }
        }
        
        function filterTaskEmojis() {
            const searchTerm = document.getElementById('taskEmojiSearchInput').value.toLowerCase();
            const emojiItems = document.querySelectorAll('#taskEmojiPickerGrid .emoji-picker-item');
            
            emojiItems.forEach(item => {
                const keywords = item.getAttribute('data-keywords');
                if (keywords.includes(searchTerm) || searchTerm === '') {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        }
        
        function initializeTaskEmojiPicker() {
            const grid = document.getElementById('taskEmojiPickerGrid');
            if (!grid) return;
            
            // Use the emoji data stored globally
            const emojiData = window.emojiData || [];
            
            if (emojiData.length > 0) {
                grid.innerHTML = emojiData.map(item => 
                    `<div class="emoji-picker-item" data-keywords="${item.keywords}" onclick="selectTaskEmoji('${item.emoji}')">${item.emoji}</div>`
                ).join('');
                
                // Parse emojis with Twemoji after populating
                if (typeof twemoji !== 'undefined') {
                    twemoji.parse(grid, {
                        folder: 'svg',
                        ext: '.svg'
                    });
                }
            }
        }
        
        function renderProfileGrid() {
            const grid = document.getElementById('taskProfileGrid');
            const choreMembers = familyMembers.filter(m => !m.isGoogleCalendar);
            
            let html = '';
            choreMembers.forEach(member => {
                const isSelected = selectedProfiles.includes(member.name);
                html += `<div class="edit-profile-item" onclick="toggleProfile('${member.name}')">
                    <div class="edit-profile-avatar ${isSelected ? 'selected' : ''}" style="background: ${member.color}; box-shadow: 0 0 0 5px ${member.color}80" data-member="${member.name}">
                        ${member.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="edit-profile-name">${member.name}</div>
                </div>`;
            });
            
            html += `<div class="edit-profile-item">
                <div class="edit-profile-avatar" style="background: #e0e0e0; color: #666;">+</div>
                <div class="edit-profile-name">Add</div>
            </div>`;
            
            grid.innerHTML = html;
        }
        
        function toggleProfile(profileName) {
            const index = selectedProfiles.indexOf(profileName);
            if (index > -1) {
                selectedProfiles.splice(index, 1);
            } else {
                selectedProfiles.push(profileName);
            }
            renderProfileGrid();
        }
        
        function renderEventProfileGrid() {
            const grid = document.getElementById('eventProfileGrid');
            const summary = document.getElementById('eventProfileSummary');
            
            if (!grid) {
                return;
            }
            
            let html = '';
            familyMembers.forEach(member => {
                const isSelected = selectedEventProfiles.includes(member.name);
                html += `<div class="edit-profile-item" onclick="toggleEventProfile('${member.name}')">
                    <div class="edit-profile-avatar ${isSelected ? 'selected' : ''}" style="background: ${member.color}; box-shadow: 0 0 0 5px ${member.color}80" data-member="${member.name}">
                        ${member.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="edit-profile-name">${member.name}</div>
                </div>`;
            });
            
            grid.innerHTML = html;
            
            // Update summary text
            if (summary) {
                if (selectedEventProfiles.length > 0) {
                    summary.textContent = selectedEventProfiles.join(', ');
                } else {
                    summary.textContent = '';
                }
            }
        }
        
        function toggleEventProfile(profileName) {
            const index = selectedEventProfiles.indexOf(profileName);
            if (index > -1) {
                // Remove if already selected
                selectedEventProfiles.splice(index, 1);
            } else {
                // Add if not selected
                selectedEventProfiles.push(profileName);
            }
            renderEventProfileGrid();
        }
        
        function selectEventProfile(profileName) {
            // Keep this for backward compatibility
            selectedEventProfile = profileName;
            selectedEventProfiles = [profileName];
            renderEventProfileGrid();
        }
        
        function setTaskType(type) {
            currentTaskType = type;
            document.getElementById('choreTypeBtn').classList.toggle('active', type === 'chore');
            document.getElementById('routineTypeBtn').classList.toggle('active', type === 'routine');
            
            // Show/hide appropriate fields
            document.getElementById('choreFields').style.display = type === 'chore' ? 'block' : 'none';
            document.getElementById('routineFields').style.display = type === 'routine' ? 'block' : 'none';
        }
        
        // Chore-specific functions
        let selectedChoreDays = [];
        let selectedChoreRepeatUnit = 'day';
        
        function toggleChoreDate() {
            const enabled = document.getElementById('taskChoreDate').checked;
            document.getElementById('taskChoreDateValue').style.display = enabled ? 'block' : 'none';
            if (enabled && !document.getElementById('taskChoreDateValue').value) {
                // Set to today by default
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('taskChoreDateValue').value = today;
            }
        }
        
        function toggleChoreTime() {
            const enabled = document.getElementById('taskChoreTime').checked;
            document.getElementById('taskChoreTimeValue').style.display = enabled ? 'block' : 'none';
        }
        
        function toggleChoreRepeat() {
            const enabled = document.getElementById('taskChoreRepeatToggle').checked;
            document.getElementById('taskChoreRepeatDetails').style.display = enabled ? 'block' : 'none';
        }
        
        function setChoreRepeatUnit(unit) {
            selectedChoreRepeatUnit = unit;
            document.getElementById('choreRepeatDay').classList.toggle('active', unit === 'day');
            document.getElementById('choreRepeatWeek').classList.toggle('active', unit === 'week');
            document.getElementById('choreRepeatMonth').classList.toggle('active', unit === 'month');
            
            // Show/hide days selector based on unit
            const daysSection = document.getElementById('choreRepeatDays');
            if (daysSection) {
                daysSection.style.display = unit === 'week' ? 'block' : 'none';
            }
        }
        
        function toggleChoreDayNew(dayIndex) {
            const btn = document.querySelector(`#choreRepeatDays .day-btn-new[data-day="${dayIndex}"]`);
            if (btn) {
                btn.classList.toggle('active');
            }
            
            const index = selectedChoreDays.indexOf(dayIndex);
            if (index > -1) {
                selectedChoreDays.splice(index, 1);
            } else {
                selectedChoreDays.push(dayIndex);
            }
        }
        
        function toggleChoreRepeatsUntil() {
            const enabled = document.getElementById('choreRepeatsUntil').checked;
            document.getElementById('choreRepeatsUntilDate').style.display = enabled ? 'block' : 'none';
        }
        
        let selectedRepeatUnit = 'week';
        let selectedTimeOfDay = 'evening';
        
        function setRepeatUnit(unit) {
            selectedRepeatUnit = unit;
            document.getElementById('repeatDay').classList.toggle('active', unit === 'day');
            document.getElementById('repeatWeek').classList.toggle('active', unit === 'week');
            
            // Show/hide days selector based on unit
            const daysSection = document.getElementById('taskRepeatDays');
            if (daysSection) {
                daysSection.style.display = unit === 'week' ? 'block' : 'none';
            }
        }
        
        function setTimeOfDay(timeOfDay) {
            selectedTimeOfDay = timeOfDay;
            document.getElementById('timeOfDayMorning').classList.toggle('active', timeOfDay === 'morning');
            document.getElementById('timeOfDayAfternoon').classList.toggle('active', timeOfDay === 'afternoon');
            document.getElementById('timeOfDayEvening').classList.toggle('active', timeOfDay === 'evening');
        }
        
        function toggleDayNew(dayIndex) {
            const btn = document.querySelector(`.day-btn-new[data-day="${dayIndex}"]`);
            if (btn) {
                btn.classList.toggle('active');
            }
            
            const index = selectedDays.indexOf(dayIndex);
            if (index > -1) {
                selectedDays.splice(index, 1);
            } else {
                selectedDays.push(dayIndex);
            }
        }
        
        function changeRepeatEvery(delta) {
            const input = document.getElementById('taskRepeatEvery');
            const currentValue = parseInt(input.value) || 1;
            const newValue = Math.max(1, currentValue + delta);
            input.value = newValue;
        }
        
        function saveTaskChore() {
            const title = document.getElementById('taskChoreTitle').value;
            const emoji = document.getElementById('taskChoreEmoji').value;
            const stars = parseInt(document.getElementById('taskStars').value) || 0;
            
            if (!title || selectedProfiles.length === 0) {
                alert('Please enter a title and select at least one profile');
                return;
            }
            
            selectedProfiles.forEach(profileName => {
                if (currentTaskType === 'routine') {
                    // ROUTINE CREATION
                    const repeatEvery = parseInt(document.getElementById('taskRepeatEvery').value) || 1;
                    const repeatUnit = selectedRepeatUnit;
                    const repeatDays = repeatUnit === 'week' ? [...selectedDays] : null;
                    
                    const repeatData = {
                        every: repeatEvery,
                        unit: repeatUnit,
                        days: repeatDays,
                        until: null
                    };
                    
                    // Use the selected time of day
                    let period = 'Evening'; // Default
                    if (selectedTimeOfDay === 'morning') period = 'Morning';
                    else if (selectedTimeOfDay === 'afternoon') period = 'Afternoon';
                    else if (selectedTimeOfDay === 'evening') period = 'Evening';
                    
                    const newRoutine = {
                        id: Date.now() + Math.random(),
                        member: profileName,
                        period: period,
                        title: title,
                        icon: emoji,
                        completed: false,
                        stars: stars,
                        repeat: repeatData
                    };
                    
                    routines.push(newRoutine);
                } else {
                    // CHORE CREATION
                    const hasDate = document.getElementById('taskChoreDate').checked;
                    const hasTime = document.getElementById('taskChoreTime').checked;
                    const hasRepeat = document.getElementById('taskChoreRepeatToggle').checked;
                    
                    const choreData = {
                        id: Date.now() + Math.random(),
                        member: profileName,
                        title: title,
                        icon: emoji,
                        completed: false,
                        stars: stars,
                        dueDate: hasDate ? document.getElementById('taskChoreDateValue').value : null,
                        time: hasTime ? document.getElementById('taskChoreTimeValue').value : null
                    };
                    
                    if (hasRepeat) {
                        const repeatEvery = parseInt(document.getElementById('choreRepeatEvery').value) || 1;
                        const repeatUnit = selectedChoreRepeatUnit;
                        const repeatDays = repeatUnit === 'week' ? [...selectedChoreDays] : null;
                        const hasUntil = document.getElementById('choreRepeatsUntil').checked;
                        const repeatUntil = hasUntil ? document.getElementById('choreRepeatsUntilDate').value : null;
                        
                        choreData.repeat = {
                            every: repeatEvery,
                            unit: repeatUnit,
                            days: repeatDays,
                            until: repeatUntil
                        };
                        
                        choreData.frequency = `Every ${repeatEvery} ${repeatUnit}${repeatEvery > 1 ? 's' : ''}`;
                    } else {
                        choreData.frequency = 'Once';
                    }
                    
                    chores.push(choreData);
                }
            });
            
            localStorage.setItem('chores', JSON.stringify(chores));
            localStorage.setItem('routines', JSON.stringify(routines));
            
            // Reset form
            document.getElementById('taskChoreTitle').value = '';
            document.getElementById('taskChoreEmoji').value = '';
            document.getElementById('taskChoreEmojiDisplay').textContent = '';
            document.getElementById('taskStars').value = '';
            selectedProfiles = [];
            selectedDays = [4]; // Reset to Thursday
            selectedChoreDays = [];
            selectedRepeatUnit = 'week';
            selectedChoreRepeatUnit = 'day';
            selectedTimeOfDay = 'evening';
            
            // Reset chore toggles
            document.getElementById('taskChoreDate').checked = false;
            document.getElementById('taskChoreDateValue').style.display = 'none';
            document.getElementById('taskChoreTime').checked = false;
            document.getElementById('taskChoreTimeValue').style.display = 'none';
            document.getElementById('taskChoreRepeatToggle').checked = false;
            document.getElementById('taskChoreRepeatDetails').style.display = 'none';
            document.getElementById('choreRepeatsUntil').checked = false;
            document.getElementById('choreRepeatsUntilDate').style.display = 'none';
            
            // Reset routine day buttons
            document.querySelectorAll('#taskRepeatDays .day-btn-new').forEach(btn => {
                btn.classList.remove('active');
            });
            const thursdayBtn = document.querySelector('#taskRepeatDays .day-btn-new[data-day="4"]');
            if (thursdayBtn) thursdayBtn.classList.add('active');
            
            // Reset chore day buttons
            document.querySelectorAll('#choreRepeatDays .day-btn-new').forEach(btn => {
                btn.classList.remove('active');
            });
            
            closeModal('taskChoreModal');
            renderChoresView();
        }
        
        function getFrequencyText() {
            const every = document.getElementById('taskRepeatEvery').value;
            const unit = document.getElementById('taskRepeatUnit').value;
            return `Every ${every} ${unit}${every > 1 ? 's' : ''}`;
        }
        
        // Toggle repeat details when repeat checkbox is changed
        document.addEventListener('DOMContentLoaded', function() {
            const repeatToggle = document.getElementById('taskChoreRepeatToggle');
            if (repeatToggle) {
                repeatToggle.addEventListener('change', function() {
                    document.getElementById('taskRepeatDetails').style.display = this.checked ? 'block' : 'none';
                });
            }
        });
        
        // Edit and Detail Modal Functions
        let currentEditTaskId = null;
        let currentEditTaskType = null;
        
        function openTaskDetail(taskId, taskType, event) {
            if (event) event.stopPropagation();
            
            currentEditTaskId = taskId;
            currentEditTaskType = taskType;
            
            const task = taskType === 'chore' ? chores.find(c => c.id === taskId) : routines.find(r => r.id === taskId);
            if (!task) return;
            
            // Populate detail modal
            document.getElementById('detailTaskTitle').textContent = task.title;
            
            // Format date/time
            if (task.dueDate || task.time) {
                const dateText = task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Any day';
                const timeText = task.time ? `, ${task.time}` : '';
                document.getElementById('detailDateText').textContent = dateText + timeText;
            } else {
                document.getElementById('detailDateText').textContent = 'No specific date';
            }
            
            // Show repeat info if applicable
            if (task.frequency && taskType === 'chore') {
                document.getElementById('detailTaskRepeat').style.display = 'flex';
                document.getElementById('detailRepeatText').textContent = task.frequency;
            } else {
                document.getElementById('detailTaskRepeat').style.display = 'none';
            }
            
            // Show assigned member
            const member = familyMembers.find(m => m.name === task.member);
            const assignedHtml = member ? 
                `<div class="task-detail-avatar" style="background: ${member.color}">${member.name.charAt(0).toUpperCase()}</div>
                 <span>${member.name}</span>` : 
                '<span>Unassigned</span>';
            document.getElementById('detailAssignedTo').innerHTML = assignedHtml;
            
            // Update complete button
            const completeBtn = document.getElementById('detailCompleteBtn');
            if (member) {
                completeBtn.style.background = member.color;
            }
            completeBtn.textContent = task.completed ? 'Mark as Incomplete' : 'Mark as Complete';
            
            document.getElementById('taskDetailModal').classList.add('active');
        }
        
        function toggleCurrentTask() {
            if (currentEditTaskType === 'chore') {
                toggleChore(currentEditTaskId);
            } else {
                toggleRoutine(currentEditTaskId);
            }
            closeModal('taskDetailModal');
        }
        
        function deleteCurrentTask() {
            const task = currentEditTaskType === 'chore' ? 
                chores.find(c => c.id === currentEditTaskId) : 
                routines.find(r => r.id === currentEditTaskId);
            
            if (!task) return;
            
            // Check if task has repeat data
            const hasRepeat = task.repeat && (task.repeat.every || task.frequency !== 'Once');
            
            // Show different options based on whether task repeats
            const deleteCurrentBtn = document.getElementById('deleteCurrentBtn');
            const deleteFutureBtn = document.getElementById('deleteFutureBtn');
            const deleteAllBtn = document.getElementById('deleteAllBtn');
            
            if (hasRepeat) {
                // Show all three options for repeating tasks
                deleteCurrentBtn.style.display = 'block';
                deleteFutureBtn.style.display = 'block';
                deleteAllBtn.style.display = 'block';
                deleteCurrentBtn.textContent = 'Delete this task only';
                deleteFutureBtn.textContent = 'Delete all future tasks';
                deleteAllBtn.textContent = 'Delete all tasks';
            } else {
                // Only show "delete all" for non-repeating tasks
                deleteCurrentBtn.style.display = 'none';
                deleteFutureBtn.style.display = 'none';
                deleteAllBtn.style.display = 'block';
                deleteAllBtn.textContent = 'Delete this task';
            }
            
            // Show modal
            document.getElementById('deleteOptionsOverlay').classList.add('active');
            document.getElementById('deleteOptionsModal').classList.add('active');
        }
        
        function closeDeleteOptions() {
            document.getElementById('deleteOptionsOverlay').classList.remove('active');
            document.getElementById('deleteOptionsModal').classList.remove('active');
        }
        
        function confirmDelete(option) {
            if (currentEditTaskType === 'chore') {
                const index = chores.findIndex(c => c.id === currentEditTaskId);
                if (index > -1) {
                    if (option === 'all' || !chores[index].repeat) {
                        // Delete the entire task
                        chores.splice(index, 1);
                    } else if (option === 'current') {
                        // For now, just mark this instance as deleted
                        // TODO: Implement proper instance tracking
                        chores.splice(index, 1);
                    } else if (option === 'future') {
                        // Delete the task (future instances won't be generated)
                        chores.splice(index, 1);
                    }
                    localStorage.setItem('chores', JSON.stringify(chores));
                }
            } else {
                const index = routines.findIndex(r => r.id === currentEditTaskId);
                if (index > -1) {
                    if (option === 'all' || !routines[index].repeat) {
                        // Delete the entire routine
                        routines.splice(index, 1);
                    } else if (option === 'future') {
                        // Delete the routine (future instances won't be generated)
                        routines.splice(index, 1);
                    }
                    localStorage.setItem('routines', JSON.stringify(routines));
                }
            }
            
            closeDeleteOptions();
            closeModal('taskDetailModal');
            closeEditPanel();
            renderChoresView();
        }
        
        function openEditPanelFromDetail() {
            closeModal('taskDetailModal');
            openEditPanel();
        }
        
        function openEditPanel() {
            const task = currentEditTaskType === 'chore' ? 
                chores.find(c => c.id === currentEditTaskId) : 
                routines.find(r => r.id === currentEditTaskId);
            
            if (!task) return;
            
            // Populate edit form
            document.getElementById('editTaskTitle').value = task.title || '';
            document.getElementById('editTaskEmoji').value = task.icon || '';
            document.getElementById('editTaskDate').value = task.dueDate || '';
            document.getElementById('editTaskTime').value = task.time || '';
            document.getElementById('editTaskStars').value = task.stars || 5;
            
            // Set toggles
            document.getElementById('editTaskDateToggle').checked = !!task.dueDate;
            document.getElementById('editTaskTimeToggle').checked = !!task.time;
            updateEditDateVisibility();
            updateEditTimeVisibility();
            
            // Set task type
            setEditTaskType(currentEditTaskType);
            
            // Render profile grid with current member selected
            renderEditProfileGrid(task.member);
            
            // Initialize emoji picker for edit panel
            initializeEditEmojiPicker();
            
            // Show panel
            document.getElementById('editPanelOverlay').classList.add('active');
            document.getElementById('editSidePanel').classList.add('active');
        }
        
        function closeEditPanel() {
            document.getElementById('editPanelOverlay').classList.remove('active');
            document.getElementById('editSidePanel').classList.remove('active');
        }
        
        function renderEditProfileGrid(selectedMember) {
            const grid = document.getElementById('editProfileGrid');
            const choreMembers = familyMembers.filter(m => !m.isGoogleCalendar);
            
            let html = '';
            choreMembers.forEach(member => {
                const isSelected = member.name === selectedMember;
                html += `<div class="edit-profile-item" onclick="selectEditProfile('${member.name}')">
                    <div class="edit-profile-avatar ${isSelected ? 'selected' : ''}" style="background: ${member.color}; box-shadow: 0 0 0 5px ${member.color}80" data-member="${member.name}">
                        ${member.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="edit-profile-name">${member.name}</div>
                </div>`;
            });
            
            grid.innerHTML = html;
        }
        
        function selectEditProfile(memberName) {
            document.querySelectorAll('.edit-profile-avatar').forEach(avatar => {
                avatar.classList.remove('selected');
            });
            document.querySelector(`.edit-profile-avatar[data-member="${memberName}"]`).classList.add('selected');
        }
        
        function setEditTaskType(type) {
            currentEditTaskType = type;
            document.getElementById('editChoreTypeBtn').classList.toggle('active', type === 'chore');
            document.getElementById('editRoutineTypeBtn').classList.toggle('active', type === 'routine');
        }
        
        function updateEditDateVisibility() {
            const checked = document.getElementById('editTaskDateToggle').checked;
            document.getElementById('editTaskDate').style.display = checked ? 'block' : 'none';
        }
        
        function updateEditTimeVisibility() {
            const checked = document.getElementById('editTaskTimeToggle').checked;
            document.getElementById('editTaskTime').style.display = checked ? 'block' : 'none';
        }
        
        function initializeEditEmojiPicker() {
            const grid = document.getElementById('editEmojiPickerGrid');
            if (grid.innerHTML) return; // Already initialized
            
            const emojiData = document.getElementById('emojiPickerGrid').innerHTML;
            grid.innerHTML = emojiData.replace(/onclick="selectEmoji/g, 'onclick="selectEditEmoji');
            
            // Parse emojis with Twemoji after populating
            if (typeof twemoji !== 'undefined') {
                twemoji.parse(grid, {
                    folder: 'svg',
                    ext: '.svg'
                });
            }
        }
        
        function toggleEditEmojiPicker(event) {
            event.stopPropagation();
            const dropdown = document.getElementById('editEmojiPickerDropdown');
            dropdown.classList.toggle('active');
        }
        
        function filterEditEmojis() {
            const searchTerm = document.getElementById('editEmojiSearchInput').value.toLowerCase();
            const emojiItems = document.querySelectorAll('#editEmojiPickerGrid .emoji-picker-item');
            
            emojiItems.forEach(item => {
                const keywords = item.getAttribute('data-keywords');
                if (keywords && (keywords.includes(searchTerm) || searchTerm === '')) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        }
        
        function selectEditEmoji(emoji) {
            document.getElementById('editTaskEmoji').value = emoji;
            document.getElementById('editEmojiPickerDropdown').classList.remove('active');
        }
        
        function saveEditedTask() {
            const title = document.getElementById('editTaskTitle').value;
            const emoji = document.getElementById('editTaskEmoji').value;
            const date = document.getElementById('editTaskDate').value;
            const time = document.getElementById('editTaskTime').value;
            const stars = parseInt(document.getElementById('editTaskStars').value) || 0;
            const hasDate = document.getElementById('editTaskDateToggle').checked;
            const hasTime = document.getElementById('editTaskTimeToggle').checked;
            
            const selectedAvatar = document.querySelector('.edit-profile-avatar.selected');
            const member = selectedAvatar ? selectedAvatar.getAttribute('data-member') : null;
            
            if (!title || !member) {
                alert('Please enter a title and select a profile');
                return;
            }
            
            if (currentEditTaskType === 'chore') {
                const chore = chores.find(c => c.id === currentEditTaskId);
                if (chore) {
                    chore.title = title;
                    chore.icon = emoji;
                    chore.member = member;
                    chore.dueDate = hasDate ? date : null;
                    chore.time = hasTime ? time : null;
                    chore.stars = stars;
                    localStorage.setItem('chores', JSON.stringify(chores));
                }
            } else {
                const routine = routines.find(r => r.id === currentEditTaskId);
                if (routine) {
                    routine.title = title;
                    routine.icon = emoji;
                    routine.member = member;
                    routine.stars = stars;
                    
                    // Determine period based on time if available
                    if (hasTime && time) {
                        const hour = parseInt(time.split(':')[0]);
                        if (hour >= 12 && hour < 18) routine.period = 'Afternoon';
                        else if (hour >= 18) routine.period = 'Evening';
                        else routine.period = 'Morning';
                    }
                    
                    localStorage.setItem('routines', JSON.stringify(routines));
                }
            }
            
            closeEditPanel();
            renderChoresView();
        }
        
        window.toggleChore = function toggleChore(choreId) {
            console.log('toggleChore called with ID:', choreId);
            console.log('toggleChore function type:', typeof toggleChore);
            // Convert to number since IDs are timestamps
            const numericId = typeof choreId === 'string' ? parseInt(choreId) : choreId;
            const chore = chores.find(c => c.id === numericId);
            console.log('Found chore:', chore);
            if (chore) {
                const wasCompleted = chore.completed;
                chore.completed = !chore.completed;
                if (chore.completed) {
                    chore.completedDate = new Date().toISOString().split('T')[0];
                } else {
                    delete chore.completedDate;
                }
                localStorage.setItem('chores', JSON.stringify(chores));
                
                // Check if member completed all their chores
                if (!wasCompleted && chore.completed) {
                    checkAllTasksComplete(chore.member);
                }
                
                renderChoresView();
                // Update family pills if on calendar view
                if (currentSection === 'calendar') {
                    renderFamilyPills();
                }
            }
        };
        
        console.log('window.toggleChore exposed:', typeof window.toggleChore);
        
function checkAllTasksComplete(memberName) {
    // 1. Check Chores
    const memberChores = chores.filter(c => c.member === memberName);
    const completedChores = memberChores.filter(c => c.completed);
    // Only celebrate if they HAVE chores and ALL are finished
    const allChoresComplete = memberChores.length > 0 && 
                              memberChores.length === completedChores.length;

    // 2. Check Routines
    const memberRoutines = routines.filter(r => r.member === memberName);
    const completedRoutines = memberRoutines.filter(r => r.completed);
    // Only celebrate if they HAVE routines and ALL are finished
    const allRoutinesComplete = memberRoutines.length > 0 && 
                                memberRoutines.length === completedRoutines.length;

    // Trigger confetti only if a non-empty section was just finished
    if (allChoresComplete || allRoutinesComplete) {
        triggerConfetti();
    }
}
        
        function triggerConfetti() {
            // Create confetti container
            const container = document.createElement('div');
            container.className = 'confetti-container';
            document.body.appendChild(container);
            
            const colors = ['#FF6B6B', '#4ECDC4', '#D9B554', '#DDC2F0', '#95E1D3', '#F38181', '#AA96DA', '#4A90E2'];
            const confettiCount = 40;
            
            for (let i = 0; i < confettiCount; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.width = (Math.random() * 8 + 6) + 'px';
                confetti.style.height = (Math.random() * 8 + 6) + 'px';
                confetti.style.animationDelay = (Math.random() * 0.3) + 's';
                confetti.style.animationDuration = (Math.random() * 1.5 + 2.5) + 's';
                confetti.style.animationName = 'confetti-fall';
                confetti.style.animationTimingFunction = 'linear';
                confetti.style.animationFillMode = 'forwards';
                
                container.appendChild(confetti);
            }
            
            // Remove container after animation
            setTimeout(() => {
                if (container.parentNode) {
                    container.remove();
                }
            }, 5000);
        }
        
        function triggerStarConfetti() {
            // Create star container
            const container = document.createElement('div');
            container.className = 'confetti-container';
            document.body.appendChild(container);
            
            const starColors = ['#FFD700', '#FFA500', '#FFDF00', '#FFE55C', '#FFC107', '#FFEB3B'];
            const starCount = 25;
            const starEmojis = ['⭐', '✨', '🌟', '💫'];
            
            // Get center of screen
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            
            for (let i = 0; i < starCount; i++) {
                const star = document.createElement('div');
                star.className = 'star-confetti';
                star.textContent = starEmojis[Math.floor(Math.random() * starEmojis.length)];
                
                // Position at center
                star.style.left = centerX + 'px';
                star.style.top = centerY + 'px';
                
                // Random explosion direction and distance
                const angle = (Math.random() * 360) * (Math.PI / 180);
                const distance = Math.random() * 400 + 200; // 200-600px
                const tx = Math.cos(angle) * distance;
                const ty = Math.sin(angle) * distance;
                
                star.style.setProperty('--tx', tx + 'px');
                star.style.setProperty('--ty', ty + 'px');
                
                star.style.color = starColors[Math.floor(Math.random() * starColors.length)];
                star.style.fontSize = (Math.random() * 15 + 15) + 'px';
                star.style.animationDelay = (Math.random() * 0.2) + 's';
                star.style.animationDuration = (Math.random() * 1 + 1.5) + 's';
                star.style.animationName = 'star-explode';
                star.style.animationTimingFunction = 'ease-out';
                star.style.animationFillMode = 'forwards';
                
                container.appendChild(star);
            }
            
            // Remove container after animation
            setTimeout(() => {
                if (container.parentNode) {
                    container.remove();
                }
            }, 3000);
        }

        function switchView(view) {
            currentView = view;
            
            // Update dropdown
            const dropdown = document.getElementById('mainViewSelector');
            if (dropdown) dropdown.value = view;
            
            // Hide all views
            document.getElementById('calendarGrid').style.display = 'none';
            document.getElementById('weekView').classList.remove('active');
            document.getElementById('scheduleView').classList.remove('active');
            document.getElementById('dayView').classList.remove('active');
            
            // Show floating add button for all calendar views
            document.getElementById('floatingAddBtn').classList.add('active');
            
            // Show selected view
            if (view === 'month') {
                document.getElementById('calendarGrid').style.display = 'grid';
                renderCalendar();
            } else if (view === 'week') {
                document.getElementById('weekView').classList.add('active');
                renderWeekView();
            } else if (view === 'schedule') {
                document.getElementById('scheduleView').classList.add('active');
                renderScheduleView();
            } else if (view === 'day') {
                document.getElementById('dayView').classList.add('active');
                renderDayView();
            }
            
            updateViewHeader();
        }

        function switchViewFromDropdown(view) {
            switchView(view);
        }

        function goToToday() {
            if (currentSection === 'meals') {
                goToMealToday();
            } else {
                currentDate = new Date();
                if (currentView === 'month') renderCalendar();
                else if (currentView === 'week') renderWeekView();
                else if (currentView === 'schedule') renderScheduleView();
                else if (currentView === 'day') renderDayView();
                updateViewHeader();
            }
        }

        function navigateDay(direction) {
            if (currentSection === 'meals') {
                navigateMealWeek(direction);
            } else {
                currentDate.setDate(currentDate.getDate() + direction);
                if (currentView === 'day') renderDayView();
                updateViewHeader();
            }
        }

        function updateEventTimeVisibility() {
            const isAllDay = document.getElementById('eventAllDayToggle').checked;
            const timeSection = document.getElementById('eventTimeSection');
            if (timeSection) {
                timeSection.style.display = isAllDay ? 'none' : 'block';
            }
        }
        
        function openEventModal() {
            console.log('📅 Opening event modal...');
            selectedEventProfile = ''; // Reset selection
            selectedEventProfiles = []; // Reset array
            document.getElementById('eventPanelOverlay').classList.add('active');
            document.getElementById('eventModal').classList.add('active');
            document.getElementById('eventDate').valueAsDate = new Date();
            updateEventTimeVisibility();
            renderEventProfileGrid();
            
            // Initialize repeat options
            selectedRepeatFrequency = 'weekly';
            selectedRepeatEndType = 'on';
            setTimeout(() => {
                // Set default active states
                const weeklyItem = document.querySelector('[data-repeat="weekly"]');
                if (weeklyItem) weeklyItem.classList.add('active');
                
                const onDateItem = document.querySelector('[data-endtype="on"]');
                if (onDateItem) onDateItem.classList.add('active');
            }, 100);
        }
        
        function openEventModalForCurrentDay() {
            // Open event modal with today's date
            openEventModal();
        }
        
        // Expose globally
        window.openEventModalForCurrentDay = openEventModalForCurrentDay;
        
        function openEventModalForDate(dateStr) {
            selectedEventProfile = ''; // Reset selection
            selectedEventProfiles = []; // Reset array
            document.getElementById('eventPanelOverlay').classList.add('active');
            document.getElementById('eventModal').classList.add('active');
            document.getElementById('eventDate').valueAsDate = new Date(dateStr + 'T12:00:00');
            updateEventTimeVisibility();
            renderEventProfileGrid();
            
            // Initialize repeat options
            selectedRepeatFrequency = 'weekly';
            selectedRepeatEndType = 'on';
            setTimeout(() => {
                // Set default active states
                const weeklyItem = document.querySelector('[data-repeat="weekly"]');
                if (weeklyItem) weeklyItem.classList.add('active');
                
                const onDateItem = document.querySelector('[data-endtype="on"]');
                if (onDateItem) onDateItem.classList.add('active');
            }, 100);
        }

        function openTaskModal() {
            document.getElementById('taskModal').classList.add('active');
            document.getElementById('taskDate').valueAsDate = new Date();
        }

        function openMealModal() {
            document.getElementById('mealModal').classList.add('active');
            document.getElementById('mealDate').valueAsDate = new Date();
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
            // Also close panel overlays
            if (modalId === 'taskChoreModal') {
                document.getElementById('taskChorePanelOverlay').classList.remove('active');
            }
            if (modalId === 'eventModal') {
                document.getElementById('eventPanelOverlay').classList.remove('active');
            }
        }
        
        function handleModalBackdropClick(event, modalId) {
            // Only close if clicking the backdrop (not the modal content)
            if (event.target.classList.contains('modal') || 
                event.target.classList.contains('task-detail-modal')) {
                closeModal(modalId);
            }
        }

        function autoAssignEventMember(title) {
            console.log('Auto-assigning for title:', title);
            
            // Check if title contains any family member's name
            const lowerTitle = title.toLowerCase();
            
            // Custom keyword matching
            const keywords = {
                'Bret': ['josh', 'danny', 'mens', 'men\'s']
            };
            
            // First check custom keywords
            for (let memberName in keywords) {
                const memberKeywords = keywords[memberName];
                for (let keyword of memberKeywords) {
                    if (lowerTitle.includes(keyword)) {
                        return memberName;
                    }
                }
            }
            
            // Then check for family member names
            for (let member of familyMembers) {
                const lowerName = member.name.toLowerCase();
                
                // Check for exact name match (with word boundaries)
                const nameRegex = new RegExp(`\\b${lowerName}\\b`, 'i');
                if (nameRegex.test(title)) {
                    return member.name;
                }
                
                // Check for possessive forms like "Mary's" or "Bret's"
                if (lowerTitle.includes(lowerName + "'s") || lowerTitle.includes(lowerName + "s")) {
                    return member.name;
                }
            }
            
            // No match found, return empty string (unassigned)
            return '';
        }
        
        let selectedRepeatFrequency = 'weekly';
        let selectedRepeatEndType = 'on';
        
        function toggleRepeatSection() {
            const toggle = document.getElementById('eventRepeatToggle');
            const section = document.getElementById('repeatOptionsSection');
            const untilToggle = document.getElementById('eventRepeatUntilToggle');
            
            if (toggle.checked) {
                section.style.display = 'block';
                // Enable the until toggle
                untilToggle.disabled = false;
                untilToggle.parentElement.parentElement.style.opacity = '1';
            } else {
                section.style.display = 'none';
                // Disable and hide the until toggle
                untilToggle.disabled = true;
                untilToggle.checked = false;
                untilToggle.parentElement.parentElement.style.opacity = '0.5';
                document.getElementById('repeatUntilSection').style.display = 'none';
            }
        }
        
        function toggleRepeatUntilSection() {
            const toggle = document.getElementById('eventRepeatUntilToggle');
            const section = document.getElementById('repeatUntilSection');
            
            if (toggle.checked) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        }
        
        function selectRepeatFrequency(frequency) {
            selectedRepeatFrequency = frequency;
            
            // Remove active class from all frequency items
            document.querySelectorAll('[data-repeat]').forEach(item => {
                item.classList.remove('active');
            });
            
            // Add active class to selected item
            document.querySelector(`[data-repeat="${frequency}"]`).classList.add('active');
        }
        
        function selectRepeatEndType(endType) {
            selectedRepeatEndType = endType;
            
            // Remove active class from all end type items
            document.querySelectorAll('[data-endtype]').forEach(item => {
                item.classList.remove('active');
            });
            
            // Add active class to selected item
            document.querySelector(`[data-endtype="${endType}"]`).classList.add('active');
            
            // Show/hide appropriate input
            const endDateGroup = document.getElementById('repeatEndDateGroup');
            const countGroup = document.getElementById('repeatCountGroup');
            
            endDateGroup.style.display = 'none';
            countGroup.style.display = 'none';
            
            if (endType === 'on') {
                endDateGroup.style.display = 'block';
            } else if (endType === 'after') {
                countGroup.style.display = 'block';
            }
        }
        
        function generateRecurringEvents(baseEvent) {
            const events = [];
            const repeatToggle = document.getElementById('eventRepeatToggle');
            
            if (!repeatToggle || !repeatToggle.checked) {
                return [baseEvent];
            }
            
            const repeatType = selectedRepeatFrequency;
            const untilToggle = document.getElementById('eventRepeatUntilToggle');
            const hasEndCondition = untilToggle && untilToggle.checked;
            const endType = hasEndCondition ? selectedRepeatEndType : 'never';
            const repeatEndDate = document.getElementById('repeatEndDate').value;
            const repeatCount = parseInt(document.getElementById('repeatCount').value) || 10;
            
            const startDate = new Date(baseEvent.date);
            let currentDate = new Date(startDate);
            let count = 0;
            const maxIterations = hasEndCondition && endType === 'after' ? repeatCount : 365;
            
            while (count < maxIterations) {
                // Create event for current date
                const event = Object.assign({}, baseEvent, {
                    id: Date.now() + count,
                    date: currentDate.toISOString().split('T')[0],
                    recurringId: baseEvent.id,
                    recurringIndex: count
                });
                
                // If there's an end date for the event itself, update it
                if (baseEvent.endDate) {
                    const daysDiff = Math.floor((new Date(baseEvent.endDate) - startDate) / (1000 * 60 * 60 * 24));
                    const newEndDate = new Date(currentDate);
                    newEndDate.setDate(newEndDate.getDate() + daysDiff);
                    event.endDate = newEndDate.toISOString().split('T')[0];
                }
                
                events.push(event);
                
                // Check if we've reached the end date
                if (hasEndCondition && endType === 'on' && repeatEndDate) {
                    if (currentDate >= new Date(repeatEndDate)) {
                        break;
                    }
                }
                
                // Move to next occurrence
                switch (repeatType) {
                    case 'daily':
                        currentDate.setDate(currentDate.getDate() + 1);
                        break;
                    case 'weekly':
                        currentDate.setDate(currentDate.getDate() + 7);
                        break;
                    case 'monthly':
                        currentDate.setMonth(currentDate.getMonth() + 1);
                        break;
                    case 'yearly':
                        currentDate.setFullYear(currentDate.getFullYear() + 1);
                        break;
                }
                
                count++;
            }
            
            return events;
        }
        
        async function saveEvent() {
            // If we're editing an existing event, route to updateEvent instead
            if (window._editingEventId) {
                var editId = window._editingEventId;
                window._editingEventId = null;
                updateEvent(editId);
                return;
            }

            const isAllDay = document.getElementById('eventAllDayToggle').checked;
            const title = document.getElementById('eventTitle').value;
            
            if (!title.trim()) {
                alert('Please enter an event title.');
                return;
            }
            
            const baseEvent = {
                id: Date.now(),
                title: title,
                date: document.getElementById('eventDate').value,
                endDate: document.getElementById('eventEndDate').value,
                time: isAllDay ? '' : document.getElementById('eventTime').value,
                endTime: isAllDay ? '' : document.getElementById('eventEndTime').value,
                notes: document.getElementById('eventNotes').value,
                isAllDay: isAllDay,
                member: selectedEventProfiles.length > 0 ? selectedEventProfiles[0] : (selectedEventProfile || '')
            };
            
            // Generate recurring events (returns [baseEvent] if no repeat)
            const newEvents = generateRecurringEvents(baseEvent);
            
            // Save all events to localStorage
            for (const ev of newEvents) {
                events.push(ev);
            }
            localStorage.setItem('events', JSON.stringify(events));
            window.events = events; // Keep window reference in sync
            
            // Also create in Google Calendar if connected
            if (typeof GoogleCalendar !== 'undefined' && GoogleCalendar.isConnected()) {
                await GoogleCalendar.create(baseEvent);
            }
            
            closeModal('eventModal');
            
            // Re-render current view
            if (currentView === 'month') renderCalendar();
            else if (currentView === 'week') renderWeekView();
            else if (currentView === 'schedule') renderScheduleView();
            else if (currentView === 'day') renderDayView();
            
            // Clear form
            document.getElementById('eventTitle').value = '';
            document.getElementById('eventEndDate').value = '';
            document.getElementById('eventTime').value = '';
            document.getElementById('eventEndTime').value = '';
            document.getElementById('eventNotes').value = '';
            document.getElementById('eventAllDayToggle').checked = true;
            document.getElementById('eventRepeatToggle').checked = false;
            document.getElementById('eventRepeatUntilToggle').checked = false;
            document.getElementById('repeatOptionsSection').style.display = 'none';
            document.getElementById('repeatUntilSection').style.display = 'none';
            selectedEventProfile = '';
            selectedEventProfiles = [];
            selectedRepeatFrequency = 'weekly';
            selectedRepeatEndType = 'on';
            window._editingEventId = null;
            var saveBtn = document.getElementById('eventSaveBtn');
            if (saveBtn) saveBtn.textContent = 'Add Event';
            
            // Reset active states
            document.querySelectorAll('[data-repeat]').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelectorAll('[data-endtype]').forEach(item => {
                item.classList.remove('active');
            });
        }

        function saveTask() {
            const task = {
                id: Date.now(),
                title: document.getElementById('taskTitle').value,
                date: document.getElementById('taskDate').value,
                member: document.getElementById('taskMember').value,
                completed: false
            };
            tasks.push(task);
            localStorage.setItem('tasks', JSON.stringify(tasks));
            closeModal('taskModal');
            renderTasks();
            renderAllTasks();
            // Update family pills if on calendar view
            if (currentSection === 'calendar') {
                renderFamilyPills();
            }
            document.getElementById('taskTitle').value = '';
        }
        
        // Show event details panel
        function showEventDetails(eventId) {
            // Try local events first
            let event = (window.events || []).find(e => e.id == eventId);
            
            // Fall back to Google Calendar events
            if (!event && typeof GoogleCalendar !== 'undefined') {
                const googleEvents = GoogleCalendar.getEvents();
                event = googleEvents.find(e => e.id == eventId);
            }
            
            if (!event) {
                console.log('Event not found:', eventId);
                return;
            }
            
            // Store current event ID for editing/deleting
            window.currentEventDetailId = eventId;
            
            // Populate panel with event details
            document.getElementById('eventDetailTitle').textContent = event.title || 'Untitled';
            
            // Format date and time
            let dateTimeText = '';
            if (event.start && event.start.dateTime) {
                const start = new Date(event.start.dateTime);
                const end = event.end ? new Date(event.end.dateTime) : start;
                
                dateTimeText = start.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
                
                if (!event.allDay) {
                    const startTime = start.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit' 
                    });
                    const endTime = end.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit' 
                    });
                    dateTimeText += ` ${startTime} - ${endTime}`;
                }
            } else if (event.start && event.start.date) {
                const start = new Date(event.start.date + 'T00:00:00');
                dateTimeText = start.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                }) + ' (All day)';
            }
            
            // Handle local event format (event.date / event.time)
            if (!dateTimeText && event.date) {
                var d = new Date(event.date + 'T12:00:00');
                dateTimeText = d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                if (event.time) {
                    var parts = event.time.split(':');
                    var h = parseInt(parts[0]);
                    var m = parts[1];
                    var ampm = h >= 12 ? 'PM' : 'AM';
                    h = h % 12 || 12;
                    dateTimeText += ' at ' + h + ':' + m + ' ' + ampm;
                }
            }

            document.getElementById('eventDetailDateTime').textContent = dateTimeText;

            // Show notes if present
            var notesEl = document.getElementById('eventDetailNotes');
            var notesRow = document.getElementById('eventDetailNotesRow');
            if (notesEl) {
                var notes = event.notes || (event.description) || '';
                notesEl.textContent = notes || 'No notes';
                if (notesRow) notesRow.style.display = notes ? 'block' : 'none';
            }

            // Show the panel
            document.getElementById('eventDetailPanel').classList.add('active');
            document.getElementById('eventDetailPanelOverlay').classList.add('active');
        }
        
        function closeEventDetailPanel() {
            document.getElementById('eventDetailPanel').classList.remove('active');
            document.getElementById('eventDetailPanelOverlay').classList.remove('active');
            window.currentEventDetailId = null;
        }
        
        // Expose globally
        window.closeEventDetailPanel = closeEventDetailPanel;

        function editEventFromDetail() {
            const eventId = window.currentEventDetailId;
            if (!eventId) return;

            // Find the event in local or Google Calendar
            let event = (window.events || []).find(e => e.id == eventId);
            if (!event && typeof GoogleCalendar !== 'undefined') {
                event = GoogleCalendar.getEvents().find(e => e.id == eventId);
            }
            if (!event) return;

            // Close detail panel
            closeEventDetailPanel();

            // Normalise event fields — handle both local format and Google Calendar format
            var evDate = event.date || '';
            var evEndDate = event.endDate || '';
            var evTime = event.time || '';
            var evEndTime = event.endTime || '';
            var evNotes = event.notes || event.description || '';
            var evIsAllDay = event.isAllDay;

            if (!evDate && event.start) {
                if (event.start.dateTime) {
                    var sd = new Date(event.start.dateTime);
                    evDate = sd.toISOString().split('T')[0];
                    evTime = sd.toTimeString().slice(0, 5);
                    evIsAllDay = false;
                } else if (event.start.date) {
                    evDate = event.start.date;
                    evIsAllDay = true;
                }
            }
            if (!evEndDate && event.end) {
                if (event.end.dateTime) {
                    var ed = new Date(event.end.dateTime);
                    evEndDate = ed.toISOString().split('T')[0];
                    evEndTime = ed.toTimeString().slice(0, 5);
                } else if (event.end.date) {
                    evEndDate = event.end.date;
                }
            }
            if (evIsAllDay === undefined) evIsAllDay = !evTime;

            // Populate event modal with existing data
            document.getElementById('eventTitle').value = event.title || event.summary || '';
            document.getElementById('eventDate').value = evDate;
            document.getElementById('eventEndDate').value = evEndDate;
            document.getElementById('eventNotes').value = evNotes;

            document.getElementById('eventAllDayToggle').checked = evIsAllDay;
            if (!evIsAllDay) {
                document.getElementById('eventTime').value = evTime;
                document.getElementById('eventEndTime').value = evEndTime;
            }
            updateEventTimeVisibility();

            // Set member selection
            selectedEventProfile = event.member || '';
            selectedEventProfiles = event.member ? [event.member] : [];
            renderEventProfileGrid();

            // Open modal
            document.getElementById('eventPanelOverlay').classList.add('active');
            document.getElementById('eventModal').classList.add('active');

            // Signal to saveEvent that we're in edit mode
            window._editingEventId = eventId;
            const saveBtn = document.getElementById('eventSaveBtn');
            if (saveBtn) saveBtn.textContent = 'Save Changes';
        }
        window.editEventFromDetail = editEventFromDetail;
        
        // Update event
        function updateEvent(eventId) {
            var isAllDay = document.getElementById('eventAllDayToggle').checked;
            
            var eventData = {
                title: document.getElementById('eventTitle').value,
                date: document.getElementById('eventDate').value,
                endDate: document.getElementById('eventEndDate').value,
                time: isAllDay ? '' : document.getElementById('eventTime').value,
                endTime: isAllDay ? '' : document.getElementById('eventEndTime').value,
                notes: document.getElementById('eventNotes').value,
                isAllDay: isAllDay,
                member: selectedEventProfiles.length > 0 ? selectedEventProfiles[0] : (selectedEventProfile || '')
            };
            
            // Update local events synchronously
            var localIdx = -1;
            for (var i = 0; i < events.length; i++) {
                if (events[i].id == eventId) { localIdx = i; break; }
            }
            if (localIdx !== -1) {
                events[localIdx] = Object.assign({}, events[localIdx], eventData);
                localStorage.setItem('events', JSON.stringify(events));
                window.events = events;
            }

            // Clear edit flag and reset button BEFORE closing modal
            window._editingEventId = null;
            var saveBtn = document.getElementById('eventSaveBtn');
            if (saveBtn) saveBtn.textContent = 'Add Event';

            closeModal('eventModal');

            // Re-render current view
            if (currentView === 'month') renderCalendar();
            else if (currentView === 'week') renderWeekView();
            else if (currentView === 'schedule') renderScheduleView();
            else if (currentView === 'day') renderDayView();

            // Fire-and-forget Google Calendar update (handles GCal events)
            if (typeof GoogleCalendar !== 'undefined' && GoogleCalendar.isConnected()) {
                GoogleCalendar.update(eventId, eventData).catch(function() {});
            }
        }
        
        // Delete event from detail panel
            async function deleteEventFromDetail() {
                const eventId = window.currentEventDetailId;
                if (!eventId) return;
                
                const event = GoogleCalendar.getEvents().find(e => e.id == eventId);
                if (!event) return;
                
                if (!confirm(`Delete "${event.title}"?`)) return;
                
                // Delete from Google Calendar
                await GoogleCalendar.delete(eventId);
                
                closeEventDetailPanel();
            }
            
            // Re-render current view
            if (currentView === 'month') renderCalendar();
            else if (currentView === 'week') renderWeekView();
            else if (currentView === 'schedule') renderScheduleView();
            else if (currentView === 'day') renderDayView();


        function saveMeal() {
            const meal = {
                id: Date.now(),
                date: document.getElementById('mealDate').value,
                name: document.getElementById('mealName').value
            };
            meals.push(meal);
            localStorage.setItem('meals', JSON.stringify(meals));
            closeModal('mealModal');
            renderMeals();
            document.getElementById('mealName').value = '';
        }
        
        function handleFloatingAdd() {
            if (currentSection === 'rewards') {
                openRewardModal();
            } else if (currentSection === 'lists') {
                openAddListItemPanel();
            } else if (currentSection === 'recipes') {
                openAddRecipePanel();
            } else {
                openTaskChoreModal();
            }
        }
        
        function openRewardModal() {
            document.getElementById('rewardModal').classList.add('active');
            renderRewardProfileGrid();
            initializeRewardEmojiPicker();
        }
        
        function renderRewardProfileGrid() {
            const grid = document.getElementById('rewardProfileGrid');
            const rewardMembers = familyMembers.filter(m => !m.isGoogleCalendar);
            
            let html = '';
            rewardMembers.forEach(member => {
                html += `<div class="task-profile-item" onclick="selectRewardProfile('${member.name}')">
                    <div class="task-profile-avatar" id="reward-avatar-${member.name}" style="background: ${member.color}; box-shadow: 0 0 0 5px ${member.color}80">
                        ${member.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="task-profile-name">${member.name}</div>
                </div>`;
            });
            
            grid.innerHTML = html;
        }
        
        let selectedRewardProfile = null;
        
        function selectRewardProfile(profileName) {
            selectedRewardProfile = profileName;
            // Update visual selection
            document.querySelectorAll('#rewardProfileGrid .task-profile-avatar').forEach(avatar => {
                avatar.classList.remove('selected');
            });
            document.getElementById(`reward-avatar-${profileName}`).classList.add('selected');
        }
        
        function initializeRewardEmojiPicker() {
            const emojiData = [
                { emoji: '🧸', keywords: 'teddy bear toy stuffed' },
                { emoji: '🎮', keywords: 'game controller video game' },
                { emoji: '🍿', keywords: 'popcorn movie snack' },
                { emoji: '🎬', keywords: 'movie film cinema' },
                { emoji: '🏖️', keywords: 'beach vacation sand' },
                { emoji: '⛱️', keywords: 'umbrella beach' },
                { emoji: '🎡', keywords: 'ferris wheel fair carnival' },
                { emoji: '🎢', keywords: 'roller coaster amusement park' },
                { emoji: '🎪', keywords: 'circus tent' },
                { emoji: '🎨', keywords: 'art paint palette' },
                { emoji: '🛍️', keywords: 'shopping bags mall' },
                { emoji: '👗', keywords: 'dress clothes shopping' },
                { emoji: '👟', keywords: 'shoes sneaker' },
                { emoji: '🍕', keywords: 'pizza food' },
                { emoji: '🍔', keywords: 'burger hamburger food' },
                { emoji: '🍦', keywords: 'ice cream dessert' },
                { emoji: '🍰', keywords: 'cake dessert birthday' },
                { emoji: '🍩', keywords: 'donut doughnut dessert' },
                { emoji: '🍪', keywords: 'cookie dessert' },
                { emoji: '🎁', keywords: 'gift present' },
                { emoji: '🎈', keywords: 'balloon party' },
                { emoji: '🎉', keywords: 'party celebration' },
                { emoji: '✨', keywords: 'sparkle shine' },
                { emoji: '⭐', keywords: 'star' },
                { emoji: '🌟', keywords: 'glowing star' },
                { emoji: '💎', keywords: 'gem diamond' },
                { emoji: '👑', keywords: 'crown king queen' },
                { emoji: '🏆', keywords: 'trophy award winner' },
                { emoji: '🥇', keywords: 'gold medal first place' },
                { emoji: '🎯', keywords: 'target goal' },
                { emoji: '🚗', keywords: 'car vehicle' },
                { emoji: '🚲', keywords: 'bike bicycle' },
                { emoji: '🛴', keywords: 'scooter kick' },
                { emoji: '⚽', keywords: 'soccer ball sports' },
                { emoji: '🏀', keywords: 'basketball sports' },
                { emoji: '⚾', keywords: 'baseball sports' },
                { emoji: '🏈', keywords: 'football sports' },
                { emoji: '🎾', keywords: 'tennis sports' },
                { emoji: '🏐', keywords: 'volleyball sports' },
                { emoji: '🏊', keywords: 'swimming pool' },
                { emoji: '🎣', keywords: 'fishing' },
                { emoji: '⛳', keywords: 'golf flag' },
                { emoji: '🎳', keywords: 'bowling' },
                { emoji: '🎯', keywords: 'dart target' },
                { emoji: '🎲', keywords: 'dice game' },
                { emoji: '🧩', keywords: 'puzzle piece' },
                { emoji: '🪁', keywords: 'kite flying' },
                { emoji: '🎸', keywords: 'guitar music' },
                { emoji: '🎹', keywords: 'piano keyboard music' },
                { emoji: '🎤', keywords: 'microphone singing karaoke' },
                { emoji: '🎧', keywords: 'headphones music' },
                { emoji: '📱', keywords: 'phone mobile' },
                { emoji: '💻', keywords: 'laptop computer' },
                { emoji: '🖥️', keywords: 'desktop computer' },
                { emoji: '📚', keywords: 'books reading' },
                { emoji: '📖', keywords: 'book reading' },
                { emoji: '🥤', keywords: 'drink soda cup' },
                { emoji: '🧃', keywords: 'juice box drink' },
                { emoji: '💰', keywords: 'money bag cash' },
                { emoji: '💵', keywords: 'dollar money cash' }
            ];
            
            const grid = document.getElementById('rewardEmojiPickerGrid');
            grid.innerHTML = emojiData.map(item => 
                `<div class="emoji-picker-item" data-keywords="${item.keywords}" onclick="selectRewardEmoji('${item.emoji}')">${item.emoji}</div>`
            ).join('');
            
            // Parse emojis with Twemoji after populating
            if (typeof twemoji !== 'undefined') {
                twemoji.parse(grid, {
                    folder: 'svg',
                    ext: '.svg'
                });
            }
        }
        
        function toggleRewardEmojiPicker(event) {
            event.stopPropagation();
            const dropdown = document.getElementById('rewardEmojiPickerDropdown');
            const searchInput = document.getElementById('rewardEmojiSearchInput');
            
            dropdown.classList.toggle('active');
            
            if (dropdown.classList.contains('active')) {
                searchInput.value = '';
                filterRewardEmojis();
                setTimeout(() => searchInput.focus(), 100);
                
                setTimeout(() => {
                    document.addEventListener('click', closeRewardEmojiPicker);
                }, 0);
            }
        }
        
        function closeRewardEmojiPicker() {
            const dropdown = document.getElementById('rewardEmojiPickerDropdown');
            dropdown.classList.remove('active');
            document.removeEventListener('click', closeRewardEmojiPicker);
        }
        
        function selectRewardEmoji(emoji) {
            document.getElementById('rewardEmoji').value = emoji;
            const display = document.getElementById('rewardEmojiDisplay');
            display.textContent = emoji;
            closeRewardEmojiPicker();
            
            // Parse the emoji with Twemoji
            if (typeof twemoji !== 'undefined') {
                twemoji.parse(display, {
                    folder: 'svg',
                    ext: '.svg'
                });
            }
        }
        
        function filterRewardEmojis() {
            const searchTerm = document.getElementById('rewardEmojiSearchInput').value.toLowerCase();
            const emojiItems = document.querySelectorAll('#rewardEmojiPickerGrid .emoji-picker-item');
            
            emojiItems.forEach(item => {
                const keywords = item.getAttribute('data-keywords');
                if (keywords.includes(searchTerm) || searchTerm === '') {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        }
        
        function saveReward() {
            const title = document.getElementById('rewardTitle').value;
            const emoji = document.getElementById('rewardEmoji').value;
            const stars = parseInt(document.getElementById('rewardStars').value) || 25;
            
            if (!title || !selectedRewardProfile) {
                alert('Please enter a title and select a profile');
                return;
            }
            
            const newReward = {
                id: Date.now(),
                member: selectedRewardProfile,
                title: title,
                emoji: emoji || '🎁',
                starsNeeded: stars,
                redeemed: false
            };
            
            rewards.push(newReward);
            localStorage.setItem('rewards', JSON.stringify(rewards));
            
            // Reset form
            document.getElementById('rewardTitle').value = '';
            document.getElementById('rewardEmoji').value = '';
            document.getElementById('rewardStars').value = '25';
            selectedRewardProfile = null;
            
            closeModal('rewardModal');
            renderRewardsView();
        }


        function renderTasks() {
            const today = new Date().toISOString().split('T')[0];
            const todayTasks = tasks.filter(t => t.date === today);
            const list = document.getElementById('taskList');
            
            if (todayTasks.length === 0) {
                list.innerHTML = '<li style="padding: 10px; color: #999;">No tasks for today</li>';
                return;
            }

            list.innerHTML = todayTasks.map(task => {
                const member = familyMembers.find(m => m.name === task.member);
                return `
                    <li class="task-item ${task.completed ? 'completed' : ''}" style="border-left: 4px solid ${(member && member.color) || getFamilyColor()}">
                        <input type="checkbox" ${task.completed ? 'checked' : ''} 
                               onchange="toggleTask(${task.id})">
                        <span>${task.title} ${task.member ? `(${task.member})` : ''}</span>
                    </li>
                `;
            }).join('');
        }

        function toggleTask(id) {
            const task = tasks.find(t => t.id === id);
            if (task) {
                task.completed = !task.completed;
                localStorage.setItem('tasks', JSON.stringify(tasks));
                renderTasks();
                renderAllTasks();
                // Update family pills if on calendar view
                if (currentSection === 'calendar') {
                    renderFamilyPills();
                }
            }
        }

        function renderMeals() {
            const today = new Date();
            const weekMeals = [];
            
            for (let i = 0; i < 7; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                const dateStr = date.toISOString().split('T')[0];
                const meal = meals.find(m => m.date === dateStr);
                weekMeals.push({
                    day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    date: dateStr,
                    meal: (meal && meal.name) || 'No meal planned'
                });
            }

            document.getElementById('mealPlan').innerHTML = weekMeals.map(m => `
                <div class="meal-day">
                    <div class="meal-day-name">${m.day}</div>
                    <div>${m.meal}</div>
                </div>
            `).join('');
        }

        let currentDayModalDate = null;
        
        function showDayEvents(dateStr) {
            currentDayModalDate = dateStr;
            const allEvents = getAllEvents();
            const dayEvents = allEvents.filter(e => isEventOnDate(e, dateStr) && isEventVisible(e)).sort((a, b) => {
                if (!a.time) return -1;
                if (!b.time) return 1;
                return a.time.localeCompare(b.time);
            });
            
            // Format the date for display
            const date = new Date(dateStr + 'T12:00:00');
            const monthName = date.toLocaleDateString('en-US', { month: 'long' });
            const dayNum = date.getDate();
            
            // Update modal header
            document.getElementById('dayEventsDate').textContent = `${monthName} ${dayNum}`;
            document.getElementById('dayEventsCount').textContent = `${dayEvents.length} event${dayEvents.length !== 1 ? 's' : ''}`;
            
            // Build events list
            const listContainer = document.getElementById('dayEventsList');
            
            if (dayEvents.length === 0) {
                listContainer.innerHTML = '<div style="text-align: center; color: #999; padding: 40px; font-style: italic;">No events for this day</div>';
            } else {
                let html = '';
                dayEvents.forEach(event => {
                    const member = getEventMember(event);
                    const color = getEventColor(event);
                    
                    // Format time
                    let timeStr = '';
                    if (event.time) {
                        const [hours, minutes] = event.time.split(':').map(Number);
                        const period = hours >= 12 ? 'PM' : 'AM';
                        const displayHours = hours % 12 || 12;
                        timeStr = `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
                    } else {
                        timeStr = 'All day';
                    }
                    
                    const initial = member ? member.name.charAt(0).toUpperCase() : '';
                    
                    html += `<div class="schedule-event" style="background-color: ${hexToRgba(color, 0.25)}; border-left-color: ${color}; margin-bottom: 15px;" onclick="showEventDetails('${event.id}'); closeDayEventsModal();">
                        <div class="schedule-event-content">
                            <div class="schedule-event-time" style="color: ${color}">${timeStr}</div>
                            <div class="schedule-event-title">${event.title}</div>
                            ${event.member ? `<div class="schedule-event-member">${event.member}</div>` : ''}
                        </div>
                        ${initial ? `<div class="schedule-event-dot" style="background: ${color}">${initial}</div>` : ''}
                    </div>`;
                });
                listContainer.innerHTML = html;
            }
            
            // Show modal
            document.getElementById('dayEventsModal').classList.add('active');
        }
        
        function closeDayEventsModal() {
            document.getElementById('dayEventsModal').classList.remove('active');
            currentDayModalDate = null;
        }
        
        function addEventFromDayModal() {
            if (currentDayModalDate) {
                closeDayEventsModal();
                openEventModalForDate(currentDayModalDate);
            }
        }

        // Update current time indicator every minute
        function updateCurrentTimeIndicator() {
            if (currentView !== 'week') return;
            
            const indicator = document.querySelector('.current-time-indicator');
            if (!indicator) return;
            
            const now = new Date();
            const startHour = 7;
            const endHour = 21;
            const currentHour = now.getHours();
            const currentMinutes = now.getMinutes();
            
            if (currentHour >= startHour && currentHour < endHour) {
                const totalMinutesFromStart = (currentHour - startHour) * 60 + currentMinutes;
                const totalMinutesInRange = (endHour - startHour) * 60;
                const topPercent = (totalMinutesFromStart / totalMinutesInRange) * 100;
                
                indicator.style.top = topPercent + '%';
            }
        }
        
        // Update time indicator every minute
        setInterval(updateCurrentTimeIndicator, 60000);

        init();
        
        // Convert all emojis to images using Twemoji
        if (typeof twemoji !== 'undefined') {
            // Parse the entire page on load
            document.addEventListener('DOMContentLoaded', function() {
                twemoji.parse(document.body, {
                    folder: 'svg',
                    ext: '.svg'
                });
            });
            
            // Also parse when new content is added dynamically
            // Monitor DOM changes and re-parse
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1) { // Element node
                            twemoji.parse(node, {
                                folder: 'svg',
                                ext: '.svg'
                            });
                        }
                    });
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

       // Auto-fullscreen when page loads
  /*       function enterFullscreen() {
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen().catch(err => {
                    console.log('Fullscreen request failed:', err);
                });
            } else if (elem.webkitRequestFullscreen) { // Safari
                elem.webkitRequestFullscreen();
            } else if (elem.mozRequestFullScreen) { // Firefox
                elem.mozRequestFullScreen();
            } else if (elem.msRequestFullscreen) { // IE/Edge
                elem.msRequestFullscreen();
            }
        }
        
        // Try to enter fullscreen after page loads
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(enterFullscreen, 500);
        });
        
        // Re-enter fullscreen if user exits
        document.addEventListener('fullscreenchange', function() {
            if (!document.fullscreenElement) {
                setTimeout(enterFullscreen, 1000);
            }
        });
        
        // Also allow manual fullscreen trigger on first touch/click
        let hasInteracted = false;
        document.addEventListener('click', function() {
            if (!hasInteracted) {
                hasInteracted = true;
                enterFullscreen();
            }
        }, { once: true });
/*
/*
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAgEyHTkAE_4-Ua8uPHs8uUtRm8C6eDNi4",
  authDomain: "skylight-d1c07.firebaseapp.com",
  projectId: "skylight-d1c07",
  storageBucket: "skylight-d1c07.firebasestorage.app",
  messagingSenderId: "812789085658",
  appId: "1:812789085658:web:e9f3860a26e9e4ff3d3ce3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
*/

// Clock Picker Variables
let currentClockMode = 'hour'; // 'hour' or 'minute'
let selectedHour = new Date().getHours() % 12 || 12;
let selectedMinute = new Date().getMinutes();
let selectedPeriod = new Date().getHours() >= 12 ? 'PM' : 'AM';
let currentTimeInputId = null;

function openClockPicker(inputId) {
    currentTimeInputId = inputId;
    const input = document.getElementById(inputId);
    
    // Set to current time if input is empty
    if (!input.value) {
        const now = new Date();
        selectedHour = now.getHours() % 12 || 12;
        selectedMinute = now.getMinutes();
        selectedPeriod = now.getHours() >= 12 ? 'PM' : 'AM';
    } else {
        // Parse existing time
        const time = input.value;
        const [hours, minutes] = time.split(':').map(Number);
        selectedHour = hours % 12 || 12;
        selectedMinute = minutes;
        selectedPeriod = hours >= 12 ? 'PM' : 'AM';
    }
    
    currentClockMode = 'hour';
    renderClockFace();
    updateClockDisplay();
    updateClockPeriod();
    
    document.getElementById('clockPickerModal').classList.add('active');
}

function closeClockPicker() {
    document.getElementById('clockPickerModal').classList.remove('active');
}

function confirmClockTime() {
    if (!currentTimeInputId) return;
    
    // Convert to 24-hour format
    let hour24 = selectedHour;
    if (selectedPeriod === 'PM' && selectedHour !== 12) {
        hour24 += 12;
    } else if (selectedPeriod === 'AM' && selectedHour === 12) {
        hour24 = 0;
    }
    
    const timeString = `${String(hour24).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
    document.getElementById(currentTimeInputId).value = timeString;
    
    closeClockPicker();
}

function setClockPeriod(period) {
    selectedPeriod = period;
    updateClockPeriod();
}

function updateClockPeriod() {
    document.getElementById('clockAM').classList.toggle('active', selectedPeriod === 'AM');
    document.getElementById('clockPM').classList.toggle('active', selectedPeriod === 'PM');
}

function renderClockFace() {
    const face = document.getElementById('clockFace');
    const numbersContainer = face.querySelector('.clock-numbers') || document.createElement('div');
    numbersContainer.className = 'clock-numbers';
    numbersContainer.innerHTML = '';
    
    const numbers = currentClockMode === 'hour' ? 
        [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] : 
        [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    
    numbers.forEach((num, index) => {
        const angle = (index * 30) - 90; // Start at top (12 o'clock)
        const radius = 110; // Distance from center
        const x = Math.cos(angle * Math.PI / 180) * radius;
        const y = Math.sin(angle * Math.PI / 180) * radius;
        
        const numberEl = document.createElement('div');
        numberEl.className = 'clock-number';
        if (currentClockMode === 'hour' && num === selectedHour) {
            numberEl.classList.add('selected');
        } else if (currentClockMode === 'minute' && num === selectedMinute) {
            numberEl.classList.add('selected');
        }
        numberEl.textContent = num;
        numberEl.style.left = `calc(50% + ${x}px - 20px)`;
        numberEl.style.top = `calc(50% + ${y}px - 20px)`;
        numberEl.onclick = () => selectClockNumber(num);
        
        numbersContainer.appendChild(numberEl);
    });
    
    if (!face.querySelector('.clock-numbers')) {
        face.appendChild(numbersContainer);
    }
    
    updateClockHand();
}

function selectClockNumber(num) {
    if (currentClockMode === 'hour') {
        selectedHour = num;
        // Switch to minute selection
        currentClockMode = 'minute';
        renderClockFace();
    } else {
        selectedMinute = num;
    }
    updateClockDisplay();
    updateClockHand();
}

function updateClockDisplay() {
    const display = document.getElementById('clockTimeDisplay');
    const hourStr = String(selectedHour).padStart(2, '0');
    const minuteStr = String(selectedMinute).padStart(2, '0');
    display.textContent = `${hourStr}:${minuteStr}`;
}

function updateClockHand() {
    const hand = document.getElementById('clockHand');
    let angle;
    
    if (currentClockMode === 'hour') {
        // Hour hand: 12 positions, 30 degrees each
        angle = (selectedHour % 12) * 30;
    } else {
        // Minute hand: 60 positions, 6 degrees each
        angle = selectedMinute * 6;
    }
    
    hand.style.transform = `translate(-50%, -100%) rotate(${angle}deg)`;
}

// Make time inputs readonly and open clock picker on click
document.addEventListener('DOMContentLoaded', function() {
    // Add click handlers to time inputs
    setTimeout(() => {
        const timeInputs = [
            'taskChoreTime',
            'editTaskTime',
            'eventTime',
            'eventEndTime'
        ];
        
        timeInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.readOnly = true;
                input.style.cursor = 'pointer';
                input.addEventListener('click', function() {
                    // Check if the input is visible and enabled
                    if (this.style.display !== 'none' && !this.disabled) {
                        openClockPicker(inputId);
                    }
                });
            }
        });
    }, 500);
});

// Handle hash changes for desktop navigation
window.addEventListener('hashchange', function() {
    if (window.innerWidth > 768) {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#/')) {
            const section = hash.substring(2);
            switchSection(section);
        }
    }
});
