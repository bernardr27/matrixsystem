# Nexus Maintenance Guide

This guide explains how to keep your Nexus system healthy and safe using the custom tools we've built.

## Tools Overview

All tools are located in the `scripts/` folder, but you can use the **Quick Launcher** in the root folder.

### 1. `maintenance.bat` (Recommended)
This is your **one-click solution**. Double-click this file to:
1.  Run a full **System Analysis** (checks for errors).
2.  If the analysis passes, it automatically creates a **Backup**.

### 2. `scripts/analyze.ps1`
Run this if you just want to check the system health without backing up.
- **Dependency Audit**: Checks for security holes.
- **Linting**: Checks your code for quality issues.
- **Build Verification**: Ensures the app can actually compile.
- **Disk Space**: Warns if you're running low on space.

### 3. `scripts/backup.ps1`
Run this to create a snapshot of your project.
- **Saves to**: `g:\test_v2\nexus_backups`
- **Excludes**: `node_modules`, `.next`, and `.git` (to keep files small).
- **Format**: `Nexus_Backup_YYYY-MM-DD_HHMM.zip`

## Upgrade Procedure

When you want to update dependencies in the future:

1.  **Run Maintenance**: Run `maintenance.bat` to verify current health and backup.
2.  **Update**: Run `npm update` (or `npm install <package>@latest`).
3.  **Verify**: Run `scripts/analyze.ps1` again.
    - If it fails, restore from the backup zip created in step 1.

## Troubleshooting

- **Audit Warnings**: "Audit found security issues" is a warning from npm. Run `npm audit fix` if you are comfortable, or ask an agent to review them.
- **Build Failures**: If `analyze.ps1` fails at the "Build Verification" step, check the error message. Do not deploy until this passes.
