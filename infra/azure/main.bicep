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
param frontDoorWafPolicyName string = 'learningBankFdWaf'

@description('Enable Front Door custom domains for apex and www hosts.')
param enableFrontDoorCustomDomains bool = false

@description('Root custom domain host name for Front Door (for example mylearningbank.com).')
param frontDoorRootDomainHostName string = 'mylearningbank.com'

@description('WWW custom domain host name for Front Door (for example www.mylearningbank.com).')
param frontDoorWwwDomainHostName string = 'www.mylearningbank.com'

@description('Azure DNS zone resource ID used for Front Door managed custom domains.')
param frontDoorDnsZoneResourceId string = ''

@description('Set true to manage apex/www Azure DNS records for Front Door in this deployment.')
param enableFrontDoorDnsRecords bool = false

@description('TTL (seconds) for managed apex/www DNS records.')
param frontDoorDnsRecordTtl int = 3600

@description('Azure DNS zone name that contains apex/www records for Front Door.')
param frontDoorDnsZoneName string = ''

@description('Set true to create Front Door custom domains. Set false to reference already-existing custom domains.')
param frontDoorCreateCustomDomains bool = false

@description('Secret token value used to allow CI smoke-test requests through the geo-blocking WAF rule. Must be alphanumeric, 16-64 chars.')
@secure()
param frontDoorWafCiBypassToken string = ''

@description('Existing or desired Front Door custom domain resource name for the root domain.')
param frontDoorRootCustomDomainName string = 'mylearningbank-com-c8a3'

@description('Existing or desired Front Door custom domain resource name for the www domain.')
param frontDoorWwwCustomDomainName string = 'www-mylearningbank-com-5935'

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

@description('Provision an Azure SQL logical server + serverless database for the API.')
param enableSql bool = true

@description('Azure SQL logical server name (must be globally unique).')
param sqlServerName string = 'learningbank-sql'

@description('Azure SQL database name.')
param sqlDatabaseName string = 'learningbank'

@description('Name of the user-assigned managed identity used as the SQL Entra (AAD) admin.')
param sqlAdminIdentityName string = 'learningbank-sql-admin'

@description('Name of the shared user-assigned managed identity used by the API app and slot for SQL access.')
param apiSqlIdentityName string = 'learningbank-api-sql'

@description('Serverless database minimum vCores (auto-pause floor).')
param sqlMinCapacity string = '0.5'

@description('Serverless database maximum vCores.')
param sqlMaxVCores int = 1

@description('Serverless auto-pause delay in minutes. -1 disables auto-pause.')
param sqlAutoPauseDelay int = 60

@description('Object ID (SID) of the GitHub deployment service principal, granted DB DDL rights for EF migrations. Leave empty to skip.')
param deployPrincipalObjectId string = ''

@description('Optional SQL Entra admin object ID override. When set, this principal becomes SQL server Entra admin.')
param sqlAadAdminObjectId string = ''

@description('Login display name for the SQL Entra admin override principal.')
param sqlAadAdminLogin string = 'github-deploy'

@description('Forces the SQL user-provisioning deployment script to run on every deployment.')
param sqlSetupRunId string = utcNow()

@description('Set false to skip the deploymentScripts-based SQL user provisioning path.')
param enableSqlUserSetupScript bool = true

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

// Built-in "Key Vault Secrets User" role definition ID.
var keyVaultSecretsUserRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')

