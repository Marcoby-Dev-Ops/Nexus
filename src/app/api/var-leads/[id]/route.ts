import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const lead = await prisma.vARLead.findUnique({
      where: {
        id: params.id,
        userId: session.user.id
      },
      include: {
        contact: true
      }
    });

    if (!lead) {
      return new NextResponse('Lead not found', { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error fetching VAR lead:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const data = await request.json();
    const { status, notes, score } = data;

    const lead = await prisma.vARLead.update({
      where: {
        id: params.id,
        userId: session.user.id
      },
      data: {
        status,
        notes,
        score
      },
      include: {
        contact: true
      }
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error updating VAR lead:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await prisma.vARLead.delete({
      where: {
        id: params.id,
        userId: session.user.id
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting VAR lead:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 