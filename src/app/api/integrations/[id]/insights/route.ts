import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateInsights } from '@/lib/ai/insights';

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

    const integration = await prisma.integration.findUnique({
      where: {
        id: params.id,
        userId: session.user.id
      },
      include: {
        insights: true
      }
    });

    if (!integration) {
      return new NextResponse('Integration not found', { status: 404 });
    }

    return NextResponse.json(integration.insights);
  } catch (error) {
    console.error('Error fetching integration insights:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const data = await request.json();
    const { content, type, importance } = data;

    const integration = await prisma.integration.findUnique({
      where: {
        id: params.id,
        userId: session.user.id
      }
    });

    if (!integration) {
      return new NextResponse('Integration not found', { status: 404 });
    }

    const insight = await prisma.integrationInsight.create({
      data: {
        content,
        type,
        importance,
        integrationId: params.id
      }
    });

    // Generate additional AI insights based on the new insight
    const aiInsights = await generateInsights(integration, insight);
    
    if (aiInsights.length > 0) {
      await prisma.integrationInsight.createMany({
        data: aiInsights.map(insight => ({
          ...insight,
          integrationId: params.id
        }))
      });
    }

    return NextResponse.json(insight);
  } catch (error) {
    console.error('Error creating integration insight:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 