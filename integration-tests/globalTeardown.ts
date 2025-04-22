import { apiService } from './_stub/api/setup';
import { teardownDatabaseStub } from './_stub/data/teardown';

export default async function globalTeardown(): Promise<void> {
  console.log('🧹 Global teardown: cleaning up resources');
  
  try {
    await apiService.stop();
    
    await teardownDatabaseStub();
    
    console.log('✅ Global teardown complete');
  } catch (error) {
    console.error('❌ Error in global teardown:', error);
    
    try {
      await apiService.stop();
    } catch (e) { 
      console.error('Failed to stop API service:', e);
    }
    
    try {
      await teardownDatabaseStub();
    } catch (e) {
      console.error('Failed to tear down database:', e);
    }
  }
}
