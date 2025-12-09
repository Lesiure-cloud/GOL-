// ===== 时间轴渲染器（简洁时间轴风格）=====

class Timeline {
    constructor() {
        this.container = document.getElementById('timelineBody');
        this.header = document.getElementById('timelineHeader');
        this.canvas = document.getElementById('timelineCanvas');
        this.taskBarsContainer = document.getElementById('taskBars');
        this.ctx = this.canvas.getContext('2d');
        
        this.zoom = AppConfig.defaultZoom;
        this.currentView = 'day';
        this.startDate = Utils.getTodayStart();
        this.draggedTask = null;
        this.resizingTask = null;
        this.dragStartX = 0;
        this.dragStartTime = null;
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.render();
        this.attachEventListeners();
        eventBus.on('tasksUpdated', () => {
            console.log('📊 任务更新，重新渲染时间轴');
            this.render();
        });
    }

    setupCanvas() {
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width * 2;
        this.canvas.height = Math.max(rect.height, 1000);
    }

    render() {
        console.log('🔄 开始渲染时间轴...');
        this.renderTimeScale();
        this.renderTimeline(); // 改名：只画时间轴，不画网格
        this.renderTasks();
        console.log('✅ 时间轴渲染完成');
    }

    renderTimeScale() {
        this.header.innerHTML = '';
        const hours = this.currentView === 'day' ? 24 : 168;
        const pixelsPerHour = (AppConfig.pixelsPerHour * this.zoom) / 100;
        const totalWidth = hours * pixelsPerHour;
        
        const scaleDiv = document.createElement('div');
        scaleDiv.className = 'time-scale';
        scaleDiv.style.width = totalWidth + 'px';
        
        if (this.currentView === 'day') {
            for (let i = 0; i < 24; i++) {
                const unit = document.createElement('div');
                unit.className = 'time-unit';
                unit.style.width = pixelsPerHour + 'px';
                unit.style.minWidth = pixelsPerHour + 'px';
                unit.textContent = i + ':00';
                
                const hour = new Date(this.startDate);
                hour.setHours(i);
                if (Utils.isToday(hour) && new Date().getHours() === i) {
                    unit.classList.add('today');
                }
                
                scaleDiv.appendChild(unit);
            }
        } else {
            for (let i = 0; i < 7; i++) {
                const unit = document.createElement('div');
                unit.className = 'time-unit';
                unit.style.width = (24 * pixelsPerHour) + 'px';
                unit.style.minWidth = (24 * pixelsPerHour) + 'px';
                const day = new Date(this.startDate.getTime() + i * 86400000);
                unit.textContent = Utils.formatDate(day, 'MM-DD');
                
                if (Utils.isToday(day)) {
                    unit.classList.add('today');
                }
                
                scaleDiv.appendChild(unit);
            }
        }
        
        this.header.appendChild(scaleDiv);
    }

    renderTimeline() {
        // 新方法：只画时间轴，不画网格
        this.setupCanvas();
        const hours = this.currentView === 'day' ? 24 : 168;
        const pixelsPerHour = (AppConfig.pixelsPerHour * this.zoom) / 100;
        const totalWidth = hours * pixelsPerHour;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 1. 画主时间轴线（水平线）
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 20);
        this.ctx.lineTo(totalWidth, 20);
        this.ctx.stroke();
        
        // 2. 画时间刻度线（竖向短线）
        this.ctx.strokeStyle = '#bdc3c7';
        this.ctx.lineWidth = 1;
        
        const tickInterval = this.currentView === 'day' ? 1 : 24; // 日视图每小时，周视图每天
        
        for (let i = 0; i <= hours; i += tickInterval) {
            const x = i * pixelsPerHour;
            
            // 主刻度（每6小时或每天）
            if (i % (tickInterval * 6) === 0 || this.currentView === 'week') {
                this.ctx.lineWidth = 2;
                this.ctx.strokeStyle = '#7f8c8d';
                this.ctx.beginPath();
                this.ctx.moveTo(x, 10);
                this.ctx.lineTo(x, 30);
                this.ctx.stroke();
            } else {
                // 次刻度
                this.ctx.lineWidth = 1;
                this.ctx.strokeStyle = '#bdc3c7';
                this.ctx.beginPath();
                this.ctx.moveTo(x, 15);
                this.ctx.lineTo(x, 25);
                this.ctx.stroke();
            }
        }
        
