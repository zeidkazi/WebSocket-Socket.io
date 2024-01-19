import express from 'express'
import {Server} from "socket.io"
import path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 3500;

const app = express()

app.use(express.static(path.join(__dirname,"public")))

const expressServer = app.listen(PORT, ()=>{
    console.log(`listening on port ${PORT}`)
})

const io = new Server(expressServer, {
    cors:{
        origin:process.env.NODE_ENV === "production" ? false : ["http://localhost:5500","http://127.0.0.1:5500"]
    }

})

io.on('connection', (socket)=>{
    //socker.io starts here

    console.log(`User ${socket.id} connected`)

    //Upon connection - only to user
    socket.emit('message',"Welcome to Chat App")

    //Upon connection - to all others
    socket.broadcast.emit('message',`User ${socket.id.substring(0,5)} connected`)

    //Listening for a message event
    socket.on('message',(data)=>{
        console.log(data);

        //this line will pass the msg to everyone in the server to the server!
        //difference btw socket.broadcast.emit and io.emit?
        // io is the server ,, so it will send the data to everyone icluding the user.
        //but in socket.broadcast.emit sends to everyone except the user
        io.emit('message',`${socket.id.substring(0,5)} : ${data}`);
    }) 

    //When user disconnects -  to all Others
    socket.on('disconnect',()=>{
        socket.broadcast.emit('message',`User ${socket.id.substring(0,5)} Disconnected`)

    })

    //Listen for activity
    socket.on('activity',(name)=>{
        socket.broadcast.emit('activity',name)
    })

})

