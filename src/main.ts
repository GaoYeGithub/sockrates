import kaplay, { AreaComp, BodyComp, GameObj, PosComp, SpriteComp } from "kaplay";
import "kaplay/global";


kaplay();

loadSound("boom", "sounds/boom.mp3");
loadSound("cock", "sounds/cock.mp3");
loadSound("equip", "sounds/item-equip.mp3");
loadSound("score", "sounds/score.mp3");
loadSound("oof", "sounds/oof.mp3");
loadSound("slash", "sounds/slash.mp3");
loadSound("drum", "sounds/whoosh-drum.mp3");
loadRoot("./sprites/"); // A good idea for Itch.io publishing later (what does this mean)
loadSprite("bean", "bean.png");
loadSprite("sock", "Sock.png");
loadSprite("evil", "evil.png");
loadSprite("sad", "sad.png");
loadSprite("rocky", "rocky.png");
loadSprite("greaser", "greaser.png");
loadSprite("rock", "rock_1.png");
loadSprite("staff", "staff.png");
loadSprite("bunny", "dust bunny.png");
loadSprite("water bullet", "water-bullet.png");
loadSprite("detergent", "Detergent.png");
loadSprite("boss", "boss-monster.png");
loadSprite("coin", "Coin.png");
loadSprite("golden coin", "golden-Coin.png")
loadSprite("orb", "orb.png")
loadSprite("stick", "Stick.png")


setBackground(105, 105, 105);

const MELEE = "melee";
const RANGED = "ranged";
const MAGIC = "magic";
const SPEED = 300;

let coins = 0;

class Weapon {
    name: string;
    damage: number;
    type: string;
    sprite: string;
    cooldown: number;
    onCooldown: boolean = false;
    cooldownRemaining: number = 0;
    constructor(name: string, damage: number, cooldown: number, type: string, sprite: string) {
        this.name = name;
        this.damage = damage;
        this.type = type;
        this.sprite = sprite;
        this.cooldown = cooldown;
    }
}

class RangedWeapon extends Weapon {
    projectiles: number;
    projectileSprite: string;
    lifetime: number;
    constructor(name: string, damage: number, cooldown: number, sprite: string, projectiles: number, projectileSprite: string, lifetime: number) {
        super(name, damage, cooldown, RANGED, sprite);
        this.projectiles = projectiles;
        this.projectileSprite = projectileSprite;
        this.lifetime = lifetime;
    }
}

const availableWeapons = [
    new RangedWeapon("Detergent", 2, 3, "detergent", 10, "water bullet", 0.5),
    new RangedWeapon("Staff", 2, 0.1, "staff", 2, "orb", 1),
    new Weapon("Greaser", 15, 0.33, MELEE, "greaser"),
    new Weapon("Stick", 10, 0.25, MELEE, "stick"),
];

const availableSkins = ["sock", "evil", "sad", "rocky"];

let inventory = [availableWeapons[0], availableWeapons[1], availableWeapons[2]];
let equipped = inventory[0];
let currentSkin = "sock";
let inventoryOpen = false;
let draggingItem = null;
let draggingItemOriginalSlot = null;

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
                area({scale: 0.75}),
                body({ isStatic: true }),
                anchor("center"),
                scale(2),
                "enemy",
                "boss",
                {
                    damage: 20,
                    health: this.maxHealth,
                    type: "boss",
                    coins: 50,
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
                text("Sage of Mind Socrates", {
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
                play("drum");
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
                health: 20,
                destroyOnCollide: true,
            }
        ]);

        wait(2, () => {
            destroy(rock);
        });
    }
}

let talking = false;

