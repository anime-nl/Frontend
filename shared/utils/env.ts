/**
 * Whether Node considers this a production environment, used to gate things like debug logging.
 * @param nodeEnv Value of the NODE_ENV environment variable
 * @returns True when nodeEnv is 'production'
 */
export const isProductionEnv = (nodeEnv: string | undefined) => nodeEnv === 'production'
