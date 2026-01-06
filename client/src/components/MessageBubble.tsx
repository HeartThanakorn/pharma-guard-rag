/**
 * MessageBubble Component
 * Displays a single chat message with appropriate styling
 * User messages: right-aligned, blue
 * Assistant messages: left-aligned, gray with source citations
 */

import type { Message } from '../types';
import SourceCitation from './SourceCitation';

interface MessageBubbleProps {
  message: Message;
  isUser: boolean;
}

const MessageBubble = ({ message, isUser }: MessageBubbleProps) => {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-gray-100 text-gray-800 rounded-bl-none'
        }`}
      >
        {/* Message content */}
        <p className="whitespace-pre-wrap break-words">{message.content}</p>

        {/* Source citations for assistant messages */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="flex flex-wrap">
              {message.sources.map((source, index) => (
                <SourceCitation key={index} source={source} />
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <p
          className={`text-xs mt-2 ${
            isUser ? 'text-blue-200' : 'text-gray-400'
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
};

export default MessageBubble;
