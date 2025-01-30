

export const ENV = {
    PORT: (process.env.PORT || 3000) as number,
    HOST: process.env.HOST || 'localhost',
    server_isHealthy: false,
    server_isReady: false,
}
