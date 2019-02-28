// /////////////////////////////////////
requiresApi(24)
requiresAutojsVersion('4.0.9')
auto()
requestScreenCapture()
var thread = threads.start(function () {
  if (!device.isScreenOn()) {
    engines.execScriptFile('解锁屏幕.js')
    sleep(5000) // 等待屏幕解锁完成
  }else {
    if (!dialogs.confirm('是否开始淘宝签到?', '检测到可能设备可能在使用中\n确认以继续\n取消以终止')) {
      console.info('screen on and script aborted manually')
      exit()
    }
  }
  // shell('am force-stop com.taobao.taobao', true)
  // sleep(1000)

  // launchApp('手机淘宝'); // 打开后自动跳转为主页面 
  var isLoadFinished = enterJinBiZhuangYuan()

  if (isLoadFinished) {

    // 收水滴
    var result = images.matchTemplate(captureScreen(), images.read('图标包/水滴图标.png'), {
      max: 100,
      region: [0, 300, 1000, 600],
      level: 0,
      threshold: 0.8
    })
    result.matches.forEach(match => {
      // log('point = ' + match.point + ', similarity = ' + match.similarity)
      click(match.point.x+10, match.point.y+10)
    })
    // 点击金币位置 坐标视分辨率不同适当调整
    click(400, 750)
    click(540, 400)
    click(540, 630)
    click(540, 850)
    sleep(2000)
    if (smartClick(text('确认报名').findOne(3000))) { // 庄园大奖赛报名
      sleep(3000)
      back()
      sleep(3000)
    }
  }
  sleep(1500)

  // 领打卡后的额外红包 (好像现在好久没出现过了)
  if (className('android.view.View').desc('领').exists()) {
    smartClick(className('android.view.View').desc('领').findOne(5000).parent())
    smartClick(className('android.view.View').desc('确定').findOne(5000).parent())
  }

  // 领水滴
  swipe(500, 500, 500, 1500, 500)
  sleep(1000)
  var img = images.read('图标包/领水滴图标.png')
  var p = images.findImage(captureScreen(), img)
  if (p) {
    toastLog('开始领水滴')
    click(p.x + img.getWidth() / 2, p.y + img.getHeight() / 2) // 点击领水滴
    sleep(3000)
    if (text('领水滴').exists()) {
      smartClick(text('打卡').findOne(5000))
      sleep(1000)
      if (smartClick(text('去逛逛').findOne(5000))) {
        sleep(13000)
        back()
        sleep(3000)
      }
      click(1000, 500)
      sleep(3000)
    }
  }else {
    toast('未找到领水滴入口')
    console.warn('未找到领水滴入口')
  }
  // 偷金币和浇水
  swipe(500, 500, 500, 1500, 500)
  sleep(1000)
  // var img = images.read('图标包/偷金币图标.png')
  // var p = images.findImage(captureScreen(), img)
  toastLog('开始偷金币')
  // click(p.x + img.getWidth() / 2, p.y + img.getHeight() / 2)
  // TODO
  click(990, 920)
  sleep(3000)
  // TODO: 区分text同为偷金币的按钮与标题
  if (className('android.view.View').text('偷金币').exists()) {
    do {
      while (text('可浇水').exists()) {
        smartClick(text('可浇水').findOne(1000))
        sleep(5000)
        click(990, 920) // 点击浇水
        sleep(1000)
        back()
        sleep(3000)
      }

      while (className('android.widget.Button').text('偷金币').exists()) {
        smartClick(className('android.widget.Button').text('偷金币').findOne(1000))
        sleep(5000)
        click(540, 860) // 点击偷金币
        sleep(1000)
        back()
        sleep(3000)
      }

      swipe(500, 1500, 500, 700, 500) // 上滑手势 下拉列表
      sleep(1000)
    } while (text('可浇水').exists() | className('android.widget.Button').text('偷金币').exists())
    sleep(1000)
    click(1000, 500)
    sleep(3000)
  }else {
    enterJinBiZhuangYuan()
  }

  // end of 偷金币&浇水

  var storage = storages.create('virtualLog') // 本地存储数据库 存储最近一次脚本运行的日期 因今日任务等每天只需点击一次 故如已运行过则跳过 
  if (storage.get('taoBaoQianDaoLastRanDate') != new Date().getDate()) {

    // TODO:玩小游戏签到
    var img = images.read('图标包/玩小游戏图标.png')
    var p = images.findImage(captureScreen(), img)
    if (p) {
      toastLog('进入玩小游戏')
      click(p.x + img.getWidth() / 2, p.y + img.getHeight() / 2)
      sleep(3000)
      if (text('金币游戏').exists()) {
        smartClick(text('签到').findOne(3000))
        sleep(2000)
        click(285, 1830) // 点击直接签到
        sleep(3000)
        while (text('金币游戏').exists()) {
          back()
          sleep(2000)
        }
      }
    }else {
      toast('未找到玩小游戏入口')
      console.warn('未找到玩小游戏入口')
    }
    // TODO:庄园大奖赛签到
    var img = images.read('图标包/大奖赛图标.png')
    var p = images.findImage(captureScreen(), img)
    if (p) {
      toastLog('进入庄园奖大赛')
      click(p.x + img.getWidth() / 2, p.y + img.getHeight() / 2)
      sleep(3000)
      if (text('庄园大赛').exists()) {
        if (text('去完成').exists()) {
          smartClick(text('去完成').findOne(3000))
          sleep(13000)
          back()
          sleep(3000)
        }
        back()
        sleep(3000)
      }
    }else {
      toast('未找到庄园大奖赛入口')
      console.warn('未找到庄园大奖赛入口')
    }
    // 今日任务奖励领取
    var img = images.read('图标包/今日任务图标.png')
    var p = images.findImage(captureScreen(), img)
    if (p) {
      toastLog('进入今日任务')
      click(p.x + img.getWidth() / 2, p.y + img.getHeight() / 2)
      sleep(3000)

      if (desc('领奖励').exists()) {
        smartClick(desc('领奖励').findOne(1000))
        desc('成就徽章').findOne(5000) // 以此为根据,等待页面加载
        sleep(1000)

        while (desc('领取奖励').exists()) {
          smartClick(desc('领取奖励').findOne(1000))
          sleep(13000)
          back()
          sleep(3000)
        }

        back()
        desc('任务中心').findOne(5000) // 以此为根据,等待页面加载
        sleep(1000)
      }

      // 浏览活动
      if (desc('浏览活动赚金币').exists()) {
        smartClick(desc('浏览活动赚金币').findOne(1000))
        sleep(13000)
        back()
      }
      //走路赚金币
      if (desc('走路赚金币').exists()) {
        smartClick(desc('走路赚金币').findOne(1000))
        sleep(13000)//其实只需5s  但此界面加载缓慢
        back()
      }
      // 游戏签到
      if (desc('游戏签到领金币').exists()) {
        smartClick(desc('游戏签到领金币').findOne(1000))
        sleep(3000)
        smartClick(text('签到').findOne(3000))
        sleep(2000)
        click(285, 1830) // 点击直接签到
        sleep(3000)
        while (currentActivity() != 'com.taobao.weex.WXActivity') {
          back()
          sleep(2000)
        }
      }
      // 进群打卡
      if (desc('进群打卡领金币').exists()) {
        smartClick(desc('进群打卡领金币').findOne(1000))
        sleep(3000)
        smartClick(desc('进群打卡').findOne(5000))
        sleep(3000)
        desc('立即打卡').findOne(10000) // 因其有下滑出现的动画 故在控件初步加载出来后等待界面完全加载
        sleep(2000)
        smartClick(desc('立即打卡').findOne(3000))
        sleep(8000) // 浏览领金币
        if (device.height == 1920)
          click(960, 1630)
        else
          click(960, 1950) // 点击右下角领取浏览的金币
        sleep(3000)
        if (desc('领取奖励').findOne(3000)) {
          smartClick(desc('领取奖励').findOne(3000).parent())
          sleep(1000)
        }
      }
    }else {
      toast('未找到今日任务入口')
      console.warn('未找到今日任务入口')
    }

    storage.put('taoBaoQianDaoLastRanDate', new Date().getDate())
  // } //end of 今日任务
  } else {
    toastLog('今日任务已完成,无需重复')
  }
  toast('淘宝签到已结束')
  sleep(2000)
  shell('am force-stop com.taobao.taobao', true); // 关闭应用 shell命令需要root权限 无权限自动忽略
  home()
  sleep(2000)
  exit()
})

