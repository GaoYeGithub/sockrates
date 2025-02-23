import kaplay, { AreaComp, BodyComp, GameObj, PosComp, SpriteComp } from "kaplay";
import "kaplay/global";
//import {mousePos} from "kaplay/dist/declaration/gfx";


kaplay();

loadRoot("./"); // A good idea for Itch.io publishing later
loadSprite("bean", "sprites/bean.png");
loadSprite("sock", "sprites/Sock.png");
loadSprite("greaser", "sprites/greaser.png");
loadSprite("rock", "sprites/rock_1.png");
loadSprite("staff", "sprites/staff-rotated.png");
loadSprite("bunny", "sprites/dust bunny.png");
loadSound("boom", "sounds/boom.mp3");

// set background
setBackground(105, 105, 105)

// Player things

let coins = 0;
let health = 100;
let inventory = []

const SPEED = 200;


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
            //debug.log(currentDialogueIndex + " " + dialogues.length)
        } else {
            destroy(dialogueBox);
            destroy(speakerText);
            destroy(dialogueText);
            //debug.log("done talking!");
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
        pos(120, 80), sprite("sock"), area(), body(), "player", anchor("center"),
    ]);
    const greaser = add([
        pos(200,100), sprite("greaser"), area(), body(), "greaser"
    ])
    const weapon = add([
        rect(10,100), pos(player.pos), area(), rotate(), "weapon", color(rgb(128,93,93)), outline(2,BLACK), anchor("center"),
    ])
    onCollide("player", "greaser", () => {
        if (!interactions["Greaser"]) {
            showDialogue(player, shopDialoguePrimary)
            interactions["Greaser"] = true
        } else {
            showDialogue(player, shopDialogue);
        }
    })

    /*
    * HP related mechanics idk
    * */
    const healthText = add([
        text("Health: NaN"),
        pos(player.pos.sub(width() / 2 + 10, height() / 2 -+ 20)),
        color(WHITE),
        outline(2,BLACK)
    ])
    healthText.onUpdate(() => {
        healthText.pos = vec2(player.pos.sub(width() / 2 - 10, height() / 2 - 20))
        healthText.text = "Health: " + health
    })
    // combat stuff
    onCollide("player", "enemy", (p, e) => {
        health -= e.damage
        if (e.type == "dust bunny") {
            addKaboom(e.pos)
            destroy(e)
        }
    })
    let weaponDistance = width() / 25
    // rotate the sword to face mouse
    onUpdate("player", () => {
        let weaponPos = new Vec2()

        const a = mousePos().add(camPos()).sub(center());
        let weaponAngle = Math.atan2(a.y, a.x)// - Math.PI
        weaponPos.x = weaponDistance * Math.cos(weaponAngle) + player.pos.x
        weaponPos.y = weaponDistance * Math.sin(weaponAngle) + player.pos.y
        weapon.pos = weaponPos
        weapon.angle = ((weaponAngle) * 180 / Math.PI)
    })

    /*
    * Deal with player movement and camera things
    * */
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
    /*
    * Spawn in some trial objects
    * */
    for (let i = 0; i < 10; i++) {
        add([
            pos(randi(width()), randi(height())),
            sprite("rock"),
            area({scale:0.75}),
            body(),
        ])
        const bunny = add([
                sprite("bunny"),
                area(),
                body(),
                pos(player.pos.x + randi(-width()/4, width()/4), player.pos.y + randi(-height()/4, height()/4)),
                //pos(center()),
                "enemy",
            timer(),
                {damage: 10, health: 20, type: "dust bunny",}
                ])
        bunny.loop(rand(2,4), () => {
            // player.x player.y
            // 100 sin(
            let angle = bunny.pos.angleBetween(player.pos)
            bunny.tween(bunny.pos, vec2(100 * Math.cos(angle), 100 * Math.sin(angle)), 1, (p) => bunny.pos = p, easings.easeOutElastic)
        })


    }
})