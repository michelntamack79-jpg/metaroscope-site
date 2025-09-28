// Configuration Admin
const ADMIN_CONFIG = {
    PASSWORD: "RICHES8888888888888888",
    PRODUCTS_URL: "data/products.json",
    ANNOUNCEMENTS_URL: "data/announcements.json",
    GITHUB_API: "https://api.github.com",
    
    // Catégories disponibles
    CATEGORIES: ["ia", "marketing", "business", "tech", "finance", "santé", "lifestyle", "e-commerce", "crypto"]
};

// État de l'admin
let adminState = {
    isAuthenticated: false,
    products: [],
    announcements: [],
    githubConfig: {
        repo: "",
        token: "",
        branch: "main"
    }
};

// Initialisation de l'admin
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    loadAdminData();
    setupAdminEventListeners();
});

// Vérification de l'authentification
function checkAuthentication() {
    const savedAuth = localStorage.getItem('adminAuthenticated');
    const authTime = localStorage.getItem('adminAuthTime');
    
    if (savedAuth === 'true' && authTime) {
        const timeDiff = Date.now() - parseInt(authTime);
        // Session valide pendant 2 heures
        if (timeDiff < 2 * 60 * 60 * 1000) {
            adminState.isAuthenticated = true;
            showAdminInterface();
            return;
        }
    }
    
    showLoginScreen();
}

// Affichage de l'écran de connexion
function showLoginScreen() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('admin-interface').classList.add('hidden');
    
    // Gestion de la connexion
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    document.getElementById('admin-password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
}

// Gestion de la connexion
function handleLogin() {
    const password = document.getElementById('admin-password').value;
    const errorElement = document.getElementById('login-error');
    
    if (password === ADMIN_CONFIG.PASSWORD) {
        adminState.isAuthenticated = true;
        localStorage.setItem('adminAuthenticated', 'true');
        localStorage.setItem('adminAuthTime', Date.now().toString());
        showAdminInterface();
    } else {
        errorElement.classList.remove('hidden');
        errorElement.textContent = "Mot de passe incorrect";
    }
}

// Affichage de l'interface admin
function showAdminInterface() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('admin-interface').classList.remove('hidden');
    
    updateAdminStatus();
    displayProductsList();
    displayAnnouncementsList();
    updateStats();
}

// Chargement des données admin
async function loadAdminData() {
    try {
        const [productsResponse, announcementsResponse] = await Promise.all([
            fetch(ADMIN_CONFIG.PRODUCTS_URL),
            fetch(ADMIN_CONFIG.ANNOUNCEMENTS_URL)
        ]);
        
        if (productsResponse.ok) {
            const productsData = await productsResponse.json();
            adminState.products = productsData.products;
        }
        
        if (announcementsResponse.ok) {
            const announcementsData = await announcementsResponse.json();
            adminState.announcements = announcementsData.announcements;
        }
        
        // Charger la config GitHub
        const savedConfig = localStorage.getItem('githubConfig');
        if (savedConfig) {
            adminState.githubConfig = JSON.parse(savedConfig);
            document.getElementById('github-repo').value = adminState.githubConfig.repo || '';
            document.getElementById('github-token').value = adminState.githubConfig.token || '';
        }
        
    } catch (error) {
        console.error('Erreur chargement données admin:', error);
    }
}

// Configuration des écouteurs d'événements admin
function setupAdminEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const targetTab = e.target.dataset.tab;
            switchTab(targetTab);
        });
    });
    
    // Boutons produits
    document.getElementById('add-product-btn').addEventListener('click', () => showProductModal());
    document.getElementById('cancel-product-btn').addEventListener('click', () => hideProductModal());
    document.getElementById('product-form').addEventListener('submit', handleProductSubmit);
    
    // Boutons annonces
    document.getElementById('add-announcement-btn').addEventListener('click', () => showAnnouncementModal());
    document.getElementById('cancel-announcement-btn').addEventListener('click', () => hideAnnouncementModal());
    document.getElementById('announcement-form').addEventListener('submit', handleAnnouncementSubmit);
    
    // Filtres produits
    document.getElementById('product-type-filter').addEventListener('change', filterProductsList);
    document.getElementById('product-section-filter').addEventListener('change', filterProductsList);
    document.getElementById('product-search').addEventListener('input', debounce(filterProductsList, 300));
    
    // Export/Import
    document.getElementById('export-products-btn').addEventListener('click', exportProducts);
    document.getElementById('export-announcements-btn').addEventListener('click', exportAnnouncements);
    document.getElementById('import-file').addEventListener('change', handleImport);
    document.getElementById('save-github-btn').addEventListener('click', saveGitHubConfig);
    
    // Déconnexion
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Détection de catégorie
    document.getElementById('product-title').addEventListener('input', detectCategory);
    document.getElementById('product-description').addEventListener('input', detectCategory);
    document.getElementById('edit-category-btn').addEventListener('click', toggleCategoryEdit);
}

