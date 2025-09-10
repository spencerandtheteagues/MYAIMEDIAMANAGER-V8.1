export class AIError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false,
    public details?: any
  ) {
    super(message);
    this.name = 'AIError';
  }
}

export function normalizeError(error: any): AIError {
  if (error instanceof AIError) return error;
  
  const message = error?.message || String(error);
  
  // Check for rate limiting
  if (message.includes('429') || message.includes('rate limit')) {
    return new AIError('Rate limit exceeded', 'RATE_LIMIT', true);
  }
  
  // Check for quota errors
  if (message.includes('quota') || message.includes('insufficient')) {
    return new AIError('Quota exceeded', 'QUOTA_EXCEEDED', false);
  }
  
  // Check for auth errors
  if (message.includes('401') || message.includes('unauthorized') || message.includes('API key')) {
    return new AIError('Authentication failed', 'AUTH_ERROR', false);
  }
  
  // Check for model errors
  if (message.includes('model') || message.includes('not found')) {
    return new AIError('Model not available', 'MODEL_ERROR', false);
  }
  
  // Default error
  return new AIError(message, 'UNKNOWN_ERROR', false, error);
}