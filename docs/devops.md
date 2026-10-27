
# DevOps instructions

The reusable fresh-VPS bootstrap assets now live in `ops/fresh-vps/`.

## What is included

That directory contains:

- `deploy.sh` — runs locally and pushes the remote setup script to the server
- `vps_setup.sh` — runs on the VPS and applies the base server setup
- `vps_bootstrap.md` — copy-friendly instructions for using the bootstrap in this repo or any new repo

## Current assumptions

The current flow assumes:

- a provider-level firewall is already configured before the bootstrap starts
- port `22` is already open inbound at the provider level
- other inbound traffic is blocked until intentionally opened
- an SSH key is already added to the server for the initial root login

## How to use it

1. Open `ops/fresh-vps/vps_bootstrap.md`.
2. Review the variables at the top of `ops/fresh-vps/deploy.sh`.
3. Make the scripts executable.
4. Run the local deploy script with the VPS IP address.
5. Log in as the new deploy user after the bootstrap completes.
6. Configure Caddy and your application deployment on top of that base host setup.

## What the setup prepares

The bootstrap configures:

- a non-root deploy user with sudo access
- SSH hardening
- UFW rules for `22`, `80`, and `443`
- Docker plus a shared `web_network`
- Caddy for reverse proxying and HTTPS
- Fail2Ban with a basic SSH jail

## Future enhancements

Likely next improvements:

- Hetzner MCP integration to provision servers, firewalls, and DNS automatically
- cloud-init support for first-boot provisioning
- app deployment templates layered on top of the host bootstrap
- monitoring, backup, and alerting defaults
