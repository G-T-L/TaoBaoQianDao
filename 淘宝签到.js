// 作者: G大师
// 仍在改进中 更新可去 https://github.com/G-T-L
// 要求:
// 系统安卓7及以上   
// Auto.js 版本4.1及以上
// 依赖同路径下的 "解锁屏幕.js" 来在屏幕锁定时解锁屏幕
// 更新日期:20190409
//

// TODO  协同tasker  自动设定下一个任务时间

var debugMode = false
// var debugMode = true

requiresApi(24)
requiresAutojsVersion('4.0.9')
auto()
requestScreenCapture()

var deviceUnlocker = require('解锁屏幕.js')
var isScreenNeedToBeLocked
var thread_main
var thread_main_monitor
var muteWhileRunning = true
// ////////////////////Start/////////////////////////

unlockAndEnterMainSession()

// if exit() failed to be called  interrupt manually
var thread_main_monitor = threads.start(function () {
  for (var i = 0;i < 300;i++) {
    sleep(1000)
  }
  if (thread_main) { // 如果取消了此次脚本 则thread_main为空
    thread_main.interrupt()
    toastLog('淘宝签到超时')
    console.error('淘宝签到超时')
  }
})

function taoBaoQianDao () {
  var musicVolume = device.getMusicVolume()
  if (muteWhileRunning) {
    try {
      device.setMusicVolume(0)
    } catch(e) {
      toastLog('error : ' + e.message)
      toastLog('需要修改系统设置权限')
    }
  }

  var isLoadFinished = enterJinBiZhuangYuan()
  if (isLoadFinished) {
    toastLog('开始收水滴')
    // 收水滴
    swipe(540, 500, 540, 1500, 500)
    sleep(1000)
    var point = findColor(captureScreen(), '#ff0084FE', {
      region: [200, 300, 600, 500]
    })
    var count = 0
    while (point && count++ < 3) {
      toastLog('水滴已定位')

      Tap(point.x, point.y - 10, 10)
      sleep(3000)
      swipe(540, 500, 540, 1500, 500) //
      sleep(1000)
      point = findColor(captureScreen(), '#ff0084FE', {
        region: [200, 300, 600, 500]
      })
    }

    // 点击金币位置 坐标视分辨率不同适当调整
    // click(400, 750)
    sleep(1000)
    swipe(540, 500, 540, 1500, 500)
    sleep(1000)

    click(540, 400)
    sleep(100)
    click(540, 600)
    sleep(100)
    click(540, 850)
    sleep(2000)
    smartClick(text('收下了').findOne(1000))
    if (smartClick(textContains('确认报名').findOne(3000))) { // 庄园大奖赛报名
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
  swipe(540, 500, 540, 1500, 500)
  sleep(1000)
  var img = images.read('图标包/领水滴图标.png')
  var p = images.findImage(captureScreen(), img)
  if (p) {
    toastLog('开始领水滴')
    click(p.x + img.getWidth() / 2, p.y + img.getHeight() / 2) // 点击领水滴
    sleep(3000)
    if (text('领水滴').exists()) {
      smartClick(text('打卡').findOne(1000))
      sleep(1000)
      if (smartClick(text('去逛逛').findOne(1000))) {
        sleep(13000)
        back()
        sleep(3000)
      }
      click(1000, 500)
      sleep(3000)
    }
  } else {
    toast('未找到领水滴入口')
    console.warn('未找到领水滴入口')
  }
  // 偷金币和浇水
  swipe(540, 500, 540, 1500, 500)
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
        sleep(2000)
        smartClick(text('收下了').findOne(1000))
        sleep(100)
        back()
        sleep(3000)
      }

      while (className('android.widget.Button').text('偷金币').exists()) {
        smartClick(className('android.widget.Button').text('偷金币').findOne(1000))
        sleep(5000)
        click(540, 860) // 点击偷金币
        sleep(2000)
        smartClick(text('收下了').findOne(1000))
        sleep(100)
        back()
        sleep(3000)
      }

      swipe(500, 1500, 500, 700, 500) // 上滑手势 下拉列表
      smartClick(textContains('好友可偷金币').findOne(2000))
      sleep(1000)
    } while (text('可浇水').exists() | className('android.widget.Button').text('偷金币').exists() | textContains('好友可偷金币').exists())
    sleep(1000)
    click(1000, 500)
    sleep(3000)
  } else {
    enterJinBiZhuangYuan()
  }

  // end of 偷金币&浇水
  if (files.exists('图标包/领肥料图标.png')) {
    var img = images.read('图标包/领肥料图标.png')
    var p = images.findImage(captureScreen(), img)
    if (p) {
      toastLog('进入种宝贝')
      click(p.x + img.getWidth() / 2, p.y + img.getHeight() / 2)
      sleep(3000)

      click(540, 600)
      sleep(1000)
      click(360, 600)
      sleep(1000)
      click(720, 600)
      sleep(1000)

      click(980, 1100)
      sleep(3000)
      if (text('领肥料').exists()) {
        smartClick(text('打卡').findOne(1000))
        sleep(1000)
        if (smartClick(text('去逛逛').findOne(1000))) {
          sleep(60000) // 45s is required
          back()
          sleep(3000)
        }
        click(1000, 500)
        sleep(3000)
      }

      // 施肥
      click(990, 920)
      sleep(3000)
      if (className('android.view.View').text('帮施肥').exists()) {
        do {
          while (text('去施肥').exists()) {
            smartClick(text('去施肥').findOne(1000))
            sleep(5000)
            click(990, 920) // 点击施肥
            sleep(1000)
            back()
            sleep(3000)
          }

          swipe(500, 1500, 500, 700, 500) // 上滑手势 下拉列表
          smartClick(textContains('好友可施肥').findOne(2000)) // 点开下滑列表
          sleep(1000)
        } while (text('去施肥').exists() | textContains('好友可施肥').exists())
        sleep(1000)
        click(1000, 500)
        sleep(3000)
      }

      // 重新载入

    } else {
      toast('未找到种宝贝入口 请检查是否已开通')
      console.warn('未找到种宝贝入口 请检查是否已开通')
    }
  }

  // end of 种宝贝 施肥

  var storage = storages.create('virtualLog') // 本地存储数据库 存储最近一次脚本运行的日期 因今日任务等每天只需点击一次 故如已运行过则跳过 
  if (storage.get('taoBaoQianDaoLastRanDate') != new Date().getDate() || debugMode) {

    // 福利中心抽奖
    if (files.exists('图标包/福利中心图标.png')) {
      var img = images.read('图标包/福利中心图标.png')
      var p = images.findImage(captureScreen(), img)
      if (p) {
        toastLog('进入福利中心抽奖')
        click(p.x + img.getWidth() / 2, p.y + img.getHeight() / 2)
        sleep(3000)
        smartClick(desc('抽奖').findOne(3000))
        sleep(5000)
        back()
        sleep(3000)
      }
    }

    if (storage.get('wanXiaoYouXiLastRanDate') != new Date().getDate() || debugMode) {
      // 有时候后面几项会失败  所以会再次尝试  但这一项比较费时间   故单独记录   不再多次运行
      if (files.exists('图标包/玩小游戏图标.png')) {
        var img = images.read('图标包/玩小游戏图标.png')
        var p = images.findImage(captureScreen(), img)
        if (p) {
          toastLog('进入玩小游戏')
          click(p.x + img.getWidth() / 2, p.y + img.getHeight() / 2)
          sleep(3000)
          if (text('金币游戏').exists()) {
            smartClick(text('签到').findOne(3000))
            sleep(5000)
            smartClick(textContains('直接签到').findOne(3000))
            sleep(1000)

            // 再玩十局小游戏领金币
            for (var i = 0;i < 10;i++) {
              if (text('猫咪咖啡屋').exists()) {
                smartClick(text('猫咪咖啡屋').findOne(3000))
                sleep(10000)
                back()
                smartClick(text('确定').findOne(3000))
                sleep(3000)
              }
              smartClick(text('奖励已发放').findOne(3000))
            }

            while (text('金币游戏').exists()) {
              back()
              sleep(2000)
            }

            storage.put('wanXiaoYouXiLastRanDate', new Date().getDate()) // 全部完成后才打卡

          }
        } else {
          toast('未找到玩小游戏入口')
          console.warn('未找到玩小游戏入口')
        }
      }
    }

    // TODO:庄园大奖赛签到
    if (files.exists('图标包/大奖赛图标.png')) {
      var img = images.read('图标包/大奖赛图标.png')
      var p = images.findImage(captureScreen(), img)
      if (p) {
        toastLog('进入庄园奖大赛')
        click(p.x + img.getWidth() / 2, p.y + img.getHeight() / 2)

        for (var i = 0;!text('庄园大赛').exists() && i < 30;i++) {
          sleep(1000)
        }

        if (text('庄园大赛').exists()) {
          if (text('去完成').exists()) {
            smartClick(text('去完成').findOne(5000))
            sleep(13000)
            back()
            sleep(3000)
          }
          back()
          sleep(3000)
        }
      } else {
        toast('未找到庄园大奖赛入口')
        console.warn('未找到庄园大奖赛入口')
      }
    }
    // 今日任务奖励领取

    if (files.exists('图标包/今日任务图标.png')) {
      var img = images.read('图标包/今日任务图标.png')
      var p = images.findImage(captureScreen(), img)
      if (p) {
        toastLog('进入今日任务')
        click(p.x + img.getWidth() / 2, p.y + img.getHeight() / 2)
        if (desc('任务中心').findOne(10000)) {
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
            sleep(3000)
          }

          // 拍照识别赚金币   //TODO  黑暗环境下改用相册
          if (desc('拍照识别赚金币').exists()) {
            smartClick(desc('拍照识别赚金币').findOne(1000))
            sleep(5000)
            smartClick(text('允许').findOne(1000)) // 如果出现拍照权限申请
            if (text('拍立淘').findOne(10000))
              click(540, text('拍立淘').findOne(10000).bounds().centerY() - 220)
            sleep(3000)
            smartClick(text('继续上传').findOne(3000)) // 当前拍照环境太暗  是否继续上传?
            sleep(5000)
            click(960, device.height - 200)
            sleep(3000)
            smartClick(desc('领取奖励').findOne(5000))
            sleep(10000)

            while (!desc('任务中心').exists()) {
              back()
              sleep(2000)
            }
            sleep(3000)
          }

          // 走路赚金币   (已移除)
          if (desc('走路赚金币').exists()) {
            smartClick(desc('走路赚金币').findOne(1000))
            sleep(13000) // 其实只需5s  但此界面加载缓慢
            back()
            sleep(3000)
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
            click(960, device.height - 300)

            sleep(3000)
            if (desc('领取奖励').findOne(3000)) {
              smartClick(desc('领取奖励').findOne(3000).parent())
              sleep(1000)
            }
          }

          while(!desc('任务中心').exists()){
            back()
            sleep(2000)
          }

          // 好店签到

          swipe(500, 1500, 500, 300, 500) // 上滑手势 下拉列表 一开始就要下拉

          do {
            if (smartClick(desc('签到+').findOne(1000))) {
              text('金币好店签到').findOne(10000) // some time it just took years to load
              sleep(500)
              back()
              sleep(2000)
            }

            if (!desc('签到+').findOne(1000)) {
              swipe(500, 1500, 500, 700, 500) // 上滑手势 下拉列表 一开始就要下拉
            }

            sleep(1000)
          } while (desc('签到+').exists())

          storage.put('taoBaoQianDaoLastRanDate', new Date().getDate()) // 全部完成后才打卡
          toastLog('今日任务已完成')
        }
      } else {
        toast('未找到今日任务入口')
        console.warn('未找到今日任务入口')
      }
    }

  // storage.put('taoBaoQianDaoLastRanDate', new Date().getDate())
  // } //end of 今日任务
  } else {
    toastLog('今日任务已完成,无需重复')
  }
  toast('淘宝签到已结束')
  sleep(2000)
  shell('am force-stop com.taobao.taobao', true); // 关闭应用 shell命令需要root权限 无权限自动忽略
  home()
  sleep(1000)
  if (muteWhileRunning) {
    try {
      device.setMusicVolume(musicVolume)
    } catch(e) {
      toastLog('error : ' + e.message)
      toastLog('需要修改系统设置权限')
    }
  }
  if (isScreenNeedToBeLocked) {
    KeyCode(26)
  }
  exit()
}

