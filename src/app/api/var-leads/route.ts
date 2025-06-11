import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { encrypt } from '@/lib/security';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const leads = await prisma.vARLead.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        contact: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error('Error fetching VAR leads:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const data = await request.json();
    const { email, company, status, score, source, notes, contactId } = data;

    const lead = await prisma.vARLead.create({
      data: {
        email,
        company,
        status,
        score,
        source,
        notes,
        contactId,
        userId: session.user.id
      },
      include: {
        contact: true
      }
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error creating VAR lead:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 