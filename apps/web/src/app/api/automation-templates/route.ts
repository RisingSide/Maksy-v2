/**
 * Automation Templates API
 *
 * GET /api/automation-templates - List all available templates
 * POST /api/automation-templates/[id]/use - Create automation from template
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helpers'
import { automationTemplates } from '@/db/seeds/automation-templates'

export async function GET(request: NextRequest) {
  try {
    // Authenticate with Clerk
    const context = await getAuthContext()

    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query params for filtering
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    // Filter templates by category if specified
    let templates = automationTemplates
    if (category) {
      templates = templates.filter((t) => t.category === category)
    }

    // Return template list (without full workflow_config to keep response light)
    const templateList = templates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      icon: t.icon,
      usage_count: t.usage_count,
    }))

    return NextResponse.json({
      templates: templateList,
      total: templateList.length,
    })
  } catch (error) {
    console.error('Error fetching automation templates:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
