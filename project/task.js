export class subTask {
    static _lastSubId = 0;
    constructor(name, description, deadline, completed = false, date = new Date(), id= null) 
    {
        this.id = id ?? ++subTask._lastSubId;
        this.name = name;
        this.description = description;
        this.completed = completed;
        this.deadline = deadline;
        this.date = date;
    }

    markComplete() 
    {
        this.completed = true;
    }

    toObject() 
    {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            completed: this.completed,
            deadline: this.deadline,
            date: this.date
        };
    }
}

export class Task 
{
    static _lastId = 0;
    constructor(name, description, deadline, subTasks = [], completed = false, date = new Date(), id = null) 
    {
        this.id = id ?? ++Task._lastId;
        this.subTasks = subTasks;
        this.name = name;
        this.description = description;
        this.completed = completed;
        this.deadline = deadline;
        this.date = date;
    }

    addSubTask(sub) 
    {
        this.subTasks.push(sub);
    }

    removeSubTask(id) 
    {
        this.subTasks = this.subTasks.filter(sub => sub.id !== id);
    }

    markSubAsComplete(subId)
    {
        const sub = this.subTasks.find((s) => s.id == subId);
        if (sub) 
        {
            sub.completed = true;
        }

        const allCompleted = this.subTasks.every(s => s.completed);
        if(allCompleted)
            return true;
        return false;
    }

    editSubTask(subId, name, description, deadline) {
        const sub = this.subTasks.find((s) => (s.id === subId));
        sub.name = name;
        sub.description = description;
        sub.deadline = deadline;
    }

    toObject() 
    {
        return {
            id: this.id,
            subTasks: this.subTasks,
            name: this.name,
            description: this.description,
            completed: this.completed,
            deadline: this.deadline,
            date: this.date
        };
    }
}
