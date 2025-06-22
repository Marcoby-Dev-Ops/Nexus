import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui/Spinner';

/**
 * AuthCallback - Handles auth redirects from Supabase for:
 * - Email confirmation
 * - OAuth providers (with provider token capture)
 * - Password reset
 * - Email setup flow
 */
export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Finalizing Authentication');
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Parse hash params from URL for password resets or OAuth logins
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(location.search);
    
    // Get the next path from query params, if provided
    const next = queryParams.get('next') || '/dashboard';
    const setup = queryParams.get('setup'); // For email setup flow
    
    // Handle Supabase auth callback
    const handleAuthCallback = async () => {
      try {
        // If this is a password reset, we need to set a new password
        if (next === '/reset-password') {
          // We'll navigate to a password reset form
          navigate('/reset-password', { replace: true });
          return;
        }
        
        setStatus('Verifying session...');
        
        // Get session to ensure auth worked
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (data.session) {
          // Check if we have provider tokens (for Microsoft Graph)
          let { provider_token, provider_refresh_token } = data.session;
          const user = data.session.user;
          
          // Fallback: some providers (e.g. Azure AD) place tokens under identities
          if (!provider_token && user?.identities?.length) {
            const azureIdentity = user.identities.find((id: any) => id.provider === 'azure');
            if (azureIdentity?.identity_data) {
              provider_token = azureIdentity.identity_data.access_token || provider_token;
              provider_refresh_token = azureIdentity.identity_data.refresh_token || provider_refresh_token;
            }
          }
          
          // If this is a Microsoft OAuth with provider tokens, store them
          if (provider_token && user?.app_metadata?.provider === 'azure') {
            setStatus('Storing Microsoft Graph tokens...');
            
            try {
              // Store the tokens in our integrations table
              const { error: tokenError } = await supabase
                .from('ai_integrations_oauth')
                .upsert({
                  user_id: user.id,
                  provider: 'microsoft_graph',
                  access_token: provider_token,
                  refresh_token: provider_refresh_token,
                  expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour from now
                  scopes: ['Mail.Read', 'Mail.ReadWrite', 'User.Read'],
                  updated_at: new Date().toISOString()
                }, {
                  onConflict: 'user_id,provider'
                });
              
              if (tokenError) {
                console.error('Failed to store provider tokens:', tokenError);
              } else {
                console.log('✅ Microsoft Graph tokens stored successfully');
              }
            } catch (tokenErr) {
              console.error('Error storing provider tokens:', tokenErr);
            }
          }
          
          // Handle email setup flow
          if (setup === 'email') {
            setStatus('Setting up email integration...');
            
            // Check for stored callback info
            const callbackInfo = localStorage.getItem('nexus_oauth_callback');
            if (callbackInfo) {
              try {
                const { type, provider } = JSON.parse(callbackInfo);
                if (type === 'email_setup' && provider === 'outlook') {
                  // Create email account record
                  const { error: emailError } = await supabase
                    .from('ai_email_accounts')
                    .upsert({
                      user_id: user.id,
                      email_address: user.email,
                      display_name: user.user_metadata?.full_name || user.email,
                      provider: 'outlook',
                      is_active: true,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    }, {
                      onConflict: 'user_id,email_address'
                    });
                  
                  if (emailError) {
                    console.error('Failed to create email account:', emailError);
                  } else {
                    console.log('✅ Email account created successfully');
                  }
                }
              } catch (parseErr) {
                console.error('Failed to parse callback info:', parseErr);
              }
              
              // Clean up stored callback info
              localStorage.removeItem('nexus_oauth_callback');
            }
            
            // Redirect to integrations page with success message
            navigate('/integrations?email_setup=success', { replace: true });
            return;
          }

          // Handle Microsoft Graph setup flow
          if (setup === 'microsoft_graph') {
            setStatus('Setting up Microsoft Graph integration...');
            
            // Check for stored callback info
            const callbackInfo = localStorage.getItem('nexus_oauth_callback');
            if (callbackInfo) {
              try {
                const { type } = JSON.parse(callbackInfo);
                if (type === 'microsoft_graph_setup') {
                  // The tokens are already stored by the provider token logic above
                  console.log('✅ Microsoft Graph setup completed');
                }
              } catch (parseErr) {
                console.error('Failed to parse callback info:', parseErr);
              }
              
              // Clean up stored callback info
              localStorage.removeItem('nexus_oauth_callback');
            }
            
            // Redirect to integrations page with success message
            navigate('/integrations?microsoft_graph_setup=success', { replace: true });
            return;
          }
          
          setStatus('Redirecting...');
          
          // Auth successful, redirect to dashboard or specified next page
          navigate(next, { replace: true });
        } else {
          // No session found, redirect to login
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication error');
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };
    
    handleAuthCallback();
  }, [navigate, location]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      {error ? (
        <div className="max-w-md p-6 bg-destructive/10 rounded-lg border border-destructive/20 text-center">
          <h2 className="text-lg font-semibold text-destructive mb-2">Authentication Error</h2>
          <p className="text-destructive/80 mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      ) : (
        <div className="text-center">
          <Spinner size={40} className="mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">{status}</h2>
          <p className="text-muted-foreground">Please wait while we complete the setup...</p>
        </div>
      )}
    </div>
  );
} 