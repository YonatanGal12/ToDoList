
import { formatDate , toLocalDatetimeString} from "./helper.js";
import { subTask , Task } from "./task.js";
import { TasksManager } from './manager.js';




document.addEventListener("DOMContentLoaded", () => {

    //Represent the forms
    const form = document.getElementById("list-form");
    const editForm = document.getElementById("edit-form");
    const addSubForm = document.getElementById("subtask-form");

    //Represents that table's body
    const tasksBody = document.getElementById("tasks-body");

    //Represent the modals
    const youSuremodal = document.getElementById("youSure");
    const editModal = document.getElementById("editModal");
    const addSubTaskModal = document.getElementById("subtask-modal");

    //Elements I need for stuff
    let lastClickedCheckbox = null; //(Follow which task to complete)
    let taskIdBeingEdited = null; //(Follow which task to edit)
    let parentTaskOfEdited = null; //(When I edit a subtask)
    let taskBeingAddedId = null; //(Follow which task to add a subtask to)

    //When I filter, it knows which subtasks to show
    let tasksWithSubTasksShown = [];


    const manager = new TasksManager();
    //Load on refresh
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
            alert("Invalid inputs. Please try again.");
            return;
        }

        //If deadline is before today, it's invalid.
        if(taskDeadline < new Date())
        {
            alert("Cannot go back in time.");
            return;
        }
        const task = new Task(taskName,taskDesc,taskDeadline);
        manager.add(task);
        applyAllFilters();
        form.reset();
    })

    function addTaskToTable(task)
    {
        const row = document.createElement("tr");

        if (task.completed) 
        {
            row.innerHTML = `
                <td>${task.name}</td> 
                <td>${task.description}</td> 
                <td>${formatDate(task.date)}</td> 
                <td>${formatDate(task.deadline)}</td> 
                <td>
                    <input id="task-${task.id}" type="checkbox" class="complete-input" data-type="task" data-index="${task.id}">
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
                <td>${task.description}</td> 
                <td>${formatDate(task.date)}</td> 
                <td>${formatDate(task.deadline)}</td> 
                <td>
                    <input id="task-${task.id}" type="checkbox" class="complete-input" data-type="task" data-index="${task.id}">
                </td> 
                <td>
                    <button class="delete-btn" data-index="${task.id}">Delete</button>
                    <button class="edit-btn" data-type="task" data-index="${task.id}">Edit</button>
                    <button class="details-btn" data-index="${task.id}">View Details</button>
                    <button class="add-sub-btn" data-index="${task.id}">+</button>
                </td>
            `;

            const deadlineDate = new Date(task.deadline);

            if (deadlineDate < new Date()) 
            {
                row.classList.add("time-passed");
            }
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
        const now = new Date();

        task.subTasks.forEach((sub) => {
            const newRow = document.createElement('tr');
            newRow.classList.add("sub-row");

            const deadlineDate = new Date(sub.deadline);
            const isOverdue = deadlineDate < now;

            if (isOverdue && !sub.completed) {
                newRow.classList.add("time-passed");
            }

            if (sub.completed) 
            {
                newRow.innerHTML = `
                    <td>${sub.name}</td> 
                    <td>${sub.description}</td> 
                    <td>${formatDate(sub.date)}</td> 
                    <td>${formatDate(sub.deadline)}</td> 
                    <td>
                        <input id="sub-${task.id}-${sub.id}" type="checkbox" class="sub complete-input" data-type="subTask" data-index="${sub.id}" data-parent="${task.id}">
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
                    <td>${sub.description}</td> 
                    <td>${formatDate(sub.date)}</td> 
                    <td>${formatDate(sub.deadline)}</td> 
                    <td>
                        <input id="sub-${task.id}-${sub.id}" type="checkbox" class="sub complete-input" data-type="subTask" data-index="${sub.id}" data-parent="${task.id}">
                    </td> 
                    <td>
                        <button class="sub delete-btn" data-type="subTask" data-index="${sub.id}" data-parent="${task.id}">Delete</button>
                        <button class="sub edit-btn" data-type="subTask" data-index="${sub.id}" data-parent="${task.id}">Edit</button>
                    </td>
                `;
            }
            //afterbegin and beforeend insert newRow as a child inside lastInsert
            //beforebegin and afterend insert newRow as a sibling of lastInsert
            lastInserted.insertAdjacentElement("afterend", newRow);
            lastInserted = newRow;
        });
    }

    tasksBody.addEventListener("click", (e) => {
        const btn = e.target;
    
        if(btn.classList.contains("sub"))
        {
            const subTaskId = Number(btn.dataset.index);
            const taskId = Number(btn.dataset.parent);
            const task = manager.tasks.find(t => t.id === taskId);
            if(btn.classList.contains("delete-btn"))
            {
                task.removeSubTask(subTaskId);
                manager.saveToStorage();
                btn.closest("tr").remove();
                applyAllFilters();
            }
            else if(btn.classList.contains("edit-btn"))
            {

                const task = manager.tasks.find(task => task.id === taskId);
                const subTask = task.subTasks.find(sub => sub.id === subTaskId);

                taskIdBeingEdited = subTaskId;
                parentTaskOfEdited = taskId;
                
                document.getElementById("edit-name-input").value = subTask.name;
                document.getElementById("edit-description-input").value = subTask.description;
                document.getElementById("edit-deadline-input").value = toLocalDatetimeString(new Date(subTask.deadline));

                //Relative to the viewport so I add scrollX/Y
                const bounds = btn.getBoundingClientRect();
                editModal.style.left = `${bounds.left + window.scrollX - 95}px`;
                editModal.style.top = `${bounds.top + window.scrollY - 375}px`;
                editModal.classList.add("show");
            }
            else if(btn.classList.contains("complete-input"))
            {
                btn.checked = false;
                // If someone pressed on the same checkbox without choosing
                if(lastClickedCheckbox && youSuremodal.classList.contains("show") && lastClickedCheckbox === btn)
                {
                    youSuremodal.classList.remove("show");
                    btn.checked = false;
                    lastClickedCheckbox = null;
                    return;
                }
                // If someone pressed on another checkbox before choosing yes or no
                if(lastClickedCheckbox && lastClickedCheckbox !== btn)
                {
                    lastClickedCheckbox.checked = false;
                }

                lastClickedCheckbox = btn;

                const bounds = btn.getBoundingClientRect();

                youSuremodal.style.left = `${bounds.left + window.scrollX - 158}px`;
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
                applyAllFilters();
            }
            else if(btn.classList.contains("edit-btn"))
            {

                const taskToEdit = manager.tasks.find(task => task.id === taskId);
                if (!taskToEdit) 
                    return;

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
                    const taskToShow = manager.tasks.find(task => task.id === taskId)
                    if (!taskToShow) 
                        return;
                    if (!tasksWithSubTasksShown.includes(taskId)) 
                    {
                        tasksWithSubTasksShown.push(taskId);
                    }
                    applyAllFilters(); 
                }
                else
                {
                    const index = tasksWithSubTasksShown.indexOf(taskId);
                    if (index !== -1) 
                        tasksWithSubTasksShown.splice(index, 1);
                    applyAllFilters();
                }
            }
            else if(btn.classList.contains("add-sub-btn"))
            {
                taskBeingAddedId = taskId;

                addSubForm.querySelector("#subtask-name").value = null;
                addSubForm.querySelector("#subtask-description").value = null;
                addSubForm.querySelector("#subtask-deadline").value = null;


                const bounds = btn.getBoundingClientRect();

                addSubTaskModal.style.left = `${bounds.left + window.scrollX - 108}px`;
                addSubTaskModal.style.top = `${bounds.top + window.scrollY - 340}px`;
                addSubTaskModal.classList.add("show");
            }
            else if(btn.classList.contains("complete-input"))
            {
                btn.checked = false;

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

            //Nearest tr ancestor to lastClicked
            lastClickedCheckbox.closest("tr").classList.add("completed-row")
            lastClickedCheckbox.checked = true;

            if (type === "task") 
            {
                const taskId = Number(lastClickedCheckbox.dataset.index);

                //markComplete saves to storage
                manager.markComplete(taskId);
                const index = tasksWithSubTasksShown.indexOf(taskId);
                if (index !== -1)
                {
                    tasksWithSubTasksShown.splice(index, 1);  
                } 
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
                    const index = tasksWithSubTasksShown.indexOf(taskId);
                    if (index !== -1) 
                    {
                        tasksWithSubTasksShown.splice(index, 1);
                    }
                }
                manager.saveToStorage();
            }

            applyAllFilters();
            lastClickedCheckbox = null;
            youSuremodal.classList.remove("show");
        }
        else if(btn.classList.contains("noBtn"))
        {
            youSuremodal.classList.remove("show");
            lastClickedCheckbox.checked = false;
            lastClickedCheckbox = null;
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

        if (!editModal.classList.contains("show")) 
        {
            e.preventDefault();
            return;
        }

        e.preventDefault();
        const btn = e.submitter;

        if(btn.classList.contains("confirm-btn"))
        {
            const taskName = editForm.querySelector("#edit-name-input").value.trim();
            const taskDesc = editForm.querySelector("#edit-description-input").value.trim();
            const taskDeadline = new Date(editForm.querySelector("#edit-deadline-input").value.trim());

            if(!taskName || !taskDesc || !taskDeadline)
            {
                alert("Invalid inputs. Please try again.");
                return;
            }

            //If deadline is before today, invalid.
            if(taskDeadline < new Date())
            {
                alert("Cannot go back in time.");
                return;
            }

            //If you edit a task and not a subTask
            if(parentTaskOfEdited === null)
            {
                const task = manager.tasks.find(t => t.id === taskIdBeingEdited)
                const hasInvalidSubDeadline = task.subTasks.some(sub => new Date(sub.deadline) > taskDeadline);
                if(hasInvalidSubDeadline)
                {
                    alert("Cannot have a task's deadline after a subtask's.");
                    return;
                }
                
                manager.editTask(taskIdBeingEdited,taskName,taskDesc,taskDeadline);

                editModal.classList.remove("show");
                taskIdBeingEdited = null;
                parentTaskOfEdited = null;

                applyAllFilters();
                return;
            }

            const currTask = manager.tasks.find(t => t.id === parentTaskOfEdited);
            console.log(parentTaskOfEdited)

            if(taskDeadline > currTask.deadline)
            {
                alert("Cannot set deadline after parent tasks'");
                return;
            }
            
            const taskId = parentTaskOfEdited;
            const subTaskId = taskIdBeingEdited;
            const task = manager.tasks.find((t) => t.id === taskId);

            task.editSubTask(subTaskId,taskName,taskDesc,taskDeadline);

            editModal.classList.remove("show");
            taskIdBeingEdited = null;
            parentTaskOfEdited = null;

            manager.saveToStorage();
            applyAllFilters();
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

        if (!addSubTaskModal.classList.contains("show")) 
        {
            e.preventDefault();
            return;
        }

        e.preventDefault();
        const btn = e.submitter;

        const subName = addSubForm.querySelector("#subtask-name").value.trim();
        const subDesc = addSubForm.querySelector("#subtask-description").value.trim();
        const subDeadline = new Date(addSubForm.querySelector("#subtask-deadline").value.trim());

        if(!subName || !subDesc || !subDeadline)
        {
            alert("Invalid inputs. Please try again.");
            return;
        }
        
        if(btn.classList.contains("confirm-btn"))
        {
            const currTask = manager.tasks.find(t => t.id == taskBeingAddedId);

            if(subDeadline < new Date())
            {
                alert("Cannot go back in time.");
                return;
            }

            if(subDeadline > currTask.deadline)
            {
                alert("Cannot set deadline to be after the task's deadline.");
                return;
            }

            currTask.addSubTask(new subTask(subName,subDesc,subDeadline));

            addSubTaskModal.classList.remove("show");

            manager.saveToStorage();
            applyAllFilters();
        }
    })

    //Close a modal when clicking outside of it
    document.addEventListener("click", (e) => {
        //This ensures that nothing closes too early
        setTimeout(() => {

            //The complete modal
            if(youSuremodal.classList.contains("show") 
            && !youSuremodal.contains(e.target)
            && e.target !== lastClickedCheckbox)
            {
                youSuremodal.classList.remove("show");
                lastClickedCheckbox.checked = false;
                lastClickedCheckbox = null;
            }

            //The edit modal
            if(editModal.classList.contains("show") 
            && !editModal.contains(e.target)
            && !e.target.classList.contains("edit-btn"))
            {
                editModal.classList.remove("show");
                taskIdBeingEdited = null; 
                parentTaskOfEdited = null;
            }

            //The add subtask modal
            if(addSubTaskModal.classList.contains("show") 
            && !addSubTaskModal.contains(e.target)
            && !e.target.classList.contains("add-sub-btn"))
            {
                addSubTaskModal.classList.remove("show");
                taskBeingAddedId = null;
            }
        },1)
    })

    //Elements use for filtering tasks
    const sortSelect = document.getElementById("sort-select");
    sortSelect.addEventListener("change",applyAllFilters);
    const whatToShow = document.getElementById("filter-select");
    whatToShow.addEventListener("change", applyAllFilters);

    //Applies filters duh
    function applyAllFilters()
    {
        //Shallow copy instead of deep copy
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
            if(tasksWithSubTasksShown.find(id => id == task.id))
                addRowsBelowTask(row,task);
        });
    }

    //Checks for outdated rows every minute
    function checkEveryMinute() 
    {
        const rows = document.querySelectorAll("#tasks-body tr");

        rows.forEach(row => {
            const cells = row.querySelectorAll("td");

            if (cells.length < 4) 
                return;

            const deadlineText = cells[3].textContent.trim();
            const deadline = new Date(deadlineText);

            if (!isNaN(deadline.getTime())) 
            {
                if (deadline <= new Date()) 
                {
                    row.classList.add("time-passed");
                } else 
                {
                    row.classList.remove("time-passed");
                }
            }
        });

        applyAllFilters(); 
    }

    //Makes it so that it checks the rows every round minute
    function checkEveryRoundMinute() 
    {
        checkEveryMinute(); 

        const now = new Date();

        const delay = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

        //Waits until the start of the next minute to check
        setTimeout(() => {
            checkEveryMinute();  
            setInterval(checkEveryMinute, 60000);
        }, delay);
    }

    checkEveryRoundMinute();
})