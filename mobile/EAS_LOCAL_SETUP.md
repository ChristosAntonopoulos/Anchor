# EAS Project Local Setup

## One-Time Setup (Run This Once)

Before the pipeline can build APKs, you need to create the EAS project locally. This is a one-time setup.

### Step 1: Install EAS CLI (if not already installed)

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

```bash
eas login
```

Enter your Expo credentials when prompted.

### Step 3: Navigate to Mobile Directory

```bash
cd mobile
```

### Step 4: Initialize EAS Project

```bash
eas init
```

This will:
- Ask you to select or create a project
- Link your local project to Expo
- Create the project on Expo's servers
- Generate any necessary configuration files

**Follow the prompts:**
- Select "Create a new project" (or use existing if you have one)
- Project name: `pos-mobile` (or use the default)
- This will create the project on Expo and link it

### Step 5: Verify Configuration

After initialization, check that these files exist:
- `mobile/eas.json` ✅ (should already exist)
- `mobile/app.json` should have the project configuration

### Step 6: Commit the Configuration

After running `eas init`, it may create or update some files. Commit any changes:

```bash
git add mobile/
git commit -m "Initialize EAS project locally"
git push
```

## After Local Setup

Once you've run `eas init` locally:
- The project is created on Expo
- The pipeline will automatically build APKs
- No more initialization needed in the pipeline
- Just push code and the pipeline builds!

## Verify It Worked

You can verify the project was created by:
1. Visiting: https://expo.dev/accounts/[your-username]/projects/pos-mobile
2. Or running: `eas project:info`

## Troubleshooting

### "Project already exists"
- This is OK! It means the project is already created
- The pipeline will use the existing project

### "Not authenticated"
- Run `eas login` again
- Make sure you're using the same account as your EXPO_TOKEN

### "No project found"
- Make sure you ran `eas init` in the `mobile/` directory
- Check that `app.json` has the correct `slug: "pos-mobile"`
