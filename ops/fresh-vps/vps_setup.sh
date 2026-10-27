#!/usr/bin/env bash
set -euo pipefail

# VPS Bootstrap Remote Setup Script
# Runs on the VPS as root to harden the host, install Docker, Caddy, Fail2Ban,
# and set up domain-aware static sites and reverse-proxy configuration.

if [[ "${EUID}" -ne 0 ]]; then
  echo "This script must run as root."
  exit 1
fi

for var in DEPLOY_USER ROOT_DOMAIN APP_SUBDOMAIN APP_UPSTREAM ACME_EMAIL DOCKER_NETWORK REMOTE_ASSETS_PATH; do
  if [[ -z "${!var:-}" ]]; then
    echo "ERROR: Required environment variable ${var} not set"
    exit 1
  fi
done

SSH_CONFIG_PATH="/etc/ssh/sshd_config"
CADDY_CONFIG_DIR="/etc/caddy"
WWW_ROOT="/var/www"
DEPLOY_PUBLIC_KEY_PATH="${REMOTE_ASSETS_PATH}/deploy_authorized_key.pub"

log_info() {
  echo "ℹ  $*"
}

log_success() {
  echo "✓  $*"
}

log_error() {
  echo "✗  $*"
}

restart_ssh_service() {
  systemctl reload ssh 2>/dev/null && return
  systemctl restart ssh 2>/dev/null && return
  systemctl reload sshd 2>/dev/null && return
  systemctl restart sshd 2>/dev/null && return
  service ssh reload 2>/dev/null && return
  service ssh restart 2>/dev/null && return
  service sshd reload 2>/dev/null && return
  service sshd restart 2>/dev/null && return

  log_error "Unable to reload or restart the SSH service"
  exit 1
}

harden_ssh() {
  local ssh_config_changed=false

  log_info "Hardening SSH configuration"

  if grep -Eq '^PermitRootLogin[[:space:]]+no$' "${SSH_CONFIG_PATH}"; then
    :
  elif grep -q '^#\?PermitRootLogin' "${SSH_CONFIG_PATH}"; then
    sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' "${SSH_CONFIG_PATH}"
    ssh_config_changed=true
  else
    echo 'PermitRootLogin no' >> "${SSH_CONFIG_PATH}"
    ssh_config_changed=true
  fi

  if grep -Eq '^PasswordAuthentication[[:space:]]+no$' "${SSH_CONFIG_PATH}"; then
    :
  elif grep -q '^#\?PasswordAuthentication' "${SSH_CONFIG_PATH}"; then
    sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' "${SSH_CONFIG_PATH}"
    ssh_config_changed=true
  else
    echo 'PasswordAuthentication no' >> "${SSH_CONFIG_PATH}"
    ssh_config_changed=true
  fi

  mkdir -p /run/sshd
  chmod 755 /run/sshd

  if command -v sshd >/dev/null 2>&1; then
    sshd -t
  elif [[ -x /usr/sbin/sshd ]]; then
    /usr/sbin/sshd -t
  else
    log_error "Unable to find sshd binary to validate SSH config"
    exit 1
  fi

  if [[ "${ssh_config_changed}" != true ]]; then
    log_info "SSH hardening already applied; skipping service restart"
    return
  fi

  restart_ssh_service
  log_success "SSH hardened and restarted"
}

log_info "Starting VPS bootstrap"
log_info "  Deploy user:     ${DEPLOY_USER}"
log_info "  Root domain:     ${ROOT_DOMAIN}"
log_info "  App subdomain:   ${APP_SUBDOMAIN}"
log_info "  App upstream:    ${APP_UPSTREAM}"
log_info "  ACME email:      ${ACME_EMAIL}"
log_info "  Assets path:     ${REMOTE_ASSETS_PATH}"
echo ""

log_info "Updating system packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get upgrade -y
apt-get install -y \
  apt-transport-https \
  ca-certificates \
  curl \
  debian-archive-keyring \
  debian-keyring \
  fail2ban \
  git \
  gnupg \
  ufw

log_info "Configuring deploy user: ${DEPLOY_USER}"
if ! id -u "${DEPLOY_USER}" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "${DEPLOY_USER}"
  log_success "User created"
else
  log_info "User already exists"
fi

usermod -aG sudo "${DEPLOY_USER}"
echo "${DEPLOY_USER} ALL=(ALL) NOPASSWD:ALL" > "/etc/sudoers.d/90-${DEPLOY_USER}"
chmod 440 "/etc/sudoers.d/90-${DEPLOY_USER}"

mkdir -p "/home/${DEPLOY_USER}/.ssh"
if [[ -f "${DEPLOY_PUBLIC_KEY_PATH}" ]]; then
  install -m 600 -o "${DEPLOY_USER}" -g "${DEPLOY_USER}" "${DEPLOY_PUBLIC_KEY_PATH}" "/home/${DEPLOY_USER}/.ssh/authorized_keys"
