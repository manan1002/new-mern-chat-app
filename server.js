require('dotenv').config()
const express =require('express')
const app=express();
const userRoutes=require("./routes/userRoutes")
const User=require("./models/user")
const Message=require("./models/Message")
const rooms=['general','tech','finance','crypto']
const cors=require('cors');
// const rooms=['general','tech','finance','crypto'];
// const cors=require('cors');

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(cors());
app.use('/users',userRoutes);


require('./connection');
// let cors = require("cors");
app.use(cors());
const server =require('http').createServer(app);
const PORT=5001;
const io=require('socket.io')(server,{
    cors:{
        origin:'https://localhost:3000',
        methods:['GET','POST']
    }
})

async function fetLastMessageFromRoom(room)
{
    let roomMessages=await Message.aggregate([
        {$match:{to:room}},
        {$group:{_id:'$date',messageByDate:{$push:"$$ROOT"}}}
    ])
    return roomMessages;
}

function sortRoomMessagesByDate(messages){
    return messages.sort(function(a,b){
        let date1=a._id.split('/');
        let date2=b._id.split('/');

        date1=date1[2]+date1[0]+date1[1];
        date2=date2[2]+date2[0]+date2[1];
        return date1<date2?-1:1
    })
}

// socket
io.on('connection',(socket)=>{
    socket.on('new-user',async()=>{
        const members=await User.find();
        io.emit('new-user',members)
    })

    socket.on('join-room',async(newRoom,previousRoom)=>{
        socket.join(newRoom);
        socket.leave(previousRoom);
        let roomMessages =await getLastMessageFromRoom(newRoom);
        roomMessages=sortRoomMessagesByDate(roomMessages);
        socket.emit('room-messages',roomMessages)
    })

    socket.on('message-room',async(room,contentmsender,time,date)=>{
        const newMessage=await Message.create({content,from:sender,time,date,to:room});
        let roomMessages=await getLastMessageFromRoom(room);

        io.to(room).emit('room-message',roomMessages);
        socket.broadcast.emit('notification',room)

    })

    app.delete('/logout',async(req,res)=>{
        try{
            const{_id,newMessages}=req.body;
            const user=await User.findById(_id);
            user.status="offline";
            user.newMessages=newMessgaes;
            await user.save();
            const members =await User.find();
            socket.broadcast,emit('new-user',member);
            res.status(200).send();

        }
        catch(e){
            console.log(e);
            res.status(400).send()
        }
    })
})

// 

app.get('/rooms',(req,res)=>{
    res.json(rooms)
})