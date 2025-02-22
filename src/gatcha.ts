import kaplay from "kaplay";
import "kaplay/global";

kaplay();

loadSprite("evil", "sprites/evil.png");
loadSprite("rocky", "sprites/rocky.png");
loadSprite("sad", "sprites/sad.png");
loadSprite("gatcha", "sprites/gatcha.png", {
  sliceX: 5,
  sliceY: 1,
});

const STATES = {
  MAIN: "main",
  SPINNING: "spinning",
  RESULT: "result"
};

let currentState = STATES.MAIN;
let currentFrame = 0;
let spinTimer = 0;
let spinDuration = 0;
let resultSprite = null;
let selectedCharacter = "";

scene("game", () => {
  const gachaDisplay = add([
    sprite("gatcha", { frame: 0 }),
    pos(width() / 2, height() / 2),
    anchor("center"),
  ]);

  const FRAME_TIME = 0.1;
  let frameTimer = 0;

  onKeyPress("s", () => {
    if (currentState === STATES.MAIN) {
      currentState = STATES.SPINNING;
      spinDuration = rand(2, 4);
      spinTimer = 0;
      if (resultSprite) destroy(resultSprite);
    }
  });

  onClick(() => {
    if (currentState === STATES.RESULT) {
      currentState = STATES.MAIN;
      if (resultSprite) {
        destroy(resultSprite);
        resultSprite = null;
      }
    }
  });

  onUpdate(() => {
    switch (currentState) {
      case STATES.SPINNING:
        frameTimer += dt();
        if (frameTimer >= FRAME_TIME) {
          frameTimer = 0;
          currentFrame = (currentFrame + 1) % 5;
          gachaDisplay.frame = currentFrame;
        }

        spinTimer += dt();
        if (spinTimer >= spinDuration) {
          currentState = STATES.RESULT;
          const finalFrame = randi(0, 4);
          gachaDisplay.frame = finalFrame;

          const spriteMap = ["sock", "sock", "evil", "rocky", "sad"];
          selectedCharacter = spriteMap[finalFrame];

          if (selectedCharacter !== "sock") {
            resultSprite = add([
              sprite(selectedCharacter),
              pos(width() / 2, height() / 2),
              anchor("center"),
              scale(0.1),
            ]);
          }
        }
        break;

      case STATES.RESULT:
        if (resultSprite) {
          const targetScale = 1;
          const scaleSpeed = 2;
          const currentScale = resultSprite.scale.x;
          
          if (currentScale < targetScale) {
            const newScale = Math.min(currentScale + scaleSpeed * dt(), targetScale);
            resultSprite.scale = vec2(newScale);
          }
        }
        break;
    }
  });
});

go("game");
