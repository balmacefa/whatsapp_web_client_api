

console.log('Hello, World!', process.env);
console.log('Hello, World!', process.env['PROD_HOST']);
console.log('Hello, World!', process.env.PROD_HOST);
console.log('Hello, World!', process.env['PROD_HOST'] || 'http://localhost:3000');
export const ENV = {
    PORT: (process.env.PORT || 3000) as number,
    HOST: process.env.HOST || 'localhost',
    PROD_HOST: process.env['PROD_HOST'] || 'http://localhost:3000',
    API_KEYS: (process.env.API_KEYS || 'secure_api_key,change_me').split(','),
    server_isHealthy: false,
    server_isReady: false,
}
