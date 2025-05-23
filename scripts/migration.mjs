import "dotenv/config";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.ENVIRONMENT
});

const envarMap = {
  ...process.env
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dataDirectory = path.join(__dirname, "data");

const uri = process.env.MIGRATION_DB_URI;
const dbName = process.env.DATABASE_NAME;

function log(message) {
  Sentry.captureMessage(message, "info");
  console.log(message);
}

function captureError(exception) {
  Sentry.captureException(exception);
  console.error(exception);
}


if (!uri || !dbName) {
  log("DATABASE_URI or DATABASE_NAME environment variable is not set");
  process.exit(1);
}

log(`Connecting to MongoDB: ${uri}`);

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
  log(`Processing collection: ${collectionName}`);
  
  const filePath = path.join(dataDirectory, file);
  let jsonString = fs.readFileSync(filePath, "utf8");
  for (const [key, value] of Object.entries(envarMap)) {
    jsonString = jsonString.replace(`$${key}`, value);
  }

  const jsonData = JSON.parse(jsonString);
  
  if (!Array.isArray(jsonData)) {
    log(`Data in ${file} is not an array. Skipping.`);
    return { inserted: 0, updated: 0, errors: 0 };
  }
  
  const schema = new mongoose.Schema({}, { 
    strict: false, 
    collection: collectionName 
  });
  
  const model = mongoose.model(collectionName, schema);
  
  log(`Clearing collection: ${collectionName}`);
  await model.deleteMany({});
  
  let inserted = 0;
  let updated = 0;
  let errors = 0;
  
  for (const item of jsonData) {
    try {
      const result = await processDocument(model, item);
      if (result === "inserted") inserted++;
      if (result === "updated") updated++;
    } catch (err) {
      captureError(err);
      log(`Error processing document: ${JSON.stringify(item)}`);
      errors++;
    }
  }
  
  log(`Collection ${collectionName}: ${inserted} inserted, ${updated} updated, ${errors} errors`);
  return { inserted, updated, errors };
}

async function migrateData() {

  try {
    await mongoose.connect(uri, {
      dbName
    });
    log("Connected to MongoDB with Mongoose");
    
    const files = fs.readdirSync(dataDirectory).filter(file => file.endsWith(".json"));
    
    for (const file of files) {
      await processCollection(file);
    }
    
    log("Migration completed successfully");
  } catch (err) {
    captureError(err);
    log("Migration failed");
  } finally {
    await mongoose.connection.close();
    log("MongoDB connection closed");
  }
}

migrateData().catch(err => {
  captureError(err);
});