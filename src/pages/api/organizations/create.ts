import type { NextApiRequest, NextApiResponse } from 'next';
import { businessProfileService } from '@/shared/lib/business/businessProfileService';
import { logger } from '@/shared/utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tenantId, name, description, userId, profileData } = req.body;

    // Validate required fields
    if (!tenantId || !name || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: tenantId, name, and userId' 
      });
    }

    logger.info('Creating organization via API', { tenantId, name, userId });

    // Create organization with business profile
    const result = await businessProfileService.createOrganizationWithProfile(
      tenantId,
      userId,
      name,
      profileData || {}
    );

    if (!result.success) {
      logger.error('Failed to create organization via API', { 
        error: result.error, 
        tenantId, 
        name, 
        userId 
      });
      return res.status(500).json({ error: result.error });
    }

    logger.info('Organization created successfully via API', { 
      orgId: result.orgId, 
      profileId: result.profileId 
    });

    return res.status(201).json({
      success: true,
      data: {
        orgId: result.orgId,
        profileId: result.profileId
      }
    });

  } catch (error) {
    logger.error('Error in organization creation API', { error });
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}
