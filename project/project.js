

import { formatDate } from "./helper.js";

class subTasks
{
    constructor(name,description,deadline,date = new Date())
    {
        this.name = name;
        this.description = description;
        this.completed = false;
        this.deadline = deadline;
        this.date = date;
    }

    complete()
    {
        this.completed = true;
    }

    toObject()
    {
        return{
            name: this.name,
            description: this.description,
            completed: this.completed,
            deadline: this.deadline,
            date: this.date
        }
    }
}

class Task
{
    static _lastId = 0;
    constructor(name, description, deadline, subTasks = [], completed = false,date = new Date())
    {
        this.id = ++Task._lastId;
        this.subTasks = subTasks;
        this.name = name;
        this.description = description;
        this.completed = completed;
        this.deadline = deadline;
        this.date = date;
    }

    addSubTask(subTask)
    {
        this.subTasks.push(subTask);
    }

    removeSubTask(id)
    {
        this.subTasks = this.subTasks.filter(sub => sub.id !== id);
    }

    toObject() 
    {
        return {
            id: this.id,
            subTasks: this.subTasks,
            name: this.name,
            description: this.description,
            deadline: this.deadline.toISOString(),
            date: this.date.toISOString(), 
        };
    }
}
class TasksManager
{
    constructor()
    {
        this.tasks = []
    }

    add(task)
    {
        this.tasks.push(task);
        this.saveToStorage();
    }

    remove(id)
    {
        this.tasks = this.tasks.filter(task => task.id !== id);
    }

    saveToStorage()
    {
        localStorage.setItem("tasks",JSON.stringify(this.tasks));
    }

    loadFromStorage()
    {
        const loaded = JSON.parse(localStorage.getItem("tasks")) || [];
        this.tasks = loaded.map(task => new Task(task.name,  task.description,
            task.deadline, task.subTasks, task.completed, task.date
        ));//When you save to local storage, methods get lost, so I create new tasks.
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("list-form");

    const tasksBody = document.getElementById("tasks-body");
    const manager = new TasksManager();

    manager.loadFromStorage();

    manager.tasks.forEach(task => {
        addTaskToTable(task);
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const taskName = form.querySelector("#name-input").value.trim();
        const taskDesc = form.querySelector("#description-input").value.trim();
        const taskDeadline = new Date(form.querySelector("#deadline-input").value);

        if(!taskName || !taskDesc || !taskDeadline)
        {
            console.error("Invalid inputs. Please try again.");
            return;
        }

        //If deadline is before today, it's invalid.
        if(taskDeadline < new Date())
        {
            console.error("Cannot go back in time.");
            return;
        }
        const task = new Task(taskName,taskDesc,taskDeadline);
        manager.add(task);
        addTaskToTable(task);
        form.reset();
    })

    function addTaskToTable(task)
    {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${task.name}</td> 
            <td>${formatDate(task.date)}</td> 
            <td>${formatDate(task.deadline)}</td> 
            <td>
                <button class="delete-btn" data-index="${task.id}">Delete</button>
                <button class="edit-btn" data-index="${task.id}">Edit</button>
                <button class="details-btn" data-index="${task.id}">View Details</button>
            </td>
        `;
        tasksBody.appendChild(row);
    }
})