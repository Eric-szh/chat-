//客户端
var socket = io();
var mySelf = {};//保存自己的信息

window.onload = function(){ 
  socket.emit('userOn');//跟服务器喊一声我来了
}

function html2Escape(sHtml) {
 return sHtml.replace(/[<>&"]/g,function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c];});
}//html字符转义

var Scroll = function(){
  var element = document.getElementById("disWindow");
  var scrollHeight = element.scrollHeight;
  $('#disWindow').scrollTop(scrollHeight);
};//讲滚动条放到最底端

$(document).ready(function(){////////////////////////////////////////////////////////////////////
var placeholder = "在这里写下你的话吧";//占位符

$('#send').click(function(){
  var message = $("#text").text();//当按钮按下时
  console.log(message);
  if (!(message == '在这里写下你的话吧' || message == '')) {
    message = html2Escape(message);//转义
    socket.emit('toMessage', message, mySelf.name);
    var tag = '<div class = "card message ">';
    msg = tag + message + '</div>';
    $('#Modal').modal('hide');//隐藏
    $('#disWindow').append(prosMsg(msg));//添加
    Scroll();
  }
});

$('#Modal').on('shown.bs.modal', function () {
  var height = $('#modal-body').height();
  $('#text').css('height', height);//确定聊天框尺寸

});

$('#Modal').on('hide.bs.modal', function () {
   $('#text').text('在这里写下你的话吧');//占位符
});

$("#text").focus(function() {//占位符
    if ($(this).text() == placeholder) {
        $(this).text("");
    }
    var height2 = $('#modal-content').height();
    console.log(height2);
    $('#modal-content').css('height', height2);
}).focusout(function() {
    if (!$(this).text().length) {
        $(this).text(placeholder);
    }
});

$('body').height($('body')[0].clientHeight);

});
 

var prosMsg = function(msg){
  var tag = '<div class="d-flex flex-row">';
  var newMsg = tag + msg + '</div>';
  return newMsg//排列用的
}

var login = function () {
	var nickname = $("#nickname").val();
	if (nickname === ""){
            return false;//登录时
        }
    socket.emit("login",nickname);
} 

socket.on('initializationUser', function(list){
  for (var i = 0; i < list.length; i++) {
    $('#disWindow').prepend(prosMsg(list[i]));
  }
  Scroll();//导入聊天记录
});

socket.on('nameExisted', function(){
	$('#tips').html('用户名已经存在');
});

socket.on('backMessage', function(msg){
  $('#disWindow').append(prosMsg(msg));
  Scroll();//收到记录
});

socket.on('loginSuccess',function(obj){
  mySelf = obj;
  $('#nameGreet').html('你好！' + mySelf.name);
  $("#layer").hide();
  $("#login").hide();
  $("#register").css('z-index',-1);
})//登录成功后不显示

socket.on('pleaseLogin',function(){
  $("#layer").show();
  $("#login").show();
  $("#register").css('z-index',2);
})//未登录显示

  

