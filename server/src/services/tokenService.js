/*
 * Nexus Token Service
 * Manages retrieval and automated renewal of Microsoft 365 OAuth tokens
 * by interacting directly with the 'oauth_tokens' table and Microsoft's OAuth endpoint.
 */

const axios = require('axios');
const db = require('../database/connection'); // Use existing db connection utility
const { getOAuthProviders } = require('../routes/oauth'); // To get provider configs like tokenUrl, client_id, client_secret

const MS_GRAPH_SCOPES = 'offline_access https://graph.microsoft.com/User.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/Calendars.ReadWrite';

class TokenService {
    /**
     * Retrieves a valid Microsoft Graph access token for a given user.
     * Automatically refreshes if the current token is expired or near expiry.
     * @param {string} userId - The ID of the current user.
     * @returns {Promise<string>} - The valid access token.
     * @throws {Error} If tokens cannot be retrieved or refreshed.
     */
    async getMicrosoftGraphAccessToken(userId) {
        const providerSlug = 'microsoft';
        const config = getOAuthProviders()[providerSlug];

        if (!config || !config.clientId || !config.clientSecret) {
            throw new Error('Microsoft OAuth provider configuration is incomplete. Missing client ID or client secret.');
        }

        // Step 1: Retrieve stored tokens for the user from Nexus database
        const { rows } = await db.query(
            `SELECT access_token, refresh_token, expires_at 
             FROM oauth_tokens 
             WHERE user_id = $1 AND integration_slug = $2`,
            [userId, providerSlug]
        );

        const integrationTokens = rows[0];

        if (!integrationTokens || !integrationTokens.refresh_token) {
            throw new Error('Microsoft integration not found or refresh token missing for user. Please connect your Microsoft 365 account.');
        }

        let { access_token, refresh_token, expires_at } = integrationTokens;

        // Step 2: Check if current access token is still valid (5-minute buffer for refresh)
        const fiveMinutesInMs = 5 * 60 * 1000;
        const isExpired = !access_token || !expires_at || (new Date(expires_at).getTime() - Date.now() < fiveMinutesInMs);

        if (isExpired) {
            console.log(`Microsoft 365 access token expired or near expiry for user ${userId}. Attempting to refresh...`);
            try {
                // Perform token refresh directly by calling Microsoft's OAuth endpoint
                const refreshedTokenData = await this._performTokenRefresh(refresh_token, config);
                
                access_token = refreshedTokenData.access_token;
                refresh_token = refreshedTokenData.refresh_token || refresh_token; // Microsoft might issue a new refresh token
                expires_at = new Date(Date.now() + (refreshedTokenData.expires_in * 1000)).toISOString();

                // Step 3: Securely update the database with new tokens and expiry
                await db.query(
                    `UPDATE oauth_tokens SET 
                     access_token = $1, 
                     refresh_token = $2, 
                     expires_at = $3, 
                     updated_at = NOW() 
                     WHERE user_id = $4 AND integration_slug = $5`,
                    [access_token, refresh_token, expires_at, userId, providerSlug]
                );
                console.log(`Microsoft 365 access token successfully refreshed and updated for user ${userId}.`);
            } catch (refreshError) {
                console.error(`Failed to refresh Microsoft 365 token for user ${userId}:`, refreshError.message);
                throw new Error('Failed to refresh Microsoft 365 token. Please re-authenticate your Microsoft 365 account.');
            }
        } else {
            console.log(`Using existing Microsoft 365 access token for user ${userId}. Valid for another ${Math.round((new Date(expires_at).getTime() - Date.now()) / 1000 / 60)} minutes.`);
        }

        return access_token;
    }

    /**
     * Makes the actual HTTP call to Microsoft's OAuth endpoint to refresh the token.
     * @param {string} currentRefreshToken
     * @param {object} providerConfig - Configuration for the Microsoft provider (clientId, clientSecret, tokenUrl).
     * @returns {Promise<object>} - Object containing new access_token, refresh_token, expires_in, etc.
     */
    async _performTokenRefresh(currentRefreshToken, providerConfig) {
        const params = new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: providerConfig.clientId,
            client_secret: providerConfig.clientSecret,
            refresh_token: currentRefreshToken,
            scope: MS_GRAPH_SCOPES, // Ensure correct scopes are requested
        });

        try {
            const response = await axios.post(providerConfig.tokenUrl, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            });
            return response.data; // Contains access_token, refresh_token (optional), expires_in, etc.
        } catch (error) {
            console.error('Error during Microsoft Graph token refresh API call:', error.response?.data || error.message);
            throw new Error(`Microsoft token refresh API call failed: ${error.response?.data?.error_description || error.message}`);
        }
    }
}

module.exports = new TokenService();
