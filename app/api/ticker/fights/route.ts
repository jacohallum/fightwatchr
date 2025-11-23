//fightwatchr\app\api\ticker\fights\route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    const twoMonthsAhead = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    // Get upcoming fights only (next 2 months)
    const upcomingFights = await prisma.fight.findMany({
      where: {
        status: 'SCHEDULED',
        event: {
          date: {
            gte: now,
            lte: twoMonthsAhead
          }
        }
      },
      include: {
        fighter1: { select: { firstName: true, lastName: true } },
        fighter2: { select: { firstName: true, lastName: true } },
        event: { select: { name: true, date: true, organization: { select: { shortName: true } } } }
      },
      orderBy: { event: { date: 'asc' } },
      take: 30
    });

    console.log('🎯 Ticker API: Found', upcomingFights.length, 'upcoming fights')
    console.log('   Date range:', now.toISOString(), 'to', twoMonthsAhead.toISOString())
    
    const tickerItems = upcomingFights.map(fight => {
      const eventDate = new Date(fight.event.date);
      const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        org: fight.event.organization.shortName,
        fighter1: `${fight.fighter1.lastName}`,
        fighter2: `${fight.fighter2.lastName}`,
        status: fight.isMainEvent 
          ? `MAIN EVENT (${daysUntil}d)` 
          : fight.isCoMainEvent 
          ? `CO-MAIN (${daysUntil}d)` 
          : `${daysUntil} DAYS`,
        isCompleted: false
      };
    });

    return NextResponse.json({ items: tickerItems });
  } catch (error) {
    console.error('Error fetching ticker fights:', error);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}