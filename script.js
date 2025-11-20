// Global Variables
let items = [];
let editingItemId = null;
let activityLogs = [];
let currentUser = '';
let isAdmin = false;
let systemUsers = [];
let deletingUserId = null;

// Initialize System on Load
window.addEventListener('DOMContentLoaded', function() {
    initializeSystem();
    updateDateTime();
    setInterval(updateDateTime, 60000);
    loadItems();
    loadLogs();
    updateLastUpdate();
});

// System Initialization
function initializeSystem() {
    loadSystemUsers();
    
    // Check if already logged in
    const loggedInUser = sessionStorage.getItem('pmesLoggedInUser');
    const userIsAdmin = sessionStorage.getItem('pmesIsAdmin') === 'true';
    
    if (loggedInUser) {
        currentUser = loggedInUser;
        isAdmin = userIsAdmin;
        document.getElementById('currentUsername').textContent = currentUser;
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('mainSystem').style.display = 'block';
        
        // Show admin panel button and logs section if admin
        if (isAdmin) {
            document.getElementById('adminPanelBtn').style.display = 'inline-block';
            document.getElementById('logsSection').style.display = 'block';
        } else {
            document.getElementById('adminPanelBtn').style.display = 'none';
            document.getElementById('logsSection').style.display = 'none';
        }
    } else {
        showLoginScreen();
    }
}

// User Management
function loadSystemUsers() {
    const stored = localStorage.getItem('pmesSystemUsers');
    if (stored) {
        systemUsers = JSON.parse(stored);
    } else {
        // Initialize with default admin account
        systemUsers = [{
            username: 'admin',
            password: 'admin123',
            fullName: 'System Administrator',
            isAdmin: true,
            createdAt: new Date().toISOString()
        }];
        saveSystemUsers();
    }
}

function saveSystemUsers() {
    localStorage.setItem('pmesSystemUsers', JSON.stringify(systemUsers));
}

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainSystem').style.display = 'none';
}

function attemptLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    const user = systemUsers.find(u => u.username === username && u.password === password);

    if (user) {
        currentUser = user.fullName;
        isAdmin = user.isAdmin;
        sessionStorage.setItem('pmesLoggedInUser', currentUser);
        sessionStorage.setItem('pmesIsAdmin', isAdmin);
        
        document.getElementById('currentUsername').textContent = currentUser;
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('mainSystem').style.display = 'block';
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('loginError').style.display = 'none';
        
        // Show admin panel button and logs section only if admin
        if (isAdmin) {
            document.getElementById('adminPanelBtn').style.display = 'inline-block';
            document.getElementById('logsSection').style.display = 'block';
        } else {
            document.getElementById('adminPanelBtn').style.display = 'none';
            document.getElementById('logsSection').style.display = 'none';
        }
        
        addLog('login', `${currentUser} logged in to the system`);
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        addLog('logout', `${currentUser} logged out of the system`);
        sessionStorage.removeItem('pmesLoggedInUser');
        sessionStorage.removeItem('pmesIsAdmin');
        currentUser = '';
        isAdmin = false;
        showLoginScreen();
    }
}

// Activity Logging
function addLog(action, details, itemName = '') {
    const log = {
        id: Date.now(),
        username: currentUser,
        action: action,
        details: details,
        itemName: itemName,
        timestamp: new Date().toISOString()
    };
    activityLogs.unshift(log);
    saveLogs();
    
    // Only display logs if user is admin
    if (isAdmin) {
        displayLogs();
    }
}

function loadLogs() {
    const stored = localStorage.getItem('pmesActivityLogs');
    if (stored) {
        activityLogs = JSON.parse(stored);
    }
    
    // Only display logs if user is admin
    if (isAdmin) {
        displayLogs();
    }
}

function saveLogs() {
    localStorage.setItem('pmesActivityLogs', JSON.stringify(activityLogs));
}

