/**
 * Invoice Email Templates
 *
 * Templates for sending invoices and payment reminders
 */

interface InvoiceEmailProps {
  customerName: string
  companyName: string
  companyEmail?: string
  companyPhone?: string
  invoiceNumber: string
  amount: number
  dueDate: string
  lineItems: Array<{
    description: string
    quantity: number
    unitPrice: number
    total: number
  }>
  paymentLink?: string
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

export function generateInvoiceEmail({
  customerName,
  companyName,
  companyEmail,
  companyPhone,
  invoiceNumber,
  amount,
  dueDate,
  lineItems,
  paymentLink,
  notes,
}: InvoiceEmailProps): string {
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

  const paymentButton = paymentLink
    ? `
      <div class="button-container">
        <a href="${paymentLink}" class="button">Pay Now - ${formatCurrency(amount)}</a>
      </div>
      <p style="text-align: center; font-size: 12px; color: #666; margin-top: 8px;">
        Secure payment powered by Stripe
      </p>
    `
    : ''

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoiceNumber} from ${companyName}</title>
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
      border-bottom: 2px solid #f4a125;
    }
    .logo-text {
      font-size: 24px;
      font-weight: 700;
      color: #f4a125;
    }
    .invoice-badge {
      background: #f4a125;
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
    .invoice-number {
      font-size: 14px;
      color: #666;
    }
    p {
      margin: 0 0 16px;
      color: #4a4a4a;
    }
    .amount-highlight {
      background: linear-gradient(135deg, #f4a125 0%, #e8941f 100%);
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
    .due-date {
      font-size: 14px;
      opacity: 0.9;
      margin-top: 8px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #f4a125 0%, #e8941f 100%);
      color: white !important;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
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
        <span class="invoice-badge">Invoice</span>
      </div>
      
      <h1>Invoice ${invoiceNumber}</h1>
      <p class="invoice-number">Due: ${formatDate(dueDate)}</p>
      
      <p>Hi ${customerName},</p>
      
      <p>Please find your invoice details below. ${paymentLink ? 'Click the button to pay securely online.' : 'Please remit payment at your earliest convenience.'}</p>
      
      <div class="amount-highlight">
        <div class="amount-label">Amount Due</div>
        <div class="amount-value">${formatCurrency(amount)}</div>
        <div class="due-date">Due by ${formatDate(dueDate)}</div>
      </div>
      
      ${paymentButton}
      
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
        <p>Thank you for your business!</p>
        <p>© ${new Date().getFullYear()} ${companyName}. Powered by Maksy.</p>
      </div>
    </div>
  </div>
</body>
</html>
`
}

export function getInvoiceSubject(
  companyName: string,
  invoiceNumber: string
): string {
  return `Invoice ${invoiceNumber} from ${companyName}`
}

// Payment Reminder Template
interface PaymentReminderProps {
  customerName: string
  companyName: string
  invoiceNumber: string
  amount: number
  dueDate: string
  daysOverdue?: number
  paymentLink?: string
}

export function generatePaymentReminderEmail({
  customerName,
  companyName,
  invoiceNumber,
  amount,
  dueDate,
  daysOverdue,
  paymentLink,
}: PaymentReminderProps): string {
  const isOverdue = daysOverdue && daysOverdue > 0
  const urgencyColor = isOverdue ? '#dc2626' : '#f4a125'
  const statusText = isOverdue ? `${daysOverdue} days overdue` : 'Due soon'

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Reminder - Invoice ${invoiceNumber}</title>
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
    .status-badge {
      display: inline-block;
      background: ${urgencyColor};
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .amount-box {
      background: #f9f9f9;
      border-left: 4px solid ${urgencyColor};
      padding: 20px;
      margin: 24px 0;
    }
    .amount-value {
      font-size: 28px;
      font-weight: 700;
      color: #1a1a1a;
    }
    .button {
      display: inline-block;
      background: ${urgencyColor};
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
      
      <h1>Payment Reminder</h1>
      
      <p style="text-align: center;">
        <span class="status-badge">${statusText}</span>
      </p>
      
      <p>Hi ${customerName},</p>
      
      <p>This is a friendly reminder that payment for invoice <strong>${invoiceNumber}</strong> ${isOverdue ? 'was' : 'is'} due on <strong>${formatDate(dueDate)}</strong>.</p>
      
      <div class="amount-box">
        <div style="font-size: 14px; color: #666; margin-bottom: 4px;">Amount Due</div>
        <div class="amount-value">${formatCurrency(amount)}</div>
      </div>
      
      ${
        paymentLink
          ? `
      <div class="button-container">
        <a href="${paymentLink}" class="button">Pay Now</a>
      </div>
      `
          : ''
      }
      
      <p>If you've already sent payment, please disregard this reminder. If you have any questions about this invoice, please don't hesitate to reach out.</p>
      
      <div class="footer">
        <p>Thank you for your prompt attention to this matter.</p>
        <p>© ${new Date().getFullYear()} ${companyName}. Powered by Maksy.</p>
      </div>
    </div>
  </div>
</body>
</html>
`
}

export function getPaymentReminderSubject(
  companyName: string,
  invoiceNumber: string,
  isOverdue: boolean
): string {
  return isOverdue
    ? `⚠️ Overdue: Invoice ${invoiceNumber} from ${companyName}`
    : `Reminder: Invoice ${invoiceNumber} from ${companyName}`
}

// Payment Confirmation Template
interface PaymentConfirmationProps {
  customerName: string
  companyName: string
  invoiceNumber: string
  amount: number
  paymentDate: string
  paymentMethod?: string
}

export function generatePaymentConfirmationEmail({
  customerName,
  companyName,
  invoiceNumber,
  amount,
  paymentDate,
  paymentMethod = 'Card',
}: PaymentConfirmationProps): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Received - ${companyName}</title>
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
      font-size: 48px;
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
    .receipt-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
    }
    .receipt-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #dcfce7;
    }
    .receipt-row:last-child {
      border-bottom: none;
      padding-top: 16px;
      font-weight: 600;
      font-size: 18px;
    }
    .receipt-label {
      color: #666;
    }
    .receipt-value {
      font-weight: 500;
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
      <h1>Payment Received!</h1>
      
      <p>Hi ${customerName},</p>
      
      <p>We've received your payment. Thank you for your business!</p>
      
      <div class="receipt-box">
        <div class="receipt-row">
          <span class="receipt-label">Invoice</span>
          <span class="receipt-value">${invoiceNumber}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Payment Date</span>
          <span class="receipt-value">${formatDate(paymentDate)}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Payment Method</span>
          <span class="receipt-value">${paymentMethod}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Amount Paid</span>
          <span class="receipt-value">${formatCurrency(amount)}</span>
        </div>
      </div>
      
      <p>This email serves as your payment confirmation. Please keep it for your records.</p>
      
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

export function getPaymentConfirmationSubject(companyName: string): string {
  return `✅ Payment Received - ${companyName}`
}
