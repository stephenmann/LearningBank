@description('Name of the App Service plan.')
param name string

@description('Azure region for the plan.')
param location string

@description('SKU name, for example B1 or F1.')
param skuName string = 'B1'

@description('SKU tier, for example Basic or Free.')
param skuTier string = 'Basic'

@description('Number of worker instances in the App Service plan.')
param capacity int = 1

@description('App Service plan kind.')
param kind string = 'linux'

@description('Set true for Linux workers.')
param reserved bool = true

resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: name
  location: location
  kind: kind
  sku: {
    name: skuName
    tier: skuTier
    capacity: capacity
  }
  properties: {
    reserved: reserved
  }
}

output id string = plan.id
