const app = require("express")();
const server = require("http").createServer(app);
const cors = require("cors");
const { uuid } = require("uuidv4");

const io = require("socket.io")(server, {
    cors:{
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());

const PORT = process.env.PORT || 5000;

app.get("/", (req, resp) => {
    resp.send('Server is running.');
})

appstate = {
    roomList: [{
        id: uuid(),
        name: "This is the first room",
        moderatorId: uuid(),
        language: 0
    }],
}

io.on('connection', (socket) => {
    socket.emit('CONNECTED');

    socket.on('GET_ROOMS', () => {
        socket.emit('ROOM_LIST', appstate.roomList);
    })

    socket.on('JOIN_ROOM', ({roomId}) => {
        socket.join(roomId);
        console.log(`joined to room: ${roomId}`);
        socket.to(roomId).emit('USER_JOINED_ROOM', {idUser: socket.id, name: 'pedro'})
    })

    socket.on('USER_SIGNAL', ({idUser, data}) => {
        socket.to(idUser).emit('USER_SIGNAL', {idUser: socket.id, data})
    })

    socket.on('LEAVE_ROOM', ({roomId}) => {
        socket.leave(roomId);
        io.to(roomId).emit('USER_LEFT_ROOM', {idUser: socket.id})
        console.log(`Left room: ${roomId}`);
    })

    // This event is similar to disconnect but is fired a bit earlier, when the Socket#rooms set is not empty yet
    socket.on('disconnecting', () =>{
        for (const room of socket.rooms) {
            if (room !== socket.id) {
                socket.to(room).emit('USER_LEFT_ROOM', {idUser: socket.id});
            }
          }
        console.log('user disconnected');
    })
})

server.listen(PORT, () => console.log(`Server Listening on port: ${PORT}`))