function unlockAndEnterMainSession () {
  if (device.isScreenOn()) {
    isScreenNeedToBeLocked = false

    var dialog_start = dialogs.build({
      title: '是否开始淘宝签到?',
      positive: '确认',
      negative: '取消',
      neutral: '稍后提醒',
      checkBoxPrompt: '签到期间临时静音',
      checkBoxChecked: true
    }).on('any', (action, dialog) => {
      if (action == 'positive') {
        thread_main = threads.start(taoBaoQianDao())
      }else if (action == 'negative') {
        toast('此次签到已取消')
        console.info('opration aborted mannually')
        exit()
      }else if (action == 'neutral') {
        var delayTime = dialogs.input('延时时间(min):', '4')
        sleep(delayTime * 60 * 1000)
        unlockAndEnterMainSession()
      }
    }).on('check', (checked) => {
      // 监听勾选框   但无动作则不执行  即采用默认值
      muteWhileRunning = checked
      toastLog('muteWhileRunning : ' + muteWhileRunning)
    })

    dialog_start.show()
  } else {
    isScreenNeedToBeLocked = true
    if (deviceUnlocker.unlockDevice()) {
      thread_main = threads.start(taoBaoQianDao())
    }else {
      exit()
    }
  }
}

function smartClick (widget) {
  if (widget) {
    if (widget.clickable()) {
      widget.click()
      return true
    } else {
      var widget_temp = widget.parent()
      for (var triedTimes = 0;triedTimes < 5;triedTimes++) {
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

function enterJinBiZhuangYuan () {
  // 直接打开主界面
  app.startActivity({
    packageName: 'com.taobao.taobao',
    className: 'com.taobao.tao.homepage.MainActivity3'
  })

  for (var i = 0; i < 10; i++) {
    if (currentActivity() != 'com.taobao.tao.homepage.MainActivity3' && currentActivity() != 'com.taobao.tao.TBMainActivity') {
      smartClick(textContains('跳过').findOne(1000))
      sleep(1000)
    }
  }

  // 等待主界面
  if (currentActivity() != 'com.taobao.tao.homepage.MainActivity3' && currentActivity() != 'com.taobao.tao.TBMainActivity') {
    // 黑屏等特殊状况 重试一次
    shell('am force-stop com.taobao.taobao', true) // 无root权限则跳过
    home()
    sleep(5000)
    launchApp('手机淘宝')
    sleep(10000)
    if (currentActivity() != 'com.taobao.tao.homepage.MainActivity3' && currentActivity() != 'com.taobao.tao.TBMainActivity') {
      console.error('failed to launch application')
      toast('fatal error　: failed to launch application')
      exit()
    }
  }
  sleep(1000); // 延时 确保各控件弹窗等加载完成

  // 防止更新等弹窗扰乱程序
  if (text('取消').exists()) {
    smartClick(desc('取消').findOne(1000))
    sleep(1000)
  }

  // 淘宝主页面点击淘金币
  smartClick(desc('淘金币').findOne(5000))
  waitForActivity('com.taobao.browser.BrowserActivity')
  sleep(5000)

  // 关弹窗
  if (text('取消').exists()) {
    smartClick(desc('取消').findOne(1000))
    sleep(1000)
  }

  if (text('我知道了').exists()) {
    smartClick(desc('我知道了').findOne(1000))
    sleep(1000)
  }

  if (text('好的').exists()) {
    smartClick(desc('好的').findOne(1000))
    sleep(1000)
  }

  if (text('如何成为金主').exists()) {
    back()
    sleep(3000)
    return enterJinBiZhuangYuan()
  }

  if (textContains('确认报名').exists()) {
    smartClick(textContains('确认报名').findOne(1000))
    sleep(5000)
    back()
    sleep(3000)
    return enterJinBiZhuangYuan()
  }

  if (text('继续报名').exists()) {
    smartClick(text('继续报名').findOne(1000))
    sleep(5000)
    back()
    sleep(3000)
    return enterJinBiZhuangYuan()
  }

  swipe(540, 500, 540, 1500, 500) // 下拉强制展开 
  sleep(2000)
  var isLoadFinished = text('攻略').findOne(5000) // 借此判断是否加载完成
  if (isLoadFinished)
    toastLog('load finished')
  else
    console.error('load failed')
  return isLoadFinished
}

// TODO  代码逻辑重构  确保在正确的页面对正确的控件进行操作