var keyVaultUri = enableKeyVault ? (keyVault.?properties.vaultUri ?? '') : ''
// The connection string is passwordless (managed identity), so it is a plain
// app setting rather than a Key Vault secret. Server/database come from the
// SQL module provisioned in this same deployment.
var sqlServerFqdn = enableSql ? sqlServer!.outputs.serverFqdn : ''
var resolvedSqlDatabaseName = enableSql ? sqlServer!.outputs.databaseName : sqlDatabaseName
// Null-safe accessors for conditionally-created identities and slots. These
// resources only exist when their feature flag is set, so dereference with the
// safe-access operator and coalesce to '' to avoid deployment-time failures.
var sqlAdminPrincipalId = sqlAdminIdentity.?properties.principalId ?? ''
var sqlAdminClientId = sqlAdminIdentity.?properties.clientId ?? ''
var apiSqlPrincipalId = apiSqlIdentity.?properties.principalId ?? ''
var apiSqlClientId = apiSqlIdentity.?properties.clientId ?? ''
var resolvedSqlAdminObjectId = !empty(sqlAadAdminObjectId) ? sqlAadAdminObjectId : sqlAdminPrincipalId
var resolvedSqlAdminLogin = !empty(sqlAadAdminObjectId) ? sqlAadAdminLogin : sqlAdminIdentityName
var apiSlotPrincipalId = createStagingSlots ? (apiSlot.?outputs.principalId ?? '') : ''
var webSlotPrincipalId = createStagingSlots ? (webSlot.?outputs.principalId ?? '') : ''
var apiConnectionString = enableSql ? 'Server=tcp:${sqlServerFqdn},1433;Initial Catalog=${resolvedSqlDatabaseName};Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;ConnectRetryCount=5;ConnectRetryInterval=10;Authentication=Active Directory Managed Identity;User Id=${apiSqlClientId}' : ''
var apiConnectionStringSetting = apiConnectionString
var authSecretSetting = enableKeyVault ? '@Microsoft.KeyVault(SecretUri=${keyVaultUri}secrets/auth-secret)' : authSecret
var googleClientSecretSetting = enableKeyVault ? '@Microsoft.KeyVault(SecretUri=${keyVaultUri}secrets/google-client-secret)' : googleClientSecret
var azureAdClientSecretSetting = enableKeyVault ? '@Microsoft.KeyVault(SecretUri=${keyVaultUri}secrets/azure-ad-client-secret)' : azureAdClientSecret

// --- Azure SQL (passwordless): provisioned here so the FQDN/database name are
// deployment outputs rather than pre-stored configuration. A user-assigned
// managed identity is the server's Entra-only admin, which lets the
// user-provisioning deployment script (below) create the contained database
// users for the app and deployment identities. ---

resource sqlAdminIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = if (enableSql) {
  name: sqlAdminIdentityName
  location: location
}

resource apiSqlIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = if (enableSql) {
  name: apiSqlIdentityName
  location: location
}

