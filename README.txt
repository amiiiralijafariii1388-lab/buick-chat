BUICK CHAT — SUPABASE PROTOTYPE

WHAT THIS IS
A two-person web chat prototype using Supabase Realtime. The app files are already configured with the project URL and the Publishable key you supplied.
Your friend will not need a Supabase account or any setup. Once the site is hosted, they only open the invitation link.

STEP 1 — CREATE THE DATABASE TABLES
1. Open your Supabase project dashboard.
2. Open SQL Editor from the left menu.
3. Choose New query.
4. Open setup.sql from this folder, copy all of it, paste it into the SQL Editor, then press Run.
5. Wait for the success message.

STEP 2 — TEST LOCALLY
For the first test, open index.html in a modern browser. If the browser blocks some features from file://, run the folder with a local static server or upload it to hosting in Step 3.

STEP 3 — PUT IT ONLINE
The invitation link only works after the site is hosted on an HTTPS static host. Upload the contents of this folder (index.html, style.css, app.js, config.js) to a static hosting provider such as Netlify or Cloudflare Pages. Then open the hosted URL and create a chat. Use Copy to send the resulting link to your friend.

IMPORTANT SECURITY LIMITATION
This is an early prototype with open anonymous database policies so two people can test without accounts. Anyone who discovers the project endpoint can potentially read or write prototype data, and anyone with a room link/code can join that room. Do not use it for private, sensitive, or important conversations. Before public launch, we must add proper user authentication, per-room membership, rate limits, abuse protection, and stricter RLS policies.

KEYS
config.js contains only the Supabase Publishable key, which is designed for browser use. Never put a Secret key or service_role key in this folder or in frontend code.

FILES
index.html   App page
style.css    Visual design
app.js       Chat and realtime logic
config.js    Supabase project URL and Publishable key
setup.sql    Database schema and prototype RLS policies
