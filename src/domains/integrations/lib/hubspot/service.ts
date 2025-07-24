import { Client } from '@hubspot/api-client';
import { PrismaClient } from '@prisma/client';
import { getHubspotApiKey } from '@/domains/integrations/lib/hubspot/config';
import { SecureLogger } from '@/shared/lib/security/logger';

const logger = new SecureLogger('HubSpotService');

// Interfaces for HubSpot data structures
interface HubSpotContact {
  id: string;
  properties: {
    email: string;
    firstname: string;
    lastname: string;
    company: string;
    phone: string;
    // Allow other string properties
    [key: string]: string | undefined;
  };
}

interface HubSpotDeal {
  id: string;
  properties: {
    dealname: string;
    pipeline: string;
    dealstage: string;
    amount: string;
    closedate: string;
    [key: string]: string;
  };
}

interface HubSpotCompany {
  id: string;
  properties: {
    name: string;
    domain: string;
    industry: string;
    [key: string]: string;
  };
}

export class HubSpotService {
  private accessToken: string;
  private userId: string;
  private companyId: string;

  constructor(accessToken: string, userId: string, companyId: string) {
    this.accessToken = accessToken;
    this.userId = userId;
    this.companyId = companyId;
  }

  // Public sync methods
  async syncAll() {
    await this.syncCompanies();
    await this.syncContacts();
    await this.syncDeals();
  }

  async syncContacts() {
    const contacts = await this.getContacts();
    for (const contact of contacts) {
      await this.processContact(contact);
    }
  }

  async syncDeals() {
    const deals = await this.getDeals();
    for (const deal of deals) {
      await this.processDeal(deal);
    }
  }

  async syncCompanies() {
    const companies = await this.getCompanies();
    for (const company of companies) {
      await this.processCompany(company);
    }
  }

