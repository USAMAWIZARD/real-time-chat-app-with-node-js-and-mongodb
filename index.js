
app=require("express");
var uname
require("ejs");
server=app();
var ser = server.listen(5000)
var io = require('socket.io').listen(ser);

session = require("express-session")({
  secret: "my-secret",
  resave: true,
  saveUninitialized: true
})

var cookieParser = require('cookie-parser')
server.use(cookieParser())
 
server.use(session);   //ses for managing users

sharedsession = require("express-socket.io-session");
io.use(sharedsession(session));

//Set View Engine To EJS
server.set("view engine", "ejs");
//Set Static Directory
server.use(app.static(__dirname));
const bodyParser= require('body-parser');
server.use(bodyParser.urlencoded({extended:true}))
const url = require('url');
const { render } = require("ejs");
const { exception } = require("console");
const { maxHeaderSize } = require("http");
server.use(bodyParser.json());
var socid
//mongodb
MongoClient = require('mongodb').MongoClient,
server.get('/about', function(req, res) {  res.render('hello');});

var urll = "mongodb://localhost:27017/";

io.on("connection",socket =>{
  //socket.emit("chat-messages","helloworld");


  socid=socket.id
  console.log("socket hai bhai",socket.handshake.session.uname)
  MongoClient.connect("mongodb://localhost:27017/users", function(err, db) {
    if(!err) {
      console.log("We are connected");
    }
    // ses=req.session;
    db.collection("userdetails").update({"username":socket.handshake.session.uname},{$set:{'sockid':socid}})

db.close()  

  });

 
socket.on("sendmsg",data=>{
  //can move this code in friend requsest and if field is not avaliabe he is not friend

  MongoClient.connect("mongodb://localhost:27017/users", function(err, db) {

      if (err) throw err;
      var dbo = db.db("users");        
      userwhichsending = socket.handshake.session.uname
      towhomesend=data["tosend"]
      //if user exist in his field then do nothing

      //if user does not exist in his field then update this
      socid=socket.id
      console.log("to send"+data["tosend"])
      dbo.collection("userdetails").find({"username":{$eq:data["tosend"]}},{ fields : {sockid:1,_id:0} }).toArray(function(err, result) {
        if (err) throw err;

        if(io.sockets.sockets[(result[0])["sockid"]]!=undefined){
        io.sockets.to((result[0])["sockid"]).emit("chat-messages",data["msg"])
        console.log((result[0])["sockid"])
        }
        

        dbo.collection("messages").update({"username":data["tosend"]},{$push:{ [socket.handshake.session.uname+'.oldmsgs'] :[data["msg"],Date.now()]}})
    dbo.close()
      }); 
   


  


    });

});  

});


server.post("/",(req,res)=>{
  console.log("fsdf",req.body.target)

  if(req.session.uname!=undefined){
    MongoClient.connect("mongodb://localhost:27017/users",function(err,db){
    var db =db.db("users")
    var uskemsg=[],meremsg=[]

    db.collection("messages").find({username:req.session.uname},{fields:{[req.body.target+'.oldmsgs']:1}}).toArray(function(err1,resuone){
      if(!err1)
      {
        try{ meremsg=resuone[0][req.body.target]["oldmsgs"]}catch(e){}
      }      else{}

    });
    db.collection("messages").find({username:req.body.target},{fields:{[req.session.uname+'.oldmsgs']:1}}).toArray(function(err,resutwo){
      if(!err){
        try{
          uskemsg=resutwo[0][req.session.uname]["oldmsgs"]
           }catch(exception){}
      }    
      console.log("uskemsg"+uskemsg)
      console.log("mere msg"+meremsg)

      res.render("chat.ejs",{"name":req.body.target,"meremsg":meremsg,"uskemsg":uskemsg});
    });
  

   
    

    

    });    

  }
  else
  res.redirect('/reg')

 
});



server.get("/reg/",(req,res)=>{
  res.render("index.ejs");
});



server.post("/signin/",(req,res)=>{
    
  MongoClient.connect("mongodb://localhost:27017/users", function(err, db) {
    if(!err) {
      console.log("We are connected");
    }
    var collection = db.collection('userdetails');
    MongoClient.connect(urll, function(err, db) {
      if (err) throw err; 
      var dbo = db.db("users");            

      dbo.collection("userdetails").find({"username":req.body.username,"password":req.body.password},{ fields : {_id:1} }).toArray(function(err, result) {
        if (err) throw err;
        console.log("unampe pass result"+result)
        if(result.length>=1){
          ses=req.session;
          ses.uname=req.body.username;
          console.log("loged in" + ses.uname)
          db.close();
        res.redirect("/mainscreen/")
        }
        else{
          //handle wrong input
          console.log("username or passwrod do not match")
        }
          

      
      });
  

    });

});
});

server.post("/register/",(req,res)=>{   


MongoClient.connect("mongodb://localhost:27017/users", function(err, db) {
        if(!err) {
          console.log("We are connected");
        }
        var collection = db.collection('messages');

        var enternewrecode ={'username':req.body.username }
        collection.insert(enternewrecode)
        db.close()  
   db.close()
        db.close()  
      });
  

MongoClient.connect("mongodb://localhost:27017/users", function(err, db) {
        if(!err) {
          console.log("We are connected");
        }
        var collection = db.collection('userdetails');
        var registerdetails ={'fname':req.body.fname,'lname':req.body.lname,'username':req.body.username,'phoneno':req.body.phoneno,'password':req.body.password,'online':true,"lastseen":"",sockid:""}
        console.log("db me insert hua")
        
        ses=req.session;
        uname=req.body.username
        ses.uname=req.body.username
        collection.insert(registerdetails)
        console.log(socid)
  
        db.collection("userdetails").update({"username":ses.uname},{$set:{'sockid':socid}})

   db.close()
   res.redirect("/mainscreen/")


      });
    });


server.get('/dis/',(req,res)=>{
  ses=req.session;
  console.log(ses.uname,req.cookies[ses.uname])

 
});

server.get('/mainscreen/',(req,res)=>{
  MongoClient.connect(urll, function(err, db) {
    if (err) throw err;
    var dbo = db.db("users");             //display all users to chat exept own
    //Find all documents in the customers collection:
    ses=req.session;
    if(ses.uname!=undefined){
    dbo.collection("userdetails").find({"username":{$ne:ses.uname}},{ fields : {username:1,online:1,lastseen:1,_id:0} }).toArray(function(err, result) {
      if (err) throw err;
      console.log(result);
      res.render("mainscreen.ejs",{'users':result});
      console.log('result')
      console.log(ses.uname)
      db.close();
    });
  }
  else{
    res.redirect('/reg')
  }
  });
});
