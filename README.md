# noir-libs - Noir package manager server

This is a server (API) for **[noir-libs.org](https://noir-libs.org/) package manager for [Noir](https://noir-lang.org/)**.
Built with [Nest.js](https://nestjs.com/).

## Project setup

```bash
nvm use
yarn install
```

Specify DB (PostreSQL) connection details in `.env` file. See `.env.example` for a reference.
## Compile and run the project

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```