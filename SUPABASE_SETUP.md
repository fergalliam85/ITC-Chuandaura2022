# Supabase setup

The site is static, so cross-device accounts and progress need a shared Supabase project.

1. Create a Supabase project.
2. In the Supabase SQL Editor, run the contents of `supabase-schema.sql`.
3. In **Project Settings → API**, copy the project URL and the public `anon`/publishable key into `supabase-config.js`:

   ```js
   window.ITC_SUPABASE_CONFIG = {
     url: 'https://YOUR_PROJECT_ID.supabase.co',
     anonKey: 'YOUR_PUBLIC_ANON_KEY'
   };
   ```

   This key is intended for browser use. Never put a `service_role` or secret key in this file.
4. In **Authentication → URL Configuration**, set the site URL to the deployed website URL and add it to the allowed redirect URLs. Configure email confirmation as desired.
5. Deploy the site over HTTPS, then register an account and sign in from each device using the same email and password.

`localhost` only refers to the current device. To use the account from another device, both devices must open the same deployed website URL; starting a server on one computer does not make `localhost` on another computer reach it.

Legacy accounts created before Supabase are stored only in their original browser and their old passwords cannot be transferred. Register a Supabase account using the same email and choose a new password. If that browser has saved progress for the email, the app imports it to Supabase the first time that account signs in. Progress saved under guest mode remains local to that browser.
