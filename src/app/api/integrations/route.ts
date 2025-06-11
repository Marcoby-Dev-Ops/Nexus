import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/security';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new NextResponse('User ID is required', { status: 400 });
    }

    const integrations = await prisma.integration.findMany({
      where: {
        userId
      },
      select: {
        id: true,
        type: true,
        settings: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json(integrations);
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { type, credentials, settings, userId } = body;

    if (!type || !credentials || !userId) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Encrypt sensitive credentials
    const encryptedCredentials = await encrypt(JSON.stringify(credentials));

    const integration = await prisma.integration.create({
      data: {
        type,
        credentials: encryptedCredentials,
        settings: settings || {},
        userId
      }
    });

    return NextResponse.json({
      ...integration,
      credentials: undefined // Don't send credentials back to client
    });
  } catch (error) {
    console.error('Error creating integration:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { id, credentials, settings } = body;

    if (!id) {
      return new NextResponse('Integration ID is required', { status: 400 });
    }

    const updateData: any = {};
    if (credentials) {
      updateData.credentials = await encrypt(JSON.stringify(credentials));
    }
    if (settings) {
      updateData.settings = settings;
    }

    const integration = await prisma.integration.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      ...integration,
      credentials: undefined // Don't send credentials back to client
    });
  } catch (error) {
    console.error('Error updating integration:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new NextResponse('Integration ID is required', { status: 400 });
    }

    await prisma.integration.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting integration:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 