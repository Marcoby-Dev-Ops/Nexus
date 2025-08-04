const fs = require('fs');

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

function commentOutUnifiedServiceImport(filePath) {
  console.log(`Commenting out UnifiedService import in ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File ${filePath} does not exist, skipping...`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Comment out the UnifiedService import
  content = content.replace(
    /import \{ UnifiedService \} from '\.\/UnifiedService';/g,
    '// import { UnifiedService } from \'./UnifiedService\'; // TEMPORARILY DISABLED'
  );
  
  // Comment out the class extension
  content = content.replace(
    /export class (\w+) extends UnifiedService<(\w+)>/g,
    '// export class $1 extends UnifiedService<$2> // TEMPORARILY DISABLED'
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Commented out UnifiedService in ${filePath}`);
}

// Comment out all services
servicesToFix.forEach(commentOutUnifiedServiceImport);
console.log('All UnifiedService imports have been commented out!'); 