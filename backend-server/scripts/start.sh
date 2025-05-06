#!/bin/sh

# This script is used to start the application with Azure Key Vault integration
# It can be used both locally and in Azure App Service

# If running in Azure and KeyVault name is provided
if [ -n "$KEYVAULT_NAME" ] && [ "$NODE_ENV" = "production" ]; then
  echo "Initializing with Azure KeyVault integration..."
  
  # If Azure Identity is available
  if [ -n "$IDENTITY_ENDPOINT" ] && [ -n "$IDENTITY_HEADER" ]; then
    echo "Using managed identity to access KeyVault"
    
    # The application will use the KEY_VAULT_ENDPOINT environment variable
    # to access secrets using @azure/identity and @azure/keyvault-secrets
  else 
    echo "No managed identity found. Ensure proper configuration for KeyVault access."
  fi
fi

# Log environment
echo "Starting server in $NODE_ENV mode"

# Start the application
exec node dist/rehouzd/estimator/index.js 