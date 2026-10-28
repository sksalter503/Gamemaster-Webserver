[![Node.js CI](https://github.com/sksalter503/Gamemaster-Webserver/actions/workflows/node.js.yml/badge.svg)](https://github.com/sksalter503/Gamemaster-Webserver/actions/workflows/node.js.yml)

To run this program, you need `npm` installed:
https://nodejs.org/en/download

Instructions:
- First you must have an existing sql server configured and running for this to work. Otherwise you can modify app-data-source.ts for your purposes.
- Second you must create a .env file in the project root containing DB_USERNAME, DB_PASSWORD, DB_NAME, and DB_PORT
- Third you must change the consts file to be your own address where you are running the server from.

After that you can run `npm run start` and it will build and run the program being accessable from your address.

Coders:
- All source code goes in `./src` and is compiled to both `./dist` and `./public/scripts`.
- Be sure to run `npm run clean` before commiting, as we don't need to commit the compiled typescript files.
