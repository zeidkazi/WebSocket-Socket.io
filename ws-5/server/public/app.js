const socket = io('ws://localhost:3500');

const msgInput = document.querySelector('#message')
const nameInput = document.querySelector('#name')
const chatRoom = document.querySelector('#room')
const activity = document.querySelector('.activity')
const usersList = document.querySelector('.user-list')
const roomList = document.querySelector('.room-list')
const chatDisplay = document.querySelector('.chat-display')
const formMsg = document.querySelector(".form-msg")
const formJoin = document.querySelector(".form-join")


 
function sendMessage(e) {
    e.preventDefault();
    if(nameInput && msgInput.value && chatRoom.value){
        socket.emit('message', {
            name:nameInput.value,
            text: msgInput.value,
        })
        msgInput.value = ""
    }
    msgInput.focus()
}

function enterRoom(e){
    e.preventDefault();
    if(nameInput.value && chatRoom.value){
        socket.emit('enterRoom',{
            name: nameInput.value,
            room: chatRoom.value,
        })
    }
}


formMsg.addEventListener('submit',sendMessage)

formJoin.addEventListener('submit',enterRoom)

msgInput.addEventListener('keypress',()=>{
        socket.emit('activity', nameInput.value)
    })

    

//Listen for messages
socket.on('message',(data)=>{
    activity.textContent= "";
    const {name,text,time} = data;
    const li = document.createElement('li');
    li.className= 'post'
    if(name === nameInput.value){
        li.className = ' post post--left'
    }
    if(name !== nameInput.value && name !== 'Admin'){
        li.className= 'post post--right';
    }
    if(name !=='Admin'){
        li.innerHTML = `<div class="post__header 
        ${name === nameInput.value
            ? 'post__header--user'
            : 'post__header--reply'
        }">
        <span class="post__header--name">${name}</span>
        <span class="post__header--time">${time}</span>
        </div>
        <div class="post__text">${text}</div>`
    } else{
        li.innerHTML = `<div class="post__text">${text}</div>`
    }

    document.querySelector('.chat-display').appendChild(li);

    chatDisplay.scrollTop = chatDisplay.scrollHeight;
})



//timer for display typing
let activityTimer;
socket.on('activity',(name)=>{
    activity.textContent = `${name} is typing...`

    //clear after 4 seconds
    clearTimeout(activityTimer)
    activityTimer=setTimeout(()=>{
        activity.textContent= "";
    },4000)
})

socket.on('userList',({users})=>{
    showUsers(users)
})

socket.on('roomList',({rooms})=>{
    showRooms(rooms)
})

function showUsers(users){
    usersList.textContent='';
    if(users){
        usersList.innerHTML = `<em> Users in ${chatRoom.value}: </em>`
    }
    users.forEach((user,i) => {
        usersList.textContent += ` ${user.name}`;
        if(users.length > 1 && i !== users.length-1){
            usersList.textContent+= `,`;
        }       
    });
}

function showRooms(rooms){
    roomList.textContent='';
    if(rooms){
        roomList.innerHTML = `<em>Active rooms: </em>`
    }
    rooms.forEach((room,i) => {
        roomList.textContent += ` ${room}`;
        if(rooms.length > 1 && i !== rooms.length-1){
            roomList.textContent+= `,`;
        }       
    });
}

