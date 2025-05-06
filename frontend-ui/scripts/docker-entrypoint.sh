#!/bin/sh

set -e

# Create a file to export environment variables at runtime
ENV_CONFIG="/usr/share/nginx/html/env-config.js"

# If we have a template, use it as a base
if [ -f "/usr/share/nginx/html/env-config.template.js" ]; then
  cp /usr/share/nginx/html/env-config.template.js $ENV_CONFIG
else
  # Fallback to creating a basic env config
  echo "window.env = {};" > $ENV_CONFIG
fi

# If running in Azure with Managed Identity
if [ -n "$KEYVAULT_NAME" ] && [ -n "$IDENTITY_ENDPOINT" ]; then
  echo "Container is running in Azure with KeyVault integration"
  
  # When using Azure App Service, the environment variables from KeyVault
  # will be automatically injected, so we just need to make sure they're
  # available to the frontend application
  
  # Update the env-config.js with the current environment variables
  cat > $ENV_CONFIG << EOF
window.env = {
  REACT_APP_Maps_API_KEY: "${REACT_APP_Maps_API_KEY}",
  REACT_APP_GOOGLE_MAP_ID: "${REACT_APP_GOOGLE_MAP_ID}",
  REACT_APP_API_URL: "${REACT_APP_API_URL}"
};
EOF

  echo "Updated environment configuration from Azure environment variables"
else
  echo "Running with build-time environment configuration"
fi

# Execute the main container command
exec "$@" 