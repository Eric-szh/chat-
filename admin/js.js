//客服端
var socket = io();

var User = [];

var list = [];//联系人列表

var prosMsg = function(msg){
  var tag = '<div class="d-flex flex-row">';
  var newMsg = tag + msg + '</div>';
  return newMsg//排列用的
}

var Scroll = function(){
  var element = document.getElementById("disWindow");
  var scrollHeight = element.scrollHeight;
  $('#disWindow').scrollTop(scrollHeight);
};


var hasExisted = function(string){
  for (var i = 0; i < User.length; i++) {
    if(User[i].name == string){ //检查User大列表里是否有匹配的名字
      return User[i];
    }
  }
  return false;
}

var hasOn = function(string){
  for (var i = 0; i < list.length; i++) {
    if(list[i] == string)
      return true;
  }
  return false;
} 

var addMessage = function(name,msg){
  var objInserted = hasExisted(name)
  objInserted.messages.unshift(msg);
}

var again = function(){
  $('.contacts').click(function(){
    $(this).addClass("active");//自己高亮
    $(this).siblings().removeClass("active");//别的不亮
    $('#disWindow').empty();
    var name = $(this).attr('name');
    var arr = hasExisted(name).messages;
    for (var i = 0; i < arr.length; i++) {
      $('#disWindow').prepend(prosMsg(arr[i]));//用预存的数据一个一个塞满
    $(this).children().empty();//把标识清空
    }
    $('#header').text(name);
    Scroll();
  })  
}

$(document).ready(function(){
  again();
  $('#send').click(function(){//点按钮时//发送按钮
    var message = $('#input').val();
    var name = $('.active').attr('name');//以后要加一个判定是否点选任何用户
    var sid = hasExisted(name).sid;
    socket.emit('backMessage', message, name, sid);
    $('#input').val('');//发送消息
    var tag = '<div class = "card message text-white bg-primary">';
    var msg = tag + message + '</div>'  
      $('#disWindow').append(prosMsg(msg));//将之添加进窗口
    addMessage(name,msg);//放在聊天记录里
    Scroll();
  });
});

window.onload = function(){ 
  socket.emit('adminLogin');
}

socket.on('initialization', function(array){
  User = array;//启动获得用户名单
  for (var i = 0; i < User.length; i++) {
    name = User[i].name
    var tagf = '<a href="#" class="list-group-item list-group-item-action rounded-0 contacts" name="';
    var person = tagf + name + '">' + name + ' <span class="badge badge-primary"></span></a>';
    $('#list').prepend(person);
    list.unshift(name);
  }
  again();
});

socket.on('newUser', function(obj){
  User.unshift(obj);//新用户添加
});

socket.on('idChange', function(name,nsid){//当用户刷新窗口时
  if(hasExisted(name)){
    hasExisted(name).sid = nsid;//更新他的sid
  }
});

socket.on('toMessage', function(msg, name){//收到消息时
  if (!(hasOn(name))) {//如果联系人列表里没有这人
  	var tagf = '<a href="#" class="list-group-item list-group-item-action rounded-0 contacts" name="'
    var person = tagf + name + '">' + name + ' <span class="badge badge-primary">1</span></a>';
    $('#list').prepend(person);
  	// var name = new CreateUser(obj.name,obj.sid,msg);
  	list.unshift(name);
    again();//创建一个新的塞进去
    addMessage(name,msg);
  }else{
    //如果有
  	addMessage(name,msg);//在联系人对象的message列表里把聊天记录塞进去
    var selector = '*[name="' + name + '"]';
    if($(selector).hasClass("active")){//如果目前高亮的联系人是此人
      $('#disWindow').append(prosMsg(msg));//在聊天窗口里把聊天记录塞进去
      Scroll();
    }else{
      var numbers = $(selector).children().text();//加上标识符
      if (isNaN(numbers)) {
        $(selector).children().text(1);//没有变成一
      }else{
        numbers = Number(numbers) + 1;
        $(selector).children().text(numbers);//有的话加一
      }
    };
    $(selector).clone(true).prependTo($('#list'));
    $(selector).last().remove();//把这个人顶到第一个
    
    

  }

});



