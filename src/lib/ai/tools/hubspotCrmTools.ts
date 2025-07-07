/**
 * HubSpot CRM Tools for AI Agent
 * Enables chat-accessible CRM operations through AI function calling
 */

import { supabase } from '@/lib/supabase/supabaseClient';
import { HubSpotService } from '@/lib/services/hubspotService';
import type { AITool, ToolContext } from '../aiAgentWithTools';

const hubspotService = new HubSpotService();

// HubSpot CRM Tools for AI Function Calling
export const hubspotCrmTools: AITool[] = [
  {
    name: "search_hubspot_contacts",
    description: "Search for contacts in HubSpot CRM by name, email, company, or other criteria",
    parameters: {
      type: "object",
      properties: {
        search_term: {
          type: "string",
          description: "Search term (name, email, company, etc.)"
        },
        search_field: {
          type: "string",
          enum: ["email", "firstname", "lastname", "company", "phone", "any"],
          description: "Specific field to search in, or 'any' for general search"
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return",
          default: 10
        }
      },
      required: ["search_term"]
    },
    handler: async (args, context) => {
      try {
        await hubspotService.initialize();
        
        // Build search query
        const searchParams: any = {
          limit: args.limit || 10
        };

        if (args.search_field === 'any') {
          searchParams.q = args.search_term;
        } else {
          searchParams.properties = [args.search_field || 'email'];
          searchParams.filterGroups = [{
            filters: [{
              propertyName: args.search_field || 'email',
              operator: 'CONTAINS_TOKEN',
              value: args.search_term
            }]
          }];
        }

        const contacts = await hubspotService.searchContacts(searchParams);
        
        return {
          success: true,
          contacts: contacts.map(contact => ({
            id: contact.id,
            name: `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim(),
            email: contact.properties.email,
            company: contact.properties.company,
            phone: contact.properties.phone,
            lifecycleStage: contact.properties.lifecyclestage,
            lastActivity: contact.properties.lastmodifieddate
          })),
          summary: `Found ${contacts.length} contact(s) matching "${args.search_term}"`
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to search contacts',
          fallback: "I can't access your HubSpot contacts right now. Please check your integration."
        };
      }
    }
  },

  {
    name: "update_hubspot_contact",
    description: "Update an existing contact in HubSpot CRM with new information",
    parameters: {
      type: "object",
      properties: {
        contact_id: {
          type: "string",
          description: "HubSpot contact ID"
        },
        contact_email: {
          type: "string",
          description: "Contact email address (alternative to contact_id)"
        },
        properties: {
          type: "object",
          properties: {
            firstname: { type: "string", description: "First name" },
            lastname: { type: "string", description: "Last name" },
            email: { type: "string", description: "Email address" },
            phone: { type: "string", description: "Phone number" },
            company: { type: "string", description: "Company name" },
            jobtitle: { type: "string", description: "Job title" },
            lifecyclestage: { 
              type: "string", 
              enum: ["subscriber", "lead", "marketingqualifiedlead", "salesqualifiedlead", "opportunity", "customer", "evangelist", "other"],
              description: "Lifecycle stage" 
            },
            lead_status: {
              type: "string",
              enum: ["new", "open", "in_progress", "open_deal", "unqualified", "attempted_to_contact", "connected", "bad_timing"],
              description: "Lead status"
            },
            notes: { type: "string", description: "Additional notes" }
          },
          description: "Properties to update"
        },
        create_note: {
          type: "string",
          description: "Optional note to add to contact's timeline"
        }
      },
      required: ["properties"]
    },
    handler: async (args, context) => {
      try {
        await hubspotService.initialize();
        
        let contactId = args.contact_id;
        
        // If no contact ID, search by email
        if (!contactId && args.contact_email) {
          const searchResults = await hubspotService.searchContacts({
            filterGroups: [{
              filters: [{
                propertyName: 'email',
                operator: 'EQ',
                value: args.contact_email
              }]
            }]
          });
          
          if (searchResults.length > 0) {
            contactId = searchResults[0].id;
          } else {
            return {
              success: false,
              error: `Contact with email ${args.contact_email} not found`,
              fallback: "I couldn't find that contact. Please verify the email address."
            };
          }
        }

        if (!contactId) {
          return {
            success: false,
            error: "Contact ID or email is required",
            fallback: "Please provide either a contact ID or email address."
          };
        }

        // Update contact
        const updatedContact = await hubspotService.updateContact(contactId, args.properties);
        
        // Add note if requested
        if (args.create_note) {
          await hubspotService.createNote(contactId, args.create_note, {
            ownerId: context.userId,
            timestamp: new Date().toISOString()
          });
        }

        // Create action card for the update
        await createCrmActionCard(
          context.userId,
          'contact_updated',
          `Contact Updated: ${updatedContact.properties.firstname} ${updatedContact.properties.lastname}`,
          `Successfully updated contact information in HubSpot CRM.`,
          {
            contact_id: contactId,
            updated_properties: Object.keys(args.properties),
            note_added: !!args.create_note
          }
        );

        return {
          success: true,
          contact: {
            id: updatedContact.id,
            name: `${updatedContact.properties.firstname || ''} ${updatedContact.properties.lastname || ''}`.trim(),
            email: updatedContact.properties.email,
            updatedProperties: Object.keys(args.properties)
          },
          summary: `Updated contact ${updatedContact.properties.firstname} ${updatedContact.properties.lastname} in HubSpot CRM`
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update contact',
          fallback: "I couldn't update the contact. Please try again or update manually in HubSpot."
        };
      }
    }
  },

  {
    name: "create_hubspot_contact",
    description: "Create a new contact in HubSpot CRM",
    parameters: {
      type: "object",
      properties: {
        email: {
          type: "string",
          description: "Contact email address (required)"
        },
        firstname: {
          type: "string",
          description: "First name"
        },
        lastname: {
          type: "string",
          description: "Last name"
        },
        company: {
          type: "string",
          description: "Company name"
        },
        phone: {
          type: "string",
          description: "Phone number"
        },
        jobtitle: {
          type: "string",
          description: "Job title"
        },
        lifecyclestage: {
          type: "string",
          enum: ["subscriber", "lead", "marketingqualifiedlead", "salesqualifiedlead", "opportunity", "customer"],
          description: "Initial lifecycle stage",
          default: "lead"
        },
        lead_source: {
          type: "string",
          description: "How this lead was acquired"
        },
        notes: {
          type: "string",
          description: "Initial notes about this contact"
        }
      },
      required: ["email"]
    },
    handler: async (args, context) => {
      try {
        await hubspotService.initialize();
        
        // Check if contact already exists
        const existingContacts = await hubspotService.searchContacts({
          filterGroups: [{
            filters: [{
              propertyName: 'email',
              operator: 'EQ',
              value: args.email
            }]
          }]
        });

        if (existingContacts.length > 0) {
          return {
            success: false,
            error: `Contact with email ${args.email} already exists`,
            existing_contact: {
              id: existingContacts[0].id,
              name: `${existingContacts[0].properties.firstname || ''} ${existingContacts[0].properties.lastname || ''}`.trim()
            },
            fallback: "This contact already exists in your CRM. Would you like me to update their information instead?"
          };
        }

        // Create new contact
        const contactProperties: Record<string, string> = {
          email: args.email,
          lifecyclestage: args.lifecyclestage || 'lead'
        };

        // Add optional properties
        if (args.firstname) contactProperties.firstname = args.firstname;
        if (args.lastname) contactProperties.lastname = args.lastname;
        if (args.company) contactProperties.company = args.company;
        if (args.phone) contactProperties.phone = args.phone;
        if (args.jobtitle) contactProperties.jobtitle = args.jobtitle;
        if (args.lead_source) contactProperties.hs_lead_status = args.lead_source;

        const newContact = await hubspotService.createContact(contactProperties);
        
        // Add initial note if provided
        if (args.notes) {
          await hubspotService.createNote(newContact.id, args.notes, {
            ownerId: context.userId,
            timestamp: new Date().toISOString()
          });
        }

        // Create action card for the new contact
        await createCrmActionCard(
          context.userId,
          'contact_created',
          `New Contact: ${args.firstname} ${args.lastname}`,
          `Successfully created new contact in HubSpot CRM.`,
          {
            contact_id: newContact.id,
            email: args.email,
            lifecycle_stage: args.lifecyclestage || 'lead'
          }
        );

        return {
          success: true,
          contact: {
            id: newContact.id,
            name: `${args.firstname || ''} ${args.lastname || ''}`.trim(),
            email: args.email,
            lifecycleStage: args.lifecyclestage || 'lead'
          },
          summary: `Created new contact ${args.firstname} ${args.lastname} in HubSpot CRM`
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create contact',
          fallback: "I couldn't create the contact. Please try again or add manually in HubSpot."
        };
      }
    }
  },

  {
    name: "search_hubspot_deals",
    description: "Search for deals in HubSpot CRM by name, amount, stage, or associated contacts/companies",
    parameters: {
      type: "object",
      properties: {
        search_term: {
          type: "string",
          description: "Search term for deal name or company"
        },
        deal_stage: {
          type: "string",
          enum: ["qualifiedtobuy", "presentationscheduled", "decisionmakerboughtin", "contractsent", "closedwon", "closedlost"],
          description: "Filter by deal stage"
        },
        amount_min: {
          type: "number",
          description: "Minimum deal amount"
        },
        amount_max: {
          type: "number",
          description: "Maximum deal amount"
        },
        limit: {
          type: "number",
          description: "Maximum number of results",
          default: 10
        }
      },
      required: []
    },
    handler: async (args, context) => {
      try {
        await hubspotService.initialize();
        
        const searchParams: any = {
          limit: args.limit || 10,
          properties: ['dealname', 'amount', 'dealstage', 'closedate', 'pipeline', 'hubspot_owner_id'],
          associations: ['contacts', 'companies']
        };

        // Build filters
        const filters: any[] = [];
        
        if (args.search_term) {
          filters.push({
            propertyName: 'dealname',
            operator: 'CONTAINS_TOKEN',
            value: args.search_term
          });
        }
        
        if (args.deal_stage) {
          filters.push({
            propertyName: 'dealstage',
            operator: 'EQ',
            value: args.deal_stage
          });
        }
        
        if (args.amount_min) {
          filters.push({
            propertyName: 'amount',
            operator: 'GTE',
            value: args.amount_min.toString()
          });
        }
        
        if (args.amount_max) {
          filters.push({
            propertyName: 'amount',
            operator: 'LTE',
            value: args.amount_max.toString()
          });
        }

        if (filters.length > 0) {
          searchParams.filterGroups = [{ filters }];
        }

        const deals = await hubspotService.searchDeals(searchParams);
        
        return {
          success: true,
          deals: deals.map(deal => ({
            id: deal.id,
            name: deal.properties.dealname,
            amount: deal.properties.amount ? parseFloat(deal.properties.amount) : 0,
            stage: deal.properties.dealstage,
            closeDate: deal.properties.closedate,
            pipeline: deal.properties.pipeline,
            lastModified: deal.properties.lastmodifieddate
          })),
          summary: `Found ${deals.length} deal(s)${args.search_term ? ` matching "${args.search_term}"` : ''}`
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to search deals',
          fallback: "I can't access your HubSpot deals right now. Please check your integration."
        };
      }
    }
  },

  {
    name: "update_hubspot_deal",
    description: "Update an existing deal in HubSpot CRM",
    parameters: {
      type: "object",
      properties: {
        deal_id: {
          type: "string",
          description: "HubSpot deal ID"
        },
        deal_name: {
          type: "string",
          description: "Deal name (alternative to deal_id for search)"
        },
        properties: {
          type: "object",
          properties: {
            dealname: { type: "string", description: "Deal name" },
            amount: { type: "number", description: "Deal amount" },
            dealstage: { 
              type: "string",
              enum: ["qualifiedtobuy", "presentationscheduled", "decisionmakerboughtin", "contractsent", "closedwon", "closedlost"],
              description: "Deal stage" 
            },
            closedate: { type: "string", description: "Expected close date (YYYY-MM-DD)" },
            deal_description: { type: "string", description: "Deal description" },
            probability: { type: "number", description: "Probability of closing (0-100)" }
          },
          description: "Properties to update"
        },
        create_note: {
          type: "string",
          description: "Optional note to add to deal timeline"
        }
      },
      required: ["properties"]
    },
    handler: async (args, context) => {
      try {
        await hubspotService.initialize();
        
        let dealId = args.deal_id;
        
        // If no deal ID, search by name
        if (!dealId && args.deal_name) {
          const searchResults = await hubspotService.searchDeals({
            filterGroups: [{
              filters: [{
                propertyName: 'dealname',
                operator: 'EQ',
                value: args.deal_name
              }]
            }]
          });
          
          if (searchResults.length > 0) {
            dealId = searchResults[0].id;
          } else {
            return {
              success: false,
              error: `Deal with name "${args.deal_name}" not found`,
              fallback: "I couldn't find that deal. Please verify the deal name."
            };
          }
        }

        if (!dealId) {
          return {
            success: false,
            error: "Deal ID or name is required",
            fallback: "Please provide either a deal ID or deal name."
          };
        }

        // Convert properties to strings for HubSpot API
        const dealProperties: Record<string, string> = {};
        Object.entries(args.properties).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            dealProperties[key] = value.toString();
          }
        });

        // Update deal
        const updatedDeal = await hubspotService.updateDeal(dealId, dealProperties);
        
        // Add note if requested
        if (args.create_note) {
          await hubspotService.createNote(dealId, args.create_note, {
            ownerId: context.userId,
            timestamp: new Date().toISOString(),
            objectType: 'deal'
          });
        }

        // Create action card for the update
        await createCrmActionCard(
          context.userId,
          'deal_updated',
          `Deal Updated: ${updatedDeal.properties.dealname}`,
          `Successfully updated deal information in HubSpot CRM.`,
          {
            deal_id: dealId,
            updated_properties: Object.keys(args.properties),
            note_added: !!args.create_note
          }
        );

        return {
          success: true,
          deal: {
            id: updatedDeal.id,
            name: updatedDeal.properties.dealname,
            amount: updatedDeal.properties.amount ? parseFloat(updatedDeal.properties.amount) : 0,
            stage: updatedDeal.properties.dealstage,
            updatedProperties: Object.keys(args.properties)
          },
          summary: `Updated deal "${updatedDeal.properties.dealname}" in HubSpot CRM`
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update deal',
          fallback: "I couldn't update the deal. Please try again or update manually in HubSpot."
        };
      }
    }
  },

  {
    name: "create_hubspot_deal",
    description: "Create a new deal in HubSpot CRM",
    parameters: {
      type: "object",
      properties: {
        dealname: {
          type: "string",
          description: "Deal name"
        },
        amount: {
          type: "number",
          description: "Deal amount"
        },
        dealstage: {
          type: "string",
          enum: ["qualifiedtobuy", "presentationscheduled", "decisionmakerboughtin", "contractsent"],
          description: "Initial deal stage",
          default: "qualifiedtobuy"
        },
        closedate: {
          type: "string",
          description: "Expected close date (YYYY-MM-DD)"
        },
        pipeline: {
          type: "string",
          description: "Sales pipeline ID"
        },
        deal_description: {
          type: "string",
          description: "Deal description"
        },
        associated_contact_email: {
          type: "string",
          description: "Email of contact to associate with this deal"
        },
        associated_company_name: {
          type: "string",
          description: "Name of company to associate with this deal"
        }
      },
      required: ["dealname", "amount"]
    },
    handler: async (args, context) => {
      try {
        await hubspotService.initialize();
        
        // Prepare deal properties
        const dealProperties: Record<string, string> = {
          dealname: args.dealname,
          amount: args.amount.toString(),
          dealstage: args.dealstage || 'qualifiedtobuy'
        };

        if (args.closedate) dealProperties.closedate = args.closedate;
        if (args.pipeline) dealProperties.pipeline = args.pipeline;
        if (args.deal_description) dealProperties.deal_description = args.deal_description;

        // Create deal
        const newDeal = await hubspotService.createDeal(dealProperties);
        
        // Associate with contact if provided
        if (args.associated_contact_email) {
          try {
            const contacts = await hubspotService.searchContacts({
              filterGroups: [{
                filters: [{
                  propertyName: 'email',
                  operator: 'EQ',
                  value: args.associated_contact_email
                }]
              }]
            });
            
            if (contacts.length > 0) {
              await hubspotService.associateDealToContact(newDeal.id, contacts[0].id);
            }
          } catch (error) {
            console.warn('Failed to associate contact:', error);
          }
        }

        // Associate with company if provided
        if (args.associated_company_name) {
          try {
            const companies = await hubspotService.searchCompanies({
              filterGroups: [{
                filters: [{
                  propertyName: 'name',
                  operator: 'EQ',
                  value: args.associated_company_name
                }]
              }]
            });
            
            if (companies.length > 0) {
              await hubspotService.associateDealToCompany(newDeal.id, companies[0].id);
            }
          } catch (error) {
            console.warn('Failed to associate company:', error);
          }
        }

        // Create action card for the new deal
        await createCrmActionCard(
          context.userId,
          'deal_created',
          `New Deal: ${args.dealname}`,
          `Successfully created new deal worth $${args.amount} in HubSpot CRM.`,
          {
            deal_id: newDeal.id,
            amount: args.amount,
            stage: args.dealstage || 'qualifiedtobuy'
          }
        );

        return {
          success: true,
          deal: {
            id: newDeal.id,
            name: args.dealname,
            amount: args.amount,
            stage: args.dealstage || 'qualifiedtobuy'
          },
          summary: `Created new deal "${args.dealname}" worth $${args.amount} in HubSpot CRM`
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create deal',
          fallback: "I couldn't create the deal. Please try again or add manually in HubSpot."
        };
      }
    }
  },

  {
    name: "get_hubspot_activity_feed",
    description: "Get recent activity feed from HubSpot CRM including recent contacts, deals, and engagements",
    parameters: {
      type: "object",
      properties: {
        activity_type: {
          type: "string",
          enum: ["all", "contacts", "deals", "companies", "engagements"],
          description: "Type of activity to retrieve",
          default: "all"
        },
        limit: {
          type: "number",
          description: "Number of activities to retrieve",
          default: 20
        },
        days_back: {
          type: "number",
          description: "Number of days to look back",
          default: 7
        }
      },
      required: []
    },
    handler: async (args, context) => {
      try {
        await hubspotService.initialize();
        
        const activities: any[] = [];
        const daysBack = args.days_back || 7;
        const sinceDate = new Date(Date.now() - (daysBack * 24 * 60 * 60 * 1000)).toISOString();
        
        // Get recent contacts
        if (args.activity_type === 'all' || args.activity_type === 'contacts') {
          const recentContacts = await hubspotService.getRecentContacts({
            limit: Math.floor((args.limit || 20) / 3),
            since: sinceDate
          });
          
          activities.push(...recentContacts.map(contact => ({
            type: 'contact',
            id: contact.id,
            title: `New Contact: ${contact.properties.firstname} ${contact.properties.lastname}`,
            description: `Email: ${contact.properties.email}`,
            timestamp: contact.createdAt,
            objectId: contact.id
          })));
        }

        // Get recent deals
        if (args.activity_type === 'all' || args.activity_type === 'deals') {
          const recentDeals = await hubspotService.getRecentDeals({
            limit: Math.floor((args.limit || 20) / 3),
            since: sinceDate
          });
          
          activities.push(...recentDeals.map(deal => ({
            type: 'deal',
            id: deal.id,
            title: `Deal Update: ${deal.properties.dealname}`,
            description: `Amount: $${deal.properties.amount} | Stage: ${deal.properties.dealstage}`,
            timestamp: deal.updatedAt,
            objectId: deal.id
          })));
        }

        // Sort by timestamp
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        return {
          success: true,
          activities: activities.slice(0, args.limit || 20),
          summary: `Retrieved ${activities.length} recent activities from HubSpot CRM`
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get activity feed',
          fallback: "I can't access your HubSpot activity feed right now. Please check your integration."
        };
      }
    }
  }
];

/**
 * Helper function to create CRM action cards
 */
async function createCrmActionCard(
  userId: string,
  actionType: string,
  title: string,
  description: string,
  metadata: Record<string, any>
): Promise<void> {
  try {
    await supabase
      .from('action_cards')
      .insert({
        user_id: userId,
        domain: 'crm',
        kind: 'notification',
        title,
        description,
        meta: {
          action_type: actionType,
          integration: 'hubspot',
          timestamp: new Date().toISOString(),
          ...metadata
        },
        status: 'pending'
      });
  } catch (error) {
    console.warn('Failed to create CRM action card:', error);
  }
}

export default hubspotCrmTools; 