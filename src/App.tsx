import React, { useEffect, useMemo, useRef, useState } from 'react';
import cn from 'classnames';

import { UserWarning } from './UserWarning';
import { USER_ID, getTodos, createTodo, deleteTodo } from './api/todos';

import { Todo } from './types/Todo';
import { FilterType } from './types/FilterType';
import { ErrorMessages } from './types/ErrorMessages';

import { TodoList } from './components/TodoList';
import { TodoFilter } from './components/TodoFilter';
import { ErrorNotification } from './components/ErrorNotification';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<keyof typeof ErrorMessages>('Empty');
  const [filter, setFilter] = useState<FilterType>(FilterType.All);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [isAllCompleted, setIsAllCompleted] = useState(
    todos.every(todo => todo.completed === true),
  );
  const [isLoading, setIsLoading] = useState(false);

  const filteredTodos = useMemo(() => {
    return todos.filter(todo => {
      switch (filter) {
        case FilterType.Active:
          return !todo.completed;
        case FilterType.Completed:
          return todo.completed;
        default:
          return true;
      }
    });
  }, [todos, filter]);

  const uncompletedTodosCount = useMemo(
    () => todos.filter(todo => !todo.completed).length,
    [todos],
  );

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  });

  useEffect(() => {
    getTodos()
      .then(setTodos)
      .catch(() => setError('Load'));
  }, []);

  useEffect(() => {
    setIsAllCompleted(todos.every(todo => todo.completed));
  }, [todos]);

  useEffect(() => {
    if (error !== 'Empty') {
      const timer = setTimeout(() => {
        setError('Empty');
      }, 3000);

      return () => clearTimeout(timer);
    }

    return;
  }, [error]);

  if (!USER_ID) {
    return <UserWarning />;
  }

  const handleFilter = (newFilter: FilterType) => setFilter(newFilter);

  const handleAllTodoCompleted = () => {
    setTodos(prevTodos =>
      prevTodos.map(todo => ({ ...todo, completed: !isAllCompleted })),
    );
  };

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    setError('Empty');
  };

  const handleAddTodo = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setError('EmptyTitle');

      return;
    }

    setTempTodo({
      userId: USER_ID,
      id: 0,
      title: trimmedQuery,
      completed: false,
    });

    createTodo({ userId: USER_ID, title: trimmedQuery, completed: false })
      .then(newTodo => {
        setTodos(prevTodos => [...prevTodos, newTodo]);
        setTempTodo(null);
        setQuery('');
      })
      .catch(() => {
        setError('Add');
        setTempTodo(null);
      });
  };

  const handleDeleteTodo = (id: number) => {
    setIsLoading(true);

    return deleteTodo(id)
      .then(() =>
        setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id)),
      )
      .catch(err => {
        setError('Delete');
        throw err;
      })
      .finally(() => setIsLoading(false));
  };

  const handleClearCompletedTodos = () => {
    const completedTodoIds = todos
      .filter(todo => todo.completed)
      .map(todo => todo.id);

    Promise.all(completedTodoIds.map(handleDeleteTodo)).then(() =>
      setTodos(prevTodos =>
        prevTodos.filter(todo => !completedTodoIds.includes(todo.id)),
      ),
    );
  };

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          {todos.length > 0 && (
            <button
              type="button"
              className={cn('todoapp__toggle-all', {
                active: isAllCompleted,
              })}
              data-cy="ToggleAllButton"
              onClick={handleAllTodoCompleted}
            />
          )}

          <form>
            <input
              ref={inputRef}
              data-cy="NewTodoField"
              type="text"
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              disabled={!!tempTodo}
              value={query}
              onChange={handleQueryChange}
              onKeyDown={handleAddTodo}
            />
          </form>
        </header>

        {todos && (
          <TodoList
            todos={[...filteredTodos, ...(tempTodo ? [tempTodo] : [])]}
            setTodos={setTodos}
            handleDeleteTodo={handleDeleteTodo}
            isLoading={isLoading}
          />
        )}

        {todos.length > 0 && (
          <footer className="todoapp__footer" data-cy="Footer">
            <span className="todo-count" data-cy="TodosCounter">
              {uncompletedTodosCount} items left
            </span>

            <TodoFilter filter={filter} handleFilter={handleFilter} />

            <button
              type="button"
              className="todoapp__clear-completed"
              data-cy="ClearCompletedButton"
              disabled={todos.length === uncompletedTodosCount}
              onClick={handleClearCompletedTodos}
            >
              Clear completed
            </button>
          </footer>
        )}
      </div>

      <ErrorNotification error={error} setError={setError} />
    </div>
  );
};
