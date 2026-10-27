# Fresh VPS bootstrap

Quick reference for the reusable VPS bootstrap in this folder.

For the fuller guide, see [`vps_bootstrap.md`](./vps_bootstrap.md).

## What this gives you

- a non-root deploy user
- SSH hardening
- UFW allowing `22`, `80`, and `443`
- Docker and a shared `web_network`
- Caddy with automatic HTTPS
- Fail2Ban for SSH protection

## Critical prerequisite

Your provider-level firewall must allow inbound `80` and `443` before Caddy can obtain certificates and before the public URLs will load.

If the provider firewall still only allows `22`, the bootstrap can still finish successfully on the VPS while the public domains appear down and Caddy logs ACME timeout errors.

### Hetzner firewall example

If you are using Hetzner Cloud Firewall, the working baseline is:

- inbound `TCP` `22` from **your admin IP only**
- inbound `ICMP` from `Any IPv4` and `Any IPv6` (optional but useful)
- inbound `TCP` `80` from `Any IPv4` and `Any IPv6`
- inbound `TCP` `443` from `Any IPv4` and `Any IPv6`

If `80` and `443` are missing at the Hetzner firewall layer, the VPS may still show Caddy listening locally while public HTTP/HTTPS and ACME validation fail.

## Quick start

```bash
bash ./ops/fresh-vps/deploy.sh \
  --server-ip <server-ip> \
  --root-domain example.com \
  --app-subdomain app.example.com \
  --acme-email you@example.com \
  --ssh-key ~/.ssh/your_key \
  --public-key ~/.ssh/your_key.pub
```

## What to expect after a good run

- Caddy is running on the VPS
- ports `80` and `443` are listening on the VPS
- the deploy script runs public HTTP checks for both domains
- if those checks fail, the first thing to verify is the provider firewall

## Reruns

The bootstrap is safe to rerun.

- it prefers `root` on the first run
- it falls back to the deploy user with `sudo` on reruns
- it only restarts SSH if the hardening settings actually changed

## App deployment note

This bootstrap prepares the host and reverse proxy. It does not deploy your application code automatically.

For static SPAs, a common next step is to copy the production build to a web root and have Caddy serve it directly.
For backend apps, point the app subdomain to the process or container listening on the chosen upstream port.
