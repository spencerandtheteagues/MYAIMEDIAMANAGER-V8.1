import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Bold, 
  Italic, 
  Link as LinkIcon, 
  Image, 
  Video,
  Hash,
  AtSign,
  Smile,
  Paperclip
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ContentEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  showToolbar?: boolean;
  showCharacterCount?: boolean;
}

const emojis = ["😀", "😂", "❤️", "👍", "🔥", "💯", "✨", "🎉", "☕", "🥐", "🌟", "💪"];

export default function ContentEditor({ 
  value, 
  onChange, 
  placeholder = "What's on your mind?",
  maxLength = 2200,
  showToolbar = true,
  showCharacterCount = true
}: ContentEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const insertText = (textToInsert: string, cursorOffset: number = 0) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + textToInsert + value.substring(end);
    
    onChange(newValue);
    
    // Set cursor position after insert
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + textToInsert.length + cursorOffset, start + textToInsert.length + cursorOffset);
    }, 0);
  };

  const wrapSelectedText = (before: string, after: string = before) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    if (selectedText) {
      const newText = before + selectedText + after;
      const newValue = value.substring(0, start) + newText + value.substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
      }, 0);
    } else {
      insertText(before + after, -after.length);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    insertText(emoji);
    setShowEmojiPicker(false);
  };

  const characterCount = value.length;
  const isNearLimit = characterCount > maxLength * 0.8;
  const isOverLimit = characterCount > maxLength;

  return (
    <div className="space-y-2">
      {showToolbar && (
        <div className="flex items-center space-x-2 p-3 bg-muted border border-border rounded-t-lg">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => wrapSelectedText("**")}
            className="h-8 w-8 p-0"
          >
            <Bold className="w-4 h-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => wrapSelectedText("*")}
            className="h-8 w-8 p-0"
          >
            <Italic className="w-4 h-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => wrapSelectedText("[", "](https://)")}
            className="h-8 w-8 p-0"
          >
            <LinkIcon className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-border" />
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertText("#")}
            className="h-8 w-8 p-0"
          >
            <Hash className="w-4 h-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertText("@")}
            className="h-8 w-8 p-0"
          >
            <AtSign className="w-4 h-4" />
          </Button>
          
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Smile className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2">
              <div className="grid grid-cols-6 gap-1">
                {emojis.map((emoji) => (
                  <Button
                    key={emoji}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEmojiClick(emoji)}
                    className="h-8 w-8 p-0 text-lg"
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          
          <div className="w-px h-6 bg-border" />
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Image className="w-4 h-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Video className="w-4 h-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`resize-none min-h-[120px] ${showToolbar ? 'rounded-t-none' : ''} ${
            isOverLimit ? 'border-destructive focus-visible:ring-destructive' : ''
          }`}
        />
        
        {showCharacterCount && (
          <div className={`absolute bottom-2 right-2 text-xs ${
            isOverLimit ? 'text-destructive' : 
            isNearLimit ? 'text-amber-600' : 
            'text-muted-foreground'
          }`}>
            {characterCount}/{maxLength}
          </div>
        )}
      </div>
    </div>
  );
}
