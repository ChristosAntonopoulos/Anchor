#!/usr/bin/env node
/**
 * Uploads an FCM V1 Google service-account JSON to EAS for @botsyst3m/pos-mobile
 * so Expo Push Service can deliver to Android devices.
 *
 * Env:
 *   EXPO_TOKEN — Expo access token (POS-Secrets)
 *   FCM_SERVICE_ACCOUNT_JSON — raw service-account JSON or base64 (never logged)
 *
 * No-op (exit 0) when FCM_SERVICE_ACCOUNT_JSON is unset.
 */
const https = require('https');

const APP_ID = '6ffa3cc9-ec45-4359-849a-ea2bc3742d44';
const ACCOUNT_ID = '66d3743c-74d0-4404-9236-5affa6b0252f';
const APPLICATION_IDENTIFIER = 'com.pos.mobile';

function request(method, path, body, token) {
  const payload = body ? JSON.stringify(body) : null;
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.expo.dev',
        path,
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          let json = null;
          try {
            json = JSON.parse(text);
          } catch {
            json = { raw: text };
          }
          resolve({ status: res.statusCode || 0, json });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function decodeServiceAccount(raw) {
  const trimmed = raw.trim();
  if (trimmed.startsWith('{')) return JSON.parse(trimmed);
  const decoded = Buffer.from(trimmed, 'base64').toString('utf8').trim();
  return JSON.parse(decoded);
}

async function gql(token, query, variables) {
  const res = await request('POST', '/graphql', { query, variables }, token);
  if (res.status >= 400 || res.json?.errors) {
    const msg = JSON.stringify(res.json?.errors || res.json).slice(0, 800);
    throw new Error(`Expo GraphQL ${res.status}: ${msg}`);
  }
  return res.json.data;
}

async function main() {
  const token = (process.env.EXPO_TOKEN || '').trim();
  const rawSa = (process.env.FCM_SERVICE_ACCOUNT_JSON || '').trim();
  if (!rawSa) {
    console.log('FCM_SERVICE_ACCOUNT_JSON unset — skipping Expo FCM V1 credential upload.');
    return;
  }
  if (!token) {
    throw new Error('EXPO_TOKEN is required to upload FCM credentials.');
  }

  const sa = decodeServiceAccount(rawSa);
  if (!sa.client_email || !sa.project_id || !sa.private_key) {
    throw new Error('Service account JSON missing client_email, project_id, or private_key.');
  }
  console.log(
    `Uploading FCM V1 service account project_id=${sa.project_id} client_email=${sa.client_email} (private key not shown).`
  );

  const creds = await gql(
    token,
    `query($appId: String!) {
      app {
        byId(appId: $appId) {
          androidAppCredentials {
            id
            applicationIdentifier
            googleServiceAccountKeyForFcmV1 { id clientEmail projectIdentifier }
          }
        }
      }
    }`,
    { appId: APP_ID }
  );

  const list = creds?.app?.byId?.androidAppCredentials || [];
  const androidCreds =
    list.find((c) => c.applicationIdentifier === APPLICATION_IDENTIFIER) || list[0];
  if (!androidCreds?.id) {
    throw new Error(`No AndroidAppCredentials for ${APPLICATION_IDENTIFIER} on app ${APP_ID}`);
  }

  if (androidCreds.googleServiceAccountKeyForFcmV1?.id) {
    console.log(
      `Expo already has FCM V1 key id=${androidCreds.googleServiceAccountKeyForFcmV1.id} project=${androidCreds.googleServiceAccountKeyForFcmV1.projectIdentifier} — leaving as-is.`
    );
    return;
  }

  // Prefer the dedicated FCM V1 credential mutation (credential = full JSON string).
  try {
    await gql(
      token,
      `mutation($androidAppCredentialsId: String!, $credential: String!) {
        androidAppCredentials {
          createFcmV1Credential(
            androidAppCredentialsId: $androidAppCredentialsId
            credential: $credential
          ) {
            id
            googleServiceAccountKeyForFcmV1 { id clientEmail projectIdentifier }
          }
        }
      }`,
      {
        androidAppCredentialsId: androidCreds.id,
        credential: JSON.stringify(sa),
      }
    );
    console.log('Expo FCM V1 credential linked via createFcmV1Credential.');
    return;
  } catch (err) {
    console.warn('createFcmV1Credential failed, trying createGoogleServiceAccountKey path:', String(err).slice(0, 300));
  }

  const created = await gql(
    token,
    `mutation($accountId: ID!, $jsonKey: JSONObject!) {
      googleServiceAccountKey {
        createGoogleServiceAccountKey(
          accountId: $accountId
          googleServiceAccountKeyInput: { jsonKey: $jsonKey }
        ) {
          id
          clientEmail
          projectIdentifier
        }
      }
    }`,
    { accountId: ACCOUNT_ID, jsonKey: sa }
  );

  const keyId = created?.googleServiceAccountKey?.createGoogleServiceAccountKey?.id;
  if (!keyId) {
    throw new Error('Expo did not return a GoogleServiceAccountKey id.');
  }

  await gql(
    token,
    `mutation($id: ID!, $googleServiceAccountKeyId: ID!) {
      androidAppCredentials {
        setGoogleServiceAccountKeyForFcmV1(
          id: $id
          googleServiceAccountKeyId: $googleServiceAccountKeyId
        ) {
          id
          googleServiceAccountKeyForFcmV1 { id clientEmail projectIdentifier }
        }
      }
    }`,
    { id: androidCreds.id, googleServiceAccountKeyId: keyId }
  );

  console.log(`Expo FCM V1 credential linked (key id=${keyId}).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
