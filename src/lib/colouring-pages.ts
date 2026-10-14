/**
 * Original kids colouring-page SVGs — thick outlines, simple shapes.
 * All artwork is generated from scratch (no third-party sources).
 */

type Stroke = { fill?: string; stroke?: string; sw?: number };

function svg(w: number, h: number, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#FFFFFF"/>
  ${body}
</svg>`;
}

function path(d: string, s: Stroke = {}): string {
  const fill = s.fill ?? "none";
  const stroke = s.stroke ?? "#1a1a1a";
  const sw = s.sw ?? 6;
  return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function circle(cx: number, cy: number, r: number, s: Stroke = {}): string {
  const fill = s.fill ?? "none";
  const stroke = s.stroke ?? "#1a1a1a";
  const sw = s.sw ?? 6;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}

function ellipse(cx: number, cy: number, rx: number, ry: number, s: Stroke = {}): string {
  const fill = s.fill ?? "none";
  const stroke = s.stroke ?? "#1a1a1a";
  const sw = s.sw ?? 6;
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}

function line(x1: number, y1: number, x2: number, y2: number, s: Stroke = {}): string {
  const stroke = s.stroke ?? "#1a1a1a";
  const sw = s.sw ?? 6;
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>`;
}

// ---------- individual colouring pages (800x1000, US Letter-ish portrait) ----------

function catPage(): string {
  return svg(800, 1000, `
  ${circle(400, 420, 200)}
  ${path("M 220 300 Q 200 180 260 220 Q 300 260 320 320 Z")}
  ${path("M 580 300 Q 600 180 540 220 Q 500 260 480 320 Z")}
  ${circle(330, 390, 30)}
  ${circle(470, 390, 30)}
  ${circle(330, 390, 12, { fill: "#1a1a1a", sw: 0 })}
  ${circle(470, 390, 12, { fill: "#1a1a1a", sw: 0 })}
  ${path("M 380 450 Q 400 470 420 450")}
  ${path("M 400 470 L 400 500")}
  ${path("M 400 500 Q 370 530 340 500")}
  ${path("M 400 500 Q 430 530 460 500")}
  ${line(280, 450, 180, 430)}
  ${line(280, 470, 180, 470)}
  ${line(280, 490, 180, 510)}
  ${line(520, 450, 620, 430)}
  ${line(520, 470, 620, 470)}
  ${line(520, 490, 620, 510)}
  ${ellipse(400, 720, 170, 130)}
  ${path("M 250 700 Q 180 780 220 850")}
  ${path("M 550 700 Q 620 780 580 850")}
  ${path("M 340 840 Q 340 920 300 920 Q 260 920 260 840")}
  ${path("M 460 840 Q 460 920 500 920 Q 540 920 540 840")}
  <text x="400" y="970" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#1a1a1a">Colour me in!</text>`);
}

function dogPage(): string {
  return svg(800, 1000, `
  ${ellipse(400, 400, 190, 170)}
  ${ellipse(250, 300, 70, 110)}
  ${ellipse(550, 300, 70, 110)}
  ${circle(330, 370, 28)}
  ${circle(470, 370, 28)}
  ${circle(330, 370, 11, { fill: "#1a1a1a", sw: 0 })}
  ${circle(470, 370, 11, { fill: "#1a1a1a", sw: 0 })}
  ${ellipse(400, 440, 40, 30)}
  ${circle(400, 440, 14, { fill: "#1a1a1a", sw: 0 })}
  ${path("M 400 470 Q 400 510 360 520")}
  ${path("M 400 470 Q 400 510 440 520")}
  ${path("M 280 540 Q 250 620 300 700")}
  ${path("M 520 540 Q 550 620 500 700")}
  ${ellipse(400, 750, 160, 140)}
  ${path("M 300 870 Q 280 950 240 940")}
  ${path("M 500 870 Q 520 950 560 940")}
  ${path("M 350 880 Q 350 960 310 955")}
  ${path("M 450 880 Q 450 960 490 955")}
  ${path("M 540 740 Q 640 700 650 780 Q 660 840 580 820")}
  <text x="400" y="980" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#1a1a1a">Colour me in!</text>`);
}

