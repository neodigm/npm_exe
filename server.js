const http = require('http');
const { exec } = require('child_process');
const net = require('net');
const app = require('./app');

const PORTS = [3000, 8080, 5000, 8000];
const TARGET_OS = 'windows'; // Set to 'macos' or 'windows'

const server = http.createServer(app);

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => resolve(false))
      .once('listening', () => {
        tester.close();
        resolve(true);
      })
      .listen(port);
  });
}

async function findAvailablePort() {
  for (const port of PORTS) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error('No available ports found');
}

findAvailablePort()
  .then((port) => {
    server.listen(port, () => {
      const url = `http://localhost:${port}/`;
      console.log(`Server running at ${url}`);
      console.log('Press Ctrl+C to stop');

      const openCommand = TARGET_OS === 'windows' ? 'start' : 'open';
      exec(`${openCommand} ${url}`);
    });
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