module sqlServer './modules/sql.bicep' = if (enableSql) {
  name: 'sql'
  params: {
    name: sqlServerName
    location: 'centralus'
    databaseName: sqlDatabaseName
    aadAdminLogin: resolvedSqlAdminLogin
    aadAdminObjectId: resolvedSqlAdminObjectId
    aadAdminPrincipalType: 'Application'
    minCapacity: sqlMinCapacity
    maxVCores: sqlMaxVCores
    autoPauseDelay: sqlAutoPauseDelay
    userAssignedIdentityResourceId: sqlAdminIdentity.id
  }
}

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
  properties: {
    originResponseTimeoutSeconds: 30
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

var frontDoorEndpointHostNameForDns = frontDoorEndpoint.?properties.hostName ?? ''
var manageFrontDoorDns = enableFrontDoor && enableFrontDoorCustomDomains && enableFrontDoorDnsRecords && !empty(frontDoorDnsZoneName)

resource frontDoorDnsZone 'Microsoft.Network/dnsZones@2023-07-01-preview' existing = if (manageFrontDoorDns) {
  name: frontDoorDnsZoneName
}

resource frontDoorApexAliasRecord 'Microsoft.Network/dnsZones/A@2023-07-01-preview' = if (manageFrontDoorDns) {
  parent: frontDoorDnsZone
  name: '@'
  properties: {
    TTL: frontDoorDnsRecordTtl
    targetResource: {
      id: frontDoorEndpoint.id
    }
  }
}

resource frontDoorWwwCnameRecord 'Microsoft.Network/dnsZones/CNAME@2023-07-01-preview' = if (manageFrontDoorDns) {
  parent: frontDoorDnsZone
  name: 'www'
  properties: {
    TTL: frontDoorDnsRecordTtl
    CNAMERecord: {
      cname: frontDoorEndpointHostNameForDns
    }
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

resource frontDoorRootCustomDomain 'Microsoft.Cdn/profiles/customDomains@2024-02-01' = if (enableFrontDoor && enableFrontDoorCustomDomains && frontDoorCreateCustomDomains) {
  name: frontDoorRootCustomDomainName
  parent: frontDoorProfile
  properties: {
    hostName: frontDoorRootDomainHostName
    tlsSettings: {
      certificateType: 'ManagedCertificate'
      minimumTlsVersion: 'TLS12'
    }
    azureDnsZone: {
      id: frontDoorDnsZoneResourceId
    }
  }
}

resource frontDoorWwwCustomDomain 'Microsoft.Cdn/profiles/customDomains@2024-02-01' = if (enableFrontDoor && enableFrontDoorCustomDomains && frontDoorCreateCustomDomains) {
  name: frontDoorWwwCustomDomainName
  parent: frontDoorProfile
  properties: {
    hostName: frontDoorWwwDomainHostName
    tlsSettings: {
      certificateType: 'ManagedCertificate'
      minimumTlsVersion: 'TLS12'
    }
    azureDnsZone: {
      id: frontDoorDnsZoneResourceId
    }
  }
}

resource frontDoorRootCustomDomainExisting 'Microsoft.Cdn/profiles/customDomains@2024-02-01' existing = if (enableFrontDoor && enableFrontDoorCustomDomains && !frontDoorCreateCustomDomains) {
  name: frontDoorRootCustomDomainName
  parent: frontDoorProfile
}

resource frontDoorWwwCustomDomainExisting 'Microsoft.Cdn/profiles/customDomains@2024-02-01' existing = if (enableFrontDoor && enableFrontDoorCustomDomains && !frontDoorCreateCustomDomains) {
  name: frontDoorWwwCustomDomainName
  parent: frontDoorProfile
}

var frontDoorRootCustomDomainId = frontDoorCreateCustomDomains ? frontDoorRootCustomDomain.id : frontDoorRootCustomDomainExisting.id
var frontDoorWwwCustomDomainId = frontDoorCreateCustomDomains ? frontDoorWwwCustomDomain.id : frontDoorWwwCustomDomainExisting.id

var webRouteCustomDomains = enableFrontDoorCustomDomains ? [
  {
    id: frontDoorRootCustomDomainId
  }
  {
    id: frontDoorWwwCustomDomainId
  }
] : []

var frontDoorWafAssociationDomains = enableFrontDoorCustomDomains ? [
  {
    id: frontDoorEndpoint.id
  }
  {
    id: frontDoorRootCustomDomainId
  }
  {
    id: frontDoorWwwCustomDomainId
  }
] : [
  {
    id: frontDoorEndpoint.id
  }
]

resource webRoute 'Microsoft.Cdn/profiles/afdEndpoints/routes@2024-02-01' = if (enableFrontDoor) {
  name: 'web-route'
  parent: frontDoorEndpoint
  properties: {
    customDomains: webRouteCustomDomains
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
    customDomains: webRouteCustomDomains
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
    name: frontDoorSkuName
  }
  properties: {
    policySettings: {
      enabledState: 'Enabled'
      mode: 'Prevention'
      requestBodyCheck: 'Enabled'
    }
    customRules: {
      rules: [
        // Allow CI smoke-test requests that carry the secret bypass header before any blocking rules fire.
        // The header value is stored as a GitHub secret and never logged.
        {
          name: 'allowcibypass'
          enabledState: empty(frontDoorWafCiBypassToken) ? 'Disabled' : 'Enabled'
          priority: 50
          ruleType: 'MatchRule'
          action: 'Allow'
          matchConditions: [
            {
              matchVariable: 'RequestHeader'
              selector: 'X-CI-Bypass'
              operator: 'Equal'
              matchValue: [
                frontDoorWafCiBypassToken
              ]
            }
          ]
        }
        {
          name: 'blocknonus'
          enabledState: 'Enabled'
          priority: 100
          ruleType: 'MatchRule'
          action: 'Block'
          matchConditions: [
            {
              matchVariable: 'RemoteAddr'
              operator: 'GeoMatch'
              negateCondition: true
              matchValue: [
                'US'
              ]
            }
          ]
        }
        {
          name: 'ratelimitapiauth'
          enabledState: 'Enabled'
          priority: 200
          ruleType: 'RateLimitRule'
          rateLimitDurationInMinutes: 1
          rateLimitThreshold: 30
          action: 'Block'
          matchConditions: [
            {
              matchVariable: 'RequestUri'
              operator: 'Contains'
              matchValue: [
                '/api/auth'
              ]
            }
          ]
        }
        {
          name: 'ratelimitapigeneral'
          enabledState: 'Enabled'
          priority: 210
          ruleType: 'RateLimitRule'
          rateLimitDurationInMinutes: 1
          rateLimitThreshold: 200
          action: 'Block'
          matchConditions: [
            {
              matchVariable: 'RequestUri'
              operator: 'Contains'
              matchValue: [
                '/api/'
              ]
            }
          ]
        }
        {
          name: 'blockcommonbotuseragents'
          enabledState: 'Enabled'
          priority: 300
          ruleType: 'MatchRule'
          action: 'Block'
          matchConditions: [
            {
              matchVariable: 'RequestHeader'
              selector: 'User-Agent'
              operator: 'Contains'
              matchValue: [
                'python-requests'
                'python-httpx'
                'curl/'
                'wget/'
                'scrapy'
                'selenium'
                'headlesschrome'
              ]
            }
          ]
        }
      ]
    }
    // Managed rule sets require the Premium Front Door tier; the Standard tier
    // supports custom rules only. The managedRules property is required either
    // way, so on Standard supply an empty managedRuleSets list.
    managedRules: {
      managedRuleSets: frontDoorSkuName == 'Premium_AzureFrontDoor' ? [
        {
          ruleSetType: 'Microsoft_DefaultRuleSet'
          ruleSetVersion: '2.1'
        }
        {
          ruleSetType: 'Microsoft_BotManagerRuleSet'
          ruleSetVersion: '1.0'
        }
      ] : []
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
          domains: frontDoorWafAssociationDomains
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
var frontDoorPublicHostName = enableFrontDoorCustomDomains ? frontDoorRootDomainHostName : frontDoorHostName
var frontDoorId = frontDoorProfile.?properties.frontDoorId ?? ''
var calculatedPublicApiUrl = enableFrontDoor ? 'https://${frontDoorPublicHostName}/api/v1' : (enableApiManagement ? '${apiGatewayUrl}/api/v1' : nextPublicApiUrl)

var apiAllowedHosts = createStagingSlots
  ? '${apiAppName}.azurewebsites.net;${apiAppName}-${slotName}.azurewebsites.net'
  : '${apiAppName}.azurewebsites.net'

var apiAppSettings = union({
  ASPNETCORE_ENVIRONMENT: 'Production'
  AllowedHosts: apiAllowedHosts
  Database__Provider: 'SqlServer'
  ConnectionStrings__SqlServer: apiConnectionStringSetting
  AZURE_CLIENT_ID: apiSqlClientId
  Auth__Authority: apiAuthAuthority
  Auth__Audience: apiAuthAudience
  Auth__WebAppUrl: nextAuthUrl
  Auth__Google__Audience: googleClientId
  Auth__Microsoft__Audience: azureAdClientId
  Auth__Microsoft__ValidIssuers__0: '${environment().authentication.loginEndpoint}${azureAdTenantId}/v2.0'
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
    userAssignedIdentityResourceId: enableSql ? apiSqlIdentity.id : ''
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
    appCommandLine: 'node server.js'
    appSettings: webAppSettings
    enableSystemAssignedIdentity: true
    ipSecurityRestrictions: webAppIpRestrictions
    ipSecurityRestrictionsDefaultAction: empty(webAppIpRestrictions) ? 'Allow' : 'Deny'
  }
}

module apiSlot './modules/web-app-slot.bicep' = if (createStagingSlots) {
  name: 'apiSlot'
  dependsOn: [
    apiApp
  ]
  params: {
    appName: apiAppName
    location: location
    slotName: slotName
    linuxFxVersion: 'DOTNETCORE|10.0'
    appSettings: apiAppSettings
    userAssignedIdentityResourceId: enableSql ? apiSqlIdentity.id : ''
  }
}

module webSlot './modules/web-app-slot.bicep' = if (createStagingSlots) {
  name: 'webSlot'
  dependsOn: [
    webApp
  ]
  params: {
    appName: webAppName
    location: location
    slotName: slotName
    linuxFxVersion: 'NODE|22-lts'
    appCommandLine: 'node server.js'
    appSettings: webAppSettings
  }
}

// --- SQL contained-user provisioning (passwordless): runs as the UAMI SQL
// admin and creates database users for the app/slot/deploy identities using
// CREATE USER ... WITH SID (object id), which avoids any Microsoft Graph /
// Directory Readers dependency. The shared API SQL identity gets read/write,
// and the deployment identity gets db_ddladmin for EF migrations. ---

resource sqlUserSetup 'Microsoft.Resources/deploymentScripts@2023-08-01' = if (enableSql && enableSqlUserSetupScript) {
  name: 'configure-sql-users'
  location: location
  kind: 'AzureCLI'
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${sqlAdminIdentity.id}': {}
    }
  }
  properties: {
    azCliVersion: '2.61.0'
    forceUpdateTag: sqlSetupRunId
    retentionInterval: 'PT1H'
    timeout: 'PT30M'
    cleanupPreference: 'OnSuccess'
    environmentVariables: [
      { name: 'SQL_SERVER', value: sqlServerFqdn }
      { name: 'SQL_DB', value: resolvedSqlDatabaseName }
      { name: 'UAMI_CLIENT_ID', value: sqlAdminClientId }
      { name: 'API_SQL_IDENTITY_NAME', value: apiSqlIdentityName }
      { name: 'API_SQL_OBJECT_ID', value: apiSqlPrincipalId }
      { name: 'API_SQL_CLIENT_ID', value: apiSqlClientId }
      { name: 'DEPLOY_OBJECT_ID', value: deployPrincipalObjectId }
    ]
    scriptContent: '''
set -euo pipefail
apk add --no-cache curl bzip2 >/dev/null 2>&1 || true

# Portable SQL client (go-sqlcmd) that supports managed-identity auth directly.
curl -sSL "https://github.com/microsoft/go-sqlcmd/releases/download/v1.8.0/sqlcmd-linux-amd64.tar.bz2" -o /tmp/sqlcmd.tar.bz2
mkdir -p /tmp/sqlcmd && tar -xjf /tmp/sqlcmd.tar.bz2 -C /tmp/sqlcmd
SQLCMD=/tmp/sqlcmd/sqlcmd

sid() { python3 -c "import uuid,sys; print(uuid.UUID(sys.argv[1]).bytes_le.hex())" "$1"; }

GRANTS=/tmp/grants.sql
: > "$GRANTS"

emit() {
  uname="$1"; objid="$2"; ddl="$3"
  s=$(sid "$objid")
  cat >> "$GRANTS" <<EOF
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'$uname')
  CREATE USER [$uname] WITH SID = 0x$s, TYPE = E;
IF IS_ROLEMEMBER('db_datareader', '$uname') <> 1
  ALTER ROLE db_datareader ADD MEMBER [$uname];
IF IS_ROLEMEMBER('db_datawriter', '$uname') <> 1
  ALTER ROLE db_datawriter ADD MEMBER [$uname];
EOF
  if [ "$ddl" = "ddl" ]; then
    cat >> "$GRANTS" <<EOF
IF IS_ROLEMEMBER('db_ddladmin', '$uname') <> 1
  ALTER ROLE db_ddladmin ADD MEMBER [$uname];
EOF
  fi
  echo "GO" >> "$GRANTS"
}

emit "$API_SQL_IDENTITY_NAME" "$API_SQL_OBJECT_ID" ""
[ -n "${API_SQL_CLIENT_ID:-}" ] && emit "${API_SQL_IDENTITY_NAME}-client" "$API_SQL_CLIENT_ID" ""
[ -n "${DEPLOY_OBJECT_ID:-}" ] && emit "github-deploy" "$DEPLOY_OBJECT_ID" "ddl"

echo "----- grants.sql -----"; cat "$GRANTS"

# Retry to absorb Entra admin / role propagation delay on a fresh server.
for i in 1 2 3 4 5 6; do
  if "$SQLCMD" -S "$SQL_SERVER" -d "$SQL_DB" --authentication-method ActiveDirectoryManagedIdentity -U "$UAMI_CLIENT_ID" -i "$GRANTS" -b; then
    echo "SQL users configured."
    exit 0
  fi
  echo "Attempt $i failed; waiting for propagation..."
  sleep 20
done
echo "Failed to configure SQL users after retries." >&2
exit 1
'''
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
    principalId: apiSlotPrincipalId
    principalType: 'ServicePrincipal'
  }
}

resource webSlotKvAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (enableKeyVault && createStagingSlots) {
  name: guid(keyVault.id, webAppName, slotName, keyVaultSecretsUserRoleId)
  scope: keyVault
  properties: {
    roleDefinitionId: keyVaultSecretsUserRoleId
    principalId: webSlotPrincipalId
    principalType: 'ServicePrincipal'
  }
}

output apiDefaultHostName string = apiApp.outputs.defaultHostName
output webDefaultHostName string = webApp.outputs.defaultHostName
output frontDoorHostName string = frontDoorHostName
output apiManagementGatewayUrl string = apiGatewayUrl
output sqlServerFqdn string = sqlServerFqdn
output sqlDatabaseName string = resolvedSqlDatabaseName
output apiConnectionString string = apiConnectionString
output apiSqlIdentityName string = apiSqlIdentityName
output apiSqlIdentityPrincipalId string = apiSqlPrincipalId
output apiSqlIdentityClientId string = apiSqlClientId
output apiSqlIdentityResourceId string = apiSqlIdentity.id
