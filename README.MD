To run this program, you need `npm` installed:
https://nodejs.org/en/download

Instructions:
- before running, check  what your local network address is, likely by running `ipconfig` in the terminal and finding a line that says ipv4 address, likely starting with 192.0 or 192.1
- After aquiring this address, replace the `API_URL` value in `./src/shared/consts.ts` with the new value.
- Set a secure password in this file as well, using the `ADMIN_PASSWORD` field.
- You can access the admin panel by going to `http://localhost/admin` and typing the password you saved earlier.
- run `npm run start` to run the program.

Coders:
- All source code goes in `./src` and is compiled to both `./dist` and `./public/scripts`.
- Be sure to run `npm run clean` before commiting, as we don't need to commit the compiled typescript files.