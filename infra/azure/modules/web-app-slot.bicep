@description('Parent app name.')
param appName string

@description('Azure region for the slot.')
param location string

@description('Slot name.')
param slotName string

@description('Runtime stack value for linuxFxVersion.')
param linuxFxVersion string

@description('Optional startup command for Linux container startup.')
param appCommandLine string = ''

@description('App settings to apply to the slot.')
param appSettings object = {}

resource slot 'Microsoft.Web/sites/slots@2023-12-01' = {
  name: '${appName}/${slotName}'
  location: location
  properties: {
    siteConfig: {
      linuxFxVersion: linuxFxVersion
      appCommandLine: appCommandLine
      alwaysOn: true
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      http20Enabled: true
    }
  }
}

resource slotAppSettings 'Microsoft.Web/sites/slots/config@2023-12-01' = {
  name: 'appsettings'
  parent: slot
  properties: appSettings
}

output id string = slot.id
