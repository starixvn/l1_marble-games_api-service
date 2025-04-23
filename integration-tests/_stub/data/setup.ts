const CONNECTION_STRING = process.env.DATABASE_URI;
import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Operator, OperatorSchema } from '../../../src/operator/schema/operator.schema';

// Initialize global credentials if not already defined
  global.__CREDENTIALS__ ??= [];

async function connectToDatabase() {
  try {
    if (!CONNECTION_STRING) {
      throw new Error('DATABASE_URI environment variable is not set');
    }

    await mongoose.connect(CONNECTION_STRING);
    
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

async function createOperator() {
  const OperatorModel = mongoose.connection.model<Operator>('Operator', OperatorSchema);
  
  const randomPassword = Math.random().toString(36).substring(2, 10) + 
    Math.random().toString(36).substring(2, 10);
  
  const salt = 10;
  const hashedPassword = await bcrypt.hash(randomPassword, salt);
  
  const operator = new OperatorModel({
    password: hashedPassword,
  });
  
  const savedOperator = await operator.save();
  
  global.__CREDENTIALS__.push({
    password: randomPassword,
    operatorId: savedOperator._id.toString(),
  });
  
  console.log(`Created operator with ID: ${savedOperator._id.toString()}`);
  
  return savedOperator;
}

function getCredentials() {
  return [...global.__CREDENTIALS__];
}

async function closeDatabaseConnection() {
  await mongoose.connection.close();
}

async function clearDatabase() {
  const connection = mongoose.connection;
  if (!connection) {
    throw new Error('Database connection not established. Call connectToDatabase first.');
  }

  try {
    if (!connection.db) {
      throw new Error('Database instance not found in connection');
    }
    
    const collections = await connection.db.collections();
    
    const clearPromises = collections.map(collection => 
      collection.drop().catch(err => {
        if (err.message !== 'ns not found') {
          throw err;
        }
      })
    );
    
    await Promise.all(clearPromises);
    console.log('Database cleared successfully - all collections dropped');
    
    // Clear global credentials
    global.__CREDENTIALS__ = [];
  } catch (error) {
    console.error('Failed to clear database:', error);
    throw error;
  }
}

async function setupDatabaseStub() {
  await connectToDatabase();  
  await clearDatabase();
  await createOperator();
  await closeDatabaseConnection();
}

export { getCredentials, setupDatabaseStub };