        // 3. 画当前时间指示线
        const now = new Date();
        const hoursSinceStart = Utils.getHoursBetween(this.startDate, now);
        const maxHours = this.currentView === 'day' ? 24 : 168;
        
        if (hoursSinceStart >= 0 && hoursSinceStart <= maxHours) {
            const x = hoursSinceStart * pixelsPerHour;
            
            // 绘制当前时间线
            this.ctx.strokeStyle = '#e74c3c';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([5, 5]); // 虚线
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
            this.ctx.setLineDash([]); // 恢复实线
            
            // 绘制当前时间标签
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillText('现在', x - 15, 10);
            
            console.log('🔴 当前时间线位置:', x);
        }
    }

    renderTasks() {
        this.taskBarsContainer.innerHTML = '';
        const allTasks = taskManager.getAllTasks();
        const pixelsPerHour = (AppConfig.pixelsPerHour * this.zoom) / 100;
        
        console.log('📋 开始渲染任务:', allTasks.length + '个');
        
        if (allTasks.length === 0) {
            // 显示提示信息
            const hint = document.createElement('div');
            hint.style.cssText = `
                position: absolute;
                top: 100px;
                left: 50%;
                transform: translateX(-50%);
                color: #95a5a6;
                font-size: 16px;
                text-align: center;
            `;
            hint.innerHTML = `
                <div style="font-size: 48px; margin-bottom: 10px;">📋</div>
                <div>暂无任务</div>
                <div style="font-size: 14px; margin-top: 10px;">点击左上角"+ 新建任务"开始</div>
            `;
            this.taskBarsContainer.appendChild(hint);
            return;
        }

        // 渲染所有任务
        allTasks.forEach((task, index) => {
            const isChild = !!task.parentId;
            this.renderTaskBar(task, index, pixelsPerHour, isChild);
        });
    }

    renderTaskBar(task, rowIndex, pixelsPerHour, isChild = false) {
        const start = new Date(task.start);
        const end = new Date(task.end);
        
        const startOffset = Utils.getHoursBetween(this.startDate, start);
        const duration = Utils.getHoursBetween(start, end);
        
        const maxHours = this.currentView === 'day' ? 24 : 168;
        
        // 即使部分超出范围也显示
        if (startOffset + duration < -24 || startOffset > maxHours + 24) {
            return;
        }
        
        const bar = document.createElement('div');
        bar.className = 'task-bar';
        bar.dataset.taskId = task.id;
        
        // 从时间轴线下方开始排列（40px是时间轴的高度）
        const baseTop = 50;
        const rowHeight = 60;
        const left = startOffset * pixelsPerHour;
        const width = Math.max(duration * pixelsPerHour, 80);
        const top = baseTop + rowIndex * rowHeight;
        
        bar.style.left = left + 'px';
        bar.style.width = width + 'px';
        bar.style.top = top + 'px';
        bar.style.background = task.color || '#3498db';
        bar.style.position = 'absolute';
        bar.style.height = '45px';
        
        console.log('📌 渲染任务:', task.name, 'left=', left, 'width=', width, 'top=', top);
        
        if (isChild) {
            bar.style.opacity = '0.8';
            bar.style.marginLeft = '30px';
            bar.style.height = '35px';
        }
        
        // 任务内容
        const content = document.createElement('div');
        content.style.cssText = `
            display: flex;
            align-items: center;
            height: 100%;
            padding: 0 12px;
            pointer-events: none;
            gap: 8px;
        `;
        
        // 优先级图标
        const priorityIcon = {
            'urgent': '🔥',
            'high': '⚠️',
            'medium': '📌',
            'low': '📝'
        };
        
        content.innerHTML = `
            <span style="font-size: 16px;">${priorityIcon[task.priority] || '📋'}</span>
            <span style="font-weight: 500; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${task.name}
            </span>
            <span style="font-size: 11px; opacity: 0.8;">
                ${duration.toFixed(1)}h
            </span>
        `;
        
        bar.appendChild(content);
        
        // 调整大小手柄
        const leftHandle = document.createElement('div');
        leftHandle.className = 'task-bar-resize-handle left';
        leftHandle.style.background = 'rgba(255,255,255,0.5)';
        bar.appendChild(leftHandle);
        
        const rightHandle = document.createElement('div');
        rightHandle.className = 'task-bar-resize-handle right';
        rightHandle.style.background = 'rgba(255,255,255,0.5)';
        bar.appendChild(rightHandle);
        
        // 事件监听
        this.attachTaskBarEvents(bar, task);
        
        this.taskBarsContainer.appendChild(bar);
    }

    attachTaskBarEvents(bar, task) {
        bar.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('task-bar-resize-handle')) {
                this.startResize(e, bar, task);
            } else {
                this.startDrag(e, bar, task);
            }
        });
        
        bar.addEventListener('dblclick', () => {
            eventBus.emit('editTask', task);
        });
        
        // 鼠标悬停显示详情
        bar.addEventListener('mouseenter', () => {
            bar.style.transform = 'translateY(-3px)';
            bar.style.zIndex = '100';
        });
        
        bar.addEventListener('mouseleave', () => {
            if (!bar.classList.contains('dragging')) {
                bar.style.transform = 'translateY(0)';
                bar.style.zIndex = '1';
            }
        });
    }

    startDrag(e, bar, task) {
        this.draggedTask = { bar, task };
        this.dragStartX = e.clientX;
        this.dragStartTime = new Date(task.start);
        bar.classList.add('dragging');
        e.preventDefault();
    }

    startResize(e, bar, task) {
        const direction = e.target.classList.contains('left') ? 'left' : 'right';
        this.resizingTask = { bar, task, direction };
        this.dragStartX = e.clientX;
        e.stopPropagation();
        e.preventDefault();
    }

    attachEventListeners() {
        document.addEventListener('mousemove', (e) => {
            if (this.draggedTask) {
                this.handleDrag(e);
            } else if (this.resizingTask) {
                this.handleResize(e);
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (this.draggedTask) {
                this.draggedTask.bar.classList.remove('dragging');
                this.draggedTask.bar.style.transform = 'translateY(0)';
                this.draggedTask = null;
            }
            if (this.resizingTask) {
                this.resizingTask = null;
            }
        });
        
        this.container.addEventListener('scroll', () => {
            this.header.scrollLeft = this.container.scrollLeft;
        });
        
        window.addEventListener('resize', Utils.debounce(() => {
            this.render();
        }, 250));
    }

    handleDrag(e) {
        const deltaX = e.clientX - this.dragStartX;
        const pixelsPerHour = (AppConfig.pixelsPerHour * this.zoom) / 100;
        const deltaHours = deltaX / pixelsPerHour;
        
        const newStart = new Date(this.dragStartTime.getTime() + deltaHours * 3600000);
        const duration = Utils.getHoursBetween(this.draggedTask.task.start, this.draggedTask.task.end);
        const newEnd = new Date(newStart.getTime() + duration * 3600000);
        
        taskManager.updateTask(this.draggedTask.task.id, {
            start: Utils.formatDateTime(newStart),
            end: Utils.formatDateTime(newEnd)
        });
    }

    handleResize(e) {
        const deltaX = e.clientX - this.dragStartX;
        const pixelsPerHour = (AppConfig.pixelsPerHour * this.zoom) / 100;
        const deltaHours = deltaX / pixelsPerHour;
        
        const { task, direction } = this.resizingTask;
        
        if (direction === 'left') {
            const newStart = new Date(new Date(task.start).getTime() + deltaHours * 3600000);
            if (newStart < new Date(task.end)) {
                taskManager.updateTask(task.id, {
                    start: Utils.formatDateTime(newStart)
                });
                this.dragStartX = e.clientX;
            }
        } else {
            const newEnd = new Date(new Date(task.end).getTime() + deltaHours * 3600000);
            if (newEnd > new Date(task.start)) {
                taskManager.updateTask(task.id, {
                    end: Utils.formatDateTime(newEnd)
                });
                this.dragStartX = e.clientX;
            }
        }
    }

    setZoom(zoom) {
        this.zoom = Math.max(AppConfig.minZoom, Math.min(AppConfig.maxZoom, zoom));
        this.render();
        return this.zoom;
    }

    setView(view) {
        if (['day', 'week'].includes(view)) {
            this.currentView = view;
            this.render();
        }
    }

    goToToday() {
        this.startDate = Utils.getTodayStart();
        this.render();
    }
}

const timeline = new Timeline();
