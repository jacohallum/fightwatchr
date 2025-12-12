import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch next 5 upcoming events with fight counts
    const events = await prisma.event.findMany({
      where: {
        date: { gte: new Date() }
      },
      orderBy: {
        date: 'asc'
      },
      take: 5,
      select: {
        id: true,
        name: true,
        date: true,
        venue: true,
        city: true,
        state: true,
        country: true,
        eventType: true,
        _count: {
          select: {
            fights: true
          }
        }
      }
    })

    // Format the response
    const formattedEvents = events.map(event => ({
      id: event.id,
      name: event.name,
      date: event.date.toISOString(),
      location: [event.city, event.state, event.country]
        .filter(Boolean)
        .join(', '),
      venue: event.venue,
      eventType: event.eventType,
      fightCount: event._count.fights
    }))

    return NextResponse.json({ events: formattedEvents })
  } catch (error) {
    console.error('Error fetching upcoming events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch upcoming events' },
      { status: 500 }
    )
  }
}