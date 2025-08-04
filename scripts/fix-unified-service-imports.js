const fs = require('fs');
const path = require('path');

// List of services that need to be fixed
const servicesToFix = [
  'src/core/services/AIService.ts',
  'src/core/services/BillingService.ts',
  'src/core/services/CompanyService.ts',
  'src/core/services/ContactService.ts',
  'src/core/services/DealService.ts',
  'src/core/services/NotificationService.ts',
  'src/core/services/TaskService.ts',
  'src/core/services/IntegrationService.ts'
];

// CRUD methods template
const crudMethodsTemplate = `
  // CRUD Methods required by CrudServiceInterface
  async get(id: string): Promise<ServiceResponse<T>> {
    this.logMethodCall('get', { id });
    
    return this.executeDbOperation(async () => {
      const { data, error } = await this.supabase
        .from(this.config.tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      const validatedData = this.config.schema.parse(data);
      return { data: validatedData, error: null };
    }, \`get \${this.config.tableName} \${id}\`);
  }

  async create(data: Partial<T>): Promise<ServiceResponse<T>> {
    this.logMethodCall('create', { data });
    
    return this.executeDbOperation(async () => {
      const { data: result, error } = await this.supabase
        .from(this.config.tableName)
        .insert({
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const validatedData = this.config.schema.parse(result);
      return { data: validatedData, error: null };
    }, \`create \${this.config.tableName}\`);
  }

  async update(id: string, data: Partial<T>): Promise<ServiceResponse<T>> {
    this.logMethodCall('update', { id, data });
    
    return this.executeDbOperation(async () => {
      const { data: result, error } = await this.supabase
        .from(this.config.tableName)
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      const validatedData = this.config.schema.parse(result);
      return { data: validatedData, error: null };
    }, \`update \${this.config.tableName} \${id}\`);
  }

  async delete(id: string): Promise<ServiceResponse<boolean>> {
    this.logMethodCall('delete', { id });
    
    return this.executeDbOperation(async () => {
      const { error } = await this.supabase
        .from(this.config.tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return { data: true, error: null };
    }, \`delete \${this.config.tableName} \${id}\`);
  }

  async list(filters?: Record<string, any>): Promise<ServiceResponse<T[]>> {
    this.logMethodCall('list', { filters });
    
    return this.executeDbOperation(async () => {
      let query = this.supabase
        .from(this.config.tableName)
        .select('*');
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const validatedData = data.map(item => this.config.schema.parse(item));
      return { data: validatedData, error: null };
    }, \`list \${this.config.tableName}\`);
  }

  async search(query: string, filters?: Record<string, any>): Promise<ServiceResponse<T[]>> {
    this.logMethodCall('search', { query, filters });
    
    return this.executeDbOperation(async () => {
      let supabaseQuery = this.supabase
        .from(this.config.tableName)
        .select('*');
      
      if (this.config.tableName === 'user_profiles') {
        supabaseQuery = supabaseQuery.or(\`first_name.ilike.%\${query}%,last_name.ilike.%\${query}%,email.ilike.%\${query}%\`);
      } else {
        supabaseQuery = supabaseQuery.ilike('name', \`%\${query}%\`);
      }
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            supabaseQuery = supabaseQuery.eq(key, value);
          }
        });
      }
      
      const { data, error } = await supabaseQuery;
      
      if (error) throw error;
      
      const validatedData = data.map(item => this.config.schema.parse(item));
      return { data: validatedData, error: null };
    }, \`search \${this.config.tableName}\`);
  }

  async bulkUpdate(updates: { id: string; data: Partial<T> }[]): Promise<ServiceResponse<T[]>> {
    this.logMethodCall('bulkUpdate', { count: updates.length });
    
    return this.executeDbOperation(async () => {
      const results: T[] = [];
      
      for (const { id, data: updateData } of updates) {
        const { data: result, error } = await this.supabase
          .from(this.config.tableName)
          .update({
            ...updateData,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        
        const validatedData = this.config.schema.parse(result);
        results.push(validatedData);
      }
      
      return { data: results, error: null };
    }, \`bulkUpdate \${this.config.tableName}\`);
  }`;

function fixServiceFile(filePath) {
  console.log(`Fixing ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File ${filePath} does not exist, skipping...`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace imports
  content = content.replace(
    /import \{ UnifiedService \} from '\.\/UnifiedService';/g,
    `import { BaseService } from './BaseService';
import type { ServiceResponse } from './BaseService';
import type { CrudServiceInterface, ServiceConfig } from './interfaces';`
  );
  
  // Replace class declaration
  content = content.replace(
    /export class (\w+) extends UnifiedService<(\w+)>/g,
    'export class $1 extends BaseService implements CrudServiceInterface<$2>'
  );
  
  // Add CRUD methods before the closing brace
  const classEndPattern = /(\s+}\s*)\n(\/\/.*\n)*$/;
  const match = content.match(classEndPattern);
  
  if (match) {
    content = content.replace(
      classEndPattern,
      `${crudMethodsTemplate}$1\n`
    );
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed ${filePath}`);
}

// Fix all services
servicesToFix.forEach(fixServiceFile);
console.log('All services have been fixed!'); 