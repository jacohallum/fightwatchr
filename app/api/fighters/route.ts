import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const organizationId = searchParams.get('organizationId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (organizationId) {
      where.organizationId = organizationId;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { nickname: { contains: search, mode: 'insensitive' } }
      ];
    }

    const fighters = await prisma.fighter.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });

    const formattedFighters = fighters.map(fighter => ({
      ...fighter,
      totalFights: fighter.wins + fighter.losses + fighter.draws + fighter.noContests
    }));

    return NextResponse.json({
      fighters: formattedFighters,
      pagination: {
        limit,
        offset,
        total: await prisma.fighter.count({ where })
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