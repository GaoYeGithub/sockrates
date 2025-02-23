import kaplay, { AreaComp, BodyComp, GameObj, PosComp, SpriteComp } from "kaplay";
import "kaplay/global";

kaplay();

loadRoot("./");
loadSprite("sock", "sprites/Sock.png");
loadSprite("background", "sprites/temple-background.png");
loadSprite("door", "sprites/temple-door.png");

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

scene("main", () => {
    add([
        sprite("background"),
        pos(width() / 2, height() / 2),
        anchor("center"),
        scale(1)
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
            {
                doorId: index + 1
            }
        ]);
    });

    const player = add([
        sprite("sock"),
        pos(width() / 2, height() - 100),
        anchor("center"),
        area(),
        {
            speed: 320,
            direction: vec2(0, 0)
        }
    ]);

    onUpdate(() => {
        player.direction = vec2(0, 0);

        if (isKeyDown("left") || isKeyDown("a")) {
            player.direction.x = -1;
        }
        if (isKeyDown("right") || isKeyDown("d")) {
            player.direction.x = 1;
        }
        if (isKeyDown("up") || isKeyDown("w")) {
            player.direction.y = -1;
        }
        if (isKeyDown("down") || isKeyDown("s")) {
            player.direction.y = 1;
        }
        if (player.direction.x !== 0 && player.direction.y !== 0) {
            player.direction = player.direction.unit();
        }

        player.pos = player.pos.add(player.direction.scale(player.speed * dt()));
        player.pos.x = clamp(player.pos.x, 0, width());
        player.pos.y = clamp(player.pos.y, 0, height());
    });

    player.onCollide("door", (door) => {
        const doorId = door.doorId;
        debug.log(`Interacted with door ${doorId}`);
        shake(5);
    });
});

go("main");