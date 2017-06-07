echo "deleting dev database"
rm /home/ubuntu/workspace/scraper/dev.sqlite3
/home/ubuntu/workspace/scraper/node_modules/knex/bin/cli.js migrate:latest
/home/ubuntu/workspace/scraper/node_modules/knex/bin/cli.js seed:run