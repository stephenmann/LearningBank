@description('Web app name.')
param name string

@description('Azure region for the app.')
param location string

@description('App Service plan resource ID.')
param serverFarmId string

@description('Runtime stack value for linuxFxVersion.')
param linuxFxVersion string

@description('Optional startup command for Linux container startup.')
param appCommandLine string = ''

@description('App settings to apply to the web app.')
param appSettings object = {}

@description('Set true to enable system-assigned managed identity on the app.')
param enableSystemAssignedIdentity bool = true

@description('Optional access restriction rules for the app endpoint.')
param ipSecurityRestrictions array = []

@description('Default action when evaluating app endpoint access restrictions.')
param ipSecurityRestrictionsDefaultAction string = 'Allow'

resource app 'Microsoft.Web/sites@2023-12-01' = {
  name: name
  location: location
  kind: 'app,linux'
  identity: enableSystemAssignedIdentity ? {
    type: 'SystemAssigned'
  } : null
  properties: {
    serverFarmId: serverFarmId
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: linuxFxVersion
      appCommandLine: appCommandLine
      alwaysOn: true
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      http20Enabled: true
      ipSecurityRestrictions: ipSecurityRestrictions
      ipSecurityRestrictionsDefaultAction: ipSecurityRestrictionsDefaultAction
      scmIpSecurityRestrictionsUseMain: false
      scmIpSecurityRestrictionsDefaultAction: 'Allow'
    }
  }
}

resource appSettingsResource 'Microsoft.Web/sites/config@2023-12-01' = {
  name: 'appsettings'
  parent: app
  properties: appSettings
}

output id string = app.id
output defaultHostName string = app.properties.defaultHostName
output principalId string = enableSystemAssignedIdentity ? app.identity.principalId : ''
