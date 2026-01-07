// admin.js

// --- CONFIGURATION ---
// IMPORTANT: Replace these with your actual Supabase URL and Anon Key.
// In a real-world production app, these should be stored in environment variables
// and loaded securely, but for this admin panel, this is a simpler starting point.
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; 
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// --- ELEMENT SELECTORS ---
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutButton = document.getElementById('logout-button');
const addProductForm = document.getElementById('add-product-form');
const addProductMessage = document.getElementById('add-product-message');
const existingProductsList = document.getElementById('existing-products-list');

// --- SUPABASE CLIENT ---
const { createClient } = supabase;
const dbClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- AUTHENTICATION ---

/**
 * Handles the login form submission.
 */
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    loginError.textContent = ''; // Clear previous errors

    try {
        const { data, error } = await dbClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) throw error;

        // If login is successful, hide login form and show dashboard
        if (data.user) {
            await showDashboard();
        }
    } catch (error) {
        loginError.textContent = `Login failed: ${error.message}`;
    }
});

/**
 * Handles the logout button click.
 */
logoutButton.addEventListener('click', async () => {
    const { error } = await dbClient.auth.signOut();
    if (error) {
        alert(`Logout failed: ${error.message}`);
    } else {
        // Hide dashboard, show login form
        dashboardSection.style.display = 'none';
        loginSection.style.display = 'block';
    }
});

/**
 * Checks the current session to see if a user is already logged in.
 */
async function checkSession() {
    const { data, error } = await dbClient.auth.getSession();
    if (data.session) {
        await showDashboard();
    } else {
        dashboardSection.style.display = 'none';
        loginSection.style.display = 'block';
    }
}

// --- UI MANAGEMENT ---

/**
 * Hides the login section, shows the dashboard, and fetches products.
 */
async function showDashboard() {
    loginSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    await fetchAndDisplayProducts();
}

// --- PRODUCT MANAGEMENT (FRONTEND) ---

/**
 * Fetches products from the public serverless function and displays them.
 */
async function fetchAndDisplayProducts() {
    existingProductsList.innerHTML = '<p>Loading products...</p>';
    
    try {
        // We use the public-facing function to get the initial list
        const response = await fetch('/.netlify/functions/get-products');
        if (!response.ok) throw new Error('Failed to fetch from API.');
        
        const products = await response.json();

        if (products.length === 0) {
            existingProductsList.innerHTML = '<p>No products found. Add one using the form above!</p>';
            return;
        }

        existingProductsList.innerHTML = ''; // Clear loading message
        products.forEach(product => {
            const item = document.createElement('div');
            item.className = 'product-item';
            item.innerHTML = `
                <span class="product-item-name">${product.name.replace(/</g, "&lt;")}</span>
                <button class="delete-button" data-id="${product.id}">Delete</button>
            `;
            existingProductsList.appendChild(item);
        });

    } catch (error) {
        existingProductsList.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
}

/**
 * Handles the "Add Product" form submission.
 */
addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    addProductMessage.textContent = 'Adding product...';

    // This is a placeholder. We will implement the protected 'add-product' function next.
    setTimeout(() => {
         addProductMessage.textContent = 'Placeholder: Product added! (Backend not yet implemented)';
         addProductForm.reset();
         // In a real scenario, we would re-fetch the product list here.
    }, 1000);

    // TODO:
    // 1. Get user's auth token from dbClient.auth.getSession()
    // 2. Call a new '/.netlify/functions/add-product' endpoint with a POST request.
    // 3. Include the auth token in the 'Authorization' header.
    // 4. Include product data in the body.
    // 5. Refresh the product list on success.
});

/**
 * Handles clicks on "Delete" buttons.
 */
existingProductsList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-button')) {
        const productId = e.target.dataset.id;
        
        if (confirm(`Are you sure you want to delete product ID ${productId}?`)) {
            alert(`Placeholder: Deleting product ${productId}... (Backend not yet implemented)`);
            
            // TODO:
            // 1. Get user's auth token.
            // 2. Call a new '/.netlify/functions/delete-product' endpoint with a POST/DELETE request.
            // 3. Include auth token and product ID.
            // 4. Refresh the product list on success.
        }
    }
});


// --- INITIALIZATION ---
// Check user session when the page loads.
document.addEventListener('DOMContentLoaded', checkSession);
