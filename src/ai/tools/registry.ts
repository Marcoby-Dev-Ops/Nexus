import { z } from 'zod';

export const tools = {
	create_invoice: {
		schema: z.object({
			customerId: z.string().uuid(),
			amount: z.number().positive(),
			memo: z.string().max(200).optional(),
		}),
		handler: async (args: any, ctx: any) => {
			// TODO: integrate with BillingService when available
			return { id: `inv_${Date.now()}`, ...args, status: 'draft' };
		},
	},
	schedule_meeting: {
		schema: z.object({ with: z.string().email(), when: z.string() }),
		handler: async (args: any, _ctx: any) => {
			return { eventId: `mtg_${Date.now()}`, ...args, status: 'scheduled' };
		},
	},
	create_task: {
		schema: z.object({ title: z.string().min(1), due: z.string().optional() }),
		handler: async (args: any, _ctx: any) => {
			return { taskId: `task_${Date.now()}`, ...args, status: 'open' };
		},
	},
} as const;

export function getTool(name: keyof typeof tools) {
	const t = tools[name];
	if (!t) throw new Error('ToolNotAllowed');
	return t;
}