function butterflyPage(): string {
  return svg(800, 1000, `
  ${ellipse(400, 480, 30, 180)}
  ${circle(400, 280, 50)}
  ${path("M 375 240 Q 340 160 310 140")}
  ${path("M 425 240 Q 460 160 490 140")}
  ${circle(305, 135, 14)}
  ${circle(495, 135, 14)}
  ${path("M 370 380 Q 120 200 80 380 Q 40 520 200 520 Q 340 520 370 460 Z")}
  ${path("M 430 380 Q 680 200 720 380 Q 760 520 600 520 Q 460 520 430 460 Z")}
  ${path("M 370 540 Q 160 560 140 700 Q 120 820 280 780 Q 360 760 370 680 Z")}
  ${path("M 430 540 Q 640 560 660 700 Q 680 820 520 780 Q 440 760 430 680 Z")}
  ${circle(220, 360, 40)}
  ${circle(580, 360, 40)}
  ${circle(240, 660, 30)}
  ${circle(560, 660, 30)}
  ${path("M 385 650 Q 385 720 360 730")}
  ${path("M 415 650 Q 415 720 440 730")}
  <text x="400" y="960" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#1a1a1a">Colour me in!</text>`);
}

function fishPage(): string {
  return svg(800, 1000, `
  ${ellipse(380, 450, 230, 160)}
  ${path("M 600 380 Q 740 300 760 450 Q 740 600 600 520 Z")}
  ${circle(280, 410, 32)}
  ${circle(280, 410, 13, { fill: "#1a1a1a", sw: 0 })}
  ${path("M 200 470 Q 240 500 200 530")}
  ${path("M 300 300 Q 360 240 420 300")}
  ${path("M 300 600 Q 360 660 420 600")}
  ${circle(430, 420, 28)}
  ${circle(500, 480, 24)}
  ${circle(430, 520, 20)}
  ${path("M 100 700 Q 200 650 300 700 Q 400 750 500 700 Q 600 650 700 700")}
  ${path("M 60 780 Q 160 730 260 780 Q 360 830 460 780 Q 560 730 660 780 Q 720 810 760 780")}
  ${circle(150, 200, 20)}
  ${circle(220, 150, 14)}
  ${circle(650, 220, 18)}
  <text x="400" y="960" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#1a1a1a">Colour me in!</text>`);
}

function flowerPage(): string {
  return svg(800, 1000, `
  ${circle(400, 380, 80)}
  ${circle(400, 240, 70)}
  ${circle(400, 520, 70)}
  ${circle(260, 380, 70)}
  ${circle(540, 380, 70)}
  ${circle(300, 280, 65)}
  ${circle(500, 280, 65)}
  ${circle(300, 480, 65)}
  ${circle(500, 480, 65)}
  ${circle(400, 380, 40)}
  ${circle(385, 365, 10, { fill: "#1a1a1a", sw: 0 })}
  ${circle(415, 365, 10, { fill: "#1a1a1a", sw: 0 })}
  ${path("M 380 400 Q 400 420 420 400")}
  ${line(400, 590, 400, 880)}
  ${path("M 400 700 Q 280 640 250 700 Q 280 760 400 720")}
  ${path("M 400 780 Q 520 720 550 780 Q 520 840 400 800")}
  ${circle(150, 180, 30)}
  ${circle(650, 180, 30)}
  ${circle(120, 700, 24)}
  ${circle(680, 700, 24)}
  <text x="400" y="960" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#1a1a1a">Colour me in!</text>`);
}

function carPage(): string {
  return svg(800, 1000, `
  ${path("M 120 500 Q 120 420 200 420 L 260 420 Q 300 320 400 320 Q 500 320 540 420 L 620 420 Q 700 420 700 500 L 700 580 Q 700 620 660 620 L 160 620 Q 120 620 120 580 Z")}
  ${path("M 280 420 Q 310 350 400 350 Q 490 350 520 420 Z")}
  ${line(400, 350, 400, 420)}
  ${circle(240, 640, 70)}
  ${circle(240, 640, 40)}
  ${circle(560, 640, 70)}
  ${circle(560, 640, 40)}
  ${circle(170, 520, 24)}
  ${circle(650, 520, 24)}
  ${line(140, 560, 200, 560)}
  ${line(620, 560, 680, 560)}
  <text x="400" y="800" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#1a1a1a">Colour me in!</text>`);
}

