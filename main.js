const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

persistent_hexes = undefined;

//Wrapperclass for hex with Orientation
class HexO {
  constructor(q, r, s) {
    Hex(q, r, s);
    this.q = q;
    this.r = r;
    this.s = s;
  }
  q;
  r;
  s;
  orientation = 1;

  rotate() {
    this.orientation = parseInt((parseInt(this.orientation) % 3) + 1);
  }
}

function init() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawHexgrid();
}
init();

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawHexgrid();
});

function drawHexgrid() {
  const L = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, L, H);

  const R = 30.0;
  const size = Point(R, R);
  const origin = Point(-0.25 * R, -0.25 * R);

  var myLayout = Layout(layout_pointy, size, origin);

  // collect corner coordinates
  TL = pixel_to_hex(myLayout, Point(0, 0));
  BR = pixel_to_hex(myLayout, Point(L, H));
  BL = pixel_to_hex(myLayout, Point(0, H));

  dY = hex_distance(TL, BL);
  dX = hex_distance(BL, BR);

  const left = 0;
  const right = dX + 1;
  const top = 0;
  const bottom = dY + 1;

  if (!persistent_hexes) {
    console.log("Creating initial Hexes");
    var myHexes = [];
    for (var r = top; r <= bottom; r++) {
      // pointy top
      const r_offset = Math.floor(r / 2.0); // or r>>1
      for (var q = left - r_offset; q <= right - r_offset; q++) {
        myHexes.push(new HexO(q, r, -q - r, 1));
      }
    }
    persistent_hexes = myHexes;
  }

  for (i in persistent_hexes) {
    drawHexagon(myLayout, persistent_hexes[i], R);
  }

  //register EventListener
  canvas.addEventListener(
    "click",
    function onCanvasClick(event) {
      var p = new Point(event.pageX, event.pageY);
      hex = pixel_to_hex(myLayout, p);
      for (var i in persistent_hexes) {
        temp = persistent_hexes[i]
        if (temp.q == Math.round(hex.q) && temp.r == Math.round(hex.r)) {
          console.log("rotating")
          temp.rotate();
          persistent_hexes[i] = temp
          drawHexagon(myLayout, temp, R, true);
        }
      }
    },
    false
  );
}

function mod(n, m) {
  return ((n % m) + m) % m;
}

function myPseudorandom(hex) {
  var x = hex.q;
  var y = hex.r;
  x = x * 3266489917 + 374761393;
  x = (x << 17) | (x >> 15);
  x += y * 3266489917;
  x *= 668265263;
  x ^= x >> 15;
  x *= 2246822519;
  x ^= x >> 13;
  x *= 3266489917;
  x ^= x >> 16;
  return (x % 3) + 1;
}

function myTriangles(hex) {
  var cs = "3";
  if (hex.r % 2 == 0) {
    if (hex.r % 4 == 0) {
      cs = hex.q % 2 ? "2" : "1";
    } else {
      cs = hex.q % 2 ? "2" : "1";
    }
  } else {
    var col = hex.q + (hex.r + (hex.r & 1)) / 2;
    offset = hex.r % 4 == 1 ? 3 : 0;
    temp = mod(col, 6) + offset;
    switch (temp) {
      case 0:
      case 1:
      case 2:
      case 4:
        cs = 3;
        break;
      case 3:
        cs = 2;
        break;
      case 5:
        cs = 1;
        break;
    }
  }
  return cs;
}

function drawHexagon(layout, hex, R, keepPattern) {
  const corners = polygon_corners(layout, hex);
  var center = hex_to_pixel(layout, hex);

  var checkBox = document.getElementById("showhex");
  if (checkBox.checked == true) {
    ctx.beginPath();
    ctx.lineWidth = 1.25;
    for (const corner in corners) {
      ctx.lineTo(corners[corner].x, corners[corner].y);
    }
    ctx.closePath();
    ctx.fillStyle = "white"
    ctx.fill()
    ctx.stroke();
  }

  ctx.beginPath();
  for (const corner in corners) {
    ctx.lineTo(corners[corner].x, corners[corner].y);
  }
  ctx.closePath();
  ctx.fillStyle = "white"
  ctx.fill()

  pattern = document.getElementById("selectpattern").value;

  if (!keepPattern) {
    switch (pattern) {
      case "triangles":
        hex.orientation = myTriangles(hex);
        break;
      case "random":
        hex.orientation = Math.floor(Math.random() * 3 + 1);
        break;
      case "pseudorandom":
        hex.orientation = myPseudorandom(hex);
        break;
    }
  } 

  switch (hex.orientation.toString()) {
    case "1":
      i1 = 0;
      i2 = 4;
      i3 = 5;
      i4 = 1;
      i5 = 2;
      i6 = 3;
      alpha = (150 / 360) * 2 * Math.PI;
      break;
    case "2":
      i1 = 4;
      i2 = 2;
      i3 = 3;
      i4 = 5;
      i5 = 0;
      i6 = 1;
      alpha = ((150 + 120) / 360) * 2 * Math.PI;
      break;
    case "3":
      i1 = 2;
      i2 = 0;
      i3 = 1;
      i4 = 3;
      i5 = 4;
      i6 = 5;
      alpha = ((150 + 240) / 360) * 2 * Math.PI;
      break;
  }

  ctx.beginPath();
  ctx.lineTo(
    0.5 * corners[i4].x + 0.5 * corners[i5].x,
    0.5 * corners[i4].y + 0.5 * corners[i5].y
  );
  ctx.lineTo(corners[i5].x, corners[i5].y);
  ctx.arc(
    corners[i6].x,
    corners[i6].y,
    R / 2,
    alpha + (180 / 360) * 2 * Math.PI,
    alpha + (300 / 360) * 2 * Math.PI
  );
  ctx.lineTo(corners[i2].x, corners[i2].y);
  ctx.lineTo(
    0.5 * corners[i2].x + 0.5 * corners[i3].x,
    0.5 * corners[i2].y + 0.5 * corners[i3].y
  );
  ctx.fillStyle = "orange";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(corners[i1].x, corners[i1].y);
  ctx.arc(
    corners[i1].x,
    corners[i1].y,
    R / 2,
    alpha,
    alpha + (120 / 360) * 2 * Math.PI
  );
  ctx.fillStyle = "orange";
  ctx.fill();
  // ctx.stroke();
}




