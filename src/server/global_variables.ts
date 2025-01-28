

export const ENV = {
    PORT: (process.env.PORT || 3000) as number,
    HOST: process.env.HOST || '0.0.0.0',
    server_isHealthy: false,
    server_isReady: false,
}
