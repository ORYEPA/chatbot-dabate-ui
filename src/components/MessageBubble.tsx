import type { ChatMessage } from '../types';

type Props = { msg: ChatMessage | { role: string; message?: string; content?: string } };

export default function MessageBubble({ msg }: Props) {
  const role = (msg as any).role === 'bot' ? 'assistant' : (msg as any).role;
  const text = String((msg as any).message ?? (msg as any).content ?? '');

  const isUser = role === 'user';
  return (
    <div className="bubble-row">
      <div className={`bubble ${isUser ? 'bubble-user' : 'bubble-bot'}`}>
        {text}
      </div>
    </div>
  );
}
