// admin.js

// --- CONFIGURATION ---
// IMPORTANT: Replace these with your actual Supabase URL and Anon Key.
// In a real-world production app, these should be stored in environment variables
// and loaded securely, but for this admin panel, this is a simpler starting point.
const SUPABASE_URL = 'https://kwrteqlhcikruoqxdnwd.supabase.co/'; 
const SUPABASE_ANON_KEY = '';

// --- SANITY CHECK ---
if (SUPABASE_URL.includes('YOUR_SUPABASE_URL') || SUPABASE_ANON_KEY === '') {
    const warning = "Supabase credentials are not set in admin.js. Please replace the placeholder values.";
    alert(warning);
    throw new Error(warning);
}

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
    addProductMessage.style.color = 'var(--text-light)';

    const { data: { session }, error: sessionError } = await dbClient.auth.getSession();
    if (sessionError || !session) {
        addProductMessage.textContent = 'Authentication error. Please log in again.';
        addProductMessage.style.color = 'red';
        return;
    }

    const token = session.access_token;
    const newProduct = {
        name: document.getElementById('product-name').value,
        description: document.getElementById('product-description').value,
        image_url: document.getElementById('product-image-url').value,
    };

    try {
        const response = await fetch('/.netlify/functions/add-product', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(newProduct),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to add product.');
        }

        addProductMessage.textContent = 'Product added successfully!';
        addProductMessage.style.color = 'var(--deep-green)';
        addProductForm.reset();
        await fetchAndDisplayProducts(); // Refresh the list

    } catch (error) {
        addProductMessage.textContent = `Error: ${error.message}`;
        addProductMessage.style.color = 'red';
    }
});

/**
 * Handles clicks on "Delete" buttons.
 */
existingProductsList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-button')) {
        const productId = e.target.dataset.id;
        
        if (confirm(`Are you sure you want to delete product ID ${productId}?`)) {
            const { data: { session }, error: sessionError } = await dbClient.auth.getSession();
            if (sessionError || !session) {
                alert('Authentication error. Please log in again.');
                return;
            }

            const token = session.access_token;

            try {
                const response = await fetch('/.netlify/functions/delete-product', {
                    method: 'POST', // Using POST for simplicity
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ product_id: productId }),
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || 'Failed to delete product.');
                }
                
                alert(`Product ${productId} deleted successfully.`);
                await fetchAndDisplayProducts(); // Refresh the list

            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        }
    }
});


// --- INITIALIZATION ---
// Check user session when the page loads.
document.addEventListener('DOMContentLoaded', checkSession);
