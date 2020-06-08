// 作者: G大师
// 仍在改进中 更新可去 https://github.com/G-T-L
// 要求:
// 系统安卓7及以上   
// Auto.js 版本4.1及以上 否则部分函数无法运行
// 依赖同路径下的 "解锁屏幕.js" 来在屏幕锁定时解锁屏幕
// 更新日期:20200429
// 如果脚本无法在后台申请截屏权限或无法在非主界面调用时弹出询问窗,请确保有后台弹出界面的权限
// 脚本稳定性基于Auto.js 偶尔会出现找图找色失败而导致无法领取水滴,无法进入今日任务,玩小游戏等拓展频道领取金币 重启手机可解决
// 多次运行可提升容错率

// TODO  协同tasker  自动设定下一个任务时间
// TODO  适配高分屏
const IsRooted = files.exists("/sbin/su") || files.exists("/system/xbin/su") || files.exists("/system/bin/su")
const debugMode = false


requiresApi(24)
requiresAutojsVersion('4.0.9')
auto()

var deviceUnlocker = require('解锁屏幕.js')
var isScreenNeedToBeLocked
var thread_main//主进程
var thread_main_monitor//主进程超时监视进程
var muteWhileRunning = true//运行脚本期间是否静音(结束后自动恢复原先音量)//需要修改系统设置的权限
/////////////////////////////////////////////////////Start//////////////////////////////////////////////////////
toastLog('init done')

//启动主线程
unlockAndEnterMainSession()

//启动主线程的监视线程
var thread_main_monitor = threads.start(function () {
  for (var i = 0; i < 40 * 60; i++) {
    sleep(1000)
  }
  if (thread_main) { // 如果取消了此次脚本 则thread_main为空
    thread_main.interrupt()
    home()
    toastLog('淘宝签到超时')
    console.error('淘宝签到超时')
  }
})
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//主线程对应的调用函数
function taoBaoQianDao() {

  var thread_accessory = threads.start(function () { smartClick(text("立即开始").findOne(5000)) })//如果没有root权限则需点击授权
  requestScreenCapture()

  enterJinBiZhuangYuan()
  if (isLoadFinished()) {

    //静音
    var musicVolume = device.getMusicVolume()
    if (muteWhileRunning) {
      try {
        device.setMusicVolume(0)
      } catch (e) {
        toastLog('error : ' + e.message)
        toastLog('需要修改系统设置的权限')
      }
    }

    collectCoin()//收金币

    collectWater()//领水滴
    for (var i = 0; i < 10 && !isLoadFinished(); i++) {
      toastLog('上一阶段可能未正常退出 现重新加载')
      enterJinBiZhuangYuan()
      collectWater()//领水滴
    }

    waterAndStealCoin()//浇水与偷金币

    //fertilize()//右侧种宝贝与施肥

    extraCoins()//下方各种活动入口领取更多金币

    toast('淘宝签到已结束')
    sleep(2000)
    if (IsRooted)
      shell('am force-stop com.taobao.taobao', true); // 关闭应用 shell命令需要root权限 无权限则会直接种植脚本
    home()
    sleep(1000)
    if (muteWhileRunning) {
      try {
        device.setMusicVolume(musicVolume)
      } catch (e) {
        toastLog('error : ' + e.message)
        toastLog('需要修改系统设置权限')
      }
    }
    if (isScreenNeedToBeLocked) {
      if (IsRooted)
        KeyCode(26)
    }
    exit()
  }
  thread_main_monitor.interrupt()
}

