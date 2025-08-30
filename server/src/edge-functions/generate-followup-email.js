const { query } = require('../database/connection');

/**
 * Generate followup email edge function
 * @param {Object} payload - Function payload
 * @param {Object} user - Authenticated user object
 * @returns {Promise<Object>} Generated email data
 */
async function generateFollowupEmailHandler(payload, user) {
  try {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { company_id } = user;
    const { contact_id, context, tone = 'professional' } = payload;
    
    // Get contact and interaction history
    const contactResult = await query(`
      SELECT name, email, company, last_interaction_date
      FROM contacts 
      WHERE id = $1 AND company_id = $2
    `, [contact_id, company_id]);

    if (contactResult.error || !contactResult.data?.length) {
      throw new Error('Contact not found');
    }

    const contact = contactResult.data[0];
    
    // Generate email using AI service (placeholder for MVP)
    const emailContent = `Hi ${contact.name},

Thank you for your interest in our services. I wanted to follow up on our recent conversation about ${context}.

I'm looking forward to continuing our discussion and exploring how we can help ${contact.company} achieve its goals.

Best regards,
${user.name || 'Your Team'}`;

    return {
      success: true,
      data: {
        to: contact.email,
        subject: `Follow-up: ${context}`,
        content: emailContent,
        contact: contact
      }
    };
  } catch (error) {
    console.error('Generate followup email failed:', error);
    throw error;
  }
}

module.exports = generateFollowupEmailHandler;
