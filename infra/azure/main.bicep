targetScope = 'resourceGroup'

@description('Location for all resources.')
param location string = resourceGroup().location

@description('App Service plan name.')
param appServicePlanName string = 'learningbank-plan'

@description('API App Service name.')
param apiAppName string = 'learningbank-api'

@description('Web App Service name.')
param webAppName string = 'learningbank-web'

@description('Set true to create staging slots for API and Web apps.')
param createStagingSlots bool = true

@description('Staging slot name.')
param slotName string = 'staging'

@description('App Service plan SKU name, for example B1 or F1.')
param appServicePlanSkuName string = 'B1'

@description('App Service plan SKU tier, for example Basic or Free.')
param appServicePlanSkuTier string = 'Basic'

@description('Number of workers in the App Service plan.')
param appServicePlanCapacity int = 1

@description('Enable production observability resources (Log Analytics + Application Insights).')
param enableObservability bool = true

@description('Log Analytics workspace name.')
param logAnalyticsWorkspaceName string = 'learningbank-law'

@description('Log Analytics workspace SKU. PerGB2018 is recommended for production.')
param logAnalyticsSkuName string = 'PerGB2018'

@description('Log retention in days for Log Analytics workspace.')
param logRetentionInDays int = 30

@description('Application Insights component name.')
param appInsightsName string = 'learningbank-ai'

@description('Enable API Management in front of the API app.')
param enableApiManagement bool = false

@description('API Management service name.')
param apiManagementName string = 'learningbank-apim'

@description('API Management SKU name (Consumption, Basic, Standard, Premium).')
param apiManagementSkuName string = 'Consumption'

@description('API Management SKU capacity (ignored for Consumption).')
param apiManagementSkuCapacity int = 1

@description('Publisher email for API Management.')
param apiManagementPublisherEmail string = 'ops@learningbank.local'

@description('Publisher display name for API Management.')
param apiManagementPublisherName string = 'Learning Bank'

@description('Enable Azure Front Door in front of the web (and API route).')
param enableFrontDoor bool = false

@description('Azure Front Door profile name.')
param frontDoorProfileName string = 'learningbank-fd'

@description('Azure Front Door endpoint name.')
param frontDoorEndpointName string = 'learningbank-edge'

@description('Azure Front Door SKU name.')
param frontDoorSkuName string = 'Standard_AzureFrontDoor'

@description('Front Door Web Application Firewall policy name.')
param frontDoorWafPolicyName string = 'learningbank-fd-waf'

@description('API auth authority URL.')
param apiAuthAuthority string

@description('API auth audience value.')
param apiAuthAudience string

@description('Public NextAuth URL for the web app.')
param nextAuthUrl string

@description('Public API base URL for the web app, including /api/v1.')
param nextPublicApiUrl string

@description('Google OAuth client ID.')
param googleClientId string

@description('Google OAuth client secret.')
@secure()
param googleClientSecret string

@description('Azure AD client ID.')
param azureAdClientId string

@description('Azure AD client secret.')
@secure()
param azureAdClientSecret string

@description('Azure AD tenant ID for sign-in.')
param azureAdTenantId string

@description('NextAuth token encryption/signing secret.')
@secure()
param authSecret string

@description('SQL Server connection string used by API runtime.')
@secure()
param apiConnectionString string

@description('Provision an Azure Key Vault and source app secrets from it.')
param enableKeyVault bool = true

@description('Key Vault name (must be globally unique, 3-24 chars).')
param keyVaultName string = 'learningbank-kv'

// --- Key Vault (H-4): central secret store referenced by App Service via managed identity ---

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = if (enableKeyVault) {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    enablePurgeProtection: true
    publicNetworkAccess: 'Enabled'
  }
}

resource authSecretResource 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (enableKeyVault) {
  name: 'auth-secret'
  parent: keyVault
  properties: {
    value: authSecret
  }
}

resource googleClientSecretResource 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (enableKeyVault) {
  name: 'google-client-secret'
  parent: keyVault
  properties: {
    value: googleClientSecret
  }
}