function unlockAndEnterMainSession() {
  if (device.isScreenOn()) {
    isScreenNeedToBeLocked = false
    toastLog('Screen On')
    var dialog_start = dialogs.build({
      title: '是否开始淘宝签到?',
      positive: '确认',
      negative: '取消',
      neutral: '稍后提醒',
      checkBoxPrompt: '签到期间临时静音',
      checkBoxChecked: true
    }).on('any', (action, dialog) => {
      if (action == 'positive') {
        thread_main = threads.start(taoBaoQianDao)
      } else if (action == 'negative') {
        toast('此次签到已取消')
        console.info('opration aborted mannually')
        exit()
      } else if (action == 'neutral') {
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
    log('unlockDevice() was called')
    isScreenNeedToBeLocked = true
    if (deviceUnlocker.unlockDevice()) {
      thread_main = threads.start(taoBaoQianDao)
    } else {
      toastLog('Unlock Device Failed!')
      exit()
    }
  }
}

function enterJinBiZhuangYuan() {
  // 直接打开主界面
  toastLog('尝试直接打开主界面')
  app.startActivity({
    packageName: 'com.taobao.taobao',
    className: 'com.taobao.tao.TBMainActivity'
  })

  // 等待主界面,最多等10s
  for (var i = 0; i < 10; i++) {
    if (currentActivity() != 'com.taobao.tao.TBMainActivity') {
      smartClick(textContains('跳过').findOne(1000))
      sleep(1000)
    }
  }

  swipe(540, 500, 540, 700, 300)//滑动下以更新currentActivity
  if (currentActivity() != 'com.taobao.tao.TBMainActivity') {
    // 黑屏等特殊状况 重试一次
    if (IsRooted)
      shell('am force-stop com.taobao.taobao', true)
    home()
    sleep(5000)
    toastLog('尝试通过应用名字打开应用')
    launchApp('手机淘宝')
    sleep(10000)
    if (currentActivity() != 'com.taobao.tao.TBMainActivity') {
      console.error('failed to launch application')//好像不能用了?
      toastLog('fatal error　: failed to launch application')
      thread_main_monitor.interrupt()
      exit()
    }
  }
  sleep(1000); // 延时 确保各控件弹窗等加载完成

  // 防止更新等弹窗扰乱程序
  if (text('取消').exists()) {
    smartClick(text('取消').findOne(1000))
    sleep(1000)
  }

  //点击左下角按钮刷新首页 最多需要点击两次
  if (!(textContains('领淘金币').exists() || descContains('领淘金币').exists())) {
    smartClick(desc('首页').findOne(1000))
    sleep(2000)
  }

  if (!(textContains('领淘金币').exists() || descContains('领淘金币').exists())) {
    smartClick(desc('首页').findOne(1000))
    sleep(2000)
  }

  if (!(textContains('领淘金币').exists() || descContains('领淘金币').exists())) {
    toastLog('未找到领淘金币入口 脚本已结束!')
    thread_main_monitor.interrupt()
    exit()
  }

  // 淘宝主页面点击淘金币
  //版本更新后可能text的内容会与desc内容互换  或也可能为软件解析原因?
  //现在好像都存在20200411
  smartClick(textContains('领淘金币').findOne(5000))
  //smartClick(descContains('领淘金币').findOne(5000))
  waitForActivity('com.taobao.browser.BrowserActivity')
  sleep(5000)

  if (!isLoadFinished()) {
    toastLog("failed to initialize within 5s")
    sleep(10000)
  }

  // 关弹窗
  if (text('取消').exists()) {
    smartClick(text('取消').findOne(1000))
    sleep(1000)
  }

  if (textContains('知道了').exists()) {
    smartClick(textContains('知道了').findOne(1000))
    sleep(1000)
  }

  if (text('好的').exists()) {
    smartClick(text('好的').findOne(1000))
    sleep(1000)
  }

  if (textContains('收下').exists()) {
    smartClick(textContains('收下').findOne(1000))
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

  if (textContains('立即签到').exists()) {
    var p = textContains('立即签到').findOne(1000).bounds();
    smartClick(textContains('立即签到').findOne(1000))
    sleep(1000)
    click(p.centerX(), p.centerY() + 0.114 * device.height)
    sleep(1000)
  }

  if (text(new Date().getDate()).exists()) {
    if (!textContains('立即签到').exists()) {
      smartClick(text(new Date().getDate()).findOne(1000))
      sleep(3000)
    }
    var p = textContains('立即签到').findOne(1000).bounds();
    smartClick(textContains('立即签到').findOne(1000))
    sleep(5000)
    //TODO test
    //点击右上角的关闭
    var p = textContains('签到').findOne(1000)
    if (p) {
      p.parent().parent().parent().parent().children().forEach(child => {
        if (child.className() == "android.widget.Image") {
          toastLog('close button found')
          child.click()
        }
      })
    }
    sleep(1000)
  }

  swipe(540, 500, 540, 1500, 500) // 下拉强制展开 
  sleep(2000)
  if (isLoadFinished()) {
    toastLog('load finished')
    return true
  }
  else {
    toastLog('load failed')
    console.error('load failed')
    return false
  }
}

function collectCoin() {

  // 点击金币位置 坐标视分辨率不同适当调整
  toastLog('开始领金币')
  // click(400, 750)
  sleep(1000)
  swipe(540, 500, 540, 1500, 500)
  sleep(1000)

  click(540, 400)
  sleep(100)
  //click(540, 600)
  //sleep(100)
  click(540, 850)
  sleep(2000)
  smartClick(text('收下了').findOne(1000))
  if (smartClick(textContains('确认报名').findOne(3000))) { // 庄园大奖赛报名
    sleep(3000)
    back()
    sleep(3000)
  }
  sleep(5000)

  // 收水滴  但版本更新后无需再点击收集
  if (0) {
    toastLog('开始收水滴')
    swipe(540, 500, 540, 1500, 500)
    sleep(1000)
    var point = findColor(captureScreen(), '#ff0084FE', {
      region: [200, 300, 600, 500]
    })
    for (var i = 0; i < 3 && point; i++) {
      toastLog('水滴已定位')
      click(point.x, point.y - 10)
      sleep(3000)
      swipe(540, 500, 540, 1500, 500) //
      sleep(1000)
      point = findColor(captureScreen(), '#ff0084FE', {
        region: [200, 300, 600, 500]
      })
    }
    toastLog('收水滴已结束')
    sleep(1000)
  }

  // 领打卡后的额外红包 (好像现在好久没出现过了)
  if (className('android.view.View').desc('领').exists()) {
    smartClick(className('android.view.View').desc('领').findOne(5000).parent())
    smartClick(className('android.view.View').desc('确定').findOne(5000).parent())
  }
}

function collectWater() {
  toastLog('开始领水滴')
  swipe(540, 500, 540, 1500, 500)
  sleep(1000)
  /*
  var img = images.read('图标包/领水滴图标.png')
  if (img) {
    var p = images.findImage(captureScreen(), img)
    if (p) {
      toastLog('开始领水滴')
      click(p.x + img.getWidth() / 2, p.y + img.getHeight() / 2) // 点击领水滴
      sleep(3000)
    } else {
      toast('未找到领水滴入口')
      console.warn('未找到领水滴入口,请检查图标包是否匹配')
    }
  } else {
    console.log('如非1920x1080分辨率 请自行修正坐标  推荐使用此图标的截图进行匹配')
    click(980, 1100)//点击领水滴
  }*/
  //smartClick(text('领水滴').findOne(1000))//淘宝更新之后这个控件有名称了

  //通过偷金币控件定位领水滴的控件
  var p = textContains('偷金币').findOne(1000)
  if (p) {
    toastLog('正在定位领水滴入口')
    p.parent().children().forEach(child => {
      if (child.className() == "android.view.View") //其他两个为button
      {
        toastLog('found')
        child.click()
      }
    })
  }
  //click(text('领水滴').findOne(1000).bounds().centerX(), text('领水滴').findOne(1000).bounds().centerY())//用text定位后调用click点击不太稳定,不知道为啥 //现在已无text
  sleep(3000)
  if (className('android.view.View').textContains('领水滴').exists()) {
    smartClick(text('一键领取').findOne(1000))
    sleep(1000)

    //去逛逛的任务应该较不容易出错,先完成
    for (var i = 0; i < 10 && text('去逛逛').exists(); i++) {
      if (smartClick(text('去逛逛').findOne(1000))) {
        toastLog('去逛逛任务尝试次数:' + (i + 1) + '/10')
        sleep(5000)
        swipe(540, 1500, 540, 500, 500)
        sleep(20000)
        back()
        sleep(3000)
      }
    }

    for (var i = 0; i < 10 && text('去完成').exists(); i++) {
      if (smartClick(text('去完成').findOne(1000))) {
        sleep(5000)
        swipe(540, 1500, 540, 500, 500)
        sleep(20000)

        toastLog('去完成任务尝试次数:' + (i + 1) + '/10')
        if (text('拍立淘').exists())
          coinTask_Photo()
        if (id('searchEdit').exists())
          coinTask_Search()
        if (desc('进群打卡领金币').exists())
          coinTask_ClockIn()

        //下面这个for循环也用i将改变当前for循环的i
        for (var j = 0; j < 10 && !className('android.view.View').textContains('领水滴').exists(); j++) {
          back()
          sleep(2000)
        }
        sleep(3000)
      }
    }

    smartClick(text('一键领取').findOne(1000))
    sleep(1000)
    smartClick(text('关闭').findOne(1000))//关闭领水滴界面
    toastLog('领水滴已结束')
    sleep(3000)
  }
}

function waterAndStealCoin() {
  if (!isLoadFinished()) {
    toastLog('上一阶段可能未正常退出 现重新加载')
    enterJinBiZhuangYuan()
  }
  toastLog('准备进行偷金币与浇水')
  swipe(540, 500, 540, 1500, 500)
  sleep(1000)
  //smartClick(text('偷金币').findOne(1000))//淘宝更新之后这个控件有名称了,但是虽然clickable为true调用click依旧没反应
  click(text('偷金币').findOne(1000).bounds().centerX(), text('偷金币').findOne(1000).bounds().centerY())//用text定位后调用click点击不太稳定,不知道为啥
  sleep(3000)
  //区分text同为偷金币的按钮与标题

  //这个弹出界面不需要下拉显示出来就能索引到全部控件  故先把列表全部展开  再依次点击
  if (className('android.view.View').text('偷金币').exists()) {
    for (var i = 0; i < 10 && textContains('个好友可偷金币').exists(); i++) {
      smartClick(textContains('个好友可偷金币').findOne(2000))
      swipe(540, 1500, 540, 500, 500)
    }

    toastLog('开始浇水')
    for (var i = 0; i < 100 && text('可浇水').exists(); i++) {
      smartClick(text('可浇水').findOne(1000))
      sleep(5000)
      click(text('浇水').findOne(1000).bounds().centerX(), text('浇水').findOne(1000).bounds().centerY())//用text定位后调用click点击不太稳定,不知道为啥
      //smartClick(text('浇水').findOne(1000))
      //click(990, 920) // 点击浇水
      sleep(2000)
      smartClick(text('收下了').findOne(1000))
      sleep(100)
      back()
      sleep(3000)
    }
    toastLog('浇水已结束')
    sleep(1000)

    //根据android.widget.Button这一className区分偷金币的标题
    //根据depth区分是不是展开列表里的偷金币控件
    //如果启用稳定模式则因省略部分布局两个depth均相应减小,需更改范围
    toastLog('开始偷金币')
    for (i = 12; i < 30; i++) {
      if (className('android.widget.Button').text('偷金币').depth(i).exists()) {
        smartClick(className('android.widget.Button').text('偷金币').depth(i).findOne(1000))
        sleep(5000)
        click(540, 860) // 点击偷金币
        sleep(2000)
        smartClick(text('收下了').findOne(1000))
        sleep(100)
        back()
        sleep(3000)
        i = 15
      }
    }
    toastLog('偷金币已结束')
    sleep(1000)

    smartClick(text('关闭').findOne(1000))//关闭偷金币界面
    //click(1000, 500)
    sleep(3000)
  } else {
    enterJinBiZhuangYuan()
  }
}

function fertilize() {
  if (!isLoadFinished()) {
    toastLog('上一阶段可能未正常退出 现重新加载')
    enterJinBiZhuangYuan()
  }
  //这个是金币庄园左侧的种宝贝  如果开通了就自己截个图扣个图标包出来就能运行了
  if (files.exists('图标包/领肥料图标.png')) {
    var img = images.read('图标包/领肥料图标.png')
    var p = images.findImage(captureScreen(), img)
    if (p) {
      toastLog('进入种宝贝')
      click(p.x + img.getWidth() / 2, p.y + img.getHeight() / 2)
      sleep(3000)

    } else {
      toast('未找到种宝贝入口 请检查是否已开通 及图标包是否匹配')
      console.warn('未找到种宝贝入口 请检查是否已开通 及图标包是否匹配')
    }

  }
  else {
    //直接点击个大概位置 很容易失败
    click(250, 850)
    sleep(3000)
  }

  //如果加载成功
  if (textContains('领肥料').exists()) {

    click(540, 600)
    sleep(1000)
    click(360, 600)
    sleep(1000)
    click(720, 600)
    sleep(1000)

    click(text('领肥料').findOne(1000).bounds().centerX(), text('领肥料').findOne(1000).bounds().centerY())//用text定位后调用click点击不太稳定,不知道为啥
    sleep(3000)
    if (className('android.view.View').text('领肥料').exists()) {
      smartClick(text('打卡').findOne(1000))
      sleep(1000)
      for (var i = 0; i < 10 && text('去逛逛').exists(); i++) {
        if (smartClick(text('去逛逛').findOne(1000))) {
          sleep(38000)
          back()
          sleep(3000)
        }
      }
      smartClick(text('关闭').findOne(1000))//关闭领肥料界面
      sleep(3000)
    }

    // 施肥
    click(text('帮施肥').findOne(1000).bounds().centerX(), text('帮施肥').findOne(1000).bounds().centerY())//用text定位后调用click点击不太稳定,不知道为啥
    sleep(3000)
    if (className('android.view.View').text('帮施肥').exists()) {
      for (var i = 0; i < 10 && textContains('个好友可施肥').exists(); i++) {
        smartClick(textContains('个好友可施肥').findOne(2000))
        swipe(540, 1500, 540, 500, 500)
      }

      for (var i = 0; i < 100 && text('去施肥').exists(); i++) {
        smartClick(text('去施肥').findOne(1000))
        sleep(5000)
        click(text('施肥').findOne(1000).bounds().centerX(), text('施肥').findOne(1000).bounds().centerY())//用text定位后调用click点击不太稳定,不知道为啥
        //click(990, 920) // 点击施肥
        sleep(1000)
        back()
        sleep(3000)
      }

      sleep(1000)
      toastLog('领肥料已结束')
      smartClick(text('关闭').findOne(1000))//关闭领肥料界面
      sleep(3000)
    }
  }
}

function extraCoins() {
  //下方额外入口 版本更新后变动较大 定位困难 暂未修复
  //部分活动入口现已移动到领水滴界面(20200408)
  if (!isLoadFinished()) {
    toastLog('上一阶段可能未正常退出 现重新加载')
    enterJinBiZhuangYuan()
  }
  var storage = storages.create('virtualLog') // 本地存储数据库 存储最近一次脚本运行的日期 因今日任务等每天只需点击一次 故如已运行过则跳过 
  if (storage.get('taoBaoQianDaoLastRanDate') != new Date().getDate() || debugMode) {

    //福利中心抽奖
    if (storage.get('luckyDrawLastRanDate') != new Date().getDate() || debugMode) {
      toastLog('进入福利中心抽奖')
      var img = images.read('图标包/福利中心图标.png')
      if (img) {
        var p = images.findImage(captureScreen(), img)
        if (p) {
          click(p.x + img.getWidth() / 2, p.y + img.getHeight() / 2)
          sleep(3000)
        } else {
          toast('未找到福利中心入口')
          console.warn('未找到福利中心入口,请检查图标包是否匹配')
        }
      } else {
        //如果淘宝更新界面有变动(时有时无的庄园大奖赛等),则此基于坐标的点击将发生错误,
        console.log('如非1920x1080分辨率 请自行修正坐标  推荐使用此图标的截图进行匹配')
        click(980, 1100)//点击福利中心的坐标
      }
      sleep(3000)
      if (className('android.view.View').desc('福利中心').exists()) {
        toastLog('成功进入福利中心')
        smartClick(desc('抽奖').findOne(3000))
        sleep(5000)
        back()
        sleep(3000)
        storage.put('luckyDrawLastRanDate', new Date().getDate()) // 全部完成后才打卡
      }
    }//end of 福利中心抽奖

    if (storage.get('wanXiaoYouXiLastRanDate') != new Date().getDate() || debugMode) {
      // 有时候后面几项会失败  所以会再次尝试  但这一项比较费时间   故单独记录   不再多次运行
      if (files.exists('图标包/玩小游戏图标.png')) {
        var img = images.read('图标包/玩小游戏图标.png')
        var p = images.findImage(captureScreen(), img)
        if (p) {
          toastLog('进入玩小游戏')
          click(p.x + img.getWidth() / 2, p.y + img.getHeight() / 2)
          sleep(5000)

          if (text('授权').exists()) {
            smartClick(text('授权').findOne(1000))
            sleep(10000)
          }

          if (text('金币游戏').exists()) {
            smartClick(text('签到').findOne(3000))
            sleep(5000)
            smartClick(textContains('直接签到').findOne(3000))
            sleep(1000)

            // 再玩十一局小游戏领金币(因为第一局有可能加载失败)
            for (var i = 0; i < 11; i++) {
              if (text('猫咪公寓').exists()) {
                smartClick(text('猫咪公寓').findOne(3000))
                sleep(10000)
                back()
                smartClick(text('确定').findOne(3000))
                sleep(3000)
              }
              smartClick(text('奖励已发放').findOne(3000))
            }

            for (var i = 0; i < 10 && text('金币游戏').exists(); i++) {
              back()
              sleep(2000)
            }

            storage.put('wanXiaoYouXiLastRanDate', new Date().getDate()) // 全部完成后才打卡

          }
          else {
            toastLog('进入玩小游戏失败 可能未授权 重新载入主页面')
            enterJinBiZhuangYuan()
          }
        } else {
          toast('未找到玩小游戏入口')
          console.warn('未找到玩小游戏入口')
        }
      }
    }

    // TODO:庄园大奖赛签到
    // 现在好一阵子没见过了 不确定以前写的还行不行  等以后有了再看看能不能用吧
    if (files.exists('图标包/大奖赛图标.png')) {
      var img = images.read('图标包/大奖赛图标.png')
      var p = images.findImage(captureScreen(), img)
      if (p) {
        toastLog('进入庄园奖大赛')
        click(p.x + img.getWidth() / 2, p.y + img.getHeight() / 2)

        for (var i = 0; !text('庄园大赛').exists() && i < 30; i++) {
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

            for (var i = 0; i < 100 && desc('领取奖励').exists(); i++) {
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

          // 走路赚金币   (已移除)
          if (desc('走路赚金币').exists()) {
            smartClick(desc('走路赚金币').findOne(1000))
            sleep(13000) // 其实只需5s  但此界面加载缓慢
            back()
            sleep(3000)
          }

          // 聚划算
          if (desc('浏览聚划算抵扣好货').exists()) {
            smartClick(desc('浏览聚划算抵扣好货').findOne(1000))
            sleep(13000)
            back()
            sleep(3000)
          }

          for (var i = 0; i < 10 && !desc('任务中心').exists(); i++) {
            back()
            sleep(2000)
          }

          // 好店签到
          swipe(500, 1500, 500, 300, 500) // 上滑手势 下拉列表 一开始就要下拉
          for (var i = 0; i < 3 && !desc('签到+').exists(); i++) {
            swipe(500, 1500, 500, 700, 500) // 上滑手势 下拉列表 一开始就要下拉
          }

          for (var i = 0; i < 10 && desc('签到+').exists(); i++) {
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
          }

          toastLog('今日任务已完成')
          sleep(1000)
          storage.put('taoBaoQianDaoLastRanDate', new Date().getDate()) // 全部完成后才打卡
        }
      } else {
        toast('未找到今日任务入口')
        console.warn('未找到今日任务入口')
      }
    }
  } else {
    toastLog('今日任务已完成,无需重复')
  }
}

function coinTask_Photo() {
  if (text('拍立淘').exists()) {
    smartClick(text('允许').findOne(1000)) // 如果出现拍照权限申请
    if (text('拍立淘').findOne(10000))
      click(540, text('拍立淘').findOne(10000).bounds().centerY() - 220)
    sleep(3000)
    smartClick(text('继续上传').findOne(3000)) // 当前拍照环境太暗  是否继续上传?
    sleep(20000)
    click(960, device.height - 250)
    sleep(3000)
    smartClick(desc('领取奖励').findOne(5000))
    sleep(13000)
  }
}

function coinTask_Search() {
  if (id('searchEdit').exists()) {
    //className('android.widget.EditText').editText('00000000000000')
    id('searchEdit').findOne(1000).setText('00000000000000')
    sleep(1000)
    id('searchbtn').findOne(1000).click()
    sleep(15000)
  }
}

function coinTask_ClockIn() {
  //现在有变动  但好像还能凑合用
  if (desc('进群打卡领金币').exists()) {
    smartClick(desc('进群打卡领金币').findOne(1000))
    sleep(3000)
    smartClick(desc('进群打卡').findOne(5000))
    sleep(3000)
    desc('立即打卡').findOne(10000) // 因其有下滑出现的动画 故在控件初步加载出来后等待界面完全加载
    sleep(2000)
    smartClick(desc('立即打卡').findOne(3000))
    sleep(8000) // 浏览领金币
    click(960, device.height - 250)

    sleep(3000)
    if (desc('领取奖励').findOne(3000)) {
      smartClick(desc('领取奖励').findOne(3000).parent())
      sleep(1000)
    }
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
    if (debugMode)
      console.trace('invalid widget : ')
    return false
  }
}

function isLoadFinished() {
  return textContains('超级抵钱').findOne(5000) // 借此判断是否加载完成
}

