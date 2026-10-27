#!/usr/bin/env bash
set -euo pipefail

# VPS Bootstrap Orchestrator
# Single entrypoint for provisioning a fresh VPS with:
#   - static landing page on root domain
#   - app subdomain prepared for future repo connection
#   - hardened host with Docker, Caddy, and Fail2Ban

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Set SERVER_IP or pass --server-ip for the VPS you intend to provision.
SERVER_IP="${SERVER_IP:-}"
SSH_PORT="${SSH_PORT:-22}"
SSH_KEY_PATH="${SSH_KEY_PATH:-$HOME/.ssh/mteto_mac}"
PUBLIC_KEY_PATH="${PUBLIC_KEY_PATH:-${SSH_KEY_PATH}.pub}"
ROOT_USER="${ROOT_USER:-root}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
ROOT_DOMAIN="${ROOT_DOMAIN:-m-teto.org}"
APP_SUBDOMAIN="${APP_SUBDOMAIN:-app.m-teto.org}"
APP_UPSTREAM="${APP_UPSTREAM:-127.0.0.1:3000}"
ACME_EMAIL="${ACME_EMAIL:-}"
LANDING_PAGE_TITLE="${LANDING_PAGE_TITLE:-Welcome}"
DOCKER_NETWORK="${DOCKER_NETWORK:-web_network}"
REMOTE_ASSETS_PATH="${REMOTE_ASSETS_PATH:-}"
ACTIVE_SSH_USER=""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
  echo -e "${GREEN}ℹ${NC}  $*"
}

log_warn() {
  echo -e "${YELLOW}⚠${NC}  $*"
}

log_error() {
  echo -e "${RED}✗${NC}  $*"
}

log_success() {
  echo -e "${GREEN}✓${NC}  $*"
}

show_usage() {
  cat <<EOF
Usage: ./deploy.sh [OPTIONS]

Options:
  --server-ip <ip>           VPS IP address (required; pass --server-ip or set SERVER_IP)
  --ssh-port <port>          SSH port (default: 22)
  --ssh-key <path>           Private SSH key path (default: ~/.ssh/mteto_mac)
  --ssh-key-path <path>      Alias for --ssh-key
  -i <path>                  Alias for --ssh-key
  --public-key <path>        Public key to install for deploy user (default: <ssh-key>.pub)
  --root-user <user>         Root SSH user (default: root)
  --deploy-user <user>       Non-root deploy user to create (default: deploy)
  --docker-network <name>    Shared Docker network name (default: web_network)
  --root-domain <domain>     Root domain for landing page (default: m-teto.org)
  --app-subdomain <domain>   App subdomain (default: app.m-teto.org)
  --app-upstream <host:port> App upstream for reverse proxy (default: 127.0.0.1:3000)
  --acme-email <email>       ACME contact email for TLS (required)
  --landing-title <title>    Landing page title (default: Welcome)
  --help                     Show this message

Environment variables:
  SERVER_IP, SSH_PORT, SSH_KEY_PATH, PUBLIC_KEY_PATH, ROOT_USER,
  DEPLOY_USER, ROOT_DOMAIN, APP_SUBDOMAIN, APP_UPSTREAM,
  ACME_EMAIL, LANDING_PAGE_TITLE, DOCKER_NETWORK

Examples:
  ./deploy.sh --acme-email admin@example.com

  ./deploy.sh \
    --server-ip 192.0.2.1 \
    --root-domain example.com \
    --app-subdomain app.example.com \
    --acme-email admin@example.com \
    --ssh-key ~/.ssh/example_key
EOF
}

