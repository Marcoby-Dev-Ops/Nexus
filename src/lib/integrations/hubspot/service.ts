import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/security';
import { HUBSPOT_CONFIG } from './config';

interface HubSpotContact {
  id: string;
  properties: {
    email: string;
    firstname: string;
    lastname: string;
    company: string;
    phone: string;
    [key: string]: string;
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
  private hubId: string;

  constructor(accessToken: string, hubId: string) {
    this.accessToken = accessToken;
    this.hubId = hubId;
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

  private async getContacts(): Promise<HubSpotContact[]> {
    const response = await fetch(`${HUBSPOT_CONFIG.apiBaseUrl}/crm/v3/objects/contacts`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch HubSpot contacts');
    }

    const data = await response.json();
    return data.results;
  }

  private async getDeals(): Promise<HubSpotDeal[]> {
    const response = await fetch(`${HUBSPOT_CONFIG.apiBaseUrl}/crm/v3/objects/deals`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch HubSpot deals');
    }

    const data = await response.json();
    return data.results;
  }

  private async getCompanies(): Promise<HubSpotCompany[]> {
    const response = await fetch(`${HUBSPOT_CONFIG.apiBaseUrl}/crm/v3/objects/companies`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch HubSpot companies');
    }

    const data = await response.json();
    return data.results;
  }

  private async processContact(contact: HubSpotContact) {
    // Check if this is a potential VAR lead
    const isPotentialVAR = await this.analyzeContactForVAR(contact);

    // Store or update the contact in our database
    await prisma.contact.upsert({
      where: {
        hubspotId: contact.id
      },
      create: {
        hubspotId: contact.id,
        email: contact.properties.email,
        firstName: contact.properties.firstname,
        lastName: contact.properties.lastname,
        company: contact.properties.company,
        phone: contact.properties.phone,
        properties: contact.properties,
        isPotentialVAR,
        lastSyncedAt: new Date()
      },
      update: {
        email: contact.properties.email,
        firstName: contact.properties.firstname,
        lastName: contact.properties.lastname,
        company: contact.properties.company,
        phone: contact.properties.phone,
        properties: contact.properties,
        isPotentialVAR,
        lastSyncedAt: new Date()
      }
    });

    if (isPotentialVAR) {
      await this.createVARLead(contact);
    }
  }

  private async processDeal(deal: HubSpotDeal) {
    await prisma.deal.upsert({
      where: {
        hubspotId: deal.id
      },
      create: {
        hubspotId: deal.id,
        name: deal.properties.dealname,
        pipeline: deal.properties.pipeline,
        stage: deal.properties.dealstage,
        amount: parseFloat(deal.properties.amount) || 0,
        closeDate: new Date(deal.properties.closedate),
        properties: deal.properties,
        lastSyncedAt: new Date()
      },
      update: {
        name: deal.properties.dealname,
        pipeline: deal.properties.pipeline,
        stage: deal.properties.dealstage,
        amount: parseFloat(deal.properties.amount) || 0,
        closeDate: new Date(deal.properties.closedate),
        properties: deal.properties,
        lastSyncedAt: new Date()
      }
    });
  }

  private async processCompany(company: HubSpotCompany) {
    await prisma.company.upsert({
      where: {
        hubspotId: company.id
      },
      create: {
        hubspotId: company.id,
        name: company.properties.name,
        domain: company.properties.domain,
        industry: company.properties.industry,
        properties: company.properties,
        lastSyncedAt: new Date()
      },
      update: {
        name: company.properties.name,
        domain: company.properties.domain,
        industry: company.properties.industry,
        properties: company.properties,
        lastSyncedAt: new Date()
      }
    });
  }

  private async analyzeContactForVAR(contact: HubSpotContact): Promise<boolean> {
    // Implement VAR lead scoring logic
    const score = await this.calculateVARScore(contact);
    return score >= 0.7; // Threshold for potential VAR
  }

  private async calculateVARScore(contact: HubSpotContact): Promise<number> {
    let score = 0;
    const weights = {
      companySize: 0.3,
      industry: 0.2,
      role: 0.2,
      location: 0.1,
      technologyStack: 0.2
    };

    // Analyze company size
    const companySize = contact.properties.company_size;
    if (companySize === '51-200' || companySize === '201-500') {
      score += weights.companySize;
    }

    // Analyze industry
    const industry = contact.properties.industry?.toLowerCase();
    if (industry && ['technology', 'software', 'it', 'consulting'].includes(industry)) {
      score += weights.industry;
    }

    // Analyze role
    const role = contact.properties.jobtitle?.toLowerCase();
    if (role && ['ceo', 'cto', 'cio', 'director', 'manager', 'owner'].some(title => role.includes(title))) {
      score += weights.role;
    }

    // Analyze location
    const location = contact.properties.country?.toLowerCase();
    if (location && ['us', 'united states', 'canada', 'uk', 'united kingdom'].includes(location)) {
      score += weights.location;
    }

    // Analyze technology stack
    const techStack = contact.properties.technology_stack?.toLowerCase();
    if (techStack && ['microsoft', 'aws', 'azure', 'google cloud', 'salesforce'].some(tech => techStack.includes(tech))) {
      score += weights.technologyStack;
    }

    return score;
  }

  private async createVARLead(contact: HubSpotContact) {
    await prisma.varLead.create({
      data: {
        contactId: contact.id,
        email: contact.properties.email,
        company: contact.properties.company,
        status: 'new',
        score: await this.calculateVARScore(contact),
        source: 'hubspot',
        createdAt: new Date()
      }
    });
  }
} 