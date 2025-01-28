import { createHttpTerminator } from "http-terminator";
import { startServer } from "./server";
import { ENV } from "./server/global_variables";
import { AddShutdown } from "./server/process_exit_handlers";


async function main() {
    const server = await startServer()

    const httpTerminatorHapi = createHttpTerminator({
        server: server.listener,
    });

    // Add hook for graceful shutdown
    AddShutdown('Hapi connections', async () => {
        // Close here connections (Redis, DB, etc.)
        console.log(
            'No longer accepting new requests. Waiting for pending requests to finish before shutting down the Hapi server.'
        );
        await httpTerminatorHapi.terminate();
        console.log(
            'All pending requests have finished. Shutting down the Hapi server...'
        );
    });

    ENV.server_isReady = true;
    ENV.server_isHealthy = true;
}

// if this file is run directly, run main
if (require.main === module) {

    // Run self-contained async function
    (async () => {
        // Run Main
        await main();
        // Set shutdown process
    })();

}