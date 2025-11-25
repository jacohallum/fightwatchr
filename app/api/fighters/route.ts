// app\api\fighters\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { WeightClass } from '@prisma/client';

function normalizeString(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, '');
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const organizationId = searchParams.get('organizationId');
    const weightClass = searchParams.get('weightClass');
    const gender = searchParams.get('gender');
    const minWeight = searchParams.get('minWeight');
    const maxWeight = searchParams.get('maxWeight');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Default to UFC if no organizationId specified
    let orgId = organizationId;
    if (!orgId && weightClass) {
      const ufc = await prisma.organization.findFirst({
        where: { shortName: 'UFC' }
      });
      if (ufc) orgId = ufc.id;
    }

    const where: any = {
      active: true
    };

    if (orgId) {
      where.organizationId = orgId;
    }

    if (gender) {
      where.gender = gender;
    }

    // Search will be handled post-query with normalization
    const searchNormalized = search ? normalizeString(search) : null;

// Get ranked fighters in this weight class
    const rankedFighters = await prisma.fighter.findMany({
      where: {
        ...where,
        ...(weightClass ? {
          rankings: {
            some: {
              active: true,
              weightClass: weightClass as WeightClass,
              ...(orgId ? { organizationId: orgId } : {})
            }
          }
        } : {})
      },
      include: {
        rankings: {
          where: {
            active: true,
            ...(orgId ? { organizationId: orgId } : {}),
            ...(weightClass ? { weightClass: weightClass as WeightClass } : {})
          },
          orderBy: {
            rank: 'asc'
          }
        }
      }
    });

    // Get unranked fighters in weight range (only if weightClass specified with weight bounds)
    let unrankedFighters: typeof rankedFighters = [];
    if (weightClass && minWeight && maxWeight) {
      const rankedIds = rankedFighters.map(f => f.id);
      unrankedFighters = await prisma.fighter.findMany({
        where: {
          id: { notIn: rankedIds },
          weight: {
            gte: parseFloat(minWeight),
            lte: parseFloat(maxWeight)
          },
          ...(gender ? { gender: gender as any } : {}),
        },
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' }
        ],
        include: {
          rankings: {
            where: {
              active: true
            }
          }
        }
      });
    }

    let relevantFighters = [...rankedFighters, ...unrankedFighters];

    // Filter by normalized search
    if (searchNormalized) {
      relevantFighters = relevantFighters.filter(fighter => {
        const firstName = normalizeString(fighter.firstName);
        const lastName = normalizeString(fighter.lastName);
        const nickname = fighter.nickname ? normalizeString(fighter.nickname) : '';
        const fullName = `${firstName} ${lastName}`;
        return firstName.includes(searchNormalized) || 
               lastName.includes(searchNormalized) || 
               nickname.includes(searchNormalized) ||
               fullName.includes(searchNormalized);
      });
    }

    const formattedFighters = relevantFighters
      .map(fighter => {
        const divisionRanking = fighter.rankings[0];

        return {
          ...fighter,
          totalFights: fighter.wins + fighter.losses + fighter.draws + fighter.noContests,
          currentRank: divisionRanking?.rank ?? null,
          isChampion: divisionRanking?.rank === 0,
          rankings: undefined
        };
      })
      .slice(offset, offset + limit);

    return NextResponse.json({
      fighters: formattedFighters,
      pagination: {
        limit,
        total: formattedFighters.length
      }
    });
  } catch (error) {
    console.error('Error fetching fighters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fighters' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      nickname,
      organizationId,
      wins = 0,
      losses = 0,
      draws = 0
    } = body;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const fighter = await prisma.fighter.create({
      data: {
        firstName,
        lastName,
        nickname: nickname || null,
        organizationId,
        wins,
        losses,
        draws
      }
    });

    return NextResponse.json(fighter, { status: 201 });
  } catch (error) {
    console.error('Error creating fighter:', error);
    return NextResponse.json(
      { error: 'Failed to create fighter' },
      { status: 500 }
    );
  }
}