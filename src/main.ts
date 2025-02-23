import kaplay, { AreaComp, BodyComp, GameObj, PosComp, SpriteComp } from "kaplay";
import "kaplay/global";

kaplay();

loadSound("boom", "sounds/boom.mp3");
loadRoot("./sprites/"); // A good idea for Itch.io publishing later
loadSprite("bean", "bean.png");
loadSprite("sock", "Sock.png");
loadSprite("greaser", "greaser.png");
loadSprite("rock", "rock_1.png");
loadSprite("staff", "staff-rotated.png");
loadSprite("bunny", "dust bunny.png");
loadSprite("water bullet", "water-bullet.png");
loadSprite("detergent", "detergent.png");


// set background
setBackground(105, 105, 105)

// Player things
const MELEE = "melee"; const RANGED = "ranged"; const MAGIC = "magic";
let coins = 0;
let health = 100;
const SPEED = 300;
class Weapon {
    name: string;
    damage: number;
    type: string;
    sprite: string
    constructor(name: string, damage: number, type: string, sprite: string) {
        this.name = name;
        this.damage = damage;
        this.type = type;
        this.sprite = sprite;
    }
}
class RangedWeapon extends Weapon {
    projectiles: number;
    projectileSprite: string;
    constructor(name: string, damage: number, sprite: string, projectiles: number, projectileSprite: string) {
        super(name, damage, RANGED, sprite);
        this.projectiles = projectiles;
        this.projectileSprite = projectileSprite;
    }
}

let inventory = [new RangedWeapon("Detergent", 5, "detergent",10,"water bullet"), new Weapon("Staff", 20, MELEE, "staff.png")]
let equipped = inventory[0]





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
        sprite("sock"), pos(300,300), area(), body(), "player", anchor("center"),
    ]);
    const greaser = add([
        pos(200,100), sprite("greaser"), area(), body(), "greaser"
    ])
    let weapon = add([
        sprite("staff"), pos(), area({scale:0.5}), body(), rotate(), "weapon", anchor("center"),
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
    /*
    Onclick handlers - deal with things here idk
     */
    onMousePress(() => {
        if (talking) {
            // do nothing, because you shouldn't be able to fight while talking
            return
        }
        if (equipped.type == MELEE) {
            tween(width() / 15, width() / 10, 1, (p) => weaponDistance = p, easings.easeOutBounce)
            wait(0.1, () => {
                tween(width() / 10, width() / 15, 1, (p) => weaponDistance = p, easings.easeOutBounce)
            })

        } else if (equipped instanceof RangedWeapon) {
            // do something with shooting projectiles idk
            let weaponAngle = weapon.pos.angle(player.pos)

            for (let i = 0; i < equipped.projectiles; i++) {
                let variation = randi(-30,30);
                const projectile = add([
                    sprite(equipped.projectileSprite),
                    pos(weapon.pos),
                    area(),
                    //body(),
                    move(weaponAngle + variation, 500),
                    rotate(variation),
                    "projectile",
                    {damage: equipped.damage}
                ])
                projectile.onCollide("enemy", (enemy) => {
                    enemy.health -= projectile.damage;
                    //debug.log('hit the enemy, dealing' + projectile.damage + ' which now has' + enemy.health + 'health!')
                    if (enemy.health <= 0) {
                        addKaboom(enemy.pos);
                        destroy(enemy);
                    }
                    destroy(projectile);
                });
                wait(0.33, () => {
                    destroy(projectile);
                })
            }
        } else if (equipped.type == MAGIC) {
            // do something with shooting magic idk
        } else {
            // this should never happen lol
        }
    })
    let weaponDistance = width() / 15
    // rotate the weapon to face mouse
    // why does adding player position to weapon position cause the player to move???
    weapon.onUpdate(() => {
        const a = mousePos().sub(center()); // mouse position relative to center
        const weaponAngle = Math.atan2(a.y, a.x)

        let weaponPos = vec2(
            weaponDistance * Math.cos(weaponAngle),
            weaponDistance * Math.sin(weaponAngle)
        )
        weapon.pos = vec2(player.pos).add(weaponPos)
        weapon.angle = (weaponAngle * 180) / Math.PI + 90
    })
    weapon.onCollide("enemy", (e) => {
        e.health -= equipped.damage
        if (e.health <= 0) {
            addKaboom(e.pos)
            destroy(e)
        }
    })

    /*
    * Deal with player movement and camera things
    * */
    onKeyDown("a", () => {
        if (talking) {return}
        player.move(-SPEED, 0);
    })
    onKeyDown("d", () => {
        if (talking) {return}
        player.move(SPEED, 0);
    })
    onKeyDown("w", () => {
        if (talking) {return}
        player.move(0, -SPEED);
    })
    onKeyDown("s", () => {
        if (talking) {return}
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