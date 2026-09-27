/** Whether Node considers this a production environment, used to gate things like debug logging. */
export const isProductionEnv = (nodeEnv: string | undefined) => nodeEnv === 'production'