function displayLogs() {
    // Only display logs if user is admin
    if (!isAdmin) {
        return;
    }
    
    const logsContainer = document.getElementById('logsContainer');
    
    if (activityLogs.length === 0) {
        logsContainer.innerHTML = `
            <div class="logs-empty">
                <div style="font-size: 2em; margin-bottom: 0.5rem;">📋</div>
                <div>No activity logs yet</div>
            </div>
        `;
        return;
    }

    logsContainer.innerHTML = activityLogs.map(log => {
        const date = new Date(log.timestamp);
        const formattedDate = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
        const formattedTime = date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        let actionClass = 'action-add';
        let actionLabel = 'ADD';
        if (log.action === 'edit') {
            actionClass = 'action-edit';
            actionLabel = 'EDIT';
        } else if (log.action === 'delete') {
            actionClass = 'action-delete';
            actionLabel = 'DELETE';
        } else if (log.action === 'system' || log.action === 'login' || log.action === 'logout') {
            actionClass = 'action-edit';
            actionLabel = 'SYSTEM';
        }

        return `
            <div class="log-entry">
                <div class="log-header">
                    <div class="log-user">
                        <span>👤</span> ${log.username}
                    </div>
                    <div class="log-timestamp">${formattedDate} at ${formattedTime}</div>
                </div>
                <div class="log-action">
                    <span class="log-action-type ${actionClass}">${actionLabel}</span>
                    ${log.details}
                </div>
            </div>
        `;
    }).join('');
}

