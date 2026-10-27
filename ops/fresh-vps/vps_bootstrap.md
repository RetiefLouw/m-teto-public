# VPS Bootstrap and Deployment

This folder contains scripts and templates for provisioning a fresh VPS with a clean, secure-enough foundation ready to host web applications. The setup installs and configures:

- **Host hardening**: SSH restrictions, firewall (UFW), system updates
- **Web infrastructure**: Caddy reverse proxy with automatic HTTPS (Let's Encrypt)
- **Container support**: Docker and a shared `web_network` for application services
- **Security**: Fail2Ban for brute-force protection
- **Static sites**: Pre-configured landing page on the root domain and app placeholder

## Philosophy

This is intentionally a base host bootstrap, not a full production platform installer. It gets the server into a secure, ready state so individual application repositories can layer their own deployment logic on top without fighting the base infrastructure.

The setup is **repo-agnostic**: the same scripts and flow work for any domain, application stack, or hosting pattern.

## Files

- `deploy.sh` — local orchestrator; runs on your machine to provision the remote VPS
- `vps_setup.sh` — remote provisioning script; executed on the VPS as root
- `vps_bootstrap.md` — this file; usage and architecture docs

## Before First Use

### Prerequisites

1. **A fresh VPS** with SSH root access and a public IP address.
2. **SSH key pair on your local machine** at the path you'll pass to the script (default: `~/.ssh/mteto_mac` and `~/.ssh/mteto_mac.pub`).
3. **SSH key authorized on the VPS root account** (added before the first run, typically by your hosting provider).
4. **DNS records pointing to the VPS IP** (optional for initial bootstrap, required for HTTPS certificates).
5. **Provider firewall allows inbound 80 and 443** before expecting public URLs or ACME certificate issuance to work.
6. **An email address** for Let's Encrypt ACME registration (required; pass via `--acme-email`).

### Review Before Running

1. Check that your private SSH key path is correct and that the matching `.pub` file exists.
2. Set the VPS IP explicitly with `--server-ip` or `SERVER_IP`; choose the domains for the server you intend to provision.
3. Decide on a deploy user name (default: `deploy`).
4. Have an ACME contact email ready.
5. Confirm your provider-level firewall already allows `80` and `443`, not just `22`.

### Hetzner Cloud firewall checklist

For Hetzner specifically, use the firewall rules as a concrete baseline:

- `TCP 22` from your current admin IP only
- `ICMP` from `Any IPv4` and `Any IPv6` (optional but recommended for diagnostics)
- `TCP 80` from `Any IPv4` and `Any IPv6`
- `TCP 443` from `Any IPv4` and `Any IPv6`

This matches the common “SSH locked down, web ports public” posture. If `80` and `443` are not open in Hetzner Cloud Firewall, Caddy will often look healthy on the server while Let's Encrypt validation fails with timeouts.

## Quick Start

### Example Configuration

```bash
./deploy.sh \
  --server-ip 192.0.2.1 \
  --root-domain example.com \
  --app-subdomain app.example.com \
  --acme-email admin@example.com \
  --ssh-key ~/.ssh/example_key
```

Replace the documentation IP and example domains with values for the VPS you intend to provision. The script requires an explicit server IP. The deploy user defaults to `deploy`.

After the remote bootstrap finishes, the local script performs public HTTP checks against both domains. If those checks fail, the most common cause is still an upstream/provider firewall blocking `80` or `443`.

If you are on Hetzner and see that warning, check the Cloud Firewall UI first before changing the VPS itself.

After you open `80` and `443` in the provider firewall, run:

- `sudo systemctl reload caddy`

This prompts Caddy to retry certificate issuance immediately instead of waiting for its normal retry window.

### Custom Configuration

```bash
./deploy.sh \
  --server-ip 192.0.2.1 \
  --root-domain example.com \
  --app-subdomain app.example.com \
  --acme-email admin@example.com \
  --ssh-key ~/.ssh/my-key \
  --public-key ~/.ssh/my-key.pub
```

### Using Environment Variables

```bash
export SERVER_IP=192.0.2.1
export ROOT_DOMAIN=example.com
export APP_SUBDOMAIN=app.example.com
export ACME_EMAIL=admin@example.com
./deploy.sh
```

## What Gets Provisioned

### System Setup

1. **Packages**: Updated system, base utilities, Docker dependencies, Fail2Ban, UFW.
2. **Deploy User**: Non-root user with passwordless sudo, authorized SSH keys installed from the public key passed to `deploy.sh` (falling back to root's `authorized_keys` only if needed).
3. **SSH Hardening**: Root login disabled, password authentication disabled.
4. **Firewall**: UFW enabled; ports 22 (SSH), 80 (HTTP), and 443 (HTTPS) allowed.
5. **Docker**: Installed; deploy user added to docker group; shared `web_network` created.
6. **Caddy**: Installed; configured to serve the landing page and app subdomain with automatic HTTPS.
7. **Fail2Ban**: Configured with basic SSH jail; 5 failed attempts in 10 minutes = 1 hour ban.

### Web Configuration

**Root Domain** (`m-teto.org`)
- Serves a branded landing page with static HTML/CSS
- HTTPS enabled and auto-renewed via Let's Encrypt
- Includes security headers (HSTS, X-Content-Type-Options, etc.)

**App Subdomain** (`app.m-teto.org`)
- Configured as a reverse proxy pointing to `127.0.0.1:3000` (configurable via `--app-upstream`)
- If the app is not available (502/503/504), serves a placeholder "Coming Soon" page
- HTTPS enabled and auto-renewed; same security headers as root domain

**Web Root**
- Root domain static files: `/var/www/m-teto.org/html/`
- App placeholder: `/var/www/app-placeholder/`

**Caddy Configuration**
- `/etc/caddy/Caddyfile` — generated at bootstrap time; includes both domains, TLS email, and all headers

### Docker & Networking

- Docker network: `web_network` (configurable via `--docker-network`)
- Intended for containerized applications that need to reverse-proxy through Caddy
- Example: A Next.js app container on port 3000 within this network will be proxied at `app.m-teto.org` automatically once running

## After Bootstrap

### Test the Bootstrap

```bash
# SSH as the deploy user
ssh -i ~/.ssh/example_key deploy@192.0.2.1

# Check Caddy status and logs
sudo journalctl -u caddy -n 50
sudo caddy version

# Test root domain in browser
curl https://m-teto.org

# Test app subdomain (will show placeholder)
curl https://app.m-teto.org

# Verify Docker network
docker network ls
docker network inspect web_network
```

### Connecting Your Application

When you're ready to deploy an app (e.g., a Next.js server):

1. **Build a Docker image** with your app listening on port 3000.
2. **Push to a registry** or have it available on the VPS.
3. **Run the container** on the VPS, connected to `web_network`:
   ```bash
   docker run -d \
     --name my-app \
     --network web_network \
     -p 3000:3000 \
     my-app-image:latest
   ```
4. **Caddy will automatically reverse-proxy** requests from `app.m-teto.org` → container on port 3000.
5. **No configuration of Caddy or this bootstrap is needed**; the setup is already ready.

### Custom Landing Page

The landing page is generated at bootstrap time using:
- `--landing-title` — customize the page title (default: `Welcome`)

To change the landing page HTML/CSS after bootstrap:

1. Edit the HTML files at `/var/www/m-teto.org/html/index.html`
2. No server restart needed; Caddy serves files directly

### Modifying Caddy Configuration

The Caddyfile is at `/etc/caddy/Caddyfile`. Changes take effect after:

```bash
sudo systemctl reload caddy
```

To add another domain or change reverse-proxy settings, edit the file and reload.

### Checking Logs

```bash
# Caddy
sudo journalctl -u caddy -f

# SSH/Fail2Ban
sudo journalctl -u fail2ban -f

# Docker
docker logs <container-id>
```

## Idempotency and Rerunning

All scripts are designed to be idempotent: running the bootstrap multiple times should safely update configuration without breaking the system.

**Safe to rerun:**
- User creation (skipped if already exists)
- Caddy config installation (backed up, then replaced)
- Docker network creation (skipped if already exists)
- UFW rules (safely re-allowed)
- Fail2Ban config (rewritten and restarted)

**Caution:**
- If you manually edit `/etc/caddy/Caddyfile` after bootstrap, rerunning will overwrite it (but a timestamped backup is created).
- If you manually edit `/home/deploy/.ssh/authorized_keys`, rerunning will replace it with the public key passed to `deploy.sh` (or fall back to `/root/.ssh/authorized_keys` if no asset is available).
- If your provider firewall blocks `80` or `443`, rerunning the bootstrap will not fix public reachability by itself; you must open those ports outside the VPS as well.

## What This Bootstrap Does NOT Do

- Clone or pull repositories
- Deploy application code
- Set up CI/CD pipelines
- Manage DNS records
- Configure external firewalls or security groups (your hosting provider's controls remain your responsibility)
- Create or manage databases outside of Docker
- Set up monitoring, logging aggregation, or alerting (left to application layers)

## Architecture: Root Domain + App Subdomain

The bootstrap prepares two distinct roles:

### Root Domain (Main Landing Page)

Static HTML served from `/var/www/{ROOT_DOMAIN}/html/`. Use for:
- Marketing landing pages
- Project documentation
- Static assets
- Redirects to other services

### App Subdomain (Reverse Proxy)

Reverse proxy to `{APP_UPSTREAM}` (default: `127.0.0.1:3000`). Use for:
- Main application (SPA, Next.js, Django, etc.)
- API servers
- Any containerized service exposed on the configured port

**Placeholder Behavior**: If the app is not running, Caddy automatically serves a "Coming Soon" placeholder instead of showing an error. This is smooth UX during initial setup and graceful during maintenance.

## Future App Handoff: The Contract

When you're ready to deploy your application (e.g., this Next.js starter or any other repo), ensure:

1. **App runs on port 3000** inside a Docker container (or adjust `--app-upstream` at bootstrap time).
2. **Container joins the `web_network`** (or the network you specified during bootstrap).
3. **Container is named or accessible on the Docker network** so `localhost:3000` is routable from Caddy.
4. **No manual Caddy configuration needed** — the prepared config already reverses-proxies `{APP_SUBDOMAIN}` → `{APP_UPSTREAM}`.

### Example: Deploying a Next.js App

Assume the VPS was bootstrapped for `m-teto.org` (root) and `app.m-teto.org` (app).

```bash
# On the VPS, inside the app repo or CI/CD:
docker build -t my-nextjs-app:latest .
docker run -d \
  --name my-nextjs \
  --network web_network \
  -p 3000:3000 \
  my-nextjs-app:latest
```

After the container starts, `app.m-teto.org` will instantly reverse-proxy to the running Next.js server. No Caddy restart needed.

### Example: Updating App Configuration

To change the app upstream port at a later time:

```bash
# Rerun the bootstrap script with a different --app-upstream:
./deploy.sh --acme-email admin@m-teto.org --app-upstream 127.0.0.1:8080

# Caddy config is rewritten, Caddy reloads, and the app subdomain now targets :8080
```

## Security Considerations

### What Is Hardened

- SSH: Root login disabled, password auth disabled, only key-based access.
- Firewall: UFW enabled, only 22/80/443 allowed (no other ports open by default).
- Fail2Ban: Brute-force SSH attempts are banned for 1 hour after 5 failures in 10 minutes.
- TLS: Caddy automatically provisions and renews Let's Encrypt certificates.
- Headers: HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy applied to all responses.

### What Is NOT Included

- DDoS protection
- WAF (Web Application Firewall)
- Intrusion detection beyond Fail2Ban
- Container isolation or SELinux policies
- Database security (left to your app)
- Secrets management (use environment variables or external vaults at app layer)

### Recommendations for Production

1. **Use provider-level firewalls** to restrict access by IP or geographic region if needed.
2. **Configure provider-level DDoS protection** if available.
3. **Add monitoring and alerting** (Prometheus, Datadog, New Relic, etc.).
4. **Implement automated backups** for any persistent data (databases, uploads, configs).
5. **Use a secrets manager** (HashiCorp Vault, AWS Secrets Manager, etc.) for sensitive values.
6. **Regularly update the base system** (cron job for unattended upgrades).
7. **Perform security audits** of the application code itself; this bootstrap only secures the host.

## Troubleshooting

### Caddy not starting or reloading

```bash
sudo systemctl status caddy
sudo journalctl -u caddy -n 100
sudo caddy validate --config /etc/caddy/Caddyfile
```

### HTTPS certificates not issuing

1. Ensure DNS records point to the VPS IP.
2. Ensure port 80 and 443 are reachable from the internet, including at the provider firewall level.
3. On Hetzner, confirm the Cloud Firewall has explicit inbound `TCP 80` and `TCP 443` rules for `Any IPv4` and `Any IPv6`.
4. Check Caddy logs for ACME errors.
5. Verify the ACME email is correct.
6. After fixing the provider firewall, reload Caddy so ACME retries immediately.

### App subdomain shows placeholder instead of app

1. Verify your container is running and listening on the configured port.
2. Check that the container is on the correct Docker network.
3. Verify the `--app-upstream` matches the container's port.
4. Check Docker and app container logs.

### Can't SSH as deploy user

1. Ensure `/home/deploy/.ssh/authorized_keys` exists and contains the public key you passed via `--public-key` (or the matching `<ssh-key>.pub` default).
2. Verify UFW allows port 22: `sudo ufw status`.
3. Check SSH logs: `sudo journalctl -u ssh -n 50`.

## Extending the Bootstrap

### Adding Another Domain

Edit `/etc/caddy/Caddyfile` and add a new block:

```caddy
another-domain.com {
    root * /var/www/another-domain.com/html
    file_server
    encode gzip zstd
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    }
}
```

Then reload Caddy:

```bash
sudo systemctl reload caddy
```

### Running Multiple Apps

If you need more than one containerized app:

1. Run each in a separate container on different ports (e.g., `:3000`, `:3001`).
2. Add reverse-proxy blocks to the Caddyfile for each subdomain.
3. Point each subdomain to the corresponding port.
4. Reload Caddy.

### Using a Different Docker Network Name

Pass `--docker-network custom_net` at bootstrap time, and ensure your containers join that network.

## Notes and Future Enhancements

### Completed in This Version

- [x] Hardened SSH and firewall
- [x] Installed Docker with a shared network
- [x] Installed and configured Caddy for reverse-proxying
- [x] Set up Fail2Ban for SSH protection
- [x] Generated landing page and app placeholder
- [x] Made all operations idempotent
- [x] Made the bootstrap repo-agnostic with parameters

### Possible Future Additions

- Hetzner Cloud MCP integration to provision VPS, firewall rules, and DNS from a single workflow
- cloud-init support so first-boot can run part of the bootstrap automatically
- Optional Docker Compose templates for app + Caddy co-deployment
- Baseline monitoring with health checks, uptime verification, and alerts
- Automated backups for databases, uploads, and Caddy configuration
- Separate app-deployment script that handles pulling repos, building images, and running containers

## Support and Issues

This bootstrap is intentionally minimal and generic. For help:

1. Check logs: `sudo journalctl -u caddy`, `sudo journalctl -u fail2ban`
2. Test Caddy config: `sudo caddy validate --config /etc/caddy/Caddyfile`
3. Verify Docker: `docker ps`, `docker network ls`
4. Review this doc for troubleshooting tips

---

**Last updated**: 2026-04-28  
**Bootstrap version**: 2.0 (single-command, repo-agnostic, domain-aware)
