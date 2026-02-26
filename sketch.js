/*
* Cat Game with Animated Inventory + Floating Text + Sound Effects
* + Pastel Star Confetti + Twinkle + Sparkle Trails
* + Meow Reset (items do NOT respawn)
* + Ending GIF Scene + Final Sound
* + Sliding Inventory + Pastel Underline
* + Reaction Freeze (reaction image stays at object position)
*/

// ------------------------------------------------------------
// GLOBALS
// ------------------------------------------------------------

let video;
let hands = [];

let yarnball, catyarn;
let mushroom, mushroomcat;
let sardines, catfish;
let bushes, flowers;

let cats = [];
let catCounter = 0;
let currentCat;

// Reaction override
let overrideCat = null;
let overrideTimer = 0;
let overrideWidth = 165;
let overrideHeight = 120;

// ⭐ NEW: reaction freeze position
let reactionX = 0;
let reactionY = 0;

const OVERRIDE_DURATION = 900;
const INTERACTION_DISTANCE = 90;

let showCat = true;

// SOUND EFFECTS
let sfxYarn;
let sfxFinish;

// TRACKING ITEM COLLECTION
let itemsCollected = 0;

// Meow flags
let meowed = {
  yarn: false,
  mushroom: false,
  sardines: false
};

// INVENTORY ANIMATION STATE
let inv = {
  yarn: { collected: false, animStart: 0, animDuration: 300 },
  mushroom: { collected: false, animStart: 0, animDuration: 300 },
  sardines: { collected: false, animStart: 0, animDuration: 300 }
};

// ⭐ Sliding inventory panel
let invSlideX = -200;
let invTargetX = 10;
let invSlideSpeed = 0.12;

// FLOATING TEXT + SPARKLES
let floatingTexts = [];

// ------------------------------------------------------------
// CONFETTI SYSTEM
// ------------------------------------------------------------
let confetti = [];
let confettiActive = false;
let confettiStartTime = 0;
const CONFETTI_DURATION = 2500;

// ------------------------------------------------------------
// ENDING SCENE
// ------------------------------------------------------------
let endingGif;
let endingActive = false;
let endingStartTime = 0;
let endingFade = 0;

// ------------------------------------------------------------
// CONFETTI START
// ------------------------------------------------------------
function startConfetti() {
  confetti = [];
  confettiActive = true;
  confettiStartTime = millis();

  for (let i = 0; i < 120; i++) {
    confetti.push({
      x: random(width),
      y: random(-200, -20),
      size: random(12, 20),
      speed: random(1.5, 3.5),

      color: color(
        random(210, 255),
        random(180, 230),
        random(230, 255),
        255
      ),

      rotation: random(TWO_PI),
      rotationSpeed: random(-0.03, 0.03),

      twinkleSpeed: random(2, 5),
      twinkleOffset: random(TWO_PI),

      trail: []
    });
  }
}

// ------------------------------------------------------------
// CONFETTI UPDATE
// ------------------------------------------------------------
function updateConfetti() {
  if (!confettiActive) return;

  for (let c of confetti) {
    c.y += c.speed;
    c.rotation += c.rotationSpeed;

    let twinkle = 0.6 + 0.4 * sin((millis() * 0.005 * c.twinkleSpeed) + c.twinkleOffset);
    let twinkleSize = c.size * twinkle;

    drawStar(c.x, c.y, twinkleSize, c.color, c.rotation);

    if (frameCount % 2 === 0) {
      c.trail.push({
        x: c.x + random(-2, 2),
        y: c.y + random(-2, 2),
        size: random(2, 5),
        alpha: 200
      });
    }

    for (let i = c.trail.length - 1; i >= 0; i--) {
      let t = c.trail[i];
      noStroke();
      fill(255, 255, 255, t.alpha);
      ellipse(t.x, t.y, t.size);

      t.alpha -= 6;
      t.size *= 0.95;

      if (t.alpha <= 0) c.trail.splice(i, 1);
    }
  }

  if (millis() - confettiStartTime > CONFETTI_DURATION) {
    confettiActive = false;
  }
}

