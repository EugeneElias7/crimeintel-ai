# Security Policy

## Supported Versions

The following versions of CrimeIntel AI are currently supported with security updates:

| Version  | Supported          |
|----------|--------------------|
| 1.0 (MVP)| :white_check_mark: |

Older versions are no longer supported and users are encouraged to upgrade to the latest release.

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it to us as soon as possible.

**Do not** report security vulnerabilities through public GitHub issues. Instead, please send an email to:

**[INSERT SECURITY EMAIL ADDRESS]**

### What to Include

- A clear description of the vulnerability
- Steps to reproduce the issue (proof of concept preferred)
- Affected versions and components
- Any potential impact or exploit scenarios
- Your contact information for follow-up

### Response Time

We will acknowledge receipt of your report **within 48 hours** and will provide an initial assessment of the severity and scope of the issue.

We will keep you informed of the progress toward a fix and release timeline.

## Disclosure Policy

We follow a **coordinated disclosure** process:

1. **Report received** — confirmed within 48 hours
2. **Investigation** — severity assessment and impact analysis
3. **Fix development** — patch prepared for the next release
4. **Release** — security fix shipped in a new version
5. **Public disclosure** — advisory published after users have had time to update

We aim to complete this process within 90 days of the initial report. We request that reporters refrain from public disclosure until we have released a fix and published the advisory.

## Security-Related Configuration Guidance

### JWT Secret

- Use a cryptographically random string of at least 256 bits
- Never share or commit secrets to version control
- Rotate secrets periodically and after any suspected compromise
- Set via the `JWT_SECRET` environment variable

### CORS

- Restrict allowed origins to known frontend domains in production
- Avoid using wildcard (`*`) origins in production environments
- Set via the `CORS_ORIGINS` environment variable (comma-separated list)

### Rate Limiting

- Enable rate limiting on all API endpoints to prevent abuse
- Use more restrictive limits on authentication endpoints (e.g., 5 attempts per minute)
- Configure via `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS` environment variables

### Additional Recommendations

- Enforce HTTPS in production
- Use environment variables for all sensitive configuration
- Keep dependencies up to date
- Enable logging and monitoring for suspicious activity
- Apply the principle of least privilege for database and API access
