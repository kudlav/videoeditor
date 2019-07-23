# Web Based Video Editor Using MLT Framework
![Overal schema](https://github.com/kudlav/videoeditor/tree/master/docs/schema.png)

## See it in action (YouTube video)
[https://youtu.be/GemMThnqULE](https://youtu.be/GemMThnqULE)

## Installation

Project requires:
- [Node.js](https://nodejs.org/) 8.9.0+ to run server.
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
