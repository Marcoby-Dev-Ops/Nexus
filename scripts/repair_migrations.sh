#!/bin/bash
set -e

echo "Starting migration history repair..."

# Mark remote-only migrations as 'reverted' locally
npx supabase migration repair --status reverted 20250608021404
npx supabase migration repair --status reverted 20250608021418
npx supabase migration repair --status reverted 20250608021428
npx supabase migration repair --status reverted 20250608021501
npx supabase migration repair --status reverted 20250608062205
npx supabase migration repair --status reverted 20250608062218
npx supabase migration repair --status reverted 20250608062234
npx supabase migration repair --status reverted 20250608062331
npx supabase migration repair --status reverted 20250608062347
npx supabase migration repair --status reverted 20250608065242
npx supabase migration repair --status reverted 20250608101607
npx supabase migration repair --status reverted 20250609021624
npx supabase migration repair --status reverted 20250609033403
npx supabase migration repair --status reverted 20250609033413
npx supabase migration repair --status reverted 20250609033426
npx supabase migration repair --status reverted 20250609033437
npx supabase migration repair --status reverted 20250609033450
npx supabase migration repair --status reverted 20250609033458
npx supabase migration repair --status reverted 20250609033516
npx supabase migration repair --status reverted 20250609061012
npx supabase migration repair --status reverted 20250609061029
npx supabase migration repair --status reverted 20250609061227
npx supabase migration repair --status reverted 20250609061352
npx supabase migration repair --status reverted 20250609061621
npx supabase migration repair --status reverted 20250609080226
npx supabase migration repair --status reverted 20250609102120
npx supabase migration repair --status reverted 20250609121952
npx supabase migration repair --status reverted 20250609125326
npx supabase migration repair --status reverted 20250610031552
npx supabase migration repair --status reverted 20250610031613
npx supabase migration repair --status reverted 20250610031621
npx supabase migration repair --status reverted 20250610031727
npx supabase migration repair --status reverted 20250610031809
npx supabase migration repair --status reverted 20250610031955
npx supabase migration repair --status reverted 20250610032202
npx supabase migration repair --status reverted 20250610032246
npx supabase migration repair --status reverted 20250610045521

# Mark local-only migrations as 'applied' locally
npx supabase migration repair --status applied 20240521150000
npx supabase migration repair --status applied 20240717000000
npx supabase migration repair --status applied 20250101000001
npx supabase migration repair --status applied 20250103000001
npx supabase migration repair --status applied 20250103000002
npx supabase migration repair --status applied 20250109000000
npx supabase migration repair --status applied 20250109120000
npx supabase migration repair --status applied 20250110000000
npx supabase migration repair --status applied 20250110000001
npx supabase migration repair --status applied 20250111000000
npx supabase migration repair --status applied 20250113000000
npx supabase migration repair --status applied 20250115000000
npx supabase migration repair --status applied 20250115000001
npx supabase migration repair --status applied 20250115000002
npx supabase migration repair --status applied 20250116000000
npx supabase migration repair --status applied 20250116000001
npx supabase migration repair --status applied 20250606014049
npx supabase migration repair --status applied 20250607032600
npx supabase migration repair --status applied 20250607032700
npx supabase migration repair --status applied 20250608120000
npx supabase migration repair --status applied 20250608150000

echo "Migration history repair complete." 