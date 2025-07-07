const { businessObservationService } = require('./src/lib/services/businessObservationService');

async function debug() {
  try {
    console.log('Testing individual observation generators...');
    
    const service = businessObservationService;
    const userId = 'test-user';
    const companyId = 'test-company';
    
    // Test email observations
    console.log('Testing email observations...');
    const emailObs = await service.generateEmailDomainObservations(userId);
    console.log('Email observations:', emailObs.length);
    
    // Test integration observations
    console.log('Testing integration observations...');
    const integrationObs = await service.generateIntegrationObservations(userId, companyId);
    console.log('Integration observations:', integrationObs.length);
    
    // Test security observations
    console.log('Testing security observations...');
    const securityObs = await service.generateSecurityObservations(userId);
    console.log('Security observations:', securityObs.length);
    
    // Test performance observations
    console.log('Testing performance observations...');
    const performanceObs = await service.generatePerformanceObservations(userId);
    console.log('Performance observations:', performanceObs.length);
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debug();
