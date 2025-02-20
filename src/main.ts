import kaplay from "kaplay";
import "kaplay/global"; // uncomment if you want to use without the  prefix

kaplay();

loadRoot("./"); // A good idea for Itch.io publishing later
loadSprite("bean", "sprites/bean.png");
loadSprite("sock", "sprites/Sock.png");
loadSound("boom", "sounds/boom.mp3");

const player = add([
    pos(120, 80), sprite("sock"), area(), body(), "player"
]);

const SPEED = 200;
onKeyDown("left", () => {
  player.move(-SPEED, 0);
})
onKeyDown("right", () => {
  player.move(SPEED, 0);
})
onKeyDown("up", () => {
  player.move(0, -SPEED);
})
onKeyDown("down", () => {
  player.move(0, SPEED);
})


/*
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
*/
onClick(() => {
  play("boom");
  addKaboom(mousePos());
});