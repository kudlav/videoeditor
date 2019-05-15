# Web Based Video Editor Using MLT Framework

## Installation

Project requires:
- [Node.js](https://nodejs.org/) v8+ to run server.
- MLT framework to export video.
- FFmpeg to handle multimedia files.

```sh
$ sudo apt install melt
$ sudo apt install ladspa-sdk ffmpeg
```

### Development

Install the dependencies and devDependencies and start the server and webpack for development. Don't forget to change config file.

```sh
$ npm install -d
$ npm run dev-build
$ npm run dev-start
```

### Production

Install the dependencies and start the server and webpack for production. Don't forget to change config file.

```sh
$ npm install
$ export NODE_ENV=production
$ npm run build
$ npm start
```
