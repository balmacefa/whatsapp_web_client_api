import db from '../../server/KnexDatabase';

export interface Item {
    id: number;
    name: string;
    price: number;
}

export interface IItemRepository {
    initializeItemsTable(): Promise<void>;
    doesItemExist(id: number): Promise<boolean>;
    createItem(name: string, price: number): Promise<Item>;
    readItem(id: number): Promise<Item | null>;
    updateItem(id: number, newName?: string, newPrice?: number): Promise<Item | null>;
    deleteItem(id: number): Promise<boolean>;
    listAllItems(): Promise<Item[]>;
}


export class ItemRepository implements IItemRepository {
    /**
     * Creates the 'items' table if it does not exist.
     */
    async initializeItemsTable(): Promise<void> {
        const exists = await db.schema.hasTable('items');

        if (!exists) {
            await db.schema.createTable('items', (table) => {
                table.increments('id').primary();
                table.string('name').notNullable();
                table.float('price').notNullable();
            });
        }
    }

    /**
     * Checks if an item with the given ID exists in the database.
     * @param id - The ID of the item to check.
     * @returns A promise that resolves to true if the item exists, false otherwise.
     */
    async doesItemExist(id: number): Promise<boolean> {
        const row = await db<Item>('items')
            .where({ id })
            .select('id')
            .first();

        return !!row;
    }

    /**
     * Creates a new item in the 'items' table.
     * @param name - The name of the item.
     * @param price - The price of the item.
     * @returns A promise that resolves to the created Item.
     */
    async createItem(name: string, price: number): Promise<Item> {
        const [newId] = await db('items').insert({ name, price });

        const newItem = await db<Item>('items').where({ id: newId }).first();
        if (!newItem) {
            throw new Error('Failed to create item');
        }
        return newItem;
    }

    /**
     * Retrieves an item by its ID.
     * @param id - The ID of the item to retrieve.
     * @returns A promise that resolves to the Item if found, or null otherwise.
     */
    async readItem(id: number): Promise<Item | null> {
        const item = await db<Item>('items')
            .where({ id })
            .first();

        return item || null;
    }

    /**
     * Updates an existing item.
     * @param id - The ID of the item to update.
     * @param newName - The new name for the item (optional).
     * @param newPrice - The new price for the item (optional).
     * @returns A promise that resolves to the updated Item, or null if not found.
     */
    async updateItem(
        id: number,
        newName?: string,
        newPrice?: number
    ): Promise<Item | null> {
        if (newName === undefined && newPrice === undefined) {
            return null;
        }

        const updateData: Partial<Item> = {};
        if (newName !== undefined) {
            updateData.name = newName;
        }
        if (newPrice !== undefined) {
            updateData.price = newPrice;
        }

        const count = await db<Item>('items')
            .where({ id })
            .update(updateData);

        if (count === 0) {
            return null;
        }

        const updatedItem = await db<Item>('items').where({ id }).first();
        return updatedItem || null;
    }

    /**
     * Deletes an item by its ID.
     * @param id - The ID of the item to delete.
     * @returns A promise that resolves to true if the item was deleted, false otherwise.
     */
    async deleteItem(id: number): Promise<boolean> {
        const count = await db<Item>('items')
            .where({ id })
            .del();

        return count > 0;
    }

    /**
     * Retrieves all items from the 'items' table.
     * @returns A promise that resolves to an array of Items.
     */
    async listAllItems(): Promise<Item[]> {
        const items = await db<Item>('items').select('*');
        return items;
    }
}
