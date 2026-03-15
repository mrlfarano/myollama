# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in MyOllama, please report it responsibly.

**Do not open a public issue.** Instead:

1. Email **security@mrlfarano.dev** with a description of the vulnerability
2. Include steps to reproduce if possible
3. Allow reasonable time for a fix before public disclosure

You can expect:
- Acknowledgment within **48 hours**
- A fix or mitigation plan within **7 days** for critical issues
- Credit in the release notes (unless you prefer anonymity)

## Scope

MyOllama is a locally-hosted tool that proxies requests to an Ollama server. Security considerations include:

- **Network exposure** — By default, MyOllama binds to `127.0.0.1` (localhost only). Users who bind to `0.0.0.0` expose the management interface to their network.
- **No authentication** — v1 does not include authentication. Do not expose MyOllama to the public internet.
- **Ollama proxy** — MyOllama can delete models and trigger downloads on the connected Ollama instance. Treat access to MyOllama as equivalent to access to Ollama itself.

## Best Practices

- Keep MyOllama bound to localhost unless you trust your network
- Do not expose MyOllama to the public internet without additional authentication (e.g., reverse proxy with auth)
- Keep dependencies updated (Dependabot is enabled on this repository)
