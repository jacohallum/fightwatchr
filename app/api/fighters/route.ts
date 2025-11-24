// app\api\fighters\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { WeightClass } from '@prisma/client';

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

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { nickname: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Debug: Log the exact WHERE clause being built
    console.log('\n🔧 Building query with:');
    console.log('  where:', JSON.stringify(where, null, 2));
    console.log('  weightClass:', weightClass);
    console.log('  orgId:', orgId);
    console.log('  rankings.some filter:', JSON.stringify({
      active: true,
      weightClass: weightClass,
      ...(orgId ? { organizationId: orgId } : {})
    }, null, 2));

    // Get fighters with their rankings filtered by weight class
    const fighters = await prisma.fighter.findMany({
      where: {
        ...where,
        // Get fighters who EITHER have rankings in this division OR fall in weight range
        ...(weightClass && minWeight && maxWeight ? {
          OR: [
            // Has ranking in this division
            {
              rankings: {
                some: {
                  active: true,
                  weightClass: weightClass as WeightClass,
                  ...(orgId ? { organizationId: orgId } : {})
                }
              }
            },
            // OR is in the weight range (for unranked fighters)
            {
              weight: {
                gte: parseInt(minWeight),
                lte: parseInt(maxWeight)
              }
            }
          ]
        } : weightClass ? {
          // If no weight range provided, only get ranked fighters
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


    // TEMP DEBUG – inspect rankings coming from Prisma
    if (weightClass) {
      const sampleWithRank = fighters
        .filter(f => f.rankings && f.rankings.length > 0)
        .slice(0, 5);

      console.log('==== RANKING DEBUG ====');
      console.log('WeightClass:', weightClass, 'Gender:', gender, 'OrgId:', orgId);
      console.log('Total fighters returned:', fighters.length);
      console.log('Fighters with rankings:', sampleWithRank.length);
      for (const f of sampleWithRank) {
        console.log(
          `  ${f.firstName} ${f.lastName} ->`,
          f.rankings.map(r => `(${r.weightClass} org=${r.organizationId} rank=${r.rank})`)
        );
      }
      console.log('=======================');
    }

    // Only include fighters who have rankings in this specific division OR fall in weight range
    const relevantFighters = weightClass
      ? fighters.filter(fighter => {
          // Has ranking in this specific division
          if (fighter.rankings.length > 0) return true;
          
          // Unranked but in weight range
          if (minWeight && maxWeight && fighter.weight) {
            return fighter.weight >= parseInt(minWeight) && fighter.weight <= parseInt(maxWeight);
          }
          
          return false;
        })
      : fighters;

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
      .slice(0, limit);

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