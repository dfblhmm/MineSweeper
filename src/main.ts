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
  rows: number // 行数
  columns: number //列数
  mineCount: number // 雷数
  surplusMine: number // 标记的剩余的雷数
  colors: string[] // 不同数字对应不同颜色
  isTimeStart: boolean // 计时器是否已经开启
  timeCounter: HTMLElement // 计时器DOM元素
  surplusMineCounter: HTMLElement // 剩余雷的计数DOM元素
  timer: number | undefined // 定时器id
  surplusCell: number // 还未显示的格子数
  constructor(level: number, rows: number, columns: number, minCount: number) {
    this.level = level
    this.minePosition = []
    this.domStore = []
    this.rows = rows
    this.columns = columns
    this.mineCount = minCount
    this.surplusMine = minCount
    this.colors = ['#414FBC', '#2A6206', '#AB0609', '#010088', '#7C0104', '#017D7F', '#AE0304', '#AD0713']
    this.isTimeStart = false
    this.timeCounter = document.getElementById('timer')!
    this.timer = undefined
    this.surplusMineCounter = document.getElementById('surplus-mine-count')!
    this.surplusCell = rows * columns
  }
  // 初始化界面
  init() {
    // 获取容器元素
    const gameArea: HTMLElement = document.getElementById('game')!
    // 获取行数和列数
    const { rows, columns } = this
    // 更改Grid布局样式
    gameArea.style.gridTemplateColumns = `repeat(${columns}, 1fr)`
    // 根据游戏等级或自定义来渲染不同数量的单元格
    for(let i = 0; i < rows ; i++) {
      this.domStore[i] = []
      for (let j = 0; j < columns; j++) {
        // 创建一个新单元格
        const cell: HTMLElement = document.createElement('div')
        cell.className = 'cell'
        cell.setAttribute('index', i + '-' + j)
        // 向容器中追加DOM节点
        gameArea.appendChild(cell)
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
    this.handleContextMenu(gameArea)
    // 绑定鼠标单击事件
    this.handleClick(gameArea)
    // 初始化雷计数器中的数量
    this.updateSurplusMineCount()
    // 点击按钮切换等级
    this.changeLevel(gameArea)
    
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
    this.surplusMineCounter.innerText = `${this.surplusMine}`
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
  handleContextMenu(gameArea: HTMLElement) {
    gameArea.addEventListener('contextmenu', e => {
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
    })
  }

  // 绑定鼠标单击事件——挖雷模式
  handleClick(gameArea: HTMLElement) {
    gameArea.addEventListener('click', e => {
      // 开始计时
      this.startTime()
      // 获取当前点击单元格的坐标
      const { row, column} = this.getCurrentPosition(e)
      const { isMark, isOpen }  = this.domStore[row][column]
      // 该单元格已经标雷或者已被打开
      if (isMark || isOpen) return
      // 挖到雷
      if (this.minePosition[row][column]) {
        this.endTime()
        return alert('游戏结束')
      }
      // 挖到空格
      this.show(row, column, this.getMineCount(row, column)) // 显示当前单元格
    })
  }

  // 开始计时
  startTime() {
    let time = 0
    if (!this.isTimeStart) {
      this.isTimeStart = true
      this.timer = window.setInterval(() => {
        this.timeCounter.innerText = `${++time}`
      }, 1000)
    } 
  }

  // 游戏结束，停止计时
  endTime() {
    window.clearInterval(this.timer)
    this.timer = undefined
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
  changeLevel(gameArea: HTMLElement) {
    const header: HTMLElement = document.querySelector('.header')!
    const btnCollection: NodeListOf<HTMLElement> = document.querySelectorAll('.header > button')!
    // 事件委托绑定事件
    header.addEventListener('click', e => {
      e.stopPropagation()
      // 清除定时器
      window.clearInterval(this.timer)
      // 计时归零
      this.timeCounter.innerText = '0'
      for(let i = 0; i < btnCollection.length; i++) {
        btnCollection[i].className = ''
      }
      const currentNode = e.target as HTMLElement
      currentNode.className = 'active'
      const index: number = parseInt(currentNode.getAttribute('index') as string)
      switch(index) {
        case 1: 
          gameArea.innerHTML = ''
          document.documentElement.style.fontSize = '16px'
          new Game(index, 9, 9, 10).init()
          break
        case 2: 
          gameArea.innerHTML = ''
          document.documentElement.style.fontSize = '14px'
          new Game(index, 16, 16, 40).init()
          break
        case 3: 
          gameArea.innerHTML = ''
          document.documentElement.style.fontSize = '12px'
          new Game(index, 16, 30, 99).init()
          break
      }
    })
  }
}


new Game(1, 9, 9, 10).init()