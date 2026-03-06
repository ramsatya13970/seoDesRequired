# seoDesRequired

This project enforces that the `seoDescription` field is required in all Contentful content types.

## API Endpoint

- **POST** `/enforceSeoDescriptionRequired`: Triggers the enforcement process.

## Usage

Start the server in production mode:

```bash
npm start
```

Start the server in development mode (with auto-restart on file changes):

```bash
npm run dev
```

Call the API:

```bash
curl -X POST http://localhost:3000/enforceSeoDescriptionRequired
```