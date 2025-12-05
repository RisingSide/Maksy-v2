/**
 * Email Templates Index
 *
 * Central export for all email templates
 */

// Team templates
export { generateTeamInviteEmail, getTeamInviteSubject } from './team-invite'

// Invoice templates
export {
  generateInvoiceEmail,
  getInvoiceSubject,
  generatePaymentReminderEmail,
  getPaymentReminderSubject,
  generatePaymentConfirmationEmail,
  getPaymentConfirmationSubject,
} from './invoice'

// Estimate templates
export {
  generateEstimateEmail,
  getEstimateSubject,
  generateEstimateApprovedNotification,
  getEstimateApprovedSubject,
} from './estimate'

// Job templates
export {
  generateJobAssignmentEmail,
  getJobAssignmentSubject,
  generateJobReminderEmail,
  getJobReminderSubject,
  generateJobCompletedEmail,
  getJobCompletedSubject,
} from './job'
