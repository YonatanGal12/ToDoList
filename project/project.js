
import { formatDate , toLocalDatetimeString} from "./helper.js";
import { subTask , Task } from "./task.js";
import { TasksManager } from './manager.js';




document.addEventListener("DOMContentLoaded", () => {

    //Represents the forms
    const form = document.getElementById("list-form");
    const editForm = document.getElementById("edit-form");
    const addSubForm = document.getElementById("subtask-form");

    //Represents that table's body
    const tasksBody = document.getElementById("tasks-body");

    //Create the modals
    const youSuremodal = document.getElementById("youSure");
    const editModal = document.getElementById("editModal");
    const addSubTaskModal = document.getElementById("subtask-modal");

    //Elements I need for stuff
    let lastClickedCheckbox = null;
    let taskIdBeingEdited = null;
    let parentTaskOfEdited = null;
    let taskBeingAddedId = null;

    let tasksWithSubTasksShown = [];


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
        applyAllFilters();
        form.reset();
    })

    function addTaskToTable(task)
    {
        //Creates a new row element, modifies its html to fit the task added,
        //then adds it to the tbody of the table.
        const row = document.createElement("tr");



        if (task.completed) 
        {
            row.innerHTML = `
                <td>${task.name}</td> 
                <td>${formatDate(task.date)}</td> 
                <td>${formatDate(task.deadline)}</td> 
                <td>
                    <input type="checkbox" class="complete-input" data-type="task" data-index="${task.id}">
                </td> 
                <td>
                    <button class="delete-btn" data-index="${task.id}">Delete</button>
                    <button class="details-btn" data-index="${task.id}">View Details</button>
                </td>
            `;
            row.classList.add("completed-row");
            row.querySelector(".complete-input").checked = true;
        }
        else
        {
            row.innerHTML = `
                <td>${task.name}</td> 
                <td>${formatDate(task.date)}</td> 
                <td>${formatDate(task.deadline)}</td> 
                <td>
                    <input type="checkbox" class="complete-input" data-type="task" data-index="${task.id}">
                </td> 
                <td>
                    <button class="delete-btn" data-index="${task.id}">Delete</button>
                    <button class="edit-btn" data-type="task" data-index="${task.id}">Edit</button>
                    <button class="details-btn" data-index="${task.id}">View Details</button>
                    <button class="add-sub-btn" data-index="${task.id}">Add SubTask</button>
                </td>
            `;
        }

        const detailsBtn = row.querySelector(".details-btn");
        detailsBtn.textContent = tasksWithSubTasksShown.includes(task.id) ? "Hide Details" : "View Details";

        tasksBody.appendChild(row);
        return row;
    }

    function deleteAllTable()
    {
        tasksBody.innerHTML = '';
    }

    function addRowsBelowTask(row, task)
    {
        let lastInserted = row;
        task.subTasks.forEach((sub) => {
            const newRow = document.createElement('tr');

            newRow.classList.add("sub-row")
            if (sub.completed) 
            {
                newRow.innerHTML = `
                    <td>${sub.name}</td> 
                    <td>${formatDate(sub.date)}</td> 
                    <td>${formatDate(sub.deadline)}</td> 
                    <td>
                        <input type="checkbox" class="sub complete-input" data-type="subTask" data-index="${sub.id}" data-parent="${task.id}">
                    </td> 
                    <td>
                        <button class="sub delete-btn" data-type="subTask" data-index="${sub.id}" data-parent="${task.id}">Delete</button>
                    </td>
                `;
                newRow.classList.add("completed-row");
                newRow.querySelector(".complete-input").checked = true;
            }
            else
            {
                newRow.innerHTML = `
                    <td>${sub.name}</td> 
                    <td>${formatDate(sub.date)}</td> 
                    <td>${formatDate(sub.deadline)}</td> 
                    <td>
                        <input type="checkbox" class="sub complete-input" data-type="subTask" data-index="${sub.id}" data-parent="${task.id}">
                    </td> 
                    <td>
                        <button class="sub delete-btn" data-type="subTask" data-index="${sub.id}" data-parent="${task.id}">Delete</button>
                        <button class="sub edit-btn" data-type="subTask" data-index="${sub.id}" data-parent="${task.id}">Edit</button>
                    </td>
                `;
            }
            lastInserted.insertAdjacentElement("afterend", newRow);
            lastInserted = newRow;
        })
    }

    tasksBody.addEventListener("click", (e) => {
        const btn = e.target;
    
        if(btn.classList.contains("sub"))
        {
            const subTaskId = Number(btn.dataset.index);
            const taskId = Number(btn.dataset.parent);
            const task = manager.tasks.find((t) => t.id == taskId);
            if(btn.classList.contains("delete-btn"))
            {
                task.removeSubTask(subTaskId);
                manager.saveToStorage();
                btn.closest("tr").remove();
            }
            else if(btn.classList.contains("edit-btn"))
            {

                const task = manager.tasks.find((task) => task.id === taskId);

                const subTask = task.subTasks.find((sub) => sub.id === subTaskId);
                console.log("Editing subtask", { taskId, subTaskId: btn.dataset.index });

                taskIdBeingEdited = subTaskId;
                parentTaskOfEdited = taskId;
                
                document.getElementById("edit-name-input").value = subTask.name;
                document.getElementById("edit-description-input").value = subTask.description;
                document.getElementById("edit-deadline-input").value = toLocalDatetimeString(new Date(subTask.deadline));


                const bounds = btn.getBoundingClientRect();
                editModal.style.left = `${bounds.left + window.scrollX - 95}px`;
                editModal.style.top = `${bounds.top + window.scrollY - 375}px`;
                editModal.classList.add("show");
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
        }
        else
        {
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

                editForm.querySelector("#edit-name-input").value = taskToEdit.name;
                editForm.querySelector("#edit-description-input").value = taskToEdit.description;
                editForm.querySelector("#edit-deadline-input").value = toLocalDatetimeString(new Date(taskToEdit.deadline));
                


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
                    if (!tasksWithSubTasksShown.includes(taskId)) 
                    {
                        tasksWithSubTasksShown.push(taskId);
                    }
                    applyAllFilters(); 
                }
                else
                {
                    const index = tasksWithSubTasksShown.indexOf(taskId);
                    if (index !== -1) tasksWithSubTasksShown.splice(index, 1);
                    applyAllFilters();
                }
            }
            else if(btn.classList.contains("add-sub-btn"))
            {
                taskBeingAddedId = taskId;
                console.log("Dadasd");

                addSubForm.querySelector("#subtask-name").value = null;
                addSubForm.querySelector("#subtask-description").value = null;
                addSubForm.querySelector("#subtask-deadline").value = null;


                const bounds = btn.getBoundingClientRect();

                addSubTaskModal.style.left = `${bounds.left + window.scrollX - 80}px`;
                addSubTaskModal.style.top = `${bounds.top + window.scrollY - 340}px`;
                addSubTaskModal.classList.add("show");
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
        }
    })

    //Making sure you wanna complete that task or subTask.
    youSuremodal.addEventListener("click", (e) => {
        const btn = e.target;
        if(btn.classList.contains("yesBtn"))
        {
            const type = lastClickedCheckbox.dataset.type;

            lastClickedCheckbox.closest("tr").classList.add("completed-row")
            lastClickedCheckbox.checked = true;

            if (type === "task") 
            {
                const taskId = Number(lastClickedCheckbox.dataset.index);
                manager.markComplete(taskId);
                const index = tasksWithSubTasksShown.indexOf(taskId);
                if (index !== -1) tasksWithSubTasksShown.splice(index, 1);
                applyAllFilters();
            } 
            else 
            {
                const taskId = Number(lastClickedCheckbox.dataset.parent);
                const subId = Number(lastClickedCheckbox.dataset.index);
                const task = manager.tasks.find((t) => t.id === taskId);

                const allComplete = task.markSubAsComplete(subId);

                if(allComplete)
                {
                    task.completed = true;
                    manager.saveToStorage();
                    const index = tasksWithSubTasksShown.indexOf(taskId);
                    if (index !== -1) tasksWithSubTasksShown.splice(index, 1);
                    applyAllFilters();
                }
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

    //When you cancel an edit.
    editModal.addEventListener("click", (e) => {
        const btn = e.target;
        if(btn.classList.contains("cancel-btn"))
        {
            taskIdBeingEdited = null;
            parentTaskOfEdited = null;
            editModal.classList.remove("show");
        }
    })

    //When you confirm an edit, whether of a task of a subTask.
    editModal.addEventListener("submit", (e) => {
        e.preventDefault();
        const btn = e.submitter;
        console.log("here");    
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
            //If deadline is before today, invalid.
            if(taskDeadline < new Date())
            {
                console.error("Cannot go back in time.");
                return;
            }
            if(parentTaskOfEdited === null)
            {
                manager.editTask(taskIdBeingEdited,taskName,taskDesc,taskDeadline);
                applyAllFilters();
                editModal.classList.remove("show");
                taskIdBeingEdited = null;
                parentTaskOfEdited = null;
                return;
            }
            const currTask = manager.tasks.find((t) => t.id === parentTaskOfEdited);
            console.log(parentTaskOfEdited)

            if(taskDeadline > currTask.deadline)
            {
                console.error("Cannot set deadline after parent tasks'");
                return;
            }
            
            const taskId = parentTaskOfEdited;
            const subTaskId = taskIdBeingEdited;
            const task = manager.tasks.find((t) => t.id === taskId);
            task.editSubTask(subTaskId,taskName,taskDesc,taskDeadline);
            manager.saveToStorage();
            applyAllFilters();
            editModal.classList.remove("show");
            taskIdBeingEdited = null;
            parentTaskOfEdited = null;
        }
    })

    //When you cancel adding a subTask.
    addSubTaskModal.addEventListener("click",(e) => {
        const btn = e.target;
        if(btn.classList.contains("cancel-btn"))
        {
            console.log("here");
            taskBeingAddedId = null;
            addSubTaskModal.classList.remove("show");
        }
    })

    //When you add a subTask.
    addSubTaskModal.addEventListener("submit", (e) => {
        e.preventDefault();
        const btn = e.submitter;
        console.log("Dadasd");
        const subName = addSubForm.querySelector("#subtask-name").value.trim();
        const subDesc = addSubForm.querySelector("#subtask-description").value.trim();
        const subDeadline = new Date(addSubForm.querySelector("#subtask-deadline").value.trim());
        if(!subName || !subDesc || !subDeadline)
        {
            console.error("Invalid inputs. Please try again.");
            return;
        }
        
        if(btn.classList.contains("confirm-btn"))
        {
            const currTask = manager.tasks.find((t) => t.id == taskBeingAddedId)
            if(subDeadline < new Date())
            {
                console.error("Cannot go back in time.");
                return;
            }
            if(subDeadline > currTask.deadline)
            {
                console.error("Cannot set deadline to be after the task's deadline.");
                return;
            }
            currTask.addSubTask(new subTask(subName,subDesc,subDeadline));
            manager.saveToStorage();
            applyAllFilters();
            addSubTaskModal.classList.remove("show");
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
            if(addSubTaskModal.classList.contains("show") && !addSubTaskModal.contains(e.target)
            && !e.target.classList.contains("add-sub-btn"))
            {
                addSubTaskModal.classList.remove("show");
            }
        },1)
    })


    const sortSelect = document.getElementById("sort-select");
    sortSelect.addEventListener("change",applyAllFilters);
    const whatToShow = document.getElementById("filter-select");
    whatToShow.addEventListener("change", applyAllFilters);

    function applyAllFilters()
    {
        let tasksToShow = [...manager.tasks];

        if (whatToShow.value === "complete") 
        {
            tasksToShow = tasksToShow.filter(task => task.completed);
        } 
        else if (whatToShow.value === "incomplete") 
        {
            tasksToShow = tasksToShow.filter(task => !task.completed);
        }

        if (sortSelect.value === "name") 
        {
            tasksToShow.sort((a, b) => a.name.localeCompare(b.name));
        } 
        else if (sortSelect.value === "dateAdded") 
        {
            tasksToShow.sort((a, b) => new Date(a.date) - new Date(b.date));
        } 
        else if (sortSelect.value === "deadline") 
        {
            tasksToShow.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        }

        deleteAllTable();
        tasksToShow.forEach(task => {
            const row = addTaskToTable(task);
            if(tasksWithSubTasksShown.find((Id) => Id == task.id))
                addRowsBelowTask(row,task);
        });
    }
})