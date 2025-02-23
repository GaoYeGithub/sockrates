import kaplay, { AreaComp, BodyComp, GameObj, PosComp, SpriteComp } from "kaplay";
import "kaplay/global";

kaplay({
    width: 1080,
    height: 1080,
});

loadRoot("./");
loadSprite("bean", "sprites/bean.png");
loadSprite("sock", "sprites/Sock.png");
loadSprite("greaser", "sprites/greaser.png");
loadSprite("rock", "sprites/rock_1.png");
loadSprite("bunny", "sprites/dust bunny.png");
loadSprite("background", "sprites/temple-background.png");
loadSprite("door", "sprites/temple-door.png");
loadSound("boom", "sounds/boom.mp3");

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

let interactions = {
    "Greaser": false,
};
const shopDialoguePrimary = [
    {speaker: "Greaser", text: "Hey, I'm walking here!"},
    {speaker: "Sockrates", text: "I'm sorry Greaser, I didn't see you there!"},
    {speaker: "Greaser", text: "Oy Sockrates, ya don't have make fun of my height every time you see me!"},
    {speaker: "Sockrates", text: "You know, it's been a long time since we last talked! What's new?"},
    {speaker: "Greaser", text: "I've made this new shop, and i'm selling all sort of amazing items here."},
];
const shopDialogue = [
    {speaker: "Greaser", text: "I have many great items, all for great prices!"}
];
let talking = false;

function spawnBunny(player: GameObj) {
    return add([
        sprite("bunny"),
        area(),
        body(),
        pos(player.x + randi(-width()/2, width()/2), player.y + randi(-height()/2, height()/2))
    ]);
}

function showDialogue(player: GameObj<PosComp | AreaComp | SpriteComp | BodyComp>, dialogues: { speaker: string; text: string }[], onComplete?: () => void) {
    if (talking) return;

    let currentDialogueIndex = 0;
    talking = true;
    const dialogueBox = add([
        rect(width() - 40, 100),
        pos(20, height() - 120),
        outline(2),
        color(0, 0, 0),
        opacity(0.8),
        z(3),
        area(),
        fixed(),
        "dialogueBox"
    ]);

    const speakerText = add([
        text("", { size: 16, width: width() - 60 }),
        pos(30, height() - 100),
        color(255, 255, 255),
        z(3),
        fixed(),
        "speakerText"
    ]);

    const dialogueText = add([
        text("", { size: 20, width: width() - 60 }),
        pos(30, height() - 80),
        color(255, 255, 255),
        z(3),
        fixed(),
        "dialogueText"
    ]);

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
            talking = false;
            advanceDialogueListener.cancel();
            if (onComplete) onComplete();
        }
    });

    updateDialogue();
}

scene("title", () => {
    const background = add([
        rect(width(), height()),
        pos(0,0),
        color(BLACK),
        "title"
    ]);
    const titleText = add([
        text("the saga of sockrates"),
        pos(center()),
        color(WHITE),
        "title"
    ]);
    const sockrates = add([
        sprite("sock"),
        pos(center().add(100,100)),
        "title"
    ]);
    onClick(() => {
        destroyAll("title");
        go("parking lot");
    });
});

scene("parking lot", () => {
    add([
        sprite("background"),
        pos(0, 0),
        area(),
        body({ isStatic: true }),
        anchor("topleft"),
    ]);

    const doorPositions = [
        [100, 550],
        [100, 280],
        [470, 50],
        [900, 280],
        [900, 550]
    ];

    doorPositions.forEach((position, index) => {
        add([
            sprite("door"),
            pos(position[0], position[1]),
            anchor("center"),
            area(),
            "door",
            { doorId: index + 1 }
        ]);
    });

    const player = add([
        sprite("sock"),
        pos(width() / 2, height() / 2),
        area(),
        "player"
    ]);

    const SPEED = 600;
    let direction = vec2(0, 0);
    
    onUpdate(() => {
        direction = vec2(0, 0);
        
        if (isKeyDown("left") || isKeyDown("a")) direction.x -= 1;
        if (isKeyDown("right") || isKeyDown("d")) direction.x += 1;
        if (isKeyDown("up") || isKeyDown("w")) direction.y -= 1;
        if (isKeyDown("down") || isKeyDown("s")) direction.y += 1;
        
        if (direction.len() > 0) {
            direction = direction.unit();
            player.pos = player.pos.add(direction.scale(SPEED * dt()));
        }

        player.pos.x = clamp(player.pos.x, 0, width());
        player.pos.y = clamp(player.pos.y, 0, height());
        
        camPos(player.pos.lerp(camPos(), 0.9));
    });

    const greaser = add([
        pos(100,100), sprite("greaser"), area(), body(), "greaser"
    ]);
    
    onCollide("player", "greaser", () => {
        if (!interactions["Greaser"]) {
            showDialogue(player, shopDialoguePrimary);
            interactions["Greaser"] = true;
        } else {
            showDialogue(player, shopDialogue);
        }
    });

    player.onUpdate(() => {
        player.pos.x = clamp(player.pos.x, 0, width());
        player.pos.y = clamp(player.pos.y, 0, height());
    });

    for (let i = 0; i < 10; i++) {
        add([
            pos(randi(width()), randi(height())),
            sprite("rock"),
            area({ scale: 0.75 }),
            body(),
        ]);
    }

    onCollide("player", "door", (door) => {
        debug.log(`Interacted with door ${door.doorId}`);
        shake(5);
    });
});

go("title");