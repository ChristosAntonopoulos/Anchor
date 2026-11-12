# Azure DevOps Variable Group Setup

## Quick Setup Guide

### Step 1: Create Variable Group

1. Go to **Azure DevOps** → **Pipelines** → **Library**
2. Click **+ Variable group**
3. Name: `POS-Secrets`
4. Click **+ Add** to add variables

### Step 2: Add Variables

Add these variables:

| Variable Name | Value | Secret? | Notes |
|--------------|-------|---------|-------|
| `MONGO_CONNECTION_STRING` | `mongodb://posuser:PosUserPassword123!@185.193.66.50:27017/pos?authSource=admin` | ✅ **Yes** | Mark as secret |
| `DOCKER_USERNAME` | Your Docker Hub username | ❌ No | e.g., `yourusername` |
| `DOCKER_PASSWORD` | Your Docker Hub password/token | ✅ **Yes** | Mark as secret |

### Home launcher — latest pipeline widget

The Android home widget reads the **latest org-wide** Azure DevOps run via `GET /api/pipelines/latest`.

Configure the API (ConfigMap / secrets / env):

| Setting | Env / key | Notes |
|--------|-----------|-------|
| Organization | ConfigMap `pos-api-config` → `AzureDevOps__Organization` (repo value: `CaptainBot`) | Also kept in POS-Secrets for reference; live pod reads the ConfigMap |
| PAT | POS-Secrets `AzureDevOps__PersonalAccessToken` → Deploy writes `pos-api-secrets` | Secret; scopes **Build (Read)** + **Project and Team (Read)** |

Without these, the widget shows a calm empty state (“No pipeline yet”).

### Step 3: Grant Pipeline Access

1. In the variable group, click **Pipeline permissions**
2. Click **+** to add pipeline
3. Select your pipeline (or allow all pipelines)
4. Click **Save**

### Step 4: Update Pipeline Variable

Edit `azure-pipelines.yml` and update line 16:

```yaml
- name: dockerRegistry
  value: 'your-dockerhub-username'  # Change to your actual Docker Hub username
```

## MongoDB Connection String Details

- **Server**: `185.193.66.50:27017`
- **Database**: `pos` (will be created automatically)
- **Username**: `posuser`
- **Password**: `PosUserPassword123!`
- **Auth Source**: `admin`

**Full Connection String**:
```
mongodb://posuser:PosUserPassword123!@185.193.66.50:27017/pos?authSource=admin
```

## Verification

After setting up the variable group:

1. Run the pipeline
2. Check the "Create Kubernetes Secrets" step in the Deploy stage
3. Verify the secret was created:
   ```bash
   kubectl get secret pos-api-secrets -n pos
   ```

## Troubleshooting

**Pipeline fails with "MONGO_CONNECTION_STRING not set"**:
- Verify variable group name is exactly `POS-Secrets`
- Check that `MONGO_CONNECTION_STRING` is added to the variable group
- Verify pipeline has access to the variable group (Pipeline permissions)

**Database connection fails**:
- Verify the connection string format is correct
- Check that the MongoDB server is accessible from Kubernetes cluster
- Verify username/password are correct
- Ensure the `pos` database can be created (user has permissions)
