exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('devices').del()
    .then(function() {
      return Promise.all([
        // Inserts seed entries
        knex('devices').insert({
          deviceUrl: 'samsung-galaxy-s-5-verizon',
          created_at: new Date()
        }),
        knex('emails').insert({
          email: 'toryberra@gmail.com',
          created_at: new Date()
        })
      ]).then(function() {
        return knex.select().table('emails').then(function(emails) {
          return knex.select().table('devices').then(function(devices) {
            return Promise.each(emails, function(email) {
              return Promise.each(devices, function(device) {
                return knex('deviceEmails').insert({
                  emailId: email.id,
                  deviceId: device.id,
                  threshold: 200,
                  created_at: new Date()
                });
              });
            });
          });
        })
      });
    });
};
