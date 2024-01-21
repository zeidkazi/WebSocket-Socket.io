import express from 'express'
import {Server} from "socket.io"
import path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 3500;
const ADMIN = "Admin";

const app = express()

app.use(express.static(path.join(__dirname,"public")))

const expressServer = app.listen(PORT, ()=>{
    console.log(`listening on port ${PORT}`)
})

//state for users
const UsersState = {
    users:[],
    setUsers: function(newUsersArray){
        this.users = newUsersArray;
    }
}


const io = new Server(expressServer, {
    cors:{
        origin:process.env.NODE_ENV === "production" ? false : ["http://localhost:5500","http://127.0.0.1:5500"]
    }

})

io.on('connection', (socket)=>{
    //socker.io starts here

    console.log(`User ${socket.id} connected`)

    //Upon connection - only to user
    socket.emit('message',buildMsg(ADMIN,"Welcome to Chat App"))

    socket.on('enterRoom',({name,room})=>{
        //leave previous room if user is in one
        const prevRoom = getUser(socket.id)?.room;
        if(prevRoom){
            socket.leave(prevRoom);
            io.to(prevRoom).emit('message', buildMsg(ADMIN,`${name} has left the room`));
        }

        

        //activate user
        const  user = activateUser(socket.id,name,room)

        //Cannot update previous room user list until after the state upadte in active room
        if(prevRoom){
            io.to(prevRoom).emit('userList',{
                users: getUSersInRoom(prevRoom)
            })
        }

        //join room
        socket.join(user.room);

        //To user who joined
        socket.emit('message',buildMsg(ADMIN,`You have joined the ${user.room} chat room`))
        
        //To everyone else
        socket.broadcast.to(user.room).emit('message', buildMsg(ADMIN,`${user.name} has joined the room`))

        //Update user list of the room
        io.to(user.room).emit('userList',{
            users: getUSersInRoom(user.room)
        })

        //Update rooms list for everyone
        io.emit('roomList',{
            rooms: getAllActiveRooms()
        })
    })

     //When user disconnects -  to all Others
     socket.on('disconnect',()=>{
        const user = getUser(socket.id)
        userLeaveApp(socket.id)
        if(user){
            io.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} has left the room`))
            
            io.to(user.room).emit('userList',{
                users: getUSersInRoom(user.room)
            })
        }        
    })

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

   

    //Listen for activity
    socket.on('activity',(name)=>{
        const room = getUSersInRoom(socket.id)?.room
        if(room){
            socket.broadcast.to(room).emit('activity',name)
        }
    })


})


//this func wont imapact userstate
function buildMsg(name,text){
    return{
        name,
        text,
        time: new Intl.DateTimeFormat('default',{
            hour:'numeric',
            minute:'numeric',
            second:'numeric'
        }).format(new Date())
    }
}


//User func(will impact the user state)

//this funct add use to room if he is not already in that room
function activateUser(id,name,room){
    const user = {id,name,room};
    UsersState.setUsers([...UsersState.users.filter(user=>user.id !== id), user])
    return user;
}


//function for user to leave room
function userLeaveApp(id){
    UsersState.setUsers(
        UsersState.users.filter(user => user.id !== id)
    )

}

function getUser(id){
    return UsersState.users.find(user => user.id === id)
}

function getUSersInRoom(room){
    return UsersState.users.filter(user => user.room === room)
}

function getAllActiveRooms(){
    return Array.from(new Set(UsersState.users.map(user=> user.room)))
}