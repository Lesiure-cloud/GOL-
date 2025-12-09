// ===== UI控制器 =====

class UIController {
    constructor() {
        this.modal = document.getElementById('taskModal');
        this.taskForm = document.getElementById('taskForm');
        this.taskList = document.getElementById('taskList');
        this.currentEditingTask = null;
        
        this.init();
    }

    init() {
        this.attachEventListeners();
        this.renderTaskList();
        
        eventBus.on('tasksUpdated', () => this.renderTaskList());
        eventBus.on('editTask', (task) => this.openEditModal(task));
    }

    attachEventListeners() {
        // 新建任务
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.openNewTaskModal();
        });
        
        // 缩放
        document.getElementById('zoomIn').addEventListener('click', () => {
            const newZoom = timeline.setZoom(timeline.zoom + AppConfig.zoomStep);
            document.getElementById('zoomLevel').textContent = newZoom + '%';
        });
        
        document.getElementById('zoomOut').addEventListener('click', () => {
            const newZoom = timeline.setZoom(timeline.zoom - AppConfig.zoomStep);
            document.getElementById('zoomLevel').textContent = newZoom + '%';
        });
        
        // 视图切换
        document.querySelectorAll('.btn-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-toggle').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                timeline.setView(e.target.dataset.view);
            });
        });
        
        // 今天
        document.getElementById('todayBtn').addEventListener('click', () => {
            timeline.goToToday();
        });
        
        // 导出
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportToICS();
        });
        
        // 模态框
        this.modal.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });
        
        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeModal();
        });
        
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        // 表单提交
        this.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });
        
        // 子任务复选框
        document.getElementById('hasParent').addEventListener('change', (e) => {
            document.getElementById('parentSelectGroup').style.display = 
                e.target.checked ? 'block' : 'none';
        });
        
        // 搜索
        document.getElementById('searchTask').addEventListener('input', 
            Utils.debounce((e) => {
                this.handleSearch(e.target.value);
            }, 300)
        );
    }

    renderTaskList() {
        this.taskList.innerHTML = '';
        const parentTasks = taskManager.getParentTasks();
        
        if (parentTasks.length === 0) {
            this.taskList.innerHTML = '<p style="padding: 20px; text-align: center; color: #999;">暂无任务</p>';
            return;
        }
        
        parentTasks.forEach(task => {
            this.renderTaskItem(task);
        });
        
        this.updateParentTaskOptions();
    }

    renderTaskItem(task) {
        const item = document.createElement('div');
        item.className = 'task-item';
        const children = taskManager.getChildTasks(task.id);
        
        if (children.length > 0) {
            item.classList.add('has-children');
        }
        
        item.dataset.taskId = task.id;
        
        const startDate = new Date(task.start);
        const endDate = new Date(task.end);
        const duration = Utils.getHoursBetween(startDate, endDate);
        
        item.innerHTML = `
            <div class="task-item-header">
                ${children.length > 0 ? 
                    `<button class="collapse-btn" data-task-id="${task.id}">▼</button>` : 
                    '<span style="width: 20px; display: inline-block;"></span>'
                }
                <div class="task-item-title">${task.name}</div>
                <div class="task-item-priority priority-${task.priority || 'medium'}"></div>
            </div>
            <div class="task-item-info">
                <span>⏰ ${Utils.formatDate(startDate, 'MM-DD HH:mm')}</span>
                <span>⏱️ ${duration.toFixed(1)}h</span>
            </div>
            <div class="task-item-actions">
                <button class="btn btn-secondary btn-edit">编辑</button>
                <button class="btn btn-secondary btn-delete">删除</button>
            </div>
        `;
        
        // 事件监听
        const editBtn = item.querySelector('.btn-edit');
        editBtn.addEventListener('click', () => this.openEditModal(task));
        
        const deleteBtn = item.querySelector('.btn-delete');
        deleteBtn.addEventListener('click', () => this.deleteTask(task.id));
        
        const collapseBtn = item.querySelector('.collapse-btn');
        if (collapseBtn) {
            collapseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSubtasks(task.id);
            });
        }
        
        this.taskList.appendChild(item);
        
        // 渲染子任务
        if (children.length > 0) {
            const subtasksContainer = document.createElement('div');
            subtasksContainer.className = 'subtasks';
            subtasksContainer.dataset.parentId = task.id;
            
            children.forEach(child => {
                const childItem = this.createSubtaskItem(child);
                subtasksContainer.appendChild(childItem);
            });
            
            this.taskList.appendChild(subtasksContainer);
        }
    }

    createSubtaskItem(task) {
        const item = document.createElement('div');
        item.className = 'task-item';
        item.dataset.taskId = task.id;
        
        const startDate = new Date(task.start);
        const duration = Utils.getHoursBetween(startDate, new Date(task.end));
        
        item.innerHTML = `
            <div class="task-item-header">
                <span style="width: 20px; display: inline-block;">└</span>
                <div class="task-item-title">${task.name}</div>
                <div class="task-item-priority priority-${task.priority || 'medium'}"></div>
            </div>
            <div class="task-item-info">
                <span>⏰ ${Utils.formatDate(startDate, 'MM-DD HH:mm')}</span>
                <span>⏱️ ${duration.toFixed(1)}h</span>
            </div>
            <div class="task-item-actions">
                <button class="btn btn-secondary btn-edit">编辑</button>
                <button class="btn btn-secondary btn-delete">删除</button>
            </div>
        `;
        
        const editBtn = item.querySelector('.btn-edit');
        editBtn.addEventListener('click', () => this.openEditModal(task));
        
        const deleteBtn = item.querySelector('.btn-delete');
        deleteBtn.addEventListener('click', () => this.deleteTask(task.id));
        
        return item;
    }

    toggleSubtasks(taskId) {
        const subtasksContainer = this.taskList.querySelector(`.subtasks[data-parent-id="${taskId}"]`);
        const collapseBtn = this.taskList.querySelector(`.collapse-btn[data-task-id="${taskId}"]`);
        
        if (subtasksContainer) {
            subtasksContainer.classList.toggle('collapsed');
            collapseBtn.textContent = subtasksContainer.classList.contains('collapsed') ? '▶' : '▼';
        }
    }

    openNewTaskModal() {
        this.currentEditingTask = null;
        document.getElementById('modalTitle').textContent = '新建任务';
        this.taskForm.reset();
        
        // 设置默认时间
        const now = new Date();
        now.setMinutes(0);
        const start = new Date(now.getTime() + 3600000);
        const end = new Date(start.getTime() + 2 * 3600000);
        
        document.getElementById('taskStart').value = Utils.formatDateTime(start);
        document.getElementById('taskEnd').value = Utils.formatDateTime(end);
        document.getElementById('taskColor').value = '#3498db';
        document.getElementById('hasParent').checked = false;
        document.getElementById('parentSelectGroup').style.display = 'none';
        
        this.modal.classList.add('show');
    }

    openEditModal(task) {
        this.currentEditingTask = task;
        document.getElementById('modalTitle').textContent = '编辑任务';
        
        document.getElementById('taskName').value = task.name;
        document.getElementById('taskStart').value = task.start;
        document.getElementById('taskEnd').value = task.end;
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskPriority').value = task.priority || 'medium';
        document.getElementById('taskColor').value = task.color || '#3498db';
        
        const hasParent = !!task.parentId;
        document.getElementById('hasParent').checked = hasParent;
        document.getElementById('parentSelectGroup').style.display = hasParent ? 'block' : 'none';
        
        if (hasParent) {
            document.getElementById('parentTask').value = task.parentId;
        }
        
        this.modal.classList.add('show');
    }

    closeModal() {
        this.modal.classList.remove('show');
    }

    handleFormSubmit() {
        const taskData = {
            name: document.getElementById('taskName').value,
            start: document.getElementById('taskStart').value,
            end: document.getElementById('taskEnd').value,
            description: document.getElementById('taskDescription').value,
            priority: document.getElementById('taskPriority').value,
            color: document.getElementById('taskColor').value,
            parentId: document.getElementById('hasParent').checked ? 
                document.getElementById('parentTask').value : null
        };
        
        if (this.currentEditingTask) {
            taskManager.updateTask(this.currentEditingTask.id, taskData);
        } else {
            taskManager.addTask(taskData);
        }
        
        this.closeModal();
    }

    deleteTask(id) {
        if (confirm('确定删除此任务吗？')) {
            taskManager.deleteTask(id);
        }
    }

    updateParentTaskOptions() {
        const select = document.getElementById('parentTask');
        select.innerHTML = '<option value="">选择父任务</option>';
        
        taskManager.getParentTasks().forEach(task => {
            const option = document.createElement('option');
            option.value = task.id;
            option.textContent = task.name;
            select.appendChild(option);
        });
    }

    handleSearch(query) {
        if (!query) {
            this.renderTaskList();
            return;
        }
        
        const results = taskManager.searchTasks(query);
        this.taskList.innerHTML = '';
        
        if (results.length === 0) {
            this.taskList.innerHTML = '<p style="padding: 20px; text-align: center; color: #999;">未找到匹配任务</p>';
            return;
        }
        
        results.forEach(task => {
            this.renderTaskItem(task);
        });
    }

    exportToICS() {
    // 调用独立的日历导出模块
    calendarExporter.exportToICS();
}

}

// 启动UI控制器
const uiController = new UIController();
