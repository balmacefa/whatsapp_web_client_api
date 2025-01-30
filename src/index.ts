import { createHttpTerminator } from 'http-terminator';
import { startServer } from './server';
import { AddShutdown } from './server/process_exit_handlers';

async function main() {
    const server = await startServer();

    const httpTerminator = createHttpTerminator({
        server,
    });

    // Add hook for graceful shutdown
    AddShutdown('Express connections', async () => {
        console.log(
            'No longer accepting new requests. Waiting for pending requests to finish before shutting down the server.'
        );
        await httpTerminator.terminate();
        console.log('All pending requests have finished. Shutting down the server...');
    });
}

if (require.main === module) {
    (async () => {
        await main();
    })();
}