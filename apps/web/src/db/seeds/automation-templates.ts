/**
 * Automation Template Seeds
 *
 * Pre-built automation workflows that Scale tier users can activate
 *
 * Categories:
 * - follow_up: Follow-up sequences
 * - onboarding: Customer onboarding flows
 * - workflow: Job/service workflows
 * - reactivation: Re-engagement campaigns
 * - upsell: Cross-sell and upsell sequences
 */

export const automationTemplates = [
  // Template 1: Estimate Follow-up
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Estimate Follow-up',
    description:
      "Automatically follow up on estimates that haven't been approved within 3 days",
    category: 'follow_up',
    icon: 'FileText',
    workflow_config: {
      trigger: {
        type: 'estimate_sent',
        conditions: {},
      },
      actions: [
        {
          type: 'delay',
          duration_minutes: 4320, // 3 days
        },
        {
          type: 'check_condition',
          condition: 'estimate_status',
          equals: 'sent', // Only continue if still not approved
        },
        {
          type: 'send_email',
          template:
            "Hey {{Customer_FirstName}},\n\nJust following up on the estimate we sent for {{Service_Name}}. Do you have any questions?\n\nWe'd love to get you on the schedule!\n\n{{Company_Name}}\n{{Company_Phone}}",
          to: 'customer_email',
          subject: 'Following up on your estimate',
        },
        {
          type: 'delay',
          duration_minutes: 5760, // 4 more days
        },
        {
          type: 'check_condition',
          condition: 'estimate_status',
          equals: 'sent',
        },
        {
          type: 'send_email',
          template:
            "Hi {{Customer_FirstName}},\n\nThis is our final follow-up on your estimate. If you're still interested, just let us know!\n\nWe're here to help.\n\nBest,\n{{Company_Name}}",
          to: 'customer_email',
          subject: 'Last chance: Your estimate is waiting',
        },
      ],
    },
    is_system_template: true,
    usage_count: 0,
  },

  // Template 2: New Job Workflow
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'New Job Workflow',
    description:
      'Complete workflow for new jobs: assign team, send confirmations, reminders, and request reviews',
    category: 'workflow',
    icon: 'Briefcase',
    workflow_config: {
      trigger: {
        type: 'job_created',
        conditions: {},
      },
      actions: [
        {
          type: 'send_sms',
          template:
            'New job assigned: {{Service_Name}} for {{Customer_FirstName}} {{Customer_LastName}} on {{Job_Date}} at {{Job_Time}}. Address: {{Customer_Address}}',
          to: 'assigned_team_member',
        },
        {
          type: 'send_email',
          template:
            "Hi {{Customer_FirstName}},\n\nWe've scheduled your {{Service_Name}} for {{Job_Date}} at {{Job_Time}}.\n\nYour technician {{Team_Member_Name}} will be there!\n\n{{Company_Name}}",
          to: 'customer_email',
          subject: 'Job Confirmed: {{Service_Name}}',
        },
        {
          type: 'delay',
          duration_minutes: -1440, // 24 hours before job
          relative_to: 'job_scheduled_time',
        },
        {
          type: 'send_sms',
          template:
            'Reminder: {{Company_Name}} will be at your property tomorrow at {{Job_Time}} for {{Service_Name}}. See you then!',
          to: 'customer_phone',
        },
        {
          type: 'wait_for_event',
          event: 'job_completed',
        },
        {
          type: 'delay',
          duration_minutes: 60, // 1 hour after completion
        },
        {
          type: 'send_sms',
          template:
            "Hey {{Customer_FirstName}}! Thanks for choosing {{Company_Name}}. We'd love your feedback: {{Company_GoogleReviewLink}}",
          to: 'customer_phone',
        },
      ],
    },
    is_system_template: true,
    usage_count: 0,
  },

  // Template 3: Customer Onboarding
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Customer Onboarding',
    description:
      'Welcome new customers with a branded introduction and intake process',
    category: 'onboarding',
    icon: 'UserPlus',
    workflow_config: {
      trigger: {
        type: 'customer_added',
        conditions: {},
      },
      actions: [
        {
          type: 'send_email',
          template:
            "Welcome to {{Company_Name}}!\n\nWe're excited to have you as a customer, {{Customer_FirstName}}.\n\nTo better serve you, please take a moment to fill out our quick intake form: {{Intake_Form_Link}}\n\nLooking forward to working with you!\n\nBest,\n{{Company_Name}} Team",
          to: 'customer_email',
          subject: 'Welcome to {{Company_Name}}!',
        },
        {
          type: 'create_task',
          task_title:
            'Follow up with new customer: {{Customer_FirstName}} {{Customer_LastName}}',
          task_description:
            'Ensure intake form is completed and schedule first service',
          assign_to: 'owner',
          due_in_days: 3,
        },
        {
          type: 'delay',
          duration_minutes: 10080, // 7 days
        },
        {
          type: 'send_email',
          template:
            "Hi {{Customer_FirstName}},\n\nHow are things going? We just wanted to check in and see if there's anything we can help you with.\n\nFeel free to reach out anytime!\n\n{{Company_Name}}\n{{Company_Phone}}",
          to: 'customer_email',
          subject: 'How can we help?',
        },
      ],
    },
    is_system_template: true,
    usage_count: 0,
  },

  // Template 4: Inactive Customer Reactivation
  {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'Inactive Customer Reactivation',
    description:
      "Re-engage customers who haven't booked in 90+ days with personalized outreach",
    category: 'reactivation',
    icon: 'RefreshCw',
    workflow_config: {
      trigger: {
        type: 'customer_inactive',
        conditions: {
          days_since_last_job: 90,
        },
      },
      actions: [
        {
          type: 'send_email',
          template:
            "Hi {{Customer_FirstName}},\n\nWe miss you at {{Company_Name}}!\n\nIt's been a while since we last served you. We wanted to reach out and see if you need any help with {{Service_Name}} or any of our other services.\n\nAs a thank you for being a valued customer, we'd like to offer you 10% off your next service.\n\nLet us know if we can help!\n\nBest,\n{{Company_Name}}",
          to: 'customer_email',
          subject: 'We miss you, {{Customer_FirstName}}!',
        },
        {
          type: 'delay',
          duration_minutes: 10080, // 7 days
        },
        {
          type: 'check_condition',
          condition: 'new_job_created',
          equals: false, // Only continue if they didn't book
        },
        {
          type: 'send_sms',
          template:
            '{{Customer_FirstName}}, did you see our special offer? 10% off your next service with {{Company_Name}}. Book now: {{Booking_Link}}',
          to: 'customer_phone',
        },
      ],
    },
    is_system_template: true,
    usage_count: 0,
  },

  // Template 5: Upsell After Service
  {
    id: '00000000-0000-0000-0000-000000000005',
    name: 'Upsell After Service',
    description:
      'Suggest related services 24 hours after job completion to drive additional revenue',
    category: 'upsell',
    icon: 'TrendingUp',
    workflow_config: {
      trigger: {
        type: 'job_completed',
        conditions: {},
      },
      actions: [
        {
          type: 'delay',
          duration_minutes: 1440, // 24 hours
        },
        {
          type: 'ai_analyze',
          analysis_type: 'suggest_related_services',
          input_data: {
            completed_service: '{{Service_Name}}',
            customer_history: '{{Customer_Previous_Services}}',
          },
        },
        {
          type: 'send_email',
          template:
            "Hi {{Customer_FirstName}},\n\nWe're glad we could help with your {{Service_Name}}!\n\nBased on the work we just completed, you might also benefit from:\n\n{{AI_Suggested_Services}}\n\nMany of our customers find these services helpful. Would you like to schedule one?\n\nJust reply to this email or give us a call!\n\n{{Company_Name}}\n{{Company_Phone}}",
          to: 'customer_email',
          subject: 'More ways we can help',
        },
        {
          type: 'create_task',
          task_title:
            'Follow up on upsell opportunity: {{Customer_FirstName}} {{Customer_LastName}}',
          task_description:
            'Customer received upsell email for {{AI_Suggested_Services}}',
          assign_to: 'owner',
          due_in_days: 5,
        },
      ],
    },
    is_system_template: true,
    usage_count: 0,
  },
]
