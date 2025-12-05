/**
 * Estimate Email Templates
 *
 * Templates for sending estimates and approval notifications
 */

interface EstimateEmailProps {
  customerName: string
  companyName: string
  companyEmail?: string
  companyPhone?: string
  estimateNumber: string
  amount: number
  expiresAt?: string
  lineItems: Array<{
    description: string
    quantity: number
    unitPrice: number
    total: number
  }>
  approveLink?: string
  notes?: string
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function generateEstimateEmail({
  customerName,
  companyName,
  companyEmail,
  companyPhone,
  estimateNumber,
  amount,
  expiresAt,
  lineItems,
  approveLink,
  notes,
}: EstimateEmailProps): string {
  const lineItemsHtml = lineItems
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.description}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.unitPrice)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.total)}</td>
      </tr>
    `
    )
    .join('')

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Estimate ${estimateNumber} from ${companyName}</title>
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
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #3b82f6;
    }
    .logo-text {
      font-size: 24px;
      font-weight: 700;
      color: #f4a125;
    }
    .estimate-badge {
      background: #3b82f6;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    h1 {
      font-size: 28px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0 0 8px;
    }
    .estimate-number {
      font-size: 14px;
      color: #666;
    }
    p {
      margin: 0 0 16px;
      color: #4a4a4a;
    }
    .amount-highlight {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      padding: 24px;
      border-radius: 12px;
      margin: 24px 0;
      text-align: center;
    }
    .amount-label {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 8px;
    }
    .amount-value {
      font-size: 36px;
      font-weight: 700;
    }
    .expires-date {
      font-size: 14px;
      opacity: 0.9;
      margin-top: 8px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
      color: white !important;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin-right: 12px;
    }
    .button-secondary {
      background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
    }
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    .line-items {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
    }
    .line-items th {
      background: #f9f9f9;
      padding: 12px;
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      color: #666;
      border-bottom: 2px solid #eee;
    }
    .line-items th:nth-child(2),
    .line-items th:nth-child(3),
    .line-items th:nth-child(4) {
      text-align: right;
    }
    .line-items th:nth-child(2) {
      text-align: center;
    }
    .total-row {
      font-weight: 600;
      font-size: 16px;
    }
    .total-row td {
      padding-top: 16px;
      border-top: 2px solid #1a1a1a;
    }
    .notes {
      background: #f9f9f9;
      border-radius: 8px;
      padding: 16px;
      margin: 24px 0;
      font-size: 14px;
    }
    .notes-label {
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 8px;
    }
    .company-info {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 14px;
      color: #666;
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
      <div class="header">
        <div>
          <span class="logo-text">${companyName}</span>
        </div>
        <span class="estimate-badge">Estimate</span>
      </div>
      
      <h1>Estimate ${estimateNumber}</h1>
      ${expiresAt ? `<p class="estimate-number">Valid until: ${formatDate(expiresAt)}</p>` : ''}
      
      <p>Hi ${customerName},</p>
      
      <p>Thank you for your interest in our services. Please find your estimate details below.</p>
      
      <div class="amount-highlight">
        <div class="amount-label">Estimated Total</div>
        <div class="amount-value">${formatCurrency(amount)}</div>
        ${expiresAt ? `<div class="expires-date">Valid until ${formatDate(expiresAt)}</div>` : ''}
      </div>
      
      ${
        approveLink
          ? `
      <div class="button-container">
        <a href="${approveLink}" class="button">✓ Approve Estimate</a>
      </div>
      <p style="text-align: center; font-size: 12px; color: #666; margin-top: 8px;">
        Click to approve and we'll get started right away!
      </p>
      `
          : ''
      }
      
      <table class="line-items">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${lineItemsHtml}
          <tr class="total-row">
            <td colspan="3" style="text-align: right; padding: 16px 12px;">Total:</td>
            <td style="text-align: right; padding: 16px 12px;">${formatCurrency(amount)}</td>
          </tr>
        </tbody>
      </table>
      
      ${
        notes
          ? `
      <div class="notes">
        <div class="notes-label">Notes</div>
        <p style="margin: 0;">${notes}</p>
      </div>
      `
          : ''
      }
      
      <div class="company-info">
        <p style="margin: 0;"><strong>${companyName}</strong></p>
        ${companyEmail ? `<p style="margin: 4px 0;">Email: ${companyEmail}</p>` : ''}
        ${companyPhone ? `<p style="margin: 4px 0;">Phone: ${companyPhone}</p>` : ''}
      </div>
      
      <div class="footer">
        <p>Have questions? Reply to this email or give us a call.</p>
        <p>© ${new Date().getFullYear()} ${companyName}. Powered by Maksy.</p>
      </div>
    </div>
  </div>
</body>
</html>
`
}

export function getEstimateSubject(
  companyName: string,
  estimateNumber: string
): string {
  return `Estimate ${estimateNumber} from ${companyName}`
}

// Estimate Approved Notification (sent to company owner)
interface EstimateApprovedNotificationProps {
  ownerName: string
  customerName: string
  estimateNumber: string
  amount: number
  serviceName?: string
  dashboardLink: string
}

export function generateEstimateApprovedNotification({
  ownerName,
  customerName,
  estimateNumber,
  amount,
  serviceName,
  dashboardLink,
}: EstimateApprovedNotificationProps): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Estimate Approved!</title>
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
    .success-banner {
      background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      margin-bottom: 24px;
    }
    .success-banner h1 {
      margin: 0;
      font-size: 24px;
    }
    .success-banner p {
      margin: 8px 0 0;
      opacity: 0.9;
    }
    p {
      margin: 0 0 16px;
      color: #4a4a4a;
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
      <span class="logo-text">Maksy</span>
      
      <div class="success-banner">
        <h1>🎉 Estimate Approved!</h1>
        <p>Great news - a customer approved your estimate</p>
      </div>
      
      <p>Hi ${ownerName},</p>
      
      <p><strong>${customerName}</strong> has approved estimate <strong>${estimateNumber}</strong>. Time to get to work!</p>
      
      <div class="details-box">
        <div class="details-row">
          <span class="details-label">Customer</span>
          <span class="details-value">${customerName}</span>
        </div>
        <div class="details-row">
          <span class="details-label">Estimate</span>
          <span class="details-value">${estimateNumber}</span>
        </div>
        ${
          serviceName
            ? `
        <div class="details-row">
          <span class="details-label">Service</span>
          <span class="details-value">${serviceName}</span>
        </div>
        `
            : ''
        }
        <div class="details-row">
          <span class="details-label">Amount</span>
          <span class="details-value">${formatCurrency(amount)}</span>
        </div>
      </div>
      
      <div class="button-container">
        <a href="${dashboardLink}" class="button">View in Dashboard</a>
      </div>
      
      <p style="font-size: 14px; color: #666;">
        <strong>Next steps:</strong> Convert this estimate to a job and schedule it with the customer.
      </p>
      
      <div class="footer">
        <p>© ${new Date().getFullYear()} Maksy. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`
}

export function getEstimateApprovedSubject(
  customerName: string,
  estimateNumber: string
): string {
  return `🎉 ${customerName} approved estimate ${estimateNumber}!`
}