resource azureAdClientSecretResource 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (enableKeyVault) {
  name: 'azure-ad-client-secret'
  parent: keyVault
  properties: {
    value: azureAdClientSecret
  }
}

resource apiConnectionStringResource 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (enableKeyVault) {
  name: 'api-connection-string'
  parent: keyVault
  properties: {
    value: apiConnectionString
  }
}

// Built-in "Key Vault Secrets User" role definition ID.
var keyVaultSecretsUserRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')

var keyVaultUri = enableKeyVault ? (keyVault.?properties.vaultUri ?? '') : ''
var apiConnectionStringSetting = enableKeyVault ? '@Microsoft.KeyVault(SecretUri=${keyVaultUri}secrets/api-connection-string)' : apiConnectionString
var authSecretSetting = enableKeyVault ? '@Microsoft.KeyVault(SecretUri=${keyVaultUri}secrets/auth-secret)' : authSecret
var googleClientSecretSetting = enableKeyVault ? '@Microsoft.KeyVault(SecretUri=${keyVaultUri}secrets/google-client-secret)' : googleClientSecret
var azureAdClientSecretSetting = enableKeyVault ? '@Microsoft.KeyVault(SecretUri=${keyVaultUri}secrets/azure-ad-client-secret)' : azureAdClientSecret

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = if (enableObservability) {
  name: logAnalyticsWorkspaceName
  location: location
  properties: {
    sku: {
      name: logAnalyticsSkuName
    }
    retentionInDays: logRetentionInDays
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = if (enableObservability) {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
    DisableLocalAuth: true
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

resource apiManagement 'Microsoft.ApiManagement/service@2022-08-01' = if (enableApiManagement) {
  name: apiManagementName
  location: location
  sku: {
    name: apiManagementSkuName
    capacity: apiManagementSkuCapacity
  }
  properties: {
    publisherEmail: apiManagementPublisherEmail
    publisherName: apiManagementPublisherName
    publicNetworkAccess: 'Enabled'
  }
}

resource apiManagementApi 'Microsoft.ApiManagement/service/apis@2022-08-01' = if (enableApiManagement) {
  name: 'learningbank-api'
  parent: apiManagement
  properties: {
    displayName: 'Learning Bank API'
    path: 'api'
    protocols: [
      'https'
    ]
    serviceUrl: 'https://${apiAppName}.azurewebsites.net'
    subscriptionRequired: false
  }
}

resource apiManagementGetOperation 'Microsoft.ApiManagement/service/apis/operations@2022-08-01' = if (enableApiManagement) {
  name: 'proxy-get'
  parent: apiManagementApi
  properties: {
    displayName: 'Proxy GET requests'
    method: 'GET'
    urlTemplate: '/{*path}'
    templateParameters: [
      {
        name: 'path'
        required: false
        type: 'string'
      }
    ]
    responses: [
      {
        statusCode: 200
      }
    ]
  }
}

resource apiManagementPostOperation 'Microsoft.ApiManagement/service/apis/operations@2022-08-01' = if (enableApiManagement) {
  name: 'proxy-post'
  parent: apiManagementApi
  properties: {
    displayName: 'Proxy POST requests'
    method: 'POST'
    urlTemplate: '/{*path}'
    templateParameters: [
      {
        name: 'path'
        required: false
        type: 'string'
      }
    ]
    responses: [
      {
        statusCode: 200
      }
    ]
  }
}

resource apiManagementPutOperation 'Microsoft.ApiManagement/service/apis/operations@2022-08-01' = if (enableApiManagement) {
  name: 'proxy-put'
  parent: apiManagementApi
  properties: {
    displayName: 'Proxy PUT requests'
    method: 'PUT'
    urlTemplate: '/{*path}'
    templateParameters: [
      {
        name: 'path'
        required: false
        type: 'string'
      }
    ]
    responses: [
      {
        statusCode: 200
      }
    ]
  }
}

resource apiManagementPatchOperation 'Microsoft.ApiManagement/service/apis/operations@2022-08-01' = if (enableApiManagement) {
  name: 'proxy-patch'
  parent: apiManagementApi
  properties: {
    displayName: 'Proxy PATCH requests'
    method: 'PATCH'
    urlTemplate: '/{*path}'
    templateParameters: [
      {
        name: 'path'
        required: false
        type: 'string'
      }
    ]
    responses: [
      {
        statusCode: 200
      }
    ]
  }
}

resource apiManagementDeleteOperation 'Microsoft.ApiManagement/service/apis/operations@2022-08-01' = if (enableApiManagement) {
  name: 'proxy-delete'
  parent: apiManagementApi
  properties: {
    displayName: 'Proxy DELETE requests'
    method: 'DELETE'
    urlTemplate: '/{*path}'
    templateParameters: [
      {
        name: 'path'
        required: false
        type: 'string'
      }
    ]
    responses: [
      {
        statusCode: 200
      }
    ]
  }
}

resource frontDoorProfile 'Microsoft.Cdn/profiles@2024-02-01' = if (enableFrontDoor) {
  name: frontDoorProfileName
  location: 'global'
  sku: {
    name: frontDoorSkuName
  }
}

resource frontDoorEndpoint 'Microsoft.Cdn/profiles/afdEndpoints@2024-02-01' = if (enableFrontDoor) {
  name: frontDoorEndpointName
  parent: frontDoorProfile
  location: 'global'
  properties: {
    enabledState: 'Enabled'
  }
}

resource webOriginGroup 'Microsoft.Cdn/profiles/originGroups@2024-02-01' = if (enableFrontDoor) {
  name: 'web-origin-group'
  parent: frontDoorProfile
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
      additionalLatencyInMilliseconds: 0
    }
    healthProbeSettings: {
      probePath: '/'
      probeRequestType: 'HEAD'
      probeProtocol: 'Https'
      probeIntervalInSeconds: 120
    }
    sessionAffinityState: 'Disabled'
  }
}

resource apiOriginGroup 'Microsoft.Cdn/profiles/originGroups@2024-02-01' = if (enableFrontDoor) {
  name: 'api-origin-group'
  parent: frontDoorProfile
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
      additionalLatencyInMilliseconds: 0
    }
    healthProbeSettings: {
      probePath: '/health'
      probeRequestType: 'HEAD'
      probeProtocol: 'Https'
      probeIntervalInSeconds: 120
    }
    sessionAffinityState: 'Disabled'
  }
}

