@description('Azure SQL logical server name (must be globally unique).')
param name string

@description('Location for the SQL server and database.')
param location string

@description('Database name.')
param databaseName string

@description('Entra ID (Azure AD) administrator login display name for the SQL server.')
param aadAdminLogin string

@description('Entra ID (Azure AD) administrator object ID (SID) for the SQL server.')
param aadAdminObjectId string

@description('Entra ID administrator principal type: User, Group, or Application.')
@allowed([
  'User'
  'Group'
  'Application'
])
param aadAdminPrincipalType string = 'Application'

@description('Maximum vCores for the serverless database (auto-scales down to minCapacity).')
param maxVCores int = 1

@description('Minimum vCores the serverless database scales down to.')
param minCapacity string = '0.5'

@description('Idle minutes before the serverless database auto-pauses. -1 disables auto-pause.')
param autoPauseDelay int = 60

// Entra-only authentication: no SQL logins/passwords exist on this server.
resource sqlServer 'Microsoft.Sql/servers@2023-08-01-preview' = {
  name: name
  location: location
  properties: {
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
    administrators: {
      administratorType: 'ActiveDirectory'
      principalType: aadAdminPrincipalType
      login: aadAdminLogin
      sid: aadAdminObjectId
      tenantId: subscription().tenantId
      azureADOnlyAuthentication: true
    }
  }
}

// General Purpose serverless tier (cost-minimized: auto-pauses when idle).
resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-08-01-preview' = {
  parent: sqlServer
  name: databaseName
  location: location
  sku: {
    name: 'GP_S_Gen5'
    tier: 'GeneralPurpose'
    family: 'Gen5'
    capacity: maxVCores
  }
  properties: {
    autoPauseDelay: autoPauseDelay
    minCapacity: json(minCapacity)
    zoneRedundant: false
  }
}

// Allow Azure-internal services (App Service managed identities) to reach the server.
resource allowAzureServices 'Microsoft.Sql/servers/firewallRules@2023-08-01-preview' = {
  parent: sqlServer
  name: 'AllowAllWindowsAzureIps'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

output serverFqdn string = sqlServer.properties.fullyQualifiedDomainName
output databaseName string = sqlDatabase.name
output serverName string = sqlServer.name
