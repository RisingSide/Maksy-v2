# Onboarding System - Hybrid Approach

## Overview

Maksy v2 uses a **hybrid onboarding system** that combines the best of forced onboarding (for critical data) with a flexible, gamified setup tracker (for optional features).

### Philosophy

- **Phase 1 (Critical)**: Fast, simple, one-page form - blocks dashboard access until complete
- **Phase 2 (Progressive)**: Stripe-style progress tracker - non-blocking, user-driven
- **Phase 3 (Guided)**: Optional Maksy AI tour - chat-based walkthrough

---

## Phase 1: Critical Onboarding

### What It Collects

**Required fields (7 total):**

1. Company Name
2. Industry (dropdown selection)
3. Business Phone
4. Business Address (Google autocomplete)
5. Custom Booking URL Slug (auto-generated, editable)
6. First Name (pre-filled from Clerk)
7. Last Name (pre-filled from Clerk)

**Optional fields:**

- Website URL

### User Flow

```
1. User signs up via Clerk (email/password or Google OAuth)
   ↓
2. Clerk webhook creates DB records (companies, user_profiles, team_members, etc.)
   ↓
3. User lands on /dashboard
   ↓
4. Middleware checks: company_name === 'My Company'?
   ↓
5. YES → Redirect to /onboarding
   ↓
6. User fills out 7-field form (60 seconds)
   ↓
7. On submit → Updates companies table → Marks critical_completed = true
   ↓
8. Redirects to /dashboard with Maksy welcome
```

### Technical Implementation

**Component:** `/components/onboarding/CriticalOnboardingForm.tsx`

**API Route:** `/api/onboarding/complete-critical` (POST)

**Key Features:**

- Auto-generates slug from company name
- Real-time slug availability check
- Google Places autocomplete for address
- Form validation before submit
- Beautiful glassmorphism UI with animated gradient background

---

## Phase 2: Progressive Setup Tracker

### Tasks Defined

7 optional tasks weighted by importance:

| Task                            | Weight | Route                  | Required Plan |
| ------------------------------- | ------ | ---------------------- | ------------- |
| Add Your Services               | 25%    | /services              | All           |
| Import Customer List            | 15%    | /customers             | All           |
| Create Your First Job           | 20%    | /calendar              | All           |
| Connect Payment Method (Stripe) | 15%    | /settings?tab=payments | All           |
| Customize Booking Page          | 10%    | /settings?tab=booking  | All           |
| Add Team Members                | 10%    | /settings?tab=team     | Pro+          |
| Set Up First Automation         | 5%     | /automations           | Scale         |

**Total:** 100%

### User Flow

```
1. User completes Phase 1 → Lands on /dashboard
   ↓
2. Progress banner appears at top (if not dismissed)
   ↓
3. User clicks "Go →" on a task
   ↓
4. Navigates to target page
   ↓
5. Spotlight effect dims screen + highlights action button
   ↓
6. Helper bubble explains what to do
   ↓
7. User performs action (e.g., adds a service)
   ↓
8. Task auto-marks complete when action is done
   ↓
9. Progress bar updates
   ↓
10. If 100% → Confetti animation 🎉
```

### Technical Implementation

**Components:**

- `/components/onboarding/SetupProgressBanner.tsx` - Stripe-style tracker
- `/components/onboarding/TaskSpotlight.tsx` - Dim screen + highlight + helper
- `/components/onboarding/CompletionConfetti.tsx` - Celebration animation

**API Routes:**

- `/api/onboarding/progress` (GET) - Fetch current progress
- `/api/onboarding/complete-task` (POST) - Mark task complete
- `/api/onboarding/set-tour-mode` (POST) - Update user preference

**Task Definitions:** `/lib/onboarding/tasks.ts`

**Progress Calculation:** `/lib/onboarding/progress-calculator.ts`

---

## Phase 3: Maksy-Guided Tour (Future)

### Planned Features

**Welcome Prompt:**

```
Maksy: "Hey there! I'm Maksy, your AI assistant.
Want me to walk you through setting up your account?
It'll take about 5 minutes.

[Yes, help me set up] [I'll explore on my own]"
```

**If "Yes":**

- Maksy stays open and guides through each task
- "Great! Let's start by adding your services. Click the 'Services' menu on the left..."
- After each task: "Nice! ✓ Now let's add some customers..."

**If "No":**

- Shows progress bar at top of dashboard
- Maksy bubble stays closed but accessible

### Tour Modes

- `pending` - User hasn't chosen yet (show prompt)
- `guided` - Maksy chat-based walkthrough
- `checklist` - Self-paced with progress bar
- `completed` - All tasks done
- `dismissed` - User dismissed tracker

