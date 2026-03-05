const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const net = require('net');

const PORTS = [8080, 3000, 5000, 8000];
const TARGET_OS = 'macos'; // Set to 'macos' or 'windows'

const server = http.createServer((req, res) => {
    const filePath = path.join(__dirname, 'index.html');

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error loading index.html');
            return;
        }

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
    });
});

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

            // Open default browser based on target OS
            const openCommand = TARGET_OS === 'windows' ? 'start' : 'open';
            exec(`${openCommand} ${url}`);
        });
    })
    .catch((err) => {
        console.error(err.message);
        process.exit(1);
    });
