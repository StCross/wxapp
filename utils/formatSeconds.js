
function formatSeconds(value) {
  var secondTime = parseInt(value); // 秒
  var minuteTime = 0; // 分
  var time = '';
  if (secondTime > -1) { // 秒数大于60
    // 获取分钟
    minuteTime = Math.floor(secondTime / 60) % 60;
    minuteTime = minuteTime < 10 ? "0" + minuteTime : minuteTime
    // 获取秒数
    secondTime = secondTime % 60;
    secondTime = secondTime < 10 ? "0" + secondTime : secondTime
  }
  time = minuteTime + " : " + secondTime
  return time;
}

module.exports = {
  formatSeconds: formatSeconds
}