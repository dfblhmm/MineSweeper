// 导入样式文件
import './less/reset.less'
import './less/index.less'

// 格子的坐标
interface Position {
  row: number,
  column: number
}
// 当前格子的信息
interface DOMNode {
  element: HTMLElement, // DOM节点
  clickCount: number, // 右键点击的次数
  isMark: boolean // 是否已经标雷
  isOpen: boolean // 是否已经点开
}
class Game {
  level: number // 游戏等级
  minePosition: boolean[][] //存放地雷的坐标
  domStore: DOMNode[][] // 存储DOM节点
  gameArea: HTMLElement // 游戏主体区域DOM元素
  rows: number // 行数
  columns: number //列数
  mineCount: number // 雷数
  surplusMine: number // 标记的剩余的雷数
  colors: string[] // 不同数字对应不同颜色
  isTimeStart: boolean // 计时器是否已经开启
  timer: number // 定时器id
  surplusCell: number // 还未显示的格子数
  btnCollection: NodeListOf<HTMLElement> // 头部按钮DOM元素集合
  htmlElement: HTMLElement // HTML根元素
  customElement: HTMLElement // 自定义选项容器DOM元素
  maxMine: number // 雷的最大数量
  clickEvent: ((e: MouseEvent) => void) | undefined // 鼠标单击事件
  contextEvent: ((e: MouseEvent) => void) | undefined // 鼠标右键事件

  constructor(level: number, rows: number, columns: number, minCount: number) {
    this.level = level
    this.minePosition = []
    this.domStore = []
    this.gameArea = document.getElementById('game')!
    this.rows = rows
    this.columns = columns
    this.mineCount = minCount
    this.surplusMine = minCount
    this.colors = ['#414FBC', '#2A6206', '#AB0609', '#010088', '#7C0104', '#017D7F', '#AE0304', '#AD0713']
    this.isTimeStart = false
    this.timer = 0
    this.surplusCell = rows * columns
    this.btnCollection = document.querySelectorAll('.header > button')!
    this.htmlElement = document.documentElement
    this.customElement = document.getElementById('custom')!
    this.maxMine = 64
  }
  // 初始化界面
  init() {
    // 获取行数和列数
    const { rows, columns } = this
    // 更改Grid布局样式
    this.gameArea.style.gridTemplateColumns = `repeat(${columns}, 1fr)`
    // 根据游戏等级或自定义来渲染不同数量的单元格
    for(let i = 0; i < rows ; i++) {
      this.domStore[i] = []
      for (let j = 0; j < columns; j++) {
        // 创建一个新单元格
        const cell: HTMLElement = document.createElement('div')
        cell.className = 'cell'
        cell.setAttribute('index', i + '-' + j)
        // 向容器中追加DOM节点
        this.gameArea.appendChild(cell)
        this.domStore[i][j] = {
          element: cell,
          clickCount: 0,
          isMark: false,
          isOpen: false
        }
      }
    } 

    // 初始化雷的信息
    this.initMine()
    // 绑定鼠标右键事件
    this.handleContextMenu()
    // 绑定鼠标单击事件
    this.handleClick()
    // 初始化雷计数器中的数量
    this.updateSurplusMineCount()
    // 点击按钮切换等级
    this.changeLevel()
  }

  // 生成地雷
  initMine() {
    // 获取行数和列数
    const { rows, columns } = this
    // 初始化雷的二维数组
    for (let i = 0; i < rows; i++) {
      this.minePosition[i] = []
      for (let j = 0; j < columns; j++) {
        this.minePosition[i][j] = false
      }
    }
    
    // 生成雷的位置
    let mineCount: number = this.mineCount
    while(mineCount > 0) {
      // 获取行数和列数
      const { rows, columns } = this
      // 随机生成横轴坐标
      const row = Math.floor(Math.random() * rows)
      // 随机生成纵轴坐标
      const column = Math.floor(Math.random() * columns)
      if (!this.minePosition[row][column]) {
        // 确保产生的位置不覆盖之前的雷的位置
        this.minePosition[row][column] = true
        mineCount--
      }
    }
  }

  // 初始化或更新雷计数器中剩余雷的数量
  updateSurplusMineCount() {
    document.getElementById('surplus-mine-count')!.innerText = `${this.surplusMine}`
  }

  // 获取当前点击的单元格坐标
  getCurrentPosition(e: MouseEvent): Position {
    // 获取当前单元格索引
    const index: string[] = (e.target as HTMLElement).getAttribute('index')!.split('-')
    // 获取当前点击的行数
    const row = parseInt(index[0])
    // 获取当前点击的列数
    const column = parseInt(index[1])
    return { row, column }
  }

