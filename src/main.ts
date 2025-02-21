import kaplay from "kaplay";
import "kaplay/global";
kaplay();

loadRoot("./");
loadSprite("bean", "sprites/bean.png");
loadSprite("sock", "sprites/Sock-Sheet.png", {
    sliceX: 6,
    sliceY: 1,
});
loadSprite("water-bullet", "sprites/water-bullet.png");
loadSprite("greaser", "sprites/greaser.png");
loadSprite("rock", "sprites/rock_1.png");
loadSound("boom", "sounds/boom.mp3");

// set background
setBackground(105,105,105)

// dialogue handling code yoinked from one of my other games lol
const shopDialogue = [
  {speaker: "Greaser", text: "Hey, I'm walking here!"},
]
let talking = false
function showDialogue(dialogues: { speaker: string; text: string }[], onComplete?: () => void) {
  if (talking) {return}
  //debug.log("here!");
  let currentDialogueIndex = 0;
  talking = true
  const dialogueBox = add([
      rect(width() - 40, 100),
      // pos looks alright, but y pos isnt good
      pos(player.pos.x - (width() / 2), player.pos.y + (height() / 2) - 120),
      outline(2),
      color(0, 0, 0),
      opacity(0.8),
      z(3),
      area(),
      "dialogueBox"
  ]);

  const speakerText = add([
      text("", { size: 16, width: width() - 60 }),
      pos(player.pos.x - (width() / 2) + 10, player.pos.y + (height() / 2)),
      color(255, 255, 255),
      z(3),
      "speakerText"
  ]);

  const dialogueText = add([
      text("", { size: 20, width: width() - 60 }),
      pos(player.pos.x - (width() / 2) + 10, player.pos.y + (height() / 2)),
      color(255, 255, 255),
      z(3),
      "dialogueText"
  ]);

  // make sure to update this here!
  const dialougePosUpdater = dialogueBox.onUpdate(() => {
      dialogueBox.pos.x = (player.pos.x - (width() / 2));
      dialogueBox.pos.y = player.pos.y + (height() / 2) - 120;

      speakerText.pos.x = player.pos.x - (width() / 2) + 10
      speakerText.pos.y = player.pos.y + (height() / 2) - 100

      dialogueText.pos.x = player.pos.x - (width() / 2) + 10
      dialogueText.pos.y = player.pos.y + (height() / 2) - 80
  })
  function updateDialogue() {
      const currentDialogue = dialogues[currentDialogueIndex];
      speakerText.text = currentDialogue.speaker;
      dialogueText.text = currentDialogue.text;
  }

  const advanceDialogueListener = onKeyPress("space", () => {
      currentDialogueIndex++;
      if (currentDialogueIndex < dialogues.length) {
          updateDialogue();
      } else {
          destroy(dialogueBox);
          destroy(speakerText);
          destroy(dialogueText);
          if (onComplete) {
              advanceDialogueListener.cancel();
              dialougePosUpdater.cancel();
              talking = false;
              onComplete();
          }
      }
  });

  updateDialogue();
}


const player = add([
    pos(120, 80),
    sprite("sock", { frame: 5 }),
    area(),
    body(),
    "player",
    { 
        waterLevel: 5,
        shootCooldown: 0,
    },
]);
const greaser = add([
  pos(100,100), sprite("greaser"), area(), body(), "greaser"
])
onCollide("player", "greaser", () => {
  //debug.log("bonk!");
  showDialogue(shopDialogue)
})

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

player.onUpdate(() => {
  camPos(player.pos);
  if (player.shootCooldown > 0) {
    player.shootCooldown -= dt();
  }
})
for (let i = 0; i < 10; i++) {
  add([
      pos(randi(width()), randi(height())),
      sprite("rock"),
      area({scale:0.75}),
      body(),
  ])
}
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
    if (player.waterLevel <= 0 || player.shootCooldown > 0) return;
    
    play("boom");
    
    const direction = mousePos().sub(player.pos).unit();
    
    const bullet = add([
        sprite("water-bullet"),
        pos(player.pos.add(direction.scale(20))),
        area(),
        rotate(direction.angle()),
        move(direction, 500),
        lifespan(2),
        "bullet",
    ]);

    const spread = 0.1;
    bullet.angle += rand(-spread, spread);
    
    player.waterLevel--;
    player.frame = player.waterLevel;
    
    player.shootCooldown = 0.2;
});

onCollide("bullet", "rock", (bullet, rock) => {
    destroy(bullet);
});