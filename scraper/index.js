/*global $*/

var knex = require("knex")(require('./knexfile.js')[process.env.NODE_ENV]);
var format = require("util").format;
var cheerio = require("cheerio");
var Promise = require("bluebird");
var bhttp = require("bhttp");
var moment = require("moment");

var winston = require("winston");

var logger = new(winston.Logger)({
    transports: [
        new(winston.transports.Console)(),
        new(winston.transports.File)({
            filename: 'logs/scrape.log'
        })
    ]
});

const buyUrl = 'http://swappa.com/buy/';

knex('deviceEmails')
    .select('devices.id', 'devices.deviceUrl')
    .where('deviceEmails.created_at', '<', moment().add(1, 'month').toDate())
    .distinct('deviceId')
    .innerJoin('devices', 'devices.id', 'deviceEmails.deviceId')
    .then(function(devices) {

        return devices.forEach(function(device) {

            return bhttp.get(format('%s%s', buyUrl, device.deviceUrl))
                .then(function(response) {

                    var $ = cheerio.load(response.body.toString());

                    var listings = $('#listing_previews .listing_preview');
                    //return [1,2,3].map(function(n){ return n * 2;});
                    var res = [];
                    for (var i = 0; i < listings.length; i++) {
                        res.push({
                            code: $(listings[i]).attr('data-code'),
                            featured: $(listings[i]).attr('data-featured'),
                            primo: $(listings[i]).attr('data-primo'),
                            price: $(listings[i]).attr('data-price'),
                            date: $(listings[i]).attr('data-date'),
                            condition: $(listings[i]).attr('data-condition'),
                            colorCode: $(listings[i]).attr('data-color'),
                            colorCss: $(listings[i]).find('.color_box').first().css('background-color'),
                            memory: $(listings[i]).attr('data-memory'),
                            storage: $(listings[i]).attr('data-storage'),
                            url: $(listings[i]).attr('data-url'),
                            listingId: $(listings[i]).attr('data-listing-id'),
                            stars: $(listings[i]).find('.stars_count').first().text().trim(),
                            shipFrom: $(listings[i]).find('.ship_from').first().text().trim()
                        });
                    }
                    return res;

                })
                .then(function(listings) {

                    return Promise.each(listings, function(listing) {
                            var listingIdFilter = {
                                'listingId': listing.listingId
                            };
                            return knex('listings')
                                .where(listingIdFilter)
                                .count()
                                .then(function(count) {
                                    var exists = count[0]['count(*)'] > 0;

                                    var record = {
                                        'deviceId': device.id,
                                        'code': listing.code,
                                        'url': listing.url,
                                        'price': listing.price,
                                        'featured': listing.featured,
                                        'condition': listing.condition,
                                        'date': listing.date,
                                        'color': listing.colorCss,
                                        'colorCode': listing.colorCode,
                                        'storage': listing.storage,
                                        'memory': listing.memory,
                                        'stars': listing.stars,
                                        'shipFrom': listing.shipFrom
                                    };

                                    if (exists) {
                                        logger.info('updating ' + listing.listingId);
                                        record.updated_at = new Date();
                                        return knex('listings')
                                            .where(listingIdFilter)
                                            .update(record);
                                    }
                                    else {
                                        logger.info('inserting ' + listing.listingId);
                                        record.listingId = listing.listingId;
                                        record.created_at = new Date();
                                        return knex('listings')
                                            .insert(record);
                                    }
                                });
                        })
                        .then(function() {
                            return knex('listings').where({
                                'deviceId': device.id
                            });
                        })
                        .then(function(savedListings) {

                            return Promise.each(savedListings, function(listing) {

                                var foundListing = listings.some(function(recievedListing) {
                                    //winston.log(recievedListing.listingId, listing.listingId);
                                    return recievedListing.listingId === listing.listingId;
                                });

                                if (!foundListing) {
                                    logger.info('deleting ' + listing.listingId);
                                    return knex('listings').where({
                                        listingId: listing.listingId
                                    }).delete()
                                }

                            });


                        });

                });

        });

    });
