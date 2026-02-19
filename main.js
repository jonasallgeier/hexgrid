const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

persistent_hexes = undefined;
myLayout = undefined;
dX = 0
dY = 0


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
  drawHexgrid(true);
}
init();
let resizeTimeout;
window.addEventListener("resize", () => {
  // Clear any previous pending timeout
  clearTimeout(resizeTimeout);
  // Set a new one
  resizeTimeout = setTimeout(() => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawHexgrid(true);
  }, 50);
});

function hex_size() {
  const L = canvas.width;
  const H = canvas.height;

  var hexsize = parseFloat(document.getElementById("sizeslider").value);
  const R = 0.05*Math.min(L,H)*2**hexsize;
  return R  
}

function drawHexgrid(reset) {
  const L = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, L, H);

  const R = hex_size();
  const size = Point(R, R);
  const origin = Point(-0.25 * R + L/2, -0.25 * R+H/2);

  myLayout = Layout(layout_pointy, size, origin);

  // collect corner coordinates
  TL = pixel_to_hex(myLayout, Point(0, 0));
  BR = pixel_to_hex(myLayout, Point(L, H));
  BL = pixel_to_hex(myLayout, Point(0, H));

  dY = hex_distance(TL, BL);
  dX = hex_distance(BL, BR);

  const left = Math.floor(-0.5*dX-1);
  const right = Math.ceil(0.5*dX + 1);
  const top = Math.floor(-0.5*dY-1);
  const bottom = Math.ceil(0.5*dY + 1);
  var keepPattern = true
  if (!persistent_hexes || reset) {
    console.log("redoing all hexes");
    var myHexes = [];
    for (var r = top; r <= bottom; r++) {
      // pointy top
      const r_offset = Math.floor(r / 2.0); // or r>>1
      for (var q = left - r_offset; q <= right - r_offset; q++) {
        myHexes.push(new HexO(q, r, -q - r, 1));
      }
    }
    persistent_hexes = myHexes;
    keepPattern = false
  }

  for (i in persistent_hexes) {
    drawHexagon(myLayout, persistent_hexes[i], keepPattern);
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
          temp.rotate();
          persistent_hexes[i] = temp
          drawHexagon(myLayout, temp, true);
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
  if (mod(hex.r, 2) == 0) {
    if (mod(hex.r,4) == 0) {
      cs = mod(hex.q,2) ? "2" : "1";
    } else {
      cs = mod(hex.q,2) ? "2" : "1";
    }
  } else {
    var col = hex.q + (hex.r + (hex.r & 1)) / 2;
    offset = mod(hex.r,4) == 1 ? 3 : 0;
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

function myTriPat(hex) {
  var cs = "1";
  var row = mod(hex.q,7)
  // cs = row+1
  var local = mod(hex.r+row*3,7)
  switch (local) {
    case 0:
      cs = 1;
      break;
    case 1:
      cs = mod(hex.q,3)*1+1; //x
      break;
    case 2:
      cs = 3;
      break;
    case 3:
      cs = 2;
      break;
    case 4:
      cs = 2;
      break;
    case 5:
      cs = 1;
      break;
    case 6:
      cs = 3;
      break;
  }

  return cs.toString();
}

function mySnake(hex) {
  var cs = 1;
  switch (mod(hex.r,2)) {
    case 0:
      cs = mod(hex.q,2) +2
      break
  }

  return cs;
}

function mySerpin(hex) {
  var cs = 3;

  var parity = mod(hex.r,2)
  var col = hex.q + (hex.r-parity)/2

  // TODO: turn iters into while loop; maybe find a closedform solution? copilot suggests the following for calc
  //  =1 + INT(LOG(A1 - BITAND(A1, A1-1), 2)) <-- allegedly solves Josephus problem and provides elimination round

  // ITER 1
  if (mod(hex.r,2) == 0) {
    if (mod(hex.q,2) == 0 ) {
      cs = 1
    } else {
      cs = 2
    }
    return cs
  }

  // ITER 2
  if ((mod(hex.r+1,4) == 0) && (mod(col,2) == 0 )) {
    if (mod(hex.q+1,4) == 0 ) {
      cs = 1
    } else {
      cs = 2
    }
    return cs
  }

  // ITER 3
  if ((mod(hex.r+3,8) == 0) && (mod(col+1,4) == 0 )) {
    if (mod(hex.q+3,8) == 0 ) {
      cs = 1
    } else {
      cs = 2
    }
    return cs
  }

  // ITER 4
  if ((mod(hex.r+7,16) == 0) && (mod(col+3,8) == 0 )) {
    if (mod(hex.q+7,16) == 0 ) {
      cs = 1
    } else {
      cs = 2
    }
    return cs
  }

  // ITER 5
  if ((mod(hex.r+15,32) == 0) && (mod(col+7,16) == 0 )) {
    if (mod(hex.q+15,32) == 0 ) {
      cs = 1
    } else {
      cs = 2
    }
    return cs
  }

  return cs;
}


function drawHexagon(layout, hex, keepPattern) {
  ctx.save();

  pattern = document.getElementById("selectpattern").value;
  const R = hex_size()
  if (!keepPattern) {
    switch (pattern) {
      case "triangles":
        hex.orientation = myTriangles(hex);
        break;
      case "tripat":
        hex.orientation = myTriPat(hex);
        break;
      case "tinytrias":
        hex.orientation = mod(hex.r+ mod(hex.q,3)*2,3)+1
        break
      case "single":
        if ((hex.r==0) && (hex.q==0)) {
          hex.orientation = 3
        } else {
          hex.orientation = 0
        }
        break
      case "serpin":
        hex.orientation = mySerpin(hex);
        break;
      case "snake":
        hex.orientation = mySnake(hex);
        break;
      case "random":
        hex.orientation = Math.floor(Math.random() * 3 + 1);
        break;
      case "pseudorandom":
        hex.orientation = myPseudorandom(hex);
        break;
    }
  }
  // draw no hex
  if (hex.orientation.toString() == "0") {
    ctx.restore()
    return
  }

  const corners = polygon_corners(layout, hex);
  var center = hex_to_pixel(layout, hex);

  switch (hex.orientation.toString()) {
    case "1":
      alpha = 120
      break;
    case "2":
      alpha = 240
      break;
    case "3":
      alpha = 0
      break;
  }

  ctx.translate(center.x,center.y)
  ctx.rotate(alpha * Math.PI / 180);
  ctx.lineWidth = 0.05*R;

  // draw a highlighted hex without orientation
  if (hex.orientation.toString() == "4") {
    ctx.beginPath();

    for (const corner of corners) {
      ctx.lineTo(corner.x-center.x, corner.y-center.y);
    }
    ctx.closePath();
    ctx.fillStyle = "red"
    ctx.fill()

    return
  }

  // draw the white hex
  ctx.beginPath();
  for (const corner of corners) {
    ctx.lineTo(corner.x-center.x, corner.y-center.y);
  }
  ctx.closePath();
  ctx.fillStyle = "white"
  ctx.fill()

  var showborder = document.getElementById("showhex").checked;
  ctx.beginPath();
  ctx.lineTo(-0.5*Math.sqrt(3)*R,0);
  ctx.lineTo(-0.5*Math.sqrt(3)*R,+0.5*R);
  ctx.lineTo(-0.25*Math.sqrt(3)*R,+0.75*R);
  ctx.arc(0,+R, R / 2,
    (210 / 360) * 2 * Math.PI,
    (330 / 360) * 2 * Math.PI,false
  );
  ctx.lineTo(0.25*Math.sqrt(3)*R,+0.75*R);
  ctx.lineTo(0.5*Math.sqrt(3)*R,+0.5*R);
  ctx.lineTo(0.5*Math.sqrt(3)*R,0);
  ctx.closePath()

  ctx.fillStyle = "orange";
  ctx.fill();
  ctx.strokeStyle = "orange";
  ctx.stroke();

  ctx.beginPath();
  ctx.lineTo(0,-R);
  ctx.arc(0,-R, R / 2,
    (30 / 360) * 2 * Math.PI,
    (150 / 360) * 2 * Math.PI,false
  );
  ctx.closePath()

  ctx.fillStyle = "orange";
  ctx.fill();
  ctx.strokeStyle = "orange";
  ctx.stroke();


  if (showborder) {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const corner of corners) {
      ctx.lineTo(corner.x-center.x, corner.y-center.y);
    }
    ctx.closePath();
    ctx.lineWidth = 0.1*R;
    ctx.strokeStyle = "black";
    ctx.stroke();
  }
  ctx.restore()
}

setInterval(() => {
  if ("random" == document.getElementById("selectpattern").value) {
    for (let tmp = 0; tmp < Math.ceil(0.01*persistent_hexes.length); tmp++) {
      var i = Math.floor(Math.random() * persistent_hexes.length)
      temp = persistent_hexes[i]
      temp.rotate();
      persistent_hexes[i] = temp    
    }
  drawHexgrid(false)
  }
}, 50000);