function housePage(): string {
  return svg(800, 1000, `
  ${path("M 160 480 L 400 280 L 640 480 Z")}
  ${path("M 220 480 L 220 800 L 580 800 L 580 480 Z")}
  ${rect(340, 620, 120, 180, 0)}
  ${circle(430, 710, 10, { fill: "#1a1a1a", sw: 0 })}
  ${rect(260, 540, 90, 90, 0)}
  ${line(305, 540, 305, 630)}
  ${line(260, 585, 350, 585)}
  ${rect(450, 540, 90, 90, 0)}
  ${line(495, 540, 495, 630)}
  ${line(450, 585, 540, 585)}
  ${path("M 540 340 L 540 260 L 590 260 L 590 390")}
  ${circle(400, 180, 40)}
  ${line(400, 120, 400, 100)}
  ${line(400, 240, 400, 260)}
  ${line(340, 180, 320, 180)}
  ${line(460, 180, 480, 180)}
  <text x="400" y="900" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#1a1a1a">Colour me in!</text>`);
}

function unicornPage(): string {
  return svg(800, 1000, `
  ${ellipse(380, 500, 180, 150)}
  ${ellipse(380, 310, 130, 120)}
  ${path("M 350 210 L 380 100 L 410 210 Z")}
  ${line(365, 180, 395, 180)}
  ${line(360, 160, 400, 160)}
  ${line(355, 140, 405, 140)}
  ${path("M 290 230 Q 250 140 220 130")}
  ${path("M 320 220 Q 300 130 270 110")}
  ${circle(330, 300, 22)}
  ${circle(330, 300, 9, { fill: "#1a1a1a", sw: 0 })}
  ${path("M 280 350 Q 310 370 340 350")}
  ${path("M 500 430 Q 620 380 640 480 Q 660 580 540 560")}
  ${path("M 220 560 Q 160 640 200 740")}
  ${path("M 540 560 Q 600 640 560 740")}
  ${path("M 280 640 Q 280 720 240 730")}
  ${path("M 480 640 Q 480 720 520 730")}
  ${path("M 320 650 Q 320 740 280 750")}
  ${path("M 440 650 Q 440 740 480 750")}
  ${circle(150, 200, 24)}
  ${circle(650, 240, 20)}
  ${circle(130, 500, 16)}
  ${circle(680, 500, 16)}
  <text x="400" y="900" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#1a1a1a">Colour me in!</text>`);
}

function treePage(): string {
  return svg(800, 1000, `
  ${path("M 340 620 L 340 850 L 460 850 L 460 620 Z")}
  ${path("M 200 620 Q 100 500 200 400 Q 160 300 280 260 Q 280 160 400 140 Q 520 160 520 260 Q 640 300 600 400 Q 700 500 600 620 Z")}
  ${circle(300, 350, 24)}
  ${circle(500, 350, 24)}
  ${circle(400, 280, 20)}
  ${circle(250, 480, 20)}
  ${circle(550, 480, 20)}
  ${circle(400, 450, 28)}
  ${circle(150, 850, 40)}
  ${circle(650, 850, 40)}
  ${circle(100, 900, 28)}
  ${circle(700, 900, 28)}
  ${line(380, 850, 380, 900)}
  <text x="400" y="960" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#1a1a1a">Colour me in!</text>`);
}

