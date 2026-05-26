const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const playButton = document.getElementById("playButton");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// ======================
// GAME STATE
// ======================

let started = false;
let gameOver = false;
let winner = "";

let mouse = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    down: false
};

let keys = {};

let bullets = [];
let enemyBullets = [];
let zombies = [];
let grenades = [];
let superGrenades = [];
let shockwaves = [];
let lightningZones = [];
let lightningHits = [];
let powerups = [];

let weaponList = ["AR","SHOTGUN","SNIPER"];
let weaponIndex = 0;

let classList = ["TANK","VAMPIRE","ASSASSIN","TELEPORT"];
let classIndex = 0;

let fireCooldown = 0;
let zombieTimer = 0;
let lightningTimer = 0;

// ======================
// PLAYER
// ======================

const player = {
    x:150,
    y:HEIGHT/2,
    radius:20,
    hp:100,
    maxHp:100,
    speed:1.4,
    vx:0,
    vy:0,
    regen:0.01,
    lifesteal:0,
    grenades:4,
    superGrenade:true
};

// ======================
// BOSS
// ======================

const boss = {
    x:720,
    y:HEIGHT/2,
    radius:45,
    hp:200,
    maxHp:200,
    phase:1,
    speed:2
};

// ======================
// EVENTS
// ======================

window.addEventListener("keydown",(e)=>{

    keys[e.key.toLowerCase()] = true;

    if(!started){

        if(e.key === "ArrowLeft"){
            weaponIndex--;
            if(weaponIndex < 0){
                weaponIndex = weaponList.length - 1;
            }
        }

        if(e.key === "ArrowRight"){
            weaponIndex++;
            if(weaponIndex >= weaponList.length){
                weaponIndex = 0;
            }
        }

        if(e.key === "ArrowUp"){
            classIndex--;
            if(classIndex < 0){
                classIndex = classList.length - 1;
            }
        }

        if(e.key === "ArrowDown"){
            classIndex++;
            if(classIndex >= classList.length){
                classIndex = 0;
            }
        }

        if(e.key === " "){
            startGame();
        }
    }

    // GRENADE

    if(e.key.toLowerCase() === "e"){

        if(player.grenades > 0){

            grenades.push({
                x:mouse.x,
                y:mouse.y,
                timer:70
            });

            player.grenades--;
        }
    }

    // SUPER GRENADE

    if(e.key.toLowerCase() === "r"){

        if(player.superGrenade){

            superGrenades.push({
                x:mouse.x,
                y:mouse.y,
                timer:120
            });

            player.superGrenade = false;
        }
    }

    // TELEPORT

    if(
        classList[classIndex] === "TELEPORT" &&
        e.key.toLowerCase() === "f"
    ){
        player.x = mouse.x;
        player.y = mouse.y;
    }
});

window.addEventListener("keyup",(e)=>{
    keys[e.key.toLowerCase()] = false;
});

// ======================
// MOUSE
// ======================

canvas.addEventListener("mousemove",(e)=>{

    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    mouse.x = (e.clientX - rect.left) * scaleX;
    mouse.y = (e.clientY - rect.top) * scaleY;
});

canvas.addEventListener("mousedown",()=>{

    mouse.down = true;
});

canvas.addEventListener("mouseup",()=>{

    mouse.down = false;
});

// ======================
// PLAY BUTTON
// ======================

playButton.addEventListener("click",()=>{

    if(!started){

        startGame();

        playButton.style.display = "none";
    }
});

// ======================
// START GAME
// ======================

function startGame(){

    started = true;

    playButton.style.display = "none";

    const selectedClass = classList[classIndex];

    if(selectedClass === "TANK"){
        player.maxHp = 150;
        player.hp = 150;
        player.speed = 1.1;
    }

    if(selectedClass === "VAMPIRE"){
        player.regen = 0.05;
        player.lifesteal = 3;
    }

    if(selectedClass === "ASSASSIN"){
        player.speed = 2.2;
    }

    if(selectedClass === "TELEPORT"){
        player.speed = 1.7;
    }
}

// ======================
// SHOOT
// ======================