// ------------------------------------------------------------
// STAR SHAPE
// ------------------------------------------------------------
function drawStar(x, y, radius, colorVal, rotation) {
  push();
  translate(x, y);
  rotate(rotation);
  fill(colorVal);
  noStroke();

  beginShape();
  for (let i = 0; i < 5; i++) {
    let angle = i * TWO_PI / 5;
    vertex(cos(angle) * radius, sin(angle) * radius);

    let innerAngle = angle + PI / 5;
    vertex(cos(innerAngle) * radius * 0.45, sin(innerAngle) * radius * 0.45);
  }
  endShape(CLOSE);

  pop();
}

// ------------------------------------------------------------
// MOUSE CLICK
// ------------------------------------------------------------
function mousePressed() {
  if (endingActive && endingFade === 255) {
    let bx = width / 2;
    let by = height / 2 + 200;

    if (dist(mouseX, mouseY, bx, by) < 120) {
      resetGame();
      return;
    }
  }

  sfxYarn.rate(1);
  sfxYarn.play();
}

// ------------------------------------------------------------
// HAPPY MEOW
// ------------------------------------------------------------
function happyMeow() {
  sfxYarn.rate(random(1.2, 1.6));
  sfxYarn.play();
}

// ------------------------------------------------------------
// SUPER HAPPY MEOW
// ------------------------------------------------------------
function superHappyMeow() {
  sfxYarn.rate(1.8);
  sfxYarn.play();
  setTimeout(() => {
    sfxYarn.rate(2.0);
    sfxYarn.play();
  }, 150);

  startConfetti();

  setTimeout(() => {
    endingActive = true;
    endingStartTime = millis();

    if (sfxFinish && !sfxFinish.isPlaying()) {
      sfxFinish.play();
    }
  }, 1200);

  setTimeout(() => {
    meowed.yarn = false;
    meowed.mushroom = false;
    meowed.sardines = false;
    itemsCollected = 0;
  }, 2000);
}

// ------------------------------------------------------------
// PRELOAD
// ------------------------------------------------------------
function preload() {
  handPose = ml5.handPose();

  cats[0] = loadImage("images/catstill_.GIF");
  cats[1] = loadImage("images/catwalk_.GIF");

  mushroom = loadImage("images/mushroom.GIF");
  mushroomcat = loadImage("images/catmushroom_.GIF");

  sardines = loadImage("images/sardines.GIF");
  catfish = loadImage("images/catfish_.GIF");

  bushes = loadImage("images/bushes.GIF");
  flowers = loadImage("images/flowers.GIF");

  yarnball = loadImage("images/yarnball.GIF");
  catyarn = loadImage("images/catyarn.GIF");

  endingGif = loadImage("images/finalcatscene.gif");

  sfxFinish = loadSound("images/finish.mp3");
  sfxFinish.playMode("restart");

  sfxYarn = loadSound("images/meow.mp3");
  sfxYarn.playMode("restart");
}

// ------------------------------------------------------------
// SETUP
// ------------------------------------------------------------
function setup() {
  let canvas = createCanvas(900, 600);
  canvas.parent("canvas-holder");

  imageMode(CENTER);
  textFont("Love Ya Like A Sister");
  currentCat = cats[0];
  userStartAudio();
}

// ------------------------------------------------------------
// ⭐ CAT REACTION (FREEZE AT OBJECT POSITION)
// ------------------------------------------------------------
function triggerCatReaction(img, w, h, lockX, lockY) {
  overrideCat = img;
  overrideWidth = w;
  overrideHeight = h;
  overrideTimer = millis();

  // ⭐ TRUE fixed position at object
  reactionX = lockX;
  reactionY = lockY;
}