require_value() {
  local option="$1"
  local value="${2:-}"

  if [[ -z "${value}" ]] || [[ "${value}" == --* ]]; then
    log_error "${option} requires a value"
    exit 1
  fi
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --server-ip)
        require_value "$1" "${2:-}"
        SERVER_IP="$2"
        shift 2
        ;;
      --server-ip=*)
        SERVER_IP="${1#*=}"
        shift
        ;;
      --ssh-port)
        require_value "$1" "${2:-}"
        SSH_PORT="$2"
        shift 2
        ;;
      --ssh-port=*)
        SSH_PORT="${1#*=}"
        shift
        ;;
      --ssh-key|--ssh-key-path|-i)
        require_value "$1" "${2:-}"
        SSH_KEY_PATH="$2"
        shift 2
        ;;
      --ssh-key=*|--ssh-key-path=*)
        SSH_KEY_PATH="${1#*=}"
        shift
        ;;
      --public-key)
        require_value "$1" "${2:-}"
        PUBLIC_KEY_PATH="$2"
        shift 2
        ;;
      --public-key=*)
        PUBLIC_KEY_PATH="${1#*=}"
        shift
        ;;
      --root-user)
        require_value "$1" "${2:-}"
        ROOT_USER="$2"
        shift 2
        ;;
      --root-user=*)
        ROOT_USER="${1#*=}"
        shift
        ;;
      --deploy-user)
        require_value "$1" "${2:-}"
        DEPLOY_USER="$2"
        shift 2
        ;;
      --deploy-user=*)
        DEPLOY_USER="${1#*=}"
        shift
        ;;
      --docker-network)
        require_value "$1" "${2:-}"
        DOCKER_NETWORK="$2"
        shift 2
        ;;
      --docker-network=*)
        DOCKER_NETWORK="${1#*=}"
        shift
        ;;
      --root-domain)
        require_value "$1" "${2:-}"
        ROOT_DOMAIN="$2"
        shift 2
        ;;
      --root-domain=*)
        ROOT_DOMAIN="${1#*=}"
        shift
        ;;
      --app-subdomain)
        require_value "$1" "${2:-}"
        APP_SUBDOMAIN="$2"
        shift 2
        ;;
      --app-subdomain=*)
        APP_SUBDOMAIN="${1#*=}"
        shift
        ;;
      --app-upstream)
        require_value "$1" "${2:-}"
        APP_UPSTREAM="$2"
        shift 2
        ;;
      --app-upstream=*)
        APP_UPSTREAM="${1#*=}"
        shift
        ;;
      --acme-email)
        require_value "$1" "${2:-}"
        ACME_EMAIL="$2"
        shift 2
        ;;
      --acme-email=*)
        ACME_EMAIL="${1#*=}"
        shift
        ;;
      --landing-title)
        require_value "$1" "${2:-}"
        LANDING_PAGE_TITLE="$2"
        shift 2
        ;;
      --landing-title=*)
        LANDING_PAGE_TITLE="${1#*=}"
        shift
        ;;
      --help|-h)
        show_usage
        exit 0
        ;;
      *)
        log_error "Unknown option: $1"
        show_usage
        exit 1
        ;;
    esac
  done
}

validate_inputs() {
  local valid=true

  if [[ -z "${SERVER_IP}" ]]; then
    log_error "SERVER_IP is required"
    valid=false
  fi

  if [[ ! "${SSH_PORT}" =~ ^[0-9]+$ ]]; then
    log_error "SSH_PORT must be numeric"
    valid=false
  fi

  if [[ -z "${SSH_KEY_PATH}" ]] || [[ ! -f "${SSH_KEY_PATH}" ]]; then
    log_error "Private SSH key not found at ${SSH_KEY_PATH}"
    valid=false
  fi

  if [[ -z "${PUBLIC_KEY_PATH}" ]] || [[ ! -f "${PUBLIC_KEY_PATH}" ]]; then
    log_error "Public SSH key not found at ${PUBLIC_KEY_PATH}"
    valid=false
  fi

  if [[ -z "${ACME_EMAIL}" ]]; then
    log_error "ACME_EMAIL is required (pass via --acme-email or env var)"
    valid=false
  fi

  if [[ -z "${ROOT_DOMAIN}" ]]; then
    log_error "ROOT_DOMAIN is required"
    valid=false
  fi

  if [[ -z "${APP_SUBDOMAIN}" ]]; then
    log_error "APP_SUBDOMAIN is required"
    valid=false
  fi

  if [[ "${ROOT_DOMAIN}" == "${APP_SUBDOMAIN}" ]]; then
    log_error "ROOT_DOMAIN and APP_SUBDOMAIN must be different"
    valid=false
  fi

  if [[ "${APP_UPSTREAM}" != *:* ]]; then
    log_warn "APP_UPSTREAM usually looks like host:port (current: ${APP_UPSTREAM})"
  fi

  if [[ "${valid}" != true ]]; then
    show_usage
    exit 1
  fi
}

