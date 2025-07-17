
import { formatDate , toLocalDatetimeString} from "./helper.js";
import { subTask , Task } from "./task.js";
import { TasksManager } from './manager.js';




document.addEventListener("DOMContentLoaded", () => {

    //Represents the form
    const form = document.getElementById("list-form");
    const editForm = document.getElementById("edit-form");
    //Represents that table's body
    const tasksBody = document.getElementById("tasks-body");

    //Create the modals
    const youSuremodal = document.getElementById("youSure");
    const editModal = document.getElementById("editModal");


    //Elements I need for stuff
    let lastClickedCheckbox = null;
    let taskIdBeingEdited = null;



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
        //addTaskToTable(task);
        applySort();
        form.reset();
    })

    function addTaskToTable(task)
    {
        //Creates a new row element, modifies its html to fit the task added,
        //then adds it to the tbody of the table.
        const row = document.createElement("tr");

        if (task.completed) 
        {
            row.classList.add("completed-row");
        }

        row.innerHTML = `
            <td>${task.name}</td> 
            <td>${formatDate(task.date)}</td> 
            <td>${formatDate(task.deadline)}</td> 
            <td>
                <input type="checkbox" class="complete-input" data-type="task" data-index="${task.id}" id="complete-input">
            </td> 
            <td>
                <button class="delete-btn" data-index="${task.id}">Delete</button>
                <button class="edit-btn" data-index="${task.id}">Edit</button>
                <button class="details-btn" data-index="${task.id}">View Details</button>
                <button class="add-sub-btn" data-index="${task.id}">Add SubTask</button>
            </td>
        `;
        tasksBody.appendChild(row);
        return row;
    }

    function deleteAllTable()
    {
        tasksBody.innerHTML = '';
    }

    function addRowsBelowTask(row, task)
    {
        task.subTasks.forEach((sub) => {
            const newRow = document.createElement('tr');

            if (sub.completed) 
            {
                row.classList.add("completed-row");
            }
            newRow.innerHTML = `
                <td>${sub.name}</td> 
                <td>${formatDate(sub.date)}</td> 
                <td>${formatDate(sub.deadline)}</td> 
                <td>
                    <input type="checkbox" class="complete-input" data-type="subTask" data-index="${sub.id} id="complete-input">
                </td> 
                <td>
                    <button class="delete-btn" data-index="${sub.id}">Delete</button>
                    <button class="edit-btn" data-index="${sub.id}">Edit</button>
                    <button class="details-btn" data-index="${sub.id}">View Details</button>
                </td>
            `
            row.parentNode.insertBefore(newRow,row.nextSibling);
        })
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

            const taskToEdit = manager.tasks.find((task) => task.id === taskId);
            if (!taskToEdit) return;

            taskIdBeingEdited = taskId;

            document.getElementById("edit-name-input").value = taskToEdit.name;
            document.getElementById("edit-description-input").value = taskToEdit.description;
            document.getElementById("edit-deadline-input").value = new Date(taskToEdit.deadline);


            const bounds = btn.getBoundingClientRect();
            editModal.style.left = `${bounds.left + window.scrollX - 95}px`;
            editModal.style.top = `${bounds.top + window.scrollY - 375}px`;
            editModal.classList.add("show");
        }
        else if(btn.classList.contains("details-btn"))
        {
            if(btn.textContent.includes('View'))
            {
                const taskToShow = manager.tasks.find((task) => task.id === taskId)
                if (!taskToShow) return;

                taskToShow.addSubTask(new subTask("blah","blahblah", new Date()));
                taskToShow.addSubTask(new subTask("blah1111","blahblah1111", new Date()));
                addRowsBelowTask(btn.closest("tr"), taskToShow);
                btn.textContent = "Hide Details";
            }
            else
            {
                deleteAllTable();
                manager.tasks.forEach((task) => {
                    if (task.id !== taskId) 
                    {
                        const row = addTaskToTable(task);
                        addRowsBelowTask(row, task); 
                    } else 
                    {
                        addTaskToTable(task); 
                    }
                });
                btn.textContent = "View Details";
            }
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

            const taskId = Number(lastClickedCheckbox.dataset.index);
            const type = lastClickedCheckbox.dataset.type;

            console.log(taskId);
            lastClickedCheckbox.closest("tr").classList.add("completed-row")
            lastClickedCheckbox.checked = true;

            if (type === "task") 
            {
                manager.markComplete(taskId);
            } 
            else 
            {
                console.log("Subtask clicked, not handled in markComplete.");
            }

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
        e.preventDefault();
        const btn = e.target;

        if(btn.classList.contains("confirm-btn"))
        {
            const taskName = editForm.querySelector("#edit-name-input").value.trim();
            const taskDesc = editForm.querySelector("#edit-description-input").value.trim();
            const taskDeadline = new Date(editForm.querySelector("#edit-deadline-input").value.trim());

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
            manager.editTask(taskIdBeingEdited,taskName,taskDesc,taskDeadline);
            applySort();
            editModal.classList.remove("show");
        }
        else if(btn.classList.contains("cancel-btn"))
        {
            taskIdBeingEdited = null;
            editModal.classList.remove("show");
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


    const sortSelect = document.getElementById("sort-select");
    sortSelect.addEventListener("change",applySort);

    function applySort()
    {
        if(sortSelect.value === "name")
        {
            const sorted = manager.tasks.sort((a,b) => a.name.localeCompare(b.name));
            deleteAllTable();
            sorted.forEach((t) => addTaskToTable(t));
        }
        else if(sortSelect.value === "dateAdded")
        {
            const sorted = manager.tasks.sort((a,b) => new Date(a.date) - new Date(b.date));
            deleteAllTable();
            sorted.forEach((t) => addTaskToTable(t));
        }
        else if(sortSelect.value === "deadline")
        {
            const sorted = manager.tasks.sort((a,b) => new Date(a.deadline) - new Date(b.deadline));
            deleteAllTable();
            sorted.forEach((t) => addTaskToTable(t));
        }
    }

    const whatToShow = document.getElementById("filter-select");
    whatToShow.addEventListener("change", showRightTasks);
    function showRightTasks()
    {
        if(sortSelect.value === "complete")
        {
            const showed = manager.tasks.filter((task) => task.completed);
            deleteAllTable();
            showed.forEach((t) => addTaskToTable(t));
        }
        else if(sortSelect.value === "incomplete")
        {
            const showed = manager.tasks.filter((task) => !task.completed);
            deleteAllTable();
            showed.forEach((t) => addTaskToTable(t));
        }
        else
        {
            const showed = manager.tasks;
            deleteAllTable();
            showed.forEach((t) => addTaskToTable(t));
        }
    }
})