var apiGatewayUrl = apiManagement.?properties.gatewayUrl ?? ''
var apiOriginHostName = enableApiManagement ? replace(apiGatewayUrl, 'https://', '') : '${apiAppName}.azurewebsites.net'

resource webOrigin 'Microsoft.Cdn/profiles/originGroups/origins@2024-02-01' = if (enableFrontDoor) {
  name: 'web-origin'
  parent: webOriginGroup
  properties: {
    hostName: '${webAppName}.azurewebsites.net'
    originHostHeader: '${webAppName}.azurewebsites.net'
    httpPort: 80
    httpsPort: 443
    enabledState: 'Enabled'
    priority: 1
    weight: 1000
    enforceCertificateNameCheck: true
  }
}

resource apiOrigin 'Microsoft.Cdn/profiles/originGroups/origins@2024-02-01' = if (enableFrontDoor) {
  name: 'api-origin'
  parent: apiOriginGroup
  properties: {
    hostName: apiOriginHostName
    originHostHeader: apiOriginHostName
    httpPort: 80
    httpsPort: 443
    enabledState: 'Enabled'
    priority: 1
    weight: 1000
    enforceCertificateNameCheck: true
  }
}

resource webRoute 'Microsoft.Cdn/profiles/afdEndpoints/routes@2024-02-01' = if (enableFrontDoor) {
  name: 'web-route'
  parent: frontDoorEndpoint
  properties: {
    originGroup: {
      id: webOriginGroup.id
    }
    patternsToMatch: [
      '/*'
    ]
    supportedProtocols: [
      'Https'
    ]
    forwardingProtocol: 'HttpsOnly'
    httpsRedirect: 'Enabled'
    linkToDefaultDomain: 'Enabled'
    enabledState: 'Enabled'
  }
}

