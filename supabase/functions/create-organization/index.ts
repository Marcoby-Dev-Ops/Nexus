import { createEdgeFunction, createErrorResponse, createSuccessResponse } from '../_shared/template.ts';

interface CreateOrganizationRequest {
  tenantId: string;
  name: string;
  description?: string;
  userId: string;
  userRole?: string;
}

interface CreateOrganizationResponse {
  success: boolean;
  data?: {
    orgId: string;
    orgName: string;
    userId: string;
    userRole: string;
  };
  error?: string;
}

export const createOrganization = createEdgeFunction(async (req, auth) => {
  const { user, supabase } = auth;
  
  console.log('Create organization function called with method:', req.method);
  console.log('User authenticated:', user?.id);

  try {
    // Parse request body
    const { tenantId, name, description, userId, userRole = 'owner' }: CreateOrganizationRequest = await req.json();
    console.log('Received organization data:', { tenantId, name, description, userId, userRole });

    // Validate required fields
    if (!tenantId || !name || !userId) {
      return createErrorResponse('Missing required fields: tenantId, name, and userId', 400);
    }

    // Validate user authentication
    if (!user?.id || user.id !== userId) {
      return createErrorResponse('User authentication failed or user ID mismatch', 401);
    }

    // Generate organization slug
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Create organization
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        tenant_id: tenantId,
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orgError) {
      console.error('Error creating organization:', orgError);
      return createErrorResponse(`Failed to create organization: ${orgError.message}`, 500);
    }

    const orgId = newOrg.id;
    console.log('Created organization with ID:', orgId);

    // Add user as member with specified role
    const { error: membershipError } = await supabase
      .from('user_organizations')
      .insert({
        user_id: userId,
        org_id: orgId,
        role: userRole,
        permissions: userRole === 'owner' ? ['*'] : ['read', 'write'],
        is_primary: true,
        joined_at: new Date().toISOString()
      });

    if (membershipError) {
      console.error('Error adding user to organization:', membershipError);
      return createErrorResponse(`Failed to add user to organization: ${membershipError.message}`, 500);
    }

    console.log('Added user to organization:', { userId, orgId, role: userRole });

    // Log activity
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: userId,
        action: 'organization_created',
        resource_type: 'organization',
        resource_id: orgId,
        metadata: {
          org_name: name,
          org_slug: slug,
          user_role: userRole
        }
      });

    const responseData = {
      orgId,
      orgName: name,
      userId,
      userRole
    };

    console.log('Organization created successfully:', responseData);
    return createSuccessResponse(responseData);

  } catch (error) {
    console.error('Create organization error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Unknown error occurred',
      500
    );
  }
});

// Export the serve function for Supabase
export const serve = createOrganization; 