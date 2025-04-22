import mongoose from 'mongoose';

jest.setTimeout(30000);

afterAll(async () => {
  console.log('Global teardown: cleaning up resources');
  
  try {
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      console.log('Closing mongoose connection in global teardown');
      await mongoose.connection.close();
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (error) {
    console.error('Error in global teardown:', error);
  }
});