resource apiRoute 'Microsoft.Cdn/profiles/afdEndpoints/routes@2024-02-01' = if (enableFrontDoor) {
  name: 'api-route'
  parent: frontDoorEndpoint
  properties: {
    originGroup: {
      id: apiOriginGroup.id
    }
    patternsToMatch: [
      '/api'
      '/api/*'
    ]
    supportedProtocols: [
      'Https'
    ]
    forwardingProtocol: 'HttpsOnly'
    httpsRedirect: 'Enabled'
    linkToDefaultDomain: 'Enabled'
    enabledState: 'Enabled'
  }
}

resource frontDoorWafPolicy 'Microsoft.Network/FrontDoorWebApplicationFirewallPolicies@2022-05-01' = if (enableFrontDoor) {
  name: frontDoorWafPolicyName
  location: 'global'
  sku: {
    name: 'Standard_AzureFrontDoor'
  }
  properties: {
    policySettings: {
      enabledState: 'Enabled'
      mode: 'Prevention'
      requestBodyCheck: 'Enabled'
    }
    managedRules: {
      managedRuleSets: [
        {
          ruleSetType: 'Microsoft_DefaultRuleSet'
          ruleSetVersion: '2.1'
        }
      ]
    }
  }
}

resource frontDoorSecurityPolicy 'Microsoft.Cdn/profiles/securityPolicies@2024-02-01' = if (enableFrontDoor) {
  name: 'security-policy-waf'
  parent: frontDoorProfile
  properties: {
    parameters: {
      type: 'WebApplicationFirewall'
      wafPolicy: {
        id: frontDoorWafPolicy.id
      }
      associations: [
        {
          domains: [
            {
              id: frontDoorEndpoint.id
            }
          ]
          patternsToMatch: [
            '/*'
          ]
        }
      ]
    }
  }
}

var appInsightsConnectionString = appInsights.?properties.ConnectionString ?? ''
var frontDoorHostName = frontDoorEndpoint.?properties.hostName ?? ''
var frontDoorId = frontDoorProfile.?properties.frontDoorId ?? ''
var calculatedPublicApiUrl = enableFrontDoor ? 'https://${frontDoorHostName}/api/v1' : (enableApiManagement ? '${apiGatewayUrl}/api/v1' : nextPublicApiUrl)

var apiAppSettings = union({
  ASPNETCORE_ENVIRONMENT: 'Production'
  AllowedHosts: '${apiAppName}.azurewebsites.net'
  Database__Provider: 'SqlServer'
  ConnectionStrings__SqlServer: apiConnectionStringSetting
  Auth__Authority: apiAuthAuthority
  Auth__Audience: apiAuthAudience
  Auth__WebAppUrl: nextAuthUrl
  Auth__Google__Audience: googleClientId
  Auth__Microsoft__Audience: azureAdClientId
  Auth__Microsoft__ValidIssuers__0: 'https://login.microsoftonline.com/${azureAdTenantId}/v2.0'
}, enableObservability ? {
  APPLICATIONINSIGHTS_CONNECTION_STRING: appInsightsConnectionString
  ApplicationInsights__ConnectionString: appInsightsConnectionString
} : {})

var webAppSettings = union({
  NODE_ENV: 'production'
  AUTH_SECRET: authSecretSetting
  GOOGLE_CLIENT_ID: googleClientId
  GOOGLE_CLIENT_SECRET: googleClientSecretSetting
  AZURE_AD_CLIENT_ID: azureAdClientId
  AZURE_AD_CLIENT_SECRET: azureAdClientSecretSetting
  AZURE_AD_TENANT_ID: azureAdTenantId
  NEXTAUTH_URL: nextAuthUrl
  NEXT_PUBLIC_API_URL: calculatedPublicApiUrl
}, enableObservability ? {
  APPLICATIONINSIGHTS_CONNECTION_STRING: appInsightsConnectionString
} : {})

var allowFrontDoorOnlyRule = enableFrontDoor ? {
  name: 'Allow-FrontDoor-Backend'
  action: 'Allow'
  priority: 100
  ipAddress: 'AzureFrontDoor.Backend'
  tag: 'ServiceTag'
  headers: {
    'x-azure-fdid': [
      frontDoorId
    ]
  }
} : null

