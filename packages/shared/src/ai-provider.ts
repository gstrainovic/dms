export interface ModelConfig {
  provider: 'mistral' | 'openai' | 'anthropic'
  model: string
  apiKey: string
  baseURL?: string
}

export function getModel(config: ModelConfig) {
  // Will be implemented with Vercel AI SDK v6
  // For now, returns config for downstream use
  return {
    provider: config.provider,
    model: config.model,
    apiKey: config.apiKey,
    baseURL: config.baseURL ?? getDefaultBaseURL(config.provider),
  }
}

function getDefaultBaseURL(provider: ModelConfig['provider']): string {
  switch (provider) {
    case 'mistral':
      return 'https://api.mistral.ai/v1'
    case 'openai':
      return 'https://api.openai.com/v1'
    case 'anthropic':
      return 'https://api.anthropic.com'
  }
}