function heartPage(): string {
  return svg(800, 1000, `
  ${path("M 400 750 Q 100 520 150 320 Q 190 180 320 200 Q 400 210 400 300 Q 400 210 480 200 Q 610 180 650 320 Q 700 520 400 750 Z")}
  ${circle(300, 350, 22)}
  ${circle(500, 350, 22)}
  ${path("M 340 430 Q 400 490 460 430")}
  ${circle(150, 150, 30)}
  ${circle(650, 150, 30)}
  ${circle(100, 700, 24)}
  ${circle(700, 700, 24)}
  ${circle(200, 850, 18)}
  ${circle(600, 850, 18)}
  ${circle(400, 880, 24)}
  <text x="400" y="960" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#1a1a1a">Colour me in!</text>`);
}

function starPage(): string {
  return svg(800, 1000, `
  ${path("M 400 150 L 470 350 L 680 350 L 510 470 L 575 680 L 400 560 L 225 680 L 290 470 L 120 350 L 330 350 Z")}
  ${circle(340, 360, 20)}
  ${circle(460, 360, 20)}
  ${path("M 360 420 Q 400 460 440 420")}
  ${circle(120, 150, 22)}
  ${circle(680, 150, 22)}
  ${circle(100, 750, 18)}
  ${circle(700, 750, 18)}
  ${circle(200, 880, 16)}
  ${circle(600, 880, 16)}
  ${circle(400, 850, 20)}
  <text x="400" y="960" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#1a1a1a">Colour me in!</text>`);
}

function airplanePage(): string {
  return svg(800, 1000, `
  ${ellipse(400, 480, 280, 70)}
  ${path("M 120 480 Q 60 480 60 460 Q 60 440 120 440")}
  ${circle(160, 460, 22)}
  ${circle(220, 460, 22)}
  ${circle(280, 460, 22)}
  ${path("M 380 410 L 340 240 L 420 240 L 460 410 Z")}
  ${path("M 380 550 L 340 700 L 420 700 L 460 550 Z")}
  ${path("M 640 420 L 720 300 L 760 300 L 700 440 Z")}
  ${path("M 640 540 L 720 640 L 760 640 L 700 530 Z")}
  ${circle(680, 460, 16)}
  ${path("M 100 800 Q 200 760 300 800 Q 400 840 500 800 Q 600 760 700 800")}
  <text x="400" y="920" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#1a1a1a">Colour me in!</text>`);
}

function rocketPage(): string {
  return svg(800, 1000, `
  ${path("M 400 120 Q 500 260 500 480 L 300 480 Q 300 260 400 120 Z")}
  ${circle(400, 340, 50)}
  ${circle(400, 340, 30)}
  ${path("M 300 400 L 200 520 L 300 500 Z")}
  ${path("M 500 400 L 600 520 L 500 500 Z")}
  ${path("M 340 480 L 320 580 L 400 520 L 480 580 L 460 480 Z")}
  ${path("M 360 600 Q 340 700 320 760")}
  ${path("M 400 600 Q 400 720 400 800")}
  ${path("M 440 600 Q 460 700 480 760")}
  ${circle(150, 180, 20)}
  ${circle(650, 180, 20)}
  ${circle(120, 400, 16)}
  ${circle(680, 400, 16)}
  ${circle(650, 700, 22)}
  ${circle(160, 700, 22)}
  <text x="400" y="920" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#1a1a1a">Colour me in!</text>`);
}

function trainPage(): string {
  return svg(800, 1000, `
  ${rect(100, 400, 280, 200, 14)}
  ${rect(120, 340, 120, 80, 8)}
  ${circle(160, 300, 30)}
  ${rect(400, 440, 240, 160, 12)}
  ${rect(420, 460, 80, 70, 6)}
  ${rect(530, 460, 80, 70, 6)}
  ${circle(170, 640, 55)}
  ${circle(170, 640, 28)}
  ${circle(310, 640, 55)}
  ${circle(310, 640, 28)}
  ${circle(470, 640, 55)}
  ${circle(470, 640, 28)}
  ${circle(600, 640, 55)}
  ${circle(600, 640, 28)}
  ${line(80, 700, 720, 700)}
  ${line(80, 730, 720, 730)}
  ${line(150, 700, 150, 730)}
  ${line(250, 700, 250, 730)}
  ${line(350, 700, 350, 730)}
  ${line(450, 700, 450, 730)}
  ${line(550, 700, 550, 730)}
  ${line(650, 700, 650, 730)}
  ${circle(200, 200, 30)}
  ${circle(300, 160, 22)}
  <text x="400" y="860" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#1a1a1a">Colour me in!</text>`);
}

