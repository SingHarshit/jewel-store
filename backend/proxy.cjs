const net = require('net');

const server = net.createServer((clientSocket) => {
  console.log('Incoming client connection from', clientSocket.remoteAddress, clientSocket.remotePort);
  const targetSocket = net.connect({ port: 5432, host: '::1' }, () => {
    console.log('Connected to target ::1:5432');
  });

  clientSocket.pipe(targetSocket);
  targetSocket.pipe(clientSocket);

  clientSocket.on('error', (err) => console.error('Client socket error:', err.message));
  targetSocket.on('error', (err) => console.error('Target socket error:', err.message));
  clientSocket.on('close', () => console.log('Client closed'));
  targetSocket.on('close', () => console.log('Target closed'));
});

server.listen(5432, '127.0.0.1', () => {
  console.log('Proxy listening on 127.0.0.1:5432 -> ::1:5432');
});
