import React from 'react';
import cn from 'classnames';

type Props = {
  id: number;
  isLoading: boolean;
};

export const TodoLoader: React.FC<Props> = ({ id, isLoading }) => (
  <div
    data-cy="TodoLoader"
    className={cn('modal overlay', {
      'is-active': isLoading || id === 0,
    })}
  >
    <div className="modal-background has-background-white-ter" />
    <div className="loader" />
  </div>
);
