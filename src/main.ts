import kaplay, { AreaComp, BodyComp, GameObj, PosComp, SpriteComp } from "kaplay";
import "kaplay/global";

kaplay();

loadRoot("./"); // A good idea for Itch.io publishing later
loadSprite("bean", "sprites/bean.png");
loadSprite("sock", "sprites/Sock.png");
loadSprite("greaser", "sprites/greaser.png");
loadSprite("rock", "sprites/rock_1.png");
loadSprite("bunny", "sprites/dust bunny.png");
loadSound("boom", "sounds/boom.mp3");

// set background
setBackground(105, 105, 105)


let interactions = {
    "Greaser": false,
}
const shopDialoguePrimary = [
    {speaker: "Greaser", text: "Hey, I'm walking here!"},
    {speaker: "Sockrates", text: "I'm sorry Greaser, I didn't see you there!"},
    {speaker: "Greaser", text: "Oy Sockrates, ya don't have make fun of my height every time you see me!"},
    {speaker: "Sockrates", text: "You know, it's been a long time since we last talked! What's new?"},
    {speaker: "Greaser", text: "I've made this new shop, and i'm selling all sort of amazing items here."},
]
const shopDialogue = [
    {speaker: "Greaser", text: "I have many great items, all for great prices!"}
]
// dialogue handling code yoinked from one of my other games lol
let talking = false

function spawnBunny(player) {
    return add([
        sprite("bunny"),
        area(),
        body(),
        pos(player.x + randi(-width()/2, width()/2), player.y + randi(-height()/2, height()/2))
    ])
}
function showDialogue(player: GameObj<PosComp | AreaComp | SpriteComp | BodyComp>, dialogues: { speaker: string; text: string }[], onComplete?: () => void) {
    if (talking) {return}

    let currentDialogueIndex = 0;
    talking = true
    const dialogueBox = add([
        rect(width() - 40, 100),
        // pos looks alright, but y pos isn't good
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
    const dialoguePosUpdater = dialogueBox.onUpdate(() => {
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
            debug.log(currentDialogueIndex + " " + dialogues.length)
        } else {
            destroy(dialogueBox);
            destroy(speakerText);
            destroy(dialogueText);
            debug.log("done talking!");
            talking = false;
            dialoguePosUpdater.cancel();
            advanceDialogueListener.cancel();
            if (onComplete) {
                onComplete();
            }
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
    ])
    const titleText = add([
        text("the saga of sockrates"),
        pos(center()),
        color(WHITE),
        "title"
    ])
    const sockrates = add([
        sprite("sock"),
        pos(center().add(100,100)),
        "title"
    ])
    onClick(() => {
        destroyAll("title")
        go("parking lot")
    })
})
go("title")
scene("parking lot", () => {
    const player = add([
        pos(120, 80), sprite("sock"), area(), body(), "player"
    ]);
    const greaser = add([
        pos(100,100), sprite("greaser"), area(), body(), "greaser"
    ])
    onCollide("player", "greaser", () => {
        if (!interactions["Greaser"]) {
            showDialogue(player, shopDialoguePrimary)
            interactions["Greaser"] = true
        } else {
            showDialogue(player, shopDialogue);
        }

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
    })
    for (let i = 0; i < 10; i++) {
        add([
            pos(randi(width()), randi(height())),
            sprite("rock"),
            area({scale:0.75}),
            body(),
        ])
    }
})