ssh_args_for() {
  local mode="$1"

  if [[ "${mode}" == "scp" ]]; then
    printf '%s\n' \
      -P "${SSH_PORT}" \
      -i "${SSH_KEY_PATH}" \
      -o BatchMode=yes \
      -o ConnectTimeout=10 \
      -o IdentitiesOnly=yes \
      -o StrictHostKeyChecking=accept-new
    return
  fi

  printf '%s\n' \
    -p "${SSH_PORT}" \
    -i "${SSH_KEY_PATH}" \
    -o BatchMode=yes \
    -o ConnectTimeout=10 \
    -o IdentitiesOnly=yes \
    -o StrictHostKeyChecking=accept-new
}

can_ssh_as() {
  local candidate_user="$1"
  local -a ssh_args

  while IFS= read -r arg; do
    ssh_args+=("${arg}")
  done < <(ssh_args_for ssh)

  ssh "${ssh_args[@]}" "${candidate_user}@${SERVER_IP}" "true" >/dev/null 2>&1
}

ssh_transport_reachable() {
  local -a ssh_args
  local exit_code

  while IFS= read -r arg; do
    ssh_args+=("${arg}")
  done < <(ssh_args_for ssh)

  set +e
  ssh "${ssh_args[@]}" "invalid-user-probe@${SERVER_IP}" "true" >/tmp/vps_ssh_probe.out 2>/tmp/vps_ssh_probe.err
  exit_code=$?
  set -e

  if grep -Eqi 'connection refused|operation timed out|no route to host|connection timed out' /tmp/vps_ssh_probe.err; then
    rm -f /tmp/vps_ssh_probe.out /tmp/vps_ssh_probe.err
    return 1
  fi

  rm -f /tmp/vps_ssh_probe.out /tmp/vps_ssh_probe.err
  return 0
}

determine_ssh_user() {
  if ! ssh_transport_reachable; then
    log_error "SSH on ${SERVER_IP}:${SSH_PORT} is unreachable"
    log_error "The VPS likely needs console recovery (for example: recreate /run/sshd and restart ssh/sshd)"
    exit 1
  fi

  if can_ssh_as "${ROOT_USER}"; then
    ACTIVE_SSH_USER="${ROOT_USER}"
    return
  fi

  if [[ "${ROOT_USER}" == "root" ]] && can_ssh_as "${DEPLOY_USER}"; then
    ACTIVE_SSH_USER="${DEPLOY_USER}"
    log_warn "Root SSH is unavailable; falling back to ${DEPLOY_USER} with sudo for bootstrap rerun"
    return
  fi

  log_error "Unable to SSH as ${ROOT_USER} or fallback deploy user ${DEPLOY_USER}"
  exit 1
}

create_asset_bundle() {
  local asset_dir
  asset_dir=$(mktemp -d)

  log_info "Preparing bootstrap assets in ${asset_dir}" >&2

  cp "${SCRIPT_DIR}/vps_setup.sh" "${asset_dir}/"
  cp "${PUBLIC_KEY_PATH}" "${asset_dir}/deploy_authorized_key.pub"
  generate_landing_page > "${asset_dir}/index.html"
  generate_caddy_config > "${asset_dir}/Caddyfile.bootstrap"
  generate_app_placeholder > "${asset_dir}/app-placeholder.html"

  printf '%s\n' "${asset_dir}"
}

