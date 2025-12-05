/**
 * Unified Notification System
 *
 * Handles sending notifications via email, SMS, and push
 */

import { sendEmail } from './resend'
import { sendSms } from './sms'
import {
  generateInvoiceEmail,
  getInvoiceSubject,
  generatePaymentReminderEmail,
  getPaymentReminderSubject,
  generatePaymentConfirmationEmail,
  getPaymentConfirmationSubject,
  generateEstimateEmail,
  getEstimateSubject,
  generateEstimateApprovedNotification,
  getEstimateApprovedSubject,
  generateJobAssignmentEmail,
  getJobAssignmentSubject,
  generateJobReminderEmail,
  getJobReminderSubject,
  generateJobCompletedEmail,
  getJobCompletedSubject,
} from './email-templates'

// Types
interface NotificationResult {
  success: boolean
  channel: 'email' | 'sms'
  error?: string
}

interface BaseNotificationOptions {
  channels?: ('email' | 'sms')[]
}

// ============================================
// INVOICE NOTIFICATIONS
// ============================================

interface SendInvoiceNotificationOptions extends BaseNotificationOptions {
  customerEmail: string
  customerPhone?: string
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

export async function sendInvoiceNotification(
  options: SendInvoiceNotificationOptions
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = []
  const channels = options.channels || ['email']

  // Send email
  if (channels.includes('email')) {
    const html = generateInvoiceEmail({
      customerName: options.customerName,
      companyName: options.companyName,
      companyEmail: options.companyEmail,
      companyPhone: options.companyPhone,
      invoiceNumber: options.invoiceNumber,
      amount: options.amount,
      dueDate: options.dueDate,
      lineItems: options.lineItems,
      paymentLink: options.paymentLink,
      notes: options.notes,
    })

    const emailResult = await sendEmail({
      to: options.customerEmail,
      subject: getInvoiceSubject(options.companyName, options.invoiceNumber),
      html,
    })

    results.push({
      success: emailResult.success,
      channel: 'email',
      error: emailResult.error,
    })
  }

  // Send SMS
  if (channels.includes('sms') && options.customerPhone) {
    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount)

    const message = options.paymentLink
      ? `${options.companyName}: Invoice ${options.invoiceNumber} for ${formatCurrency(options.amount)} is ready. Pay now: ${options.paymentLink}`
      : `${options.companyName}: Invoice ${options.invoiceNumber} for ${formatCurrency(options.amount)} is ready. Due: ${new Date(options.dueDate).toLocaleDateString()}`

    const smsResult = await sendSms({
      to: options.customerPhone,
      message,
    })

    results.push({
      success: smsResult.success,
      channel: 'sms',
      error: smsResult.error,
    })
  }

  return results
}

// Payment Reminder
interface SendPaymentReminderOptions extends BaseNotificationOptions {
  customerEmail: string
  customerPhone?: string
  customerName: string
  companyName: string
  invoiceNumber: string
  amount: number
  dueDate: string
  daysOverdue?: number
  paymentLink?: string
}

export async function sendPaymentReminder(
  options: SendPaymentReminderOptions
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = []
  const channels = options.channels || ['email']
  const isOverdue = options.daysOverdue && options.daysOverdue > 0

  if (channels.includes('email')) {
    const html = generatePaymentReminderEmail({
      customerName: options.customerName,
      companyName: options.companyName,
      invoiceNumber: options.invoiceNumber,
      amount: options.amount,
      dueDate: options.dueDate,
      daysOverdue: options.daysOverdue,
      paymentLink: options.paymentLink,
    })

    const emailResult = await sendEmail({
      to: options.customerEmail,
      subject: getPaymentReminderSubject(
        options.companyName,
        options.invoiceNumber,
        !!isOverdue
      ),
      html,
    })

    results.push({
      success: emailResult.success,
      channel: 'email',
      error: emailResult.error,
    })
  }

  if (channels.includes('sms') && options.customerPhone) {
    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount)

    const message = isOverdue
      ? `${options.companyName}: Invoice ${options.invoiceNumber} (${formatCurrency(options.amount)}) is ${options.daysOverdue} days overdue. ${options.paymentLink ? `Pay now: ${options.paymentLink}` : 'Please remit payment.'}`
      : `${options.companyName}: Reminder - Invoice ${options.invoiceNumber} (${formatCurrency(options.amount)}) is due soon. ${options.paymentLink ? `Pay: ${options.paymentLink}` : ''}`

    const smsResult = await sendSms({
      to: options.customerPhone,
      message,
    })

    results.push({
      success: smsResult.success,
      channel: 'sms',
      error: smsResult.error,
    })
  }

  return results
}