  // Private methods to fetch data from HubSpot
  private async getContacts(): Promise<HubSpotContact[]> {
    const config = await getHubspotConfig();
    const response = await fetch(`${config.apiBaseUrl}/crm/v3/objects/contacts`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    if (!response.ok) throw new Error('Failed to fetch HubSpot contacts');
    const data = await response.json();
    return data.results;
  }

  private async getDeals(): Promise<HubSpotDeal[]> {
    const config = await getHubspotConfig();
    const response = await fetch(`${config.apiBaseUrl}/crm/v3/objects/deals`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    if (!response.ok) throw new Error('Failed to fetch HubSpot deals');
    const data = await response.json();
    return data.results;
  }

  private async getCompanies(): Promise<HubSpotCompany[]> {
    const config = await getHubspotConfig();
    const response = await fetch(`${config.apiBaseUrl}/crm/v3/objects/companies`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    if (!response.ok) throw new Error('Failed to fetch HubSpot companies');
    const data = await response.json();
    return data.results;
  }

  // Private methods to process and store data
  private async processCompany(company: HubSpotCompany) {
    const companyData = {
      hubspotId: company.id,
      name: company.properties.name || 'Unknown Company',
      domain: company.properties.domain || `hubspot-id-${company.id}`,
      industry: company.properties.industry || 'Unknown',
      size: company.properties.numberofemployees || '1',
      description: company.properties.description,
      website: company.properties.website,
    };
    await prisma.company.upsert({
      where: { hubspotId: company.id },
      update: companyData,
      create: companyData,
    });
  }

  private async processContact(contact: HubSpotContact) {
    const contactData = {
      hubspotId: contact.id,
      name: `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim(),
      email: contact.properties.email,
      phone: contact.properties.phone,
    };

    await prisma.contact.upsert({
      where: { hubspotId: contact.id },
      create: {
        ...contactData,
        user: { connect: { id: this.userId } },
        company: { connect: { id: this.companyId } },
      },
      update: {
        ...contactData,
        company: { connect: { id: this.companyId } },
      },
    });

    if (await this.analyzeContactForVAR(contact)) {
      await this.createVARLead(contact);
    }
  }

  private async processDeal(deal: HubSpotDeal) {
    const dealData = {
      hubspotId: deal.id,
      name: deal.properties.dealname,
      value: parseFloat(deal.properties.amount) || 0,
      stage: deal.properties.dealstage,
      expectedclose_date: new Date(deal.properties.closedate),
    };

    await prisma.deal.upsert({
      where: { hubspotId: deal.id },
      create: {
        ...dealData,
        user: { connect: { id: this.userId } },
        company: { connect: { id: this.companyId } },
      },
      update: dealData,
    });
  }

  private async analyzeContactForVAR(contact: HubSpotContact): Promise<boolean> {
    const score = await this.calculateVARScore(contact);
    return score >= 0.7;
  }

  private async calculateVARScore(contact: HubSpotContact): Promise<number> {
    // Simplified scoring logic for demonstration
    let score = 0;
    if (contact.properties.industry?.toLowerCase().includes('technology')) score += 0.4;
    if (contact.properties.jobtitle?.toLowerCase().includes('director')) score += 0.3;
    if (contact.properties.company_size && parseInt(contact.properties.company_size) > 50) score += 0.3;
    return score;
  }

  private async createVARLead(contact: HubSpotContact) {
    await prisma.vARLead.create({
      data: {
        companyname: contact.properties.company,
        contactname: `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim(),
        email: contact.properties.email,
        phone: contact.properties.phone,
        status: 'New',
        user: { connect: { id: this.userId } },
      },
    });
  }
}

async function getClient() {
  const apiKey = getHubspotApiKey();
  if (!apiKey) {
    logger.error({}, 'HubSpot API key not available. Check environment variables.');
    return null;
  }
  return new Client({ apiKey });
}

export async function syncHubspotData(userId: string) {
  const prisma = new PrismaClient();
  const hubspotClient = await getClient();

  if (!hubspotClient) {
    return; // Already logged in getClient
  }

  try {
    // Sync Companies
    const companies = await hubspotClient.crm.companies.getAll();
    for (const company of companies) {
      const companyData = {
        name: company.properties.name || 'Unknown Company',
        domain: company.properties.domain || `hubspot-id-${company.id}`,
        industry: company.properties.industry || 'Unknown',
        size: company.properties.numberofemployees || '1',
        description: company.properties.description,
        website: company.properties.website,
        hubspotId: company.id,
      };

      await prisma.company.upsert({
        where: { hubspotId: company.id },
        update: companyData,
        create: companyData,
      });
    }

    // Sync Contacts
    const contacts = await hubspotClient.crm.contacts.getAll();
    for (const contact of contacts) {
      if (!contact.properties.associatedcompanyid) continue;
      const company = await prisma.company.findUnique({
        where: { hubspotId: contact.properties.associatedcompanyid },
      });

      if (company) {
        const firstName = contact.properties.firstname || '';
        const lastName = contact.properties.lastname || '';
        const contactData = {
          name: `${firstName} ${lastName}`.trim() || contact.properties.email || 'Unnamed Contact',
          email: contact.properties.email,
          firstName: firstName,
          lastName: lastName,
          phone: contact.properties.phone,
          companyId: company.id,
          userId: userId,
          hubspotId: contact.id,
        };
        await prisma.contact.upsert({
          where: { hubspotId: contact.id },
          update: contactData,
          create: contactData,
        });
      }
    }

    // Sync Deals
    const deals = await hubspotClient.crm.deals.getAll();
    for (const deal of deals) {
      if (!deal.properties.associatedcompanyid) continue;
      const company = await prisma.company.findUnique({
        where: { hubspotId: deal.properties.associatedcompanyid },
      });

      if (company) {
        const dealData = {
          name: deal.properties.dealname || 'Unnamed Deal',
          value: parseFloat(deal.properties.amount || '0'),
          stage: deal.properties.dealstage || 'Unknown',
          expectedclose_date: deal.properties.closedate
            ? new Date(deal.properties.closedate)
            : null,
          companyid: company.id,
          userid: userId,
          hubspotId: deal.id,
        };
        await prisma.deal.upsert({
          where: { hubspotId: deal.id },
          update: dealData,
          create: dealData,
        });
      }
    }

    logger.info({ userId }, 'HubSpot data sync completed successfully.');
  } catch (err) {
    logger.error({ err }, 'Failed to sync HubSpot data.');
    throw err;
  } finally {
    await prisma.$disconnect();
  }
} 

function getHubspotConfig() {
  throw new Error('Function not implemented.');
}
