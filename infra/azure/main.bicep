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

var apiAppSettings = {
  ASPNETCORE_ENVIRONMENT: 'Production'
  Database__Provider: 'SqlServer'
  ConnectionStrings__SqlServer: apiConnectionString
  Auth__Authority: apiAuthAuthority
  Auth__Audience: apiAuthAudience
  Auth__WebAppUrl: nextAuthUrl
}

var webAppSettings = {
  NODE_ENV: 'production'
  AUTH_SECRET: authSecret
  GOOGLE_CLIENT_ID: googleClientId
  GOOGLE_CLIENT_SECRET: googleClientSecret
  AZURE_AD_CLIENT_ID: azureAdClientId
  AZURE_AD_CLIENT_SECRET: azureAdClientSecret
  AZURE_AD_TENANT_ID: azureAdTenantId
  NEXTAUTH_URL: nextAuthUrl
  NEXT_PUBLIC_API_URL: nextPublicApiUrl
}

module appServicePlan './modules/app-service-plan.bicep' = {
  name: 'appServicePlan'
  params: {
    name: appServicePlanName
    location: location
    skuName: appServicePlanSkuName
    skuTier: appServicePlanSkuTier
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

output apiDefaultHostName string = apiApp.outputs.defaultHostName
output webDefaultHostName string = webApp.outputs.defaultHostName
