import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';
import formatmessage from './utils/messages.js';
import { getcurrentuser, userjoin, getroomuser, userleave } from './utils/users.js';
dotenv.config()

const app = express();
const httpserver = http.createServer(app)
const io = new Server(httpserver)
const PORT = process.env.PORT;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)

app.use(express.static(path.join(__dirname,'public')));
const botname = 'mama'
//websocket logic
io.on('connection',socket=>{
    socket.on('joinroom',({ username, room })=>{
        const user = userjoin(socket.id,username,room);
        
        socket.join(user.room);
        //welcome to all users
        socket.emit('message',formatmessage(botname,'welcome to the chat'))
        //broadcast when a user connects
        socket.broadcast.to(user.room).emit('message',formatmessage(botname,`${user.username} user has joined the chat`))
        
        //send users and room info
        io.to(user.room).emit('roomUsers',{
            room:user.room,
            users:getroomuser(user.room)
        })
    })
    // console.log('New Ws Connection.....');
    
    //listen for chat message
    socket.on('chatMessage', msg=>{
        const user = getcurrentuser(socket.id);
        console.log(msg)
        io.to(user.room).emit('message',formatmessage(user.username,msg))
    })
    socket.on('disconnect',()=>{
        const user = userleave(socket.id);
        if(user){
            // console.log(`${user.username} has left the chat`)
            io.to(user.room).emit('message',
                formatmessage(botname, `${user.username} left the chat`));
                //send users and room info
        io.to(user.room).emit('roomUsers',{
            room:user.room,
            users:getroomuser(user.room)
        })
        }
    })
})

httpserver.listen(PORT,()=>{
    console.log(`Server running at http://localhost:${PORT}`)
})