generate_landing_page() {
  cat <<EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${LANDING_PAGE_TITLE}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #333;
    }
    .container {
      text-align: center;
      background: white;
      padding: 2rem;
      border-radius: 0.5rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      max-width: 500px;
    }
    h1 { font-size: 2.5rem; margin-bottom: 1rem; color: #667eea; }
    p { font-size: 1.1rem; color: #666; margin-bottom: 1.5rem; line-height: 1.6; }
    .status {
      display: inline-block;
      background: #e8f5e9;
      border-left: 4px solid #4caf50;
      padding: 1rem;
      margin-bottom: 1.5rem;
      border-radius: 0.25rem;
      text-align: left;
    }
    .status strong { color: #2e7d32; }
    a {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 0.25rem;
      text-decoration: none;
      font-weight: 600;
    }
    .domain {
      font-family: 'Courier New', monospace;
      background: #f5f5f5;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
    }
    footer { margin-top: 2rem; font-size: 0.85rem; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${LANDING_PAGE_TITLE}</h1>
    <div class="status">
      <strong>✓ Site is live</strong><br>
      Running on <span class="domain">${ROOT_DOMAIN}</span>
    </div>
    <p>Welcome. This is the main landing page for <span class="domain">${ROOT_DOMAIN}</span>.</p>
    <p>For the application, visit <span class="domain">${APP_SUBDOMAIN}</span>.</p>
    <a href="https://${APP_SUBDOMAIN}">Visit Application →</a>
    <footer>
      <p>Powered by Caddy. Last updated: $(date -u '+%Y-%m-%d %H:%M:%S UTC')</p>
    </footer>
  </div>
</body>
</html>
EOF
}

generate_app_placeholder() {
  cat <<EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Coming Soon</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      text-align: center;
      background: white;
      padding: 2rem;
      border-radius: 0.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    h1 { font-size: 1.5rem; color: #666; margin-bottom: 1rem; }
    p { font-size: 0.95rem; color: #999; }
    .spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: 10px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1><span class="spinner"></span>Application Coming Soon</h1>
    <p>This subdomain is being prepared for the application.</p>
    <p>Please check back soon, or return to the <a href="https://${ROOT_DOMAIN}">main site</a>.</p>
  </div>
</body>
</html>
EOF
}

generate_caddy_config() {
  cat <<EOF
{
    email ${ACME_EMAIL}
}

${ROOT_DOMAIN} {
    root * /var/www/${ROOT_DOMAIN}/html
    file_server
    encode gzip zstd

    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
        X-Frame-Options "SAMEORIGIN"
    }
}

${APP_SUBDOMAIN} {
    encode gzip zstd

    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
        X-Frame-Options "SAMEORIGIN"
    }

    reverse_proxy ${APP_UPSTREAM}

    handle_errors {
        root * /var/www/app-placeholder
        rewrite * /index.html
        file_server
    }
}
EOF
}

transfer_assets() {
  local asset_dir="$1"
  local -a scp_args ssh_args

  while IFS= read -r arg; do
    scp_args+=("${arg}")
  done < <(ssh_args_for scp)
  while IFS= read -r arg; do
    ssh_args+=("${arg}")
  done < <(ssh_args_for ssh)

  log_info "Transferring bootstrap assets to ${SERVER_IP}"

  ssh "${ssh_args[@]}" "${ACTIVE_SSH_USER}@${SERVER_IP}" "rm -rf $(printf '%q' "${REMOTE_ASSETS_PATH}") && mkdir -p $(printf '%q' "${REMOTE_ASSETS_PATH}")"
  scp "${scp_args[@]}" -r "${asset_dir}/." "${ACTIVE_SSH_USER}@${SERVER_IP}:${REMOTE_ASSETS_PATH}/"

  log_success "Assets transferred"
}

append_remote_export() {
  local key="$1"
  local value="$2"
  printf 'export %s=%q\n' "${key}" "${value}"
}

execute_remote_bootstrap() {
  local -a ssh_args
  local remote_command
  local remote_env_cmd

  while IFS= read -r arg; do
    ssh_args+=("${arg}")
  done < <(ssh_args_for ssh)

  log_info "Executing remote VPS bootstrap on ${SERVER_IP}"

  remote_env_cmd="env"
  remote_env_cmd+=" DEPLOY_USER=$(printf '%q' "${DEPLOY_USER}")"
  remote_env_cmd+=" ROOT_DOMAIN=$(printf '%q' "${ROOT_DOMAIN}")"
  remote_env_cmd+=" APP_SUBDOMAIN=$(printf '%q' "${APP_SUBDOMAIN}")"
  remote_env_cmd+=" APP_UPSTREAM=$(printf '%q' "${APP_UPSTREAM}")"
  remote_env_cmd+=" ACME_EMAIL=$(printf '%q' "${ACME_EMAIL}")"
  remote_env_cmd+=" DOCKER_NETWORK=$(printf '%q' "${DOCKER_NETWORK}")"
  remote_env_cmd+=" REMOTE_ASSETS_PATH=$(printf '%q' "${REMOTE_ASSETS_PATH}")"

  if [[ "${ACTIVE_SSH_USER}" == "root" ]]; then
    remote_command="set -euo pipefail; ${remote_env_cmd} bash $(printf '%q' "${REMOTE_ASSETS_PATH}/vps_setup.sh")"
  else
    remote_command="set -euo pipefail; sudo -n ${remote_env_cmd} bash $(printf '%q' "${REMOTE_ASSETS_PATH}/vps_setup.sh")"
  fi

  ssh "${ssh_args[@]}" "${ACTIVE_SSH_USER}@${SERVER_IP}" "${remote_command}"

  log_success "Remote bootstrap completed"
}

check_domain() {
  local label="$1"
  local url="$2"
  local status

  set +e
  status=$(curl -I --max-time 10 --silent --show-error --output /dev/null --write-out '%{http_code}' "${url}")
  local curl_exit=$?
  set -e

  if [[ ${curl_exit} -ne 0 ]] || [[ "${status}" == "000" ]]; then
    log_warn "${label} did not respond publicly yet: ${url}"
    return 1
  fi

  log_success "${label} is publicly reachable: ${url} (HTTP ${status})"
  return 0
}

run_postflight_checks() {
  local failed=false

  log_info "Running public reachability checks"

  if ! check_domain "Root domain over HTTP" "http://${ROOT_DOMAIN}"; then
    failed=true
  fi

  if ! check_domain "App domain over HTTP" "http://${APP_SUBDOMAIN}"; then
    failed=true
  fi

  if [[ "${failed}" == true ]]; then
    log_warn "Public HTTP checks failed. The most common cause is an upstream/provider firewall still blocking ports 80/443."
    log_warn "Caddy can be healthy on the VPS while ACME and browser access still fail externally until those ports are open."
  fi
}

main() {
  parse_args "$@"

  echo ""
  log_info "VPS Bootstrap Orchestrator"
  echo ""

  validate_inputs
  determine_ssh_user

  if [[ -z "${REMOTE_ASSETS_PATH}" ]]; then
    REMOTE_ASSETS_PATH="/tmp/vps_bootstrap_assets_${DEPLOY_USER}_$$"
  fi

  log_info "Configuration:"
  echo "  Server IP:        ${SERVER_IP}"
  echo "  SSH Port:         ${SSH_PORT}"
  echo "  SSH Key:          ${SSH_KEY_PATH}"
  echo "  Public Key:       ${PUBLIC_KEY_PATH}"
  echo "  Root Domain:      ${ROOT_DOMAIN}"
  echo "  App Subdomain:    ${APP_SUBDOMAIN}"
  echo "  App Upstream:     ${APP_UPSTREAM}"
  echo "  Docker Network:   ${DOCKER_NETWORK}"
  echo "  Deploy User:      ${DEPLOY_USER}"
  echo "  SSH Login User:   ${ACTIVE_SSH_USER}"
  echo "  ACME Email:       ${ACME_EMAIL}"
  echo "  Remote Assets:    ${REMOTE_ASSETS_PATH}"
  echo ""

  local asset_dir
  asset_dir=$(create_asset_bundle)
  trap 'rm -rf -- '"$(printf '%q' "${asset_dir}")" EXIT

  transfer_assets "${asset_dir}"
  execute_remote_bootstrap
  run_postflight_checks

  echo ""
  log_success "🎉 Bootstrap complete!"
  echo ""
  log_info "Next steps:"
  echo "  1. Wait a moment for Caddy to initialize HTTPS"
  echo "  2. Visit https://${ROOT_DOMAIN} in your browser"
  echo "  3. SSH into the server as deploy user:"
  echo "     ssh -i ${SSH_KEY_PATH} -p ${SSH_PORT} ${DEPLOY_USER}@${SERVER_IP}"
  echo "  4. Attach your app container to '${DOCKER_NETWORK}'"
  echo "  5. The app endpoint will be https://${APP_SUBDOMAIN}"
  echo ""
}

main "$@"
