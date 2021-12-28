
window.addEventListener("gamepadconnected", function(e) {
  console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
    e.gamepad.index, e.gamepad.id,
    e.gamepad.buttons.length, e.gamepad.axes.length);
});

window.addEventListener("gamepaddisconnected", function(e) {
  console.log("Gamepad disconnected from index %d: %s",
    e.gamepad.index, e.gamepad.id);
});

/*
 * Gamepad API Test
 * Written in 2013 by Ted Mielczarek <ted@mielczarek.org>
 *
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 *
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */
var haveEvents = 'GamepadEvent' in window;
var haveWebkitEvents = 'WebKitGamepadEvent' in window;
var controllers = {};
var rAF = window["mozRequestAnimationFrame"] ||
  window["webkitRequestAnimationFrame"] ||
  window.requestAnimationFrame;

function connecthandler(e) {
  addgamepad(e.gamepad);
}

function addgamepad(gamepad) {
  if(gamepad.id.indexOf("360") === -1){ //temporarily hide 360 controllers
    controllers[gamepad.index] = gamepad; var d = document.createElement("div");
    d.setAttribute("id", "controller" + gamepad.index);
    var t = document.createElement("h1");
    t.appendChild(document.createTextNode("gamepad: " + gamepad.id));
    d.appendChild(t);
    var b = document.createElement("div");
    b.className = "buttons";
    for (var i=0; i<gamepad.buttons.length; i++) {
      var e = document.createElement("span");
      e.className = "button";
      //e.id = "b" + i;
      e.innerHTML = i + " ";
      b.appendChild(e);
    }
    d.appendChild(b);
    var a = document.createElement("div");
    a.className = "axes";
    for (i=0; i<gamepad.axes.length; i++) {
      e = document.createElement("meter");
      e.className = "axis";
      //e.id = "a" + i;
      e.setAttribute("min", "-1");
      e.setAttribute("max", "1");
      e.setAttribute("value", "0");
      e.innerHTML = i + " ";
      a.appendChild(e);
    }
    d.appendChild(a);
    d.style.position = "absolute";
  }
  // var start = document.getElementById("start");

  // start.style.display = "none";
  document.body.appendChild(d);
  rAF(updateStatus);
}

function disconnecthandler(e) {
  removegamepad(e.gamepad);
}

function removegamepad(gamepad) {
  var d = document.getElementById("controller" + gamepad.index);
  document.body.removeChild(d);
  delete controllers[gamepad.index];
}

var globalStick = [];

function updateStatus() {
  scangamepads();

    const stick = [];

  for (var j in controllers) {
    var controller = controllers[j];
    var d = document.getElementById("controller" + j);
    var buttons = {};

    if(d != null || d != undefined){
      buttons = d.getElementsByClassName("button");
    }

    for (var i=0; i<controller.buttons.length; i++) {
      var b = buttons[i];
      var val = controller.buttons[i];
      var pressed = val == 1.0;
      var touched = false;
      if (typeof(val) == "object") {
        pressed = val.pressed;
        if ('touched' in val) {
          touched = val.touched;
        }
        val = val.value;
      }
      var pct = Math.round(val * 100) + "%";
      b.style.backgroundSize = pct + " " + pct;
      b.className = "button";
      if (pressed) {
        b.className += " pressed";
      }
      if (touched) {
        b.className += " touched";
      }
    }

    var axes = {};

    if(d != null || d != undefined){
      axes = d.getElementsByClassName("axis");
    }

    for (var i=0; i<controller.axes.length; i++) { 
      var a = axes[i];

      stick.push(controller.axes[i]);

      a.innerHTML = i + ": " + controller.axes[i].toFixed(4);
      a.setAttribute("value", controller.axes[i]);
    }
  }

  globalStick = stick;
  
  rAF(updateStatus);
}

function getGlobalaStick(){
  return globalStick;
}

interface Navigator {
  webkitGetGamepads: any
}

function scangamepads() {
  var gamepads = navigator.getGamepads ? navigator.getGamepads() : ((navigator as any).webkitGetGamepads ? (navigator as any).webkitGetGamepads() : []);
  for (var i = 0; i < gamepads.length; i++) {
    if (gamepads[i] && (gamepads[i].index in controllers)) {
      controllers[gamepads[i].index] = gamepads[i];
    }
  }
}

if (haveEvents) {
  window.addEventListener("gamepadconnected", connecthandler);
  window.addEventListener("gamepaddisconnected", disconnecthandler);
} else if (haveWebkitEvents) {
  window.addEventListener("webkitgamepadconnected", connecthandler);
  window.addEventListener("webkitgamepaddisconnected", disconnecthandler);
} else {
  setInterval(scangamepads, 500);
} 

export {
  updateStatus,
  getGlobalaStick
}