function formatTime(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()


  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}

// shape: {
//         // 左上、右上、右下、左下角的半径依次为r1、r2、r3、r4
//         // r缩写为1         相当于 [1, 1, 1, 1]
//         // r缩写为[1]       相当于 [1, 1, 1, 1]
//         // r缩写为[1, 2]    相当于 [1, 2, 1, 2]
//         // r缩写为[1, 2, 3] 相当于 [1, 2, 3, 2]
//         r: 0,

//         x: 0,
//         y: 0,
//         width: 0,
//         height: 0
//     }

function getStringLength(str) {
  const chinese_str = str.match(/[^\x00-\xff]/g)

  if (chinese_str) {
    return str.length + chinese_str.length
  } else {
    return str.length
  }
}

function getSubString(str, length) {
  //const str_char_length = getStringLength(str)
  //
  //if (str_char_length < length) {
  //  return str
  //}
  //
  //let char_length = 0
  //let result_str = ''
  //for (let i = 0; i < str.length; ++i) {
  //  const character = str.charAt(i)
  //
  //  char_length += /[\x00-\xff]/.test(character) ? 1 : 2
  //
  //  if (char_length > length) {
  //    break
  //  } else {
  //    result_str += character
  //  }
  //}
  //
  //return result_str

  const s2 = str.slice(0, length)
  let i = getStringLength(str)
  if (i <= length) return s2
  i -= s2.length;
  switch (i) {
    case 0: return s2;
    case length: return str.slice(0, length>>1);
    default:
      var k = length - i,
        s3 = str.slice(k, length),
        j = s3.replace(/[x00-xff]/g, "").length;
      return j ? str.slice(0, k) + getSubString(s3, j) : str.slice(0, k);
  }
}

function fillRoundRect(ctx, shape) {
  const x = shape.x
  const y = shape.y
  const width = shape.width
  const height = shape.height
  if (!shape.r) {
    ctx.fillRect(x, y, width, height)
  } else {
    ctx.beginPath()
    roundRectBuildPath(ctx, shape)
    ctx.closePath()
    ctx.fill()
  }
}

function strokeRoundRect(ctx, shape) {
  const x = shape.x
  const y = shape.y
  const width = shape.width
  const height = shape.height
  if (!shape.r) {
    ctx.strokeRect(x, y, width, height)
  } else {
    ctx.beginPath()
    roundRectBuildPath(ctx, shape)
    ctx.closePath()
    ctx.stroke()
  }
}

function roundRectBuildPath(ctx, shape) {
  var x = shape.x;
  var y = shape.y;
  var width = shape.width;
  var height = shape.height;
  var r = shape.r;
  var r1;
  var r2;
  var r3;
  var r4;

  // Convert width and height to positive for better borderRadius
  if (width < 0) {
    x = x + width;
    width = -width;
  }
  if (height < 0) {
    y = y + height;
    height = -height;
  }

  if (typeof r === 'number') {
    r1 = r2 = r3 = r4 = r;
  }
  else if (r instanceof Array) {
    if (r.length === 1) {
      r1 = r2 = r3 = r4 = r[0];
    }
    else if (r.length === 2) {
      r1 = r3 = r[0];
      r2 = r4 = r[1];
    }
    else if (r.length === 3) {
      r1 = r[0];
      r2 = r4 = r[1];
      r3 = r[2];
    }
    else {
      r1 = r[0];
      r2 = r[1];
      r3 = r[2];
      r4 = r[3];
    }
  }
  else {
    r1 = r2 = r3 = r4 = 0;
  }

  var total;
  if (r1 + r2 > width) {
    total = r1 + r2;
    r1 *= width / total;
    r2 *= width / total;
  }
  if (r3 + r4 > width) {
    total = r3 + r4;
    r3 *= width / total;
    r4 *= width / total;
  }
  if (r2 + r3 > height) {
    total = r2 + r3;
    r2 *= height / total;
    r3 *= height / total;
  }
  if (r1 + r4 > height) {
    total = r1 + r4;
    r1 *= height / total;
    r4 *= height / total;
  }
  ctx.moveTo(x + r1, y);
  ctx.lineTo(x + width - r2, y);
  r2 !== 0 && ctx.quadraticCurveTo(
    x + width, y, x + width, y + r2
  );
  ctx.lineTo(x + width, y + height - r3);
  r3 !== 0 && ctx.quadraticCurveTo(
    x + width, y + height, x + width - r3, y + height
  );
  ctx.lineTo(x + r4, y + height);
  r4 !== 0 && ctx.quadraticCurveTo(
    x, y + height, x, y + height - r4
  );
  ctx.lineTo(x, y + r1);
  r1 !== 0 && ctx.quadraticCurveTo(x, y, x + r1, y);
}

module.exports = {
  formatTime: formatTime,
  fillRoundRect,
  strokeRoundRect,
  getStringLength,
  getSubString
}