elif [[ -f /root/.ssh/authorized_keys ]]; then
  cp /root/.ssh/authorized_keys "/home/${DEPLOY_USER}/.ssh/authorized_keys"
  chmod 600 "/home/${DEPLOY_USER}/.ssh/authorized_keys"
  chown "${DEPLOY_USER}:${DEPLOY_USER}" "/home/${DEPLOY_USER}/.ssh/authorized_keys"
else
  log_error "No public key asset or root authorized_keys found for deploy user"
  exit 1
fi
chmod 700 "/home/${DEPLOY_USER}/.ssh"
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "/home/${DEPLOY_USER}/.ssh"
log_success "Deploy user SSH key installed"

log_info "Configuring firewall (UFW)"
ufw allow 22/tcp >/dev/null 2>&1 || true
ufw allow 80/tcp >/dev/null 2>&1 || true
ufw allow 443/tcp >/dev/null 2>&1 || true
ufw --force enable >/dev/null 2>&1 || true
log_success "Firewall configured"

log_info "Setting up Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
  sh /tmp/get-docker.sh
  rm -f /tmp/get-docker.sh
  log_success "Docker installed"
else
  log_info "Docker already installed"
fi
usermod -aG docker "${DEPLOY_USER}"
if ! docker network inspect "${DOCKER_NETWORK}" >/dev/null 2>&1; then
  docker network create "${DOCKER_NETWORK}"
  log_success "Docker network '${DOCKER_NETWORK}' created"
else
  log_info "Docker network '${DOCKER_NETWORK}' already exists"
fi

log_info "Setting up Caddy"
if ! command -v caddy >/dev/null 2>&1; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update
  apt-get install -y caddy
  log_success "Caddy installed"
else
  log_info "Caddy already installed"
fi

log_info "Setting up web root directories"
mkdir -p "${WWW_ROOT}/${ROOT_DOMAIN}/html"
mkdir -p "${WWW_ROOT}/app-placeholder"
chown -R www-data:www-data "${WWW_ROOT}"

if [[ -f "${REMOTE_ASSETS_PATH}/index.html" ]]; then
  cp "${REMOTE_ASSETS_PATH}/index.html" "${WWW_ROOT}/${ROOT_DOMAIN}/html/index.html"
  log_success "Landing page deployed"
else
  log_error "Landing page template not found in assets"
  exit 1
fi

if [[ -f "${REMOTE_ASSETS_PATH}/app-placeholder.html" ]]; then
  cp "${REMOTE_ASSETS_PATH}/app-placeholder.html" "${WWW_ROOT}/app-placeholder/index.html"
  log_success "App placeholder deployed"
else
  log_error "App placeholder template not found in assets"
  exit 1
fi

if [[ -f "${CADDY_CONFIG_DIR}/Caddyfile" ]]; then
  cp "${CADDY_CONFIG_DIR}/Caddyfile" "${CADDY_CONFIG_DIR}/Caddyfile.backup.$(date +%s)"
  log_info "Existing Caddyfile backed up"
fi

if [[ ! -f "${REMOTE_ASSETS_PATH}/Caddyfile.bootstrap" ]]; then
  log_error "Caddy configuration not found in assets"
  exit 1
fi

caddy validate --config "${REMOTE_ASSETS_PATH}/Caddyfile.bootstrap"
cp "${REMOTE_ASSETS_PATH}/Caddyfile.bootstrap" "${CADDY_CONFIG_DIR}/Caddyfile"
chmod 644 "${CADDY_CONFIG_DIR}/Caddyfile"
log_success "Caddy configuration deployed"

log_info "Configuring Fail2Ban"
cat > /etc/fail2ban/jail.local <<'FAIL2BAN_EOF'
[sshd]
enabled = true
backend = systemd
bantime = 1h
findtime = 10m
maxretry = 5
FAIL2BAN_EOF
systemctl enable --now fail2ban
systemctl restart fail2ban
log_success "Fail2Ban configured and enabled"

log_info "Enabling Caddy service"
systemctl enable --now caddy
systemctl reload caddy
log_success "Caddy enabled and reloaded"

harden_ssh

rm -rf "${REMOTE_ASSETS_PATH}"
log_info "Bootstrap assets cleaned up"

echo ""
log_success "✅ VPS bootstrap complete!"
echo ""
echo "Configuration Summary:"
echo "  Deploy user:       ${DEPLOY_USER}"
echo "  Root domain:       ${ROOT_DOMAIN}"
echo "  App subdomain:     ${APP_SUBDOMAIN}"
echo "  Docker network:    ${DOCKER_NETWORK}"
echo "  Web root:          ${WWW_ROOT}"
echo "  Caddy config:      ${CADDY_CONFIG_DIR}/Caddyfile"
echo ""
echo "Next steps:"
echo "  - SSH access:      ssh ${DEPLOY_USER}@<server-ip>"
echo "  - Test root site:  https://${ROOT_DOMAIN}"
echo "  - Test app site:   https://${APP_SUBDOMAIN}"
echo "  - View Caddy logs: sudo journalctl -u caddy -f"
echo "  - To connect app:  Expose your container on ${APP_UPSTREAM} in ${DOCKER_NETWORK}"
