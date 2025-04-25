import "dotenv/config";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dataDirectory = path.join(__dirname, "data");

const uri = process.env.DATABASE_URI;

if (!uri) {
  console.error("DATABASE_URI environment variable is not set");
  process.exit(1);
}

console.log(`Connecting to MongoDB: ${uri}`);

async function processDocument(model, item) {
  if (item._id && item._id.$oid) {
    const objectId = mongoose.Types.ObjectId.createFromHexString(item._id.$oid);
    
    const doc = { ...item };
    doc._id = objectId;
    delete doc._id.$oid;
    
    const existingDoc = await model.findById(objectId);
    
    if (existingDoc) {
      await model.findByIdAndUpdate(objectId, doc, { overwrite: true });
      return "updated";
    } else {
      await model.create(doc);
      return "inserted";
    }
  } else {
    await model.create(item);
    return "inserted";
  }
}

async function processCollection(file) {
  const collectionName = path.basename(file, ".json");
  console.log(`Processing collection: ${collectionName}`);
  
  const filePath = path.join(dataDirectory, file);
  const jsonData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  
  if (!Array.isArray(jsonData)) {
    console.error(`Data in ${file} is not an array. Skipping.`);
    return { inserted: 0, updated: 0, errors: 0 };
  }
  
  // Create a dynamic model for the collection
  // Using a simple schema that accepts any shape
  const schema = new mongoose.Schema({}, { 
    strict: false, 
    collection: collectionName 
  });
  
  const model = mongoose.model(collectionName, schema);
  
  let inserted = 0;
  let updated = 0;
  let errors = 0;
  
  for (const item of jsonData) {
    try {
      const result = await processDocument(model, item);
      if (result === "inserted") inserted++;
      if (result === "updated") updated++;
    } catch (err) {
      console.error(`Error processing document:`, err);
      console.error(item);
      errors++;
    }
  }
  
  console.log(`Collection ${collectionName}: ${inserted} inserted, ${updated} updated, ${errors} errors`);
  return { inserted, updated, errors };
}

async function migrateData() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB with Mongoose");
    
    const files = fs.readdirSync(dataDirectory).filter(file => file.endsWith(".json"));
    
    for (const file of files) {
      await processCollection(file);
    }
    
    console.log("Migration completed successfully");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

migrateData().catch(console.error);