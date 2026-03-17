# Permanent Cloud Runtime on AWS (EC2)

## Outcome
- Matrix services run on AWS, not on your desktop.
- No startup `node.exe` dependency on your local machine.
- Services auto-restart on crash and reboot.

## Recommended AWS setup
- EC2 Ubuntu instance (free-tier eligible class if available in your account/region).
- Keep only SSH inbound open (port 22, ideally your IP only).
- No public app ports required for sentinel/runner worker mode.

## One-time server bootstrap
On the EC2 instance:

```bash
curl -fsSL https://raw.githubusercontent.com/bernardr27/matrixsystem/main/infra/aws-ec2/install_aws_ec2.sh -o /tmp/install_aws_ec2.sh
sudo bash /tmp/install_aws_ec2.sh
```

Before final start, ensure `/opt/matrix/.env` exists with required secrets:
- `SUPABASE_URL`
- `SUPABASE_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
- `REDIS_URL` (if used)
- any app/provider keys your runtime requires

## Verify cloud runtime
```bash
sudo bash /opt/matrix/infra/aws-ec2/verify_aws_ec2.sh
```

Expected:
- PM2 shows `matrix-sentinel` and `matrix-ghost-runner` as `online`
- heartbeat diagnostics show fresh activity

## Update after code changes
```bash
sudo bash /opt/matrix/infra/aws-ec2/update_aws_ec2.sh
```

## Recovery if install/update hits permission or lockfile issues
Use this when npm fails with `EACCES`, `rename`, or "damaged lockfile":

```bash
sudo bash /opt/matrix/infra/aws-ec2/repair_aws_ec2.sh
```

Then verify again:

```bash
sudo bash /opt/matrix/infra/aws-ec2/verify_aws_ec2.sh
```

## Optional workflow runner (single command recipes)
```bash
cd /opt/matrix
npm run workflow:list
node scripts/tools/workflow_recipes.cjs run ignite_all_cloud
```

## Local machine (keep desktop clean)
Run once on your PC:
```powershell
npm run local:disable:autostart
npm run local:stop:matrix
npm run local:guard:no-listeners
```

## Why this is more reliable than GitHub long-running jobs
- GitHub-hosted workflow jobs are bounded and not ideal for perpetual service hosting.
- EC2 + PM2 gives continuous process supervision and reboot persistence.