sleep(300000) // 200s超时
thread.interrupt()
toast('淘宝签到超时')
console.error('淘宝签到超时')

function smartClick (widget) {
  if (widget) {
    if (widget.clickable()) {
      widget.click()
      return true
    } else {
      click(widget.bounds().centerX(), widget.bounds().centerY())
      return true
    }
  }else {
    //console.verbose('invalid widget')
    console.trace('invalid widget : ')
    return false
  }
}

function enterJinBiZhuangYuan () {
  // 直接打开主界面
  app.startActivity({
    packageName: 'com.taobao.taobao',
    className: 'com.taobao.tao.homepage.MainActivity3'
  })

  for (var i = 0;i < 10;i++) {
    if (currentActivity() != 'com.taobao.tao.homepage.MainActivity3') {
      sleep(1000)
    }
  }
  // waitForActivity('com.taobao.tao.homepage.MainActivity3') // 等待主界面
  if (currentActivity() != 'com.taobao.tao.homepage.MainActivity3') {
    // 黑屏等特殊状况 重试一次
    shell('am force-stop com.taobao.taobao', true) // 无root权限则跳过
    home()
    sleep(5000)
    launchApp('手机淘宝')
    sleep(10000)
    if (currentActivity() != 'com.taobao.tao.homepage.MainActivity3') {
      console.error('failed to launch application')
      toast('fatal error　: failed to launch application')
      exit()
    }
  }
  sleep(3000); // 延时 确保各控件弹窗等加载完成

  // 防止更新等弹窗扰乱程序
  if (text('取消').exists()) {
    back()
    sleep(1000)
  }

  // 淘宝主页面点击淘金币
  smartClick(desc('淘金币').findOne(5000))
  waitForActivity('com.taobao.browser.BrowserActivity')
  sleep(5000)

  // 关弹窗
  if (text('取消').exists()) {
    back()
    sleep(1000)
  }
  if (text('如何成为金主').exists()) {
    back()
    sleep(3000)
    smartClick(desc('淘金币').findOne(5000))
    sleep(3000)
  }

  swipe(500, 500, 500, 1500, 500) // 下拉强制展开 防止未成熟时自动缩回
  sleep(2000)
  var isLoadFinished = text('攻略').findOne(5000) // 借此判断是否加载完成
  if (isLoadFinished)
    toastLog('load finished')
  else
    console.error('load failed')
  return isLoadFinished
}

// TODO  代码逻辑重构  确保在正确的页面对正确的控件进行操作