function iceCreamPage(): string {
  return svg(800, 1000, `
  ${path("M 300 400 L 400 750 L 500 400 Z")}
  ${line(330, 500, 470, 500)}
  ${line(350, 580, 450, 580)}
  ${line(370, 660, 430, 660)}
  ${circle(340, 340, 90)}
  ${circle(460, 340, 90)}
  ${circle(400, 260, 90)}
  ${path("M 400 170 Q 420 130 450 140 Q 470 100 500 130")}
  ${circle(400, 120, 22)}
  ${circle(150, 200, 26)}
  ${circle(650, 200, 26)}
  ${circle(120, 500, 20)}
  ${circle(680, 500, 20)}
  <text x="400" y="880" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#1a1a1a">Colour me in!</text>`);
}

function elephantPage(): string {
  return svg(800, 1000, `
  ${ellipse(400, 450, 200, 180)}
  ${ellipse(400, 280, 150, 130)}
  ${ellipse(240, 260, 80, 110)}
  ${ellipse(560, 260, 80, 110)}
  ${circle(340, 260, 24)}
  ${circle(460, 260, 24)}
  ${circle(340, 260, 10, { fill: "#1a1a1a", sw: 0 })}
  ${circle(460, 260, 10, { fill: "#1a1a1a", sw: 0 })}
  ${path("M 400 340 Q 400 480 370 540 Q 350 580 380 590 Q 410 600 420 560")}
  ${path("M 240 500 Q 160 600 200 740")}
  ${path("M 560 500 Q 640 600 600 740")}
  ${path("M 300 600 Q 300 720 260 740")}
  ${path("M 500 600 Q 500 720 540 740")}
  ${path("M 340 620 Q 340 750 300 760")}
  ${path("M 460 620 Q 460 750 500 760")}
  ${path("M 580 400 Q 680 380 690 460 Q 700 520 620 500")}
  <text x="400" y="900" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#1a1a1a">Colour me in!</text>`);
}

function sunPage(): string {
  return svg(800, 1000, `
  ${circle(400, 400, 160)}
  ${circle(340, 370, 24)}
  ${circle(460, 370, 24)}
  ${circle(340, 370, 10, { fill: "#1a1a1a", sw: 0 })}
  ${circle(460, 370, 10, { fill: "#1a1a1a", sw: 0 })}
  ${path("M 340 450 Q 400 510 460 450")}
  ${line(400, 180, 400, 100)}
  ${line(400, 620, 400, 700)}
  ${line(180, 400, 100, 400)}
  ${line(620, 400, 700, 400)}
  ${line(245, 245, 190, 190)}
  ${line(555, 245, 610, 190)}
  ${line(245, 555, 190, 610)}
  ${line(555, 555, 610, 610)}
  ${line(400, 180, 400, 240)}
  ${circle(150, 750, 30)}
  ${circle(650, 750, 30)}
  ${circle(250, 820, 22)}
  ${circle(550, 820, 22)}
  ${circle(400, 800, 26)}
  <text x="400" y="920" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#1a1a1a">Colour me in!</text>`);
}

function birdPage(): string {
  return svg(800, 1000, `
  ${ellipse(400, 450, 170, 140)}
  ${circle(400, 280, 100)}
  ${circle(360, 260, 20)}
  ${circle(360, 260, 8, { fill: "#1a1a1a", sw: 0 })}
  ${path("M 300 300 L 220 290 L 300 320 Z")}
  ${path("M 320 380 Q 200 340 160 440 Q 140 520 280 500 Z")}
  ${path("M 480 380 Q 600 340 640 440 Q 660 520 520 500 Z")}
  ${path("M 340 580 Q 320 680 280 700")}
  ${path("M 400 590 Q 400 700 400 730")}
  ${path("M 460 580 Q 480 680 520 700")}
  ${line(260, 720, 240, 760)}
  ${line(280, 720, 280, 760)}
  ${line(520, 720, 520, 760)}
  ${line(540, 720, 560, 760)}
  ${circle(150, 180, 22)}
  ${circle(650, 180, 22)}
  ${circle(650, 700, 18)}
  <text x="400" y="900" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#1a1a1a">Colour me in!</text>`);
}

