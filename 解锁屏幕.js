// 密码按照这个格式自行修改 
//var password = [5, 9, 6, 2]
var password = [4, 3, 5, 4, 3, 5]

var deviceUnlocker = {}
deviceUnlocker.unlockDevice = function () {
  const IsRooted = files.exists("/sbin/su") || files.exists("/system/xbin/su") || files.exists("/system/bin/su")
  log("Is Device Rooted:" + IsRooted)
  if (device.isScreenOn()) {
    sleep(3000) // 延时启动 方便调试
  }
  var batteryLevel = device.getBattery()
  log('battery level : ' + batteryLevel)
  if (batteryLevel < 10 && !device.isCharging()) {
    log('电量低,屏幕解锁未执行')
    return false
  }
  if (!device.isScreenOn()) {
    log('unlocking device')
    device.wakeUp()
    sleep(1000)
    if (!device.isScreenOn()) {
      console.warn('error:  screen still off!!!')
      sleep(1000)
    }

    if (IsRooted) {
      Swipe(540, 1800, 540, 300, 200) //上滑 大写为root函数 小写的swipe无法成功滑动  //米8为上滑  //当屏幕有干扰时(比如屏幕朝下放在床上等) 上滑会失败
      //Swipe(200, 1000, 900, 1000, 200) //右滑
      sleep(1000)
    }

    if (!desc(0).findOne(3000) || IsRooted == false) {
      //如果root方式失败 则也尝试非root方式 增强可靠性
      //非root模式 由于普通swipe直接下滑无效 故采用下滑通知栏点击设置进入密码输入页面进行曲线解锁
      swipe(540, 10, 540, 1500, 600)
      sleep(1000) // 要等通知栏下滑加载完成后定位
      if (desc('设置').exists()) {
        desc('设置').findOne(2000).click()
      }
      else {
        log('warnning: find setting widget failed once')
        sleep(1000) // 要等通知栏下滑加载完成后定位
        swipe(540, 10, 540, 1500, 200)
        smartClick(desc('设置').findOne(2000))
        sleep(3000)
      }
    }

    //输入密码
    for (var i = 0; i < password.length; i++) {
      smartClick(desc(password[i]).findOne(1000))
    }

  }
  else {
    log('Screen Already On')
  }

  // 返回桌面 解锁结束
  sleep(1000)
  for (var i = 0; i < 10; i++) {
    if (currentActivity() != 'com.miui.home.launcher.Launcher') {
      log('returning home')
      home()
      sleep(200)
    }
  }

  if (currentActivity() == 'com.miui.home.launcher.Launcher') {
    toastLog('device unlocked')
    return true
  } else {
    return false
  }

}

function smartClick(widget) {
  if (widget) {
    if (widget.clickable() && widget.className() != "android.widget.FrameLayout") {
      widget.click()
      return true
    } else {
      var widget_temp = widget.parent()
      for (var triedTimes = 0; triedTimes < 5; triedTimes++) {
        if (widget_temp.clickable()) {
          widget_temp.click()
          return true
        }
        widget_temp = widget_temp.parent()
        if (!widget_temp) {
          break
        }
      }

      click(widget.bounds().centerX(), widget.bounds().centerY())
      return true
    }
  } else {
    // console.verbose('invalid widget')
    console.trace('invalid widget : ')
    return false
  }
}

module.exports = deviceUnlocker
