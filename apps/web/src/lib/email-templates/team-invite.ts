/**
 * Team Invitation Email Template
 *
 * Sent when a team member is invited to join a company on Maksy
 */

interface TeamInviteEmailProps {
  inviteeName: string
  inviterName: string
  companyName: string
  inviteLink: string
  role: 'admin' | 'team_member'
  expiresIn?: string
}

export function generateTeamInviteEmail({
  inviteeName,
  inviterName,
  companyName,
  inviteLink,
  role,
  expiresIn = '7 days',
}: TeamInviteEmailProps): string {
  const roleDescription =
    role === 'admin'
      ? 'an Admin with full management access'
      : 'a Team Member with access to assigned tasks and jobs'

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to Join ${companyName} on Maksy</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      padding: 40px;
    }
    .logo {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo-text {
      font-size: 28px;
      font-weight: 700;
      color: #f4a125;
      text-decoration: none;
    }
    h1 {
      font-size: 24px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0 0 20px;
      text-align: center;
    }
    p {
      margin: 0 0 16px;
      color: #4a4a4a;
    }
    .highlight {
      background: linear-gradient(135deg, #f4a125 0%, #e8941f 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin: 24px 0;
      text-align: center;
    }
    .highlight p {
      color: white;
      margin: 0;
      font-weight: 500;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #f4a125 0%, #e8941f 100%);
      color: white !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 24px 0;
    }
    .button:hover {
      background: linear-gradient(135deg, #e8941f 0%, #d4850f 100%);
    }
    .button-container {
      text-align: center;
    }
    .details {
      background: #f9f9f9;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
    }
    .details-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .details-row:last-child {
      border-bottom: none;
    }
    .details-label {
      color: #666;
      font-size: 14px;
    }
    .details-value {
      font-weight: 500;
      color: #1a1a1a;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
    .footer p {
      font-size: 12px;
      color: #888;
    }
    .link-fallback {
      font-size: 12px;
      color: #666;
      word-break: break-all;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <span class="logo-text">Maksy</span>
      </div>
      
      <h1>You're Invited! 🎉</h1>
      
      <p>Hi ${inviteeName},</p>
      
      <p><strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> on Maksy, the all-in-one platform for service businesses.</p>
      
      <div class="highlight">
        <p>You've been invited as ${roleDescription}</p>
      </div>
      
      <div class="details">
        <div class="details-row">
          <span class="details-label">Company</span>
          <span class="details-value">${companyName}</span>
        </div>
        <div class="details-row">
          <span class="details-label">Role</span>
          <span class="details-value">${role === 'admin' ? 'Admin' : 'Team Member'}</span>
        </div>
        <div class="details-row">
          <span class="details-label">Invited by</span>
          <span class="details-value">${inviterName}</span>
        </div>
        <div class="details-row">
          <span class="details-label">Expires in</span>
          <span class="details-value">${expiresIn}</span>
        </div>
      </div>
      
      <div class="button-container">
        <a href="${inviteLink}" class="button">Accept Invitation</a>
      </div>
      
      <p class="link-fallback">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${inviteLink}">${inviteLink}</a>
      </p>
      
      <div class="footer">
        <p>This invitation will expire in ${expiresIn}. If you didn't expect this invitation, you can safely ignore this email.</p>
        <p>© ${new Date().getFullYear()} Maksy. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`
}

export function getTeamInviteSubject(companyName: string): string {
  return `You've been invited to join ${companyName} on Maksy`
}