---

## Database Schema

### Table: `onboarding_progress`

```sql
CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY,
  company_id UUID UNIQUE REFERENCES companies(id),

  -- Phase 1: Critical onboarding
  critical_completed BOOLEAN DEFAULT FALSE,
  critical_completed_at TIMESTAMP,

  -- Phase 2: Setup tasks
  tasks_completed JSONB DEFAULT '{
    "add_services": false,
    "import_customers": false,
    "create_first_job": false,
    "connect_stripe": false,
    "customize_booking_page": false,
    "add_team_members": false,
    "setup_automation": false
  }',

  -- Progress tracking
  completion_percentage INTEGER DEFAULT 0,

  -- Tour mode
  tour_mode TEXT DEFAULT 'pending',

  -- Timestamps
  dismissed_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Design Principles

### 1. **Non-Intrusive**

- Phase 2 can be dismissed anytime
- No forced wizards or modals
- User controls their own pace

### 2. **Gamified**

- Progress bar motivates completion
- Tasks have clear descriptions
- Confetti celebration on 100%

### 3. **Helpful, Not Pushy**

- Helper bubbles explain (don't demand)
- "Skip for now" option on all tasks
- Can revisit dismissed tracker

### 4. **Plan-Aware**

- Only shows tasks available for user's plan
- Pro users don't see Scale-only tasks
- Weight adjusts automatically

### 5. **Context-Aware**

- Tasks auto-complete when action is detected
- No manual "mark as done" needed
- Smart completion checks via `completionCheck()` functions

---

## Extra Polish Features

### 1. **Confetti on Completion**

When setup hits 100%, trigger confetti animation + Maksy says:

```
"🎉 You're all set! Your business is ready to grow with Maksy.
Let's get your first job booked!"
```

### 2. **Smart Task Ordering**

Don't show all tasks at once. Show 2-3 at a time based on dependencies:

- Add Services → _then_ Create First Job
- Import Customers → _then_ Create First Job

### 3. **Task-Specific Rewards**

- Complete "Add Services" → Unlock service analytics widget
- Complete "First Job" → Show revenue projection
- Connect Stripe → "You can now accept $X in payments!"

### 4. **Maksy Personality**

Encouragement throughout:

- "Looking good! 3 more tasks to go 💪"
- "Pro tip: Most users add 3-5 services to start"
- "You're faster than 80% of new users!"

### 5. **Skip Option**

"Not ready yet? [Skip this task]" - marks as skipped but can revisit

---

## Implementation Checklist

- [x] Create database migration for `onboarding_progress` table
- [x] Create onboarding helper utilities and task definitions
- [x] Create API routes for onboarding progress
- [x] Create onboarding components (form, banner, spotlight)
- [x] Update Clerk webhook to create `onboarding_progress`
- [x] Update middleware for onboarding redirect logic
- [x] Update dashboard to show progress banner
- [x] Update onboarding page with new form
- [x] Add confetti animation for completion
- [ ] Integrate Maksy AI chat for guided tour (Phase 3 - Future)
- [ ] Add smart task ordering (Phase 3 - Future)
- [ ] Add task-specific rewards (Phase 3 - Future)

---

## Testing the Flow

1. **Sign up** via Clerk
2. Should **redirect to /onboarding** (middleware check)
3. **Fill out form** (7 fields)
4. **Submit** → Redirects to /dashboard
5. **Progress banner** appears at top
6. **Click "Go →"** on "Add Your Services"
7. **Navigates to /services**
8. **Spotlight** highlights "Add Service" button
9. **Add a service**
10. **Task auto-completes** → Progress updates
11. **Repeat** for other tasks
12. **Hit 100%** → Confetti 🎉

---

## Future Enhancements

### Analytics Dashboard

- Track which tasks users skip most
- Average time to 100% completion
- Correlation between completion % and retention

### A/B Testing

- Test different task orderings
- Test Maksy-guided vs self-paced
- Test reward messaging

### Personalization

- Industry-specific tasks (e.g., HVAC gets "Set up seasonal pricing")
- Smart suggestions based on user behavior
- Adaptive task weighting

---

## Summary

The hybrid onboarding system combines:

- **Speed** (60-second critical form)
- **Flexibility** (non-blocking progress tracker)
- **Guidance** (optional Maksy tour)
- **Gamification** (progress bar, confetti)
- **Intelligence** (auto-completion, plan-aware tasks)

This approach ensures users can start using Maksy immediately while being gently guided toward optimal setup. 🚀