  //绑定鼠标右键点击事件
  handleContextMenu() {
    this.contextEvent = e => {
      e.preventDefault()
      // 获取当前点击的单元格坐标
      const { row, column } = this.getCurrentPosition(e)
      const currentCell = this.domStore[row][column] // 获取当前点击单元格信息
      if (currentCell.isOpen) return
      currentCell.clickCount++ // 记录当前单元格已经点击过的次数
      const { element, clickCount } = currentCell
      // 根据鼠标右键点击次数更改样式
      switch (clickCount % 3) {
        case 0:
          element.className = 'cell'
          currentCell.isMark = false // 更改当前单元格能否被单击点开
          break;
        case 1: // 标雷
          element.className = 'cell mark'
          currentCell.isMark = true
          this.surplusMine--
          break;
        case 2: // 问号
          element.className = 'cell uncertainty'
          currentCell.isMark = false
          this.surplusMine++
          break;
        default:
          return
      }
      // 更新雷计数器中剩余雷的数量
      this.updateSurplusMineCount()
    }
    // 绑定事件
    this.gameArea.oncontextmenu = this.contextEvent
  }

  // 绑定鼠标单击事件——挖雷模式
  handleClick() {
    this.clickEvent = e => {
      // 开始计时
      this.startTime()
      // 获取当前点击单元格的坐标
      const { row, column } = this.getCurrentPosition(e)
      const { isMark, isOpen }  = this.domStore[row][column]
      // 该单元格已经标雷或者已被打开
      if (isMark || isOpen) return
      // 挖到雷
      if (this.minePosition[row][column]) {
        this.endTime()
        this.removeListener() // 移除事件监听器
        this.showAllMine() // 显示所有的雷
        this.reset() // 等待重置
        return alert('游戏结束')
      }
      // 挖到空格
      this.show(row, column, this.getMineCount(row, column)) // 显示当前单元格
    }
    this.gameArea.onclick = this.clickEvent
  }

  // 开始计时
  startTime() {
    let time = 0
    if (!this.isTimeStart) {
      this.isTimeStart = true
      this.timer = window.setInterval(() => {
        document.getElementById('timer')!.innerText = `${++time}`
      }, 1000)
    } 
  }

  // 游戏结束，停止计时
  endTime() {
    window.clearInterval(this.timer)
  }