function shoot(){

    let angle = Math.atan2(
        mouse.y - player.y,
        mouse.x - player.x
    );

    let weapon = weaponList[weaponIndex];

    if(weapon === "AR"){

        bullets.push({
            x:player.x,
            y:player.y,
            dx:Math.cos(angle),
            dy:Math.sin(angle),
            damage:2
        });
    }

    if(weapon === "SNIPER"){

        bullets.push({
            x:player.x,
            y:player.y,
            dx:Math.cos(angle),
            dy:Math.sin(angle),
            damage:10
        });
    }

    if(weapon === "SHOTGUN"){

        for(let i=-2;i<=2;i++){

            let spread = angle + i * 0.15;

            bullets.push({
                x:player.x,
                y:player.y,
                dx:Math.cos(spread),
                dy:Math.sin(spread),
                damage:3
            });
        }
    }
}

// ======================
// ZOMBIES
// ======================

function spawnZombie(){

    let rare = Math.random() < 0.08;

    zombies.push({
        x:WIDTH + 50,
        y:Math.random() * HEIGHT,
        radius:rare ? 20 : 15,
        hp:rare ? 5 : 1,
        pistol:rare,
        shootTimer:0
    });
}

// ======================
// UPDATE
// ======================

function update(){

    if(!started || gameOver){
        return;
    }

    // REGEN

    player.hp += player.regen;

    if(player.hp > player.maxHp){
        player.hp = player.maxHp;
    }

    // MOVEMENT

    player.vx *= 0.72;
    player.vy *= 0.72;

    if(keys["w"]) player.vy -= player.speed;
    if(keys["s"]) player.vy += player.speed;
    if(keys["a"]) player.vx -= player.speed;
    if(keys["d"]) player.vx += player.speed;

    player.x += player.vx;
    player.y += player.vy;

    // SHOOT

    fireCooldown--;

    if(mouse.down && fireCooldown <= 0){

        shoot();

        let weapon = weaponList[weaponIndex];

        if(weapon === "AR"){
            fireCooldown = 10;
        }

        if(weapon === "SHOTGUN"){
            fireCooldown = 35;
        }

        if(weapon === "SNIPER"){
            fireCooldown = 55;
        }
    }

    // BULLETS

    for(let i=bullets.length-1;i>=0;i--){

        let b = bullets[i];

        b.x += b.dx * 12;
        b.y += b.dy * 12;

        if(
            b.x < 0 ||
            b.x > WIDTH ||
            b.y < 0 ||
            b.y > HEIGHT
        ){
            bullets.splice(i,1);
            continue;
        }

        // BOSS HIT

        let bd = Math.hypot(
            b.x - boss.x,
            b.y - boss.y
        );

        if(bd < boss.radius){

            boss.hp -= b.damage;

            shockwaves.push({
                x:b.x,
                y:b.y,
                r:10
            });

            bullets.splice(i,1);
            continue;
        }

        // ZOMBIE HIT

        for(let zi=zombies.length-1;zi>=0;zi--){

            let z = zombies[zi];

            let d = Math.hypot(
                b.x - z.x,
                b.y - z.y
            );

            if(d < z.radius){

                z.hp -= b.damage;

                shockwaves.push({
                    x:b.x,
                    y:b.y,
                    r:8
                });

                if(z.hp <= 0){

                    player.hp += player.lifesteal;

                    zombies.splice(zi,1);
                }

                bullets.splice(i,1);
                break;
            }
        }
    }

    // ZOMBIES

    zombieTimer++;

    if(zombieTimer > 40){

        spawnZombie();

        zombieTimer = 0;
    }

    for(let i=zombies.length-1;i>=0;i--){

        let z = zombies[i];

        let dx = player.x - z.x;
        let dy = player.y - z.y;

        let dist = Math.hypot(dx,dy);

        z.x += dx / dist * 1.8;
        z.y += dy / dist * 1.8;

        // PISTOL ZOMBIE

        if(z.pistol){

            z.shootTimer++;

            if(z.shootTimer > 90){

                let angle = Math.atan2(
                    player.y - z.y,
                    player.x - z.x
                );

                enemyBullets.push({
                    x:z.x,
                    y:z.y,
                    dx:Math.cos(angle),
                    dy:Math.sin(angle)
                });

                z.shootTimer = 0;
            }
        }

        // DAMAGE

        if(dist < player.radius + z.radius){

            let damage = 0.12;

            if(classList[classIndex] === "TANK"){
                damage *= 0.7;
            }

            player.hp -= damage;
        }
    }

    // ENEMY BULLETS

    for(let i=enemyBullets.length-1;i>=0;i--){

        let b = enemyBullets[i];

        b.x += b.dx * 8;
        b.y += b.dy * 8;

        let d = Math.hypot(
            b.x - player.x,
            b.y - player.y
        );

        if(d < player.radius){

            player.hp -= 7;

            enemyBullets.splice(i,1);
        }
    }

    // LIGHTNING

    lightningTimer++;

    if(lightningTimer > 160){

        lightningZones.push({
            x:Math.random()*WIDTH,
            y:Math.random()*HEIGHT,
            timer:90,
            radius:80
        });

        lightningTimer = 0;
    }

    for(let i=lightningZones.length-1;i>=0;i--){

        let l = lightningZones[i];

        l.timer--;

        if(l.timer <= 0){

            lightningHits.push({
                x:l.x,
                y:l.y,
                timer:15
            });

            let d = Math.hypot(
                player.x - l.x,
                player.y - l.y
            );

            if(d < l.radius){
                player.hp -= 20;
            }

            lightningZones.splice(i,1);
        }
    }

    for(let i=lightningHits.length-1;i>=0;i--){

        lightningHits[i].timer--;

        if(lightningHits[i].timer <= 0){
            lightningHits.splice(i,1);
        }
    }

    // GRENADES

    for(let i=grenades.length-1;i>=0;i--){

        let g = grenades[i];

        g.timer--;

        if(g.timer <= 0){

            for(let zi=zombies.length-1;zi>=0;zi--){

                let z = zombies[zi];

                let d = Math.hypot(
                    z.x - g.x,
                    z.y - g.y
                );

                if(d < 120){
                    zombies.splice(zi,1);
                }
            }

            let bd = Math.hypot(
                boss.x - g.x,
                boss.y - g.y
            );

            if(bd < 150){
                boss.hp -= 20;
            }

            shockwaves.push({
                x:g.x,
                y:g.y,
                r:20
            });

            grenades.splice(i,1);
        }
    }

    // SUPER GRENADE

    for(let i=superGrenades.length-1;i>=0;i--){

        let g = superGrenades[i];

        g.timer--;

        if(g.timer <= 0){

            zombies = [];

            let bd = Math.hypot(
                boss.x - g.x,
                boss.y - g.y
            );

            if(bd < 250){
                boss.hp -= 50;
            }

            for(let k=0;k<8;k++){

                shockwaves.push({
                    x:g.x,
                    y:g.y,
                    r:20 + k * 20
                });
            }

            superGrenades.splice(i,1);
        }
    }

    // SHOCKWAVES

    for(let i=shockwaves.length-1;i>=0;i--){

        shockwaves[i].r += 3;

        if(shockwaves[i].r > 120){
            shockwaves.splice(i,1);
        }
    }

    // POWERUPS

    if(Math.random() < 0.002){

        let types = ["heal","grenade","speed"];

        powerups.push({
            x:Math.random()*WIDTH,
            y:Math.random()*HEIGHT,
            type:types[Math.floor(Math.random()*types.length)]
        });
    }

    for(let i=powerups.length-1;i>=0;i--){

        let p = powerups[i];

        let d = Math.hypot(
            player.x - p.x,
            player.y - p.y
        );

        if(d < 25){

            if(p.type === "heal"){
                player.hp += 20;
            }

            if(p.type === "grenade"){
                player.grenades++;
            }

            if(p.type === "speed"){
                player.speed += 0.1;
            }

            powerups.splice(i,1);
        }
    }

    // BOSS PHASE 2

    if(boss.hp <= 100 && boss.phase === 1){

        boss.phase = 2;
        boss.speed = 3.5;

        for(let i=0;i<10;i++){
            spawnZombie();
        }
    }

    boss.y += (
        player.y - boss.y
    ) * 0.02 * boss.speed;

    // GAME OVER

    if(player.hp <= 0){

        gameOver = true;
        winner = "BOSS WINS";
    }

    if(boss.hp <= 0){

        gameOver = true;
        winner = "YOU WIN";
    }
}

