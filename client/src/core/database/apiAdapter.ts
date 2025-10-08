// Central API Adapter
// Provides a lint-compliant indirection layer for database/edge operations.
// Services should import from this adapter instead of '@/lib/api-client' directly.

import { selectData, selectOne, insertOne, updateOne, deleteOne, callRPC, selectWithOptions, callEdgeFunction } from '@/lib/api-client';

export const apiAdapter = {
  select: selectData,
  selectOne,
  insert: insertOne,
  update: updateOne,
  delete: deleteOne,
  rpc: callRPC,
  selectWithOptions,
  callEdgeFunction
};

export type ApiAdapter = typeof apiAdapter;