function showDialogue(player: GameObj<PosComp | AreaComp | SpriteComp | BodyComp>, dialogues: { speaker: string; text: string }[], onComplete?: () => void) {
    if (talking) {return}

    let currentDialogueIndex = 0;
    talking = true;
    const dialogueBox = add([
        rect(width() - 40, 100),
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

    const dialoguePosUpdater = dialogueBox.onUpdate(() => {
        dialogueBox.pos.x = (player.pos.x - (width() / 2));
        dialogueBox.pos.y = player.pos.y + (height() / 2) - 120;

        speakerText.pos.x = player.pos.x - (width() / 2) + 10;
        speakerText.pos.y = player.pos.y + (height() / 2) - 100;

        dialogueText.pos.x = player.pos.x - (width() / 2) + 10;
        dialogueText.pos.y = player.pos.y + (height() / 2) - 80;
    });

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
            dialoguePosUpdater.cancel();
            advanceDialogueListener.cancel();
            if (onComplete) {
                onComplete();
            }
        }
    });

    updateDialogue();
}


scene("game", () => {
    function spawnCoins(position, coinCount) {

        if (coinCount == undefined) {return}
        debug.log("here!" + coinCount);
        for (let i = 0; i < coinCount; i++) {
            const isGoldenCoin = Math.random() < 0.1; // 10% chance to spawn a golden coin
            const coinSprite = isGoldenCoin ? "golden coin" : "coin";
            const coinValue = isGoldenCoin ? 10 : 1;
            add([
                sprite(coinSprite),
                pos(position),
                area({scale: 0.5, collisionIgnore: ["weapon", "enemy"]}),
                body(),
                "coin",
                { value: coinValue}
            ]);
        }
    }
    coins = 0;
    const player = add([
        sprite(currentSkin),
        pos(300, 300),
        area(),
        body(),
        "player",
        anchor("center"),
        {health: 100}
    ]);
    player.onCollide("enemy", (enemy) => {
        player.health -= enemy.damage;
        if(enemy.destroyOnCollide) {
            destroy(enemy)
            addKaboom(enemy.pos);
        }
        if (player.health <= 0) {
            destroy(player);
            addKaboom(player.pos);
            go("gameover");
        }
    })
    player.onCollide("coin", (coin) => {
        coins += coin.value;
        destroy(coin);
        play("score"); // coin sound
    })
    /*
        * weapon related stuff
        * */
    let weaponDistance = width() / 15;
    const weapon = add([
        sprite(equipped.sprite),
        pos(player.pos),
        area({ scale: 0.5 }),
        body(),
        rotate(),
        "weapon",
        timer(),
        anchor("center"),
    ]);
    weapon.onCollide("enemy", (enemy) => {
        if (equipped.onCooldown) { return }
        enemy.health -= equipped.damage;
        if (enemy.health <= 0) {
            addKaboom(enemy.pos);
            spawnCoins(enemy.pos, enemy.coins);
            destroy(enemy);
        }
    })

    /*
    * HP related mechanics IDK
    * */
    const healthText = add([
        text("Health: NaN"),
        pos(10, height() - 40),
        color(WHITE),
        outline(2,BLACK),
        fixed(),
    ])
    healthText.onUpdate(() => {
        healthText.text = "Health: " + player.health
    })
    const coinsText = add([
        text(""),
        pos(10, height() - 80),
        color(WHITE),
        outline(2, BLACK),
        fixed(),
    ])
    coinsText.onUpdate(() => {
        coinsText.text = "Coins:" + coins;
    })
    const reloadText = add([
        text(""),
        pos(10, height() - 120),
        color(WHITE),
        outline(2, BLACK),
        fixed(),
    ])

    let cooldownTime = 0;
    reloadText.onUpdate(() => {
        if (equipped.onCooldown) {
            cooldownTime -= dt();
            if (cooldownTime < 0) cooldownTime = 0;
            reloadText.text = "Reloading: " + cooldownTime.toFixed(2);
        } else {
            reloadText.text = "Reloaded";
        }

    })

    onKeyDown("a", () => {
        if (!inventoryOpen) player.move(-SPEED, 0);
    });
    onKeyDown("d", () => {
        if (!inventoryOpen) player.move(SPEED, 0);
    });
    onKeyDown("w", () => {
        if (!inventoryOpen) player.move(0, -SPEED);
    });
    onKeyDown("s", () => {
        if (!inventoryOpen) player.move(0, SPEED);
    });

    player.onUpdate(() => {
        setCamPos(player.pos);
    });

    /*
    * Weapon "firing" handlers
    * */

    onMouseDown(() => {

        if (inventoryOpen) return;
        if (equipped.onCooldown && cooldownTime == 0) {
            equipped.onCooldown = false;
        }
        if (equipped.onCooldown) return;
        equipped.onCooldown = true;
        cooldownTime = equipped.cooldown;
        wait (equipped.cooldown, () => {
            equipped.onCooldown = false;
            cooldownTime = 0;
            if(equipped.type == RANGED) play("cock");
        })
        if (equipped.type === MELEE) {
            play("slash")
            tween(width() / 15, width() / 10, 1, (p) => weaponDistance = p, easings.easeOutBounce);
            wait(0.1, () => {
                tween(width() / 10, width() / 15, 1, (p) => weaponDistance = p, easings.easeOutBounce)
            })
        } else if (equipped instanceof RangedWeapon) {
            let weaponAngle = weapon.pos.angle(player.pos);
            for (let i = 0; i < equipped.projectiles; i++) {
                let variation = randi(-3 * equipped.projectiles, 3 * equipped.projectiles);
                const projectile = add([
                    sprite(equipped.projectileSprite),
                    pos(weapon.pos),
                    area(),
                    move(weaponAngle + variation, 500),
                    rotate(variation),
                    "projectile",
                    {damage: equipped.damage, lifetime: equipped.lifetime}
                ])
                projectile.onCollide("enemy", (enemy) => {
                    enemy.health -= projectile.damage;
                    //debug.log('hit the enemy, dealing' + projectile.damage + ' which now has' + enemy.health + 'health!')
                    if (enemy.health <= 0) {
                        addKaboom(enemy.pos);
                        spawnCoins(enemy.pos, enemy.coins);
                        destroy(enemy);
                    }
                    destroy(projectile);
                });
                wait(projectile.lifetime, () => {
                    destroy(projectile);
                });
            }
        }
    });
    // weapon angle
    weapon.onUpdate(() => {
        if (inventoryOpen) return;

        const a = mousePos().sub(center());
        const weaponAngle = Math.atan2(a.y, a.x);
        let offset = vec2(
            weaponDistance * Math.cos(weaponAngle),
            weaponDistance * Math.sin(weaponAngle)
        );
        weapon.pos = player.pos.add(offset);
        weapon.angle = (weaponAngle * 180) / Math.PI + 90;
    });

    const hotbarSlots = [];
    const hotbarItems = [];

    for (let i = 0; i < 6; i++) {
        const slotX = center().x - 180 + i * 40;
        const slotY = height() - 40;

        const slot = add([
            rect(36, 36),
            outline(2, rgb(55, 55, 55)),
            pos(slotX, slotY),
            color(100, 100, 100),
            fixed(),
            opacity(0.8),
            area(),
            "hotbar-slot",
            { slotIndex: i }
        ]);

        hotbarSlots.push(slot);

        if (i < inventory.length) {
            const item = add([
                sprite(inventory[i].sprite),
                pos(slotX, slotY),
                scale(0.5),
                fixed(),
                area(),
                "hotbar-item",
                { weaponIndex: i }
            ]);

            hotbarItems.push(item);
        }
    }

    let selectedSlot = 0;

    function updateSelectedSlot() {
        hotbarSlots.forEach((slot, index) => {
            if (index === selectedSlot) {
                slot.color = rgb(150, 150, 150);
                slot.outline = { width: 3, color: rgb(255, 255, 255) };
            } else {
                slot.color = rgb(100, 100, 100);
                slot.outline = { width: 2, color: rgb(55, 55, 55) };
            }
        });
    }

    for (let i = 1; i <= 6; i++) {
        onKeyPress(i.toString(), () => {
            play("equip")
            selectedSlot = i - 1;
            updateSelectedSlot();

            if (selectedSlot < inventory.length) {
                equipped = inventory[selectedSlot];
                weapon.use(sprite(equipped.sprite));
            }
        });
    }

    updateSelectedSlot();

    let inventoryUI = null;
    let inventorySlots = [];
    let inventoryItems = [];
    let skinSlots = [];
    let skinItems = [];

    onKeyPress("e", () => {
        inventoryOpen = !inventoryOpen;

        if (inventoryOpen) {
            inventoryUI = add([
                rect(600, 400),
                pos(center()),
                color(64, 64, 64),
                outline(4, rgb(32, 32, 32)),
                anchor("center"),
                fixed(),
                "inventory"
            ]);

            add([
                text("Inventory", { size: 24 }),
                pos(center().x, center().y - 150),
                color(255, 255, 255),
                anchor("center"),
                fixed(),
                "inventory-title"
            ]);

            const characterPreviewX = center().x - 170;
            const characterPreviewY = center().y;

            add([
                rect(150, 220),
                pos(characterPreviewX, characterPreviewY),
                color(40, 40, 40),
                outline(2, rgb(30, 30, 30)),
                anchor("center"),
                fixed(),
                "character-preview"
            ]);

            const preview = add([
                sprite(currentSkin),
                pos(characterPreviewX, characterPreviewY - 40),
                scale(2),
                anchor("center"),
                fixed(),
                "character-sprite"
            ]);

            add([
                text("Skins", { size: 18 }),
                pos(characterPreviewX, characterPreviewY + 30),
                color(255, 255, 255),
                anchor("center"),
                fixed(),
                "skins-title"
            ]);

            const skinStartX = characterPreviewX - 80;
            const skinY = characterPreviewY + 70;

            availableSkins.forEach((skin, index) => {
                const slotX = skinStartX + index * 40;

                const skinSlot = add([
                    rect(36, 36),
                    outline(2, rgb(55, 55, 55)),
                    pos(slotX, skinY),
                    color(100, 100, 100),
                    opacity(0.8),
                    fixed(),
                    area(),
                    "skin-slot",
                    { skinIndex: index }
                ]);

                skinSlots.push(skinSlot);

                const skinItem = add([
                    sprite(skin),
                    pos(slotX, skinY),
                    scale(0.4),
                    fixed(),
                    area(),
                    "skin-item",
                    { skinName: skin }
                ]);

                skinItems.push(skinItem);

                if (skin === currentSkin) {
                    skinSlot.color = rgb(150, 150, 150);
                    skinSlot.outline = { width: 3, color: rgb(255, 255, 255) };
                }

                skinItem.onClick(() => {
                    currentSkin = skin;
                    preview.use(sprite(currentSkin));

                    skinSlots.forEach((s, i) => {
                        if (i === index) {
                            s.color = rgb(150, 150, 150);
                            s.outline = { width: 3, color: rgb(255, 255, 255) };
                        } else {
                            s.color = rgb(100, 100, 100);
                            s.outline = { width: 2, color: rgb(55, 55, 55) };
                        }
                    });
                });
            });

            const slotSize = 40;
            const startX = center().x + 15;
            const startY = center().y - 80;

            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 6; col++) {
                    const slotX = startX + col * slotSize;
                    const slotY = startY + row * slotSize;

                    const slot = add([
                        rect(36, 36),
                        outline(2, rgb(55, 55, 55)),
                        pos(slotX, slotY),
                        color(100, 100, 100),
                        opacity(0.8),
                        fixed(),
                        area(),
                        "inventory-slot",
                        { row, col, slotIndex: row * 6 + col }
                    ]);

                    inventorySlots.push(slot);

                    if (row === 0 && col < inventory.length) {
                        const item = add([
                            sprite(inventory[col].sprite),
                            pos(slotX, slotY),
                            scale(0.5),
                            fixed(),
                            area(),
                            "inventory-item",
                            { weaponIndex: col }
                        ]);

                        inventoryItems.push(item);

                        item.onClick(() => {
                            if (!draggingItem) {
                                draggingItem = item;
                                draggingItemOriginalSlot = slot.slotIndex;
                            }
                        });
                    }
                }
            }

            add([
                text("Items", { size: 18 }),
                pos(center().x + 100, startY - 30),
                color(255, 255, 255),
                anchor("center"),
                fixed(),
                "items-title"
            ]);

        } else {
            destroyAll("inventory");
            destroyAll("inventory-title");
            destroyAll("inventory-slot");
            destroyAll("inventory-item");
            destroyAll("character-preview");
            destroyAll("character-sprite");
            destroyAll("skins-title");
            destroyAll("skin-slot");
            destroyAll("skin-item");
            destroyAll("items-title");

            player.use(sprite(currentSkin));

            inventorySlots = [];
            inventoryItems = [];
            skinSlots = [];
            skinItems = [];

            draggingItem = null;
            draggingItemOriginalSlot = null;
        }
    });

    onMouseMove(() => {
        if (draggingItem) {
            draggingItem.pos = mousePos();
        }
    });

    onMouseRelease(() => {
        if (draggingItem) {
            let foundSlot = false;

            inventorySlots.forEach(slot => {
                if (mousePos().dist(slot.pos) < 20) {
                    foundSlot = true;

                    const weaponIndex = draggingItem.weaponIndex;

                    const destSlotIndex = slot.slotIndex;

                    if (destSlotIndex < inventory.length) {
                        const temp = inventory[weaponIndex];
                        inventory[weaponIndex] = inventory[destSlotIndex];
                        inventory[destSlotIndex] = temp;

                        if (equipped === inventory[weaponIndex]) {
                            equipped = inventory[destSlotIndex];
                        } else if (equipped === inventory[destSlotIndex]) {
                            equipped = inventory[weaponIndex];
                        }

                        weapon.use(sprite(equipped.sprite));

                        hotbarItems.forEach(item => {
                            if (item.weaponIndex === weaponIndex) {
                                item.use(sprite(inventory[weaponIndex].sprite));
                            } else if (item.weaponIndex === destSlotIndex) {
                                item.use(sprite(inventory[destSlotIndex].sprite));
                            }
                        });

                        inventoryItems.forEach(item => {
                            if (item.weaponIndex === weaponIndex) {
                                item.use(sprite(inventory[weaponIndex].sprite));
                            } else if (item.weaponIndex === destSlotIndex) {
                                item.use(sprite(inventory[destSlotIndex].sprite));
                            }
                        });
                    }

                    draggingItem.pos = slot.pos;
                }
            });

            if (!foundSlot) {
                const originalSlot = inventorySlots.find(slot => slot.slotIndex === draggingItemOriginalSlot);
                if (originalSlot) {
                    draggingItem.pos = originalSlot.pos;
                }
            }

            draggingItem = null;
            draggingItemOriginalSlot = null;
        }
    });

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

    for (let i = 0; i < 10; i++) {
        add([
            pos(randi(width()), randi(height())),
            sprite("rock"),
            area({ scale: 0.75 }),
            body(),
        ]);

        const bunny = add([
            sprite("bunny"),
            area(),
            body(),
            pos(player.pos.x + randi(-width() / 4, width() / 4), player.pos.y + randi(-height() / 4, height() / 4)),
            "enemy",
            timer(),
            { damage: 10, health: 20, coins: 2, type: "dust bunny", destroyOnCollide: true }
        ]);
        bunny.loop(rand(2, 4), () => {
            let angle = bunny.pos.angleBetween(player.pos);
            bunny.tween(bunny.pos, vec2(100 * Math.cos(angle), 100 * Math.sin(angle)), 1, (p) => bunny.pos = p, easings.easeOutElastic);
        });
    }

    onSceneLeave(() => {
        destroyAll("boss-rock");
    });
});

scene("gameover", () => {
    play("oof");
    add([
        text("lol u died, git gud", { size: 48 }),
        pos(center()),
        color(255, 255, 255),
        anchor("center"),
    ]);

    add([
        text("Press any key to restart", { size: 24 }),
        pos(center().x, center().y + 50),
        color(255, 255, 255),
        anchor("center"),
    ]);

    onKeyPress(() => {
        go("game");
    });
})
go("game");