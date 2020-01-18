# Web Based Video Editor Using MLT Framework
![Overal schema](https://raw.githubusercontent.com/kudlav/videoeditor/master/docs/schema.png)

## See it in action (YouTube video)
[https://youtu.be/GemMThnqULE](https://youtu.be/GemMThnqULE)

## Badges
[![Build Status](https://travis-ci.org/kudlav/videoeditor.svg?branch=master)](https://travis-ci.org/kudlav/videoeditor)

## Installation

Project requires:
- [Node.js](https://nodejs.org/) 10.13.0+ to run server.
- MLT framework to export video.
- FFmpeg to handle multimedia files.

```sh
$ sudo apt install melt
$ sudo apt install ladspa-sdk ffmpeg
```

### Development

Install the dependencies and devDependencies and start the server and webpack for development. Don't forget to change `config.js` file.

```sh
$ npm install
$ npm run dev-build
$ npm run dev-start
```

You can run code check using ESLint (required installed npx):
```sh
$ sudo npm i -g npx
$ npm run eslint
```

### Production

Install the dependencies and start the server and webpack for production. Don't forget to change `config.js` file.

```sh
$ export NODE_ENV=production
$ npm install
$ npm run build
$ npm start
```
