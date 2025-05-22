// const { createClient } = require('@supabase/supabase-js');

// const supabaseUrl = process.env.SUPABASE_URL;
// const supabaseKey = process.env.SUPABASE_KEY;

// const supabase = createClient(supabaseUrl, supabaseKey);

// async function getTodos() {
//   const { data, error } = await supabase.from('todos').select('*');
//   if (error) {
//     throw error;
//   }
//   return data;
// }

// module.exports = {
//   supabase,
//   getTodos,
// };


// todo-backend/db.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config(); // Ensure environment variables are loaded here too

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERROR: Supabase URL or Anon Key is missing in .env');
  process.exit(1); // Exit the process if credentials are not found
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('Supabase client initialized.');

module.exports = supabase;