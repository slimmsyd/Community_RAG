import mongoose from 'mongoose';

declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

// Add debug logging to see which environment files are being loaded
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Environment files loaded:', {
  env: process.env.MONGODB_URI?.includes('Kinnected') ? 'Has Kinnected URI' : 'Has correct URI',
  envPath: process.cwd()
});

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env or .env.local'
  );
}

let cached = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI as string, opts).then(() => {
      console.log('Connected to MongoDB');
      return cached;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
}

export default dbConnect; 