// Changement d'onglet
function switchTab(tabName) {
    // Masquer tous les onglets
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
        tab.classList.remove('active');
    });
    
    // Désactiver tous les boutons d'onglet
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Activer l'onglet sélectionné
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Activer le bouton d'onglet
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

// Affichage de la liste des produits
function displayProductsList(products = adminState.products) {
    const container = document.getElementById('products-list');
    container.innerHTML = '';
    
    if (products.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-8">
                <p class="text-gray-600">Aucun produit trouvé</p>
            </div>
        `;
        return;
    }
    
    products.forEach(product => {
        const productElement = createProductAdminCard(product);
        container.appendChild(productElement);
    });
}

// Création d'une carte produit pour l'admin
function createProductAdminCard(product) {
    const element = document.createElement('div');
    element.className = 'glass-card p-4';
    element.innerHTML = `
        <div class="flex justify-between items-start mb-3">
            <div class="flex items-center gap-3">
                <img src="${product.image}" alt="${product.title}" 
                     class="w-16 h-16 object-cover rounded">
                <div>
                    <h4 class="font-bold">${product.title}</h4>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="category-badge">${product.category}</span>
                        <span class="text-sm text-gray-600">${product.type}</span>
                        ${product.section === 'dollar' ? 
                            '<span class="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">1€</span>' : ''}
                    </div>
                </div>
            </div>
            <div class="flex gap-2">
                <button class="edit-product-btn" data-id="${product.id}">
                    <i class="fas fa-edit text-blue-600"></i>
                </button>
                <button class="delete-product-btn" data-id="${product.id}">
                    <i class="fas fa-trash text-red-600"></i>
                </button>
            </div>
        </div>
        <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
                <span class="text-gray-600">Prix:</span>
                <span class="font-bold ml-2">${product.price.eur}€</span>
            </div>
            <div>
                <span class="text-gray-600">Stock:</span>
                <span class="font-bold ml-2">${product.stock}</span>
            </div>
        </div>
    `;
    
    // Écouteurs d'événements
    element.querySelector('.edit-product-btn').addEventListener('click', () => editProduct(product.id));
    element.querySelector('.delete-product-btn').addEventListener('click', () => deleteProduct(product.id));
    
    return element;
}

// Filtrage des produits
function filterProductsList() {
    const typeFilter = document.getElementById('product-type-filter').value;
    const sectionFilter = document.getElementById('product-section-filter').value;
    const searchTerm = document.getElementById('product-search').value.toLowerCase();
    
    let filteredProducts = adminState.products;
    
    if (typeFilter !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.type === typeFilter);
    }
    
    if (sectionFilter !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.section === sectionFilter);
    }
    
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(p => 
            p.title.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm)
        );
    }
    
    displayProductsList(filteredProducts);
}

// Modal produit
function showProductModal(product = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('product-modal-title');
    
    if (product) {
        title.textContent = 'Modifier le produit';
        fillProductForm(product);
    } else {
        title.textContent = 'Nouveau produit';
        resetProductForm();
    }
    
    modal.classList.remove('hidden');
}

function hideProductModal() {
    document.getElementById('product-modal').classList.add('hidden');
}

function fillProductForm(product) {
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-title').value = product.title;
    document.getElementById('product-description').value = product.description;
    document.getElementById('product-type').value = product.type;
    document.getElementById('product-section').value = product.section;
    document.getElementById('product-price-eur').value = product.price.eur;
    document.getElementById('product-price-xaf').value = product.price.xaf;
    document.getElementById('product-image').value = product.image;
    document.getElementById('product-selar-link').value = product.selarLink;
    
    // Catégorie
    document.getElementById('detected-category').textContent = product.category;
    document.getElementById('product-category').value = product.category;
}

function resetProductForm() {
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('detected-category').textContent = '-';
    detectCategory();
}

// Détection automatique de catégorie
function detectCategory() {
    const title = document.getElementById('product-title').value.toLowerCase();
    const description = document.getElementById('product-description').value.toLowerCase();
    const text = title + ' ' + description;
    
    let detectedCategory = 'business'; // Catégorie par défaut
    let maxScore = 0;
    
    for (const [category, keywords] of Object.entries(ADMIN_CONFIG.CATEGORIES)) {
        let score = 0;
        keywords.forEach(keyword => {
            if (text.includes(keyword)) score++;
        });
        
        if (score > maxScore) {
            maxScore = score;
            detectedCategory = category;
        }
    }
    
    document.getElementById('detected-category').textContent = detectedCategory;
    document.getElementById('product-category').value = detectedCategory;
}

function toggleCategoryEdit() {
    const select = document.getElementById('product-category');
    select.innerHTML = '';
    
    ADMIN_CONFIG.CATEGORIES.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        select.appendChild(option);
    });
    
    select.value = document.getElementById('detected-category').textContent;
    select.classList.toggle('hidden');
}

// Gestion de la soumission du formulaire produit
function handleProductSubmit(e) {
    e.preventDefault();
    
    const productData = {
        id: document.getElementById('product-id').value || generateId(),
        title: document.getElementById('product-title').value,
        description: document.getElementById('product-description').value,
        type: document.getElementById('product-type').value,
        category: document.getElementById('product-category').value,
        section: document.getElementById('product-section').value,
        price: {
            eur: parseFloat(document.getElementById('product-price-eur').value),
            xaf: parseInt(document.getElementById('product-price-xaf').value)
        },
        image: document.getElementById('product-image').value,
        selarLink: document.getElementById('product-selar-link').value,
        featured: false,
        stock: 100,
        dateAdded: new Date().toISOString().split('T')[0]
    };
    
    // Gestion de l'originalPrice pour les offres 1€
    if (productData.section === 'dollar') {
        productData.originalPrice = {
            eur: productData.price.eur * 10, // Exemple de calcul
            xaf: productData.price.xaf * 10
        };
    }
    
    const existingIndex = adminState.products.findIndex(p => p.id === productData.id);
    
    if (existingIndex !== -1) {
        adminState.products[existingIndex] = productData;
    } else {
        adminState.products.push(productData);
    }
    
    saveProducts();
    displayProductsList();
    hideProductModal();
    updateStats();
}

// Gestion des annonces (similaire aux produits)
function displayAnnouncementsList() {
    const container = document.getElementById('announcements-list');
    container.innerHTML = '';
    
    adminState.announcements.forEach(announcement => {
        const element = createAnnouncementAdminCard(announcement);
        container.appendChild(element);
    });
}

function createAnnouncementAdminCard(announcement) {
    const element = document.createElement('div');
    element.className = 'glass-card p-4';
    element.innerHTML = `
        <div class="flex justify-between items-start mb-3">
            <div>
                <h4 class="font-bold">${announcement.title}</h4>
                <p class="text-sm text-gray-600 mt-1">${announcement.message}</p>
            </div>
            <div class="flex gap-2">
                <button class="edit-announcement-btn" data-id="${announcement.id}">
                    <i class="fas fa-edit text-blue-600"></i>
                </button>
                <button class="delete-announcement-btn" data-id="${announcement.id}">
                    <i class="fas fa-trash text-red-600"></i>
                </button>
            </div>
        </div>
        <div class="flex justify-between items-center text-sm">
            <span class="category-badge ${announcement.active ? 'status-active' : 'status-inactive'}">
                ${announcement.active ? 'Actif' : 'Inactif'}
            </span>
            <span class="text-gray-600">${announcement.type}</span>
        </div>
    `;
    
    element.querySelector('.edit-announcement-btn').addEventListener('click', () => editAnnouncement(announcement.id));
    element.querySelector('.delete-announcement-btn').addEventListener('click', () => deleteAnnouncement(announcement.id));
    
    return element;
}

function showAnnouncementModal(announcement = null) {
    const modal = document.getElementById('announcement-modal');
    const title = document.getElementById('announcement-modal-title');
    
    if (announcement) {
        title.textContent = 'Modifier l\'annonce';
        fillAnnouncementForm(announcement);
    } else {
        title.textContent = 'Nouvelle annonce';
        resetAnnouncementForm();
    }
    
    modal.classList.remove('hidden');
}

function hideAnnouncementModal() {
    document.getElementById('announcement-modal').classList.add('hidden');
}

function fillAnnouncementForm(announcement) {
    document.getElementById('announcement-id').value = announcement.id;
    document.getElementById('announcement-title').value = announcement.title;
    document.getElementById('announcement-message').value = announcement.message;
    document.getElementById('announcement-type').value = announcement.type;
    document.getElementById('announcement-priority').value = announcement.priority;
    document.getElementById('announcement-tally-link').value = announcement.tallyFormUrl;
    document.getElementById('announcement-active').checked = announcement.active;
}

function resetAnnouncementForm() {
    document.getElementById('announcement-form').reset();
    document.getElementById('announcement-id').value = '';
}

function handleAnnouncementSubmit(e) {
    e.preventDefault();
    
    const announcementData = {
        id: document.getElementById('announcement-id').value || generateId(),
        title: document.getElementById('announcement-title').value,
        message: document.getElementById('announcement-message').value,
        type: document.getElementById('announcement-type').value,
        active: document.getElementById('announcement-active').checked,
        tallyFormUrl: document.getElementById('announcement-tally-link').value,
        priority: parseInt(document.getElementById('announcement-priority').value),
        expiryDate: "2024-12-31",
        frequency: 33000
    };
    
    const existingIndex = adminState.announcements.findIndex(a => a.id === announcementData.id);
    
    if (existingIndex !== -1) {
        adminState.announcements[existingIndex] = announcementData;
    } else {
        adminState.announcements.push(announcementData);
    }
    
    saveAnnouncements();
    displayAnnouncementsList();
    hideAnnouncementModal();
    updateStats();
}

// Suppression d'éléments
function deleteProduct(productId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
        adminState.products = adminState.products.filter(p => p.id !== productId);
        saveProducts();
        displayProductsList();
        updateStats();
    }
}

function deleteAnnouncement(announcementId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
        adminState.announcements = adminState.announcements.filter(a => a.id !== announcementId);
        saveAnnouncements();
        displayAnnouncementsList();
        updateStats();
    }
}

// Édition d'éléments
function editProduct(productId) {
    const product = adminState.products.find(p => p.id === productId);
    if (product) showProductModal(product);
}

function editAnnouncement(announcementId) {
    const announcement = adminState.announcements.find(a => a.id === announcementId);
    if (announcement) showAnnouncementModal(announcement);
}

// Sauvegarde des données
async function saveProducts() {
    const data = { products: adminState.products };
    await saveData(ADMIN_CONFIG.PRODUCTS_URL, data, 'products');
}

async function saveAnnouncements() {
    const data = { announcements: adminState.announcements };
    await saveData(ADMIN_CONFIG.ANNOUNCEMENTS_URL, data, 'announcements');
}

async function saveData(url, data, type) {
    try {
        // Sauvegarde locale (simulation)
        console.log(`Sauvegarde ${type}:`, data);
        
        // Si GitHub configuré, sauvegarde via API
        if (adminState.githubConfig.repo && adminState.githubConfig.token) {
            await saveToGitHub(url, data);
        }
        
        showSuccess(`${type} sauvegardés avec succès`);
    } catch (error) {
        console.error(`Erreur sauvegarde ${type}:`, error);
        showError(`Erreur lors de la sauvegarde des ${type}`);
    }
}

// Sauvegarde GitHub (simplifiée)
async function saveToGitHub(filePath, data) {
    // Implémentation basique de l'API GitHub
    // Cette partie nécessiterait une implémentation plus complète
    console.log('Sauvegarde GitHub:', filePath, data);
}

// Export/Import
function exportProducts() {
    const dataStr = JSON.stringify({ products: adminState.products }, null, 2);
    downloadFile(dataStr, 'products.json', 'application/json');
}

function exportAnnouncements() {
    const dataStr = JSON.stringify({ announcements: adminState.announcements }, null, 2);
    downloadFile(dataStr, 'announcements.json', 'application/json');
}

function downloadFile(content, fileName, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
}

function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.products) {
                adminState.products = data.products;
                saveProducts();
                displayProductsList();
            }
            
            if (data.announcements) {
                adminState.announcements = data.announcements;
                saveAnnouncements();
                displayAnnouncementsList();
            }
            
            updateStats();
            showSuccess('Données importées avec succès');
        } catch (error) {
            showError('Erreur lors de l\'import du fichier');
        }
    };
    reader.readAsText(file);
}

// Configuration GitHub
function saveGitHubConfig() {
    adminState.githubConfig = {
        repo: document.getElementById('github-repo').value,
        token: document.getElementById('github-token').value,
        branch: 'main'
    };
    
    localStorage.setItem('githubConfig', JSON.stringify(adminState.githubConfig));
    showSuccess('Configuration GitHub sauvegardée');
}

// Statistiques
function updateStats() {
    document.getElementById('total-products').textContent = adminState.products.length;
    document.getElementById('active-announcements').textContent = 
        adminState.announcements.filter(a => a.active).length;
    
    const categories = [...new Set(adminState.products.map(p => p.category))];
    document.getElementById('categories-count').textContent = categories.length;
    
    updateCategoriesChart(categories);
}

function updateCategoriesChart(categories) {
    const chartContainer = document.getElementById('categories-chart');
    chartContainer.innerHTML = '';
    
    categories.forEach(category => {
        const count = adminState.products.filter(p => p.category === category).length;
        const percentage = (count / adminState.products.length) * 100;
        
        const bar = document.createElement('div');
        bar.className = 'mb-2';
        bar.innerHTML = `
            <div class="flex justify-between text-sm mb-1">
                <span>${category}</span>
                <span>${count} (${percentage.toFixed(1)}%)</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-blue-500 h-2 rounded-full" style="width: ${percentage}%"></div>
            </div>
        `;
        chartContainer.appendChild(bar);
    });
}

// Utilitaires
function generateId() {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function updateAdminStatus() {
    const statusElement = document.getElementById('admin-status');
    statusElement.textContent = `Connecté - ${adminState.products.length} produits`;
}

function showSuccess(message) {
    // Implémentation d'une notification toast
    console.log('SUCCÈS:', message);
}

function showError(message) {
    // Implémentation d'une notification toast
    console.error('ERREUR:', message);
}

function handleLogout() {
    adminState.isAuthenticated = false;
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminAuthTime');
    showLoginScreen();
}

// Gestion des catégories (configuration étendue)
ADMIN_CONFIG.CATEGORIES = {
    "ia": ["ia", "intelligence artificielle", "ai", "chatbot", "machine learning", "automation", "neural", "deep learning"],
    "marketing": ["marketing", "vente", "conversion", "publicité", "social media", "seo", "growth", "acquisition"],
    "business": ["business", "entreprise", "stratégie", "management", "leadership", "productivité", "organisation"],
    "tech": ["développement", "code", "programming", "website", "app", "software", "technologie", "digital"],
    "finance": ["finance", "argent", "investissement", "crypto", "trading", "budget", "économie", "fiscalité"],
    "santé": ["santé", "bien-être", "fitness", "nutrition", "médecine", "psychologie", "mental"],
    "lifestyle": ["lifestyle", "vie", "personnel", "développement personnel", "bonheur", "équilibre"],
    "e-commerce": ["e-commerce", "shop", "boutique", "vente en ligne", "dropshipping", "marketplace"],
    "crypto": ["crypto", "blockchain", "bitcoin", "ethereum", "nft", "web3", "metaverse"]
};