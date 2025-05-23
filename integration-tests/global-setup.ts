import { apiService } from './_stub/api/setup';
import { setupDatabaseStub } from './_stub/data/setup';

export default async function globalSetup(): Promise<void> {
  console.log('🔧 Global setup: initializing test environment');
  
  try {
    await setupDatabaseStub();
    
    // Verify credentials are available in global variable
    console.log(`✅ Setup complete with ${global.__CREDENTIALS__?.length ?? 0} test credentials available`);
    
    await apiService.start();
    
    console.log('✅ Global setup complete');
    
    global.__API_SERVICE__ = apiService;
  } catch (error) {
    console.error('❌ Error in global setup:', error);
    throw error;
  }
} 
