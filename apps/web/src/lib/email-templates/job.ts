/**
 * Job Email Templates
 *
 * Templates for job assignments, reminders, and notifications
 */

interface JobAssignmentEmailProps {
  teamMemberName: string
  companyName: string
  customerName: string
  serviceName: string
  jobDate: string
  jobTime: string
  address?: string
  notes?: string
  dashboardLink: string
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(time: string): string {
  return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function generateJobAssignmentEmail({
  teamMemberName,
  companyName,
  customerName,
  serviceName,
  jobDate,
  jobTime,
  address,
  notes,
  dashboardLink,
}: JobAssignmentEmailProps): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Job Assignment</title>
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
    .logo-text {
      font-size: 24px;
      font-weight: 700;
      color: #f4a125;
      text-align: center;
      display: block;
      margin-bottom: 30px;
    }
    .assignment-banner {
      background: linear-gradient(135deg, #f4a125 0%, #e8941f 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      margin-bottom: 24px;
    }
    .assignment-banner h1 {
      margin: 0;
      font-size: 24px;
    }
    p {
      margin: 0 0 16px;
      color: #4a4a4a;
    }
    .job-details {
      background: #f9f9f9;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
    }
    .job-detail-row {
      display: flex;
      align-items: flex-start;
      padding: 12px 0;
      border-bottom: 1px solid #eee;
    }
    .job-detail-row:last-child {
      border-bottom: none;
    }
    .job-detail-icon {
      width: 24px;
      margin-right: 12px;
      text-align: center;
    }
    .job-detail-content {
      flex: 1;
    }
    .job-detail-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .job-detail-value {
      font-weight: 500;
      color: #1a1a1a;
    }
    .notes-box {
      background: #fef3c7;
      border-left: 4px solid #f4a125;
      padding: 16px;
      margin: 24px 0;
      border-radius: 0 8px 8px 0;
    }
    .notes-label {
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      color: #92400e;
      margin-bottom: 8px;
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
    }
    .button-container {
      text-align: center;
      margin: 24px 0;
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
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <span class="logo-text">${companyName}</span>
      
      <div class="assignment-banner">
        <h1>📋 New Job Assignment</h1>
      </div>
      
      <p>Hi ${teamMemberName},</p>
      
      <p>You've been assigned a new job. Here are the details:</p>
      
      <div class="job-details">
        <div class="job-detail-row">
          <span class="job-detail-icon">👤</span>
          <div class="job-detail-content">
            <div class="job-detail-label">Customer</div>
            <div class="job-detail-value">${customerName}</div>
          </div>
        </div>
        <div class="job-detail-row">
          <span class="job-detail-icon">🔧</span>
          <div class="job-detail-content">
            <div class="job-detail-label">Service</div>
            <div class="job-detail-value">${serviceName}</div>
          </div>
        </div>
        <div class="job-detail-row">
          <span class="job-detail-icon">📅</span>
          <div class="job-detail-content">
            <div class="job-detail-label">Date & Time</div>
            <div class="job-detail-value">${formatDate(jobDate)} at ${formatTime(jobTime)}</div>
          </div>
        </div>
        ${
          address
            ? `
        <div class="job-detail-row">
          <span class="job-detail-icon">📍</span>
          <div class="job-detail-content">
            <div class="job-detail-label">Location</div>
            <div class="job-detail-value">${address}</div>
          </div>
        </div>
        `
            : ''
        }
      </div>
      
      ${
        notes
          ? `
      <div class="notes-box">
        <div class="notes-label">📝 Notes</div>
        <p style="margin: 0; color: #92400e;">${notes}</p>
      </div>
      `
          : ''
      }
      
      <div class="button-container">
        <a href="${dashboardLink}" class="button">View Job Details</a>
      </div>
      
      <div class="footer">
        <p>© ${new Date().getFullYear()} ${companyName}. Powered by Maksy.</p>
      </div>
    </div>
  </div>
</body>
</html>
`
}

export function getJobAssignmentSubject(
  serviceName: string,
  jobDate: string
): string {
  return `📋 New Job: ${serviceName} on ${formatDate(jobDate)}`
}

// Job Reminder for Customer
interface JobReminderEmailProps {
  customerName: string
  companyName: string
  companyPhone?: string
  serviceName: string
  jobDate: string
  jobTime: string
  teamMemberName?: string
  address?: string
}

export function generateJobReminderEmail({
  customerName,
  companyName,
  companyPhone,
  serviceName,
  jobDate,
  jobTime,
  teamMemberName,
  address,
}: JobReminderEmailProps): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Reminder</title>
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
    .logo-text {
      font-size: 24px;
      font-weight: 700;
      color: #f4a125;
      text-align: center;
      display: block;
      margin-bottom: 30px;
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
    .appointment-card {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      padding: 24px;
      border-radius: 12px;
      margin: 24px 0;
      text-align: center;
    }
    .appointment-date {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 8px;
    }
    .appointment-time {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .appointment-service {
      font-size: 16px;
      opacity: 0.9;
    }
    .details-box {
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
    }
    .details-value {
      font-weight: 500;
    }
    .contact-info {
      text-align: center;
      margin-top: 24px;
      padding: 16px;
      background: #fef3c7;
      border-radius: 8px;
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
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <span class="logo-text">${companyName}</span>
      
      <h1>⏰ Appointment Reminder</h1>
      
      <p>Hi ${customerName},</p>
      
      <p>This is a friendly reminder about your upcoming appointment with ${companyName}.</p>
      
      <div class="appointment-card">
        <div class="appointment-date">${formatDate(jobDate)}</div>
        <div class="appointment-time">${formatTime(jobTime)}</div>
        <div class="appointment-service">${serviceName}</div>
      </div>
      
      <div class="details-box">
        ${
          teamMemberName
            ? `
        <div class="details-row">
          <span class="details-label">Your Technician</span>
          <span class="details-value">${teamMemberName}</span>
        </div>
        `
            : ''
        }
        ${
          address
            ? `
        <div class="details-row">
          <span class="details-label">Location</span>
          <span class="details-value">${address}</span>
        </div>
        `
            : ''
        }
      </div>
      
      ${
        companyPhone
          ? `
      <div class="contact-info">
        <p style="margin: 0; color: #92400e;">
          Need to reschedule? Call us at <strong>${companyPhone}</strong>
        </p>
      </div>
      `
          : ''
      }
      
      <div class="footer">
        <p>We look forward to seeing you!</p>
        <p>© ${new Date().getFullYear()} ${companyName}. Powered by Maksy.</p>
      </div>
    </div>
  </div>
</body>
</html>
`
}

export function getJobReminderSubject(
  companyName: string,
  serviceName: string
): string {
  return `⏰ Reminder: Your ${serviceName} appointment with ${companyName}`
}

// Job Completed Email (for customer)
interface JobCompletedEmailProps {
  customerName: string
  companyName: string
  serviceName: string
  completedDate: string
  teamMemberName?: string
  reviewLink?: string
}

export function generateJobCompletedEmail({
  customerName,
  companyName,
  serviceName,
  completedDate,
  teamMemberName,
  reviewLink,
}: JobCompletedEmailProps): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Service Complete!</title>
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
    .logo-text {
      font-size: 24px;
      font-weight: 700;
      color: #f4a125;
      text-align: center;
      display: block;
      margin-bottom: 30px;
    }
    .success-icon {
      text-align: center;
      font-size: 64px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 24px;
      font-weight: 600;
      color: #16a34a;
      margin: 0 0 20px;
      text-align: center;
    }
    p {
      margin: 0 0 16px;
      color: #4a4a4a;
    }
    .summary-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }
    .summary-label {
      color: #666;
    }
    .summary-value {
      font-weight: 500;
    }
    .review-section {
      text-align: center;
      margin: 32px 0;
      padding: 24px;
      background: #f9f9f9;
      border-radius: 12px;
    }
    .review-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .stars {
      font-size: 32px;
      margin: 16px 0;
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
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <span class="logo-text">${companyName}</span>
      
      <div class="success-icon">✅</div>
      <h1>Service Complete!</h1>
      
      <p>Hi ${customerName},</p>
      
      <p>Great news! Your ${serviceName} has been completed. We hope you're satisfied with our work.</p>
      
      <div class="summary-box">
        <div class="summary-row">
          <span class="summary-label">Service</span>
          <span class="summary-value">${serviceName}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Completed On</span>
          <span class="summary-value">${formatDate(completedDate)}</span>
        </div>
        ${
          teamMemberName
            ? `
        <div class="summary-row">
          <span class="summary-label">Technician</span>
          <span class="summary-value">${teamMemberName}</span>
        </div>
        `
            : ''
        }
      </div>
      
      ${
        reviewLink
          ? `
      <div class="review-section">
        <div class="review-title">How did we do?</div>
        <p style="color: #666; margin: 8px 0;">Your feedback helps us improve!</p>
        <div class="stars">⭐⭐⭐⭐⭐</div>
        <a href="${reviewLink}" class="button">Leave a Review</a>
      </div>
      `
          : ''
      }
      
      <div class="footer">
        <p>Thank you for choosing ${companyName}!</p>
        <p>© ${new Date().getFullYear()} ${companyName}. Powered by Maksy.</p>
      </div>
    </div>
  </div>
</body>
</html>
`
}

export function getJobCompletedSubject(
  companyName: string,
  serviceName: string
): string {
  return `✅ Your ${serviceName} is complete - ${companyName}`
}
