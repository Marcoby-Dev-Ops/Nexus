// Re-export the canonical database API under the shared/core namespace for a staged migration
import { database, vectorSearch, callRPC, selectData, selectOne, insertOne, updateOne, deleteOne, upsertOne, selectWithOptions } from '@/lib/database';

export { database, vectorSearch, callRPC, selectData, selectOne, insertOne, updateOne, deleteOne, upsertOne, selectWithOptions };

export default database;
