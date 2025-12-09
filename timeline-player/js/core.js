// ===== 核心配置和工具函数 =====

const AppConfig = {
    storageKey: 'timelinePlanner_tasks',
    defaultZoom: 100,
    minZoom: 50,
    maxZoom: 200,
    zoomStep: 25,
    pixelsPerHour: 100,
    rowHeight: 50
};

const Utils = {
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    formatDate(date, format = 'YYYY-MM-DD HH:mm') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hour = String(d.getHours()).padStart(2, '0');
        const minute = String(d.getMinutes()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hour)
            .replace('mm', minute);
    },

    formatDateTime(date) {
        return this.formatDate(date, 'YYYY-MM-DDTHH:mm');
    },

    getHoursBetween(start, end) {
        return (new Date(end) - new Date(start)) / (1000 * 60 * 60);
    },

    getTodayStart() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    },

    isToday(date) {
        const today = new Date();
        const d = new Date(date);
        return d.toDateString() === today.toDateString();
    },

    debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
};

const Storage = {
    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('存储失败:', e);
            return false;
        }
    },

    load(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('读取失败:', e);
            return null;
        }
    }
};

class EventBus {
    constructor() {
        this.events = {};
    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }
}

const eventBus = new EventBus();
