import Knex from 'knex';

const filename =
    process.env.NODE_ENV === 'test'
        ? ':memory:'         // Use in-memory DB during tests
        : './data/database.sqlite'; // Otherwise, use file-based DB

const KnexDatabase = Knex({
    client: 'sqlite3',
    connection: {
        filename,
    },
    useNullAsDefault: true,
});

export default KnexDatabase;
