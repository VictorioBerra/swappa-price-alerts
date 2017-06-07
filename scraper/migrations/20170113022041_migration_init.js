exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.createTable('devices', function(table) {
            table.increments();
            table.string('deviceUrl').unique();
            table.timestamps();
        }),
        knex.schema.createTable('emails', function(table) {
            table.increments();
            table.string('email').unique();
            table.timestamps();
        }),
        knex.schema.createTable('deviceEmails', function(table) {
            table.increments();
            table.integer('emailId').references('email');
            table.integer('deviceId').references('devices');
            table.decimal('threshold');
            table.timestamps();
        }),
        knex.schema.createTable('listings', function(table) {
            table.string('listingId').unique().primary();
            table.integer('deviceId').references('devices');
            table.string('code');
            table.decimal('url');
            table.decimal('price');
            table.boolean('featured');
            table.string('condition');
            table.string('date');
            table.string('color');
            table.string('colorCode');
            table.decimal('storage');
            table.decimal('memory');
            table.integer('stars');
            table.string('shipFrom');
            table.timestamps();
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('deviceEmails'),
        knex.schema.dropTable('devices'),
        knex.schema.dropTable('emails'),
        knex.schema.dropTable('listings')
    ])
};
