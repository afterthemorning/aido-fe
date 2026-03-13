# n9e-fe

This is the web project for N9E

## Usage

The built pub folder can work in the [n9e](https://github.com/ccfos/nightingale/).

you can deploy the front-end code independently, just replace the pub with the new release.

## Dependencies

```
node: v16.x <= v16.15.0
npm: 8.x <= 8.5.5
```

## Installation

```
npm install
```

## Start

```
npm run dev
```

The back-end api proxy config is https://github.com/n9e/fe/blob/main/vite.config.ts#L41

Trouble shooting: https://answer.flashcat.cloud/questions/10010000000003759

## Build

```
npm run build
```

### Build For Subpath (e.g. /aido)

When deploying behind a subpath, build with `VITE_PREFIX`:

```
VITE_PREFIX=/aido npm run build
```

The generated static files will be rooted under `/aido/`.

### Nginx Example For Subpath

```nginx
server {
    listen 8765;
    server_name _;

    # Frontend calls absolute /api/* paths, so keep root API passthrough.
    location /api/ {
        proxy_pass http://n9e.api.server;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location = /aido {
        return 301 /aido/;
    }

    location /aido/ {
        root front-end/page/path;    # e.g. /root/n9e/pub
        try_files $uri /index.html;
    }
}
```

## Nginx Server (Root Path)

```
server {
    listen       8765;
    server_name  _;

    add_header Access-Control-Allow-Origin *;
        add_header 'Access-Control-Allow-Credentials' 'true';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
    root   front-end/page/path;    # e.g. /root/n9e/pub;

    location / {
        root front-end/page/path;    # e.g. /root/n9e/pub;
        try_files $uri /index.html;
    }
   location /api/ {
        proxy_pass http://n9e.api.server;   # e.g. 127.0.0.1:18000
    }
}
```

## Notice

- `vite.config.js` and `tsconfig.json` should both configure to make sure alias works
- Add `"css.validate": false` in vscode setting.json to ignore the css warning
- Install the Prettier plugin in vscode and set the format on save
