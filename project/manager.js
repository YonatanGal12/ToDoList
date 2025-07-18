import { Task } from './task.js';

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
        const task = this.tasks.find((t) => t.id == id);
        if (task)
        {
            console.log("task id:" + task.id);
            task.completed = true;
            this.saveToStorage();
        }
    }

    editTask(id, name, description, deadline) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) {
            console.error("Task not found.");
            return;
        }

        task.name = name;
        task.description = description;
        task.deadline = deadline;
        this.saveToStorage();
    }

    saveToStorage() {
        localStorage.setItem("tasks", JSON.stringify(this.tasks));
    }

    loadFromStorage() {
        const raw = JSON.parse(localStorage.getItem("tasks")) || [];
        this.tasks = raw.map((t) => {
            return new Task(
            t.name, t.description, t.deadline, t.subTasks, t.completed, t.date
            );
        })
        /*const raw = JSON.parse(localStorage.getItem("tasks")) || [];
        this.tasks = raw.map(t => {
            const restoredSubTasks = (t.subTasks || []).map(s =>
            new subTask(s.name, s.description, s.deadline, s.completed, s.date)
            );
            return new Task(
            t.name, t.description, t.deadline, restoredSubTasks, t.completed, t.date
            );
        });*/
    }
}