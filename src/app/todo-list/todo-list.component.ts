import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { KeyValuePipe, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { MatCardModule } from "@angular/material/card"; 
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { NgIf } from '@angular/common';

// interface TodoItem {
//   id: number;
//   task: string;
//   completed: boolean; // New field for the task creation date
// }
interface TodoItem {
  id: number;
  task: string;
  completed: boolean;
  createdAt: string; // Add this field for storing the creation date
}


@Component({
  selector: 'app-todo-list',
  standalone: true,
  imports: [NgFor, MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatCheckboxModule,
    MatListModule,
    MatFormFieldModule,FormsModule,MatCardModule,KeyValuePipe,NgIf
  ],
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.scss'] // Corrected this line
})
export class TodoListComponent implements OnInit {
  todoList: TodoItem[] = [];
  newTask: string = '';
  loginUsername = '';
  loginPassword = '';
  signupUsername = '';
  signupPassword = '';
  @ViewChild('todoText') todoInputRef!: ElementRef<HTMLInputElement>; // Removed = null!

  constructor(private authService: AuthService, private http: HttpClient) {}

  isLoggedIn() {
      return this.authService.isLoggedIn();
  }

  login() {
      this.authService.login(this.loginUsername, this.loginPassword);
  }

  signup() {
      this.authService.signup(this.signupUsername, this.signupPassword)
          .subscribe(() => {
              this.login(); // Automatically log in after signup
          });
  }


  ngOnInit(): void {
    const storedTodoList = localStorage.getItem('todoList');
    if (storedTodoList) {
      this.todoList = JSON.parse(storedTodoList);
    }
  }

  addTask(text: string): void {
    if (text.trim() !== '') {
        const token = localStorage.getItem('token');
        
        // Check if the token is not null before proceeding
        if (token) {
            const userId = this.authService.getUserIdFromToken(token);

            const newTodoItem = {
                task: text.trim(),
                completed: false,
                date: new Date(), // Use date for sorting/grouping
                userId: userId // Associate with the user
            };

            // Send a POST request to the backend to add the new todo
            this.http.post('http://localhost:5000/todos', newTodoItem, {
                headers: { Authorization: token } // Pass the token as 'Bearer <token>'
            }).subscribe(
                (response) => {
                    console.log('Todo added:', response);
                    this.fetchTodos(); // Refresh the todo list after adding
                    this.todoInputRef.nativeElement.value = ''; // Clear input field
                },
                (error) => {
                    console.error('Error adding todo:', error);
                    if (error.status === 401) {
                        console.error('Unauthorized. Please log in again.');
                    } else {
                        console.error('An unexpected error occurred.');
                    }
                }
            );
        } else {
            console.error('No token found. User may not be logged in.');
        }
    } else {
        console.error('Task cannot be empty.');
    }
}

fetchTodos(): void {
  const token = localStorage.getItem('token');
  
  // Check if the token is not null before proceeding
  if (token) {
      this.http.get<TodoItem[]>('http://localhost:5000/todos', {
          headers: { Authorization: token } // Pass the token as 'Bearer <token>'
      }).subscribe(
          (todos) => {
              this.todoList = todos; // Set the todo list with fetched data
              console.log(this.todoList);
            
              console.log('Fetched todos:', todos);
          },
          (error) => {
              console.error('Error fetching todos:', error);
              if (error.status === 401) {
                  console.error('Unauthorized. Please log in again.');
              } else {
                  console.error('An unexpected error occurred.');
              }
          }
      );
  } else {
      console.error('No token found. User may not be logged in.');
  }
}



  getGroupedTasks(): { [key: string]: TodoItem[] } {
    return this.todoList.reduce((groups: { [key: string]: TodoItem[] }, task: TodoItem) => {
      // Format date to include both day and date
    
      const date = new Date(task.id).toLocaleDateString('en-US', {
        weekday: 'long',   // Full day name (e.g., "Monday")
        year: 'numeric',
        month: 'long',     // Full month name (e.g., "October")
        day: 'numeric'     // Numeric day (e.g., "10")
      });
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(task);
      
      return groups;
    }, {});
  }
  
  
  
  // keyDescOrder = (a: any, b: any): number => {
  //   return a.key > b.key ? -1 : (a.key === b.key ? 0 : 1);
  // };

  
  deleteTask(id: number): void {
    this.todoList = this.todoList.filter(item => item.id !== id);
    this.saveTodoList();
  }

  toggleCompleted(id: number): void {
    const todoItem = this.todoList.find(item => item.id === id);
    if (todoItem) {
      todoItem.completed = !todoItem.completed;
      this.saveTodoList();
    }
  }

  saveTodoList(): void {
    localStorage.setItem('todoList', JSON.stringify(this.todoList));
  }
}
