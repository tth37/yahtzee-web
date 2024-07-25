import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { Room, Player, Scoreboard, Game } from './model';

const PORT = 3001;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});

const rooms: Record<string, Room> = {};
function getRoom(roomId: string) {
    if (!rooms[roomId]) {
        rooms[roomId] = new Room();
    }
    return rooms[roomId];
}

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('disconnect', () => {
        console.log('user disconnected');

        Object.values(rooms).forEach(room => {
            console.log('leaving room', room);
            room.leave(socket.id);
            io.emit('updateRoom', room);
        });

    });

    socket.on('getRoom', (roomId: string) => {
        socket.emit('updateRoom', getRoom(roomId));
    });

    socket.on('joinRoom', (roomId: string, playerName: string) => {
        console.log('joinRoom', roomId, playerName);
        const room = getRoom(roomId);
        const player = new Player(socket.id, playerName);
        room.join(player);
        io.emit('updateRoom', room);
    });

    socket.on('switchRole', (roomId: string) => {
        const room = getRoom(roomId);
        room.switchRole(socket.id);
        io.emit('updateRoom', room);
    });

    socket.on('ready', (roomId: string) => {
        const room = getRoom(roomId);
        room.ready(socket.id);
        io.emit('updateRoom', room);
    });

    socket.on('keep', (roomId: string, idx: number) => {
        const room = getRoom(roomId);
        room.keep(socket.id, idx);
        io.emit('updateRoom', room);
    });

    socket.on('reroll', (roomId: string) => {
        const room = getRoom(roomId);
        room.reroll(socket.id);
        io.emit('updateRoom', room);
    });

    socket.on('score', (roomId: string, category: string) => {
        const room = getRoom(roomId);
        room.score(socket.id, category);
        io.emit('updateRoom', room);
    });

});


server.listen(PORT, () => {
    console.log(`listening on localhost:${PORT}`);
});