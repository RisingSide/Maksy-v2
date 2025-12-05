/**
 * Use Automation Template API
 *
 * POST /api/automation-templates/[id]/use
 * Creates a new automation based on a template
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { automationTemplates } from '@/db/seeds/automation-templates'
import { getFeatureAccess } from '@/lib/feature-gates'
import { db } from '@/db/index.server'
import { automations } from '@/db/schema'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate with Clerk
    const context = await getAuthContext()

    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params

    const { companyId, planType } = context

    // Check if user has access to automation templates (Scale tier only)
    if (!getFeatureAccess(planType, 'automationTemplates')) {
      return NextResponse.json(
        { error: 'Automation templates are only available on the Scale plan' },
        { status: 403 }
      )
    }

    // Find the template
    const template = automationTemplates.find((t) => t.id === id)
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Get customization from request body (optional)
    const body = await request.json()
    const customName = body.name || template.name

    // Create automation from template using Drizzle
    const [automation] = await db
      .insert(automations)
      .values({
        companyId,
        name: customName,
        type: 'stock', // Templates are treated as stock automations
        stockType: template.category,
        isActive: true,
        triggerEvent: template.workflow_config.trigger.type,
        workflowConfig: template.workflow_config,
      })
      .returning()

    // TODO: Increment template usage_count (when we move templates to database)

    return NextResponse.json({
      automation,
      message: 'Automation created successfully from template',
    })
  } catch (error) {
    console.error('Error using automation template:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
