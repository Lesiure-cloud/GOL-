// ===== 任务管理器 =====

class TaskManager {
    constructor() {
        this.tasks = [];
        this.loadTasks();
    }

    loadTasks() {
        const saved = Storage.load(AppConfig.storageKey);
        this.tasks = saved || this.getDefaultTasks();
        this.saveTasks();
        console.log('📦 加载任务:', this.tasks.length + '个');
    }

    saveTasks() {
        Storage.save(AppConfig.storageKey, this.tasks);
        eventBus.emit('tasksUpdated', this.tasks);
    }

    getDefaultTasks() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        console.log('🎯 创建默认任务，基准时间:', today);
        
        return [
            {
                id: Utils.generateId(),
                name: '早晨会议',
                start: Utils.formatDateTime(new Date(today.getTime() + 9 * 3600000)), // 今天9:00
                end: Utils.formatDateTime(new Date(today.getTime() + 11 * 3600000)),   // 今天11:00
                description: '团队晨会',
                priority: 'high',
                color: '#3498db',
                parentId: null
            },
            {
                id: Utils.generateId(),
                name: '项目开发',
                start: Utils.formatDateTime(new Date(today.getTime() + 14 * 3600000)), // 今天14:00
                end: Utils.formatDateTime(new Date(today.getTime() + 18 * 3600000)),   // 今天18:00
                description: '编写代码',
                priority: 'medium',
                color: '#2ecc71',
                parentId: null
            },
            {
                id: Utils.generateId(),
                name: '代码审查',
                start: Utils.formatDateTime(new Date(today.getTime() + 19 * 3600000)), // 今天19:00
                end: Utils.formatDateTime(new Date(today.getTime() + 20 * 3600000)),   // 今天20:00
                description: 'Review代码',
                priority: 'medium',
                color: '#9b59b6',
                parentId: null
            }
        ];
    }

    getAllTasks() {
        return this.tasks;
    }

    getTask(id) {
        return this.tasks.find(task => task.id === id);
    }

    addTask(taskData) {
        const newTask = {
            id: Utils.generateId(),
            ...taskData
        };
        this.tasks.push(newTask);
        console.log('➕ 添加任务:', newTask.name);
        this.saveTasks();
        return newTask;
    }

    updateTask(id, updates) {
        const index = this.tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            this.tasks[index] = { ...this.tasks[index], ...updates };
            console.log('✏️ 更新任务:', this.tasks[index].name);
            this.saveTasks();
            return this.tasks[index];
        }
        return null;
    }

    deleteTask(id) {
        const task = this.getTask(id);
        if (task) {
            console.log('🗑️ 删除任务:', task.name);
        }
        
        // 删除子任务
        this.tasks.filter(t => t.parentId === id).forEach(child => {
            this.deleteTask(child.id);
        });
        
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
    }

    getParentTasks() {
        return this.tasks.filter(task => !task.parentId);
    }

    getChildTasks(parentId) {
        return this.tasks.filter(task => task.parentId === parentId);
    }

    searchTasks(query) {
        const lower = query.toLowerCase();
        return this.tasks.filter(task => 
            task.name.toLowerCase().includes(lower) ||
            (task.description && task.description.toLowerCase().includes(lower))
        );
    }
}

const taskManager = new TaskManager();
