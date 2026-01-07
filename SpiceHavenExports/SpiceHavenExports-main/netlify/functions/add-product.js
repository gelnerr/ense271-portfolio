// netlify/functions/add-product.js

const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from Netlify environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
// This is the powerful "secret" key that can bypass RLS.
// It MUST be kept secret and only used in secure backend functions.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

exports.handler = async function(event, context) {
    // We only want to handle POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // --- User Authentication ---
        // Get the JWT from the request headers
        const token = event.headers.authorization?.split(' ')[1];
        if (!token) {
            return { statusCode: 401, body: 'Unauthorized: No token provided' };
        }

        // Create a temporary Supabase client with the user's token to verify them
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            return { statusCode: 401, body: 'Unauthorized: Invalid token' };
        }

        // --- Add Product Logic ---
        // If the user is valid, we can proceed.
        // Create an admin client that can bypass RLS
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // Parse the product data from the request body
        const { name, description, image_url } = JSON.parse(event.body);

        // Validate the incoming data
        if (!name) {
            return { statusCode: 400, body: 'Bad Request: Product name is required' };
        }

        // Insert the new product into the database
        const { data: newProduct, error: insertError } = await supabaseAdmin
            .from('products')
            .insert([{ name, description, image_url }])
            .select() // .select() returns the newly created row
            .single(); // We expect only one row to be created

        if (insertError) {
            throw insertError;
        }

        // Return a success response
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct),
        };

    } catch (error) {
        console.error('Error adding product:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Failed to add product: ${error.message}` }),
        };
    }
};
