import kaplay from "kaplay";
// import "kaplay/global"; // uncomment if you want to use without the k. prefix

const k = kaplay();

k.loadRoot("./"); // A good idea for Itch.io publishing later
k.loadSprite("bean", "sprites/bean.png");
k.loadSprite("sock", "sprites/sock.png");
k.loadSound("boom", "sounds/boom.mp3");

const sockObj = k.add([k.pos(120, 80), k.sprite("sock")]);

const speed = 200;
let velocity = { x: 0, y: 0 };

window.addEventListener("keydown", (e) => {
  switch(e.key.toLowerCase()){
    case "w":
      velocity.y = -speed;
      break;
    case "s":
      velocity.y = speed;
      break;
    case "a":
      velocity.x = -speed;
      break;
    case "d":
      velocity.x = speed;
      break;
  }
});

window.addEventListener("keyup", (e) => {
  switch(e.key.toLowerCase()){
    case "w":
    case "s":
      velocity.y = 0;
      break;
    case "a":
    case "d":
      velocity.x = 0;
      break;
  }
});

let lastTime = performance.now();
function update() {
  const now = performance.now();
  const dt = (now - lastTime) / 1000;
  lastTime = now;
  
  sockObj.pos.x += velocity.x * dt;
  sockObj.pos.y += velocity.y * dt;
  
  requestAnimationFrame(update);
}
requestAnimationFrame(update);

k.onClick(() => {
  k.play("boom");
  k.addKaboom(k.mousePos());
});