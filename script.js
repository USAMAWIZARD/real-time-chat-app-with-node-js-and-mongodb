var socket = io.connect('http://localhost:3000');

sendmsg=document.getElementById("msg");
socket.on('chat-messages',data=>{
    console.log(data)
    document.getElementById("allmessages").innerHTML+='<div class="d-flex justify-content-start mb-4"><div class="msg_cotainer_send">'+data+'<span class="msg_time_send">9:05 AM, Today</span></div><div class="img_cont_msg"><img src="https://static.turbosquid.com/Preview/001292/481/WV/_D.jpg"class="rounded-circle user_img_msg"></div></div>'



});

  
document.getElementById("subbtn").addEventListener("click", function(event){
    event.preventDefault();
    tosend=document.getElementById("tosend").value;
    //console.log("tosend",tosend)
    var msg= document.getElementById("msg").value;
    document.getElementById("allmessages").innerHTML+='<div class="d-flex justify-content-end mb-4"><div class="msg_cotainer_send">'+msg+'<span class="msg_time_send">9:05 AM, Today</span></div><div class="img_cont_msg"><img src="https://static.turbosquid.com/Preview/001292/481/WV/_D.jpg"class="rounded-circle user_img_msg"></div></div>'

    var send ={
        "msg":msg,
        "tosend":tosend
    } 
    socket.emit('sendmsg',send)
    //console.log("aage aaya")


  });