var apiAppIpRestrictions = (!enableApiManagement && enableFrontDoor) ? [
  allowFrontDoorOnlyRule
] : []

var webAppIpRestrictions = enableFrontDoor ? [
  allowFrontDoorOnlyRule
] : []

module appServicePlan './modules/app-service-plan.bicep' = {
  name: 'appServicePlan'
  params: {
    name: appServicePlanName
    location: location
    skuName: appServicePlanSkuName
    skuTier: appServicePlanSkuTier
    capacity: appServicePlanCapacity
  }
}

module apiApp './modules/web-app.bicep' = {
  name: 'apiApp'
  params: {
    name: apiAppName
    location: location
    serverFarmId: appServicePlan.outputs.id
    linuxFxVersion: 'DOTNETCORE|10.0'
    appSettings: apiAppSettings
    enableSystemAssignedIdentity: true
    ipSecurityRestrictions: apiAppIpRestrictions
    ipSecurityRestrictionsDefaultAction: empty(apiAppIpRestrictions) ? 'Allow' : 'Deny'
  }
}

module webApp './modules/web-app.bicep' = {
  name: 'webApp'
  params: {
    name: webAppName
    location: location
    serverFarmId: appServicePlan.outputs.id
    linuxFxVersion: 'NODE|22-lts'
    appSettings: webAppSettings
    enableSystemAssignedIdentity: true
    ipSecurityRestrictions: webAppIpRestrictions
    ipSecurityRestrictionsDefaultAction: empty(webAppIpRestrictions) ? 'Allow' : 'Deny'
  }
}

module apiSlot './modules/web-app-slot.bicep' = if (createStagingSlots) {
  name: 'apiSlot'
  params: {
    appName: apiAppName
    location: location
    slotName: slotName
    linuxFxVersion: 'DOTNETCORE|10.0'
    appSettings: apiAppSettings
  }
}

module webSlot './modules/web-app-slot.bicep' = if (createStagingSlots) {
  name: 'webSlot'
  params: {
    appName: webAppName
    location: location
    slotName: slotName
    linuxFxVersion: 'NODE|22-lts'
    appSettings: webAppSettings
  }
}

// --- Key Vault role assignments (H-4): grant each app/slot identity read access to secrets ---

resource apiAppKvAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (enableKeyVault) {
  name: guid(keyVault.id, apiAppName, keyVaultSecretsUserRoleId)
  scope: keyVault
  properties: {
    roleDefinitionId: keyVaultSecretsUserRoleId
    principalId: apiApp.outputs.principalId
    principalType: 'ServicePrincipal'
  }
}

resource webAppKvAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (enableKeyVault) {
  name: guid(keyVault.id, webAppName, keyVaultSecretsUserRoleId)
  scope: keyVault
  properties: {
    roleDefinitionId: keyVaultSecretsUserRoleId
    principalId: webApp.outputs.principalId
    principalType: 'ServicePrincipal'
  }
}

resource apiSlotKvAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (enableKeyVault && createStagingSlots) {
  name: guid(keyVault.id, apiAppName, slotName, keyVaultSecretsUserRoleId)
  scope: keyVault
  properties: {
    roleDefinitionId: keyVaultSecretsUserRoleId
    principalId: apiSlot.outputs.principalId
    principalType: 'ServicePrincipal'
  }
}

resource webSlotKvAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (enableKeyVault && createStagingSlots) {
  name: guid(keyVault.id, webAppName, slotName, keyVaultSecretsUserRoleId)
  scope: keyVault
  properties: {
    roleDefinitionId: keyVaultSecretsUserRoleId
    principalId: webSlot.outputs.principalId
    principalType: 'ServicePrincipal'
  }
}

output apiDefaultHostName string = apiApp.outputs.defaultHostName
output webDefaultHostName string = webApp.outputs.defaultHostName
output frontDoorHostName string = frontDoorHostName
output apiManagementGatewayUrl string = apiGatewayUrl