// Payment Confirmation
interface SendPaymentConfirmationOptions extends BaseNotificationOptions {
  customerEmail: string
  customerPhone?: string
  customerName: string
  companyName: string
  invoiceNumber: string
  amount: number
  paymentDate: string
  paymentMethod?: string
}

export async function sendPaymentConfirmation(
  options: SendPaymentConfirmationOptions
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = []
  const channels = options.channels || ['email']

  if (channels.includes('email')) {
    const html = generatePaymentConfirmationEmail({
      customerName: options.customerName,
      companyName: options.companyName,
      invoiceNumber: options.invoiceNumber,
      amount: options.amount,
      paymentDate: options.paymentDate,
      paymentMethod: options.paymentMethod,
    })

    const emailResult = await sendEmail({
      to: options.customerEmail,
      subject: getPaymentConfirmationSubject(options.companyName),
      html,
    })

    results.push({
      success: emailResult.success,
      channel: 'email',
      error: emailResult.error,
    })
  }

  if (channels.includes('sms') && options.customerPhone) {
    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount)

    const smsResult = await sendSms({
      to: options.customerPhone,
      message: `${options.companyName}: Payment of ${formatCurrency(options.amount)} received for invoice ${options.invoiceNumber}. Thank you!`,
    })

    results.push({
      success: smsResult.success,
      channel: 'sms',
      error: smsResult.error,
    })
  }

  return results
}

// ============================================
// ESTIMATE NOTIFICATIONS
// ============================================

interface SendEstimateNotificationOptions extends BaseNotificationOptions {
  customerEmail: string
  customerPhone?: string
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

export async function sendEstimateNotification(
  options: SendEstimateNotificationOptions
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = []
  const channels = options.channels || ['email']

  if (channels.includes('email')) {
    const html = generateEstimateEmail({
      customerName: options.customerName,
      companyName: options.companyName,
      companyEmail: options.companyEmail,
      companyPhone: options.companyPhone,
      estimateNumber: options.estimateNumber,
      amount: options.amount,
      expiresAt: options.expiresAt,
      lineItems: options.lineItems,
      approveLink: options.approveLink,
      notes: options.notes,
    })

    const emailResult = await sendEmail({
      to: options.customerEmail,
      subject: getEstimateSubject(options.companyName, options.estimateNumber),
      html,
    })

    results.push({
      success: emailResult.success,
      channel: 'email',
      error: emailResult.error,
    })
  }

  if (channels.includes('sms') && options.customerPhone) {
    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount)

    const message = options.approveLink
      ? `${options.companyName}: Your estimate ${options.estimateNumber} for ${formatCurrency(options.amount)} is ready. View & approve: ${options.approveLink}`
      : `${options.companyName}: Your estimate ${options.estimateNumber} for ${formatCurrency(options.amount)} is ready. Check your email for details.`

    const smsResult = await sendSms({
      to: options.customerPhone,
      message,
    })

    results.push({
      success: smsResult.success,
      channel: 'sms',
      error: smsResult.error,
    })
  }

  return results
}

// Estimate Approved (notify owner)
interface SendEstimateApprovedOptions {
  ownerEmail: string
  ownerName: string
  customerName: string
  estimateNumber: string
  amount: number
  serviceName?: string
  dashboardLink: string
}

export async function sendEstimateApprovedNotification(
  options: SendEstimateApprovedOptions
): Promise<NotificationResult> {
  const html = generateEstimateApprovedNotification({
    ownerName: options.ownerName,
    customerName: options.customerName,
    estimateNumber: options.estimateNumber,
    amount: options.amount,
    serviceName: options.serviceName,
    dashboardLink: options.dashboardLink,
  })

  const emailResult = await sendEmail({
    to: options.ownerEmail,
    subject: getEstimateApprovedSubject(
      options.customerName,
      options.estimateNumber
    ),
    html,
  })

  return {
    success: emailResult.success,
    channel: 'email',
    error: emailResult.error,
  }
}