function rabbitPage(): string {
  return svg(800, 1000, `
  ${ellipse(400, 480, 160, 140)}
  ${ellipse(400, 300, 120, 110)}
  ${ellipse(320, 150, 40, 110)}
  ${ellipse(480, 150, 40, 110)}
  ${ellipse(320, 160, 22, 80)}
  ${ellipse(480, 160, 22, 80)}
  ${circle(350, 290, 20)}
  ${circle(450, 290, 20)}
  ${circle(350, 290, 8, { fill: "#1a1a1a", sw: 0 })}
  ${circle(450, 290, 8, { fill: "#1a1a1a", sw: 0 })}
  ${ellipse(400, 340, 18, 14)}
  ${path("M 400 354 Q 380 380 360 370")}
  ${path("M 400 354 Q 420 380 440 370")}
  ${line(310, 340, 250, 320)}
  ${line(310, 355, 250, 355)}
  ${line(490, 340, 550, 320)}
  ${line(490, 355, 550, 355)}
  ${path("M 260 500 Q 180 580 220 700")}
  ${path("M 540 500 Q 620 580 580 700")}
  ${path("M 320 610 Q 320 720 280 740")}
  ${path("M 480 610 Q 480 720 520 740")}
  ${path("M 360 620 Q 360 740 320 760")}
  ${path("M 440 620 Q 440 740 480 760")}
  ${circle(560, 600, 36)}
  <text x="400" y="900" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#1a1a1a">Colour me in!</text>`);
}

function turtlePage(): string {
  return svg(800, 1000, `
  ${ellipse(400, 460, 220, 170)}
  ${path("M 220 460 Q 260 360 400 340 Q 540 360 580 460")}
  ${circle(400, 400, 50)}
  ${circle(330, 440, 40)}
  ${circle(470, 440, 40)}
  ${circle(400, 520, 40)}
  ${circle(620, 400, 60)}
  ${circle(640, 385, 14)}
  ${circle(640, 385, 6, { fill: "#1a1a1a", sw: 0 })}
  ${path("M 600 420 Q 630 440 660 420")}
  ${ellipse(240, 600, 50, 35)}
  ${ellipse(560, 600, 50, 35)}
  ${ellipse(280, 300, 50, 35)}
  ${ellipse(520, 300, 50, 35)}
  ${path("M 180 460 Q 120 440 100 460 Q 120 480 180 470")}
  <text x="400" y="800" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#1a1a1a">Colour me in!</text>`);
}

function ladybugPage(): string {
  return svg(800, 1000, `
  ${circle(400, 480, 200)}
  ${circle(400, 260, 110)}
  ${circle(350, 240, 22)}
  ${circle(450, 240, 22)}
  ${circle(350, 240, 9, { fill: "#1a1a1a", sw: 0 })}
  ${circle(450, 240, 9, { fill: "#1a1a1a", sw: 0 })}
  ${line(400, 350, 400, 680)}
  ${circle(310, 420, 36)}
  ${circle(490, 420, 36)}
  ${circle(280, 540, 30)}
  ${circle(520, 540, 30)}
  ${circle(340, 620, 26)}
  ${circle(460, 620, 26)}
  ${path("M 340 170 Q 310 100 280 90")}
  ${path("M 460 170 Q 490 100 520 90")}
  ${circle(275, 85, 14)}
  ${circle(525, 85, 14)}
  ${ellipse(200, 620, 40, 28)}
  ${ellipse(600, 620, 40, 28)}
  ${ellipse(240, 720, 40, 28)}
  ${ellipse(560, 720, 40, 28)}
  <text x="400" y="860" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#1a1a1a">Colour me in!</text>`);
}

