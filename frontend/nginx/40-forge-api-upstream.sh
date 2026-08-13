#!/bin/sh
set -eu

template=/etc/nginx/conf.d/default.conf.template
target=/etc/nginx/conf.d/default.conf
upstream="${FORGE_API_UPSTREAM:-acestep:8001}"

# The value is intentionally limited to a hostname/IP and port. The
# proxy always speaks HTTP, which matches the ACE-Step API's local/Tailnet
# deployment mode and prevents an environment value from becoming Nginx
# configuration text.
if ! printf '%s' "$upstream" | grep -Eq '^[[:alnum:]._:-]+$'; then
    echo "FORGE_API_UPSTREAM must be a host:port value (received an invalid value)" >&2
    exit 1
fi

escaped_upstream=$(printf '%s' "$upstream" | sed 's/[&|]/\\&/g')
sed "s|__FORGE_API_UPSTREAM__|${escaped_upstream}|g" "$template" > "$target"
