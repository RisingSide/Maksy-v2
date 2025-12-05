# Team Management System

This document describes the team member management system in Maksy, including invitation flows, direct member creation, and role-based access.

## Overview

Maksy provides two ways to add team members:

1. **Invite Member** (Email) - Send an invitation email, recipient creates their own account
2. **Add Member** (Manual) - Create account directly with credentials to share

## Team Member Roles

| Role            | Permissions                                         |
| --------------- | --------------------------------------------------- |
| **Owner**       | Full access, cannot be removed, one per company     |
| **Admin**       | Manage team members, company settings, all features |
| **Team Member** | View and complete assigned tasks/jobs               |

## Team Member Status

| Status     | Description                                 |
| ---------- | ------------------------------------------- |
| `invited`  | Invitation sent, awaiting acceptance        |
| `active`   | Account active and linked                   |
| `inactive` | Account deactivated (preserved for history) |

---

## Flow 1: Invite Team Member (Email)

### User Journey

```
Admin clicks "Invite Member"
    ↓
Fills out: Email, Name, Role
    ↓
System creates team_member record (status: 'invited')
    ↓
Email sent via Resend with magic link
    ↓
Recipient clicks link → /accept-invite?token=xxx
    ↓
If not signed in: Prompted to sign up/sign in
    ↓
Clicks "Accept Invitation"
    ↓
System links Clerk userId to team_member
    ↓
Status changes to 'active'
    ↓
Redirected to dashboard
```

### API Endpoints

#### POST /api/team

Creates a new team member invitation.

**Request:**

```json
{
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "team_member",
  "hourlyRate": 25.0,
  "commissionRate": 10
}
```

**Response:**

```json
{
  "id": "uuid",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "team_member",
  "status": "invited",
  "emailSent": true,
  "inviteLink": null
}
```

Note: `inviteLink` is only returned if email fails to send.

#### POST /api/team/[id]/resend-invite

Resends invitation email with a new token.

#### GET /api/team/accept-invite?token=xxx

Validates an invitation token.

**Response:**

```json
{
  "valid": true,
  "teamMember": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "team_member"
  },
  "companyName": "Acme Corp"
}
```

#### POST /api/team/accept-invite

Accepts an invitation and links the Clerk user.

**Request:**

```json
{
  "token": "uuid"
}
```

---

## Flow 2: Add Team Member (Direct)

### User Journey

```
Admin clicks "Add Member"
    ↓
Fills out: Email, Name, Password, Role, Pay Rates
    ↓
System creates Clerk user account
    ↓
System creates team_member record (status: 'active')
    ↓
Credentials displayed to admin
    ↓
Admin shares credentials with team member
    ↓
Team member logs in and changes password
```

### API Endpoint

#### POST /api/team/create-direct

Creates a team member with a Clerk account directly.

**Request:**

```json
{
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "SecurePass123!",
  "role": "team_member",
  "phone": "+15551234567",
  "hourlyRate": 25.0,
  "commissionRate": 10
}
```

**Response:**

```json
{
  "success": true,
  "teamMember": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "team_member",
    "status": "active"
  },
  "message": "John has been added to your team"
}
```

**Permissions:** Only owners and admins can use this endpoint.

---

## Plan Limits

| Plan  | Team Member Limit        |
| ----- | ------------------------ |
| Pro   | 5 members                |
| Scale | Unlimited                |
| Team  | Based on purchased seats |

The API enforces these limits before creating new members.

---

## Email Configuration

### Required Environment Variables

```bash
# Resend API Key (from https://resend.com/api-keys)
RESEND_API_KEY=re_xxxxx

# Optional: Custom sender (requires verified domain)
EMAIL_FROM=Maksy <team@yourdomain.com>

# Required for invitation links
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

### Email Templates

Located in `/src/lib/email-templates/`:

- `team-invite.ts` - Team invitation email
- `index.ts` - Central export

### Sending Emails

```typescript
import { sendEmail } from '@/lib/resend'
import {
  generateTeamInviteEmail,
  getTeamInviteSubject,
} from '@/lib/email-templates'

