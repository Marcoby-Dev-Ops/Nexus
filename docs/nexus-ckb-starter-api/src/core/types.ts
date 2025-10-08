export type Provider = "m365" | "gdrive";
export type Domain = "HR" | "Ops" | "Sales" | "Finance" | "IT" | "Legal";
export type DocType = "policy" | "process" | "runbook" | "template" | "record";

export interface StoragePointer {
  provider: Provider;
  driveId: string;
  fileId: string;
  webUrl: string;
  path?: string;
  version?: string;
  aclHash: string;
}

export interface KnowledgeDocMeta {
  pointer: StoragePointer;
  title: string;
  mime: string;
  domain: Domain[];
  docType: DocType;
  lastModified: string;
  taxonomy: string[];
}

export interface IndexChunk {
  id: string;
  fileId: string;
  headingPath?: string;
  pageFrom?: number;
  pageTo?: number;
  text: string;
  embedding: number[];
  meta: KnowledgeDocMeta;
}
