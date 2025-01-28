import Hapi from '@hapi/hapi';
import Inert from '@hapi/inert';
import Vision from '@hapi/vision';
import HapiSwagger from 'hapi-swagger';
import { defineRoutes } from './api/routes';
import { ENV } from './server/global_variables';

const getServer = async () => {
    const server = Hapi.server({
        host: ENV.HOST,
        port: ENV.PORT,
    });

    // Opciones para hapi-swagger
    const swaggerOptions: HapiSwagger.RegisterOptions = {
        info: {
            title: 'API de WhatsApp Client',
            version: '1.0.0',
            description: 'Documentación de la API para gestionar clientes de WhatsApp',
        },
        grouping: 'tags', // Agrupa las rutas por etiquetas
        // Puedes agregar más opciones según tus necesidades
    };

    // Registrar los plugins
    await server.register([
        Inert,
        Vision,
        {
            plugin: HapiSwagger,
            options: swaggerOptions,
        },
    ]);

    await defineRoutes(server);

    return server
}


export const startServer = async () => {
    const server = await getServer()
    await server.start()
    console.log(`Server running on ${server.info.uri}`)
    return server
};