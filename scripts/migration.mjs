import "dotenv/config";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as Sentry from "@sentry/node";

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.ENVIRONMENT
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dataDirectory = path.join(__dirname, "data");

const uri = process.env.MIGRATION_DB_URI;

if (!uri) {
  Sentry.captureMessage("DATABASE_URI environment variable is not set", "error");
  process.exit(1);
}

Sentry.captureMessage(`Connecting to MongoDB: ${uri}`, "info");

function convertObjectIds(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertObjectIds(item));
  }
  
  if (obj.$oid) {
    return mongoose.Types.ObjectId.createFromHexString(obj.$oid);
  }
  
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = convertObjectIds(value);
  }
  return result;
}

async function processDocument(model, item) {
  const doc = convertObjectIds(item);
  
  if (doc._id) {
    const existingDoc = await model.findById(doc._id);
    
    if (existingDoc) {
      await model.findByIdAndUpdate(doc._id, doc, { overwrite: true });
      return "updated";
    } else {
      await model.create(doc);
      return "inserted";
    }
  } else {
    await model.create(doc);
    return "inserted";
  }
}

async function processCollection(file) {
  const collectionName = path.basename(file, ".json");
  Sentry.captureMessage(`Processing collection: ${collectionName}`, "info");
  
  const filePath = path.join(dataDirectory, file);
  const jsonData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  
  if (!Array.isArray(jsonData)) {
    Sentry.captureMessage(`Data in ${file} is not an array. Skipping.`, "error");
    return { inserted: 0, updated: 0, errors: 0 };
  }
  
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
      Sentry.captureException(err);
      Sentry.captureMessage(`Error processing document: ${JSON.stringify(item)}`, "error");
      errors++;
    }
  }
  
  Sentry.captureMessage(`Collection ${collectionName}: ${inserted} inserted, ${updated} updated, ${errors} errors`, "info");
  return { inserted, updated, errors };
}

async function migrateData() {
  try {
    await mongoose.connect(uri);
    Sentry.captureMessage("Connected to MongoDB with Mongoose", "info");
    
    const files = fs.readdirSync(dataDirectory).filter(file => file.endsWith(".json"));
    
    for (const file of files) {
      await processCollection(file);
    }
    
    Sentry.captureMessage("Migration completed successfully", "info");
  } catch (err) {
    Sentry.captureException(err);
    Sentry.captureMessage("Migration failed", "error");
  } finally {
    await mongoose.connection.close();
    Sentry.captureMessage("MongoDB connection closed", "info");
  }
}

migrateData().catch(err => {
  Sentry.captureException(err);
});