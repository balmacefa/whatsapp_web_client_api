

export const ENV = {
    PORT: (process.env.PORT || 3000) as number,
    HOST: process.env.HOST || 'localhost',
    API_KEYS: (process.env.API_KEYS || 'secure_api_key,change_me').split(','),
    server_isHealthy: false,
    server_isReady: false,
}
