import { inngest } from './client'

/**
 * Example: Send a welcome email when a user signs up
 * Call this after creating a user in your database
 */
export async function sendUserCreatedEvent(userId: string, email: string) {
  await inngest.send({
    name: 'user/created',
    data: {
      userId,
      email,
    },
  })
}

/**
 * Example: Process a payment after checkout
 */
export async function sendCheckoutCompletedEvent(
  customerId: string,
  amount: number
) {
  await inngest.send({
    name: 'checkout/completed',
    data: {
      customerId,
      amount,
    },
  })
}

/**
 * Example: Schedule a reminder for later
 */
export async function sendScheduleReminderEvent(
  message: string,
  sendAt: string | Date
) {
  await inngest.send({
    name: 'reminder/scheduled',
    data: {
      message,
      sendAt,
    },
  })
}
