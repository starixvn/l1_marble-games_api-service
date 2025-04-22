import mongoose from "mongoose";


export async function teardownDatabaseStub() {
  await mongoose.connection.close();
  console.log('Database connection closed');
}