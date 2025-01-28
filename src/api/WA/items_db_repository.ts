import db from '../../server/KnexDatabase';

export interface ClientModel {
    id: string;
    webhook_url: string;
    created_at?: Date;
    updated_at?: Date;
}

export class ClientRepository {
    /**
     * Inicializa la tabla 'clients' si no existe.
     */
    async initializeClientsTable(): Promise<void> {
        const exists = await db.schema.hasTable('clients');
        if (!exists) {
            await db.schema.createTable('clients', (table) => {
                table.string('id').primary();
                table.string('webhook_url').notNullable();
                table.timestamps(true, true);
            });
        }
    }

    /**
     * Crea un nuevo cliente en la tabla 'clients'.
     * @param client - El objeto cliente a crear.
     */
    async createClient(client: ClientModel): Promise<void> {
        await db('clients').insert(client);
    }

    /**
     * Obtiene un cliente por su ID.
     * @param id - El ID del cliente.
     * @returns El cliente si existe, o null si no.
     */
    async getClientById(id: string): Promise<ClientModel | null> {
        const client = await db<ClientModel>('clients').where({ id }).first();
        return client || null;
    }

    /**
     * Actualiza la URL del webhook para un cliente específico.
     * @param id - El ID del cliente.
     * @param webhookUrl - La nueva URL del webhook.
     */
    async updateWebhook(id: string, webhookUrl: string): Promise<void> {
        await db<ClientModel>('clients').where({ id }).update({ webhook_url: webhookUrl, updated_at: db.fn.now() });
    }

    /**
     * Elimina un cliente por su ID.
     * @param id - El ID del cliente a eliminar.
     */
    async deleteClient(id: string): Promise<void> {
        await db<ClientModel>('clients').where({ id }).del();
    }

    /**
     * Lista todos los clientes.
     * @returns Un array de clientes.
     */
    async listAllClients(): Promise<ClientModel[]> {
        return await db<ClientModel>('clients').select('*');
    }
}
