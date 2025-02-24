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
loadSprite("boss", "boss-monster.png");

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

class Boss {
    obj: GameObj;
    healthBar: GameObj;
    healthBarLabel: GameObj;
    currentHealth: number;
    maxHealth: number = 1000;
    attackTimer: number = 0;
    currentPattern: number = 0;
    isAttacking: boolean = false;
    destroyed: boolean = false;

    constructor(position: { x: number, y: number }) {
        try {
            this.currentHealth = this.maxHealth;
            this.obj = add([
                sprite("boss"),
                pos(position.x, position.y),
                area({ width: 32, height: 32 }),
                body({ isStatic: true }),
                anchor("center"),
                scale(2),
                "enemy",
                "boss",
                {
                    damage: 20,
                    health: this.maxHealth,
                    type: "boss",
                    destroy: () => this.destroyBoss()
                }
            ]);

            add([
                rect(width() - 40, 30),
                pos(20, 20),
                color(0, 0, 0),
                fixed(),
                outline(2),
                z(100),
                "healthBarBg"
            ]);

            this.healthBar = add([
                rect(width() - 40, 30),
                pos(20, 20),
                color(RED),
                fixed(),
                z(101)
            ]);

            this.healthBarLabel = add([
                text("Sage of Mind Soractes", {
                    size: 24,
                    font: "arial",
                }),
                pos(width() / 2, 35),
                anchor("center"),
                color(WHITE),
                fixed(),
                z(102)
            ]);

            this.setupBehavior();
        } catch (error) {
            console.error("Error creating boss:", error);
        }
    }

    private destroyBoss() {
        if (this.destroyed) return;
        this.destroyed = true;
        
        try {
            const healthBarBg = get("healthBarBg")[0];
            if (healthBarBg) destroy(healthBarBg);
            
            if (this.healthBar) destroy(this.healthBar);
            if (this.healthBarLabel) destroy(this.healthBarLabel);
            if (this.obj) destroy(this.obj);
        } catch (error) {
            console.error("Error destroying boss:", error);
        }
    }

    private setupBehavior() {
        this.healthBar.onUpdate(() => {
            if (this.destroyed) return;
            const healthPercent = this.obj.health / this.maxHealth;
            this.healthBar.width = (width() - 40) * healthPercent;
        });

        this.obj.onUpdate(() => {
            if (this.destroyed || this.isAttacking) return;

            const player = get("player")[0];
            if (!player) return;

            const angle = Math.atan2(
                player.pos.y - this.obj.pos.y,
                player.pos.x - this.obj.pos.x
            );
            this.obj.move(Math.cos(angle) * 100, Math.sin(angle) * 100);

            this.attackTimer += dt();
            if (this.attackTimer >= 3) {
                this.attackTimer = 0;
                this.currentPattern = randi(0, 2);
                this.executePattern(player);
            }
        });
    }

    private executePattern(player: GameObj) {
        switch (this.currentPattern) {
            case 0:
                this.spreadAttack();
                break;
            case 1:
                this.bigRockAttack(player);
                break;
            case 2:
                this.retreat(player);
                break;
        }
    }

    private spreadAttack() {
        this.isAttacking = true;
        let duration = 0;
        const attackInterval = setInterval(() => {
            for (let i = 0; i < 8; i++) {
                const angle = (i * 45) * (Math.PI / 180);
                this.shootRock(angle, 600);
            }
            duration += 0.5;
            if (duration >= 5) {
                clearInterval(attackInterval);
                this.isAttacking = false;
            }
        }, 500);
    }

    private bigRockAttack(player: GameObj) {
        this.isAttacking = true;
        const angle = Math.atan2(
            player.pos.y - this.obj.pos.y,
            player.pos.x - this.obj.pos.x
        );
        const rock = add([
            sprite("rock"),
            scale(3),
            pos(this.obj.pos.x, this.obj.pos.y),
            area(),
            anchor("center"),
            move(angle * (180 / Math.PI), 600),
            "enemy",
            "big-rock",
            {
                damage: 30,
                health: 50,
                isIndestructible: true
            }
        ]);

        wait(3, () => {
            destroy(rock);
        });

        wait(1, () => {
            this.isAttacking = false;
        });
    }

    private retreat(player: GameObj) {
        this.isAttacking = true;
        const angle = Math.atan2(
            player.pos.y - this.obj.pos.y,
            player.pos.x - this.obj.pos.x
        ) + Math.PI;
        
        const targetPos = {
            x: this.obj.pos.x + Math.cos(angle) * 200,
            y: this.obj.pos.y + Math.sin(angle) * 200
        };

        tween(
            this.obj.pos.x,
            targetPos.x,
            0.5,
            (x) => this.obj.pos.x = x,
            easings.easeOutCubic
        );
        
        tween(
            this.obj.pos.y,
            targetPos.y,
            0.5,
            (y) => this.obj.pos.y = y,
            easings.easeOutCubic
        );

        wait(0.5, () => {
            this.isAttacking = false;
        });
    }

    private shootRock(angle: number, speed: number) {
        const rock = add([
            sprite("rock"),
            pos(this.obj.pos.x, this.obj.pos.y),
            area(),
            anchor("center"),
            move(angle * (180 / Math.PI), speed),
            "enemy",
            "boss-rock",
            {
                damage: 15,
                health: 20
            }
        ]);

        wait(2, () => {
            destroy(rock);
        });
    }
}




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

    const boss = new Boss({ x: width() / 2, y: height() / 2 });

    onCollide("projectile", "boss", (p, b) => {
        try {
            if (!b.health) return;
            b.health -= p.damage;
            destroy(p);
            
            if (b.health <= 0 && b.destroy) {
                addKaboom(b.pos);
                b.destroy();
            }
        } catch (error) {
            console.error("Error in collision handling:", error);
        }
    });

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
        setCamPos(player.pos);
    });
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
        onSceneLeave(() => {
            destroyAll("boss-rock");
        });


    }
})