  // 计算以当前坐标为中心的周围8个方格的雷数
  getMineCount(row: number, column: number): number {
    let mineSum = 0
    const { rows, columns } = this
    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = column - 1; c <= column + 1; c++) {
        if (r < 0 || r > rows - 1) break
        if (c < 0 || c > columns - 1) continue
        if (r === row && c === column || this.domStore[r][c].isOpen) continue 
        this.minePosition[r][c] && mineSum++ 
      }
    }
    return mineSum
  }

  // 显示当前单元格
  show(row: number, column: number, mineSum: number) {
    const currentCell = this.domStore[row][column]
    const { element } = currentCell
    currentCell.isOpen = true // 已经打开
    element.className = 'cell no-mine'
    // 更新还未显示的格子数
    this.surplusCell--
    if (this.surplusCell === this.mineCount) {
      this.endTime()
      return alert('你赢了')
    }
    // 四周有雷
    if (mineSum) {
      // 显示当前格子四周的雷数
      element.innerText = `${mineSum}`
      element.style.color = `${this.colors[mineSum - 1]}`
    } else {
      // 扫描空白区域
      this.sweepBlank(row, column)
    }
  }

  // 递归扫描附近的空格
  sweepBlank(row: number, column: number) {
    const { rows, columns } = this
    for(let r = row - 1; r <= row + 1; r++) {
      for(let c = column - 1; c <= column + 1; c++) {
        if (r < 0 || r > rows - 1) break
        if (c < 0 || c > columns - 1) continue
        if (r === row && c === column || this.domStore[r][c].isOpen) continue
        const mineSum = this.getMineCount(r, c)
        this.show(r, c, mineSum)
      }
    }
  }

  // 切换等级
  changeLevel() {
    document.getElementById('header')!.onclick = e => {
      const currentNode = e.target as HTMLElement
      const index: number = parseInt(currentNode.getAttribute('index') as string)
      if (index === this.level && index !== 4) return // 等级并没有切换直接返回
      // 清除定时器
      window.clearInterval(this.timer)
      // 计时归零
      document.getElementById('timer')!.innerText = '0'
      // 切换按钮样式
      if (index !== 4) this.toggleBtnStyle(currentNode)
      switch(index) {
        case 1: 
          this.gameArea.innerHTML = ''
          this.htmlElement.style.fontSize = '16px'
          this.customElement.style.display = 'none'
          this.repaint(index, 9, 9, 10)
          break
        case 2: 
          this.gameArea.innerHTML = ''
          this.htmlElement.style.fontSize = '14px'
          this.customElement.style.display = 'none'
          this.repaint(index, 16, 16, 40)
          break
        case 3: 
          this.gameArea.innerHTML = ''
          this.htmlElement.style.fontSize = '12px'
          this.customElement.style.display = 'none'
          this.repaint(index, 16, 30, 99)
          break
        case 4: 
          this.customElement.style.display = 'block'
          this.defineGame()
          break
        default:
          return
      }
    }
  }

  // 切换按钮样式
  toggleBtnStyle(currentNode: HTMLElement) {
    for(let i = 0, len = this.btnCollection.length; i < len; i++) {
      this.btnCollection[i].className = ''
    }
    currentNode.className = 'active'
  }

  // 获取用户输入的自定义参数
  getCustomOption(rowInput: HTMLInputElement, columnInput: HTMLInputElement): Position {
    const row = parseInt(rowInput.value)
    const column = parseInt(columnInput.value)
    return { row, column }
  }

  // 预校验用户输入的自定义参数是否符合规范
  validate(index: number, min: number, max: number) {
    const rowInput = document.getElementById('row')! as HTMLInputElement
    const columnInput = document.getElementById('column')! as HTMLInputElement
    let input: HTMLInputElement
    input = index === 0 ? rowInput : columnInput
    input.onblur = () => {
      const obj = this.getCustomOption(rowInput, columnInput)
      const count = index === 0 ? obj.row : obj.column
      if (count < min || count > max) {
        const tip = document.querySelectorAll('.tip')[index] as HTMLElement
        tip.style.display = 'block'
        setTimeout(() => tip.style.display = 'none', 2000)
        input.value = '9'
      } else {
        // 更新雷数的可选范围
        this.maxMine = Math.floor(obj.row * obj. column * 0.8)
        document.getElementById('mine-count')!.innerText = `（10~${this.maxMine}）`
      }
    }
  }
  
  // 自定义游戏
  defineGame() {
    // 显示自定义选项区域
    this.customElement.style.width = this.gameArea.offsetWidth + 'px'
    this.customElement.style.height = this.gameArea.offsetHeight + 'px'
    this.customElement.style.top = this.gameArea.offsetTop + 'px'
    // 取消自定义游戏
    document.getElementById('cancel')!.onclick = () => {
      this.customElement.style.display = 'none'
    }
    // 校验行数和列数是否符合规定
    this.validate(0, 5, 24)
    this.validate(1, 5, 30)
    // 雷自定义的输入框
    const mineInput = document.getElementById('mine')! as HTMLInputElement
    // 校验输入的雷数是否符合规定 
    mineInput.onblur = e => {
      const input = parseInt((e.target as HTMLInputElement).value)
      if ( input < 10 || input > this.maxMine) {
        const tip = document.querySelectorAll('.tip')[2] as HTMLElement
        document.getElementById('mineTip')!.innerText = `必须在10~${this.maxMine}之间`
        tip.style.display = 'block'
        setTimeout(() => tip.style.display = 'none', 2000)
        mineInput.value = '10'
      }
    }

    // 点击了开始游戏
    document.getElementById('repaint')!.onclick = () => {
      const mineCount = parseInt(mineInput.value)
      const row = parseInt((document.getElementById('row')! as HTMLInputElement).value)
      const column = parseInt((document.getElementById('column')! as HTMLInputElement).value)
      // 重新渲染游戏
      this.gameArea.innerHTML = '' // 清空界面
      // 适配每个格子的大小
      this.repaintGUI(row, column, mineCount)
    }
  }

  // 重新绘制界面
  repaintGUI(row: number, column: number, mineCount: number) {
    this.toggleBtnStyle(this.btnCollection[3])
    const cellCount = row * column // 获取总格子数
    if (cellCount >= 81 && cellCount < 256) {
      this.htmlElement.style.fontSize = 16 - 2 * (cellCount - 81) / 175 + 'px'
    } else if (cellCount >= 256 && cellCount < 480) {
      this.htmlElement.style.fontSize = 14 - (cellCount - 256) / 112 + 'px'
    } else if (cellCount >= 480 && cellCount <= 720) {
      this.htmlElement.style.fontSize = 12 - (cellCount - 256) / 120 + 'px'
    }
    this.customElement.style.display = 'none'
    this.repaint(4, row, column, mineCount)
  }

  // 重玩 
  reset() {
    document.getElementById('reset')!.onclick = () => {
      this.gameArea.innerHTML = ''
      const { level, rows, columns, mineCount } = this
      this.repaint(level, rows, columns, mineCount)
    }
  }

  // 重绘
  repaint(level: number, row: number, column: number, mineCount: number) {
    new Game(level, row, column, mineCount).init()
  }

  // 移除事件监听
  removeListener() {
    this.gameArea.onclick = null
    this.gameArea.oncontextmenu = null
  }

  // 挖到雷，显示所有雷
  showAllMine() {
    const { rows, columns } = this
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        if (this.minePosition[r][c]) this.domStore[r][c].element.className = 'cell open-mine'
      }
    }
  }
}

// 初始化游戏
new Game(1, 9, 9, 10).init()