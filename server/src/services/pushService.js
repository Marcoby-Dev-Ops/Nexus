const fs = require('fs');
const path = require('path');
const webPush = require('web-push');
const { logger } = require('../utils/logger');

const STORAGE_PATH = path.join(__dirname, '../../tmp/push_subscriptions.json');
const DEFAULT_VAPID_SUBJECT = 'mailto:notifications@nexus.local';

let vapidConfigured = false;

const ensureStorage = () => {
  const dir = path.dirname(STORAGE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const readSubscriptions = () => {
  try {
    if (!fs.existsSync(STORAGE_PATH)) {
      return [];
    }
    const raw = fs.readFileSync(STORAGE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    logger.error('Failed to read push subscription store', error);
    return [];
  }
};

const writeSubscriptions = (subscriptions) => {
  ensureStorage();
  fs.writeFileSync(STORAGE_PATH, JSON.stringify(subscriptions, null, 2), 'utf-8');
};

const getVapidConfig = () => ({
  publicKey: process.env.VAPID_PUBLIC_KEY || null,
  privateKey: process.env.VAPID_PRIVATE_KEY || null,
  subject: process.env.VAPID_SUBJECT || DEFAULT_VAPID_SUBJECT
});

const ensureVapidConfigured = () => {
  const { publicKey, privateKey, subject } = getVapidConfig();
  if (publicKey && privateKey && !vapidConfigured) {
    webPush.setVapidDetails(subject, publicKey, privateKey);
    vapidConfigured = true;
    logger.info('Web Push VAPID keys configured');
  }

  return Boolean(publicKey && privateKey);
};

const sanitizeSubscription = (subscription) => {
  const { endpoint, keys, expirationTime } = subscription;
  return {
    endpoint,
    keys,
    expirationTime: expirationTime ?? null
  };
};

const saveSubscription = (payload) => {
  const { endpoint, keys, userId } = payload;

  if (!endpoint || !keys) {
    throw new Error('Subscription endpoint and keys are required');
  }

  const subscriptions = readSubscriptions();
  const existingIndex = subscriptions.findIndex((sub) => sub.endpoint === endpoint);
  const now = new Date().toISOString();

  const baseSubscription = sanitizeSubscription(payload);

  const subscriptionRecord = {
    id: existingIndex >= 0 ? subscriptions[existingIndex].id : `push_${Date.now()}`,
    userId,
    endpoint: baseSubscription.endpoint,
    keys: baseSubscription.keys,
    expirationTime: baseSubscription.expirationTime,
    createdAt: existingIndex >= 0 ? subscriptions[existingIndex].createdAt : now,
    updatedAt: now
  };

  if (existingIndex >= 0) {
    subscriptions[existingIndex] = subscriptionRecord;
  } else {
    subscriptions.push(subscriptionRecord);
  }

  writeSubscriptions(subscriptions);
  return subscriptionRecord;
};

const removeSubscription = (endpoint) => {
  const subscriptions = readSubscriptions();
  const filtered = subscriptions.filter((sub) => sub.endpoint !== endpoint);
  writeSubscriptions(filtered);
  return subscriptions.length !== filtered.length;
};

const getSubscriptionByEndpoint = (endpoint) => {
  const subscriptions = readSubscriptions();
  return subscriptions.find((sub) => sub.endpoint === endpoint) || null;
};

const listSubscriptions = () => readSubscriptions();

const sendNotification = async (subscription, payload) => {
  if (!ensureVapidConfigured()) {
    throw new Error('VAPID keys are not configured');
  }

  const { endpoint, keys, expirationTime } = subscription;

  return webPush.sendNotification(
    {
      endpoint,
      keys,
      expirationTime
    },
    JSON.stringify(payload)
  );
};

const sendTestNotification = async ({ title, body, url }) => {
  if (!ensureVapidConfigured()) {
    throw new Error('VAPID keys are not configured');
  }

  const subscriptions = readSubscriptions();
  if (subscriptions.length === 0) {
    return { delivered: 0, removed: 0, failures: [] };
  }

  const payload = {
    title: title || 'Nexus',
    body: body || 'This is a test push notification from Nexus.',
    url: url || '/dashboard'
  };

  let delivered = 0;
  let removed = 0;
  const failures = [];
  const stillValid = [];

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await sendNotification(subscription, payload);
        delivered += 1;
        stillValid.push(subscription);
      } catch (error) {
        logger.warn('Failed to deliver push notification', {
          endpoint: subscription.endpoint,
          error: error.message
        });

        const removeStatusCodes = [404, 410];
        if (removeStatusCodes.includes(error.statusCode)) {
          removed += 1;
        } else {
          stillValid.push(subscription);
          failures.push({
            endpoint: subscription.endpoint,
            error: error.message
          });
        }
      }
    })
  );

  if (stillValid.length !== subscriptions.length) {
    writeSubscriptions(stillValid);
  }

  return { delivered, removed, failures };
};

module.exports = {
  pushService: {
    getVapidConfig,
    ensureVapidConfigured,
    listSubscriptions,
    getSubscriptionByEndpoint,
    saveSubscription,
    removeSubscription,
    sendTestNotification
  }
};
