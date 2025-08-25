
import type { ChatMessage } from '../types';
import cn from 'classnames';

interface Props {
  msg: ChatMessage;
}

export default function MessageBubble({ msg }: Props) {
  const isUser = msg.role === 'user';

  return (
    <div className={cn('bubble-row', { 'justify-end': isUser })}>
      <div className={cn('bubble', isUser ? 'bubble-user' : 'bubble-bot')}>
        {msg.message}
      </div>
    </div>
  );
}
