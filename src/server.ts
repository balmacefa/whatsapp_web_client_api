import Hapi from '@hapi/hapi'
import { defineRoutes } from './api/routes'
import { ENV } from './server/global_variables'

const getServer = async () => {
    const server = Hapi.server({
        host: ENV.HOST,
        port: ENV.PORT,
    })

    await defineRoutes(server)

    return server
}

export const initializeServer = async () => {
    const server = await getServer()
    await server.initialize()
    return server
}

export const startServer = async () => {
    const server = await getServer()
    await server.start()
    console.log(`Server running on ${server.info.uri}`)
    return server
};