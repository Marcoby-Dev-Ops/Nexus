import 'dotenv/config';
import { Command } from "commander";
import { Client } from "pg";
import { PgVectorAdapter } from "../services/index/pgvector/adapter.js";
import { MicrosoftGraphConnector } from "../connectors/microsoftGraph.js";
import { GoogleDriveConnector } from "../connectors/googleDrive.js";
import { ingestMsDriveItem, ingestGDriveFile } from "../services/ingest/fileIngest.js";

const program = new Command();
program.requiredOption("--provider <p>", "ms|gdrive")
  .option("--driveId <d>", "ms driveId").option("--itemId <i>", "ms itemId")
  .option("--fileId <f>", "gdrive fileId").option("--name <n>", "file name")
  .option("--webUrl <u>", "webUrl").option("--acl <a>", "acl hash", "public")
  .option("--domain <dom>", "comma domains", "Ops").option("--type <t>", "doc type", "record").parse(process.argv);
const opts = program.opts();

async function main(){
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const index = new PgVectorAdapter(client, Number(process.env.PGVECTOR_DIM || '1536'));
  if (opts.provider === 'ms') {
    const token = process.env.MS_ACCESS_TOKEN; if (!token) throw new Error("Set MS_ACCESS_TOKEN");
    const ms = new MicrosoftGraphConnector({ async getAccessToken(){ return token; } });
    if (!opts.driveId || !opts.itemId || !opts.name || !opts.webUrl) throw new Error("--driveId --itemId --name --webUrl required");
    await ingestMsDriveItem({ conn: ms, index, driveId: opts.driveId, itemId: opts.itemId, name: opts.name, webUrl: opts.webUrl, aclHash: opts.acl, domain: String(opts.domain).split(","), docType: opts.type });
  } else {
    const g = new GoogleDriveConnector({ clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET!, redirectUri: process.env.GOOGLE_REDIRECT_URI!, refreshToken: process.env.GOOGLE_REFRESH_TOKEN! });
    if (!opts.fileId || !opts.name || !opts.webUrl) throw new Error("--fileId --name --webUrl required");
    await ingestGDriveFile({ conn: g, index, fileId: opts.fileId, name: opts.name, webUrl: opts.webUrl, aclHash: opts.acl, domain: String(opts.domain).split(","), docType: opts.type });
  }
  await client.end(); console.log("Ingested.");
}
main().catch(e=>{ console.error(e); process.exit(1); });
