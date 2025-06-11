# 🚀 Nexus/Marcoby App: Go-Live & Onboarding Verification Checklist

### 1. **Environment Setup**

* At the project root, create a `.env` file with:

  ```dotenv
  DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.kqclbpimkraenvbffnpk.supabase.co:5432/postgres"
  VITE_SUPABASE_URL="https://kqclbpimkraenvbffnpk.supabase.co"
  VITE_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
  ```
* Confirm these values match your Supabase project.

---

### 2. **Prisma DB Migration**

* Generate and deploy your schema:

  ```bash
  npx prisma generate
  npx prisma migrate deploy
  ```
* **Checkpoint:**
  In Supabase Table Editor, confirm the following tables exist:

  * `companies`
  * `user_profiles`
  * `conversations`
  * `chat_messages`
  * `thoughts`
  * (any other custom tables)

---

### 3. **Start Local Dev**

* Run the app:

  ```bash
  npm run dev
  ```
* Vite will load `.env` automatically.

---

### 4. **Onboarding Walkthrough**

* Go to `/` or the route where `OnboardingChatAI` is rendered.
* Complete onboarding prompts (e.g., name, org, role).

---

### 5. **Verify Data Persistence**

* In Supabase Table Editor:
  * Check `companies` for a "Marcoby" record.
  * Check `user_profiles` for your (Von Jackson) profile linked to Marcoby.
* **Dev Tip:**
  Open the browser console to catch any upsert/persistence errors.

---

### 6. **Reload & Context Test**

* Refresh the app.
* Confirm that the **real profile** now shows up everywhere (headers, greetings, dashboard).
  *You should see "Von @ Marcoby" instead of demo/default user.*

---

### 7. **(Optional) Thoughts: Onboarding → Persistence Flow**

* In the "Thoughts" module/dashboard, create a parent Idea + child Tasks using `thoughtsService`.
* Confirm these entries show up instantly in your UI.

---

### 8. **Pre-Commit Checklist**

* Run all preflight checks:

  ```bash
  npm run lint && npm run type-check && npm run test:ci
  ```
* Fix any issues, then:

  ```bash
  git add .
  git commit -m "Complete onboarding flow integration & Supabase wiring"
  git push
  ```

---

## ✅ Go-Live Complete

You now have a fully functional onboarding flow wired into Supabase, React context, and your "Thoughts"/dashboard modules.

---

**Pro Tip:**
If you want to create a "wow moment" for the user at onboarding, consider adding:

* A personal welcome message referencing their name/org.
* An immediate dashboard tour or auto-created "first steps" checklist in Thoughts.
* A real-time indicator showing "Data Saved" or "Workspace Created". 