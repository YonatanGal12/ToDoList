// manager.js
import { Task, subTask } from './task.js';

export class TasksManager {
    constructor() {
        this.tasks = [];
    }

    add(task) {
        this.tasks.push(task);
        this.saveToStorage();
    }

    remove(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveToStorage();
    }

    markComplete(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.completed = true;
            this.saveToStorage();
        }
    }

    editTask(id, name, description, deadline) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.name = name;
            task.description = description;
            task.deadline = deadline;
            this.saveToStorage();
        }
    }

    saveToStorage() {
        localStorage.setItem("tasks", JSON.stringify(this.tasks.map(t => t.toObject())));
    }

    loadFromStorage() {
        const data = JSON.parse(localStorage.getItem("tasks"));
        if (data && Array.isArray(data)) {
            this.tasks = data.map(t => {
                const task = new Task(
                    t.name,
                    t.description,
                    new Date(t.deadline),
                    [],
                    t.completed,
                    new Date(t.date),
                    t.id
                );

                task.subTasks = t.subTasks.map(st => {
                    const sub = new subTask(
                        st.name,
                        st.description,
                        new Date(st.deadline),
                        st.completed,
                        new Date(st.date),
                        st.id
                    );
                    return sub;
                });

                return task;
            });

            // Update last used IDs to avoid duplicates
            const allTaskIds = this.tasks.map(t => t.id);
            Task._lastId = Math.max(0, ...allTaskIds);

            const allSubTaskIds = this.tasks.flatMap(t => t.subTasks.map(st => st.id));
            subTask._lastSubId = Math.max(0, ...allSubTaskIds);
        }
    }
}
