//服务端
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var cookieParser = require('cookie-parser');//处理cookie的
var MongoClient = require('mongodb');
var url = 'mongodb://localhost:27017/User';
var User = []; //用于储存所有的人，[{},{},{}]
var admin = {};//用于储存管理员
var data = {_id: 7 , 'User' : User};//7 233


MongoClient.connect(url, function(error, database){//开始时向服务器获取User
  selectData(database.db('User'),function(result){
      console.log(result[0].User);
    User = result[0].User;
  })
})

app.use(cookieParser());
app.use(function(req, res, next){
  if(!req.cookies.identifier){//给用户塞cookie
    res.cookie('identifier', Math.random(), {maxAge: 1000 * 60 * 60 * 24 * 7});
    res.send("<script type='text/javascript'>location.reload()</script>")//塞完以后重新加载一下
  }
  else{//然后不加载其他的网页了
    next();
  }
});
app.use('/', express.static(__dirname));


var hasExisted = function(string){
  for (var i = 0; i < User.length; i++) {
    if(User[i].name == string){ //检查User大列表里是否有匹配的名字
      return User[i];
    }
  }
}

var insertDocuments = function(db,data,callback){
  var collection = db.collection('User');
  collection.updateOne({_id : 7},{ $set: { 'User' : User } },data,function(error, result){
      if (error) return process.exit(1);//用于更新User
      callback(result);
    }
  );
};

var selectData = function(db, callback) {//用于获取User
  //连接到表  
  var collection = db.collection('User');
  //查询数据
  collection.find({}).toArray(function(err, result) {
    if(err)
    {
      console.log('Error:'+ err);
      return;
    }     
    callback(result);
  });
}

var hasRegisterd = function(string){
  for (var i = 0; i < User.length; i++) {
    if(User[i].id == string){//检查User大列表里是否有匹配的名字
      return User[i];//有则返回这个用户的对象
    }
  }
}

var proc = function (str) {//cookie转json
    var parts = str.split("; ");
    for (var i = 0; i < parts.length;i++){
        var container = parts[i].split("=");
        for (var o = 0; o < container.length; o++) {
            container[o] = '"' + container[o] + '"' ;
        }
        parts[i] = container.join(" : ");
    }
    var output = "{" + parts.join(" , ") + "}";
    output = JSON.parse(output);
    return output;
};

var CreateUser = function(sid,id,name){
    this.sid = sid;
    this.id = id;
    this.name = name;
    this.messages = [];
}; //创建用户

io.on('connection', function(socket){
  //当链接时
  var cookie_str = socket.request.headers.cookie;
  var cookie = proc(cookie_str);//找到他的cookie
  

  socket.on('userOn',function(){
    console.log('a user connected ');
    if(hasRegisterd(cookie.identifier)){//如果注册过
      var obj = hasRegisterd(cookie.identifier);
      obj.sid = socket.id;
      socket.emit('loginSuccess', obj);//使登陆页面消失
      socket.broadcast.to(admin.sid).emit('idChange', obj.name, obj.sid);
      console.log("idChange "+ obj.name+ " "+obj.sid);//跟客服讲一下新的sid
      socket.emit('initializationUser',obj.messages);
    }else{
      socket.emit('pleaseLogin')
    }
  })

  socket.on('adminLogin',function(){
    admin.sid = socket.id;
    socket.emit('initialization' , User);//把User列表推送给他
    console.log('adminLogin');
  })

  socket.on('login',function(name){//登录时
    if (hasExisted(name)) {//如果名字重复
      console.log('nameExisted' + name);//让他改一下
      socket.emit('nameExisted');
    }else{
      console.log('name: ' + name);
      var name = new CreateUser(socket.id,cookie.identifier,name);//否则创建一个该用户的对象
      User.unshift(name);//并将之放进User里
      socket.emit('loginSuccess', name);
      socket.broadcast.to(admin.sid).emit('newUser', name);//并将之分发给客服
    }
  });

  

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  
  socket.on('toMessage', function(msg, name){
    var objInserted = hasExisted(name);
    console.log('toMessage: ' + msg + name);
    console.log(objInserted);
    var tag = '<div class = "card message">'
    msg = tag + msg + '</div>'
    socket.broadcast.to(admin.sid).emit('toMessage', msg , name);
    objInserted.messages.unshift(msg);
  });

  socket.on('backMessage',function(msg, name, id){
    console.log('backMessage: ' + msg + " " + id);
    var tag = '<div class = "card message text-white bg-primary">'
    msg = tag + msg + '</div>'
    socket.broadcast.to(id).emit('backMessage', msg);
    var objInserted = hasExisted(name)
    objInserted.messages.unshift(msg);
  });
});

var times = 0; //按两下退出
process.on('SIGINT',function(){
    console.log("退出");
    while(times == 1){
      process.exit(0);
    }
    console.log(User);
    MongoClient.connect(url, function(error, database){
      if (error) {
        process.exit(1);
      } 
    console.log('记录已保存，按control+c退出');
    insertDocuments(database.db('User'),data,function(result){
    });
    });
    times = times + 1;
    
});

process.on('exit',function(code){
  console.log(code + ' exit');
})

http.listen(3000, function(){
  console.log('listening on *:3000');
});

