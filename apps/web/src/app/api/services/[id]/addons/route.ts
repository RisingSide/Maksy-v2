import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db/index.server'
import { serviceAddOns, services } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: serviceId } = await params

    // First verify the service exists and belongs to the user's company
    const service = await db.query.services.findFirst({
      where: eq(services.id, serviceId),
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Fetch add-ons for this service
    const addons = await db
      .select({
        id: serviceAddOns.id,
        name: serviceAddOns.name,
        price: serviceAddOns.price,
        durationMinutes: serviceAddOns.durationMinutes,
        sortOrder: serviceAddOns.sortOrder,
      })
      .from(serviceAddOns)
      .where(eq(serviceAddOns.serviceId, serviceId))
      .orderBy(serviceAddOns.sortOrder)

    // Convert price to number
    const formattedAddons = addons.map((addon) => ({
      ...addon,
      price: parseFloat(addon.price) || 0,
    }))

    return NextResponse.json(formattedAddons)
  } catch (error) {
    console.error('Error fetching service add-ons:', error)
    return NextResponse.json(
      { error: 'Failed to fetch service add-ons' },
      { status: 500 }
    )
  }
}