function exportLogs() {
    // Only allow admins to export logs
    if (!isAdmin) {
        alert('Access denied. Only administrators can export logs.');
        return;
    }
    
    if (activityLogs.length === 0) {
        alert('No logs to export!');
        return;
    }

    const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    let htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>Activity Logs - Property Management System</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 30px; background: #f8f9fa; }
        .header { text-align: center; margin-bottom: 30px; padding: 20px; background: #1e3a5f; color: white; border-radius: 8px; }
        .header h1 { margin: 0 0 10px 0; }
        .header p { margin: 0; opacity: 0.9; }
        .log-container { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .log-entry { padding: 15px; border-bottom: 1px solid #e9ecef; }
        .log-entry:last-child { border-bottom: none; }
        .log-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .log-user { font-weight: bold; color: #1e3a5f; }
        .log-timestamp { color: #6c757d; font-size: 0.9em; }
        .log-action { color: #495057; }
        .action-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.85em; font-weight: bold; margin-right: 8px; }
        .badge-add { background: #d4edda; color: #155724; }
        .badge-edit { background: #fff3cd; color: #856404; }
        .badge-delete { background: #f8d7da; color: #721c24; }
        .badge-system { background: #d1ecf1; color: #0c5460; }
        @media print { body { background: white; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>Activity Logs Report</h1>
        <p>Cooperative Property Management System</p>
        <p>Generated on: ${currentDate}</p>
    </div>
    <div class="log-container">`;

    activityLogs.forEach(log => {
        const date = new Date(log.timestamp);
        const formattedDate = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
        const formattedTime = date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        let badgeClass = 'badge-add';
        let badgeLabel = 'ADD';
        if (log.action === 'edit') {
            badgeClass = 'badge-edit';
            badgeLabel = 'EDIT';
        } else if (log.action === 'delete') {
            badgeClass = 'badge-delete';
            badgeLabel = 'DELETE';
        } else if (log.action === 'system' || log.action === 'login' || log.action === 'logout') {
            badgeClass = 'badge-system';
            badgeLabel = 'SYSTEM';
        }

        htmlContent += `
        <div class="log-entry">
            <div class="log-header">
                <div class="log-user">👤 ${log.username}</div>
                <div class="log-timestamp">${formattedDate} at ${formattedTime}</div>
            </div>
            <div class="log-action">
                <span class="action-badge ${badgeClass}">${badgeLabel}</span>
                ${log.details}
            </div>
        </div>`;
    });

    htmlContent += `
    </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Activity_Logs_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Activity logs exported successfully!');
}

// Date and Time Functions
function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    document.getElementById('datetime').textContent = now.toLocaleDateString('en-US', options);
}

function updateLastUpdate() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('lastUpdate').textContent = timeString;
}

// Batch Number Functions
function generateBatchNumber() {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;
    
    const todayItems = items.filter(item => 
        item.batch && item.batch.startsWith(datePrefix)
    );
    
    let maxNumber = 0;
    todayItems.forEach(item => {
        const parts = item.batch.split('-');
        if (parts.length === 2) {
            const num = parseInt(parts[1]);
            if (!isNaN(num) && num > maxNumber) {
                maxNumber = num;
            }
        }
    });
    
    const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
    return `${datePrefix}-${nextNumber}`;
}

function showBatchDropdown() {
    const searchValue = document.getElementById('searchBatch').value.trim().toLowerCase();
    const dropdown = document.getElementById('batchDropdown');
    
    if (searchValue === '') {
        dropdown.classList.remove('active');
        return;
    }

    const matchingItems = items.filter(item => 
        item.batch && item.batch.toLowerCase().includes(searchValue)
    );

    if (matchingItems.length === 0) {
        dropdown.innerHTML = '<div class="dropdown-empty">No matching batch numbers found</div>';
        dropdown.classList.add('active');
        return;
    }

    dropdown.innerHTML = matchingItems.map(item => `
        <div class="dropdown-item" onclick="selectBatch('${item.batch}')">
            <div class="dropdown-batch">${item.batch}</div>
            <div class="dropdown-details">${item.name} - ${item.owner}</div>
        </div>
    `).join('');
    
    dropdown.classList.add('active');
}

function selectBatch(batch) {
    document.getElementById('searchBatch').value = batch;
    document.getElementById('batchDropdown').classList.remove('active');
}

function printBatchLabel() {
    const batchNumber = document.getElementById('searchBatch').value.trim();
    
    if (!batchNumber) {
        alert('Please enter a batch number to print!');
        return;
    }

    const item = items.find(i => i.batch && i.batch.toLowerCase() === batchNumber.toLowerCase());
    
    if (!item) {
        alert('No asset found with batch number: ' + batchNumber);
        return;
    }

    const printWindow = window.open('', '', 'width=800,height=600');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Batch Number Label - ${item.batch}</title>
            <style>
                @media print { body { margin: 0; } .no-print { display: none; } }
                body { font-family: Arial, sans-serif; padding: 20px; }
                .label-container { border: 3px solid #1e3a5f; padding: 30px; max-width: 600px; margin: 0 auto; border-radius: 10px; }
                .asset-info { margin: 20px 0; }
                .info-row { display: flex; padding: 12px; border-bottom: 1px solid #ddd; }
                .info-label { font-weight: bold; width: 150px; color: #1e3a5f; }
                .info-value { flex: 1; }
                .batch-highlight { background: #f8f9fa; padding: 20px; text-align: center; border: 2px dashed #1e3a5f; margin: 20px 0; border-radius: 5px; }
                .batch-number { font-size: 32px; font-weight: bold; color: #1e3a5f; letter-spacing: 2px; }
                .date-info { text-align: center; margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px; }
                .print-button { display: block; margin: 20px auto; padding: 12px 30px; background: #28a745; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; }
                .print-button:hover { background: #218838; }
            </style>
        </head>
        <body>
            <div class="label-container">
                <div class="asset-info">
                    <div class="info-row">
                        <div class="info-label">Asset Name:</div>
                        <div class="info-value">${item.name}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Assigned To:</div>
                        <div class="info-value">${item.owner}</div>
                    </div>
                    ${item.brand ? `<div class="info-row"><div class="info-label">Brand:</div><div class="info-value">${item.brand}</div></div>` : ''}
                    ${item.productSN ? `<div class="info-row"><div class="info-label">Product S/n:</div><div class="info-value">${item.productSN}</div></div>` : ''}
                </div>
                <div class="batch-highlight">
                    <div class="batch-number">B/N: ${item.batch}</div>
                </div>
                <div class="date-info">
                    ${item.purchaseDate ? `<strong>Purchase Date:</strong> ${item.purchaseDate}` : ''}
                </div>
            </div>
            <button class="print-button no-print" onclick="window.print()">🖨️ Print Label</button>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

function saveBatchToFile() {
    const batchNumber = document.getElementById('searchBatch').value.trim();
    
    if (!batchNumber) {
        alert('Please enter a batch number to save!');
        return;
    }

    const item = items.find(i => i.batch && i.batch.toLowerCase() === batchNumber.toLowerCase());
    
    if (!item) {
        alert('No asset found with batch number: ' + batchNumber);
        return;
    }

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>PMS - ${item.batch}</title>
    <style>
        @media print { body { margin: 0; } .no-print { display: none; } }
        body { font-family: Arial, sans-serif; padding: 20px; }
        .label-container { border: 3px solid #1e3a5f; padding: 30px; max-width: 600px; margin: 0 auto; border-radius: 10px; }
        .asset-info { margin: 20px 0; }
        .info-row { display: flex; padding: 12px; border-bottom: 1px solid #ddd; }
        .info-label { font-weight: bold; width: 150px; color: #1e3a5f; }
        .info-value { flex: 1; }
        .batch-highlight { background: #f8f9fa; padding: 20px; text-align: center; border: 2px dashed #1e3a5f; margin: 20px 0; border-radius: 5px; }
        .batch-number { font-size: 18px; font-weight: bold; color: #1e3a5f; letter-spacing: 1px; }
        .date-info { text-align: center; margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px; }
        .print-button { display: block; margin: 20px auto; padding: 12px 30px; background: #28a745; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; }
        .print-button:hover { background: #218838; }
    </style>
</head>
<body>
    <div class="label-container">
        <div class="asset-info">
            <div class="info-row">
                <div class="info-label">Asset Name:</div>
                <div class="info-value">${item.name}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Assigned To:</div>
                <div class="info-value">${item.owner}</div>
            </div>
            ${item.brand ? `<div class="info-row"><div class="info-label">Brand:</div><div class="info-value">${item.brand}</div></div>` : ''}
            ${item.productSN ? `<div class="info-row"><div class="info-label">Product S/n:</div><div class="info-value">${item.productSN}</div></div>` : ''}
        </div>
        <div class="batch-highlight">
            <div class="batch-number">B/N: ${item.batch}</div>
        </div>
        <div class="date-info">
            ${item.purchaseDate ? `<strong>Purchase Date:</strong> ${item.purchaseDate}` : ''}
        </div>
    </div>
    <button class="print-button no-print" onclick="window.print()">🖨️ Print Label</button>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Batch_Label_${item.batch}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Batch label file saved successfully!');
    document.getElementById('searchBatch').value = '';
}

// Item Management
function loadItems() {
    const stored = localStorage.getItem('pmesItems');
    if (stored) {
        items = JSON.parse(stored);
    }
    displayItems();
}

function saveItems() {
    localStorage.setItem('pmesItems', JSON.stringify(items));
    updateLastUpdate();
}

function addItem(e) {
    e.preventDefault();
    const itemName = document.getElementById('itemName').value.trim();
    const ownerName = document.getElementById('ownerName').value.trim();

    if (!itemName || !ownerName) {
        alert('Please fill in all required fields!');
        return;
    }

    const newItem = {
        id: Date.now(),
        name: itemName,
        owner: ownerName,
        brand: '',
        productSN: '',
        cpu: '',
        ram: '',
        storage: '',
        display: '',
        keyboard: '',
        batch: '',
        purchaseDate: '',
        notes: '',
        dateAdded: new Date().toISOString()
    };

    items.push(newItem);
    saveItems();
    displayItems();

    addLog('add', `Added new asset: ${itemName} assigned to ${ownerName}`, itemName);

    document.getElementById('itemName').value = '';
    document.getElementById('ownerName').value = '';
}

function deleteItem(id) {
    if (confirm('Are you sure you want to delete this asset from inventory?')) {
        const item = items.find(i => i.id === id);
        const itemName = item ? item.name : 'Unknown';
        
        items = items.filter(item => item.id !== id);
        saveItems();
        displayItems();
        
        addLog('delete', `Deleted asset: ${itemName}`, itemName);
    }
}

function displayItems() {
    const itemsList = document.getElementById('itemsList');
    const itemCount = document.getElementById('itemCount');
    
    itemCount.textContent = items.length;

    if (items.length === 0) {
        itemsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <div>No assets in inventory. Add your first asset to get started.</div>
            </div>
        `;
        return;
    }

    itemsList.innerHTML = items.map(item => {
        const specs = [];
        if (item.brand) specs.push(`Brand: ${item.brand}`);
        if (item.productSN) specs.push(`Product S/n: ${item.productSN}`);
        if (item.cpu) specs.push(`CPU: ${item.cpu}`);
        if (item.ram) specs.push(`RAM: ${item.ram}`);
        if (item.storage) specs.push(`Storage: ${item.storage}`);
        if (item.display) specs.push(`Display: ${item.display}`);
        if (item.keyboard) specs.push(`Keyboard: ${item.keyboard}`);
        if (item.batch) specs.push(`Batch Number: ${item.batch}`);
        if (item.purchaseDate) specs.push(`Purchase Date: ${item.purchaseDate}`);
        if (item.notes) specs.push(`Notes: ${item.notes}`);
        
        const detailsText = specs.length > 0 ? specs.join('\n') : '';
        
        return `
            <div class="inventory-item" onclick="openEditModal(${item.id})">
                <div class="item-header">
                    <div>
                        <div class="item-title">${item.name}</div>
                        <div class="item-owner">
                            <span>👤</span> ${item.owner}
                        </div>
                    </div>
                    <button class="btn-delete" onclick="event.stopPropagation(); deleteItem(${item.id})">
                        🗑️ Remove
                    </button>
                </div>
                ${detailsText ? 
                    `<div class="item-details">${detailsText}</div>` : 
                    `<div class="item-details empty">Click to add specifications and details</div>`
                }
            </div>
        `;
    }).join('');
}

// Modal Functions
function openEditModal(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;

    editingItemId = id;
    document.getElementById('editItemName').value = item.name;
    document.getElementById('editOwnerName').value = item.owner;
    document.getElementById('editBrand').value = item.brand || '';
    document.getElementById('editProductSN').value = item.productSN || '';
    document.getElementById('editCPU').value = item.cpu || '';
    document.getElementById('editRAM').value = item.ram || '';
    document.getElementById('editStorage').value = item.storage || '';
    document.getElementById('editDisplay').value = item.display || '';
    document.getElementById('editKeyboard').value = item.keyboard || '';
    document.getElementById('editBatch').value = item.batch || '';
    document.getElementById('editPurchaseDate').value = item.purchaseDate || '';
    document.getElementById('editNotes').value = item.notes || '';
    document.getElementById('editModal').classList.add('active');
}

function closeModal() {
    document.getElementById('editModal').classList.remove('active');
    editingItemId = null;
}

function saveEdit() {
    const item = items.find(i => i.id === editingItemId);
    if (!item) return;

    const newName = document.getElementById('editItemName').value.trim();
    const newOwner = document.getElementById('editOwnerName').value.trim();

    if (!newName || !newOwner) {
        alert('Asset name and assigned person are required!');
        return;
    }

    const changes = [];
    if (item.name !== newName) changes.push(`name from "${item.name}" to "${newName}"`);
    if (item.owner !== newOwner) changes.push(`owner from "${item.owner}" to "${newOwner}"`);

    item.name = newName;
    item.owner = newOwner;
    item.brand = document.getElementById('editBrand').value.trim();
    item.productSN = document.getElementById('editProductSN').value.trim();
    item.cpu = document.getElementById('editCPU').value.trim();
    item.ram = document.getElementById('editRAM').value.trim();
    item.storage = document.getElementById('editStorage').value.trim();
    item.display = document.getElementById('editDisplay').value.trim();
    item.keyboard = document.getElementById('editKeyboard').value.trim();
    item.batch = document.getElementById('editBatch').value.trim();
    item.purchaseDate = document.getElementById('editPurchaseDate').value;
    item.notes = document.getElementById('editNotes').value.trim();

    saveItems();
    displayItems();
    closeModal();

    if (changes.length > 0) {
        addLog('edit', `Updated asset "${newName}": ${changes.join(', ')}`, newName);
    } else {
        addLog('edit', `Updated specifications for asset: ${newName}`, newName);
    }
}

// Event Listeners
document.getElementById('editModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

document.getElementById('deleteUserModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeDeleteUserModal();
    }
});

document.addEventListener('click', function(e) {
    const searchBatch = document.getElementById('searchBatch');
    const dropdown = document.getElementById('batchDropdown');
    
    if (searchBatch && dropdown && e.target !== searchBatch && !dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
    }
});

// Admin Panel Functions
function openAdminPanel() {
    if (!isAdmin) {
        alert('Access denied. Admin privileges required.');
        return;
    }
    document.getElementById('mainSystem').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    displayUsers();
}

function closeAdminPanel() {
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('mainSystem').style.display = 'block';
    
    // Reload logs display if admin
    if (isAdmin) {
        displayLogs();
    }
}

function addNewUser(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('newUserFullName').value.trim();
    const username = document.getElementById('newUserUsername').value.trim();
    const password = document.getElementById('newUserPassword').value;
    const isAdminUser = document.getElementById('newUserIsAdmin').checked;
    
    // Validation
    if (!fullName || !username || !password) {
        alert('Please fill in all required fields!');
        return;
    }
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters long!');
        return;
    }
    
    // Check if username already exists
    const existingUser = systemUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existingUser) {
        alert('Username already exists! Please choose a different username.');
        return;
    }
    
    // Create new user
    const newUser = {
        id: Date.now(),
        username: username,
        password: password,
        fullName: fullName,
        isAdmin: isAdminUser,
        createdAt: new Date().toISOString(),
        createdBy: currentUser
    };
    
    systemUsers.push(newUser);
    saveSystemUsers();
    displayUsers();
    
    // Clear form
    document.getElementById('newUserFullName').value = '';
    document.getElementById('newUserUsername').value = '';
    document.getElementById('newUserPassword').value = '';
    document.getElementById('newUserIsAdmin').checked = false;
    
    // Log activity
    addLog('system', `Created new user account: ${username} (${fullName})${isAdminUser ? ' with admin privileges' : ''}`);
    
    alert(`User account created successfully!\n\nUsername: ${username}\nFull Name: ${fullName}\nRole: ${isAdminUser ? 'Administrator' : 'Regular User'}`);
}

function displayUsers() {
    const usersList = document.getElementById('usersList');
    const totalUsers = document.getElementById('totalUsers');
    const adminUsers = document.getElementById('adminUsers');
    const regularUsers = document.getElementById('regularUsers');
    
    // Update statistics
    totalUsers.textContent = systemUsers.length;
    adminUsers.textContent = systemUsers.filter(u => u.isAdmin).length;
    regularUsers.textContent = systemUsers.filter(u => !u.isAdmin).length;
    
    if (systemUsers.length === 0) {
        usersList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <div>No users registered yet.</div>
            </div>
        `;
        return;
    }
    
    // Sort users: admins first, then by creation date
    const sortedUsers = [...systemUsers].sort((a, b) => {
        if (a.isAdmin && !b.isAdmin) return -1;
        if (!a.isAdmin && b.isAdmin) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    usersList.innerHTML = sortedUsers.map(user => {
        const createdDate = new Date(user.createdAt);
        const formattedDate = createdDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        const isCurrentUser = user.username === systemUsers.find(u => u.fullName === currentUser)?.username;
        const isOnlyAdmin = user.isAdmin && systemUsers.filter(u => u.isAdmin).length === 1;
        
        return `
            <div class="user-card">
                <div class="user-card-header">
                    <div class="user-info">
                        <div class="user-full-name">${user.fullName}</div>
                        <div class="user-username">
                            <span>@${user.username}</span>
                        </div>
                    </div>
                    <div class="user-actions">
                        <span class="user-role ${user.isAdmin ? 'role-admin' : 'role-user'}">
                            ${user.isAdmin ? '⚙️ Admin' : '👤 User'}
                        </span>
                        <button 
                            class="btn-delete-user" 
                            onclick="openDeleteUserModal(${user.id})"
                            ${isCurrentUser || isOnlyAdmin ? 'disabled' : ''}
                            title="${isCurrentUser ? 'Cannot delete your own account' : isOnlyAdmin ? 'Cannot delete the only admin account' : 'Delete user'}"
                        >
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="user-meta">
                    Created on ${formattedDate}${user.createdBy ? ` by ${user.createdBy}` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function openDeleteUserModal(userId) {
    const user = systemUsers.find(u => u.id === userId);
    if (!user) return;
    
    deletingUserId = userId;
    document.getElementById('deleteUserName').textContent = `${user.fullName} (@${user.username})`;
    document.getElementById('deleteUserModal').classList.add('active');
}

function closeDeleteUserModal() {
    document.getElementById('deleteUserModal').classList.remove('active');
    deletingUserId = null;
}

function confirmDeleteUser() {
    if (!deletingUserId) return;
    
    const user = systemUsers.find(u => u.id === deletingUserId);
    if (!user) return;
    
    // Check if it's the only admin
    if (user.isAdmin && systemUsers.filter(u => u.isAdmin).length === 1) {
        alert('Cannot delete the only admin account!');
        closeDeleteUserModal();
        return;
    }
    
    // Check if trying to delete own account
    const currentUserObj = systemUsers.find(u => u.fullName === currentUser);
    if (currentUserObj && currentUserObj.id === deletingUserId) {
        alert('Cannot delete your own account!');
        closeDeleteUserModal();
        return;
    }
    
    // Delete the user
    systemUsers = systemUsers.filter(u => u.id !== deletingUserId);
    saveSystemUsers();
    displayUsers();
    
    // Log activity
    addLog('system', `Deleted user account: ${user.username} (${user.fullName})`);
    
    closeDeleteUserModal();
    alert('User account deleted successfully!');
}