// ============================================
// JOB NOTIFICATIONS
// ============================================

interface SendJobAssignmentOptions {
  teamMemberEmail: string
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

export async function sendJobAssignmentNotification(
  options: SendJobAssignmentOptions
): Promise<NotificationResult> {
  const html = generateJobAssignmentEmail({
    teamMemberName: options.teamMemberName,
    companyName: options.companyName,
    customerName: options.customerName,
    serviceName: options.serviceName,
    jobDate: options.jobDate,
    jobTime: options.jobTime,
    address: options.address,
    notes: options.notes,
    dashboardLink: options.dashboardLink,
  })

  const emailResult = await sendEmail({
    to: options.teamMemberEmail,
    subject: getJobAssignmentSubject(options.serviceName, options.jobDate),
    html,
  })

  return {
    success: emailResult.success,
    channel: 'email',
    error: emailResult.error,
  }
}

// Job Reminder (for customer)
interface SendJobReminderOptions extends BaseNotificationOptions {
  customerEmail: string
  customerPhone?: string
  customerName: string
  companyName: string
  companyPhone?: string
  serviceName: string
  jobDate: string
  jobTime: string
  teamMemberName?: string
  address?: string
}

export async function sendJobReminderNotification(
  options: SendJobReminderOptions
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = []
  const channels = options.channels || ['email', 'sms']

  if (channels.includes('email')) {
    const html = generateJobReminderEmail({
      customerName: options.customerName,
      companyName: options.companyName,
      companyPhone: options.companyPhone,
      serviceName: options.serviceName,
      jobDate: options.jobDate,
      jobTime: options.jobTime,
      teamMemberName: options.teamMemberName,
      address: options.address,
    })

    const emailResult = await sendEmail({
      to: options.customerEmail,
      subject: getJobReminderSubject(options.companyName, options.serviceName),
      html,
    })

    results.push({
      success: emailResult.success,
      channel: 'email',
      error: emailResult.error,
    })
  }

  if (channels.includes('sms') && options.customerPhone) {
    const formatDate = (date: string) =>
      new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    const formatTime = (time: string) =>
      new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })

    const smsResult = await sendSms({
      to: options.customerPhone,
      message: `${options.companyName}: Reminder - Your ${options.serviceName} is scheduled for ${formatDate(options.jobDate)} at ${formatTime(options.jobTime)}. ${options.companyPhone ? `Questions? Call ${options.companyPhone}` : ''}`,
    })

    results.push({
      success: smsResult.success,
      channel: 'sms',
      error: smsResult.error,
    })
  }

  return results
}

// Job Completed (for customer)
interface SendJobCompletedOptions extends BaseNotificationOptions {
  customerEmail: string
  customerPhone?: string
  customerName: string
  companyName: string
  serviceName: string
  completedDate: string
  teamMemberName?: string
  reviewLink?: string
}

export async function sendJobCompletedNotification(
  options: SendJobCompletedOptions
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = []
  const channels = options.channels || ['email', 'sms']

  if (channels.includes('email')) {
    const html = generateJobCompletedEmail({
      customerName: options.customerName,
      companyName: options.companyName,
      serviceName: options.serviceName,
      completedDate: options.completedDate,
      teamMemberName: options.teamMemberName,
      reviewLink: options.reviewLink,
    })

    const emailResult = await sendEmail({
      to: options.customerEmail,
      subject: getJobCompletedSubject(options.companyName, options.serviceName),
      html,
    })

    results.push({
      success: emailResult.success,
      channel: 'email',
      error: emailResult.error,
    })
  }

  if (channels.includes('sms') && options.customerPhone) {
    const message = options.reviewLink
      ? `${options.companyName}: Your ${options.serviceName} is complete! How did we do? Leave a review: ${options.reviewLink}`
      : `${options.companyName}: Your ${options.serviceName} is complete! Thank you for your business.`

    const smsResult = await sendSms({
      to: options.customerPhone,
      message,
    })

    results.push({
      success: smsResult.success,
      channel: 'sms',
      error: smsResult.error,
    })
  }

  return results
}