function penguinPage(): string {
  return svg(800, 1000, `
  ${ellipse(400, 480, 190, 230)}
  ${ellipse(400, 530, 130, 170)}
  ${circle(400, 260, 130)}
  ${circle(350, 240, 24)}
  ${circle(450, 240, 24)}
  ${circle(350, 240, 10, { fill: "#1a1a1a", sw: 0 })}
  ${circle(450, 240, 10, { fill: "#1a1a1a", sw: 0 })}
  ${path("M 380 300 L 400 330 L 420 300 Z")}
  ${ellipse(210, 480, 50, 100)}
  ${ellipse(590, 480, 50, 100)}
  ${ellipse(320, 730, 60, 30)}
  ${ellipse(480, 730, 60, 30)}
  ${circle(150, 180, 22)}
  ${circle(650, 180, 22)}
  <text x="400" y="880" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#1a1a1a">Colour me in!</text>`);
}

function owlPage(): string {
  return svg(800, 1000, `
  ${ellipse(400, 480, 180, 230)}
  ${circle(320, 340, 80)}
  ${circle(480, 340, 80)}
  ${circle(320, 340, 40)}
  ${circle(480, 340, 40)}
  ${circle(320, 340, 16, { fill: "#1a1a1a", sw: 0 })}
  ${circle(480, 340, 16, { fill: "#1a1a1a", sw: 0 })}
  ${path("M 380 400 L 400 440 L 420 400 Z")}
  ${path("M 260 240 L 300 160 L 340 250")}
  ${path("M 460 250 L 500 160 L 540 240")}
  ${path("M 260 480 Q 200 560 240 700")}
  ${path("M 540 480 Q 600 560 560 700")}
  ${line(340, 720, 340, 780)}
  ${line(400, 720, 400, 780)}
  ${line(460, 720, 460, 780)}
  ${ellipse(320, 790, 40, 20)}
  ${ellipse(400, 790, 40, 20)}
  ${ellipse(480, 790, 40, 20)}
  ${circle(400, 560, 30)}
  ${circle(370, 620, 24)}
  ${circle(430, 620, 24)}
  ${circle(400, 670, 20)}
  <text x="400" y="920" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#1a1a1a">Colour me in!</text>`);
}

// helpers used above
function rect(x: number, y: number, w: number, h: number, rx: number, s: Stroke = {}): string {
  const fill = s.fill ?? "none";
  const stroke = s.stroke ?? "#1a1a1a";
  const sw = s.sw ?? 6;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}

// public API
export type ColouringKey =
  | "cat" | "dog" | "butterfly" | "fish" | "flower" | "car" | "house"
  | "unicorn" | "tree" | "heart" | "star" | "airplane" | "rocket" | "train"
  | "ice-cream" | "elephant" | "sun" | "bird" | "rabbit" | "turtle"
  | "ladybug" | "penguin" | "owl";

const PAGES: Record<ColouringKey, () => string> = {
  cat: catPage,
  dog: dogPage,
  butterfly: butterflyPage,
  fish: fishPage,
  flower: flowerPage,
  car: carPage,
  house: housePage,
  unicorn: unicornPage,
  tree: treePage,
  heart: heartPage,
  star: starPage,
  airplane: airplanePage,
  rocket: rocketPage,
  train: trainPage,
  "ice-cream": iceCreamPage,
  elephant: elephantPage,
  sun: sunPage,
  bird: birdPage,
  rabbit: rabbitPage,
  turtle: turtlePage,
  ladybug: ladybugPage,
  penguin: penguinPage,
  owl: owlPage,
};

export const COLOURING_KEYS = Object.keys(PAGES) as ColouringKey[];

export function buildColouringSvg(key: ColouringKey): string {
  return PAGES[key]();
}

/** Pick a deterministic set of page keys for a product (seeded by index). */
export function pickPages(seedIndex: number, count: number): ColouringKey[] {
  const out: ColouringKey[] = [];
  for (let i = 0; i < count; i++) {
    out.push(COLOURING_KEYS[(seedIndex * 3 + i * 7) % COLOURING_KEYS.length]);
  }
  return out;
}