// ------------------------------------------------------------
// DRAW LOOP
// ------------------------------------------------------------
function draw() {
  background(355);

  image(bushes, 290, 100, 60, 280);
  image(bushes, 290, 600, 60, 280);
  image(flowers, 100, 500, 100, 100);
  image(flowers, 400, 200, 100, 100);

  push();
  translate(600, 600);
  scale(-1, 1);
  image(flowers, 0, 0, 140, 140);
  pop();

  // ⭐ CAT DRAWING
  if (showCat && !endingActive) {
    if (overrideCat && millis() - overrideTimer < OVERRIDE_DURATION) {
      // draw reaction at frozen object position
      image(overrideCat, reactionX, reactionY, overrideWidth, overrideHeight);
    } else {
      overrideCat = null;
      image(currentCat, mouseX, mouseY, 165, 120);
    }
  }

  showCat = true;

  // ⭐ Cat hitbox (used for detecting pickup)
  let catHitX = mouseX;
  let catHitY = mouseY + 20;

  // ------------------------------------------------------------
  // SARDINES
  // ------------------------------------------------------------
  if (!inv.sardines.collected) {
    image(sardines, 150, 200, 82, 60);

    if (detectProximity(catHitX, catHitY, 150, 200)) {
      if (!meowed.sardines) {
        happyMeow();
        meowed.sardines = true;
      }

      inv.sardines.collected = true;
      inv.sardines.animStart = millis();

      // ⭐ freeze reaction at object position
      triggerCatReaction(catfish, 200, 150, 150, 200);

      addFloatingText("+1 Sardines", mouseX, mouseY);

      itemsCollected++;
      if (itemsCollected === 3) superHappyMeow();
    }
  }

  // ------------------------------------------------------------
  // MUSHROOM
  // ------------------------------------------------------------
  if (!inv.mushroom.collected) {
    image(mushroom, 500, 400, 206, 266);

    if (detectProximity(catHitX, catHitY, 500, 400)) {
      if (!meowed.mushroom) {
        happyMeow();
        meowed.mushroom = true;
      }

      inv.mushroom.collected = true;
      inv.mushroom.animStart = millis();

      triggerCatReaction(mushroomcat, 250, 280, 500, 400);

      addFloatingText("+1 Mushroom", mouseX, mouseY);

      itemsCollected++;
      if (itemsCollected === 3) superHappyMeow();
    }
  }

  // ------------------------------------------------------------
  // YARN
  // ------------------------------------------------------------
  if (!inv.yarn.collected) {
    image(yarnball, 650, 150, 150, 100);

    if (detectProximity(catHitX, catHitY, 650, 150)) {
      if (!meowed.yarn) {
        happyMeow();
        meowed.yarn = true;
      }

      inv.yarn.collected = true;
      inv.yarn.animStart = millis();

      triggerCatReaction(catyarn, 180, 190, 650, 150);

      addFloatingText("+1 Yarn", mouseX, mouseY);

      itemsCollected++;
      if (itemsCollected === 3) superHappyMeow();
    }
  }

  updateFloatingTexts();
  drawInventory();
  drawEndingScene();
  updateConfetti();
}

// ------------------------------------------------------------
// CAT SWITCHING
// ------------------------------------------------------------
function switchCat() {
  currentCat = cats[catCounter];
  catCounter++;
  if (catCounter > 1) catCounter = 0;
}

let catSwitching = setInterval(switchCat, 500);

// ------------------------------------------------------------
// PROXIMITY CHECK
// ------------------------------------------------------------
function detectProximity(catX, catY, targetX, targetY) {
  return dist(catX, catY, targetX, targetY) < INTERACTION_DISTANCE;
}

// ------------------------------------------------------------
// INVENTORY DRAWING
// ------------------------------------------------------------
function drawInventory() {
  push();

  invSlideX = lerp(invSlideX, invTargetX, invSlideSpeed);

  rectMode(CORNER);
  fill(255, 240);
  stroke(255, 180, 220);
  strokeWeight(1);
  rect(invSlideX, 10, 160, 120, 10);

  fill(0);
  textSize(20);
  fill(255, 180, 220)
  textAlign(CENTER, CENTER);
  let invCenterX = invSlideX + 160 / 2;
  let invCenterY = 10 + 30;
  text("Inventory", invCenterX, invCenterY);

  strokeWeight(3);
  stroke(255, 180, 220);
  line(invSlideX + 20, invCenterY + 18, invSlideX + 140, invCenterY + 18);

  let baseX = invSlideX + 40;
  let y = 85;

  function animScale(item) {
    let t = (millis() - item.animStart) / item.animDuration;
    t = constrain(t, 0, 1);
    return easeOutBack(t);
  }

  if (inv.yarn.collected) {
    let s = animScale(inv.yarn);
    push();
    translate(baseX, y);
    scale(s);
    image(yarnball, 0, 0, 40, 30);
    pop();
  }

  if (inv.mushroom.collected) {
    let s = animScale(inv.mushroom);
    push();
    translate(baseX + 50, y);
    scale(s);
    image(mushroom, 0, 0, 40, 50);
    pop();
  }

  if (inv.sardines.collected) {
    let s = animScale(inv.sardines);
    push();
    translate(baseX + 100, y);
    scale(s);
    image(sardines, 0, 0, 40, 30);
    pop();
  }

  pop();
}

