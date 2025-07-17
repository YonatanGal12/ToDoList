

import { formatDate , toLocalDatetimeString} from "./helper.js";

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
            deadline: this.deadline,
            date: this.date, 
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
        this.tasks = this.tasks.filter(task => task.id != id);
        this.saveToStorage();
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

    //Represents the form
    const form = document.getElementById("list-form");

    //Represents that table's body
    const tasksBody = document.getElementById("tasks-body");

    //Create the modals
    const youSuremodal = document.getElementById("youSure");
    const editModal = document.getElementById("editModal");


    //An element the followes the last clicked checkbox
    let lastClickedCheckbox = null;

    const manager = new TasksManager();
    manager.loadFromStorage();

    manager.tasks.forEach(task => {
        addTaskToTable(task);
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const taskName = form.querySelector("#name-input").value.trim();
        const taskDesc = form.querySelector("#description-input").value.trim();
        const taskDeadline = new Date(form.querySelector("#deadline-input").value.trim());

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
        //Creates a new row element, modifies its html to fit the task added,
        //then adds it to the tbody of the table.
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${task.name}</td> 
            <td>${formatDate(task.date)}</td> 
            <td>${formatDate(task.deadline)}</td> 
            <td>
                <input type="checkbox" class="complete-input" data-index="${task.id} id="complete-input"></input>
            </td> 
            <td>
                <button class="delete-btn" data-index="${task.id}">Delete</button>
                <button class="edit-btn" data-index="${task.id}">Edit</button>
                <button class="details-btn" data-index="${task.id}">View Details</button>
            </td>
        `;
        tasksBody.appendChild(row);
    }


    tasksBody.addEventListener("click", (e) => {
        const btn = e.target;
        

        const taskId = Number(btn.dataset.index);
        if(btn.classList.contains("delete-btn"))
        {
            manager.remove(taskId);
            btn.closest("tr").remove();
        }
        else if(btn.classList.contains("edit-btn"))
        {

            const taskToEdit = manager.tasks.find((task) => task.id === taskId)
            document.getElementById("edit-name-input").value = taskToEdit.name;
            document.getElementById("edit-description-input").value = taskToEdit.description;
            document.getElementById("edit-deadline-input").value = toLocalDatetimeString(taskToEdit.deadline);

            const bounds = btn.getBoundingClientRect();
            editModal.style.left = `${bounds.left + window.scrollX - 95}px`;
            editModal.style.top = `${bounds.top + window.scrollY - 375}px`;
            editModal.classList.add("show");
        }
        else if(btn.classList.contains("details-btn"))
        {
            
        }
        else if(btn.classList.contains("complete-input"))
        {
            btn.checked = false;
            // If someone pressed on another checkbox before choosing yes or no
            if(lastClickedCheckbox && youSuremodal.classList.contains("show") && lastClickedCheckbox === btn)
            {
                youSuremodal.classList.remove("show");
                btn.checked = false;
                lastClickedCheckbox = null;
                return;
            }

            if(lastClickedCheckbox && lastClickedCheckbox !== btn)
            {
                lastClickedCheckbox.checked = false;
            }

            lastClickedCheckbox = btn;

            const bounds = btn.getBoundingClientRect();

            youSuremodal.style.left = `${bounds.left + window.scrollX - 169}px`;
            youSuremodal.style.top = `${bounds.top + window.scrollY - 100}px`;
            youSuremodal.classList.add("show");
        }
    })

    youSuremodal.addEventListener("click", (e) => {
        const btn = e.target;
        if(btn.classList.contains("yesBtn"))
        {
            lastClickedCheckbox.closest("tr").classList.add("completed-row")
            lastClickedCheckbox.checked = true;
            lastClickedCheckbox = null;
            youSuremodal.classList.remove("show");
        }
        else if(btn.classList.contains("noBtn"))
        {
            youSuremodal.classList.remove("show");
            if(lastClickedCheckbox)
            {
                lastClickedCheckbox.checked = false;
                lastClickedCheckbox = null;
            }
        }
    })

    editModal.addEventListener("click", (e) => {
        const btn = e.target;
        if(btn.classList.contains("confirmBtn"))
        {
            
        }
        else if(btn.classList.contains("noBtn"))
        {
            
        }
    })

    //Close a modal when clicking outside of it
    document.addEventListener("click", (e) => {
        setTimeout(() => {
            if(youSuremodal.classList.contains("show") && !youSuremodal.contains(e.target)
            && e.target !== lastClickedCheckbox)
            {
                youSuremodal.classList.remove("show");
                lastClickedCheckbox.checked = false;
                lastClickedCheckbox = null;
            }
            if(editModal.classList.contains("show") && !editModal.contains(e.target)
            && !e.target.classList.contains("edit-btn"))
            {
                editModal.classList.remove("show");
            }
        },1)
    })
})