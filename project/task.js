export class subTask {
    static _lastSubId = 0;
    constructor(name, description, deadline, completed = false, date = new Date()) 
    {
        this.id = ++subTask._lastSubId;
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

    toObject() 
    {
        return {
            id: this.id,
            subTasks: this.subTasks,
            name: this.name,
            description: this.description,
            deadline: this.deadline,
            date: this.date
        };
    }
}