await sendEmail({
  to: 'recipient@example.com',
  subject: getTeamInviteSubject('Company Name'),
  html: generateTeamInviteEmail({
    inviteeName: 'John',
    inviterName: 'Admin',
    companyName: 'Company Name',
    inviteLink: 'https://app.com/accept-invite?token=xxx',
    role: 'team_member',
    expiresIn: '7 days',
  }),
})
```

---

## Database Schema

```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id TEXT UNIQUE,                    -- Clerk user ID (null until accepted)
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  role team_member_role NOT NULL,         -- 'owner', 'admin', 'team_member'
  status team_member_status NOT NULL,     -- 'invited', 'active', 'inactive'
  invitation_token TEXT,                  -- UUID for invite link
  invitation_sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  avatar_url TEXT,
  hourly_rate DECIMAL(10,2),
  commission_rate DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## UI Components

### TeamInviteModal

Modal for sending email invitations.

```tsx
import { TeamInviteModal } from '@/components/team'

;<TeamInviteModal
  open={isOpen}
  onOpenChange={setIsOpen}
  onSuccess={() => refetch()}
/>
```

### TeamAddModal

Modal for directly creating team members.

```tsx
import { TeamAddModal } from '@/components/team'

;<TeamAddModal
  open={isOpen}
  onOpenChange={setIsOpen}
  onSuccess={() => refetch()}
/>
```

---

## Security Considerations

1. **Invitation Tokens**
   - UUID v4, cryptographically random
   - Single-use (cleared after acceptance)
   - Expire after 7 days

2. **Direct Creation**
   - Requires owner/admin role
   - Passwords must be 8+ characters
   - Users should change password on first login

3. **Plan Enforcement**
   - Limits checked server-side
   - Cannot exceed plan's member limit

4. **Email Verification**
   - Clerk handles email verification for direct creation
   - Invitation flow implicitly verifies email ownership

---

## Troubleshooting

### Email Not Sending

1. Check `RESEND_API_KEY` is set
2. **Important:** If using custom FROM address, verify domain at https://resend.com/domains
3. Default uses `onboarding@resend.dev` (Resend's test domain) - works without verification
4. Check server logs for Resend errors (403 = domain not verified)
5. Fallback: Share the invite link manually (returned when email fails)

### Invitation Link Not Working

1. Check token hasn't expired (7 days)
2. Verify `NEXT_PUBLIC_APP_URL` is correct
3. Ensure invitation hasn't already been accepted

### Direct Creation Failing

1. Check email isn't already registered in Clerk
2. Verify password meets requirements (8+ chars)
3. Ensure current user has owner/admin role
4. Check plan limits haven't been reached

---

## Known Issues Fixed (Dec 4, 2024)

These issues were identified and fixed during implementation:

| Issue                       | Cause                                                    | Fix                                             |
| --------------------------- | -------------------------------------------------------- | ----------------------------------------------- |
| Team members not displaying | API returned `teamMembers`, hook expected `team_members` | Updated hook interface                          |
| 401 errors on team page     | Hook made API calls before Clerk auth was ready          | Added `useAuth()` check                         |
| Email not sending           | Default FROM used unverified domain                      | Changed to `onboarding@resend.dev`              |
| Double-delete error         | Fast clicks sent duplicate DELETE requests               | Close dialog immediately, handle 404 gracefully |

See `/BUGS_FIXED.md` for full details.

---

## Future Enhancements

- [ ] Bulk team member import (CSV)
- [ ] SSO/SAML integration for enterprise
- [ ] Team member permissions granularity
- [ ] Activity log for team actions
- [ ] Team member profile editing
- [ ] Custom role creation
- [ ] Team member availability calendar
