import mongoose from "mongoose";

const MONGODB_URI =
  "mongodb+srv://BBAP_YASHENSOLUTIONS_CEO:8NCXqIgFW4HwzDNh@cluster0.hmil8.azure.mongodb.net/test";

interface MongoConnection {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
}

let cached: MongoConnection = {
  conn: null,
  promise: null,
};

export async function connectToDatabase(): Promise<mongoose.Connection> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("Connected to MongoDB successfully");
      return mongoose.connection;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