// ======================
// DRAW
// ======================

function drawCircle(x,y,r,color){

    ctx.fillStyle = color;

    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2);
    ctx.fill();
}

function draw(){

    ctx.fillStyle = "#111";
    ctx.fillRect(0,0,WIDTH,HEIGHT);

    // MENU

    if(!started){

        ctx.fillStyle = "white";

        ctx.font = "60px Arial";
        ctx.fillText(
            "ULTIMATIVNI BOSS FIGHT",
            100,
            120
        );

        ctx.font = "30px Arial";

        ctx.fillText(
            "WEAPON < " +
            weaponList[weaponIndex] +
            " >",
            260,
            260
        );

        ctx.fillText(
            "CLASS < " +
            classList[classIndex] +
            " >",
            260,
            320
        );

        ctx.fillText(
            "SPACE OR BUTTON TO PLAY",
            200,
            430
        );

        return;
    }

    // PLAYER

    drawCircle(
        player.x,
        player.y,
        player.radius,
        "dodgerblue"
    );

    // BOSS

    drawCircle(
        boss.x,
        boss.y,
        boss.radius,
        "red"
    );

    // BULLETS

    bullets.forEach((b)=>{
        drawCircle(b.x,b.y,5,"orange");
    });

    enemyBullets.forEach((b)=>{
        drawCircle(b.x,b.y,5,"yellow");
    });

    // ZOMBIES

    zombies.forEach((z)=>{

        drawCircle(
            z.x,
            z.y,
            z.radius,
            z.pistol ? "yellow" : "lime"
        );
    });

    // GRENADES

    grenades.forEach((g)=>{
        drawCircle(g.x,g.y,18,"purple");
    });

    superGrenades.forEach((g)=>{
        drawCircle(g.x,g.y,35,"orange");
    });

    // LIGHTNING

    lightningZones.forEach((l)=>{

        ctx.strokeStyle = "red";

        ctx.beginPath();

        ctx.arc(
            l.x,
            l.y,
            l.radius,
            0,
            Math.PI*2
        );

        ctx.stroke();
    });

    lightningHits.forEach((l)=>{

        for(let i=0;i<10;i++){

            ctx.strokeStyle = "cyan";

            ctx.beginPath();

            ctx.moveTo(
                l.x + Math.random()*50 - 25,
                0
            );

            ctx.lineTo(l.x,l.y);

            ctx.stroke();
        }
    });

    // SHOCKWAVES

    shockwaves.forEach((s)=>{

        ctx.strokeStyle = "cyan";

        ctx.beginPath();

        ctx.arc(
            s.x,
            s.y,
            s.r,
            0,
            Math.PI*2
        );

        ctx.stroke();
    });

    // POWERUPS

    powerups.forEach((p)=>{

        let color = "white";

        if(p.type === "heal") color = "lime";
        if(p.type === "grenade") color = "purple";
        if(p.type === "speed") color = "cyan";

        drawCircle(
            p.x,
            p.y,
            10,
            color
        );
    });

    // UI

    ctx.fillStyle = "red";
    ctx.fillRect(20,20,200,20);

    ctx.fillStyle = "lime";
    ctx.fillRect(
        20,
        20,
        (player.hp/player.maxHp)*200,
        20
    );

    ctx.fillStyle = "red";
    ctx.fillRect(
        WIDTH-220,
        20,
        200,
        20
    );

    ctx.fillStyle = "lime";
    ctx.fillRect(
        WIDTH-220,
        20,
        (boss.hp/boss.maxHp)*200,
        20
    );

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";

    ctx.fillText(
        "PLAYER " +
        Math.floor(player.hp) +
        "/" +
        player.maxHp,
        20,
        60
    );

    ctx.fillText(
        "BOSS " +
        Math.floor(boss.hp) +
        "/" +
        boss.maxHp,
        WIDTH - 220,
        60
    );

    ctx.fillText(
        "GRENADES " +
        player.grenades +
        "/4",
        20,
        90
    );

    ctx.fillText(
        "R = SUPER GRENADE",
        20,
        120
    );

    // GAME OVER

    if(gameOver){

    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(0,0,WIDTH,HEIGHT);

    // TITLE

    ctx.fillStyle = "white";

    ctx.font = "60px Arial";

    ctx.textAlign = "center";

    ctx.fillText(
        winner,
        WIDTH/2,
        HEIGHT/2 - 70
    );

    // PLAY AGAIN BUTTON

    const btnX = WIDTH/2 - 170;
    const btnY = HEIGHT/2 + 10;
    const btnW = 340;
    const btnH = 90;

    ctx.fillStyle = "lime";

    ctx.fillRect(
        btnX,
        btnY,
        btnW,
        btnH
    );

    ctx.strokeStyle = "white";
    ctx.lineWidth = 4;

    ctx.strokeRect(
        btnX,
        btnY,
        btnW,
        btnH
    );

    ctx.fillStyle = "black";

    ctx.font = "42px Arial";

    ctx.fillText(
        "PLAY AGAIN",
        WIDTH/2,
        HEIGHT/2 + 67
    );

    ctx.textAlign = "left";
}
}

// ======================
// LOOP
// ======================

function gameLoop(){

    update();
    draw();

    requestAnimationFrame(gameLoop);
}

gameLoop();