// ------------------------------------------------------------
// FLOATING TEXT SYSTEM
// ------------------------------------------------------------
function addFloatingText(msg, x, y) {
  floatingTexts.push({
    text: msg,
    x: x,
    y: y,
    alpha: 255,
    lifespan: 60,
    sparkles: Array.from({ length: 6 }, () => ({
      xOff: random(-15, 15),
      yOff: random(-15, 15),
      size: random(4, 8),
      alpha: 255
    }))
  });
}

function updateFloatingTexts() {
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    let ft = floatingTexts[i];

    push();
    textSize(34);
    stroke(255, ft.alpha);
    strokeWeight(5);
    fill(0, 100, 188, ft.alpha);
    text(ft.text, ft.x, ft.y);
    pop();

    for (let s of ft.sparkles) {
      push();
      noStroke();
      fill(255, 255, 255, s.alpha);
      ellipse(ft.x + s.xOff, ft.y + s.yOff, s.size);
      pop();

      s.yOff -= 0.2;
      s.alpha -= 5;
    }

    ft.y -= 0.6;
    ft.alpha -= 4;
    ft.lifespan--;

    if (ft.lifespan <= 0 || ft.alpha <= 0) {
      floatingTexts.splice(i, 1);
    }
  }
}

// ------------------------------------------------------------
// ENDING SCENE DRAW
// ------------------------------------------------------------
function drawEndingScene() {
  if (!endingActive) return;

  endingFade = map(millis() - endingStartTime, 0, 1500, 0, 255);
  endingFade = constrain(endingFade, 0, 255);

  fill(0, endingFade * 0.6);
  rect(0, 0, width, height);

  push();
  tint(255, endingFade);
  imageMode(CENTER);
  image(endingGif, width / 2, height / 2, width, height);
  pop();

  push();
  textAlign(CENTER, CENTER);
  textSize(60);
  fill(255, 87, 179, endingFade);
  stroke(255, endingFade);
  strokeWeight(4);
  text("Snowball is happy!", width / 2, height / 2 - 230);
  pop();

  if (endingFade === 255) {
    drawPlayAgainButton();
  }
}

// ------------------------------------------------------------
// PLAY AGAIN BUTTON
// ------------------------------------------------------------
function drawPlayAgainButton() {
  let bx = width / 2;
  let by = height / 2 + 200;

  fill(255, 200, 220, 290);
  stroke(255);
  strokeWeight(2);
  rectMode(CENTER);
  rect(bx, by, 200, 60, 20);

  fill(255);
  noStroke();
  textSize(26);
  textAlign(CENTER, CENTER);
  text("Play Again", bx, by);
}

// ------------------------------------------------------------
// RESET GAME
// ------------------------------------------------------------
function resetGame() {
  endingActive = false;
  endingFade = 0;

  inv.yarn.collected = false;
  inv.mushroom.collected = false;
  inv.sardines.collected = false;

  itemsCollected = 0;

  floatingTexts = [];
  confetti = [];

  invSlideX = -200;

  if (sfxFinish) sfxFinish.stop();
}

// ------------------------------------------------------------
// EASING FUNCTION
// ------------------------------------------------------------
function easeOutBack(t) {
  let c1 = 1.70158;
  let c3 = c1 + 1
}