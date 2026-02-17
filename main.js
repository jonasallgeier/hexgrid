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

function drawHexgrid(reset) {
  const L = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, L, H);

  const R = 30.0;
  const size = Point(R, R);
  const origin = Point(-0.25 * R + L/2, -0.25 * R+H/2);

  myLayout = Layout(layout_pointy, size, origin);

  // collect corner coordinates
  TL = pixel_to_hex(myLayout, Point(0, 0));
  BR = pixel_to_hex(myLayout, Point(L, H));
  BL = pixel_to_hex(myLayout, Point(0, H));

  dY = hex_distance(TL, BL);
  dX = hex_distance(BL, BR);

  console.log(dY)
  const left = Math.floor(-0.5*dX-1);
  const right = Math.ceil(0.5*dX + 1);
  const top = Math.floor(-0.5*dY-1);
  const bottom = Math.ceil(0.5*dY + 1);
  var keepPattern = true
  if (!persistent_hexes || reset) {
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
    keepPattern = false
  }

  for (i in persistent_hexes) {
    drawHexagon(myLayout, persistent_hexes[i], R,keepPattern);
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

  // if (hex.q == hex.s+1) {
  //   cs = 3
  //   return cs
  // }
  // if (hex.s == hex.r) {
  //   cs = 2
  //   return cs
  // }
  // if (hex.r == hex.q-1) {
  //   cs = 1
  //   return cs
  // }

  // if ((hex.q == hex.s+2) || (hex.q == hex.s) ) {
  //   cs = (1-mod(hex.q,2))+1
  //   return cs
  // }

  // if ((hex.s == hex.r-1)|| (hex.s == hex.r+1)) {
  //   if (mod(hex.r,2) == 1 ) {
  //     cs = 3
  //   } else {
  //     cs = 1
  //   }
  //   return cs
  // }
  // if ((hex.r == hex.q-2)|| (hex.r == hex.q)) {
  //   if (mod(hex.q,2) == 1 ) {
  //     cs = 3
  //   } else {
  //     cs = 2
  //   }
  //   return cs
  // }


  // var r = hex.r
  // var q = hex.q
  // var s = hex.s

  // var iter = 1

  // // JOSEPHUS problem
  // while (iter < 10)  {
  //   if (mod(r + 1,2*iter) == 0) {
  //     if (mod(q,2*iter) == 0 ) {
  //       cs = 2
  //     } else {
  //       cs = 1
  //     }
  //     return cs
  //   }

  //   if (mod(s,2*iter) == 0) {
  //     cs = 3
  //     return cs
  //   }

  //   iter = iter +1
  // }

  // // ITER 1
  // if (mod(hex.r,2) == 0) {
  //   if (mod(hex.q,2) == 0 ) {
  //     cs = 2
  //   } else {
  //     cs = 1
  //   }
  //   return cs
  // }

  // if (mod(hex.s,2) == 0) {
  //   cs = 3
  //   return cs
  // }

  // // ITER 2
  // if (mod(hex.r+1,4) == 0) {
  //   if (mod(hex.q,4) == 0 ) {
  //     cs = 1
  //   } else {
  //     cs = 2
  //   }
  //   return cs
  // }

  // if (mod(hex.s+1,4) == 0) {
  //   cs = 3
  //   return cs
  // }

  // // ITER 3
  // if (mod(hex.r+7,8) == 0) {
  //   cs = 4
  //   if (mod(hex.q+2,8) == 0 ) {
  //     cs = 2
  //   } else {
  //     cs = 1
  //   }
  //   return cs
  // }
  // if (mod(hex.s+7,8) == 0) {
  //   cs = 3
  //   return cs
  // }

  var parity = mod(hex.r,2)
  var col = hex.q + (hex.r-parity)/2

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

  // if (mod(hex.s,2) == 0) {
  //   cs = 3
  //   return cs
  // }

  // if (mod(hex.s+1,4) == 0) {
  //   cs = 3
  //   return cs
  // }

  // if (mod(hex.s+3,8) == 0) {
  //   cs = 3
  //   return cs
  // }

  // if (mod(hex.s+7,16) == 0) {
  //   cs = 3
  //   return cs
  // }

  // if (mod(hex.s+15,32) == 0) {
  //   cs = 3
  //   return cs
  // }


  return cs;
}


function drawHexagon(layout, hex, R, keepPattern) {
  pattern = document.getElementById("selectpattern").value;

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
  if (hex.orientation.toString() == "0") {
    return
  }

  const corners = polygon_corners(layout, hex);
  var center = hex_to_pixel(layout, hex);

  if (hex.orientation.toString() == "4") {
    ctx.beginPath();

    for (const corner in corners) {
      ctx.lineTo(corners[corner].x, corners[corner].y);
    }
    ctx.closePath();
    ctx.fillStyle = "red"
    ctx.fill()

    return
  }

  var checkBox = document.getElementById("showhex");
  if (checkBox.checked == true) {
    ctx.beginPath();
    // ctx.lineWidth = 5;
    for (const corner in corners) {
      ctx.lineTo(corners[corner].x, corners[corner].y);
    }
    ctx.closePath();
    ctx.fillStyle = "white"
    ctx.fill()
    ctx.lineWidth = 5;
    ctx.strokeStyle = "black";
    ctx.stroke();
    ctx.lineWidth = 1.25;
  } else {
    ctx.lineWidth = 1;
  }

  ctx.beginPath();
  for (const corner in corners) {
    ctx.lineTo(corners[corner].x, corners[corner].y);
  }
  ctx.closePath();
  ctx.fillStyle = "white"
  ctx.fill()



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
  // if (checkBox.checked == false) {
    ctx.lineTo(
      0.5 * corners[i4].x + 0.5 * corners[i5].x,
      0.5 * corners[i4].y + 0.5 * corners[i5].y
    );
  // } 

  ctx.fillStyle = "orange";
  ctx.fill();
  if (checkBox.checked == false) {
    ctx.strokeStyle = "orange";
    ctx.stroke();
  } else {
    ctx.strokeStyle = "black";
    ctx.stroke();
  }

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
  if (checkBox.checked == false) {
    ctx.strokeStyle = "orange";
    ctx.stroke();
  } else {
    ctx.strokeStyle = "black";
    ctx.stroke();
  }

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
}, 1000);

