// ===== 日历导出模块 =====

class CalendarExporter {
    constructor() {
        this.init();
    }

    init() {
        console.log('📅 日历导出模块已加载');
    }

    /**
     * 导出任务为 iCalendar (.ics) 格式
     */
    exportToICS() {
        const tasks = taskManager.getAllTasks();
        
        if (tasks.length === 0) {
            alert('没有任务可以导出！');
            return;
        }

        let icsContent = this.generateICSHeader();
        
        tasks.forEach(task => {
            icsContent += this.generateICSEvent(task);
        });
        
        icsContent += 'END:VCALENDAR';
        
        this.downloadICS(icsContent);
    }

    /**
     * 生成 ICS 文件头
     */
    generateICSHeader() {
        return [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Timeline Planner//CN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'X-WR-CALNAME:时间轴计划',
            'X-WR-TIMEZONE:Asia/Shanghai',
            ''
        ].join('\r\n');
    }

    /**
     * 生成单个事件
     */
    generateICSEvent(task) {
        const start = this.formatICSDateTime(new Date(task.start));
        const end = this.formatICSDateTime(new Date(task.end));
        const created = this.formatICSDateTime(new Date());
        
        let event = [
            'BEGIN:VEVENT',
            `UID:${task.id}@timelineplanner.local`,
            `DTSTAMP:${created}`,
            `DTSTART:${start}`,
            `DTEND:${end}`,
            `SUMMARY:${this.escapeICSText(task.name)}`,
        ];
        
        if (task.description) {
            event.push(`DESCRIPTION:${this.escapeICSText(task.description)}`);
        }
        
        // 添加优先级
        if (task.priority) {
            const priorityMap = {
                'low': '9',
                'medium': '5',
                'high': '3',
                'urgent': '1'
            };
            event.push(`PRIORITY:${priorityMap[task.priority] || '5'}`);
        }
        
        // 添加颜色分类
        if (task.color) {
            event.push(`CATEGORIES:${task.priority || 'normal'}`);
        }
        
        // 添加状态
        event.push('STATUS:CONFIRMED');
        
        event.push('END:VEVENT');
        event.push('');
        
        return event.join('\r\n');
    }

    /**
     * 格式化日期为 ICS 格式
     * 格式: 20240115T100000Z
     */
    formatICSDateTime(date) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hour = String(date.getUTCHours()).padStart(2, '0');
        const minute = String(date.getUTCMinutes()).padStart(2, '0');
        const second = String(date.getUTCSeconds()).padStart(2, '0');
        
        return `${year}${month}${day}T${hour}${minute}${second}Z`;
    }

    /**
     * 转义 ICS 文本中的特殊字符
     */
    escapeICSText(text) {
        return text
            .replace(/\\/g, '\\\\')
            .replace(/;/g, '\\;')
            .replace(/,/g, '\\,')
            .replace(/\n/g, '\\n');
    }

    /**
     * 下载 ICS 文件
     */
    downloadICS(content) {
        const blob = new Blob([content], { 
            type: 'text/calendar;charset=utf-8' 
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        const now = new Date();
        const filename = `timeline-tasks-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}.ics`;
        
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        this.showExportSuccess(filename);
    }

    /**
     * 显示导出成功提示
     */
    showExportSuccess(filename) {
        // 创建提示框
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2ecc71;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            font-size: 14px;
            animation: slideIn 0.3s ease;
        `;
        
        notification.innerHTML = `
            <strong>✅ 导出成功！</strong><br>
            <small>${filename}</small>
        `;
        
        document.body.appendChild(notification);
        
        // 3秒后自动消失
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    /**
     * 导入 ICS 文件（未来功能）
     */
    importFromICS(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const content = e.target.result;
            this.parseICS(content);
        };
        
        reader.readAsText(file);
    }

    /**
     * 解析 ICS 文件（简化版）
     */
    parseICS(content) {
        // 这里可以添加 ICS 解析逻辑
        console.log('ICS 导入功能开发中...');
        alert('导入功能将在未来版本中提供');
    }

    /**
     * 同步到 Google Calendar
     */
    syncToGoogleCalendar() {
        const tasks = taskManager.getAllTasks();
        
        if (tasks.length === 0) {
            alert('没有任务可以同步！');
            return;
        }

        // 生成 Google Calendar URL
        const task = tasks[0]; // 示例：同步第一个任务
        const startDate = new Date(task.start);
        const endDate = new Date(task.end);
        
        const googleCalendarUrl = this.generateGoogleCalendarUrl({
            text: task.name,
            dates: this.formatGoogleCalendarDate(startDate, endDate),
            details: task.description || '',
            location: ''
        });
        
        window.open(googleCalendarUrl, '_blank');
    }

    /**
     * 生成 Google Calendar URL
     */
    generateGoogleCalendarUrl(params) {
        const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
        const queryParams = new URLSearchParams({
            text: params.text,
            dates: params.dates,
            details: params.details,
            location: params.location || ''
        });
        
        return `${baseUrl}&${queryParams.toString()}`;
    }

    /**
     * 格式化为 Google Calendar 日期格式
     */
    formatGoogleCalendarDate(start, end) {
        const formatDate = (date) => {
            return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };
        
        return `${formatDate(start)}/${formatDate(end)}`;
    }
}

// 创建日历导出器实例
const calendarExporter = new CalendarExporter();
