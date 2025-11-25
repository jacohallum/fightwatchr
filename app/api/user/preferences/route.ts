// app/api/user/preferences/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET - Fetch user preferences
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { preferences: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      preferences: user.preferences,
      hasPreferences: !!user.preferences && !user.preferences.skipped
    })

  } catch (error) {
    console.error('Error fetching user preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

// POST - Save user preferences
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fighters, skipped } = body

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Upsert preferences
    const preferences = await prisma.userPreferences.upsert({
      where: { userId: user.id },
      update: {
        fighters: fighters || [],
        skipped: skipped || false,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        fighters: fighters || [],
        skipped: skipped || false
      }
    })

    console.log(`✅ Preferences saved for user: ${session.user.email}`)
    console.log('Fighters count:', fighters?.length || 0)

    return NextResponse.json({
      success: true,
      message: 'Preferences saved successfully',
      preferences
    })

  } catch (error) {
    console.error('Error saving user preferences:', error)
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    )
  }
}

// PUT - Update existing preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await request.json()

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { preferences: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.preferences) {
      return NextResponse.json({ error: 'No preferences to update' }, { status: 404 })
    }

    const updatedPreferences = await prisma.userPreferences.update({
      where: { userId: user.id },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: updatedPreferences
    })

  } catch (error) {
    console.error('Error updating user preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}

// DELETE - Clear user preferences
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await prisma.userPreferences.deleteMany({
      where: { userId: user.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Preferences cleared successfully'
    })

  } catch (error) {
    console.error('Error clearing user preferences:', error)
    return NextResponse.json(
      { error: 'Failed to clear preferences' },
      { status: 500 }
    )
  }
}