/*
 * Nexus Email Service
 * Handles direct interactions with Microsoft 365 via Graph API,
 * leveraging Nexus's existing OAuth token management.
 */

const { Client } = require('@microsoft/microsoft-graph-client');
require('isomorphic-fetch'); // Polyfill for fetch in Node.js if needed by graph client
const tokenService = require('./tokenService'); // Import the new token service
const fs = require('fs').promises; // Node.js File System module for attachments

class EmailService {
    constructor() {
        console.log("EmailService initialized for Microsoft Graph API.");
    }

    /**
     * Sends an email using Microsoft Graph API for the given user.
     * @param {object} params - Object containing email parameters.
     * @param {string[]} params.to - Array of recipient email addresses.
     * @param {string} params.subject - Subject line of the email.
     * @param {string} params.body - HTML body of the email.
     * @param {string[]} [params.cc = []] - Array of CC recipient email addresses.
     * @param {string[]} [params.bcc = []] - Array of BCC recipient email addresses.
     * @param {object[]} [params.attachments = []] - Array of attachment objects ({ filename, path: '/workspace/file.txt', contentType: 'mime/type' }).
     * @param {string} userId - The ID of the user whose Microsoft 365 account to use.
     */
    async sendEmail({ to, subject, body, cc = [], bcc = [], attachments = [] }, userId) {
        let accessToken;
        try {
            accessToken = await tokenService.getMicrosoftGraphAccessToken(userId);
        } catch (tokenError) {
            console.error('Failed to get Microsoft Graph access token:', tokenError);
            throw new Error(`Authentication required for Microsoft 365: ${tokenError.message}. Please re-authenticate your Microsoft 365 integration.`);
        }

        if (!to || to.length === 0) {
            throw new Error('Recipients (to) cannot be empty.');
        }

        const client = Client.init({
            authProvider: (done) => {
                done(null, accessToken); // Use the retrieved access token from tokenService
            },
        });

        const recipients = to.map(email => ({ emailAddress: { address: email } }));
        const ccRecipients = cc.map(email => ({ emailAddress: { address: email } }));
        const bccRecipients = bcc.map(email => ({ emailAddress: { address: email } }));

        const graphAttachments = await Promise.all(attachments.map(async (att) => {
            let fileContentBase64 = '';
            try {
                const buffer = await fs.readFile(att.path);
                fileContentBase64 = buffer.toString('base64');
            } catch (readError) {
                console.error(`Failed to read attachment file ${att.path}:`, readError);
                throw new Error(`Could not process attachment ${att.filename}: ${readError.message}`);
            }

            return {
                '@odata.type': '#microsoft.graph.fileAttachment',
                name: att.filename,
                contentType: att.contentType || 'application/octet-stream',
                contentBytes: fileContentBase64
            };
        }));

        const email = {
            subject: subject,
            body: {
                contentType: 'HTML',
                content: body
            },
            toRecipients: recipients,
            ccRecipients: ccRecipients.length ? ccRecipients : undefined,
            bccRecipients: bccRecipients.length ? bccRecipients : undefined,
            attachments: graphAttachments.length ? graphAttachments : undefined
        };

        try {
            console.log('Attempting to send email via Microsoft Graph API:', { to, subject, cc, bcc, attachmentsCount: attachments.length });
            await client.api('/me/sendMail').post({ message: email, saveToSentItems: true });
            console.log('Email sent successfully via Microsoft Graph API.');
            return {
                success: true,
                status: 'Email sent successfully via Microsoft Graph API.'
            };
        } catch (error) {
            console.error('Failed to send email via Microsoft Graph API:', error.response?.data || error.message);
            // Check for specific Graph API errors indicating invalid/expired token
            if (error.response?.status === 401 || error.response?.status === 403) {
                 // Even with auto-refresh, a refresh token itself can expire or be revoked.
                 // This would indicate a hard failure requiring user re-authentication.
                throw new Error(`Microsoft 365 authentication failed. Please re-authenticate your Microsoft 365 integration. Original error: ${error.message}`);
            }
            throw new Error(`Email sending failed with Microsoft Graph: ${error.response?.data?.error_description || error.message}`);
        }
    }

    // Placeholder implementations for other proposed email tools, now also accepting userId
    async forwardEmail(emailId, to, newBodyContent, userId) {
        // This will similarly call tokenService.getMicrosoftGraphAccessToken(userId)
        console.log('Forward email functionality not yet implemented.');
        return { success: false, message: "Forward email not yet implemented" };
    }

    async addSharedMailbox(mailboxEmail, ownerEmail, userId) {
        // Will also call tokenService.getMicrosoftGraphAccessToken(userId)
        console.log('Add shared mailbox functionality not yet implemented.');
        return { success: false, message: "Add shared mailbox not yet implemented" };
    }

    // ... similarly for markEmailStatus, moveEmail, etc.
}

module.exports = new EmailService();
