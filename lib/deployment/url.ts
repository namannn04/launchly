const reservedSubdomains = new Set(["www", "app", "api", "dashboard", "admin"]);

function normalizeBaseDomain(rawValue: string | undefined) {
  const fallback = "localhost";

  if (!rawValue) {
    return fallback;
  }

  const cleaned = rawValue.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0].split(":")[0];

  return cleaned || fallback;
}

function normalizePort(rawValue: string | undefined) {
  if (!rawValue) {
    return "3000";
  }

  const cleaned = rawValue.trim();

  return /^\d+$/.test(cleaned) ? cleaned : "3000";
}

export function getDeploymentBaseDomain() {
  return normalizeBaseDomain(process.env.DEPLOYMENT_BASE_DOMAIN);
}

export function getDeploymentProtocol() {
  const protocol = process.env.DEPLOYMENT_URL_SCHEME?.trim().toLowerCase();
  return protocol === "https" ? "https" : "http";
}

export function getDeploymentAppPort() {
  return normalizePort(process.env.APP_URL_PORT);
}

export function getProjectDeploymentPath(projectId: string) {
  return `/project/${projectId}/`;
}

export function getProjectDeploymentHost(projectId: string) {
  return `${projectId}.${getDeploymentBaseDomain()}`;
}

export function getProjectDeploymentUrl(projectId: string) {
  const protocol = getDeploymentProtocol();
  const host = getProjectDeploymentHost(projectId);
  const port = getDeploymentAppPort();
  const portSuffix = (protocol === "http" && port === "80") || (protocol === "https" && port === "443")
    ? ""
    : `:${port}`;

  return `${protocol}://${host}${portSuffix}/`;
}

export function extractProjectIdFromHost(hostHeader: string | null) {
  if (!hostHeader) {
    return null;
  }

  const host = hostHeader.trim().toLowerCase().split(":")[0];
  const baseDomain = getDeploymentBaseDomain();

  if (!host || host === baseDomain || !host.endsWith(`.${baseDomain}`)) {
    return null;
  }

  const prefix = host.slice(0, -(baseDomain.length + 1));

  if (!prefix || prefix.includes(".")) {
    return null;
  }

  if (!/^[a-z0-9-]{1,64}$/.test(prefix)) {
    return null;
  }

  if (reservedSubdomains.has(prefix)) {
    return null;
  }

  return prefix;
}