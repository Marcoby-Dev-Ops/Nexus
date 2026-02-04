const express = require('express');
const { z } = require('zod');
const { authenticateToken } = require('../../middleware/auth');
const { createCoolifyClient } = require('../../services/coolifyClient');
const { writeAuditEvent, listAuditEvents } = require('../../services/opsAuditLog');
const { logger } = require('../../utils/logger');

const router = express.Router();
router.use(authenticateToken);

const actionBodySchema = z.object({
  confirm: z.boolean().optional().default(false),
  reason: z.string().optional().default(''),
  force: z.boolean().optional().default(false),
  instant_deploy: z.boolean().optional().default(false)
});

function actorFromReq(req) {
  return {
    id: req.user?.id || req.user?.sub || null,
    email: req.user?.email || null
  };
}

router.get('/health', async (req, res) => {
  try {
    const client = createCoolifyClient();
    const resp = await client.get('/health');
    return res.json({ success: true, data: resp.data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/apps', async (_req, res) => {
  try {
    const client = createCoolifyClient();
    const resp = await client.get('/applications');
    return res.json({ success: true, data: resp.data?.data ?? resp.data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/dbs', async (_req, res) => {
  try {
    const client = createCoolifyClient();
    const resp = await client.get('/databases');
    return res.json({ success: true, data: resp.data?.data ?? resp.data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/apps/:uuid/logs', async (req, res) => {
  try {
    const client = createCoolifyClient();
    const { uuid } = req.params;
    const resp = await client.get(`/applications/${uuid}/logs`);
    return res.json({ success: true, data: resp.data?.data ?? resp.data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/apps/:uuid/restart', async (req, res) => {
  const parse = actionBodySchema.safeParse(req.body ?? {});
  if (!parse.success) {
    return res.status(400).json({ success: false, error: 'Invalid body', details: parse.error.flatten() });
  }

  const { confirm, reason } = parse.data;
  const { uuid } = req.params;

  if (!confirm) {
    return res.status(409).json({
      success: false,
      error: 'Confirmation required',
      code: 'CONFIRM_REQUIRED',
      hint: 'POST again with {"confirm": true, "reason": "..."}'
    });
  }

  const client = createCoolifyClient();
  const actor = actorFromReq(req);

  try {
    const resp = await client.post(`/applications/${uuid}/restart`);

    await writeAuditEvent({
      actor,
      jwtPayload: req.user?.jwtPayload,
      action: 'coolify.application.restart',
      target: { type: 'application', uuid },
      request: { reason },
      result: resp.data
    });

    return res.json({ success: true, data: resp.data?.data ?? resp.data });
  } catch (error) {
    logger.warn('Coolify restart failed', { uuid, error: error.message });
    await writeAuditEvent({
      actor,
      jwtPayload: req.user?.jwtPayload,
      action: 'coolify.application.restart',
      target: { type: 'application', uuid },
      request: { reason },
      result: { success: false, error: error.message }
    });

    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/apps/:uuid/deploy', async (req, res) => {
  const parse = actionBodySchema.safeParse(req.body ?? {});
  if (!parse.success) {
    return res.status(400).json({ success: false, error: 'Invalid body', details: parse.error.flatten() });
  }

  const { confirm, reason, force, instant_deploy } = parse.data;
  const { uuid } = req.params;

  if (!confirm) {
    return res.status(409).json({
      success: false,
      error: 'Confirmation required',
      code: 'CONFIRM_REQUIRED',
      hint: 'POST again with {"confirm": true, "reason": "...", "force": false}'
    });
  }

  const client = createCoolifyClient();
  const actor = actorFromReq(req);

  try {
    const resp = await client.post(`/applications/${uuid}/deploy`, {
      force: !!force,
      instant_deploy: !!instant_deploy
    });

    await writeAuditEvent({
      actor,
      jwtPayload: req.user?.jwtPayload,
      action: 'coolify.application.deploy',
      target: { type: 'application', uuid },
      request: { reason, force: !!force, instant_deploy: !!instant_deploy },
      result: resp.data
    });

    return res.json({ success: true, data: resp.data?.data ?? resp.data });
  } catch (error) {
    logger.warn('Coolify deploy failed', { uuid, error: error.message });

    await writeAuditEvent({
      actor,
      jwtPayload: req.user?.jwtPayload,
      action: 'coolify.application.deploy',
      target: { type: 'application', uuid },
      request: { reason, force: !!force, instant_deploy: !!instant_deploy },
      result: { success: false, error: error.message }
    });

    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/audit', async (req, res) => {
  const limit = Number(req.query.limit || 50);
  const resp = await listAuditEvents({ limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 200) : 50 });
  return res.json(resp);
});

module.exports = router;
